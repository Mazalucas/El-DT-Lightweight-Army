import {
  createEmitterProfile,
  emitterFromProfile,
  isEmitterComplete,
  profileFromEmitterData,
  type Emitter,
  type EmitterProfile,
} from '../models/emitter';
import type { StorageProvider } from '../storage/provider';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

function readEmitterFromForm(form: HTMLFormElement): Emitter {
  return {
    name: (form.elements.namedItem('name') as HTMLInputElement).value.trim(),
    nif: (form.elements.namedItem('nif') as HTMLInputElement).value.trim(),
    address: (form.elements.namedItem('address') as HTMLTextAreaElement).value.trim(),
    phone: (form.elements.namedItem('phone') as HTMLInputElement).value.trim(),
    iban: (form.elements.namedItem('iban') as HTMLInputElement).value.trim(),
    defaultPaymentMethod: (form.elements.namedItem('defaultPaymentMethod') as HTMLInputElement).value.trim(),
    defaultDueTerms: (form.elements.namedItem('defaultDueTerms') as HTMLInputElement).value.trim(),
    ivaRate: parseFloat((form.elements.namedItem('ivaRate') as HTMLInputElement).value) / 100,
    irpfRate: parseFloat((form.elements.namedItem('irpfRate') as HTMLInputElement).value) / 100,
    internationalLegalNote: (
      form.elements.namedItem('internationalLegalNote') as HTMLTextAreaElement
    ).value.trim(),
  };
}

function fillEmitterForm(form: HTMLFormElement, profile: EmitterProfile): void {
  (form.elements.namedItem('profileLabel') as HTMLInputElement).value = profile.label;
  (form.elements.namedItem('name') as HTMLInputElement).value = profile.name;
  (form.elements.namedItem('nif') as HTMLInputElement).value = profile.nif;
  (form.elements.namedItem('address') as HTMLTextAreaElement).value = profile.address;
  (form.elements.namedItem('phone') as HTMLInputElement).value = profile.phone ?? '';
  (form.elements.namedItem('iban') as HTMLInputElement).value = profile.iban;
  (form.elements.namedItem('ivaRate') as HTMLInputElement).value = String(profile.ivaRate * 100);
  (form.elements.namedItem('irpfRate') as HTMLInputElement).value = String(profile.irpfRate * 100);
  (form.elements.namedItem('defaultPaymentMethod') as HTMLInputElement).value =
    profile.defaultPaymentMethod;
  (form.elements.namedItem('defaultDueTerms') as HTMLInputElement).value = profile.defaultDueTerms;
  (form.elements.namedItem('internationalLegalNote') as HTMLTextAreaElement).value =
    profile.internationalLegalNote;
}

function renderProfileOptions(profiles: EmitterProfile[], activeId: string): string {
  return profiles
    .map(
      (p) =>
        `<option value="${escapeAttr(p.id)}"${p.id === activeId ? ' selected' : ''}>${escapeHtml(p.label)}</option>`,
    )
    .join('');
}

export type EmitterModalContext = {
  storage: StorageProvider;
  getProfiles: () => EmitterProfile[];
  getActiveProfileId: () => string;
  setActive: (profile: EmitterProfile) => void;
  onSave: () => void;
  showToast: (message: string) => void;
};

export async function showEmitterModal(ctx: EmitterModalContext): Promise<void> {
  let profiles = await ctx.storage.listEmitterProfiles();
  let activeId = ctx.getActiveProfileId();
  let active =
    profiles.find((p) => p.id === activeId) ?? profiles[0] ?? createEmitterProfile('Principal');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const renderModalBody = () => {
    const modal = overlay.querySelector('.modal');
    if (!modal) return;
    const select = modal.querySelector('#emitter-profile-select') as HTMLSelectElement | null;
    if (select) {
      select.innerHTML = renderProfileOptions(profiles, active.id);
      select.value = active.id;
    }
    const form = modal.querySelector('#emitter-form') as HTMLFormElement | null;
    if (form) fillEmitterForm(form, active);
    const delBtn = modal.querySelector('#emitter-del-profile') as HTMLButtonElement | null;
    if (delBtn) delBtn.disabled = profiles.length <= 1;
  };

  overlay.innerHTML = `
    <div class="modal modal-wide">
      <h2>Perfiles de emisor</h2>
      <p>Guardá varios emisores y cambiá entre ellos. Los datos quedan solo en este navegador.</p>
      <div class="form-group">
        <label>Perfil activo</label>
        <select id="emitter-profile-select">${renderProfileOptions(profiles, active.id)}</select>
      </div>
      <div class="btn-group btn-group-inline">
        <button type="button" id="emitter-new-profile" class="btn btn-secondary btn-sm">Nuevo</button>
        <button type="button" id="emitter-dup-profile" class="btn btn-secondary btn-sm">Duplicar</button>
        <button type="button" id="emitter-del-profile" class="btn btn-ghost btn-sm" ${
          profiles.length <= 1 ? 'disabled' : ''
        }>Eliminar</button>
      </div>
      <form id="emitter-form">
        <div class="form-group"><label>Nombre del perfil</label><input name="profileLabel" required value="${escapeAttr(active.label)}" placeholder="Ej. Autónomo, SL…" /></div>
        <div class="form-group"><label>Nombre fiscal</label><input name="name" required value="${escapeAttr(active.name)}" /></div>
        <div class="form-group"><label>NIF</label><input name="nif" required value="${escapeAttr(active.nif)}" /></div>
        <div class="form-group"><label>Domicilio</label><textarea name="address" required>${escapeHtml(active.address)}</textarea></div>
        <div class="form-group"><label>Teléfono (opcional)</label><input name="phone" value="${escapeAttr(active.phone ?? '')}" /></div>
        <div class="form-group"><label>IBAN</label><input name="iban" required value="${escapeAttr(active.iban)}" /></div>
        <div class="form-row">
          <div class="form-group"><label>IVA (%)</label><input name="ivaRate" type="number" step="1" value="${active.ivaRate * 100}" /></div>
          <div class="form-group"><label>IRPF (%)</label><input name="irpfRate" type="number" step="1" value="${active.irpfRate * 100}" /></div>
        </div>
        <div class="form-group"><label>Forma de pago por defecto</label><input name="defaultPaymentMethod" value="${escapeAttr(active.defaultPaymentMethod)}" /></div>
        <div class="form-group"><label>Vencimiento por defecto</label><input name="defaultDueTerms" value="${escapeAttr(active.defaultDueTerms)}" /></div>
        <div class="form-group"><label>Nota legal internacional</label><textarea name="internationalLegalNote">${escapeHtml(active.internationalLegalNote)}</textarea></div>
        <div class="btn-group">
          <button type="submit" class="btn">Guardar perfil</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const persistActiveFromForm = async (): Promise<void> => {
    const form = overlay.querySelector('#emitter-form') as HTMLFormElement;
    const label = (form.elements.namedItem('profileLabel') as HTMLInputElement).value.trim();
    const data = readEmitterFromForm(form);
    active = profileFromEmitterData(active.id, label || data.name || 'Perfil', data);
    await ctx.storage.saveEmitterProfile(active);
    profiles = await ctx.storage.listEmitterProfiles();
    ctx.setActive(active);
    renderModalBody();
  };

  overlay.querySelector('#emitter-profile-select')?.addEventListener('change', async (e) => {
    const nextId = (e.target as HTMLSelectElement).value;
    if (nextId === active.id) return;
    await persistActiveFromForm();
    const next = profiles.find((p) => p.id === nextId);
    if (!next) return;
    active = next;
    activeId = next.id;
    await ctx.storage.setActiveEmitterProfileId(next.id);
    ctx.setActive(next);
    renderModalBody();
  });

  overlay.querySelector('#emitter-new-profile')?.addEventListener('click', async () => {
    await persistActiveFromForm();
    const fresh = createEmitterProfile(`Perfil ${profiles.length + 1}`);
    await ctx.storage.saveEmitterProfile(fresh);
    profiles = await ctx.storage.listEmitterProfiles();
    active = fresh;
    await ctx.storage.setActiveEmitterProfileId(fresh.id);
    ctx.setActive(fresh);
    renderModalBody();
    ctx.showToast('Perfil nuevo');
  });

  overlay.querySelector('#emitter-dup-profile')?.addEventListener('click', async () => {
    await persistActiveFromForm();
    const data = emitterFromProfile(active);
    const copy = createEmitterProfile(`${active.label} (copia)`, data);
    await ctx.storage.saveEmitterProfile(copy);
    profiles = await ctx.storage.listEmitterProfiles();
    active = copy;
    await ctx.storage.setActiveEmitterProfileId(copy.id);
    ctx.setActive(copy);
    renderModalBody();
    ctx.showToast('Perfil duplicado');
  });

  overlay.querySelector('#emitter-del-profile')?.addEventListener('click', async () => {
    if (profiles.length <= 1) {
      ctx.showToast('Debe quedar al menos un perfil');
      return;
    }
    const deletedId = active.id;
    await ctx.storage.deleteEmitterProfile(deletedId);
    profiles = await ctx.storage.listEmitterProfiles();
    active = profiles[0]!;
    await ctx.storage.setActiveEmitterProfileId(active.id);
    ctx.setActive(active);
    renderModalBody();
    ctx.showToast('Perfil eliminado');
  });

  overlay.querySelector('#emitter-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const label = (form.elements.namedItem('profileLabel') as HTMLInputElement).value.trim();
    const data = readEmitterFromForm(form);
    active = profileFromEmitterData(active.id, label || data.name || 'Perfil', data);
    await ctx.storage.saveEmitterProfile(active);
    profiles = await ctx.storage.listEmitterProfiles();
    ctx.setActive(active);
    overlay.remove();
    ctx.onSave();
    ctx.showToast(isEmitterComplete(data) ? 'Perfil guardado' : 'Perfil guardado (completá datos fiscales)');
  });
}

export function renderEmitterToolbarOptions(
  profiles: EmitterProfile[],
  activeId: string,
): string {
  if (!profiles.length) return '<option value="">Sin perfiles</option>';
  return profiles
    .map(
      (p) =>
        `<option value="${p.id.replace(/"/g, '&quot;')}"${p.id === activeId ? ' selected' : ''}>${p.label.replace(/</g, '&lt;')}</option>`,
    )
    .join('');
}
