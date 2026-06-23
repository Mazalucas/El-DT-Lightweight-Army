#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runOAuthFlow } from './lib/google-auth.js';
import { runScan, runSync } from './lib/sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const moduleRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(moduleRoot, '../..');

const args = process.argv.slice(2);

async function main(): Promise<void> {
  if (args.includes('--auth')) {
    await runOAuthFlow(moduleRoot);
    return;
  }

  const scanOnly = args.includes('--scan-only');
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined;

  const force = args.includes('--force');
  const result = scanOnly
    ? runScan({ repoRoot, moduleRoot, scanOnly: true })
    : await runSync({ repoRoot, moduleRoot, limit, force });

  for (const msg of result.messages) console.log(msg);
  console.log(
    JSON.stringify({
      scanned: result.scanned,
      synced: result.synced,
      skipped: result.skipped,
      errors: result.errors,
    }),
  );
  process.exit(result.errors > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
