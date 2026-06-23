import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { parse as parseYaml } from 'yaml';
import { buildLaunchRegistry, createLaunchMiddleware } from './launch-api';

export type CatalogEntry = {
  id: string;
  label: string;
  kind: 'module' | 'command';
  section: 'tool' | 'command' | 'system';
  category: string;
  status: string;
  tags: string[];
  aliases: string[];
  summary: string;
  description: string;
  icon: string;
  action?: {
    type: 'command' | 'url' | 'path';
    value: string;
    hint?: string;
  };
  launch?: {
    url: string;
    port: number;
  };
  searchText: string;
};

export type Catalog = {
  generatedAt: string;
  entries: CatalogEntry[];
};

type ModuleYaml = {
  modules?: Array<{
    id: string;
    kind?: string;
    label: string;
    status?: string;
    location?: { path?: string };
    tags?: string[];
    aliases?: string[];
    entrypoints?: Record<string, string>;
  }>;
};

type CommandsMeta = {
  groups?: Record<string, { title?: string }>;
  commands?: Record<
    string,
    {
      group?: string;
      tagline?: string;
      when?: string;
      skill?: string | null;
    }
  >;
};

const KIND_LABELS: Record<string, string> = {
  hub: 'Sistema',
  tool: 'Herramienta',
  project: 'Proyecto',
  'knowledge-pack': 'Conocimiento',
  workflow: 'Workflow',
};

const TOOL_SUMMARIES: Record<string, string> = {
  'facturas-autonomo-es': 'Crear, emitir y exportar facturas de autónomo en España.',
  recordatorios: 'Recordatorios con categorías, tags y captura desde Cursor o la web.',
};

const SYSTEM_SUMMARIES: Record<string, string> = {
  'lucas-prime': 'Este repositorio: reglas del DT, documentación y catálogo de módulos.',
};

const MODULE_ICONS: Record<string, string> = {
  'facturas-autonomo-es': '🧾',
  'lucas-prime': '🧠',
  recordatorios: '🔔',
  'cerebro-profesional': '💼',
  'meet-notes-sync': '📋',
};

const HIDDEN_MODULE_IDS = new Set(['tools-hub']);

/** URLs locales cuando el dev server está levantado (puertos por convención del repo). */
const MODULE_DEV_URLS: Record<string, string> = {
  'facturas-autonomo-es': 'http://localhost:5173/',
  'tools-hub': 'http://localhost:5180/',
  recordatorios: 'http://localhost:5181/',
  'cerebro-profesional': 'http://localhost:5182/',
};

function readYaml<T>(filePath: string): T {
  return parseYaml(fs.readFileSync(filePath, 'utf8')) as T;
}

function buildSearchText(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

export function buildCatalog(repoRoot: string): Catalog {
  const entries: CatalogEntry[] = [];
  const launchRegistry = buildLaunchRegistry(repoRoot);

  const modulesPath = path.join(repoRoot, 'vitals/catalog/modules.yaml');
  const moduleCommands = new Set<string>();
  if (fs.existsSync(modulesPath)) {
    const data = readYaml<ModuleYaml>(modulesPath);
    for (const mod of data.modules ?? []) {
      if (mod.entrypoints?.command) {
        moduleCommands.add(mod.entrypoints.command);
      }
      if (HIDDEN_MODULE_IDS.has(mod.id)) continue;
      const kind = mod.kind ?? 'tool';
      const section = kind === 'tool' || kind === 'project' ? 'tool' : 'system';
      const command = mod.entrypoints?.command;
      const dev = mod.entrypoints?.dev;
      const modulePath = mod.location?.path ?? `modules/${mod.id}`;

      const devUrl = MODULE_DEV_URLS[mod.id];
      let action: CatalogEntry['action'];
      let launch: CatalogEntry['launch'];
      const launchConfig = launchRegistry.get(mod.id);
      if (launchConfig) {
        launch = { url: launchConfig.url, port: launchConfig.port };
      }
      if (command) {
        action = {
          type: 'command',
          value: command,
          hint: devUrl
            ? `Abrir ${devUrl} si el dev server está activo`
            : dev
              ? `Dev: ${dev}`
              : undefined,
        };
      } else if (devUrl) {
        action = { type: 'url', value: devUrl };
      } else if (mod.entrypoints?.readme) {
        action = {
          type: 'path',
          value: `${modulePath}/${mod.entrypoints.readme}`,
        };
      }

      const summary =
        TOOL_SUMMARIES[mod.id] ??
        SYSTEM_SUMMARIES[mod.id] ??
        (section === 'tool'
          ? `App en ${modulePath}`
          : `Parte del segundo cerebro — no es una app de uso diario.`);

      entries.push({
        id: mod.id,
        label: mod.label,
        kind: 'module',
        section,
        category: KIND_LABELS[kind] ?? kind,
        status: mod.status ?? 'unknown',
        tags: mod.tags ?? [],
        aliases: mod.aliases ?? [],
        summary,
        description: command
          ? `Escribí ${command} en Cursor para abrirla`
          : summary,
        icon: MODULE_ICONS[mod.id] ?? (section === 'tool' ? '🔧' : '⚙️'),
        action,
        launch,
        searchText: buildSearchText([
          mod.id,
          mod.label,
          kind,
          section,
          summary,
          ...(mod.tags ?? []),
          ...(mod.aliases ?? []),
          command,
          modulePath,
        ]),
      });
    }
  }

  const commandsPath = path.join(repoRoot, 'vitals/config/commands-meta.yaml');
  if (fs.existsSync(commandsPath)) {
    const data = readYaml<CommandsMeta>(commandsPath);
    const groups = data.groups ?? {};

    for (const [cmdId, cmd] of Object.entries(data.commands ?? {})) {
      const slash = `/${cmdId}`;
      if (moduleCommands.has(slash)) continue;

      const groupTitle = cmd.group ? groups[cmd.group]?.title : undefined;

      entries.push({
        id: cmdId,
        label: slash,
        kind: 'command',
        section: 'command',
        category: groupTitle ?? 'Otros',
        status: 'active',
        tags: cmd.group ? [cmd.group] : [],
        aliases: [cmdId.replace(/-/g, ' ')],
        summary: cmd.tagline ?? '',
        description: cmd.when ?? cmd.tagline ?? '',
        icon: commandIcon(cmd.group),
        action: {
          type: 'command',
          value: slash,
          hint: cmd.when,
        },
        searchText: buildSearchText([
          cmdId,
          slash,
          cmd.tagline,
          cmd.when,
          cmd.skill ?? undefined,
          groupTitle,
          cmd.group,
        ]),
      });
    }
  }

  entries.sort((a, b) => {
    const sectionOrder = { tool: 0, command: 1, system: 2 };
    if (a.section !== b.section) return sectionOrder[a.section] - sectionOrder[b.section];
    return a.label.localeCompare(b.label, 'es');
  });

  return {
    generatedAt: new Date().toISOString(),
    entries,
  };
}

function commandIcon(group?: string): string {
  switch (group) {
    case 'routine':
      return '🔄';
    case 'work':
      return '💼';
    case 'framework':
      return '🛠️';
    case 'modules':
      return '📦';
    default:
      return '⌘';
  }
}

export function catalogPlugin(repoRoot: string): Plugin {
  let outDir = 'dist';

  return {
    name: 'tools-hub-catalog',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    configureServer(server) {
      const launchMw = createLaunchMiddleware(repoRoot);
      server.middlewares.use((req, res, next) => {
        void launchMw(req, res, next);
      });
      server.middlewares.use('/catalog.json', (_req, res) => {
        const catalog = buildCatalog(repoRoot);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(catalog, null, 2));
      });
    },
    closeBundle() {
      const catalog = buildCatalog(repoRoot);
      const publicDir = path.join(repoRoot, 'modules/tools-hub/src/public');
      fs.mkdirSync(publicDir, { recursive: true });
      fs.writeFileSync(
        path.join(publicDir, 'catalog.json'),
        JSON.stringify(catalog, null, 2),
      );
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(
        path.join(outDir, 'catalog.json'),
        JSON.stringify(catalog, null, 2),
      );
    },
  };
}
