import { useEffect, useState } from 'react';
import { DiffOverlay } from './DiffOverlay';
import { fetchCachedPullRequestDiffData, parseGitHubPullRequestUrl, type PullRequestDiffData } from './github';

type OverlayState =
  | { status: 'closed' }
  | { status: 'loading'; pullRequestUrl: string }
  | { status: 'loaded'; data: PullRequestDiffData }
  | { status: 'error'; message: string; pullRequestUrl: string };

type AppProps = {
  pullRequestUrl: string;
  onClose: () => void;
};

export function App({ pullRequestUrl, onClose }: AppProps) {
  const [state, setState] = useState<OverlayState>({ status: 'loading', pullRequestUrl });

  useEffect(() => {
    if (state.status === 'closed') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [onClose, state.status]);

  useEffect(() => {
    let isCancelled = false;
    const ref = parseGitHubPullRequestUrl(pullRequestUrl);

    if (!ref) {
      setState({ status: 'error', pullRequestUrl, message: 'Could not parse a GitHub pull request URL from Linear.' });
      return;
    }

    setState({ status: 'loading', pullRequestUrl });
    fetchCachedPullRequestDiffData(ref)
      .then((data) => {
        if (!isCancelled) {
          setState({ status: 'loaded', data });
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setState({ status: 'error', pullRequestUrl, message: error instanceof Error ? error.message : String(error) });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [pullRequestUrl]);

  if (state.status === 'loaded') {
    return <DiffOverlay data={state.data} onClose={onClose} />;
  }

  if (state.status === 'error') {
    return (
      <ChromeModal title="Unable to load PR diff" onClose={onClose}>
        <div className="linear-view-diff-state linear-view-diff-error">
          <div>
            <p>{state.message}</p>
            <p>If this is a private repo or you are rate-limited, add a GitHub token in the extension options.</p>
          </div>
        </div>
      </ChromeModal>
    );
  }

  return (
    <ChromeModal title="Loading PR diff…" onClose={onClose}>
      <div className="linear-view-diff-state">Fetching PR metadata, file tree, and patch from GitHub…</div>
    </ChromeModal>
  );
}

function ChromeModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="linear-view-diff-backdrop" onClick={onClose} />
      <section className="linear-view-diff-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="linear-view-diff-header">
          <div className="linear-view-diff-title">
            <strong>{title}</strong>
          </div>
          <button className="linear-view-diff-close" type="button" onClick={onClose} aria-label="Close View Diff">
            ✕
          </button>
        </header>
        {children}
      </section>
    </>
  );
}
