# Linear View Diff

Linear View Diff is a Chrome extension that adds a `View Diff` button to Linear review pages. It finds the linked GitHub pull request, prefetches the PR data in the background, and opens an in-page overlay with a file tree and rendered diffs.

## Features

- Adds a Linear-styled `View Diff` button next to `View PR` on Linear review pages.
- Prefetches GitHub pull request metadata, changed files, and diff text when the Linear page loads.
- Renders changed files with `@pierre/trees` and diffs with `@pierre/diffs`.
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

## Chrome Web Store Publishing

This repo includes a GitHub Actions workflow at `.github/workflows/publish-chrome.yml`.

The workflow:

1. Installs dependencies with `npm ci`.
2. Builds the extension into `dist`.
3. Zips the contents of `dist`.
4. Uploads the zip as a GitHub Actions artifact.
5. On manual dispatch, optionally uploads and publishes the zip to the Chrome Web Store.

### Required Repository Secrets

Configure these secrets in GitHub under **Settings → Secrets and variables → Actions**:

- `CHROME_EXTENSION_ID`: Chrome Web Store extension ID.
- `CHROME_CLIENT_ID`: Google OAuth client ID with Chrome Web Store API access.
- `CHROME_CLIENT_SECRET`: Google OAuth client secret.
- `CHROME_REFRESH_TOKEN`: OAuth refresh token for the publishing account.

### Manual Publish

Run the **Publish Chrome Extension** workflow from the GitHub Actions tab.

The workflow has a `publish` input:

- `false` uploads a draft/package to the Chrome Web Store.
- `true` uploads and publishes it.

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
