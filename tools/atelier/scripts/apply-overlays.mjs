#!/usr/bin/env node
/**
 * Apply DT overlays onto generated Impeccable artifacts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OVERLAYS = path.join(ROOT, 'overlays');
const GENERATED = path.join(ROOT, 'generated');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function applyReferenceOverlays() {
  const refOverlayDir = path.join(OVERLAYS, 'references');
  if (!fs.existsSync(refOverlayDir)) return;
  const genRef = path.join(GENERATED, 'references');
  fs.mkdirSync(genRef, { recursive: true });

  for (const file of fs.readdirSync(refOverlayDir)) {
    const src = path.join(refOverlayDir, file);
    if (file.endsWith('.md.overlay')) {
      const base = file.replace(/\.overlay$/, '');
      fs.copyFileSync(src, path.join(genRef, base));
      console.log(`overlay: references/${base}`);
    } else if (file.endsWith('.md')) {
      fs.copyFileSync(src, path.join(genRef, file));
      console.log(`overlay: references/${file} (dt-only)`);
    }
  }
}

function applyScriptOverlays() {
  const scriptOverlayDir = path.join(OVERLAYS, 'scripts');
  if (!fs.existsSync(scriptOverlayDir)) return;
  const genScripts = path.join(GENERATED, 'scripts');
  fs.mkdirSync(genScripts, { recursive: true });
  for (const file of fs.readdirSync(scriptOverlayDir)) {
    fs.copyFileSync(path.join(scriptOverlayDir, file), path.join(genScripts, file));
    console.log(`overlay: scripts/${file}`);
  }
}

function linkDetectorEngine() {
  const genScripts = path.join(GENERATED, 'scripts');
  const detectorLink = path.join(genScripts, 'detector');
  const nmEngine = path.join(ROOT, 'node_modules', 'impeccable', 'cli', 'engine');
  const upstreamEngine = path.join(ROOT, 'upstream', 'cli', 'engine');

  let target = null;
  if (fs.existsSync(nmEngine)) target = nmEngine;
  else if (fs.existsSync(upstreamEngine)) target = upstreamEngine;

  if (!target) {
    console.warn('warn: detector engine not found — run npm install in tools/atelier');
    return;
  }

  if (fs.existsSync(detectorLink)) {
    fs.rmSync(detectorLink, { recursive: true, force: true });
  }
  fs.mkdirSync(genScripts, { recursive: true });
  fs.symlinkSync(target, detectorLink, 'dir');
  console.log(`linked: scripts/detector -> ${target}`);
}

// Main: expect upstream already copied to generated/
applyReferenceOverlays();
applyScriptOverlays();
linkDetectorEngine();

export { copyDir, GENERATED, OVERLAYS, ROOT };
