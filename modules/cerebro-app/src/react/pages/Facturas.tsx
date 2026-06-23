import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FacturasStore, InvoiceClient, InvoiceRecord } from '@shared/types.js';
import { api } from '../../lib/api.js';
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  Field,
  PageHeader,
  Section,
  Skeleton,
  toast,
} from '../ds.js';

function computeTotal(lines: InvoiceRecord['lines']): number {
  return lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
}

function invoiceNumber(inv: InvoiceRecord): string {
  return `${inv.series}-${String(inv.number).padStart(4, '0')}`;
}

function invoiceHtml(inv: InvoiceRecord): string {
  const total = computeTotal(inv.lines);
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem">
    <h1>FACTURA ${invoiceNumber(inv)}</h1>
    <p><strong>Emisor:</strong> ${inv.emitterSnapshot.name} — ${inv.emitterSnapshot.taxId}</p>
    <p><strong>Cliente:</strong> ${inv.clientSnapshot.name}</p>
    <p><strong>Fecha:</strong> ${inv.date}</p>
    <hr/>
    ${inv.lines.map((l) => `<p>${l.description}: ${l.quantity} × ${l.unitPrice.toFixed(2)} €</p>`).join('')}
    <p><strong>TOTAL: ${total.toFixed(2)} €</strong></p>
  </body></html>`;
}

const FACTURAS_KEY = ['facturas'] as const;

export default function Facturas() {
  const client = useQueryClient();
  const { data, isPending, error, refetch } = useQuery({ queryKey: FACTURAS_KEY, queryFn: api.getInvoices });

  const [emitter, setEmitter] = useState<{ name: string; taxId: string; address: string } | null>(null);
  const [form, setForm] = useState({
    client: '',
    desc: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const saveEmitter = useMutation({
    mutationFn: async () => {
      if (!data || !emitter) return;
      await api.saveInvoices({ ...data, emitter });
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: FACTURAS_KEY });
      toast('Emisor guardado');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  const createDraft = useMutation({
    mutationFn: async () => {
      if (!data) return;
      const clientName = form.client.trim();
      const amount = Number(form.amount);
      if (!clientName || !amount) throw new Error('Cliente e importe requeridos');
      if (!data.emitter.name || !data.emitter.taxId) throw new Error('Completá los datos del emisor primero');
      const invClient: InvoiceClient = { id: crypto.randomUUID(), kind: 'company', name: clientName };
      const inv: InvoiceRecord = {
        id: crypto.randomUUID(),
        number: data.lastInvoiceNumber + 1,
        series: new Date().getFullYear().toString(),
        date: form.date,
        clientId: invClient.id,
        clientSnapshot: invClient,
        emitterSnapshot: { ...data.emitter },
        lines: [{ description: form.desc.trim() || 'Servicios', quantity: 1, unitPrice: amount }],
        currency: 'EUR',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await api.saveInvoices({
        ...data,
        lastInvoiceNumber: inv.number,
        clients: [...data.clients, invClient],
        invoices: [...data.invoices, inv],
      });
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: FACTURAS_KEY });
      setForm((f) => ({ ...f, client: '', desc: '', amount: '' }));
      toast('Borrador creado');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  const issue = useMutation({
    mutationFn: async (inv: InvoiceRecord) => {
      if (!data) return;
      const updated: InvoiceRecord = { ...inv, status: 'issued', updatedAt: new Date().toISOString() };
      await api.saveInvoices({
        ...data,
        invoices: data.invoices.map((i) => (i.id === inv.id ? updated : i)),
      });
      const b64 = btoa(unescape(encodeURIComponent(invoiceHtml(updated))));
      await api.exportInvoice(`Factura-${invoiceNumber(updated)}.html`, 'text/html', b64);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: FACTURAS_KEY });
      toast('Factura emitida y exportada a Drive');
    },
    onError: (e) =>
      toast(e instanceof Error ? e.message : 'Configurá la carpeta Drive en Ajustes', 'error'),
  });

  if (isPending) return <Skeleton lines={8} />;
  if (error) return <ErrorState error={error} retry={() => void refetch()} />;
  if (!data) return null;

  const em = emitter ?? data.emitter;
  const rows = [...data.invoices].reverse().slice(0, 50);

  return (
    <div>
      <PageHeader title="Facturas autónomo" desc="Emisor, borradores e historial." />
      <div className="facturas-layout">
        <div>
          <Section title="Emisor">
            <div className="grid-2">
              <Field label="Nombre">
                <input
                  className="field-input"
                  value={em.name}
                  onChange={(e) => setEmitter({ ...em, name: e.target.value })}
                />
              </Field>
              <Field label="NIF/CIF">
                <input
                  className="field-input"
                  value={em.taxId}
                  onChange={(e) => setEmitter({ ...em, taxId: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Dirección">
              <input
                className="field-input"
                value={em.address}
                onChange={(e) => setEmitter({ ...em, address: e.target.value })}
              />
            </Field>
            <Button loading={saveEmitter.isPending} disabled={!emitter} onClick={() => saveEmitter.mutate()}>
              Guardar emisor
            </Button>
          </Section>

          <Section title="Nueva factura">
            <div className="grid-2">
              <Field label="Cliente">
                <input
                  className="field-input"
                  placeholder="Nombre cliente"
                  value={form.client}
                  onChange={(e) => setForm({ ...form, client: e.target.value })}
                />
              </Field>
              <Field label="Concepto">
                <input
                  className="field-input"
                  placeholder="Servicios profesionales"
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid-2">
              <Field label="Importe (€)">
                <input
                  className="field-input"
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </Field>
              <Field label="Fecha">
                <input
                  className="field-input"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </Field>
            </div>
            <Button loading={createDraft.isPending} onClick={() => createDraft.mutate()}>
              Crear borrador
            </Button>
          </Section>
        </div>

        <div>
          <Section title={`Historial (${data.invoices.length})`}>
            {rows.length === 0 ? (
              <EmptyState title="Sin facturas" desc="Completá el emisor y creá tu primer borrador." />
            ) : (
              <DataTable headers={['Nº', 'Fecha', 'Cliente', 'Total', 'Estado', '']}>
                {rows.map((inv) => (
                  <tr key={inv.id}>
                    <td>{invoiceNumber(inv)}</td>
                    <td>{inv.date}</td>
                    <td>{inv.clientSnapshot.name}</td>
                    <td>{computeTotal(inv.lines).toFixed(2)} €</td>
                    <td>
                      <Badge tone={inv.status === 'issued' ? 'success' : 'default'}>{inv.status}</Badge>
                    </td>
                    <td>
                      {inv.status !== 'issued' ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={issue.isPending}
                          onClick={() => issue.mutate(inv)}
                        >
                          Emitir + Drive
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
