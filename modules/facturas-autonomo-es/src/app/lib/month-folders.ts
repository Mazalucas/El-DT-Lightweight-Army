/** Nombres de carpeta y archivo para export en Google Drive */

export const MONTHS_ES = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
] as const;

export function parseYearMonth(year: number, month: number): { year: number; month: number } {
  if (month < 1 || month > 12) throw new Error('Mes inválido (1–12)');
  return { year, month };
}

export function monthFolderName(year: number, month: number): string {
  const { year: y, month: m } = parseYearMonth(year, month);
  const mm = String(m).padStart(2, '0');
  return `${y} ${mm} - ${MONTHS_ES[m - 1]}`;
}

/** Ej: `2026 06 - Factura 01` (sin extensión; `/` del ejemplo → espacio, válido en macOS) */
export function invoiceFileBaseName(
  year: number,
  month: number,
  invoiceNumber: number,
): string {
  const { year: y, month: m } = parseYearMonth(year, month);
  const mm = String(m).padStart(2, '0');
  const num = String(invoiceNumber).padStart(2, '0');
  return `${y} ${mm} - Factura ${num}`;
}

export function yearMonthFromIsoDate(isoDate: string): { year: number; month: number } {
  const d = new Date(isoDate + 'T12:00:00');
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
