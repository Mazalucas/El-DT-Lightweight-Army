#!/usr/bin/env node
/**
 * Compose .cursor/skills/atelier/SKILL.md from Impeccable SKILL.src.md + DT header.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ATELIER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = path.resolve(ATELIER_ROOT, '../..');
const UPSTREAM_SKILL = path.join(ATELIER_ROOT, 'upstream', 'skill', 'SKILL.src.md');
const DT_HEADER = path.join(ATELIER_ROOT, 'overlays', 'SKILL.dt-header.md');
const OUT_SKILL = path.join(REPO_ROOT, '.cursor', 'skills', 'atelier', 'SKILL.md');
const GEN_SKILL_CORE = path.join(ATELIER_ROOT, 'generated', 'skill-core.md');

const REF_PREFIX = 'tools/atelier/generated/references';
const SCRIPTS_PATH = 'tools/atelier/generated/scripts';

function transformCore(src) {
  let body = src.replace(/^---[\s\S]*?---\n/, '');

  body = body
    .replace(/\{\{scripts_path\}\}/g, SCRIPTS_PATH)
    .replace(/\{\{command_prefix\}\}/g, '/atelier ')
    .replace(/\{\{command_hint\}\}/g, 'command')
    .replace(/\{\{model\}\}/g, 'The agent')
    .replace(/node \{\{scripts_path\}\}\/context\.mjs/g, `node ${SCRIPTS_PATH}/context.adapter.mjs`)
    .replace(/context\.mjs/g, 'context.adapter.mjs')
    .replace(/NO_PRODUCT_MD/g, 'NO_DESIGN_CONTEXT')
    .replace(/PRODUCT\.md/g, '.agents/design-context.md')
    .replace(/reference\//g, `${REF_PREFIX}/`)
    .replace(/`\/impeccable/g, '`/atelier')
    .replace(/\/impeccable /g, '/atelier ')
    .replace(/impeccable /g, 'atelier ')
    .replace(/npx impeccable update/g, '/atelier actualizar');

  // DT command table extension
  const dtCommands = `
| \`select [brief]\` | DT | Design system recommendation | \`${REF_PREFIX}/template.md\` + design-selector |
| \`detect [path]\` | DT | Deterministic anti-slop scan | \`./scripts/atelier-detect.sh\` |
| \`read\` | DT | Design Read V/M/D dials | skill \`design-read\` |
| \`tokens\` | DT | CSS/token expansion | skill \`design-tokens\` |
| \`template [name]\` | DT | Starters / ui-templates | \`${REF_PREFIX}/template.md\` |
| \`deck [brief]\` | DT | Presentation deck | \`${REF_PREFIX}/deck.md\` |
| \`actualizar\` | DT | Sync Impeccable vendor | \`${REF_PREFIX}/actualizar.md\` |
`;

  if (body.includes('| `live` |')) {
    body = body.replace(
      /(\| `live` \|[^\n]+\n)/,
      `$1${dtCommands}`,
    );
  } else {
    body += `\n## DT commands\n${dtCommands}\n`;
  }

  return body;
}

function buildFrontmatter() {
  return `---
name: atelier
description: "Atelier design intelligence (El DT + Impeccable). Use for UI/UX design, craft, critique, audit, polish, anti-slop, tokens, decks, and frontend iteration. Invoke /atelier <command> [target]. Covers landing, dashboard, product UI, components, motion, a11y, and design system alignment."
argument-hint: "[command] [target]"
user-invocable: true
license: Apache-2.0 (Impeccable portions)
---

# Atelier — design intelligence (El DT)

Router unificado. Upstream: [Impeccable](https://github.com/pbakaus/impeccable) vendoreado vía \`tools/atelier/\`.

`;
}

function main() {
  if (!fs.existsSync(UPSTREAM_SKILL)) {
    console.error('missing upstream skill/SKILL.src.md');
    process.exit(1);
  }

  const upstream = fs.readFileSync(UPSTREAM_SKILL, 'utf8');
  const core = transformCore(upstream);
  fs.mkdirSync(path.dirname(GEN_SKILL_CORE), { recursive: true });
  fs.writeFileSync(GEN_SKILL_CORE, core);

  const header = fs.existsSync(DT_HEADER)
    ? fs.readFileSync(DT_HEADER, 'utf8') + '\n\n---\n\n'
    : '';

  const skill = buildFrontmatter() + header + core;
  fs.mkdirSync(path.dirname(OUT_SKILL), { recursive: true });
  fs.writeFileSync(OUT_SKILL, skill);
  console.log(`wrote ${path.relative(REPO_ROOT, OUT_SKILL)}`);
}

main();
