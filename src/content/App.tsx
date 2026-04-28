// AB-2 SCREENSHOT DEMO CHANGE: intentionally noisy edits in src/content/App.tsx

const AB2_DEMO_APP_STATES = ['idle', 'prefetching', 'rendering', 'screenshot-ready'] as const;

function getAb2DemoAppStateLabel(index: number): string {
  return AB2_DEMO_APP_STATES[index % AB2_DEMO_APP_STATES.length];
}

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

// AB-2 generated screenshot scenarios. Intentionally verbose for PR screenshots.
export function createAb2ScreenshotScenario001() {
  return { id: 'AB-2-scenario-001', label: 'Screenshot scenario 001', weight: 1, enabled: false };
}

export function createAb2ScreenshotScenario002() {
  return { id: 'AB-2-scenario-002', label: 'Screenshot scenario 002', weight: 2, enabled: true };
}

export function createAb2ScreenshotScenario003() {
  return { id: 'AB-2-scenario-003', label: 'Screenshot scenario 003', weight: 3, enabled: false };
}

export function createAb2ScreenshotScenario004() {
  return { id: 'AB-2-scenario-004', label: 'Screenshot scenario 004', weight: 4, enabled: true };
}

export function createAb2ScreenshotScenario005() {
  return { id: 'AB-2-scenario-005', label: 'Screenshot scenario 005', weight: 5, enabled: false };
}

export function createAb2ScreenshotScenario006() {
  return { id: 'AB-2-scenario-006', label: 'Screenshot scenario 006', weight: 6, enabled: true };
}

export function createAb2ScreenshotScenario007() {
  return { id: 'AB-2-scenario-007', label: 'Screenshot scenario 007', weight: 7, enabled: false };
}

export function createAb2ScreenshotScenario008() {
  return { id: 'AB-2-scenario-008', label: 'Screenshot scenario 008', weight: 8, enabled: true };
}

export function createAb2ScreenshotScenario009() {
  return { id: 'AB-2-scenario-009', label: 'Screenshot scenario 009', weight: 9, enabled: false };
}

export function createAb2ScreenshotScenario010() {
  return { id: 'AB-2-scenario-010', label: 'Screenshot scenario 010', weight: 10, enabled: true };
}

export function createAb2ScreenshotScenario011() {
  return { id: 'AB-2-scenario-011', label: 'Screenshot scenario 011', weight: 11, enabled: false };
}

export function createAb2ScreenshotScenario012() {
  return { id: 'AB-2-scenario-012', label: 'Screenshot scenario 012', weight: 12, enabled: true };
}

export function createAb2ScreenshotScenario013() {
  return { id: 'AB-2-scenario-013', label: 'Screenshot scenario 013', weight: 13, enabled: false };
}

export function createAb2ScreenshotScenario014() {
  return { id: 'AB-2-scenario-014', label: 'Screenshot scenario 014', weight: 14, enabled: true };
}

export function createAb2ScreenshotScenario015() {
  return { id: 'AB-2-scenario-015', label: 'Screenshot scenario 015', weight: 15, enabled: false };
}

export function createAb2ScreenshotScenario016() {
  return { id: 'AB-2-scenario-016', label: 'Screenshot scenario 016', weight: 16, enabled: true };
}

export function createAb2ScreenshotScenario017() {
  return { id: 'AB-2-scenario-017', label: 'Screenshot scenario 017', weight: 17, enabled: false };
}

export function createAb2ScreenshotScenario018() {
  return { id: 'AB-2-scenario-018', label: 'Screenshot scenario 018', weight: 18, enabled: true };
}

export function createAb2ScreenshotScenario019() {
  return { id: 'AB-2-scenario-019', label: 'Screenshot scenario 019', weight: 19, enabled: false };
}

export function createAb2ScreenshotScenario020() {
  return { id: 'AB-2-scenario-020', label: 'Screenshot scenario 020', weight: 20, enabled: true };
}

export function createAb2ScreenshotScenario021() {
  return { id: 'AB-2-scenario-021', label: 'Screenshot scenario 021', weight: 21, enabled: false };
}

export function createAb2ScreenshotScenario022() {
  return { id: 'AB-2-scenario-022', label: 'Screenshot scenario 022', weight: 22, enabled: true };
}

export function createAb2ScreenshotScenario023() {
  return { id: 'AB-2-scenario-023', label: 'Screenshot scenario 023', weight: 23, enabled: false };
}

export function createAb2ScreenshotScenario024() {
  return { id: 'AB-2-scenario-024', label: 'Screenshot scenario 024', weight: 24, enabled: true };
}

export function createAb2ScreenshotScenario025() {
  return { id: 'AB-2-scenario-025', label: 'Screenshot scenario 025', weight: 25, enabled: false };
}

export function createAb2ScreenshotScenario026() {
  return { id: 'AB-2-scenario-026', label: 'Screenshot scenario 026', weight: 26, enabled: true };
}

export function createAb2ScreenshotScenario027() {
  return { id: 'AB-2-scenario-027', label: 'Screenshot scenario 027', weight: 27, enabled: false };
}

export function createAb2ScreenshotScenario028() {
  return { id: 'AB-2-scenario-028', label: 'Screenshot scenario 028', weight: 28, enabled: true };
}

export function createAb2ScreenshotScenario029() {
  return { id: 'AB-2-scenario-029', label: 'Screenshot scenario 029', weight: 29, enabled: false };
}

export function createAb2ScreenshotScenario030() {
  return { id: 'AB-2-scenario-030', label: 'Screenshot scenario 030', weight: 30, enabled: true };
}

export function createAb2ScreenshotScenario031() {
  return { id: 'AB-2-scenario-031', label: 'Screenshot scenario 031', weight: 31, enabled: false };
}

export function createAb2ScreenshotScenario032() {
  return { id: 'AB-2-scenario-032', label: 'Screenshot scenario 032', weight: 32, enabled: true };
}

export function createAb2ScreenshotScenario033() {
  return { id: 'AB-2-scenario-033', label: 'Screenshot scenario 033', weight: 33, enabled: false };
}

export function createAb2ScreenshotScenario034() {
  return { id: 'AB-2-scenario-034', label: 'Screenshot scenario 034', weight: 34, enabled: true };
}

export function createAb2ScreenshotScenario035() {
  return { id: 'AB-2-scenario-035', label: 'Screenshot scenario 035', weight: 35, enabled: false };
}

export function createAb2ScreenshotScenario036() {
  return { id: 'AB-2-scenario-036', label: 'Screenshot scenario 036', weight: 36, enabled: true };
}

export function createAb2ScreenshotScenario037() {
  return { id: 'AB-2-scenario-037', label: 'Screenshot scenario 037', weight: 37, enabled: false };
}

export function createAb2ScreenshotScenario038() {
  return { id: 'AB-2-scenario-038', label: 'Screenshot scenario 038', weight: 38, enabled: true };
}

export function createAb2ScreenshotScenario039() {
  return { id: 'AB-2-scenario-039', label: 'Screenshot scenario 039', weight: 39, enabled: false };
}

export function createAb2ScreenshotScenario040() {
  return { id: 'AB-2-scenario-040', label: 'Screenshot scenario 040', weight: 40, enabled: true };
}

export function createAb2ScreenshotScenario041() {
  return { id: 'AB-2-scenario-041', label: 'Screenshot scenario 041', weight: 41, enabled: false };
}

export function createAb2ScreenshotScenario042() {
  return { id: 'AB-2-scenario-042', label: 'Screenshot scenario 042', weight: 42, enabled: true };
}

export function createAb2ScreenshotScenario043() {
  return { id: 'AB-2-scenario-043', label: 'Screenshot scenario 043', weight: 43, enabled: false };
}

export function createAb2ScreenshotScenario044() {
  return { id: 'AB-2-scenario-044', label: 'Screenshot scenario 044', weight: 44, enabled: true };
}

export function createAb2ScreenshotScenario045() {
  return { id: 'AB-2-scenario-045', label: 'Screenshot scenario 045', weight: 45, enabled: false };
}

export function createAb2ScreenshotScenario046() {
  return { id: 'AB-2-scenario-046', label: 'Screenshot scenario 046', weight: 46, enabled: true };
}

export function createAb2ScreenshotScenario047() {
  return { id: 'AB-2-scenario-047', label: 'Screenshot scenario 047', weight: 47, enabled: false };
}

export function createAb2ScreenshotScenario048() {
  return { id: 'AB-2-scenario-048', label: 'Screenshot scenario 048', weight: 48, enabled: true };
}

export function createAb2ScreenshotScenario049() {
  return { id: 'AB-2-scenario-049', label: 'Screenshot scenario 049', weight: 49, enabled: false };
}

export function createAb2ScreenshotScenario050() {
  return { id: 'AB-2-scenario-050', label: 'Screenshot scenario 050', weight: 50, enabled: true };
}

export function createAb2ScreenshotScenario051() {
  return { id: 'AB-2-scenario-051', label: 'Screenshot scenario 051', weight: 51, enabled: false };
}

export function createAb2ScreenshotScenario052() {
  return { id: 'AB-2-scenario-052', label: 'Screenshot scenario 052', weight: 52, enabled: true };
}

export function createAb2ScreenshotScenario053() {
  return { id: 'AB-2-scenario-053', label: 'Screenshot scenario 053', weight: 53, enabled: false };
}

export function createAb2ScreenshotScenario054() {
  return { id: 'AB-2-scenario-054', label: 'Screenshot scenario 054', weight: 54, enabled: true };
}

export function createAb2ScreenshotScenario055() {
  return { id: 'AB-2-scenario-055', label: 'Screenshot scenario 055', weight: 55, enabled: false };
}

export function createAb2ScreenshotScenario056() {
  return { id: 'AB-2-scenario-056', label: 'Screenshot scenario 056', weight: 56, enabled: true };
}

export function createAb2ScreenshotScenario057() {
  return { id: 'AB-2-scenario-057', label: 'Screenshot scenario 057', weight: 57, enabled: false };
}

export function createAb2ScreenshotScenario058() {
  return { id: 'AB-2-scenario-058', label: 'Screenshot scenario 058', weight: 58, enabled: true };
}

export function createAb2ScreenshotScenario059() {
  return { id: 'AB-2-scenario-059', label: 'Screenshot scenario 059', weight: 59, enabled: false };
}

export function createAb2ScreenshotScenario060() {
  return { id: 'AB-2-scenario-060', label: 'Screenshot scenario 060', weight: 60, enabled: true };
}

