import { api } from '../lib/api.js';
import type { FacturasStore, InvoiceClient, InvoiceRecord } from '@shared/types.js';
import { toast, escapeHtml } from '../lib/ui.js';
import { badge, button, emptyState, pageHeader, section, skeletonBlock } from '../ui/primitives.js';

function computeTotal(lines: InvoiceRecord['lines']): number {
  return lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
}

export async function renderFacturas(container: HTMLElement): Promise<void> {
  container.replaceChildren(pageHeader('Facturas autónomo', 'Emisor, borradores e historial.'));
  container.appendChild(skeletonBlock(5));

  let data: FacturasStore;

  try {
    data = await api.getInvoices();
  } catch (e) {
    container.replaceChildren(pageHeader('Facturas autónomo'));
    const err = document.createElement('p');
    err.className = 'muted';
    err.textContent = `Error: ${e instanceof Error ? e.message : String(e)}`;
    container.appendChild(err);
    return;
  }

  container.replaceChildren(pageHeader('Facturas autónomo', 'Emisor, borradores e historial.'));

  const layout = document.createElement('div');
  layout.className = 'facturas-layout';

  const left = document.createElement('div');

  const emitterSec = section('Emisor');
  emitterSec.body.innerHTML = `
    <div class="grid-2">
      <div class="field"><label for="em-name">Nombre</label><input id="em-name" value="${escapeHtml(data.emitter.name)}" /></div>
      <div class="field"><label for="em-tax">NIF/CIF</label><input id="em-tax" value="${escapeHtml(data.emitter.taxId)}" /></div>
    </div>
    <div class="field"><label for="em-addr">Dirección</label><input id="em-addr" value="${escapeHtml(data.emitter.address)}" /></div>
  `;
  emitterSec.body.appendChild(
    button('Guardar emisor', {
      id: 'btn-save-emitter',
      onClick: async () => {
        data.emitter = {
          name: (container.querySelector('#em-name') as HTMLInputElement).value.trim(),
          taxId: (container.querySelector('#em-tax') as HTMLInputElement).value.trim(),
          address: (container.querySelector('#em-addr') as HTMLInputElement).value.trim(),
        };
        await api.saveInvoices(data);
        toast('Emisor guardado');
      },
    }),
  );
  left.appendChild(emitterSec.el);

  const newSec = section('Nueva factura');
  newSec.body.innerHTML = `
    <div class="grid-2">
      <div class="field"><label for="inv-client">Cliente</label><input id="inv-client" placeholder="Nombre cliente" /></div>
      <div class="field"><label for="inv-desc">Concepto</label><input id="inv-desc" placeholder="Servicios profesionales" /></div>
    </div>
    <div class="grid-2">
      <div class="field"><label for="inv-amount">Importe (€)</label><input id="inv-amount" type="number" step="0.01" /></div>
      <div class="field"><label for="inv-date">Fecha</label><input id="inv-date" type="date" value="${new Date().toISOString().slice(0, 10)}" /></div>
    </div>
  `;
  newSec.body.appendChild(
    button('Crear borrador', {
      id: 'btn-create-invoice',
      onClick: async () => {
        const clientName = (container.querySelector('#inv-client') as HTMLInputElement).value.trim();
        const desc = (container.querySelector('#inv-desc') as HTMLInputElement).value.trim() || 'Servicios';
        const amount = Number((container.querySelector('#inv-amount') as HTMLInputElement).value);
        const date = (container.querySelector('#inv-date') as HTMLInputElement).value;
        if (!clientName || !amount) {
          toast('Cliente e importe requeridos', 'error');
          return;
        }
        if (!data.emitter.name || !data.emitter.taxId) {
          toast('Completa datos del emisor', 'error');
          return;
        }
        data.lastInvoiceNumber += 1;
        const client: InvoiceClient = { id: crypto.randomUUID(), kind: 'company', name: clientName };
        data.clients.push(client);
        const inv: InvoiceRecord = {
          id: crypto.randomUUID(),
          number: data.lastInvoiceNumber,
          series: new Date().getFullYear().toString(),
          date,
          clientId: client.id,
          clientSnapshot: client,
          emitterSnapshot: { ...data.emitter },
          lines: [{ description: desc, quantity: 1, unitPrice: amount }],
          currency: 'EUR',
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        data.invoices.push(inv);
        await api.saveInvoices(data);
        toast('Borrador creado');
        renderHistory();
      },
    }),
  );
  left.appendChild(newSec.el);

  const right = document.createElement('div');
  const histSec = section(`Historial (${data.invoices.length})`);
  const tableWrap = document.createElement('div');
  tableWrap.className = 'data-table-wrap';
  tableWrap.innerHTML = `<table class="data-table"><thead><tr><th>Nº</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Estado</th><th></th></tr></thead><tbody id="inv-tbody"></tbody></table>`;
  histSec.body.appendChild(tableWrap);
  right.appendChild(histSec.el);

  layout.append(left, right);
  container.appendChild(layout);

  function renderHistory(): void {
    const tbody = container.querySelector('#inv-tbody')!;
    const rows = [...data.invoices].reverse().slice(0, 50);

    if (rows.length === 0) {
      histSec.body.replaceChildren(
        emptyState(
          'Sin facturas',
          'Completá el emisor y creá tu primer borrador.',
        ),
      );
      return;
    }

    if (!histSec.body.querySelector('.data-table-wrap')) {
      histSec.body.replaceChildren(tableWrap);
    }

    tbody.innerHTML = rows
      .map((inv) => {
        const total = computeTotal(inv.lines);
        const num = `${inv.series}-${String(inv.number).padStart(4, '0')}`;
        return `<tr data-id="${escapeHtml(inv.id)}">
          <td>${num}</td>
          <td>${escapeHtml(inv.date)}</td>
          <td>${escapeHtml(inv.clientSnapshot.name)}</td>
          <td>${total.toFixed(2)} €</td>
          <td></td>
          <td></td>
        </tr>`;
      })
      .join('');

    tbody.querySelectorAll('tr').forEach((row, idx) => {
      const inv = rows[idx];
      const statusCell = row.querySelectorAll('td')[4];
      statusCell!.appendChild(badge(inv.status, inv.status === 'issued' ? 'success' : 'default'));

      const actionCell = row.querySelectorAll('td')[5];
      const issueBtn = button('Emitir + Drive', { variant: 'secondary', size: 'sm' });
      issueBtn.addEventListener('click', async () => {
        issueBtn.disabled = true;
        inv.status = 'issued';
        inv.updatedAt = new Date().toISOString();
        const total = computeTotal(inv.lines);
        const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem">
          <h1>FACTURA ${inv.series}-${String(inv.number).padStart(4, '0')}</h1>
          <p><strong>Emisor:</strong> ${inv.emitterSnapshot.name} — ${inv.emitterSnapshot.taxId}</p>
          <p><strong>Cliente:</strong> ${inv.clientSnapshot.name}</p>
          <p><strong>Fecha:</strong> ${inv.date}</p>
          <hr/>
          ${inv.lines.map((l) => `<p>${l.description}: ${l.quantity} × ${l.unitPrice.toFixed(2)} €</p>`).join('')}
          <p><strong>TOTAL: ${total.toFixed(2)} €</strong></p>
        </body></html>`;
        const b64 = btoa(unescape(encodeURIComponent(html)));
        try {
          await api.saveInvoices(data);
          await api.exportInvoice(
            `Factura-${inv.series}-${String(inv.number).padStart(4, '0')}.html`,
            'text/html',
            b64,
          );
          toast('Factura emitida y exportada a Drive');
          renderHistory();
        } catch (e) {
          toast(e instanceof Error ? e.message : 'Configura carpeta Drive en Ajustes', 'error');
        } finally {
          issueBtn.disabled = false;
        }
      });
      actionCell!.appendChild(issueBtn);
    });
  }

  renderHistory();
}
