// shows directory listing and previews file contents using the github Contents API
(function () {
  const owner = 'shugga228';
  const repo = 'India2_VaaniConnect';
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents`;

  const listEl = document.getElementById('repo-list');
  const previewEl = document.getElementById('repo-preview');
  const breadEl = document.getElementById('repo-breadcrumb');
  const statusEl = document.getElementById('repo-status');

  let currentPath = '';

  function setStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.style.color = isError ? '#ff8080' : '';
  }

  function renderBreadcrumb(path) {
    if (!breadEl) return;
    const parts = path ? path.split('/') : [];
    const container = document.createDocumentFragment();

    const rootBtn = document.createElement('button');
    rootBtn.textContent = 'root';
    rootBtn.className = 'repo-breadcrumb-item';
    rootBtn.addEventListener('click', () => loadContents(''));
    container.appendChild(rootBtn);

    let acc = '';
    parts.forEach((p, i) => {
      acc = acc ? acc + '/' + p : p;
      const sep = document.createElement('span');
      sep.textContent = ' / ';
      container.appendChild(sep);

      const btn = document.createElement('button');
      btn.textContent = p;
      btn.className = 'repo-breadcrumb-item';
      btn.addEventListener('click', () => loadContents(acc));
      container.appendChild(btn);
    });

    breadEl.innerHTML = '';
    breadEl.appendChild(container);
  }

  function renderList(items) {
    if (!listEl) return;
    listEl.innerHTML = '';

    items.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'dir' ? -1 : 1;
    });

    items.forEach(item => {
      const li = document.createElement('div');
      li.className = 'repo-item';

      const icon = document.createElement('span');
      icon.className = 'repo-item-icon';
      icon.textContent = item.type === 'dir' ? '📁' : '📄';
      li.appendChild(icon);

      const name = document.createElement('button');
      name.className = 'repo-item-name';
      name.textContent = item.name;
      name.title = item.path;
      name.addEventListener('click', () => {
        if (item.type === 'dir') loadContents(item.path);
        else loadFile(item);
      });
      li.appendChild(name);

      if (item.type === 'file') {
        const size = document.createElement('span');
        size.className = 'repo-item-size';
        size.textContent = `${Math.round((item.size || 0)/1024)} KB`;
        li.appendChild(size);
      }

      listEl.appendChild(li);
    });
  }

  async function loadContents(path) {
    setStatus('Loading...');
    currentPath = path || '';
    renderBreadcrumb(currentPath);
    try {
      const url = apiBase + (currentPath ? '/' + encodeURIComponent(currentPath) : '');
      const res = await fetch(url);
      if (!res.ok) throw new Error(`GitHub API error ${res.status}`);

      const remaining = res.headers.get('x-ratelimit-remaining');
      if (remaining !== null && Number(remaining) <= 5) {
        setStatus('Warning: approaching GitHub API rate limit.', true);
      } else {
        setStatus('');
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        renderList(data);
        previewEl.innerHTML = '<div class="repo-empty">Select a file to preview its contents.</div>';
      } else {
        // If a file object is returned directly
        await loadFile(data);
      }
    } catch (err) {
      setStatus('Failed to load repository: ' + err.message, true);
      listEl.innerHTML = '';
      previewEl.innerHTML = '<div class="repo-empty">Unable to load repository contents.</div>';
    }
  }

  async function loadFile(item) {
    setStatus('Loading file...');
    try {
      // Prefer the API content (base64) which is returned from item.url
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
      const data = await res.json();
      let content = '';
      if (data.content) {
        // decode base64 content
        content = atob(data.content.replace(/\n/g, ''));
      } else if (data.download_url) {
        // fallback to raw download
        const raw = await fetch(data.download_url);
        content = await raw.text();
      } else {
        content = 'No preview available for this file.';
      }

      // Render simple previews: markdown and text shown as formatted text
      if (/\.md$/i.test(item.name)) {
        // minimal markdown rendering: show headings and paragraphs
        previewEl.innerHTML = '<div class="repo-file-markdown"><pre>' + escapeHtml(content) + '</pre></div>';
      } else if (/\.(png|jpe?g|gif|svg)$/i.test(item.name)) {
        // image preview via download_url
        const imageUrl = data.download_url || item.download_url;
        previewEl.innerHTML = `<img src="${imageUrl}" alt="${escapeHtml(item.name)}" class="repo-image">`;
      } else {
        previewEl.innerHTML = '<pre class="repo-file-text">' + escapeHtml(content) + '</pre>';
      }

      setStatus('');
    } catch (err) {
      setStatus('Failed to load file: ' + err.message, true);
      previewEl.innerHTML = '<div class="repo-empty">Unable to preview file.</div>';
    }
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    const browseBtn = document.getElementById('repo-refresh');
    if (browseBtn) browseBtn.addEventListener('click', () => loadContents(currentPath));
    loadContents('');
  });
})();
