#!/usr/bin/env node
/**
 * Merge Atelier design hook into .cursor/hooks.json (non-destructive).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const HOOKS_PATH = path.join(REPO_ROOT, '.cursor', 'hooks.json');
const LAUNCHER = 'tools/atelier/generated/scripts/impeccable';
const HOOK_SCRIPT = `"${LAUNCHER}" hook-before-edit`;

function loadJson(p) {
  if (!fs.existsSync(p)) return { version: 1, hooks: {} };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function isAtelierHook(hook) {
  const cmd = String(hook.command || '');
  return cmd.includes('hook-before-edit') || cmd.includes(LAUNCHER);
}

function hasAtelierHook(hooks) {
  const list = hooks?.hooks?.preToolUse || hooks?.preToolUse || [];
  return list.some((h) => isAtelierHook(h));
}

function main() {
  const launcherPath = path.join(REPO_ROOT, LAUNCHER);
  if (!fs.existsSync(launcherPath)) {
    console.warn('skip hooks merge: impeccable launcher not found');
    return;
  }

  const data = loadJson(HOOKS_PATH);
  if (!data.hooks) data.hooks = {};
  if (!data.hooks.preToolUse) data.hooks.preToolUse = [];

  if (hasAtelierHook(data)) {
    data.hooks.preToolUse = data.hooks.preToolUse.map((h) =>
      isAtelierHook(h)
        ? { ...h, command: HOOK_SCRIPT, timeout: h.timeout ?? 5 }
        : h,
    );
  } else {
    data.hooks.preToolUse.push({ command: HOOK_SCRIPT, timeout: 5 });
  }

  data.version = data.version ?? 1;
  fs.mkdirSync(path.dirname(HOOKS_PATH), { recursive: true });
  fs.writeFileSync(HOOKS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`merged atelier hook -> ${path.relative(REPO_ROOT, HOOKS_PATH)}`);
}

main();
