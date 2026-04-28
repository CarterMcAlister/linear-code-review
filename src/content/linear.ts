const BUTTON_ID = 'linear-view-diff-button';
const ROOT_ID = 'linear-view-diff-root';

export function installLinearViewDiffButton(
  onOpen: (pullRequestUrl: string) => void,
  onPrefetch: (pullRequestUrl: string) => void,
): void {
  const observer = new MutationObserver(() => injectButton(onOpen, onPrefetch));
  observer.observe(document.body, { childList: true, subtree: true });
  injectButton(onOpen, onPrefetch);
}

export function getOrCreateOverlayRoot(): HTMLElement {
  const existing = document.getElementById(ROOT_ID);
  if (existing) {
    return existing;
  }

  const root = document.createElement('div');
  root.id = ROOT_ID;
  document.body.append(root);
  return root;
}

function injectButton(onOpen: (pullRequestUrl: string) => void, onPrefetch: (pullRequestUrl: string) => void): void {
  const viewPullRequestLink = findViewPullRequestLink();
  if (!viewPullRequestLink?.href) {
    return;
  }

  onPrefetch(viewPullRequestLink.href);

  if (document.getElementById(BUTTON_ID)) {
    return;
  }

  const viewPullRequestControl = findViewPullRequestControl();
  const insertion = viewPullRequestControl ? findInsertionPoint(viewPullRequestControl) : null;
  const button = createButton(viewPullRequestControl, viewPullRequestLink.href, onOpen);

  if (insertion) {
    const wrapper = document.createElement('div');
    wrapper.className = insertion.wrapperClassName;
    wrapper.append(button);
    const group = getOrCreateButtonGroup(insertion.wrapper);
    group.append(wrapper);
    return;
  }

  viewPullRequestLink.insertAdjacentElement('afterend', button);
}

function createButton(
  viewPullRequestControl: HTMLAnchorElement | HTMLButtonElement | null,
  pullRequestUrl: string,
  onOpen: (pullRequestUrl: string) => void,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.className = viewPullRequestControl?.className || 'linear-view-diff-inline-button';

  if (viewPullRequestControl instanceof HTMLElement) {
    button.setAttribute('style', viewPullRequestControl.getAttribute('style') ?? '');
  }

  button.append(createDiffIcon(viewPullRequestControl), 'View Diff');
  button.addEventListener('click', () => onOpen(pullRequestUrl));
  return button;
}

function createDiffIcon(viewPullRequestControl: HTMLAnchorElement | HTMLButtonElement | null): HTMLElement {
  const sourceIcon = viewPullRequestControl?.querySelector<HTMLElement>('span[aria-hidden="true"]');
  const icon = sourceIcon?.cloneNode(true) instanceof HTMLElement ? (sourceIcon.cloneNode(true) as HTMLElement) : document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');

  if (!sourceIcon) {
    icon.className = 'linear-view-diff-button-icon';
  }

  const iconHost = icon.querySelector('div') ?? icon;
  iconHost.replaceChildren(createDiffSvg());
  return icon;
}

function createDiffSvg(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'color-override');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('role', 'img');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'var(--icon-color, lch(61.399% 1.15 272 / 1))');
  path.setAttribute(
    'd',
    'M3.25 2.5A1.25 1.25 0 1 1 5.5 3.25h5.25a2 2 0 0 1 2 2v.94a1.25 1.25 0 1 1-1.5 0v-.94a.5.5 0 0 0-.5-.5H5.5A1.25 1.25 0 0 1 4 5.5v5a1.25 1.25 0 1 1-1.5 0v-5A1.25 1.25 0 0 1 3.25 2.5Zm8 7.31a1.25 1.25 0 1 1 1.5 0v.94a2 2 0 0 1-2 2H6.56l1.22 1.22a.75.75 0 1 1-1.06 1.06l-2.5-2.5a.75.75 0 0 1 0-1.06l2.5-2.5a.75.75 0 1 1 1.06 1.06l-1.22 1.22h4.19a.5.5 0 0 0 .5-.5v-.94Z',
  );
  svg.append(path);
  return svg;
}

function getOrCreateButtonGroup(viewPullRequestWrapper: HTMLElement): HTMLElement {
  const existingGroup = viewPullRequestWrapper.closest<HTMLElement>('[data-linear-view-diff-button-group="true"]');
  if (existingGroup) {
    return existingGroup;
  }

  const group = document.createElement('div');
  group.dataset.linearViewDiffButtonGroup = 'true';
  group.style.display = 'inline-flex';
  group.style.alignItems = 'center';
  group.style.gap = '6px';
  viewPullRequestWrapper.insertAdjacentElement('beforebegin', group);
  group.append(viewPullRequestWrapper);
  return group;
}

function findInsertionPoint(control: HTMLAnchorElement | HTMLButtonElement): { wrapper: HTMLElement; wrapperClassName: string } | null {
  const wrapper = control.parentElement;
  const row = wrapper?.parentElement;

  if (!wrapper || !row) {
    return null;
  }

  const isLikelyActionRow = row.children.length > 1 && getComputedStyle(row).display === 'flex';
  if (!isLikelyActionRow) {
    return null;
  }

  return { wrapper, wrapperClassName: wrapper.className };
}

function findViewPullRequestControl(): HTMLAnchorElement | HTMLButtonElement | null {
  const controls = Array.from(document.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>('a, button'));
  return (
    controls.find((control) => control.textContent?.trim().toLowerCase() === 'view pr') ??
    controls.find((control) => control.textContent?.toLowerCase().includes('view pr')) ??
    null
  );
}

function findViewPullRequestLink(): HTMLAnchorElement | null {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="github.com"][href*="/pull/"]'));
  return (
    links.find((link) => link.textContent?.trim().toLowerCase() === 'view pr') ??
    links.find((link) => link.textContent?.toLowerCase().includes('view pr')) ??
    links[0] ??
    null
  );
}
