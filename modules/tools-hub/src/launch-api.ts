import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { parse as parseYaml } from 'yaml';

export type LaunchConfig = {
  moduleId: string;
  script: string;
  url: string;
  port: number;
};

type ModuleYaml = {
  modules?: Array<{
    id: string;
    kind?: string;
    entrypoints?: { dev?: string };
  }>;
};

/** Puertos y URLs por convención del repo — alineado con vite-plugin-catalog.ts */
const MODULE_DEV_URLS: Record<string, string> = {
  'facturas-autonomo-es': 'http://localhost:5173/',
  recordatorios: 'http://localhost:5181/',
  'cerebro-profesional': 'http://localhost:5182/',
};

const LAUNCHABLE_KINDS = new Set(['tool', 'project']);

const launchesInFlight = new Map<string, Promise<LaunchResponse>>();

export type LaunchResponse = {
  status: 'ready' | 'error';
  url?: string;
  error?: string;
  started?: boolean;
};

function readYaml<T>(filePath: string): T {
  return parseYaml(fs.readFileSync(filePath, 'utf8')) as T;
}

function portFromUrl(url: string): number {
  const parsed = new URL(url);
  if (parsed.port) return Number(parsed.port);
  return parsed.protocol === 'https:' ? 443 : 80;
}

export function buildLaunchRegistry(repoRoot: string): Map<string, LaunchConfig> {
  const registry = new Map<string, LaunchConfig>();
  const modulesPath = path.join(repoRoot, 'vitals/catalog/modules.yaml');
  if (!fs.existsSync(modulesPath)) return registry;

  const data = readYaml<ModuleYaml>(modulesPath);
  for (const mod of data.modules ?? []) {
    const kind = mod.kind ?? 'tool';
    if (!LAUNCHABLE_KINDS.has(kind)) continue;

    const devUrl = MODULE_DEV_URLS[mod.id];
    const devScript = mod.entrypoints?.dev;
    if (!devUrl || !devScript) continue;

    registry.set(mod.id, {
      moduleId: mod.id,
      script: devScript,
      url: devUrl,
      port: portFromUrl(devUrl),
    });
  }

  return registry;
}

function isPortReady(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, (res: IncomingMessage) => {
      resolve(typeof res.statusCode === 'number' && res.statusCode < 500);
      res.resume();
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForPort(port: number, timeoutMs = 90000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (!(Date.now() >= deadline)) {
    if (await isPortReady(port)) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function spawnDevScript(repoRoot: string, script: string): void {
  const scriptPath = path.resolve(repoRoot, script.replace(/^\.\//, ''));
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Script no encontrado: ${script}`);
  }

  const child = spawn('bash', [scriptPath], {
    cwd: repoRoot,
    detached: true,
    stdio: 'ignore',
    env: { ...process.env },
  });
  child.unref();
}

export async function launchModule(
  repoRoot: string,
  moduleId: string,
): Promise<LaunchResponse> {
  const registry = buildLaunchRegistry(repoRoot);
  const config = registry.get(moduleId);
  if (!config) {
    return { status: 'error', error: `Módulo no lanzable: ${moduleId}` };
  }

  if (await isPortReady(config.port)) {
    return { status: 'ready', url: config.url, started: false };
  }

  const inFlight = launchesInFlight.get(moduleId);
  if (inFlight) return inFlight;

  const promise = (async (): Promise<LaunchResponse> => {
    try {
      spawnDevScript(repoRoot, config.script);
      const ready = await waitForPort(config.port);
      if (!ready) {
        return {
          status: 'error',
          error: `Timeout esperando ${config.url}. Revisá la terminal o ejecutá ${config.script} manualmente.`,
        };
      }
      return { status: 'ready', url: config.url, started: true };
    } catch (err) {
      return {
        status: 'error',
        error: err instanceof Error ? err.message : 'Error al iniciar el módulo',
      };
    } finally {
      launchesInFlight.delete(moduleId);
    }
  })();

  launchesInFlight.set(moduleId, promise);
  return promise;
}

export function createLaunchMiddleware(repoRoot: string) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const match = req.url?.match(/^\/api\/launch\/([^/?]+)/);
    if (!match) {
      next();
      return;
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ status: 'error', error: 'Usá POST' }));
      return;
    }

    const moduleId = decodeURIComponent(match[1]);
    const result = await launchModule(repoRoot, moduleId);

    res.statusCode = result.status === 'ready' ? 200 : 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(result));
  };
}
