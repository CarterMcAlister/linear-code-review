# Linear View Diff

<img width="1713" height="1024" alt="Screenshot 2026-04-29 at 12 20 40 AM" src="https://github.com/user-attachments/assets/4a378ab2-c8ba-42b5-870d-0148c545ed04" />

Linear View Diff is a Chrome extension that adds a `View Diff` button to Linear review pages. It finds the linked GitHub pull request, prefetches the PR data in the background, and opens an in-page overlay with a file tree and rendered diffs.

## Features

- Adds a Linear-styled `View Diff` button next to `View PR` on Linear review pages.
- Prefetches GitHub pull request metadata, changed files, and diff text when the Linear page loads.
- Renders changed files with `@pierre/trees` and diffs with `@pierre/diffs`.
- Optimized so that the diff viewer stays snappy even with huge changes.
- Supports private repositories through an optional GitHub token stored in Chrome sync storage.
- Handles binary or oversized files with a fallback message when GitHub does not provide a text patch.

## Requirements

- Node.js 24+
- npm
- Chrome or another Chromium browser that supports Manifest V3 extensions

## Development

Install dependencies:

```bash
npm install
```

Build the extension:

```bash
npm run build
```

Type-check only:

```bash
npm run typecheck
```

Watch option-page changes during development:

```bash
npm run dev
```

## Load Locally In Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the generated `dist` directory.
6. Open or refresh a Linear review page matching `https://linear.app/*/review/*`.

## GitHub Access

Public pull requests can load without a token, subject to GitHub API rate limits.

For private repositories or higher rate limits:

1. Create a fine-grained GitHub token.
2. Grant read-only access to Pull requests and Contents for the target repositories.
3. Open the extension options page.
4. Paste and save the token.
5. Refresh Linear.

## Project Structure

- `src/content/`: Linear content script, overlay UI, GitHub API integration.
- `src/options/`: Extension options page for storing a GitHub token.
- `public/manifest.json`: Manifest V3 definition copied into `dist` by Vite.
- `scripts/build-content.mjs`: esbuild content-script build with compatibility patches for Linear pages.
- `dist/`: Generated extension output loaded into Chrome or zipped for publishing.

## Notes

- The content script runs on `https://linear.app/*/review/*`.
- The extension calls `https://api.github.com/*` and follows GitHub API pagination for PR files.
- Reload the unpacked extension after every build while developing locally.
