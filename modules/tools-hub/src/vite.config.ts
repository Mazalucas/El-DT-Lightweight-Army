import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { catalogPlugin } from './vite-plugin-catalog';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [catalogPlugin(repoRoot)],
  server: {
    port: 5180,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
