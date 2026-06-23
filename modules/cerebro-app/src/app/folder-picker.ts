import { api } from '../lib/api.js';
import type { MeetSourceConfig, MeetSourceType, Team, UserAppSettings } from '@shared/types.js';
import { toast, escapeHtml } from '../lib/ui.js';
import { icon } from '../ui/icons.js';
import { button } from '../ui/primitives.js';
import { openGoogleDriveFolderPicker } from '../lib/google-drive-picker.js';
import { SOURCE_TYPE_LABELS } from './profesional-setup.js';

export interface FolderPickerMount {
  el: HTMLElement;
  getFolderId: () => string;
  setFolderId: (id: string, label?: string) => void;
}

export interface PendingFolderSource {
  id: string;
  name: string;
}

export interface FolderPickerOptions {
  defaultSourceType?: MeetSourceType;
  lockSourceType?: boolean;
  pickerButtonLabel?: string;
  /** Paso 2: solo Drive picker, fuentes numeradas, sin tipo/equipo. */
  multiSourceLayout?: boolean;
  showConfiguredSources?: boolean;
  configuredSourceFilter?: (source: MeetSourceConfig) => boolean;
}

export interface FolderPickerHandlers {
  onAdd: (
    folderId: string,
    label: string,
    sourceType: MeetSourceType,
    teamId?: string,
  ) => Promise<UserAppSettings | void>;
  onAddBatch?: (items: Array<{ folderId: string; label: string; sourceType: MeetSourceType; teamId?: string }>) => Promise<void>;
  onRemoveConfigured?: (globalIndex: number) => Promise<UserAppSettings | void>;
}

function normalizeMeetSources(sources: MeetSourceConfig[] | undefined): MeetSourceConfig[] {
  return Array.isArray(sources) ? sources : [];
}

function defaultConfiguredFilter(source: MeetSourceConfig): boolean {
  return source.sourceType === 'primary' || source.sourceType === 'team' || !source.sourceType;
}

export function mountFolderPicker(
  host: HTMLElement,
  getConfig: () => UserAppSettings,
  handlers: FolderPickerHandlers,
  options: FolderPickerOptions = {},
): FolderPickerMount {
  const pending: PendingFolderSource[] = [];
  const multi = options.multiSourceLayout === true;
  const saveSourceType = options.defaultSourceType ?? 'primary';

  host.className = 'folder-picker';
  host.innerHTML = multi
    ? `
    <div id="fp-configured" class="folder-source-section">
      <h4 class="folder-source-heading">Fuentes de transcripciones</h4>
      <p class="muted" style="margin-bottom:var(--space-2)">
        En Drive, entrá a la carpeta y pulsá <strong>Seleccionar</strong> (abajo). Un clic en una fila solo abre la carpeta.
      </p>
      <div id="fp-sources-empty" class="muted" hidden>Sin carpetas todavía.</div>
      <ol id="fp-sources-list" class="folder-source-list"></ol>
      <div id="fp-add-controls" class="btn-row" style="margin-top:var(--space-3)"></div>
      <div id="fp-test-row" class="btn-row" style="margin-top:var(--space-2)"></div>
      <details class="folder-picker-fallback" style="margin-top:var(--space-4)">
        <summary class="muted">Pegar Folder ID manualmente</summary>
        <div class="grid-2" style="margin-top:var(--space-3)">
          <div class="field"><label for="fp-folder-id">Folder ID</label><input id="fp-folder-id" placeholder="ID de carpeta" /></div>
          <div class="field"><label for="fp-label">Nombre</label><input id="fp-label" placeholder="Meet Recordings" /></div>
        </div>
        <div class="btn-row" style="margin-top:var(--space-2)">
          <button type="button" class="btn btn-secondary btn-sm" id="fp-manual-add">Añadir por ID</button>
        </div>
      </details>
    </div>
  `
    : `
    <p class="muted" style="margin-bottom:var(--space-3)">
      Abrí Google Drive y navegá carpeta a carpeta (como en Mi unidad). Podés elegir una o varias carpetas
      con tus documentos «Notas de Gemini».
    </p>
    <div id="fp-toolbar" class="btn-row" style="margin-bottom:var(--space-3)"></div>
    <div id="fp-pending" class="folder-picker-pending" hidden></div>
    <div class="grid-2">
      <div class="field">
        <label for="fp-source-type">Tipo de fuente</label>
        <select id="fp-source-type" ${options.lockSourceType ? 'disabled' : ''}>
          <option value="primary">${SOURCE_TYPE_LABELS.primary}</option>
          <option value="team">${SOURCE_TYPE_LABELS.team}</option>
          <option value="shared_inbox">${SOURCE_TYPE_LABELS.shared_inbox}</option>
        </select>
      </div>
      <div class="field">
        <label for="fp-team">Equipo (opcional)</label>
        <select id="fp-team"><option value="">—</option></select>
      </div>
    </div>
    <div id="fp-actions" class="btn-row" style="margin-top:var(--space-3)"></div>
    <details class="folder-picker-fallback" style="margin-top:var(--space-4)">
      <summary class="muted">Pegar Folder ID manualmente</summary>
      <div class="grid-2" style="margin-top:var(--space-3)">
        <div class="field"><label for="fp-folder-id">Folder ID</label><input id="fp-folder-id" placeholder="ID de carpeta" /></div>
        <div class="field"><label for="fp-label">Etiqueta</label><input id="fp-label" placeholder="Meet Recordings" /></div>
      </div>
      <div class="btn-row" style="margin-top:var(--space-2)">
        <button type="button" class="btn btn-secondary btn-sm" id="fp-manual-add">Añadir por ID</button>
      </div>
    </details>
  `;

  if (!multi) {
    if (options.defaultSourceType) {
      (host.querySelector('#fp-source-type') as HTMLSelectElement).value = options.defaultSourceType;
    }
    const teamSelect = host.querySelector('#fp-team') as HTMLSelectElement;
    getConfig().teams.forEach((t: Team) => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      teamSelect.appendChild(opt);
    });
  }

  const sourcesListEl = host.querySelector('#fp-sources-list') as HTMLElement | null;
  const sourcesEmptyEl = host.querySelector('#fp-sources-empty') as HTMLElement | null;
  const addControlsEl = host.querySelector('#fp-add-controls') as HTMLElement | null;
  const testRowEl = host.querySelector('#fp-test-row') as HTMLElement | null;
  const pendingEl = host.querySelector('#fp-pending') as HTMLElement | null;

  function getSourceType(): MeetSourceType {
    return (host.querySelector('#fp-source-type') as HTMLSelectElement)?.value as MeetSourceType ?? saveSourceType;
  }

  function getTeamId(): string | undefined {
    return (host.querySelector('#fp-team') as HTMLSelectElement)?.value.trim() || undefined;
  }

  function configuredEntries(): Array<{ s: MeetSourceConfig; globalIndex: number }> {
    const config = getConfig();
    const filter = options.configuredSourceFilter ?? defaultConfiguredFilter;
    return normalizeMeetSources(config.meetSources)
      .map((s, globalIndex) => ({ s, globalIndex }))
      .filter(({ s }) => filter(s));
  }

  function isDuplicate(folderId: string): boolean {
    const config = getConfig();
    const filter = options.configuredSourceFilter ?? defaultConfiguredFilter;
    if (!multi && pending.some((p) => p.id === folderId)) return true;
    return normalizeMeetSources(config.meetSources).some((s) => s.driveFolderId === folderId && filter(s));
  }

  async function persistFolder(folderId: string, label: string): Promise<void> {
    const saved = await handlers.onAdd(folderId, label || folderId, saveSourceType, undefined);
    if (saved && !normalizeMeetSources(saved.meetSources).some((s) => s.driveFolderId === folderId)) {
      throw new Error('El servidor no confirmó la carpeta guardada');
    }
    renderTranscriptionSources();
  }

  function renderSourceCard(
    listItem: HTMLLIElement,
    index: number,
    folder: { id: string; name: string },
    onRemove: () => void,
  ): void {
    listItem.className = 'folder-source-item';
    const card = document.createElement('div');
    card.className = 'folder-source-card folder-source-card--compact';
    card.innerHTML = `
      <span class="folder-source-num" aria-hidden="true">${index + 1}</span>
      <div class="folder-source-body">
        <span class="folder-source-name">${icon('folder')} ${escapeHtml(folder.name)}</span>
        <code class="folder-source-id">${escapeHtml(folder.id)}</code>
      </div>
    `;
    card.appendChild(
      button('Quitar', {
        variant: 'ghost',
        size: 'sm',
        onClick: onRemove,
      }),
    );
    listItem.appendChild(card);
  }

  function renderTranscriptionSources(): void {
    if (!multi || !sourcesListEl || !addControlsEl || !sourcesEmptyEl || !testRowEl) return;

    const entries = configuredEntries();
    sourcesListEl.replaceChildren();
    sourcesEmptyEl.hidden = entries.length > 0;

    entries.forEach(({ s, globalIndex }, i) => {
      const li = document.createElement('li');
      renderSourceCard(li, i, { id: s.driveFolderId, name: s.label }, () => {
        if (!handlers.onRemoveConfigured) return;
        void handlers.onRemoveConfigured(globalIndex).then(() => renderTranscriptionSources());
      });
      sourcesListEl.appendChild(li);
    });

    addControlsEl.replaceChildren(
      button(entries.length === 0 ? 'Añadir una fuente en Drive' : 'Añadir otra fuente en Drive', {
        variant: entries.length === 0 ? 'primary' : 'secondary',
        onClick: () => void openPickerAndSave(),
      }),
    );

    testRowEl.replaceChildren();
    if (entries.length > 0) {
      const last = entries[entries.length - 1].s;
      testRowEl.appendChild(
        button('Probar última fuente', {
          variant: 'ghost',
          size: 'sm',
          onClick: async () => {
            try {
              const r = await api.testFolder(last.driveFolderId);
              toast(`OK — ${r.docCount} documentos «Notas de Gemini»`);
            } catch (e) {
              toast(e instanceof Error ? e.message : 'Error', 'error');
            }
          },
        }),
      );
    }
  }

  async function openPickerAndSave(): Promise<void> {
    try {
      const picked = await openGoogleDriveFolderPicker({
        title: 'Elegir carpeta de transcripciones',
        multiSelect: false,
      });
      if (!picked.length) {
        toast('Seleccioná la carpeta y pulsá «Seleccionar» en la barra inferior del picker', 'info');
        return;
      }
      const folder = picked[0];
      if (!folder?.id) {
        toast('La carpeta seleccionada no tiene ID válido', 'error');
        return;
      }
      if (isDuplicate(folder.id)) {
        toast('Esa carpeta ya es una fuente de transcripciones', 'info');
        return;
      }
      await persistFolder(folder.id, folder.name);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo abrir Google Drive', 'error');
    }
  }

  function renderPendingSimple(): void {
    if (multi || !pendingEl) return;
    if (!pending.length) {
      pendingEl.hidden = true;
      pendingEl.replaceChildren();
      return;
    }
    pendingEl.hidden = false;
    pendingEl.replaceChildren();
    const title = document.createElement('p');
    title.className = 'muted';
    title.style.marginBottom = 'var(--space-2)';
    title.textContent = `${pending.length} carpeta(s) seleccionada(s):`;
    pendingEl.appendChild(title);
    pending.forEach((folder, index) => {
      const row = document.createElement('div');
      row.className = 'folder-picker-row';
      row.innerHTML = `<span>${icon('folder')}<span>${escapeHtml(folder.name)}</span></span>`;
      row.appendChild(
        button('Quitar', {
          variant: 'ghost',
          size: 'sm',
          onClick: () => {
            pending.splice(index, 1);
            renderPendingSimple();
          },
        }),
      );
      pendingEl.appendChild(row);
    });
  }

  async function openPickerSimple(title: string, multiSelect: boolean): Promise<void> {
    try {
      const picked = await openGoogleDriveFolderPicker({ title, multiSelect });
      if (!picked.length) return;
      let added = 0;
      for (const folder of picked) {
        if (isDuplicate(folder.id)) continue;
        pending.push(folder);
        added++;
      }
      if (added === 0) {
        toast('Esas carpetas ya están en la lista', 'info');
        return;
      }
      renderPendingSimple();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo abrir Google Drive', 'error');
    }
  }

  async function savePending(): Promise<void> {
    if (!pending.length) {
      toast('Elegí al menos una carpeta en Google Drive', 'error');
      return;
    }
    const sourceType = getSourceType();
    const teamId = getTeamId();
    const items = pending.map((folder) => ({
      folderId: folder.id,
      label: folder.name,
      sourceType,
      teamId,
    }));

    if (handlers.onAddBatch) {
      await handlers.onAddBatch(items);
    } else {
      for (const item of items) {
        await handlers.onAdd(item.folderId, item.label, item.sourceType, item.teamId);
      }
    }
    pending.length = 0;
    renderPendingSimple();
  }

  const toolbarEl = host.querySelector('#fp-toolbar');
  if (toolbarEl) {
    toolbarEl.appendChild(
      button(options.pickerButtonLabel ?? 'Abrir Google Drive', {
        onClick: () =>
          void openPickerSimple(
            options.pickerButtonLabel ?? 'Seleccionar carpetas en Google Drive',
            true,
          ),
      }),
    );
  }

  const actionsEl = host.querySelector('#fp-actions');
  if (actionsEl) {
    actionsEl.append(
      button('Añadir seleccionadas', {
        onClick: () => void savePending(),
      }),
      button('Probar primera', {
        variant: 'secondary',
        onClick: async () => {
          const id = pending[0]?.id || getFolderId();
          if (!id) return;
          try {
            const r = await api.testFolder(id);
            toast(`OK — ${r.docCount} documentos «Notas de Gemini»`);
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error', 'error');
          }
        },
      }),
    );
  }

  host.querySelector('#fp-manual-add')?.addEventListener('click', async () => {
    const folderId = getFolderId();
    const label = (host.querySelector('#fp-label') as HTMLInputElement).value.trim() || 'Meet';
    if (!folderId) {
      toast('Pegá un Folder ID', 'error');
      return;
    }
    if (isDuplicate(folderId)) {
      toast('Esa carpeta ya está configurada', 'info');
      return;
    }
    try {
      if (multi) {
        await persistFolder(folderId, label);
      } else {
        await handlers.onAdd(folderId, label, getSourceType(), getTeamId());
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    }
  });

  function getFolderId(): string {
    return (host.querySelector('#fp-folder-id') as HTMLInputElement)?.value.trim() ?? '';
  }

  function setFolderId(id: string, label?: string): void {
    const idInput = host.querySelector('#fp-folder-id') as HTMLInputElement | null;
    const labelInput = host.querySelector('#fp-label') as HTMLInputElement | null;
    if (idInput) idInput.value = id;
    if (label && labelInput) labelInput.value = label;
  }

  if (multi) {
    renderTranscriptionSources();
  }

  return { el: host, getFolderId, setFolderId };
}
