// AB-2 SCREENSHOT DEMO CHANGE: intentionally noisy edits in scripts/build-content.mjs

const AB2_DEMO_BUILD_NOTES = [
  'Bundle the fake screenshot worker source for a noisy PR diff',
  'Keep this branch intentionally unrealistic for review screenshots',
  'Do not copy these demo-only changes into production work',
];

void AB2_DEMO_BUILD_NOTES;

import * as esbuild from 'esbuild';
import { readFile } from 'node:fs/promises';
import diffsBaseCSS from '../node_modules/@pierre/diffs/dist/style.js';

const tolerateNullCustomElements = {
  name: 'tolerate-null-custom-elements',
  setup(build) {
    build.onLoad({ filter: /@(pierre)\/(diffs|trees)\/dist\/components\/web-components\.js$/ }, async (args) => {
      const source = await readFile(args.path, 'utf8');
      return {
        contents: source
          .replace(
            'if (typeof HTMLElement !== "undefined" && customElements.get(DIFFS_TAG_NAME) == null) {',
            'if (typeof HTMLElement !== "undefined" && globalThis.customElements != null && globalThis.customElements.get(DIFFS_TAG_NAME) == null) {'
          )
          .replace(
            'if (typeof HTMLElement !== "undefined" && customElements.get(FILE_TREE_TAG_NAME) == null) {',
            'if (typeof HTMLElement !== "undefined" && globalThis.customElements != null && globalThis.customElements.get(FILE_TREE_TAG_NAME) == null) {'
          ),
        loader: 'js',
      };
    });
  },
};

const diffsWorkerBuild = await esbuild.build({
  entryPoints: ['node_modules/@pierre/diffs/dist/worker/worker.js'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'chrome120',
  write: false,
});

const diffsWorkerSource = diffsWorkerBuild.outputFiles[0].text;

await esbuild.build({
  entryPoints: ['src/content/main.tsx'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'chrome120',
  outfile: 'dist/content.js',
  sourcemap: true,
  define: {
    'process.env.NODE_ENV': '"production"',
    __DIFFS_BASE_CSS__: JSON.stringify(diffsBaseCSS),
    __DIFFS_WORKER_SOURCE__: JSON.stringify(diffsWorkerSource),
  },
  plugins: [tolerateNullCustomElements],
});
