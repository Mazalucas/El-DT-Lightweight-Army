import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OrgJoinPolicy, OrgRole } from '@shared/types.js';
import { api } from '../../../lib/api.js';
import { ACCENT_PRESETS, orgDisplayName } from '../../../lib/org-branding.js';
import { copyTextToClipboard } from '../../../app/org-privacy.js';
import {
  Badge,
  Button,
  ErrorState,
  Field,
  PageHeader,
  Section,
  Segmented,
  Skeleton,
  toast,
} from '../../ds.js';
import { qk, useOrg, useOrgMembers } from '../../hooks.js';

type AdminTab = 'admin' | 'invitar' | 'apariencia';

function PolicySection({ orgId }: { orgId: string }) {
  const client = useQueryClient();
  const org = useOrg(orgId);
  const [domains, setDomains] = useState<string | null>(null);
  const [policy, setPolicy] = useState<OrgJoinPolicy | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api.updateOrg(orgId, {
        domains: (domains ?? org.data?.org.domains.join(', ') ?? '')
          .split(/[,;\s]+/)
          .map((d) => d.trim())
          .filter(Boolean),
        joinPolicy: policy ?? org.data?.org.joinPolicy,
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: qk.org(orgId) });
      toast('Política actualizada');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  if (!org.data) return <Skeleton lines={3} />;
  const o = org.data.org;

  return (
    <Section
      title="Política y dominios"
      desc="Dominios autorizados para solicitar acceso. El admin declara dominios de confianza."
    >
      <Field label="Dominios (coma-separados)">
        <input
          className="field-input"
          value={domains ?? o.domains.join(', ')}
          placeholder="empresa.com, empresa.es"
          onChange={(e) => setDomains(e.target.value)}
        />
      </Field>
      <Field label="Política de acceso">
        <select
          className="field-input"
          value={policy ?? o.joinPolicy}
          onChange={(e) => setPolicy(e.target.value as OrgJoinPolicy)}
        >
          <option value="invite_only">Solo invitación por email</option>
          <option value="domain_request">Dominio + aprobación admin</option>
          <option value="domain_auto">Dominio + acceso automático</option>
        </select>
      </Field>
      <Button variant="secondary" loading={save.isPending} onClick={() => save.mutate()}>
        Guardar política
      </Button>
    </Section>
  );
}

function JoinRequestsSection({ orgId }: { orgId: string }) {
  const client = useQueryClient();
  const requests = useQuery({
    queryKey: qk.orgJoinRequests(orgId),
    queryFn: () => api.listOrgJoinRequests(orgId),
  });

  const review = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      approve ? api.approveOrgJoinRequest(orgId, id) : api.rejectOrgJoinRequest(orgId, id),
    onSuccess: (_r, vars) => {
      void client.invalidateQueries({ queryKey: qk.orgJoinRequests(orgId) });
      void client.invalidateQueries({ queryKey: qk.orgMembers(orgId) });
      toast(vars.approve ? 'Miembro aprobado' : 'Solicitud rechazada');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  return (
    <Section title="Solicitudes de acceso">
      {requests.isPending ? (
        <Skeleton lines={2} />
      ) : !requests.data?.requests.length ? (
        <p className="muted">Sin solicitudes pendientes.</p>
      ) : (
        <ul className="todo-list">
          {requests.data.requests.map((r) => (
            <li key={r.id} className="todo-item">
              <span>
                <strong>{r.email}</strong> <span className="muted">{r.createdAt.slice(0, 10)}</span>
              </span>
              <div className="todo-actions">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ id: r.id, approve: true })}
                >
                  Aprobar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ id: r.id, approve: false })}
                >
                  Rechazar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function MembersSection({ orgId }: { orgId: string }) {
  const members = useOrgMembers(orgId);
  return (
    <Section title={`Miembros (${members.data?.members.length ?? '…'})`}>
      {members.isPending ? (
        <Skeleton lines={3} />
      ) : (
        <ul className="todo-list">
          {(members.data?.members ?? []).map((m) => (
            <li key={m.uid} className="todo-item">
              <span>
                <strong>{m.email || m.uid}</strong> <Badge>{m.role}</Badge>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function InviteTab({ orgId }: { orgId: string }) {
  const client = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('org_member');
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const invites = useQuery({ queryKey: qk.orgInvites(orgId), queryFn: () => api.listOrgInvites(orgId) });

  const create = useMutation({
    mutationFn: () => api.createOrgInvite(orgId, email.trim(), role),
    onSuccess: (res) => {
      setJoinUrl((res as { joinUrl: string }).joinUrl);
      void client.invalidateQueries({ queryKey: qk.orgInvites(orgId) });
      toast('Invitación creada');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  return (
    <>
      <Section
        title="Invitar miembros"
        desc="El invitado no necesita cuenta previa. Si el envío de email no está configurado, copiá el enlace manualmente."
      >
        <Field label="Email">
          <input
            className="field-input"
            type="email"
            placeholder="persona@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Rol">
          <select className="field-input" value={role} onChange={(e) => setRole(e.target.value as OrgRole)}>
            <option value="org_member">Miembro</option>
            <option value="org_admin">Admin</option>
          </select>
        </Field>
        <Button loading={create.isPending} disabled={!email.trim()} onClick={() => create.mutate()}>
          Enviar invitación
        </Button>
        {joinUrl ? (
          <div className="inline-panel" style={{ marginTop: 'var(--space-3)' }}>
            <p className="muted">Enlace de invitación:</p>
            <code className="invite-url">{joinUrl}</code>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void copyTextToClipboard(joinUrl).then((ok) =>
                  toast(ok ? 'Enlace copiado' : 'No se pudo copiar', ok ? undefined : 'error'),
                );
              }}
            >
              Copiar enlace
            </Button>
          </div>
        ) : null}
      </Section>

      <Section title="Invitaciones pendientes">
        {invites.isPending ? (
          <Skeleton lines={2} />
        ) : !invites.data?.invites.length ? (
          <p className="muted">Sin invitaciones pendientes.</p>
        ) : (
          <ul className="todo-list">
            {invites.data.invites.map((inv) => (
              <li key={inv.id} className="todo-item">
                <span>
                  {inv.email}{' '}
                  <span className="muted">
                    {inv.role} · expira {inv.expiresAt.slice(0, 10)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

function BrandingTab({ orgId }: { orgId: string }) {
  const client = useQueryClient();
  const org = useOrg(orgId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [accent, setAccent] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (reset: boolean) =>
      api.updateOrg(orgId, {
        branding: reset
          ? {}
          : {
              displayName: (displayName ?? org.data?.org.branding?.displayName ?? '').trim() || undefined,
              accentColor: accent ?? org.data?.org.branding?.accentColor ?? '#0ea5e9',
              logoUrl: logoUrl ?? org.data?.org.branding?.logoUrl,
            },
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: qk.org(orgId) });
      toast('Apariencia guardada');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  async function uploadLogo(file: File) {
    if (file.size > 512 * 1024) {
      toast('Logo demasiado grande (máx. 512 KB)', 'error');
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });
    const base64 = dataUrl.split(',')[1];
    if (!base64) return;
    try {
      const res = await api.uploadOrgLogo(orgId, {
        dataBase64: base64,
        mimeType: file.type,
        fileName: file.name,
      });
      setLogoUrl((res as { logoUrl: string }).logoUrl);
      toast('Logo subido — guardá apariencia para aplicar');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al subir logo', 'error');
    }
  }

  if (!org.data) return <Skeleton lines={4} />;
  const branding = org.data.org.branding ?? {};
  const currentAccent = accent ?? branding.accentColor ?? '#0ea5e9';
  const currentLogo = logoUrl ?? branding.logoUrl;

  return (
    <Section
      title="Apariencia de la empresa"
      desc="Logo y color de acento en la barra lateral del espacio org."
    >
      <Field label="Nombre visible (opcional)">
        <input
          className="field-input"
          value={displayName ?? branding.displayName ?? ''}
          placeholder={org.data.org.name}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </Field>
      <Field label="Color de acento">
        <div className="brand-accent-row">
          {ACCENT_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              className="brand-accent-swatch"
              style={{ background: color }}
              title={color}
              onClick={() => setAccent(color)}
            />
          ))}
        </div>
        <input type="color" value={currentAccent} onChange={(e) => setAccent(e.target.value)} />
      </Field>
      <Field label="Logo">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadLogo(file);
          }}
        />
        {currentLogo ? (
          <div className="brand-logo-preview">
            <img src={currentLogo} alt="Logo" className="brand-logo-preview-img" />
          </div>
        ) : null}
      </Field>
      <div className="btn-row">
        <Button loading={save.isPending} onClick={() => save.mutate(false)}>
          Guardar apariencia
        </Button>
        <Button variant="ghost" disabled={save.isPending} onClick={() => save.mutate(true)}>
          Restaurar Cerebro
        </Button>
      </div>
    </Section>
  );
}

export default function OrgAdmin() {
  const { orgId = '', adminTab } = useParams();
  const navigate = useNavigate();
  const org = useOrg(orgId);
  const tab: AdminTab = adminTab === 'invitar' || adminTab === 'apariencia' ? adminTab : 'admin';

  if (org.isPending) return <Skeleton lines={8} />;
  if (org.error) return <ErrorState error={org.error} retry={() => void org.refetch()} />;

  return (
    <div>
      <PageHeader
        title="Administración"
        desc={orgDisplayName(org.data.org)}
        actions={
          <Segmented
            ariaLabel="Sección de administración"
            options={[
              { id: 'admin', label: 'General' },
              { id: 'invitar', label: 'Invitar' },
              { id: 'apariencia', label: 'Apariencia' },
            ]}
            value={tab}
            onChange={(t) => navigate(t === 'admin' ? `/org/${orgId}/admin` : `/org/${orgId}/admin/${t}`)}
          />
        }
      />
      {tab === 'admin' ? (
        <>
          <PolicySection orgId={orgId} />
          <JoinRequestsSection orgId={orgId} />
          <MembersSection orgId={orgId} />
        </>
      ) : tab === 'invitar' ? (
        <InviteTab orgId={orgId} />
      ) : (
        <BrandingTab orgId={orgId} />
      )}
    </div>
  );
}
