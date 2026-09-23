#!/usr/bin/env node
/**
 * Compose .cursor/skills/atelier/SKILL.md from Impeccable SKILL.src.md + DT header.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileProviderBlocks, stripRuleMarkers } from '../upstream/scripts/lib/utils.js';

const ATELIER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = path.resolve(ATELIER_ROOT, '../..');
const UPSTREAM_SKILL = path.join(ATELIER_ROOT, 'upstream', 'skill', 'SKILL.src.md');
const DT_HEADER = path.join(ATELIER_ROOT, 'overlays', 'SKILL.dt-header.md');
const OUT_SKILL = path.join(REPO_ROOT, '.cursor', 'skills', 'atelier', 'SKILL.md');
const GEN_SKILL_CORE = path.join(ATELIER_ROOT, 'generated', 'skill-core.md');

const REF_PREFIX = 'tools/atelier/generated/references';
const SCRIPTS_PATH = 'tools/atelier/generated/scripts';
const LAUNCHER_TOKEN = '__IMPECCABLE_LAUNCHER__';
const AVAILABLE_COMMANDS = [
  'adapt', 'animate', 'audit', 'bolder', 'clarify', 'colorize',
  'critique', 'delight', 'distill', 'document', 'harden', 'layout',
  'onboard', 'optimize', 'overdrive', 'polish', 'quieter', 'shape', 'typeset',
].map((name) => `/atelier ${name}`).join(', ');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Render upstream skill markdown for the DT Cursor install.
 * Idempotent: the launcher path is protected before `/impeccable ` is rewritten.
 */
function renderDtMarkdown(text) {
  let body = compileProviderBlocks(text, ['cursor']);
  body = stripRuleMarkers(body);
  const launcherPath = `${SCRIPTS_PATH}/impeccable`;
  body = body
    .replace(/<skill-base-dir>\/scripts\/impeccable context/g, `node ${SCRIPTS_PATH}/context.adapter.mjs`)
    .replace(/\{\{scripts_path\}\}\/impeccable/g, LAUNCHER_TOKEN)
    .replace(new RegExp(escapeRegExp(launcherPath), 'g'), LAUNCHER_TOKEN)
    .replace(/`impeccable context`/g, '`context.adapter.mjs`')
    .replace(/\{\{command_prefix\}\}impeccable /g, '/atelier ')
    .replace(/\{\{command_prefix\}\}/g, '/atelier ')
    .replace(/`\/impeccable /g, '`/atelier ')
    .replace(/\/impeccable /g, '/atelier ')
    .replaceAll(LAUNCHER_TOKEN, launcherPath)
    .replace(/\{\{scripts_path\}\}/g, SCRIPTS_PATH)
    .replace(/\{\{command_hint\}\}/g, 'command')
    .replace(/\{\{model\}\}/g, 'The agent')
    .replace(/\{\{config_file\}\}/g, '.agents/design-context.md')
    .replace(/\{\{ask_instruction\}\}/g, 'Ask the user directly to clarify what you cannot infer.')
    .replace(/\{\{available_commands\}\}/g, AVAILABLE_COMMANDS)
    .replace(/context\.mjs/g, 'context.adapter.mjs')
    .replace(/NO_PRODUCT_MD/g, 'NO_DESIGN_CONTEXT')
    .replace(/reference\//g, `${REF_PREFIX}/`)
    .replace(/npx impeccable update/g, '/atelier actualizar');
  return body;
}

function transformCore(src) {
  let body = src.replace(/^---[\s\S]*?---\n/, '');
  body = renderDtMarkdown(body);
  body = body.replace(/PRODUCT\.md/g, '.agents/design-context.md');

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

function renderGeneratedReferences() {
  const dir = path.join(ATELIER_ROOT, 'generated', 'references');
  if (!fs.existsSync(dir)) return 0;
  let written = 0;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    const filePath = path.join(dir, name);
    const raw = fs.readFileSync(filePath, 'utf8');
    const next = renderDtMarkdown(raw);
    if (next !== raw) {
      fs.writeFileSync(filePath, next);
      written += 1;
    }
  }
  return written;
}

const DEGRADED_PREAMBLE = `<!-- Generated from skill/agents/ at compose time. Do not edit; edit the agent definition. -->
This harness runs this role inline when no subagent is available. Step fully out of the work you just finished, adopt only this file's instructions for the pass, and disclose the substitution in one line when you report. Where the text below addresses a parent agent, you are both parties: produce the full output contract first, then act on it yourself.`;

function renderDegradedAgents() {
  const agentsDir = path.join(ATELIER_ROOT, 'upstream', 'skill', 'agents');
  if (!fs.existsSync(agentsDir)) return 0;
  const outDir = path.join(ATELIER_ROOT, 'generated', 'references', 'degraded');
  fs.mkdirSync(outDir, { recursive: true });
  let written = 0;
  for (const name of fs.readdirSync(agentsDir)) {
    if (!name.endsWith('.md')) continue;
    const raw = fs.readFileSync(path.join(agentsDir, name), 'utf8');
    const body = raw.replace(/^---[\s\S]*?---\n/, '');
    const role = name.replace(/^impeccable-/, '').replace(/\.md$/, '');
    const content = `${DEGRADED_PREAMBLE}\n\n${renderDtMarkdown(body).replace(/^\s+/, '')}`;
    fs.writeFileSync(path.join(outDir, `${role}.md`), content.endsWith('\n') ? content : `${content}\n`);
    written += 1;
  }
  return written;
}

function main() {
  if (!fs.existsSync(UPSTREAM_SKILL)) {
    console.error('missing upstream skill/SKILL.src.md');
    process.exit(1);
  }

  const refs = renderGeneratedReferences();
  const degraded = renderDegradedAgents();
  console.log(`rendered ${refs} references, ${degraded} degraded roles`);

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
