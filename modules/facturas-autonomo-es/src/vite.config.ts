import { defineConfig } from 'vite';
import { facturasExportPlugin } from './vite-plugin-facturas-export';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [facturasExportPlugin()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
