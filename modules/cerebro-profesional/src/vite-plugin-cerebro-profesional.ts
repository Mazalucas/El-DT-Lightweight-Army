import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';
import { readStoreSavedAt, scanDashboardData } from './server/dashboard-scan';

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c as Buffer));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

export function cerebroProfesionalPlugin(
  moduleRoot: string,
  repoRoot: string,
): Plugin {
  const meetSyncRoot = path.join(repoRoot, 'modules/meet-notes-sync');
  let syncChild: ChildProcess | null = null;

  return {
    name: 'cerebro-profesional-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url ?? '';
        if (!rawUrl.startsWith('/api/')) return next();
        const pathname = rawUrl.split('?')[0];

        try {
          if (pathname === '/api/status' && req.method === 'GET') {
            const local = path.join(moduleRoot, '.local');
            const mirror = path.join(local, 'mirror');
            const manifest = path.join(local, 'manifest.jsonl');
            let mirrorCount = 0;
            if (fs.existsSync(mirror)) {
              mirrorCount = fs.readdirSync(mirror).filter((f) => f.endsWith('.md')).length;
            }
            let manifestCount = 0;
            if (fs.existsSync(manifest)) {
              manifestCount = fs.readFileSync(manifest, 'utf8').split('\n').filter(Boolean).length;
            }
            const progress = readProgressFile(repoRoot);
            sendJson(res, 200, {
              mirrorCount,
              manifestCount,
              hasOAuth: oauthReady(meetSyncRoot),
              syncRunning: Boolean(syncChild),
              syncProgress: progress,
            });
            return;
          }

          if (pathname === '/api/sync/progress' && req.method === 'GET') {
            sendJson(res, 200, {
              running: Boolean(syncChild),
              ...readProgressFile(repoRoot),
            });
            return;
          }

          if (pathname === '/api/scan' && req.method === 'POST') {
            const result = await runMeetSyncCli(meetSyncRoot, repoRoot, ['--scan-only']);
            sendJson(res, 200, result);
            return;
          }

          if (pathname === '/api/sync/run' && req.method === 'POST') {
            if (syncChild) {
              sendJson(res, 409, { error: 'sync_already_running', ...readProgressFile(repoRoot) });
              return;
            }
            const body = (await readJsonBody(req).catch(() => ({}))) as { limit?: number };
            const args = ['tsx', path.join(meetSyncRoot, 'src/cli.ts')];
            if (body.limit) args.push(`--limit=${body.limit}`);

            writeProgressIdleStart(repoRoot);

            syncChild = spawn('npx', args, {
              cwd: meetSyncRoot,
              stdio: ['ignore', 'pipe', 'pipe'],
            });

            syncChild.stderr?.on('data', (chunk: Buffer) => {
              process.stdout.write(chunk);
            });
            syncChild.stdout?.on('data', (chunk: Buffer) => {
              process.stdout.write(chunk);
            });

            syncChild.on('close', () => {
              syncChild = null;
            });

            sendJson(res, 202, { started: true, message: 'Sync en segundo plano; consultá /api/sync/progress' });
            return;
          }

          if (pathname === '/api/dashboard/meta' && req.method === 'GET') {
            const scan = scanDashboardData(moduleRoot);
            const progress = readProgressFile(repoRoot);
            sendJson(res, 200, {
              mirrorCount: scan.mirrorCount,
              lastMirrorSync: scan.lastMirrorSync,
              storeSavedAt: readStoreSavedAt(moduleRoot),
              syncRunning: Boolean(syncChild),
              syncPhase: typeof progress.phase === 'string' ? progress.phase : undefined,
              todoCount: scan.todos.length,
            });
            return;
          }

          if (pathname === '/api/dashboard/todos' && req.method === 'GET') {
            const scan = scanDashboardData(moduleRoot);
            sendJson(res, 200, { items: scan.todos });
            return;
          }

          if (pathname === '/api/store/snapshot' && req.method === 'GET') {
            const file = path.join(moduleRoot, '.local/cerebro-store.json');
            if (!fs.existsSync(file)) {
              sendJson(res, 200, { snapshot: null });
              return;
            }
            sendJson(res, 200, { snapshot: JSON.parse(fs.readFileSync(file, 'utf8')) });
            return;
          }

          if (pathname === '/api/store/snapshot' && req.method === 'POST') {
            const body = (await readJsonBody(req)) as {
              meetings?: unknown[];
              version?: number;
              savedAt?: string;
            };
            const dir = path.join(moduleRoot, '.local');
            fs.mkdirSync(dir, { recursive: true });
            const file = path.join(dir, 'cerebro-store.json');
            const payload = {
              ...(body as object),
              version: body.version === 1 || body.version === 2 || body.version === 3 ? body.version : 3,
              savedAt: body.savedAt ?? new Date().toISOString(),
            };
            const json = JSON.stringify(payload);
            const tmp = `${file}.tmp`;
            fs.writeFileSync(tmp, json, 'utf8');
            fs.renameSync(tmp, file);
            sendJson(res, 200, {
              ok: true,
              meetings: (payload as { meetings?: unknown[] }).meetings?.length ?? 0,
              savedAt: payload.savedAt,
            });
            return;
          }

          if (pathname === '/api/todos/dismiss-all-suggestions' && req.method === 'POST') {
            const file = path.join(moduleRoot, '.local/cerebro-store.json');
            if (!fs.existsSync(file)) {
              sendJson(res, 200, { ok: true, dismissed: 0, message: 'Sin snapshot en disco' });
              return;
            }
            const snapshot = JSON.parse(fs.readFileSync(file, 'utf8')) as {
              todos?: Array<{ status?: string; updatedAt?: string }>;
              savedAt?: string;
            };
            const now = new Date().toISOString();
            let dismissed = 0;
            const todos = snapshot.todos ?? [];
            for (const todo of todos) {
              if (todo.status === 'suggested') {
                todo.status = 'dismissed';
                todo.updatedAt = now;
                dismissed++;
              }
            }
            if (dismissed > 0) {
              snapshot.savedAt = now;
              const json = JSON.stringify(snapshot);
              const tmp = `${file}.tmp`;
              fs.writeFileSync(tmp, json, 'utf8');
              fs.renameSync(tmp, file);
            }
            sendJson(res, 200, { ok: true, dismissed, total: todos.length });
            return;
          }

          if (pathname === '/api/mirror/stats' && req.method === 'GET') {
            const mirror = path.join(moduleRoot, '.local/mirror');
            let total = 0;
            let stubs = 0;
            if (fs.existsSync(mirror)) {
              for (const f of fs.readdirSync(mirror)) {
                if (!f.endsWith('.md')) continue;
                total++;
                const raw = fs.readFileSync(path.join(mirror, f), 'utf8');
                if (raw.includes('## Pendiente de contenido')) stubs++;
              }
            }
            sendJson(res, 200, { total, stubs, withContent: total - stubs });
            return;
          }

          if (pathname === '/api/mirror/list' && req.method === 'GET') {
            const mirror = path.join(moduleRoot, '.local/mirror');
            if (!fs.existsSync(mirror)) {
              sendJson(res, 200, { files: [] });
              return;
            }
            const files = fs
              .readdirSync(mirror)
              .filter((f) => f.endsWith('.md'))
              .map((f) => f.replace(/\.md$/, ''));
            sendJson(res, 200, { files });
            return;
          }

          if (pathname.startsWith('/api/mirror/') && req.method === 'GET') {
            const id = decodeURIComponent(pathname.slice('/api/mirror/'.length));
            const file = path.join(moduleRoot, '.local/mirror', `${id}.md`);
            if (!fs.existsSync(file)) {
              sendJson(res, 404, { error: 'not_found' });
              return;
            }
            sendJson(res, 200, { id, content: fs.readFileSync(file, 'utf8') });
            return;
          }

          if (pathname === '/api/process-all' && req.method === 'POST') {
            const script = path.join(moduleRoot, 'scripts/process-all-meetings.mjs');
            const child = spawn('node', [script], { cwd: moduleRoot });
            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (c) => {
              stdout += c;
            });
            child.stderr.on('data', (c) => {
              stderr += c;
            });
            child.on('close', (code) => {
              if (code !== 0) {
                sendJson(res, 500, { error: stderr || `exit ${code}` });
                return;
              }
              try {
                const stats = JSON.parse(stdout.trim().split('\n').pop() ?? '{}');
                sendJson(res, 200, stats);
              } catch {
                sendJson(res, 200, { raw: stdout });
              }
            });
            return;
          }

          if (pathname === '/api/analysis-inbox/pending' && req.method === 'GET') {
            const inbox = analysisInboxPath(moduleRoot);
            const lines = fs.existsSync(inbox)
              ? fs.readFileSync(inbox, 'utf8').split('\n').filter(Boolean)
              : [];
            const items = lines.map((l) => JSON.parse(l));
            sendJson(res, 200, { items });
            return;
          }

          if (pathname === '/api/reminders-inbox/pending' && req.method === 'GET') {
            const inbox = remindersInboxPath(moduleRoot);
            const lines = fs.existsSync(inbox)
              ? fs.readFileSync(inbox, 'utf8').split('\n').filter(Boolean)
              : [];
            const items = lines.map((l) => JSON.parse(l));
            sendJson(res, 200, { items });
            return;
          }

          if (pathname === '/api/reminders-inbox/ack' && req.method === 'POST') {
            const body = (await readJsonBody(req)) as { ids?: string[] };
            const ids = new Set(body.ids ?? []);
            const inbox = remindersInboxPath(moduleRoot);
            if (!fs.existsSync(inbox)) {
              sendJson(res, 200, { acked: 0 });
              return;
            }
            const kept: string[] = [];
            let acked = 0;
            for (const line of fs.readFileSync(inbox, 'utf8').split('\n').filter(Boolean)) {
              try {
                const row = JSON.parse(line) as { id?: string };
                if (row.id && ids.has(row.id)) acked++;
                else kept.push(line);
              } catch {
                kept.push(line);
              }
            }
            fs.writeFileSync(inbox, kept.join('\n') + (kept.length ? '\n' : ''), 'utf8');
            sendJson(res, 200, { acked });
            return;
          }

          if (pathname === '/api/analysis-inbox/ack' && req.method === 'POST') {
            const body = (await readJsonBody(req)) as { ids?: string[] };
            const ids = new Set(body.ids ?? []);
            const inbox = analysisInboxPath(moduleRoot);
            if (!fs.existsSync(inbox)) {
              sendJson(res, 200, { acked: 0 });
              return;
            }
            const kept: string[] = [];
            let acked = 0;
            for (const line of fs.readFileSync(inbox, 'utf8').split('\n').filter(Boolean)) {
              try {
                const row = JSON.parse(line) as { id?: string };
                if (row.id && ids.has(row.id)) acked++;
                else kept.push(line);
              } catch {
                kept.push(line);
              }
            }
            fs.writeFileSync(inbox, kept.join('\n') + (kept.length ? '\n' : ''), 'utf8');
            sendJson(res, 200, { acked });
            return;
          }

          sendJson(res, 404, { error: 'not_found' });
        } catch (e) {
          sendJson(res, 500, {
            error: e instanceof Error ? e.message : String(e),
          });
        }
      });
    },
  };
}

function progressPath(repoRoot: string): string {
  return path.join(repoRoot, 'modules/cerebro-profesional/.local/sync-progress.json');
}

function readProgressFile(repoRoot: string): Record<string, unknown> {
  const file = progressPath(repoRoot);
  if (!fs.existsSync(file)) {
    return { phase: 'idle', current: 0, total: 0, done: true };
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
  } catch {
    return { phase: 'idle', current: 0, total: 0, done: true };
  }
}

function writeProgressIdleStart(repoRoot: string): void {
  const file = progressPath(repoRoot);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    JSON.stringify({
      phase: 'scan',
      current: 0,
      total: 0,
      done: false,
      startedAt: new Date().toISOString(),
      currentTitle: 'Iniciando…',
    }),
    'utf8',
  );
}

function oauthReady(meetSyncRoot: string): boolean {
  const token = path.join(meetSyncRoot, '.local/google-token.json');
  const creds = path.join(meetSyncRoot, '.local/google-credentials.json');
  return fs.existsSync(token) && fs.existsSync(creds);
}

function runMeetSyncCli(
  meetSyncRoot: string,
  repoRoot: string,
  extraArgs: string[],
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const cli = path.join(meetSyncRoot, 'src/cli.ts');
    const child = spawn('npx', ['tsx', cli, ...extraArgs], { cwd: meetSyncRoot });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (c) => {
      stdout += c;
    });
    child.stderr.on('data', (c) => {
      stderr += c;
      process.stderr.write(c);
    });
    child.on('close', (code) => {
      const lines = stdout.trim().split('\n');
      const last = lines[lines.length - 1];
      let stats: Record<string, unknown> = {};
      try {
        stats = JSON.parse(last) as Record<string, unknown>;
      } catch {
        stats = { raw: stdout };
      }
      const messages = lines.slice(0, -1).filter((l) => l.trim());
      if (stderr) messages.push(stderr.slice(0, 500));
      const payload = { ...stats, messages, ...readProgressFile(repoRoot) };
      if (code !== 0) reject(new Error(messages.join(' ') || `exit ${code}`));
      else resolve(payload);
    });
    child.on('error', reject);
  });
}

function analysisInboxPath(moduleRoot: string): string {
  const dir = path.join(moduleRoot, '.local');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'analysis-inbox.jsonl');
}

function remindersInboxPath(moduleRoot: string): string {
  const dir = path.join(moduleRoot, '.local');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'reminders-inbox.jsonl');
}
