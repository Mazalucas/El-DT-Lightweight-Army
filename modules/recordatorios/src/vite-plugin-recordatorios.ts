import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';
import { parse as parseYaml } from 'yaml';
import {
  parseProjectCategoriesFromModules,
  parseSeedCategories,
} from './adapters/catalog/yaml-catalog-reader';
import type { PendingReminder } from './core/models/pending-reminder';
import type { Category, ProjectCategoryDefaults } from './core/models/category';

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

function inboxPath(moduleRoot: string): string {
  const dir = path.join(moduleRoot, '.local');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'inbox.jsonl');
}

function readInboxLines(filePath: string): PendingReminder[] {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  const items: PendingReminder[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as PendingReminder;
      if (parsed.inboxVersion === 1 && parsed.id && parsed.title) {
        items.push(parsed);
      }
    } catch {
      console.warn('[recordatorios] línea inbox inválida ignorada');
    }
  }
  return items;
}

function writeInboxLines(filePath: string, items: PendingReminder[]): void {
  const content = items.map((i) => JSON.stringify(i)).join('\n');
  fs.writeFileSync(filePath, content ? `${content}\n` : '', 'utf8');
}

function loadMergedCategories(moduleRoot: string, repoRoot: string): Category[] {
  const seedPath = path.join(moduleRoot, 'config/categories.seed.yaml');
  const defaultsPath = path.join(moduleRoot, 'config/defaults.yaml');
  const modulesPath = path.join(repoRoot, 'vitals/catalog/modules.yaml');

  const seedRaw = parseYaml(fs.readFileSync(seedPath, 'utf8')) as { categories?: Category[] };
  const defaultsRaw = parseYaml(fs.readFileSync(defaultsPath, 'utf8')) as {
    projectCategory?: ProjectCategoryDefaults;
  };
  const projectDefaults: ProjectCategoryDefaults = defaultsRaw.projectCategory ?? {
    color: '#f97316',
    icon: '📁',
    sortOrderBase: 100,
  };

  const seed = parseSeedCategories(seedRaw);
  let project: Category[] = [];
  if (fs.existsSync(modulesPath)) {
    const modYaml = parseYaml(fs.readFileSync(modulesPath, 'utf8')) as {
      modules?: Array<{ id: string; kind?: string; label: string; status?: string }>;
    };
    project = parseProjectCategoriesFromModules(modYaml.modules ?? [], projectDefaults);
  }

  const map = new Map<string, Category>();
  for (const c of seed) map.set(c.id, c);
  for (const c of project) map.set(c.id, c);
  return [...map.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export function recordatoriosPlugin(moduleRoot: string, repoRoot: string): Plugin {
  return {
    name: 'recordatorios-dev-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        const inbox = inboxPath(moduleRoot);

        if (req.method === 'GET' && url === '/api/inbox/pending') {
          sendJson(res, 200, { items: readInboxLines(inbox) });
          return;
        }

        if (req.method === 'POST' && url === '/api/inbox/ack') {
          try {
            const body = (await readJsonBody(req)) as { ids?: string[] };
            const ids = new Set(body.ids ?? []);
            const remaining = readInboxLines(inbox).filter((i) => !ids.has(i.id));
            writeInboxLines(inbox, remaining);
            sendJson(res, 200, { ok: true, acked: ids.size });
          } catch {
            sendJson(res, 400, { error: 'Invalid body' });
          }
          return;
        }

        if (req.method === 'GET' && url === '/api/config/categories') {
          sendJson(res, 200, { categories: loadMergedCategories(moduleRoot, repoRoot) });
          return;
        }

        if (req.method === 'GET' && url === '/api/config/defaults') {
          const defaultsPath = path.join(moduleRoot, 'config/defaults.yaml');
          const raw = parseYaml(fs.readFileSync(defaultsPath, 'utf8')) as {
            defaultCategoryId?: string;
            inboxPollIntervalMs?: number;
          };
          sendJson(res, 200, {
            defaultCategoryId: raw.defaultCategoryId ?? 'personal',
            inboxPollIntervalMs: raw.inboxPollIntervalMs ?? 30000,
          });
          return;
        }

        next();
      });
    },
  };
}
