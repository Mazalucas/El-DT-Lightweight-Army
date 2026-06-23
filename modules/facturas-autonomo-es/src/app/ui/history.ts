import type { Invoice } from '../models/invoice';
import { formatInvoiceNumber } from '../models/invoice';
import { storage } from '../storage/local-dexie';

export async function loadInvoiceHistory(): Promise<Invoice[]> {
  return storage.listInvoices();
}

export function renderHistoryList(
  container: HTMLElement,
  invoices: Invoice[],
  onDuplicate: (invoice: Invoice) => void,
  onLoad: (invoice: Invoice) => void,
): void {
  container.innerHTML = '';

  if (!invoices.length) {
    container.innerHTML = '<p class="muted">Sin facturas guardadas.</p>';
    return;
  }

  const list = document.createElement('ul');
  list.className = 'history-list';

  for (const inv of invoices) {
    const li = document.createElement('li');
    li.className = 'history-item';

    const label = document.createElement('div');
    label.className = 'history-item-label';

    const title = document.createElement('span');
    title.className = 'history-item-title';
    title.textContent = `${formatInvoiceNumber(inv.number, inv.year)} — ${inv.clientName || 'Sin cliente'}`;

    const chip = document.createElement('span');
    chip.className = `badge ${inv.status === 'issued' ? 'badge-issued' : 'badge-draft'}`;
    chip.textContent = inv.status === 'issued' ? 'Emitida' : 'Borrador';

    label.append(title, chip);

    const actions = document.createElement('span');
    actions.className = 'history-actions';

    const loadBtn = document.createElement('button');
    loadBtn.type = 'button';
    loadBtn.textContent = 'Abrir';
    loadBtn.className = 'btn btn-ghost btn-sm';
    loadBtn.addEventListener('click', () => onLoad(inv));

    const dupBtn = document.createElement('button');
    dupBtn.type = 'button';
    dupBtn.textContent = 'Duplicar';
    dupBtn.className = 'btn btn-ghost btn-sm';
    dupBtn.addEventListener('click', () => onDuplicate(inv));

    actions.append(loadBtn, dupBtn);
    li.append(label, actions);
    list.appendChild(li);
  }

  container.appendChild(list);
}
