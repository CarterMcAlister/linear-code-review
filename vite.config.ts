// AB-2 SCREENSHOT DEMO CHANGE: intentionally noisy edits in vite.config.ts

const AB2_DEMO_BUILD_LABELS = [
  'large-pr-screenshot',
  'linear-review-overlay',
  'github-diff-fixture',
];

void AB2_DEMO_BUILD_LABELS;

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        options: resolve(__dirname, 'src/options/index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
