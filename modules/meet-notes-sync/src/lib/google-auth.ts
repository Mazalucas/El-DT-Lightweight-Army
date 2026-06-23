import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { URL } from 'node:url';
import { google } from 'googleapis';
import type { DocSharedWith } from './doc-to-markdown.js';

const SCOPES = [
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
];

/** Puerto fijo del callback loopback (cliente OAuth Desktop). */
export const OAUTH_CALLBACK_PORT = 53682;

/** Loopback para cliente OAuth Desktop (JSON suele traer solo http://localhost). */
export const OAUTH_REDIRECT_URI = `http://localhost:${OAUTH_CALLBACK_PORT}/oauth2callback`;

function resolveRedirectUri(redirectUris?: string[]): string {
  if (redirectUris?.includes(OAUTH_REDIRECT_URI)) return OAUTH_REDIRECT_URI;
  const legacy127 = `http://127.0.0.1:${OAUTH_CALLBACK_PORT}/oauth2callback`;
  if (redirectUris?.includes(legacy127)) return legacy127;
  // JSON Desktop de Google suele traer solo "http://localhost" → loopback con puerto fijo.
  if (redirectUris?.some((u) => u === 'http://localhost' || u.startsWith('http://localhost'))) {
    return OAUTH_REDIRECT_URI;
  }
  return OAUTH_REDIRECT_URI;
}

export function oauthPaths(moduleRoot: string): {
  credentialsPath: string;
  tokenPath: string;
} {
  const local = path.join(moduleRoot, '.local');
  return {
    credentialsPath: path.join(local, 'google-credentials.json'),
    tokenPath: path.join(local, 'google-token.json'),
  };
}

export function hasGoogleAuth(moduleRoot: string): boolean {
  const { credentialsPath, tokenPath } = oauthPaths(moduleRoot);
  return fs.existsSync(credentialsPath) && fs.existsSync(tokenPath);
}

export async function getAuthenticatedClient(moduleRoot: string) {
  const { credentialsPath, tokenPath } = oauthPaths(moduleRoot);
  if (!fs.existsSync(credentialsPath)) {
    throw new Error(
      'Falta google-credentials.json en modules/meet-notes-sync/.local/ — ver README.',
    );
  }
  const creds = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = creds.installed ?? creds.web ?? {};
  if (!client_id || !client_secret) {
    throw new Error('google-credentials.json inválido (client_id / client_secret).');
  }
  const redirect = resolveRedirectUri(redirect_uris);
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect);

  if (fs.existsSync(tokenPath)) {
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(tokenPath, 'utf8')));
    return oAuth2Client;
  }
  throw new Error('Sin token OAuth. Ejecutá: npm run auth (en meet-notes-sync).');
}

export async function runOAuthFlow(moduleRoot: string): Promise<void> {
  const { credentialsPath, tokenPath } = oauthPaths(moduleRoot);
  fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
  if (!fs.existsSync(credentialsPath)) {
    console.error(`Colocá OAuth Desktop JSON en:\n  ${credentialsPath}`);
    process.exit(1);
  }
  const creds = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = creds.installed ?? creds.web ?? {};
  const redirect = resolveRedirectUri(redirect_uris);
  const port = Number(new URL(redirect).port || 53682);
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url ?? '/', redirect);
        const c = url.searchParams.get('code');
        if (c) {
          res.end('<html><body><h1>OK</h1><p>Podés cerrar esta ventana.</p></body></html>');
          server.close();
          resolve(c);
        } else {
          res.end('Sin código');
        }
      } catch (e) {
        reject(e);
      }
    });
    server.listen(port, () => {
      console.log('\nAbrí esta URL en el navegador:\n');
      console.log(authUrl);
      console.log(`\nEsperando callback en ${redirect} ...\n`);
    });
    server.on('error', reject);
  });

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2), 'utf8');
  console.log(`Token guardado en ${tokenPath}`);
}

export async function fetchGoogleDoc(
  moduleRoot: string,
  docId: string,
): Promise<{ revisionId?: string | null; parsed: import('./doc-to-markdown.js').ParsedDocContent }> {
  const auth = await getAuthenticatedClient(moduleRoot);
  const docs = google.docs({ version: 'v1', auth });
  const res = await docs.documents.get({
    documentId: docId,
    includeTabsContent: true,
  });
  const { googleDocToParsed } = await import('./doc-to-markdown.js');
  return {
    revisionId: res.data.revisionId ?? null,
    parsed: googleDocToParsed(res.data),
  };
}

export async function fetchDrivePermissions(
  moduleRoot: string,
  fileId: string,
): Promise<DocSharedWith[]> {
  try {
    const auth = await getAuthenticatedClient(moduleRoot);
    const drive = google.drive({ version: 'v3', auth });
    const res = await drive.permissions.list({
      fileId,
      fields: 'permissions(emailAddress,displayName,type,role)',
      supportsAllDrives: true,
      includePermissionsForView: 'published',
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
