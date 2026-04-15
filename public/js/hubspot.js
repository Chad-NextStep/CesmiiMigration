/**
 * hubspot.js — HubSpot API helpers
 *
 * - fetchBlogPosts / fetchBlogPost: proxied through server (auth required)
 * - fetchHubDBRows: direct client-side fetch (public, CORS-enabled)
 * - loadHubSpotFormsScript / createHubSpotForm: dynamic embed
 */

// === Blog (proxied through /api/blog) ===

async function fetchBlogPosts({ limit = 10, offset = 0 } = {}) {
  const res = await fetch(`/api/blog/posts?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error(`Blog fetch failed: ${res.status}`);
  return res.json();
}

async function fetchBlogPost(postId) {
  const res = await fetch(`/api/blog/posts/${encodeURIComponent(postId)}`);
  if (!res.ok) throw new Error(`Blog post fetch failed: ${res.status}`);
  return res.json();
}

// === HubDB (direct client-side, public endpoints) ===

async function fetchHubDBRows(tableId, { portalId } = {}) {
  if (!portalId) {
    const config = await getConfig();
    portalId = config.portalId;
  }
  const url = `https://api.hubapi.com/cms/v3/hubdb/tables/${tableId}/rows?portalId=${portalId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HubDB fetch failed: ${res.status}`);
  return res.json();
}

// === HubSpot Forms ===

let _formsScriptLoaded = false;
let _formsScriptPromise = null;

function loadHubSpotFormsScript() {
  if (_formsScriptLoaded) return Promise.resolve();
  if (_formsScriptPromise) return _formsScriptPromise;

  _formsScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.hsforms.net/forms/embed/v2.js';
    script.charset = 'utf-8';
    script.onload = () => {
      _formsScriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load HubSpot forms script'));
    document.head.appendChild(script);
  });

  return _formsScriptPromise;
}

async function createHubSpotForm({ portalId, formId, targetId, region } = {}) {
  if (!portalId || !formId) {
    const config = await getConfig();
    portalId = portalId || config.portalId;
    region = region || config.region;
  }

  await loadHubSpotFormsScript();

  hbspt.forms.create({
    region: region || 'na1',
    portalId: portalId,
    formId: formId,
    target: `#${targetId}`,
  });
}
