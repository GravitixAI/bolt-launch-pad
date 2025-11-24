import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process entry point
        entry: path.join(__dirname, 'src/main/main.ts'),
        vite: {
          root: __dirname,
          build: {
            outDir: path.join(__dirname, 'dist/main'),
            rollupOptions: {
              external: ['better-sqlite3', 'sharp', 'mysql2'],
            },
          },
        },
      },
      {
        // Preload scripts entry point
        entry: path.join(__dirname, 'src/preload/preload.ts'),
        onstart(args) {
          // Notify the Renderer process to reload the page when the Preload scripts build is complete
          args.reload();
        },
        vite: {
          root: __dirname,
          build: {
            outDir: path.join(__dirname, 'dist/preload'),
          },
        },
      },
    ]),
  ],
  root: 'src/renderer',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer/src'),
    },
  },
});

