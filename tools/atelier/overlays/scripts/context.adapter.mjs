#!/usr/bin/env node
/**
 * DT context adapter — maps .agents/design-context.md to Impeccable context flow.
 * Falls back to upstream context.mjs (PRODUCT.md/DESIGN.md) when design-context absent.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.cwd();

const DESIGN_CONTEXT_PATHS = [
  '.agents/design-context.md',
  '.claude/design-context.md',
];

const MARKETING_PATH = '.agents/product-marketing.md';

function findFile(relativePaths, cwd = ROOT) {
  for (const rel of relativePaths) {
    const abs = path.join(cwd, rel);
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

function parseArgs(argv) {
  const args = [...argv];
  let target = null;
  const out = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target' && args[i + 1]) {
      target = args[++i];
      out.push('--target', target);
    } else {
      out.push(args[i]);
    }
  }
  return { target, passthrough: out };
}

function printDesignContext(designPath, marketingPath) {
  const design = fs.readFileSync(designPath, 'utf8');
  let block = `# Design context (El DT)\n\n`;
  block += `**Canonical:** \`${path.relative(ROOT, designPath)}\`\n\n`;
  block += design;
  if (marketingPath && fs.existsSync(marketingPath)) {
    block += `\n\n---\n\n# Product marketing (imported)\n\n`;
    block += `**Source:** \`${path.relative(ROOT, marketingPath)}\`\n\n`;
    block += fs.readFileSync(marketingPath, 'utf8');
  }
  process.stdout.write(block);
  return true;
}

function runUpstreamContext(passthrough) {
  const upstream = path.join(__dirname, 'context.mjs');
  if (!fs.existsSync(upstream)) {
    process.stdout.write('NO_DESIGN_CONTEXT\n');
    process.stdout.write(
      'No design context found. Run `/atelier init` (skill design-context).\n',
    );
    return;
  }
  const result = spawnSync(process.execPath, [upstream, ...passthrough], {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
  });
  let out = (result.stdout || '') + (result.stderr || '');
  out = out.replace(/NO_PRODUCT_MD/g, 'NO_DESIGN_CONTEXT');
  out = out.replace(/PRODUCT\.md/g, '.agents/design-context.md');
  out = out.replace(/DESIGN\.md/g, 'design-context tokens section');
  out = out.replace(/reference\/init\.md/g, 'tools/atelier/generated/references/init.md');
  process.stdout.write(out);
}

const { passthrough } = parseArgs(process.argv.slice(2));
const cwd = passthrough.includes('--target')
  ? path.resolve(ROOT, passthrough[passthrough.indexOf('--target') + 1])
  : ROOT;

const designPath = findFile(DESIGN_CONTEXT_PATHS, cwd);
const marketingPath = findFile([MARKETING_PATH], cwd);

if (designPath) {
  printDesignContext(designPath, marketingPath);
} else {
  runUpstreamContext(passthrough);
}
