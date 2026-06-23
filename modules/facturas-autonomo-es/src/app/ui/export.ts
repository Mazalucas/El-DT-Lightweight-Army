import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { mountInvoicePreview } from '../templates/render-invoice';
import type { Emitter } from '../models/emitter';
import type { Invoice } from '../models/invoice';

export function printInvoice(invoice: Invoice, emitter: Emitter): void {
  let printArea = document.getElementById('print-area');
  if (!printArea) {
    printArea = document.createElement('div');
    printArea.id = 'print-area';
    printArea.style.display = 'none';
    document.body.appendChild(printArea);
  }
  printArea.style.display = 'block';
  mountInvoicePreview(printArea, invoice, emitter);
  document.body.classList.add('printing-invoice');
  window.print();
  document.body.classList.remove('printing-invoice');
  printArea.style.display = 'none';
}

async function captureInvoiceCanvas(previewEl: HTMLElement): Promise<HTMLCanvasElement> {
  const doc = previewEl.querySelector('.invoice-doc') as HTMLElement | null;
  if (!doc) throw new Error('No hay preview de factura');

  return html2canvas(doc, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  });
}

function downloadBase64File(base64: string, mime: string, filename: string): void {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export function invoiceDownloadBaseName(number: number, year: number): string {
  return `factura-${String(number).padStart(3, '0')}-${year}`;
}

export async function exportInvoicePng(
  previewEl: HTMLElement,
  filename: string,
): Promise<void> {
  const canvas = await captureInvoiceCanvas(previewEl);
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function exportInvoicePdf(
  previewEl: HTMLElement,
  filename: string,
): Promise<void> {
  const base64 = await canvasToPdfBase64(previewEl);
  downloadBase64File(base64, 'application/pdf', filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export async function canvasToPngBase64(previewEl: HTMLElement): Promise<string> {
  const canvas = await captureInvoiceCanvas(previewEl);
  const dataUrl = canvas.toDataURL('image/png');
  return dataUrl.split(',')[1] ?? '';
}

export async function canvasToPdfBase64(previewEl: HTMLElement): Promise<string> {
  const canvas = await captureInvoiceCanvas(previewEl);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  const x = (pageWidth - w) / 2;
  const y = margin;
  pdf.addImage(imgData, 'PNG', x, y, w, h);
  return pdf.output('datauristring').split(',')[1] ?? '';
}

export interface ExportSavePayload {
  year: number;
  month: number;
  invoiceNumber: number;
  files: { format: 'png' | 'pdf'; dataBase64: string }[];
}

export interface ExportSaveResult {
  ok: true;
  monthFolder: string;
  monthFolderPath: string;
  createdMonthFolder: boolean;
  saved: { format: string; fileName: string; fullPath: string }[];
  skipped: { format: string; fileName: string; reason: string }[];
}

export async function fetchExportConfig(): Promise<{ exportBasePath: string; exists: boolean }> {
  const res = await fetch('/api/export-config');
  if (!res.ok) throw new Error('No se pudo leer la configuración de exportación');
  return res.json();
}

export async function listMonthFolders(): Promise<string[]> {
  const res = await fetch('/api/list-month-folders');
  if (!res.ok) return [];
  const data = (await res.json()) as { folders: string[] };
  return data.folders ?? [];
}

export async function saveExportToDrive(payload: ExportSavePayload): Promise<ExportSaveResult> {
  const res = await fetch('/api/export-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      year: payload.year,
      month: payload.month,
      invoiceNumber: payload.invoiceNumber,
      formats: payload.files.map((f) => f.format),
      files: payload.files,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? 'Error al guardar en Google Drive');
  }
  return data as ExportSaveResult;
}
