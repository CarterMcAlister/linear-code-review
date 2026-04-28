import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './App';
import { prefetchPullRequestDiffData } from './github';
import { getOrCreateOverlayRoot, installLinearViewDiffButton } from './linear';
import { styles } from './styles';

injectStyles();

let root: Root | null = null;
let activePullRequestUrl: string | null = null;

installLinearViewDiffButton(
  (pullRequestUrl) => {
    activePullRequestUrl = pullRequestUrl;
    renderOverlay();
  },
  prefetchPullRequestDiffData,
);

function renderOverlay(): void {
  if (!activePullRequestUrl) {
    return;
  }

  const container = getOrCreateOverlayRoot();
  root ??= createRoot(container);
  root.render(
    <React.StrictMode>
      <App pullRequestUrl={activePullRequestUrl} onClose={closeOverlay} />
    </React.StrictMode>,
  );
}

function closeOverlay(): void {
  activePullRequestUrl = null;
  root?.unmount();
  root = null;
  document.getElementById('linear-view-diff-root')?.remove();
}

function injectStyles(): void {
  if (document.getElementById('linear-view-diff-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'linear-view-diff-styles';
  style.textContent = styles;
  document.documentElement.append(style);
}
