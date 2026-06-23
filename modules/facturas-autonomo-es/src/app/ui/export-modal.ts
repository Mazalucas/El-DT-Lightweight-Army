import {
  invoiceFileBaseName,
  monthFolderName,
  MONTHS_ES,
  yearMonthFromIsoDate,
} from '../lib/month-folders';
import { fetchExportConfig, listMonthFolders } from './export';

export interface ExportConfirmOptions {
  invoiceDate: string;
  invoiceNumber: number;
  invoiceYear: number;
  clientName: string;
  isDraft: boolean;
}

export interface ExportConfirmResult {
  confirmed: true;
  year: number;
  month: number;
  emitFirst: boolean;
  savePng: boolean;
  savePdf: boolean;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function showExportConfirmModal(
  options: ExportConfirmOptions,
): Promise<ExportConfirmResult | null> {
  const defaultYm = yearMonthFromIsoDate(options.invoiceDate);
  let config: { exportBasePath: string; exists: boolean };
  let existingFolders: string[] = [];

  try {
    [config, existingFolders] = await Promise.all([fetchExportConfig(), listMonthFolders()]);
  } catch {
    config = { exportBasePath: '(servidor local no disponible — usá npm run dev)', exists: false };
  }

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const monthOptions = MONTHS_ES.map(
      (name, i) =>
        `<option value="${i + 1}" ${i + 1 === defaultYm.month ? 'selected' : ''}>${String(i + 1).padStart(2, '0')} — ${name}</option>`,
    ).join('');

    const previewFolder = monthFolderName(defaultYm.year, defaultYm.month);
    const previewFile = invoiceFileBaseName(defaultYm.year, defaultYm.month, options.invoiceNumber);
    const folderExists = existingFolders.includes(previewFolder);

    overlay.innerHTML = `
      <div class="modal modal-wide">
        <h2>Exportar a Google Drive</h2>
        <p>Se guardará en tu carpeta <strong>Facturas</strong> de Google Drive (sync local).</p>
        ${
          options.isDraft
            ? '<p class="warn-box">La factura está en borrador. Al confirmar también se <strong>emitirá</strong>.</p>'
            : ''
        }
        <div class="form-group">
          <label>Cliente</label>
          <input type="text" value="${escapeHtml(options.clientName)}" disabled />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Año (carpeta destino)</label>
            <input id="export-year" type="number" min="2020" max="2099" value="${defaultYm.year}" />
          </div>
          <div class="form-group">
            <label>Mes (carpeta destino)</label>
            <select id="export-month">${monthOptions}</select>
          </div>
        </div>
        <div class="export-preview-box">
          <div><span class="muted">Carpeta:</span> <code id="preview-folder">${previewFolder}</code>
            <span id="folder-status" class="badge ${folderExists ? 'badge-issued' : 'badge-draft'}">${folderExists ? 'Ya existe' : 'Se creará'}</span>
          </div>
          <div><span class="muted">Archivos:</span> <code id="preview-file">${previewFile}.pdf</code>, <code>${previewFile}.png</code></div>
          <div class="muted export-path">${escapeHtml(config.exportBasePath)}</div>
        </div>
        <div class="form-group">
          <label><input type="checkbox" id="save-pdf" checked /> Guardar PDF</label>
        </div>
        <div class="form-group">
          <label><input type="checkbox" id="save-png" checked /> Guardar PNG</label>
        </div>
        <div class="btn-group">
          <button type="button" id="export-cancel" class="btn btn-secondary">Cancelar</button>
          <button type="button" id="export-confirm" class="btn btn-success">Confirmar y guardar</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const yearInput = overlay.querySelector('#export-year') as HTMLInputElement;
    const monthSelect = overlay.querySelector('#export-month') as HTMLSelectElement;
    const previewFolderEl = overlay.querySelector('#preview-folder') as HTMLElement;
    const previewFileEl = overlay.querySelector('#preview-file') as HTMLElement;
    const folderStatusEl = overlay.querySelector('#folder-status') as HTMLElement;

    const updatePreview = (): void => {
      const year = parseInt(yearInput.value, 10);
      const month = parseInt(monthSelect.value, 10);
      const folder = monthFolderName(year, month);
      const file = invoiceFileBaseName(year, month, options.invoiceNumber);
      previewFolderEl.textContent = folder;
      previewFileEl.textContent = `${file}.pdf`;
      const exists = existingFolders.includes(folder);
      folderStatusEl.textContent = exists ? 'Ya existe' : 'Se creará';
      folderStatusEl.className = `badge ${exists ? 'badge-issued' : 'badge-draft'}`;
    };

    yearInput.addEventListener('input', updatePreview);
    monthSelect.addEventListener('change', updatePreview);

    const close = (result: ExportConfirmResult | null): void => {
      overlay.remove();
      resolve(result);
    };

    overlay.querySelector('#export-cancel')?.addEventListener('click', () => close(null));
    overlay.querySelector('#export-confirm')?.addEventListener('click', () => {
      close({
        confirmed: true,
        year: parseInt(yearInput.value, 10),
        month: parseInt(monthSelect.value, 10),
        emitFirst: options.isDraft,
        savePdf: (overlay.querySelector('#save-pdf') as HTMLInputElement).checked,
        savePng: (overlay.querySelector('#save-png') as HTMLInputElement).checked,
      });
    });
  });
}
