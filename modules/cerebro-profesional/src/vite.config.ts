import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cerebroProfesionalPlugin } from './vite-plugin-cerebro-profesional';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const moduleRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(moduleRoot, '../..');

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 5182,
    strictPort: false,
  },
  plugins: [cerebroProfesionalPlugin(moduleRoot, repoRoot)],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
