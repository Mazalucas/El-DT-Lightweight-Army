import { formatPercent } from '../calc/totals';
import { formatMoney, normalizeCurrency } from '../models/currency';
import type { Emitter } from '../models/emitter';
import {
  formatDisplayDate,
  formatInvoiceNumber,
  type Invoice,
} from '../models/invoice';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderInvoiceHtml(invoice: Invoice, emitter: Emitter): string {
  const currency = normalizeCurrency(invoice.currency);
  const isNational = invoice.kind === 'national';
  const linesHtml = invoice.lines
    .filter((l) => l.description || l.amount)
    .map(
      (line) => `
      <tr>
        <td>${escapeHtml(line.description)}</td>
        <td class="amount-col">${formatMoney(line.amount, currency)}</td>
      </tr>`,
    )
    .join('');

  const legalNote =
    !isNational && invoice.legalNote
      ? `<div class="invoice-legal-note">${escapeHtml(invoice.legalNote)}</div>`
      : '';

  const totalsHeaders = isNational
    ? `<th>Total Bruto</th><th>Base Impuestos</th><th>IVA ${formatPercent(invoice.totals.ivaRate)}</th><th>I.R.P.F. ${formatPercent(invoice.totals.irpfRate)}</th><th>TOTAL</th>`
    : `<th>Total Bruto</th><th>Base Impuestos</th><th>IVA ${formatPercent(invoice.totals.ivaRate)}</th><th>TOTAL</th>`;

  const totalsValues = isNational
    ? `<td>${formatMoney(invoice.totals.gross, currency)}</td><td>${formatMoney(invoice.totals.base, currency)}</td><td>${formatMoney(invoice.totals.iva, currency)}</td><td>${formatMoney(invoice.totals.irpf, currency)}</td><td class="total-cell">${formatMoney(invoice.totals.total, currency)}</td>`
    : `<td>${formatMoney(invoice.totals.gross, currency)}</td><td>${formatMoney(invoice.totals.base, currency)}</td><td>${formatMoney(invoice.totals.iva, currency)}</td><td class="total-cell">${formatMoney(invoice.totals.total, currency)}</td>`;

  return `
    <article class="invoice-doc" data-kind="${invoice.kind}">
      <header class="invoice-header">
        <div class="invoice-emitter-name">${escapeHtml(emitter.name)}</div>
        <div class="invoice-emitter-line">NIF: ${escapeHtml(emitter.nif)}</div>
        <div class="invoice-emitter-line">${escapeHtml(emitter.address)}</div>
        ${emitter.phone ? `<div class="invoice-emitter-line">${escapeHtml(emitter.phone)}</div>` : ''}
      </header>

      <section class="invoice-client-block">
        <div class="invoice-section-label">CLIENTE:</div>
        <div class="invoice-client-row">${escapeHtml(invoice.clientName)}</div>
        <div class="invoice-client-row">${escapeHtml(invoice.clientTaxId)}</div>
        <div class="invoice-client-row">${escapeHtml(invoice.clientAddress)}</div>
      </section>

      <div class="invoice-meta">
        <span>Factura nº ${formatInvoiceNumber(invoice.number, invoice.year)}</span>
        <span>Fecha: ${formatDisplayDate(invoice.date)}</span>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>CONCEPTO</th>
            <th class="amount-col">Importe</th>
          </tr>
        </thead>
        <tbody>${linesHtml || '<tr><td>&nbsp;</td><td class="amount-col">&nbsp;</td></tr>'}</tbody>
      </table>

      ${legalNote}

      <table class="invoice-totals">
        <thead><tr>${totalsHeaders}</tr></thead>
        <tbody><tr>${totalsValues}</tr></tbody>
      </table>

      <section class="invoice-payment">
        <div class="invoice-payment-row">
          <span class="invoice-payment-label">Forma de pago:</span> ${escapeHtml(invoice.paymentMethod)}
          <br />${escapeHtml(invoice.iban)}
        </div>
        <div class="invoice-payment-row">
          <span class="invoice-payment-label">Vencimiento</span>
          <br />${escapeHtml(invoice.dueDate)}
        </div>
      </section>
    </article>
  `;
}

export function mountInvoicePreview(container: HTMLElement, invoice: Invoice, emitter: Emitter): void {
  container.innerHTML = renderInvoiceHtml(invoice, emitter);
}
