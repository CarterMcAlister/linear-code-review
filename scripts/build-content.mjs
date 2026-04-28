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
  },
  plugins: [tolerateNullCustomElements],
});
