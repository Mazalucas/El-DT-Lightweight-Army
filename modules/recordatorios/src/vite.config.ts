import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { recordatoriosPlugin } from './vite-plugin-recordatorios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const moduleRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(moduleRoot, '../..');

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 5181,
    strictPort: false,
  },
  plugins: [recordatoriosPlugin(moduleRoot, repoRoot)],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
