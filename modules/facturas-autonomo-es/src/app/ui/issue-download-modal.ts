import { formatInvoiceNumber } from '../models/invoice';

export interface IssueDownloadModalOptions {
  invoiceNumber: number;
  invoiceYear: number;
  onDownloadPng: () => void | Promise<void>;
  onDownloadPdf: () => void | Promise<void>;
}

export function showIssueDownloadModal(options: IssueDownloadModalOptions): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const label = formatInvoiceNumber(options.invoiceNumber, options.invoiceYear);

  overlay.innerHTML = `
    <div class="modal">
      <h2>Factura emitida</h2>
      <p>La factura <strong>${label}</strong> quedó registrada. ¿Querés descargarla ahora?</p>
      <div class="btn-group">
        <button type="button" id="issue-dl-png" class="btn">Descargar PNG</button>
        <button type="button" id="issue-dl-pdf" class="btn btn-secondary">Descargar PDF</button>
      </div>
      <div class="btn-group" style="margin-top:0.75rem">
        <button type="button" id="issue-dl-close" class="btn btn-ghost">Cerrar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = (): void => overlay.remove();

  overlay.querySelector('#issue-dl-close')?.addEventListener('click', close);
  overlay.querySelector('#issue-dl-png')?.addEventListener('click', () => {
    void Promise.resolve(options.onDownloadPng()).catch(() => undefined);
  });
  overlay.querySelector('#issue-dl-pdf')?.addEventListener('click', () => {
    void Promise.resolve(options.onDownloadPdf()).catch(() => undefined);
  });
}
