import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@pagent-libs/core': path.resolve(__dirname, '../../packages/core/src'),
      '@pagent-libs/sheets': path.resolve(__dirname, '../../packages/sheets/src'),
    },
  },
  server: {
    port: 5175,
  },
});

