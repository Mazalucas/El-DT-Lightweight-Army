import { computeTotals } from './calc/totals';
import { nextInvoiceNumberFromLast } from './lib/invoice-number';
import type { Client, ClientKind } from './models/client';
import {
  currencyAfterKindChange,
  currencyAmountLabel,
  defaultCurrencyForKind,
  normalizeCurrency,
  type InvoiceCurrency,
} from './models/currency';
import {
  createEmitterProfile,
  emitterFromProfile,
  isEmitterComplete,
  type Emitter,
  type EmitterProfile,
} from './models/emitter';
import {
  createEmptyInvoice,
  formatInvoiceNumber,
  todayIsoDate,
  type Invoice,
} from './models/invoice';
import { storage } from './storage/local-dexie';
import { downloadBackupJson, importBackupFromFile } from './storage/export-import';
import { mountInvoicePreview } from './templates/render-invoice';
import { upsertClientFromForm } from './ui/client-picker';
import {
  canvasToPdfBase64,
  canvasToPngBase64,
  exportInvoicePdf,
  exportInvoicePng,
  invoiceDownloadBaseName,
  printInvoice,
  saveExportToDrive,
} from './ui/export';
import { showIssueDownloadModal } from './ui/issue-download-modal';
import { renderEmitterToolbarOptions, showEmitterModal } from './ui/emitter-modal';
import { showExportConfirmModal } from './ui/export-modal';
import { loadInvoiceHistory, renderHistoryList } from './ui/history';

interface AppState {
  emitter: Emitter;
  emitterProfiles: EmitterProfile[];
  activeEmitterProfileId: string;
  invoice: Invoice;
  clients: Client[];
  selectedClientId: string;
  history: Invoice[];
}

/** Puerto dev fijo — cada puerto = IndexedDB distinto en el navegador. */
const FACTURAS_DEV_PORT = '5173';

let state: AppState;
let previewEl: HTMLElement;
let historyEl: HTMLElement;
let clientSearchEl: HTMLInputElement;
let suggestionsEl: HTMLUListElement;

function warnIfAlternateDevPort(): void {
  const host = location.hostname;
  if (host !== 'localhost' && host !== '127.0.0.1') return;
  const port = location.port || (location.protocol === 'https:' ? '443' : '80');
  if (port && port !== FACTURAS_DEV_PORT) {
    showToast(
      `Puerto ${port}: emisor y clientes están en este origen. Si ya configuraste el emisor, abrí http://localhost:${FACTURAS_DEV_PORT}/`,
    );
  }
}

function showToast(message: string): void {
  const existing = document.querySelector('.toast');
  existing?.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

function recalcInvoice(): void {
  state.invoice.totals = computeTotals(state.invoice.lines, state.invoice.kind, {
    ivaRate: state.emitter.ivaRate,
    irpfRate: state.emitter.irpfRate,
  });
  if (state.invoice.kind === 'international' && !state.invoice.legalNote) {
    state.invoice.legalNote = state.emitter.internationalLegalNote;
  }
  refreshPreview();
}

function refreshPreview(): void {
  mountInvoicePreview(previewEl, state.invoice, state.emitter);
}

function applyEmitterDefaultsToInvoice(overwrite = false): void {
  if (overwrite || !state.invoice.iban) state.invoice.iban = state.emitter.iban;
  if (overwrite || !state.invoice.paymentMethod) {
    state.invoice.paymentMethod = state.emitter.defaultPaymentMethod;
  }
  if (overwrite || !state.invoice.dueDate) state.invoice.dueDate = state.emitter.defaultDueTerms;
  if (state.invoice.kind === 'international' && (overwrite || !state.invoice.legalNote)) {
    state.invoice.legalNote = state.emitter.internationalLegalNote;
  }
}

function setActiveEmitterProfile(profile: EmitterProfile): void {
  state.activeEmitterProfileId = profile.id;
  state.emitter = emitterFromProfile(profile);
  const idx = state.emitterProfiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) state.emitterProfiles[idx] = profile;
  else state.emitterProfiles.unshift(profile);
}

async function refreshEmitterProfilesCache(): Promise<void> {
  state.emitterProfiles = await storage.listEmitterProfiles();
}

function refreshEmitterProfileSelect(): void {
  const select = document.getElementById('emitter-profile-select') as HTMLSelectElement | null;
  if (!select) return;
  select.innerHTML = renderEmitterToolbarOptions(
    state.emitterProfiles,
    state.activeEmitterProfileId,
  );
  select.value = state.activeEmitterProfileId;
}

async function switchEmitterProfile(profileId: string): Promise<void> {
  const profile =
    state.emitterProfiles.find((p) => p.id === profileId) ??
    (await storage.getEmitterProfile(profileId));
  if (!profile) return;
  await storage.setActiveEmitterProfileId(profile.id);
  setActiveEmitterProfile(profile);
  applyEmitterDefaultsToInvoice(true);
  syncFormFromState();
  refreshEmitterProfileSelect();
  recalcInvoice();
  showToast(`Emisor: ${profile.label}`);
}

const emitterModalCtx = () => ({
  storage,
  getProfiles: () => state.emitterProfiles,
  getActiveProfileId: () => state.activeEmitterProfileId,
  setActive: (profile: EmitterProfile) => {
    setActiveEmitterProfile(profile);
    applyEmitterDefaultsToInvoice(true);
    void refreshEmitterProfilesCache().then(() => refreshEmitterProfileSelect());
  },
  onSave: () => {
    applyEmitterDefaultsToInvoice();
    syncFormFromState();
    refreshPreview();
    void refreshEmitterProfilesCache().then(() => refreshEmitterProfileSelect());
  },
  showToast,
});

async function refreshHistory(): Promise<void> {
  state.history = await loadInvoiceHistory();
  renderHistoryList(
    historyEl,
    state.history,
    (inv) => void duplicateInvoice(inv),
    (inv) => void loadInvoice(inv),
  );
}

async function duplicateInvoice(source: Invoice): Promise<void> {
  const year = new Date().getFullYear();
  const number = await storage.getNextInvoiceNumber(year);
  const now = new Date().toISOString();
  state.invoice = {
    ...structuredClone(source),
    id: crypto.randomUUID(),
    number,
    year,
    date: todayIsoDate(),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
  state.selectedClientId = source.clientId;
  syncFormFromState();
  recalcInvoice();
  showToast(`Duplicada como borrador ${formatInvoiceNumber(number, year)}`);
}

async function loadInvoice(inv: Invoice): Promise<void> {
  state.invoice = structuredClone(inv);
  state.invoice.currency = normalizeCurrency(inv.currency);
  state.selectedClientId = inv.clientId;
  syncFormFromState();
  recalcInvoice();
  showToast(`Factura ${formatInvoiceNumber(inv.number, inv.year)} cargada`);
}

function syncFormFromState(): void {
  const form = document.getElementById('invoice-form') as HTMLFormElement;
  if (!form) return;

  (form.elements.namedItem('kind') as HTMLSelectElement).value = state.invoice.kind;
  const clientCurrencyEl = form.elements.namedItem('clientCurrency') as HTMLSelectElement | null;
  if (clientCurrencyEl) {
    clientCurrencyEl.value = state.invoice.currency;
  }
  updateAmountLabel();
  (form.elements.namedItem('number') as HTMLInputElement).value = String(state.invoice.number);
  (form.elements.namedItem('year') as HTMLInputElement).value = String(state.invoice.year);
  (form.elements.namedItem('date') as HTMLInputElement).value = state.invoice.date;
  (form.elements.namedItem('clientName') as HTMLInputElement).value = state.invoice.clientName;
  (form.elements.namedItem('clientTaxId') as HTMLInputElement).value = state.invoice.clientTaxId;
  (form.elements.namedItem('clientAddress') as HTMLInputElement).value = state.invoice.clientAddress;
  (form.elements.namedItem('description') as HTMLTextAreaElement).value =
    state.invoice.lines[0]?.description ?? '';
  (form.elements.namedItem('amount') as HTMLInputElement).value = String(
    state.invoice.lines[0]?.amount ?? 0,
  );
  (form.elements.namedItem('paymentMethod') as HTMLInputElement).value =
    state.invoice.paymentMethod;
  (form.elements.namedItem('dueDate') as HTMLInputElement).value = state.invoice.dueDate;
  (form.elements.namedItem('iban') as HTMLInputElement).value = state.invoice.iban;
  (form.elements.namedItem('legalNote') as HTMLTextAreaElement).value =
    state.invoice.legalNote ?? '';

  const legalGroup = document.getElementById('legal-note-group');
  if (legalGroup) {
    legalGroup.style.display = state.invoice.kind === 'international' ? 'block' : 'none';
  }

  const statusBadge = document.getElementById('status-badge');
  if (statusBadge) {
    statusBadge.textContent = state.invoice.status === 'issued' ? 'Emitida' : 'Borrador';
    statusBadge.className = `badge badge-${state.invoice.status}`;
  }
}

function updateAmountLabel(): void {
  const amountLabel = document.querySelector('[data-amount-label]');
  if (amountLabel) {
    amountLabel.textContent = currencyAmountLabel(state.invoice.currency);
  }
}

function readClientCurrencyFromForm(form: HTMLFormElement): InvoiceCurrency {
  const el = form.elements.namedItem('clientCurrency') as HTMLSelectElement | null;
  return (el?.value as InvoiceCurrency) ?? defaultCurrencyForKind(state.invoice.kind);
}

function syncStateFromForm(): void {
  const form = document.getElementById('invoice-form') as HTMLFormElement;
  const previousKind = state.invoice.kind;
  state.invoice.kind = (form.elements.namedItem('kind') as HTMLSelectElement)
    .value as ClientKind;
  let clientCurrency = readClientCurrencyFromForm(form);
  if (previousKind !== state.invoice.kind) {
    clientCurrency = currencyAfterKindChange(previousKind, state.invoice.kind, clientCurrency);
    const clientCurrencyEl = form.elements.namedItem('clientCurrency') as HTMLSelectElement | null;
    if (clientCurrencyEl) {
      clientCurrencyEl.value = clientCurrency;
    }
  }
  state.invoice.currency = clientCurrency;
  updateAmountLabel();
  if (state.invoice.kind === 'international' && !state.invoice.legalNote) {
    state.invoice.legalNote = state.emitter.internationalLegalNote;
  }
  const legalGroup = document.getElementById('legal-note-group');
  if (legalGroup) {
    legalGroup.style.display = state.invoice.kind === 'international' ? 'block' : 'none';
  }
  state.invoice.number = parseInt((form.elements.namedItem('number') as HTMLInputElement).value, 10);
  state.invoice.year = parseInt((form.elements.namedItem('year') as HTMLInputElement).value, 10);
  state.invoice.date = (form.elements.namedItem('date') as HTMLInputElement).value;
  state.invoice.clientName = (form.elements.namedItem('clientName') as HTMLInputElement).value;
  state.invoice.clientTaxId = (form.elements.namedItem('clientTaxId') as HTMLInputElement).value;
  state.invoice.clientAddress = (form.elements.namedItem('clientAddress') as HTMLInputElement).value;
  state.invoice.lines = [
    {
      description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
      amount: parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value) || 0,
    },
  ];
  state.invoice.paymentMethod = (form.elements.namedItem('paymentMethod') as HTMLInputElement).value;
  state.invoice.dueDate = (form.elements.namedItem('dueDate') as HTMLInputElement).value;
  state.invoice.iban = (form.elements.namedItem('iban') as HTMLInputElement).value;
  state.invoice.legalNote = (form.elements.namedItem('legalNote') as HTMLTextAreaElement).value;
  state.invoice.updatedAt = new Date().toISOString();
  recalcInvoice();
}

function selectClient(client: Client): void {
  state.selectedClientId = client.id;
  state.invoice.clientId = client.id;
  state.invoice.clientName = client.name;
  state.invoice.clientTaxId = client.taxId;
  state.invoice.clientAddress = client.address;
  state.invoice.kind = client.kind;
  state.invoice.currency = client.currency;
  if (client.kind === 'international') {
    state.invoice.legalNote = state.emitter.internationalLegalNote;
  }
  clientSearchEl.value = client.name;
  suggestionsEl.innerHTML = '';
  syncFormFromState();
  recalcInvoice();
  void storage.touchClient(client.id);
}

async function renderClientSuggestions(query: string): Promise<void> {
  const results = query.trim()
    ? await storage.searchClients(query)
    : await storage.listClients();
  suggestionsEl.innerHTML = '';
  for (const client of results.slice(0, 8)) {
    const li = document.createElement('li');
    li.textContent = `${client.name} — ${client.taxId} (${client.currency})`;
    li.addEventListener('click', () => selectClient(client));
    suggestionsEl.appendChild(li);
  }
}

async function saveDraft(): Promise<void> {
  syncStateFromForm();
  state.invoice.status = 'draft';
  await storage.saveInvoice(state.invoice);
  await refreshHistory();
  showToast('Borrador guardado');
}

async function issueInvoice(): Promise<boolean> {
  syncStateFromForm();
  if (!state.invoice.clientName.trim()) {
    showToast('Completá los datos del cliente');
    return false;
  }
  if (!state.invoice.lines[0]?.amount) {
    showToast('Indicá un importe');
    return false;
  }

  state.invoice.status = 'issued';
  await storage.saveInvoice(state.invoice);
  await storage.reserveInvoiceNumber(state.invoice.year, state.invoice.number);

  if (state.selectedClientId) {
    await storage.touchClient(state.selectedClientId);
  } else if (state.invoice.clientName) {
    const client = await upsertClientFromForm({
      name: state.invoice.clientName,
      taxId: state.invoice.clientTaxId,
      address: state.invoice.clientAddress,
      kind: state.invoice.kind,
      currency: state.invoice.currency,
    });
    state.selectedClientId = client.id;
    state.invoice.clientId = client.id;
    await storage.saveInvoice(state.invoice);
  }

  await refreshHistory();
  syncFormFromState();
  showToast(`Factura ${formatInvoiceNumber(state.invoice.number, state.invoice.year)} emitida`);
  return true;
}

function downloadIssuedInvoiceFiles(): { png: () => Promise<void>; pdf: () => Promise<void> } {
  const base = invoiceDownloadBaseName(state.invoice.number, state.invoice.year);
  return {
    png: () => exportInvoicePng(previewEl, `${base}.png`),
    pdf: () => exportInvoicePdf(previewEl, `${base}.pdf`),
  };
}

async function onIssueInvoiceClick(): Promise<void> {
  const ok = await issueInvoice();
  if (!ok) return;
  const downloads = downloadIssuedInvoiceFiles();
  showIssueDownloadModal({
    invoiceNumber: state.invoice.number,
    invoiceYear: state.invoice.year,
    onDownloadPng: async () => {
      await downloads.png();
      showToast('PNG descargado');
    },
    onDownloadPdf: async () => {
      await downloads.pdf();
      showToast('PDF descargado');
    },
  });
}

async function exportConfirmedInvoice(): Promise<void> {
  syncStateFromForm();

  if (!state.invoice.clientName.trim() || !state.invoice.lines[0]?.amount) {
    showToast('Completá cliente e importe antes de exportar');
    return;
  }

  const confirm = await showExportConfirmModal({
    invoiceDate: state.invoice.date,
    invoiceNumber: state.invoice.number,
    invoiceYear: state.invoice.year,
    clientName: state.invoice.clientName,
    isDraft: state.invoice.status !== 'issued',
  });

  if (!confirm) return;

  if (confirm.emitFirst) {
    const ok = await issueInvoice();
    if (!ok) return;
  }

  const files: { format: 'png' | 'pdf'; dataBase64: string }[] = [];

  try {
    if (confirm.savePng) {
      files.push({ format: 'png', dataBase64: await canvasToPngBase64(previewEl) });
    }
    if (confirm.savePdf) {
      files.push({ format: 'pdf', dataBase64: await canvasToPdfBase64(previewEl) });
    }
    if (!files.length) {
      showToast('Seleccioná al menos un formato');
      return;
    }

    const result = await saveExportToDrive({
      year: confirm.year,
      month: confirm.month,
      invoiceNumber: state.invoice.number,
      files,
    });

    const savedNames = result.saved.map((s) => s.fileName).join(', ');
    const skipped = result.skipped.length
      ? ` · Omitidos: ${result.skipped.map((s) => s.fileName).join(', ')}`
      : '';
    const created = result.createdMonthFolder ? ' (carpeta nueva)' : '';
    showToast(`Guardado: ${savedNames}${created}${skipped}`);
  } catch (err) {
    showToast(String(err));
  }
}

async function saveClientFromForm(): Promise<void> {
  syncStateFromForm();
  const client = await upsertClientFromForm({
    id: state.selectedClientId || undefined,
    name: state.invoice.clientName,
    taxId: state.invoice.clientTaxId,
    address: state.invoice.clientAddress,
    kind: state.invoice.kind,
    currency: state.invoice.currency,
  });
  state.invoice.currency = client.currency;
  state.selectedClientId = client.id;
  state.invoice.clientId = client.id;
  showToast(`Cliente "${client.name}" guardado`);
}

async function suggestNumberForYear(year: number, updateForm = true): Promise<number> {
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return state.invoice.number;
  }
  const number = await storage.getNextInvoiceNumber(year);
  state.invoice.year = year;
  state.invoice.number = number;
  if (updateForm) {
    const form = document.getElementById('invoice-form') as HTMLFormElement | null;
    if (form) {
      (form.elements.namedItem('year') as HTMLInputElement).value = String(year);
      (form.elements.namedItem('number') as HTMLInputElement).value = String(number);
    }
    refreshPreview();
  }
  return number;
}

async function showNumberingModal(): Promise<void> {
  const defaultYear = state.invoice.year || new Date().getFullYear();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  async function renderFields(year: number): Promise<void> {
    const last = await storage.getLastInvoiceNumberForYear(year);
    const historyMax = await storage.getMaxIssuedNumberForYear(year);
    const next = nextInvoiceNumberFromLast(last);
    const lastInput = overlay.querySelector('#numbering-last') as HTMLInputElement;
    const nextHint = overlay.querySelector('#numbering-next-hint');
    const historyHint = overlay.querySelector('#numbering-history-hint');
    if (lastInput) lastInput.value = String(last);
    if (nextHint) nextHint.textContent = `Próximo sugerido: ${formatInvoiceNumber(next, year)}`;
    if (historyHint) {
      historyHint.textContent =
        historyMax > 0
          ? `Máximo en historial emitidas: ${String(historyMax).padStart(3, '0')}`
          : 'Sin facturas emitidas en historial para este año';
    }
  }

  overlay.innerHTML = `
    <div class="modal">
      <h2>Numeración</h2>
      <p>Ajustá el último número ya emitido por año. El contador usa el mayor valor entre este ajuste y el historial de emitidas.</p>
      <form id="numbering-form">
        <div class="form-group">
          <label>Año</label>
          <input id="numbering-year" name="year" type="number" min="2000" max="2100" value="${defaultYear}" />
        </div>
        <div class="form-group">
          <label>Último nº emitido</label>
          <input id="numbering-last" name="lastNumber" type="number" min="0" step="1" />
          <p id="numbering-history-hint" class="muted form-hint"></p>
        </div>
        <p id="numbering-next-hint" class="muted form-hint"></p>
        <div class="btn-group">
          <button type="submit" class="btn">Guardar numeración</button>
          <button type="button" id="numbering-apply-btn" class="btn btn-secondary">Usar próximo en factura actual</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const yearInput = overlay.querySelector('#numbering-year') as HTMLInputElement;
  yearInput.addEventListener('change', () => void renderFields(parseInt(yearInput.value, 10)));
  await renderFields(defaultYear);

  overlay.querySelector('#numbering-apply-btn')?.addEventListener('click', async () => {
    const year = parseInt(yearInput.value, 10);
    await suggestNumberForYear(year);
    overlay.remove();
    showToast(`Número actualizado a ${formatInvoiceNumber(state.invoice.number, year)}`);
  });

  overlay.querySelector('#numbering-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const year = parseInt(yearInput.value, 10);
    const lastNumber = parseInt(
      (overlay.querySelector('#numbering-last') as HTMLInputElement).value,
      10,
    );
    if (!Number.isFinite(year) || year < 2000 || year > 2100) {
      showToast('Año inválido');
      return;
    }
    if (!Number.isFinite(lastNumber) || lastNumber < 0) {
      showToast('Último número inválido');
      return;
    }
    await storage.setLastInvoiceNumberForYear(year, lastNumber);
    overlay.remove();
    if (state.invoice.year === year) {
      await suggestNumberForYear(year);
    }
    showToast(`Numeración ${year} guardada (último: ${String(lastNumber).padStart(3, '0')})`);
  });
}

function invoiceActionsMarkup(): string {
  return `
    <div class="btn-group btn-group-stacked invoice-actions-stack">
      <button type="button" data-action="save-draft" class="btn btn-secondary">Guardar borrador</button>
      <button type="button" data-action="issue" class="btn btn-success">Emitir</button>
      <button type="button" data-action="export-drive" class="btn">Exportar a Google Drive</button>
    </div>
    <button type="button" data-action="new-invoice" class="btn btn-block">Nueva factura</button>
  `;
}

function openMobileActionsMenu(): void {
  document.getElementById('mobile-actions-overlay')?.classList.add('is-open');
  document.body.classList.add('mobile-menu-open');
}

function closeMobileActionsMenu(): void {
  document.getElementById('mobile-actions-overlay')?.classList.remove('is-open');
  document.body.classList.remove('mobile-menu-open');
}

let invoiceActionsBound = false;

function bindInvoiceActionHandlers(): void {
  if (invoiceActionsBound) return;
  invoiceActionsBound = true;

  document.body.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest('[data-action]');
    if (!el) return;
    const action = el.getAttribute('data-action');
    switch (action) {
      case 'mobile-menu-open':
        openMobileActionsMenu();
        break;
      case 'mobile-menu-close':
        closeMobileActionsMenu();
        break;
      case 'save-draft':
        closeMobileActionsMenu();
        void saveDraft();
        break;
      case 'issue':
        closeMobileActionsMenu();
        void onIssueInvoiceClick();
        break;
      case 'export-drive':
        closeMobileActionsMenu();
        void exportConfirmedInvoice();
        break;
      case 'new-invoice':
        closeMobileActionsMenu();
        void createNewInvoice();
        break;
      default:
        break;
    }
  });

  document.getElementById('mobile-actions-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeMobileActionsMenu();
  });
}

function buildShell(): void {
  const app = document.getElementById('app')!;
  app.innerHTML = `
    <div class="app-shell">
      <button
        type="button"
        class="mobile-menu-toggle"
        data-action="mobile-menu-open"
        aria-label="Abrir menú de acciones"
      >
        <span class="mobile-menu-bar"></span>
        <span class="mobile-menu-bar"></span>
        <span class="mobile-menu-bar"></span>
      </button>
      <div id="mobile-actions-overlay" class="mobile-actions-overlay">
        <div class="mobile-actions-drawer" role="dialog" aria-label="Acciones de factura">
          <div class="mobile-actions-drawer-header">
            <h2 class="mobile-actions-title">Acciones</h2>
            <button type="button" class="btn btn-ghost btn-sm" data-action="mobile-menu-close" aria-label="Cerrar">✕</button>
          </div>
          <div class="panel-actions panel-actions--mobile">
            ${invoiceActionsMarkup()}
          </div>
        </div>
      </div>
      <aside class="panel panel-form">
        <div class="panel-form-scroll">
        <h1 class="panel-title">Nueva factura <span id="status-badge" class="badge badge-draft">Borrador</span></h1>
        <form id="invoice-form">
          <div class="form-group">
            <label>Perfil de emisor</label>
            <select id="emitter-profile-select" title="Perfil de emisor"></select>
          </div>
          <button type="button" id="emitter-btn" class="btn btn-ghost btn-sm" style="margin-bottom:0.75rem">Editar perfiles de emisor</button>
          <div class="form-group">
            <label>Tipo de factura</label>
            <select name="kind">
              <option value="national">Cliente nacional</option>
              <option value="international">Cliente internacional</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Nº</label><input name="number" type="number" min="1" /></div>
            <div class="form-group"><label>Año</label><input name="year" type="number" /></div>
          </div>
          <div class="form-group"><label>Fecha</label><input name="date" type="date" /></div>
          <hr class="section-divider" />
          <div class="form-group">
            <label>Buscar cliente</label>
            <input id="client-search" type="search" placeholder="Nombre o CIF..." autocomplete="off" />
            <ul id="client-suggestions" class="client-suggestions"></ul>
          </div>
          <div class="form-group"><label>Nombre cliente</label><input name="clientName" /></div>
          <div class="form-group"><label>CIF / NIF</label><input name="clientTaxId" /></div>
          <div class="form-group"><label>Domicilio</label><input name="clientAddress" /></div>
          <div class="form-group">
            <label>Moneda del cliente</label>
            <select name="clientCurrency">
              <option value="EUR">Euro (EUR)</option>
              <option value="USD">Dólar US (USD)</option>
              <option value="GBP">Libra (GBP)</option>
              <option value="CHF">Franco suizo (CHF)</option>
              <option value="CAD">Dólar canadiense (CAD)</option>
              <option value="AUD">Dólar australiano (AUD)</option>
              <option value="MXN">Peso mexicano (MXN)</option>
              <option value="JPY">Yen (JPY)</option>
            </select>
          </div>
          <button type="button" id="save-client-btn" class="btn btn-secondary btn-sm">Guardar cliente</button>
          <hr class="section-divider" />
          <div class="form-group"><label>Concepto</label><textarea name="description"></textarea></div>
          <div class="form-group"><label data-amount-label>Importe (EUR)</label><input name="amount" type="number" step="0.01" min="0" /></div>
          <div id="legal-note-group" class="form-group" style="display:none">
            <label>Nota legal (internacional)</label>
            <textarea name="legalNote"></textarea>
          </div>
          <hr class="section-divider" />
          <div class="form-group"><label>Forma de pago</label><input name="paymentMethod" /></div>
          <div class="form-group"><label>IBAN</label><input name="iban" /></div>
          <div class="form-group"><label>Vencimiento</label><input name="dueDate" /></div>
        </form>
        </div>
        <div class="panel-actions panel-actions--desktop">
          ${invoiceActionsMarkup()}
        </div>
      </aside>

      <main class="panel preview-panel">
        <div class="preview-toolbar">
          <span class="muted">Vista previa</span>
          <div class="btn-group" style="margin:0">
            <button type="button" id="export-pdf-btn" class="btn btn-secondary btn-sm">PDF (imprimir)</button>
            <button type="button" id="export-png-btn" class="btn btn-secondary btn-sm">PNG descarga</button>
          </div>
        </div>
        <div class="preview-frame"><div id="preview"></div></div>
      </main>

      <aside class="panel">
        <h2 class="panel-title">Historial</h2>
        <div id="history"></div>
        <hr class="section-divider" />
        <h2 class="panel-title">Datos</h2>
        <div class="btn-group">
          <button type="button" id="backup-btn" class="btn btn-secondary btn-sm">Exportar backup</button>
          <label class="btn btn-secondary btn-sm" style="cursor:pointer">
            Importar
            <input id="import-file" type="file" accept="application/json" hidden />
          </label>
          <button type="button" id="numbering-btn" class="btn btn-ghost btn-sm">Numeración</button>
        </div>
      </aside>
    </div>
  `;

  previewEl = document.getElementById('preview')!;
  historyEl = document.getElementById('history')!;
  clientSearchEl = document.getElementById('client-search') as HTMLInputElement;
  suggestionsEl = document.getElementById('client-suggestions') as HTMLUListElement;

  const form = document.getElementById('invoice-form') as HTMLFormElement;
  const yearInput = form.elements.namedItem('year') as HTMLInputElement;
  form.addEventListener('input', (e) => {
    if ((e.target as HTMLElement).getAttribute('name') === 'year') return;
    syncStateFromForm();
  });
  form.addEventListener('change', (e) => {
    if ((e.target as HTMLElement).getAttribute('name') === 'year') {
      const year = parseInt(yearInput.value, 10);
      void suggestNumberForYear(year).then(() => syncStateFromForm());
      return;
    }
    syncStateFromForm();
  });

  clientSearchEl.addEventListener('input', () => void renderClientSuggestions(clientSearchEl.value));
  clientSearchEl.addEventListener('focus', () => void renderClientSuggestions(clientSearchEl.value));

  bindInvoiceActionHandlers();
  document.getElementById('save-client-btn')!.addEventListener('click', () => void saveClientFromForm());
  document.getElementById('export-pdf-btn')!.addEventListener('click', () => {
    syncStateFromForm();
    printInvoice(state.invoice, state.emitter);
  });
  document.getElementById('export-png-btn')!.addEventListener('click', () => {
    syncStateFromForm();
    const name = `factura-${formatInvoiceNumber(state.invoice.number, state.invoice.year).replace(/\s/g, '')}.png`;
    void exportInvoicePng(previewEl, name).catch((err) => showToast(String(err)));
  });
  refreshEmitterProfileSelect();
  document.getElementById('emitter-profile-select')!.addEventListener('change', (e) => {
    const id = (e.target as HTMLSelectElement).value;
    if (id) void switchEmitterProfile(id);
  });
  document.getElementById('emitter-btn')!.addEventListener('click', () => {
    void showEmitterModal(emitterModalCtx());
  });
  document.getElementById('backup-btn')!.addEventListener('click', () => void downloadBackupJson());
  document.getElementById('import-file')!.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      void importBackupFromFile(file)
        .then(() => init())
        .then(() => showToast('Backup importado'))
        .catch((err) => showToast(String(err)));
    }
  });
  document.getElementById('numbering-btn')!.addEventListener('click', () => void showNumberingModal());
}

async function createNewInvoice(): Promise<void> {
  syncStateFromForm();
  const year = state.invoice.year || new Date().getFullYear();
  const nextFromStorage = await storage.getNextInvoiceNumber(year);
  const number = Math.max(nextFromStorage, state.invoice.number + 1);
  const kind = state.invoice.kind;
  state.invoice = createEmptyInvoice(kind, year, number);
  state.invoice.iban = state.emitter.iban;
  state.invoice.paymentMethod = state.emitter.defaultPaymentMethod;
  state.invoice.dueDate = state.emitter.defaultDueTerms;
  if (kind === 'international') {
    state.invoice.legalNote = state.emitter.internationalLegalNote;
  }
  state.selectedClientId = '';
  clientSearchEl.value = '';
  syncFormFromState();
  recalcInvoice();
  showToast(`Nueva factura ${formatInvoiceNumber(number, year)}`);
}

async function init(): Promise<void> {
  let emitterProfiles = await storage.listEmitterProfiles();
  let activeProfile = await storage.getActiveEmitterProfile();
  if (!activeProfile) {
    const fresh = createEmitterProfile('Principal');
    await storage.saveEmitterProfile(fresh);
    emitterProfiles = await storage.listEmitterProfiles();
    activeProfile = fresh;
  }

  const emitter = emitterFromProfile(activeProfile);

  const year = new Date().getFullYear();
  const number = await storage.getNextInvoiceNumber(year);
  const invoice = createEmptyInvoice('national', year, number);
  invoice.iban = emitter.iban;
  invoice.paymentMethod = emitter.defaultPaymentMethod;
  invoice.dueDate = emitter.defaultDueTerms;

  state = {
    emitter,
    emitterProfiles,
    activeEmitterProfileId: activeProfile.id,
    invoice,
    clients: await storage.listClients(),
    selectedClientId: '',
    history: await storage.listInvoices(),
  };

  buildShell();
  refreshEmitterProfileSelect();
  syncFormFromState();
  recalcInvoice();
  await refreshHistory();

  warnIfAlternateDevPort();

  if (!isEmitterComplete(emitter)) {
    void showEmitterModal(emitterModalCtx());
  }
}

void init();
