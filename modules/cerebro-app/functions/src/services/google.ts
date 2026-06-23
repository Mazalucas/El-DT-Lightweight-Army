import { Readable } from 'node:stream';
import { google } from 'googleapis';
import { decrypt, encrypt } from '../lib/crypto.js';
import { googleIntegrationRef } from '../lib/firebase.js';
import { buildMarkdownBody, googleDocToParsed } from '../core/profesional/doc-to-parsed.js';

const SCOPES = [
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
];

export function getOAuthClient(redirectUri?: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET must be set');
  }
  const appUrl = process.env.APP_URL || 'http://localhost:5190';
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri || `${appUrl}/api/auth/google/callback`);
}

export function getAuthUrl(state: string): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state,
  });
}

export async function exchangeCode(code: string): Promise<{ refreshToken?: string; accessToken: string; expiryDate?: number }> {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return {
    refreshToken: tokens.refresh_token ?? undefined,
    accessToken: tokens.access_token!,
    expiryDate: tokens.expiry_date ?? undefined,
  };
}

export async function saveGoogleTokens(uid: string, tokens: { refreshToken?: string; accessToken: string; expiryDate?: number }): Promise<void> {
  const existing = await googleIntegrationRef(uid).get();
  const prev = existing.exists ? (existing.data() as { encryptedRefresh?: string }) : {};
  const payload = {
    encryptedAccess: encrypt(tokens.accessToken),
    encryptedRefresh: tokens.refreshToken ? encrypt(tokens.refreshToken) : prev.encryptedRefresh,
    expiryDate: tokens.expiryDate ?? null,
    connectedAt: new Date().toISOString(),
    scopes: SCOPES,
  };
  await googleIntegrationRef(uid).set(payload, { merge: true });
}

export async function revokeGoogle(uid: string): Promise<void> {
  await googleIntegrationRef(uid).delete();
}

export async function hasGoogleIntegration(uid: string): Promise<boolean> {
  const snap = await googleIntegrationRef(uid).get();
  if (!snap.exists) return false;
  const data = snap.data() as { encryptedRefresh?: string; encryptedAccess?: string };
  return Boolean(data.encryptedRefresh || data.encryptedAccess);
}

function decryptGoogleTokens(data: {
  encryptedAccess: string;
  encryptedRefresh?: string;
}): { accessToken: string; refreshToken?: string } {
  try {
    return {
      accessToken: decrypt(data.encryptedAccess),
      refreshToken: data.encryptedRefresh ? decrypt(data.encryptedRefresh) : undefined,
    };
  } catch {
    throw new Error(
      'No se pudieron leer los tokens de Google. Desconectá y volvé a conectar en Ajustes (p. ej. si cambió ENCRYPTION_KEY).',
    );
  }
}

export function formatGoogleApiError(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const msg = e.message;
  if (msg.includes('invalid_grant') || msg.includes('Token has been expired')) {
    return 'Token de Google expirado o revocado. Reconectá Google en Ajustes.';
  }
  const gaxios = e as { response?: { data?: { error?: { message?: string } } } };
  const apiMsg = gaxios.response?.data?.error?.message;
  if (apiMsg) return apiMsg;
  return msg;
}

export async function getGoogleClient(uid: string) {
  const snap = await googleIntegrationRef(uid).get();
  if (!snap.exists) throw new Error('Google not connected');
  const data = snap.data() as {
    encryptedAccess: string;
    encryptedRefresh?: string;
    expiryDate?: number | null;
  };
  const { accessToken, refreshToken } = decryptGoogleTokens(data);
  const client = getOAuthClient();
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: data.expiryDate ?? undefined,
  });
  client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await saveGoogleTokens(uid, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        expiryDate: tokens.expiry_date ?? undefined,
      });
    }
  });
  return client;
}

/** Access token fresco para Google Picker en el cliente. */
export async function getGoogleAccessToken(uid: string): Promise<string> {
  const client = await getGoogleClient(uid);
  const expiry = client.credentials.expiry_date;
  if (expiry && expiry <= Date.now() + 60_000) {
    await client.refreshAccessToken();
  }
  const token = client.credentials.access_token;
  if (!token) throw new Error('No access token available');
  return token;
}

/** Developer key del Picker. Preferir GOOGLE_PICKER_API_KEY; si falta, el cliente puede usar VITE_GOOGLE_PICKER_API_KEY. */
export function getGooglePickerConfig(): { apiKey?: string; appId: string; clientId: string } {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_OAUTH_CLIENT_ID must be set');
  const apiKey = process.env.GOOGLE_PICKER_API_KEY?.trim() || undefined;
  const appId = process.env.GOOGLE_CLOUD_PROJECT_NUMBER?.trim() || clientId.split('-')[0] || '';
  if (!appId) throw new Error('Could not derive Google Cloud project number for Picker appId');
  return { apiKey, appId, clientId };
}

export interface DriveFolderResult {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  parents?: string[];
}

export async function listDriveFolders(
  uid: string,
  parentId = 'root',
  query?: string,
  options?: { sharedWithMe?: boolean },
): Promise<DriveFolderResult[]> {
  const auth = await getGoogleClient(uid);
  const drive = google.drive({ version: 'v3', auth: auth as never });
  let q: string;
  if (options?.sharedWithMe) {
    q = `sharedWithMe and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (query?.trim()) {
      const safe = query.replace(/'/g, "\\'");
      q += ` and name contains '${safe}'`;
    }
  } else {
    q = `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (query?.trim()) {
      const safe = query.replace(/'/g, "\\'");
      q += ` and name contains '${safe}'`;
    }
  }
  // My Drive root: includeItemsFromAllDrives provoca 400 en la API de Google.
  const listParams =
    options?.sharedWithMe || parentId !== 'root'
      ? {
          q,
          fields: 'files(id,name,mimeType,modifiedTime,parents)',
          pageSize: 50,
          orderBy: 'name' as const,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          ...(options?.sharedWithMe ? { corpora: 'user' as const } : {}),
        }
      : {
          q,
          fields: 'files(id,name,mimeType,modifiedTime,parents)',
          pageSize: 50,
          orderBy: 'name' as const,
          corpora: 'user' as const,
        };

  let res;
  try {
    res = await drive.files.list(listParams);
  } catch (e) {
    throw new Error(formatGoogleApiError(e));
  }
  return (res.data.files ?? []).map((f) => ({
    id: f.id!,
    name: f.name!,
    mimeType: f.mimeType!,
    modifiedTime: f.modifiedTime ?? undefined,
    parents: f.parents ?? undefined,
  }));
}

const MEET_FOLDER_HINTS = ['Meet Recordings', 'Shared Meet Recordings', 'Meet Inbox', 'Cerebro'];

export async function suggestMeetFolders(uid: string): Promise<DriveFolderResult[]> {
  const seen = new Set<string>();
  const out: DriveFolderResult[] = [];
  for (const hint of MEET_FOLDER_HINTS) {
    const [owned, shared] = await Promise.all([
      listDriveFolders(uid, 'root', hint).catch(() => []),
      listDriveFolders(uid, 'root', hint, { sharedWithMe: true }).catch(() => []),
    ]);
    for (const f of [...owned, ...shared]) {
      if (!seen.has(f.id)) {
        seen.add(f.id);
        out.push(f);
      }
    }
  }
  return out.slice(0, 20);
}

export interface DrivePermissionEntry {
  email: string;
  name?: string;
  role?: string;
  type?: string;
}

export async function fetchDrivePermissions(uid: string, fileId: string): Promise<DrivePermissionEntry[]> {
  try {
    const auth = await getGoogleClient(uid);
    const drive = google.drive({ version: 'v3', auth: auth as never });
    const res = await drive.permissions.list({
      fileId,
      fields: 'permissions(emailAddress,displayName,type,role)',
      supportsAllDrives: true,
    });
    return (res.data.permissions ?? [])
      .filter((p) => (p.type === 'user' || p.type === 'group') && p.emailAddress)
      .map((p) => ({
        email: String(p.emailAddress).toLowerCase(),
        name: p.displayName ?? undefined,
        role: p.role ?? undefined,
        type: p.type ?? undefined,
      }));
  } catch {
    return [];
  }
}

export async function testDriveFolder(uid: string, folderId: string): Promise<{ ok: boolean; docCount: number; sample: string[] }> {
  const auth = await getGoogleClient(uid);
  const drive = google.drive({ version: 'v3', auth: auth as never });
  const q = `'${folderId}' in parents and trashed=false and (mimeType='application/vnd.google-apps.document' or mimeType='text/plain' or mimeType='text/markdown')`;
  const res = await drive.files.list({
    q,
    fields: 'files(id,name,mimeType)',
    pageSize: 10,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const files = res.data.files ?? [];
  return {
    ok: true,
    docCount: files.length,
    sample: files.slice(0, 5).map((f) => f.name ?? ''),
  };
}

export async function fetchDocParsed(uid: string, docId: string) {
  const auth = await getGoogleClient(uid);
  const docs = google.docs({ version: 'v1', auth: auth as never });
  const doc = await docs.documents.get({ documentId: docId });
  return googleDocToParsed(doc.data);
}

export async function fetchDocText(uid: string, docId: string): Promise<string> {
  const parsed = await fetchDocParsed(uid, docId);
  return buildMarkdownBody(parsed);
}

export async function uploadToDriveFolder(
  uid: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer,
): Promise<string> {
  const auth = await getGoogleClient(uid);
  const drive = google.drive({ version: 'v3', auth: auth as never });
  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: bufferToReadable(buffer),
    },
    fields: 'id',
  });
  return res.data.id!;
}

function bufferToReadable(buffer: Buffer): Readable {
  return Readable.from(buffer);
}
