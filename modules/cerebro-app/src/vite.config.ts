import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname),
  envDir: path.resolve(__dirname),
  plugins: [react()],
  test: {
    include: ['react/**/*.test.ts'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth'],
          react: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    port: 5190,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        rewrite: (p) => {
          const project = process.env.VITE_FIREBASE_PROJECT_ID || 'demo-cerebro';
          return `/${project}/europe-west1/api${p}`;
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log(`[vite-proxy] → ${req.method} ${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(`[vite-proxy] ← ${proxyRes.statusCode} ${req.method} ${req.url}`);
          });
          proxy.on('error', (err, req) => {
            console.error(`[vite-proxy] ✗ ${req.method} ${req.url}:`, err.message);
          });
        },
      },
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
});
