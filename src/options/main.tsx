import { FormEvent, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function OptionsApp() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    chrome.storage.sync.get('githubToken').then((stored) => {
      if (typeof stored.githubToken === 'string') {
        setToken(stored.githubToken);
      }
    });
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await chrome.storage.sync.set({ githubToken: token.trim() });
    setStatus('Saved. Reload Linear tabs for the token to take effect.');
  }

  async function clear() {
    await chrome.storage.sync.remove('githubToken');
    setToken('');
    setStatus('Token cleared.');
  }

  return (
    <main>
      <h1>Linear View Diff</h1>
      <p>Add a fine-grained GitHub token if you need private repo access or higher rate limits.</p>
      <form onSubmit={save}>
        <label htmlFor="github-token">GitHub token</label>
        <input
          id="github-token"
          type="password"
          value={token}
          placeholder="github_pat_…"
          onChange={(event) => setToken(event.currentTarget.value)}
          autoComplete="off"
        />
        <div className="actions">
          <button type="submit">Save token</button>
          <button type="button" onClick={clear}>Clear</button>
        </div>
      </form>
      {status ? <p className="status">{status}</p> : null}
      <p className="hint">Recommended token scope: read-only access to Contents and Pull requests for the target repositories.</p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<OptionsApp />);
