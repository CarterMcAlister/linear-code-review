// AB-2 SCREENSHOT DEMO CHANGE: intentionally noisy edits in src/content/github.ts

export const AB2_DEMO_REVIEW_MODES = [
  'overview-heavy',
  'file-tree-focused',
  'inline-comment-tour',
  'large-pr-navigation',
  'keyboard-review-flow',
] as const;

export type Ab2DemoReviewMode = (typeof AB2_DEMO_REVIEW_MODES)[number];

export function describeAb2DemoReviewMode(mode: Ab2DemoReviewMode): string {
  const labels: Record<Ab2DemoReviewMode, string> = {
    'overview-heavy': 'Large overview with lots of pull request metadata',
    'file-tree-focused': 'Screenshot path that emphasizes the file tree',
    'inline-comment-tour': 'Screenshot path that pretends to walk through comments',
    'large-pr-navigation': 'Screenshot path for jumping around big PRs',
    'keyboard-review-flow': 'Screenshot path for keyboard-driven review flows',
  };

  return labels[mode];
}

export function createAb2DemoCacheKey(owner: string, repo: string, pullNumber: number, mode: Ab2DemoReviewMode): string {
  return `${owner.toLowerCase()}/${repo.toLowerCase()}#${pullNumber}:${mode}`;
}

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
  return new Error(`AB-2 demo enhanced GitHub API request failed (${message})`);
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

