import { api } from './api.js';

export interface PickedDriveFolder {
  id: string;
  name: string;
}

declare global {
  interface Window {
    gapi?: {
      load: (name: string, options: { callback: () => void }) => void;
    };
    google?: {
      picker: {
        Action: { PICKED: string; CANCEL: string };
        Feature: { MULTISELECT_ENABLED: string; SUPPORT_DRIVES: string };
        ViewId: { FOLDERS: string; DOCS: string };
        DocsViewMode: { LIST: string; GRID: string };
        DocsView: new (viewId?: string) => GooglePickerDocsView;
        PickerBuilder: new () => GooglePickerBuilder;
        Response: { DOCUMENTS: string; ACTION: string };
        Document: { ID: string; NAME: string; MIME_TYPE: string; URL: string };
      };
    };
  }
}

interface GooglePickerDocsView {
  setIncludeFolders: (v: boolean) => GooglePickerDocsView;
  setSelectFolderEnabled: (v: boolean) => GooglePickerDocsView;
  setMimeTypes: (v: string) => GooglePickerDocsView;
  setEnableDrives: (v: boolean) => GooglePickerDocsView;
  setOwnedByMe: (v: boolean) => GooglePickerDocsView;
  setParent: (parentId: string) => GooglePickerDocsView;
  setMode: (mode: string) => GooglePickerDocsView;
  setLabel: (v: string) => GooglePickerDocsView;
}

interface GooglePickerBuilder {
  addView: (view: GooglePickerDocsView) => GooglePickerBuilder;
  enableFeature: (feature: string) => GooglePickerBuilder;
  setOAuthToken: (token: string) => GooglePickerBuilder;
  setDeveloperKey: (key: string) => GooglePickerBuilder;
  setAppId: (appId: string) => GooglePickerBuilder;
  setOrigin: (origin: string) => GooglePickerBuilder;
  setTitle: (title: string) => GooglePickerBuilder;
  setCallback: (cb: (data: GooglePickerResponse) => void) => GooglePickerBuilder;
  build: () => { setVisible: (v: boolean) => void };
}

interface GooglePickerResponse {
  action?: string;
  docs?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

function extractIdFromUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url) return null;
  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch?.[1]) return folderMatch[1];
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return idMatch?.[1] ?? null;
}

function normalizeDocList(raw: unknown): Array<Record<string, unknown>> {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
  if (typeof raw === 'object') return [raw as Record<string, unknown>];
  return [];
}

function docToFolder(doc: Record<string, unknown>): PickedDriveFolder | null {
  const gPicker = window.google?.picker;
  const idKey = gPicker?.Document?.ID ?? 'id';
  const nameKey = gPicker?.Document?.NAME ?? 'name';
  const urlKey = gPicker?.Document?.URL ?? 'url';

  const id =
    (typeof doc.id === 'string' && doc.id) ||
    (typeof doc[idKey] === 'string' && (doc[idKey] as string)) ||
    extractIdFromUrl(doc[urlKey]) ||
    extractIdFromUrl(doc.url);

  if (!id) return null;

  const name =
    (typeof doc.name === 'string' && doc.name) ||
    (typeof doc[nameKey] === 'string' && (doc[nameKey] as string)) ||
    id;

  return { id, name };
}

function collectDocLists(data: GooglePickerResponse): Array<Record<string, unknown>> {
  const gPicker = window.google?.picker;
  const lists: unknown[] = [data.docs];
  if (gPicker?.Response?.DOCUMENTS) {
    lists.push(data[gPicker.Response.DOCUMENTS]);
  }
  for (const value of Object.values(data)) {
    if (Array.isArray(value)) lists.push(value);
  }

  const merged: Array<Record<string, unknown>> = [];
  for (const list of lists) {
    merged.push(...normalizeDocList(list));
  }
  return merged;
}

function parsePickerDocs(data: GooglePickerResponse): PickedDriveFolder[] {
  const seen = new Set<string>();
  const folders: PickedDriveFolder[] = [];
  for (const doc of collectDocLists(data)) {
    const folder = docToFolder(doc);
    if (folder && !seen.has(folder.id)) {
      seen.add(folder.id);
      folders.push(folder);
    }
  }
  return folders;
}

function getPickerAction(data: GooglePickerResponse): string {
  const gPicker = window.google?.picker;
  const raw = data.action ?? (gPicker?.Response?.ACTION ? data[gPicker.Response.ACTION] : undefined);
  return String(raw ?? '').toLowerCase();
}

function isPickerPicked(data: GooglePickerResponse): boolean {
  const gPicker = window.google?.picker;
  const action = getPickerAction(data);
  const picked = gPicker?.Action?.PICKED?.toLowerCase() ?? 'picked';
  return action === picked || action === 'picked';
}

function isPickerCancel(data: GooglePickerResponse): boolean {
  const gPicker = window.google?.picker;
  const action = getPickerAction(data);
  const cancel = gPicker?.Action?.CANCEL?.toLowerCase() ?? 'cancel';
  return action === cancel || action === 'cancel';
}

const FOLDER_MIME = 'application/vnd.google-apps.folder';
let pickerApiReady: Promise<void> | null = null;

/** Developer key del Picker (pública). */
function resolvePickerApiKey(serverKey?: string): string {
  const key =
    serverKey?.trim() ||
    import.meta.env.VITE_GOOGLE_PICKER_API_KEY?.trim() ||
    import.meta.env.VITE_FIREBASE_API_KEY?.trim();
  if (!key) {
    throw new Error(
      'Falta API key para Google Picker. Creá una Browser key en GCP con Google Picker API y configurá GOOGLE_PICKER_API_KEY (Functions) o VITE_GOOGLE_PICKER_API_KEY (build).',
    );
  }
  return key;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(script);
  });
}

async function ensurePickerApi(): Promise<void> {
  if (!pickerApiReady) {
    pickerApiReady = (async () => {
      await loadScript('https://apis.google.com/js/api.js');
      await new Promise<void>((resolve, reject) => {
        if (!window.gapi) {
          reject(new Error('Google API no disponible'));
          return;
        }
        window.gapi.load('picker', {
          callback: () => resolve(),
        });
      });
    })();
  }
  await pickerApiReady;
}

function buildMyDriveView(gPicker: NonNullable<Window['google']>['picker']): GooglePickerDocsView {
  const mode = gPicker.DocsViewMode?.LIST;
  const view = new gPicker.DocsView()
    .setIncludeFolders(true)
    .setSelectFolderEnabled(true)
    .setOwnedByMe(true)
    .setParent('root')
    .setLabel('Mi unidad');
  if (mode) view.setMode(mode);
  return view;
}

function buildSharedDrivesView(gPicker: NonNullable<Window['google']>['picker']): GooglePickerDocsView {
  const mode = gPicker.DocsViewMode?.LIST;
  const view = new gPicker.DocsView()
    .setEnableDrives(true)
    .setIncludeFolders(true)
    .setSelectFolderEnabled(true)
    .setLabel('Unidades compartidas');
  if (mode) view.setMode(mode);
  return view;
}

function buildSharedWithMeView(gPicker: NonNullable<Window['google']>['picker']): GooglePickerDocsView {
  const mode = gPicker.DocsViewMode?.LIST;
  const view = new gPicker.DocsView()
    .setOwnedByMe(false)
    .setIncludeFolders(true)
    .setSelectFolderEnabled(true)
    .setLabel('Compartidos conmigo');
  if (mode) view.setMode(mode);
  return view;
}

function pickerOrigin(): string {
  return `${window.location.protocol}//${window.location.host}`;
}

export async function openGoogleDriveFolderPicker(options?: {
  title?: string;
  /** false = una carpeta por apertura del picker */
  multiSelect?: boolean;
}): Promise<PickedDriveFolder[]> {
  if (!window.google?.picker) {
    await ensurePickerApi();
  }
  const gPicker = window.google?.picker;
  if (!gPicker) throw new Error('Google Picker no disponible');

  const config = await api.googlePickerConfig();
  const apiKey = resolvePickerApiKey(config.apiKey);

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (folders: PickedDriveFolder[]) => {
      if (settled) return;
      settled = true;
      resolve(folders);
    };

    try {
      const builder = new gPicker.PickerBuilder();
      if (options?.multiSelect !== false) {
        builder.enableFeature(gPicker.Feature.MULTISELECT_ENABLED);
      }
      builder
        .enableFeature(gPicker.Feature.SUPPORT_DRIVES)
        .addView(buildMyDriveView(gPicker))
        .addView(buildSharedDrivesView(gPicker))
        .addView(buildSharedWithMeView(gPicker))
        .setOAuthToken(config.accessToken)
        .setDeveloperKey(apiKey)
        .setAppId(config.appId)
        .setOrigin(pickerOrigin())
        .setTitle(options?.title ?? 'Seleccionar carpetas en Google Drive')
        .setCallback((data: GooglePickerResponse) => {
          if (isPickerCancel(data)) {
            finish([]);
            return;
          }
          if (!isPickerPicked(data)) {
            return;
          }
          finish(parsePickerDocs(data));
        });

      builder.build().setVisible(true);
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}
