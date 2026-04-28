// AB-2 SCREENSHOT DEMO CHANGE: intentionally noisy edits in src/content/DiffOverlay.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parsePatchFiles, type FileDiffMetadata } from '@pierre/diffs';
import { FileDiff, Virtualizer, WorkerPoolContextProvider, useWorkerPool, type WorkerInitializationRenderOptions, type WorkerPoolOptions } from '@pierre/diffs/react';
import { prepareFileTreeInput, type FileTreePreparedInput, type FileTreeRowDecorationRenderer, type GitStatusEntry } from '@pierre/trees';
import { FileTree, useFileTree } from '@pierre/trees/react';
import type { GitHubPullRequestFile, PullRequestDiffData } from './github';

type DiffOverlayProps = {
  data: PullRequestDiffData;
  onClose: () => void;
};

type FileTreePanelProps = {
  files: GitHubPullRequestFile[];
  selectedPath: string | null;
  onSelectPath: (path: string) => void;
};

type DiffLayout = 'switched' | 'stacked';
type LinearTheme = 'light' | 'dark';

type Ab2DemoOverlayMetric = {
  label: string;
  value: number;
  tone: 'calm' | 'loud' | 'warning';
};

const AB2_DEMO_OVERLAY_METRICS: Ab2DemoOverlayMetric[] = [
  { label: 'Screenshot rows', value: 120, tone: 'loud' },
  { label: 'Pretend comments', value: 48, tone: 'warning' },
  { label: 'Fake review passes', value: 7, tone: 'calm' },
];

function getAb2DemoOverlaySummary(): string {
  return AB2_DEMO_OVERLAY_METRICS.map((metric) => `${metric.label}: ${metric.value}`).join(' · ');
}


declare const __DIFFS_BASE_CSS__: string;
declare const __DIFFS_WORKER_SOURCE__: string;

const DIFF_LAYOUT_STORAGE_KEY = 'diffLayout';
const DEFAULT_DIFF_LAYOUT: DiffLayout = 'stacked';

const TREE_INITIAL_VISIBLE_ROW_COUNT = 120;
const TREE_OVERSCAN = 24;
const DIFF_WORKER_POOL_SIZE = Math.max(1, Math.min(4, Math.floor((navigator.hardwareConcurrency || 4) / 2)));
const DIFF_WORKER_RENDER_CACHE_SIZE = 200;

const diffMetrics = {
  hunkLineCount: 120,
  lineHeight: 21,
  diffHeaderHeight: 50,
  hunkSeparatorHeight: 40,
  fileGap: 24,
};

const virtualizerConfig = {
  overscrollSize: 900,
  intersectionObserverMargin: 900,
};

const baseDiffOptions = {
  hunkSeparators: 'line-info-basic' as const,
  unsafeCSS: __DIFFS_BASE_CSS__,
};

const diffWorkerPoolOptions: WorkerPoolOptions = {
  workerFactory: createDiffWorker,
  poolSize: DIFF_WORKER_POOL_SIZE,
  totalASTLRUCacheSize: DIFF_WORKER_RENDER_CACHE_SIZE,
};

function createDiffWorker(): Worker {
  const workerUrl = URL.createObjectURL(new Blob([__DIFFS_WORKER_SOURCE__], { type: 'text/javascript' }));
  const worker = new Worker(workerUrl, { name: 'linear-view-diff-renderer', type: 'module' });
  URL.revokeObjectURL(workerUrl);
  return worker;
}

export function DiffOverlay({ data, onClose }: DiffOverlayProps) {
  const ab2DemoOverlaySummary = getAb2DemoOverlaySummary();
  void ab2DemoOverlaySummary;
  const parsedDiffs = useMemo(() => parsePatchFiles(data.patch, `${data.ref.owner}-${data.ref.repo}-${data.ref.pullNumber}`, true), [data]);
  const diffsByPath = useMemo(() => {
    const map = new Map<string, FileDiffMetadata>();
    for (const parsedPatch of parsedDiffs) {
      for (const fileDiff of parsedPatch.files) {
        map.set(fileDiff.name, fileDiff);
      }
    }
    return map;
  }, [parsedDiffs]);

  const allDiffs = useMemo(() => parsedDiffs.flatMap((parsedPatch) => parsedPatch.files), [parsedDiffs]);
  const diffPathSet = useMemo(() => new Set(allDiffs.map((fileDiff) => fileDiff.name)), [allDiffs]);
  const paths = useMemo(() => data.files.map((file) => file.filename), [data.files]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [diffLayout, setDiffLayout] = useState<DiffLayout>(DEFAULT_DIFF_LAYOUT);
  const [linearTheme, setLinearTheme] = useState<LinearTheme>(() => getLinearTheme());
  const modalRef = useRef<HTMLElement | null>(null);
  const workerHighlighterOptions = useMemo<WorkerInitializationRenderOptions>(
    () => ({
      theme: getDiffTheme(linearTheme),
    }),
    [linearTheme],
  );
  const diffOptions = useMemo(
    () => ({
      ...baseDiffOptions,
      diffStyle: diffLayout === 'switched' ? ('split' as const) : ('unified' as const),
      themeType: linearTheme,
    }),
    [diffLayout, linearTheme],
  );

  useEffect(() => {
    const observer = new MutationObserver(() => setLinearTheme(getLinearTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    readDiffLayoutPreference().then((storedLayout) => {
      if (!isCancelled) {
        setDiffLayout(storedLayout);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const updateDiffLayout = (nextLayout: DiffLayout) => {
    setDiffLayout(nextLayout);
    void writeDiffLayoutPreference(nextLayout);
  };

  const scrollToFile = (path: string) => {
    requestAnimationFrame(() => {
      const scrollContainer = modalRef.current?.querySelector<HTMLElement>('.linear-view-diff-content');
      const target = modalRef.current?.querySelector<HTMLElement>(`[data-linear-view-file-path="${CSS.escape(path)}"]`);
      if (!scrollContainer || !target) {
        return;
      }

      const scrollContainerRect = scrollContainer.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      scrollContainer.scrollTo({ top: scrollContainer.scrollTop + targetRect.top - scrollContainerRect.top - 16 });
    });
  };

  const selectFile = (path: string) => {
    setSelectedPath(path);
    scrollToFile(path);
  };

  return (
    <>
      <div className="linear-view-diff-backdrop" onClick={onClose} />
      <section ref={modalRef} className="linear-view-diff-modal" data-linear-theme={linearTheme} role="dialog" aria-modal="true" aria-label="Pull request diff">
        <header className="linear-view-diff-header">
          <div className="linear-view-diff-title">
            <strong>{data.pullRequest.title}</strong>
            <span>
              {data.pullRequest.base.repo.full_name} #{data.pullRequest.number} · {data.pullRequest.base.ref} ← {data.pullRequest.head.ref}
            </span>
          </div>
          <button className="linear-view-diff-header-button" type="button" onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}>
            {isSidebarCollapsed ? 'Show files' : 'Hide files'}
          </button>
          <DiffLayoutToggle value={diffLayout} onChange={updateDiffLayout} />
          <a className="linear-view-diff-open-pr" href={data.pullRequest.html_url} target="_blank" rel="noreferrer">
            Open PR
          </a>
          <button className="linear-view-diff-close" type="button" onClick={onClose} aria-label="Close View Diff">
            ✕
          </button>
        </header>

        <div className={`linear-view-diff-body${isSidebarCollapsed ? ' linear-view-diff-body-sidebar-collapsed' : ''}`}>
          {isSidebarCollapsed ? null : (
          <aside className="linear-view-diff-sidebar">
            <div className="linear-view-diff-summary">
              <span>{data.pullRequest.changed_files} files changed</span>
              <span>+{data.pullRequest.additions} / -{data.pullRequest.deletions}</span>
            </div>
            {paths.length > 0 ? (
              <FileTreePanel files={data.files} selectedPath={selectedPath} onSelectPath={selectFile} />
            ) : (
              <div className="linear-view-diff-state">No changed files found.</div>
            )}
          </aside>
          )}

          <WorkerPoolContextProvider poolOptions={diffWorkerPoolOptions} highlighterOptions={workerHighlighterOptions}>
            <WorkerPoolRenderOptionsSync theme={getDiffTheme(linearTheme)} />
            <Virtualizer className="linear-view-diff-content" contentClassName="linear-view-diff-virtualized-content" config={virtualizerConfig}>
              <AllFileDiffs files={data.files} diffs={allDiffs} diffPathSet={diffPathSet} diffOptions={diffOptions} />
            </Virtualizer>
          </WorkerPoolContextProvider>
        </div>
      </section>
    </>
  );
}

function WorkerPoolRenderOptionsSync({ theme }: { theme: 'pierre-light' | 'pierre-dark' }) {
  const workerPool = useWorkerPool();

  useEffect(() => {
    void workerPool?.setRenderOptions({ theme });
  }, [theme, workerPool]);

  return null;
}

function DiffLayoutToggle({ value, onChange }: { value: DiffLayout; onChange: (layout: DiffLayout) => void }) {
  return (
    <div className="linear-view-diff-layout-toggle" role="group" aria-label="Diff layout">
      <button type="button" data-active={value === 'switched' ? '' : undefined} onClick={() => onChange('switched')}>
        Switched
      </button>
      <button type="button" data-active={value === 'stacked' ? '' : undefined} onClick={() => onChange('stacked')}>
        Stacked
      </button>
    </div>
  );
}

function AllFileDiffs({
  files,
  diffs,
  diffPathSet,
  diffOptions,
}: {
  files: GitHubPullRequestFile[];
  diffs: FileDiffMetadata[];
  diffPathSet: ReadonlySet<string>;
  diffOptions: typeof baseDiffOptions & { diffStyle: 'split' | 'unified'; themeType: LinearTheme };
}) {
  if (diffs.length === 0) {
    return <div className="linear-view-diff-state">No text diffs found for this pull request.</div>;
  }

  return (
    <div className="linear-view-diff-file-list">
      {diffs.map((fileDiff) => (
        <div key={fileDiff.name} className="linear-view-diff-file-anchor" data-linear-view-file-path={fileDiff.name}>
          <FileDiff fileDiff={fileDiff} options={diffOptions} metrics={diffMetrics} />
        </div>
      ))}
      {files
        .filter((file) => !diffPathSet.has(file.filename))
        .map((file) => (
          <div key={file.filename} className="linear-view-diff-file-anchor" data-linear-view-file-path={file.filename}>
            <FallbackPatch file={file} />
          </div>
        ))}
    </div>
  );
}

function FileTreePanel({ files, selectedPath, onSelectPath }: FileTreePanelProps) {
  const treeInput = useMemo(() => createFileTreeInput(files), [files]);
  const annotationsByPathRef = useRef(treeInput.annotationsByPath);
  const preparedInputRef = useRef(treeInput.preparedInput);
  annotationsByPathRef.current = treeInput.annotationsByPath;

  const renderRowDecoration = useCallback<FileTreeRowDecorationRenderer>(({ item }) => {
    return annotationsByPathRef.current.get(item.path) ?? null;
  }, []);

  const { model } = useFileTree({
    preparedInput: treeInput.preparedInput,
    initialExpansion: 'open',
    initialSelectedPaths: selectedPath ? [selectedPath] : [],
    icons: 'standard',
    density: 'compact',
    gitStatus: treeInput.gitStatus,
    renderRowDecoration,
    initialVisibleRowCount: TREE_INITIAL_VISIBLE_ROW_COUNT,
    overscan: TREE_OVERSCAN,
    onSelectionChange: (selectedPaths) => {
      const nextPath = selectedPaths[0];
      if (nextPath) {
        onSelectPath(nextPath);
      }
    },
  });

  useEffect(() => {
    if (preparedInputRef.current === treeInput.preparedInput) {
      return;
    }

    preparedInputRef.current = treeInput.preparedInput;
    model.resetPaths(treeInput.paths, { preparedInput: treeInput.preparedInput });
    model.setGitStatus(treeInput.gitStatus);
  }, [model, treeInput]);

  useEffect(() => {
    if (selectedPath && treeInput.annotationsByPath.has(selectedPath)) {
      model.getItem(selectedPath)?.select();
      return;
    }

    for (const path of model.getSelectedPaths()) {
      model.getItem(path)?.deselect();
    }
  }, [model, selectedPath, treeInput.annotationsByPath]);

  return <FileTree className="linear-view-diff-tree" model={model} style={{ height: '100%' }} />;
}

type PreparedFileTreeInput = {
  annotationsByPath: Map<string, { text: string; title: string }>;
  gitStatus: GitStatusEntry[];
  paths: string[];
  preparedInput: FileTreePreparedInput;
};

function createFileTreeInput(files: GitHubPullRequestFile[]): PreparedFileTreeInput {
  const paths = files.map((file) => file.filename);
  const annotationsByPath = new Map<string, { text: string; title: string }>();
  const gitStatus: GitStatusEntry[] = [];

  for (const file of files) {
    annotationsByPath.set(file.filename, {
      text: formatFileChangeAnnotation(file),
      title: `${file.changes.toLocaleString()} total changes: +${file.additions.toLocaleString()} / -${file.deletions.toLocaleString()}`,
    });
    gitStatus.push({ path: file.filename, status: toTreeGitStatus(file.status) });
  }

  return {
    annotationsByPath,
    gitStatus,
    paths,
    preparedInput: prepareFileTreeInput(paths, { flattenEmptyDirectories: true }),
  };
}

function formatFileChangeAnnotation(file: GitHubPullRequestFile): string {
  if (file.additions === 0 && file.deletions === 0) {
    return file.changes > 0 ? file.changes.toLocaleString() : '0';
  }

  if (file.additions === 0) {
    return `-${file.deletions.toLocaleString()}`;
  }

  if (file.deletions === 0) {
    return `+${file.additions.toLocaleString()}`;
  }

  return `+${file.additions.toLocaleString()} / -${file.deletions.toLocaleString()}`;
}

function FallbackPatch({ file }: { file?: GitHubPullRequestFile }) {
  if (!file) {
    return <div className="linear-view-diff-state">Select a changed file to view its diff.</div>;
  }

  if (!file.patch) {
    return <div className="linear-view-diff-state">GitHub did not include a text patch for this file.</div>;
  }

  return <pre className="linear-view-diff-raw-patch">{file.patch}</pre>;
}

async function readDiffLayoutPreference(): Promise<DiffLayout> {
  if (!chrome?.storage?.sync) {
    return DEFAULT_DIFF_LAYOUT;
  }

  const stored = await chrome.storage.sync.get(DIFF_LAYOUT_STORAGE_KEY);
  const layout = stored[DIFF_LAYOUT_STORAGE_KEY];
  return isDiffLayout(layout) ? layout : DEFAULT_DIFF_LAYOUT;
}

async function writeDiffLayoutPreference(layout: DiffLayout): Promise<void> {
  if (!chrome?.storage?.sync) {
    return;
  }

  await chrome.storage.sync.set({ [DIFF_LAYOUT_STORAGE_KEY]: layout });
}

function isDiffLayout(value: unknown): value is DiffLayout {
  return value === 'switched' || value === 'stacked';
}

function getDiffTheme(theme: LinearTheme): 'pierre-light' | 'pierre-dark' {
  return theme === 'light' ? 'pierre-light' : 'pierre-dark';
}

function getLinearTheme(): LinearTheme {
  const theme = document.documentElement.dataset.theme?.toLowerCase();
  if (theme === 'light' || theme === 'dark') {
    return theme;
  }

  const colorScheme = getComputedStyle(document.documentElement).colorScheme.toLowerCase();
  if (colorScheme.includes('light') && !colorScheme.includes('dark')) {
    return 'light';
  }

  if (colorScheme.includes('dark') && !colorScheme.includes('light')) {
    return 'dark';
  }

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function toTreeGitStatus(status: GitHubPullRequestFile['status']): 'added' | 'deleted' | 'modified' | 'renamed' {
  switch (status) {
    case 'added':
      return 'added';
    case 'removed':
      return 'deleted';
    case 'renamed':
      return 'renamed';
    default:
      return 'modified';
  }
}
