import { useMemo, useState } from 'react';
import { parsePatchFiles, type FileDiffMetadata } from '@pierre/diffs';
import { FileDiff } from '@pierre/diffs/react';
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

declare const __DIFFS_BASE_CSS__: string;

const diffOptions = {
  diffStyle: 'unified' as const,
  hunkSeparators: 'line-info-basic' as const,
  theme: 'github-dark' as const,
  unsafeCSS: __DIFFS_BASE_CSS__,
};

export function DiffOverlay({ data, onClose }: DiffOverlayProps) {
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
  const paths = useMemo(() => data.files.map((file) => file.filename), [data.files]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const selectedDiff = selectedPath ? diffsByPath.get(selectedPath) : null;

  return (
    <>
      <div className="linear-view-diff-backdrop" onClick={onClose} />
      <section className="linear-view-diff-modal" role="dialog" aria-modal="true" aria-label="Pull request diff">
        <header className="linear-view-diff-header">
          <div className="linear-view-diff-title">
            <strong>{data.pullRequest.title}</strong>
            <span>
              {data.pullRequest.base.repo.full_name} #{data.pullRequest.number} · {data.pullRequest.base.ref} ← {data.pullRequest.head.ref}
            </span>
          </div>
          <a className="linear-view-diff-open-pr" href={data.pullRequest.html_url} target="_blank" rel="noreferrer">
            Open PR
          </a>
          <button className="linear-view-diff-close" type="button" onClick={onClose} aria-label="Close View Diff">
            ✕
          </button>
        </header>

        <div className="linear-view-diff-body">
          <aside className="linear-view-diff-sidebar">
            <div className="linear-view-diff-summary">
              <span>{data.pullRequest.changed_files} files changed</span>
              <span>+{data.pullRequest.additions} / -{data.pullRequest.deletions}</span>
            </div>
            {paths.length > 0 ? (
              <FileTreePanel files={data.files} selectedPath={selectedPath} onSelectPath={setSelectedPath} />
            ) : (
              <div className="linear-view-diff-state">No changed files found.</div>
            )}
          </aside>

          <main className="linear-view-diff-content">
            {selectedPath ? (
              selectedDiff ? (
                <FileDiff fileDiff={selectedDiff} options={diffOptions} />
              ) : (
                <FallbackPatch file={data.files.find((file) => file.filename === selectedPath)} />
              )
            ) : (
              <AllFileDiffs files={data.files} diffs={allDiffs} />
            )}
          </main>
        </div>
      </section>
    </>
  );
}

function AllFileDiffs({ files, diffs }: { files: GitHubPullRequestFile[]; diffs: FileDiffMetadata[] }) {
  if (diffs.length === 0) {
    return <div className="linear-view-diff-state">No text diffs found for this pull request.</div>;
  }

  return (
    <div className="linear-view-diff-file-list">
      {diffs.map((fileDiff) => (
        <FileDiff key={fileDiff.name} fileDiff={fileDiff} options={diffOptions} />
      ))}
      {files
        .filter((file) => !diffs.some((fileDiff) => fileDiff.name === file.filename))
        .map((file) => (
          <FallbackPatch key={file.filename} file={file} />
        ))}
    </div>
  );
}

function FileTreePanel({ files, selectedPath, onSelectPath }: FileTreePanelProps) {
  const paths = useMemo(() => files.map((file) => file.filename), [files]);
  const gitStatus = useMemo(
    () => files.map((file) => ({ path: file.filename, status: toTreeGitStatus(file.status) })),
    [files],
  );
  const { model } = useFileTree({
    paths,
    initialExpansion: 'open',
    initialSelectedPaths: selectedPath ? [selectedPath] : [],
    flattenEmptyDirectories: true,
    icons: 'standard',
    density: 'compact',
    gitStatus,
    onSelectionChange: (selectedPaths) => {
      const nextPath = selectedPaths[0];
      if (nextPath) {
        onSelectPath(nextPath);
      }
    },
  });

  return <FileTree className="linear-view-diff-tree" model={model} style={{ height: '100%' }} />;
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
