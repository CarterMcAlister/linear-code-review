export type GitHubPullRequestRef = {
  owner: string;
  repo: string;
  pullNumber: number;
  url: string;
};

export type GitHubPullRequest = {
  html_url: string;
  title: string;
  number: number;
  state: string;
  user?: { login: string };
  base: { ref: string; repo: { full_name: string } };
  head: { ref: string; sha: string; repo: { full_name: string } | null };
  additions: number;
  deletions: number;
  changed_files: number;
};

export type GitHubPullRequestFile = {
  sha: string;
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string;
  previous_filename?: string;
};

export type PullRequestDiffData = {
  ref: GitHubPullRequestRef;
  pullRequest: GitHubPullRequest;
  files: GitHubPullRequestFile[];
  patch: string;
};

const GITHUB_PULL_URL_PATTERN = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i;
const pullRequestDiffCache = new Map<string, Promise<PullRequestDiffData>>();

export function parseGitHubPullRequestUrl(url: string): GitHubPullRequestRef | null {
  const match = url.match(GITHUB_PULL_URL_PATTERN);
  if (!match) {
    return null;
  }

  return {
    owner: decodeURIComponent(match[1]),
    repo: decodeURIComponent(match[2]),
    pullNumber: Number(match[3]),
    url,
  };
}

export async function getGitHubToken(): Promise<string | null> {
  if (!chrome?.storage?.sync) {
    return null;
  }

  const stored = await chrome.storage.sync.get('githubToken');
  return typeof stored.githubToken === 'string' && stored.githubToken.trim()
    ? stored.githubToken.trim()
    : null;
}

export function prefetchPullRequestDiffData(url: string): void {
  const ref = parseGitHubPullRequestUrl(url);
  if (!ref) {
    return;
  }

  void fetchCachedPullRequestDiffData(ref).catch(() => undefined);
}

export function fetchCachedPullRequestDiffData(ref: GitHubPullRequestRef): Promise<PullRequestDiffData> {
  const cacheKey = getPullRequestDiffCacheKey(ref);
  const cached = pullRequestDiffCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const promise = fetchPullRequestDiffData(ref).catch((error: unknown) => {
    pullRequestDiffCache.delete(cacheKey);
    throw error;
  });
  pullRequestDiffCache.set(cacheKey, promise);
  return promise;
}

async function fetchPullRequestDiffData(ref: GitHubPullRequestRef): Promise<PullRequestDiffData> {
  const token = await getGitHubToken();
  const headers = createGitHubHeaders(token);
  const apiBase = `https://api.github.com/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}/pulls/${ref.pullNumber}`;

  const [pullRequest, files, patch] = await Promise.all([
    fetchJson<GitHubPullRequest>(apiBase, headers),
    fetchAllPullRequestFiles(`${apiBase}/files`, headers),
    fetchText(apiBase, {
      ...headers,
      Accept: 'application/vnd.github.v3.diff',
    }),
  ]);

  return { ref, pullRequest, files, patch };
}

function getPullRequestDiffCacheKey(ref: GitHubPullRequestRef): string {
  return `${ref.owner.toLowerCase()}/${ref.repo.toLowerCase()}#${ref.pullNumber}`;
}

function createGitHubHeaders(token: string | null): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchAllPullRequestFiles(url: string, headers: Record<string, string>): Promise<GitHubPullRequestFile[]> {
  const files: GitHubPullRequestFile[] = [];
  let nextUrl: string | null = `${url}?per_page=100`;

  while (nextUrl) {
    const response = await fetch(nextUrl, { headers });
    if (!response.ok) {
      throw await createGitHubError(response);
    }

    files.push(...((await response.json()) as GitHubPullRequestFile[]));
    nextUrl = getNextLink(response.headers.get('Link'));
  }

  return files;
}

async function fetchJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw await createGitHubError(response);
  }

  return (await response.json()) as T;
}

async function fetchText(url: string, headers: Record<string, string>): Promise<string> {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw await createGitHubError(response);
  }

  return response.text();
}

function getNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) {
    return null;
  }

  const nextPart = linkHeader.split(',').find((part) => part.includes('rel="next"'));
  const match = nextPart?.match(/<([^>]+)>/);
  return match?.[1] ?? null;
}

async function createGitHubError(response: Response): Promise<Error> {
  const body = await response.text().catch(() => '');
  const message = body ? `${response.status} ${response.statusText}: ${body}` : `${response.status} ${response.statusText}`;
  return new Error(`GitHub API request failed (${message})`);
}
