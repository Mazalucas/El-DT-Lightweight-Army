import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserMembership } from '@shared/types.js';
import { api } from '../../lib/api.js';
import { Badge, Button, Field, PageHeader, Section, Skeleton, toast } from '../ds.js';
import { qk, useOrgs } from '../hooks.js';
import { OrgPrivacyNotice } from '../components/OrgPrivacyNotice.js';

function isOrgAdmin(role: UserMembership['role']): boolean {
  return role === 'org_owner' || role === 'org_admin';
}

export default function Empresa() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const memberships = useOrgs();
  const domainOrgs = useQuery({ queryKey: ['orgs', 'by-domain'], queryFn: api.listOrgsByDomain });
  const [form, setForm] = useState({ name: '', slug: '', domain: '' });

  const create = useMutation({
    mutationFn: () =>
      api.createOrg({
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        domains: form.domain.trim() ? [form.domain.trim()] : undefined,
      }),
    onSuccess: ({ org }) => {
      void client.invalidateQueries({ queryKey: qk.orgs });
      toast(`Empresa «${org.name}» creada`);
      navigate(`/org/${org.id}/admin`);
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  const joinByDomain = useMutation({
    mutationFn: (orgId: string) => api.requestOrgJoin(orgId),
    onSuccess: (res, orgId) => {
      void client.invalidateQueries({ queryKey: qk.orgs });
      const joined = (res as { status?: string }).status === 'joined';
      toast(joined ? 'Te uniste a la empresa' : 'Solicitud enviada');
      if (joined) navigate(`/org/${orgId}`);
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  return (
    <div>
      <PageHeader title="Empresa" desc="Espacios compartidos, invitaciones y catálogo org." />
      <OrgPrivacyNotice />

      <Section title="Mis empresas">
        {memberships.isPending ? (
          <Skeleton lines={2} />
        ) : !memberships.data?.memberships.length ? (
          <p className="muted">No pertenecés a ninguna empresa. Creá una abajo o unite por dominio.</p>
        ) : (
          <div className="empresa-card-list">
            {memberships.data.memberships.map((m) => (
              <article key={m.orgId} className="empresa-card">
                <div className="empresa-card-body">
                  <h3 className="empresa-card-title">{m.orgName}</h3>
                  <p className="muted empresa-card-role">{m.role}</p>
                </div>
                <div className="btn-row empresa-card-actions">
                  <Link to={`/org/${m.orgId}`} className="btn btn-primary btn-sm">
                    Abrir espacio
                  </Link>
                  {isOrgAdmin(m.role) ? (
                    <Link to={`/org/${m.orgId}/admin`} className="btn btn-secondary btn-sm">
                      Admin
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Unirme por dominio"
        desc="Si tu email corporativo coincide con un dominio autorizado, podés solicitar acceso."
      >
        {domainOrgs.isPending ? (
          <Skeleton lines={2} />
        ) : !domainOrgs.data?.orgs.length ? (
          <p className="muted">Ninguna empresa acepta tu dominio por ahora.</p>
        ) : (
          <ul className="todo-list">
            {domainOrgs.data.orgs.map((o) => (
              <li key={o.id} className="todo-item">
                <span>
                  <strong>{o.name}</strong>{' '}
                  <Badge>{o.joinPolicy === 'domain_auto' ? 'acceso automático' : 'requiere aprobación'}</Badge>
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={joinByDomain.isPending}
                  onClick={() => joinByDomain.mutate(o.id)}
                >
                  Solicitar unirme
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Crear empresa"
        desc="Quedás como administrador. Podés invitar por enlace o habilitar acceso por dominio."
      >
        <div className="grid-2">
          <Field label="Nombre comercial">
            <input
              className="field-input"
              placeholder="Acme Corp"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Identificador (slug)">
            <input
              className="field-input"
              placeholder="acme"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Dominio corporativo (opcional)">
          <input
            className="field-input"
            placeholder="acme.com"
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
          />
        </Field>
        <Button loading={create.isPending} disabled={!form.name.trim()} onClick={() => create.mutate()}>
          Crear empresa
        </Button>
      </Section>
    </div>
  );
}
