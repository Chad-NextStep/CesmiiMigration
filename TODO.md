# TODO — Deferred Tasks

## Pre-Launch

### Replace iframe with proxy/rewrite
**Priority: High — required before production launch**

The current architecture loads HubSpot page content in an `<iframe>`. This is a working first
pass, but has known limitations:

- **SEO**: Search engines cannot index content inside iframes. HubSpot page content will not
  appear in search results while the iframe approach is in use.
- **Scroll behavior**: Content scrolls inside the frame, not the outer page. This can feel
  slightly off on mobile or for very long pages.
- **URL bar**: The browser address bar shows our domain (good), but the iframe src is the
  HubSpot URL, which may be visible in devtools or cause confusion.

**Resolution**: Replace the iframe with a server-side proxy that fetches the HubSpot page,
strips HubSpot's own nav/footer chrome, and injects the content body into our shell. See
`lib/shell-renderer.js` for the `renderIframeContent` function — that is the swap point.

**Implementation path with PHP**: Because the server runs nginx + PHP 7, the proxy can be a
PHP script rather than a Node.js runtime. A PHP file would `file_get_contents` or `curl` the
HubSpot URL, strip the chrome with a DOM parser or regex, and return the body fragment.
`build.js` would then generate pages that `include` or `fetch` that PHP endpoint rather than
pointing to an iframe `src`. No new runtime dependencies needed.

---

### Verify X-Frame-Options / CSP on HubSpot pages
**Priority: High — required for iframe approach to work at all**

HubSpot pages may include `X-Frame-Options: SAMEORIGIN` or a `Content-Security-Policy:
frame-ancestors` header that prevents them from being loaded in an iframe from our domain.

**Resolution**: Confirm that the HubSpot template used for iframed pages does NOT set these
headers. This is a HubSpot template configuration change, not a code change in this repo.
If pages refuse to iframe, the proxy approach above becomes an immediate requirement.

---

## Post-Launch

### Automate gloomap.xml deployment
Currently a manual workflow: non-technical user edits the site map in Gloomaps, exports XML,
commits `gloomap.xml` to this repo, and a dev runs `npm run build` and deploys `out/` to the
server.

**Future**: A CI step (GitHub Actions, etc.) that runs `npm run build` on every commit to
`main` and rsyncs `out/` to the server automatically — so committing a new `gloomap.xml` is
the only step required.

---

### Static pages
The architecture supports local static HTML pages (referenced in the gloomap with a `/path`
URL rather than `https://...`). The first planned static page is the **Privacy Statement**.

When ready, add `public/pages/privacy.html` and add the entry to `gloomap.xml`:
```
Privacy Statement
#/pages/privacy.html
```

---

### Homepage
The homepage (`/`) currently falls back to a placeholder if no URL is set on the root
`cesmii.org` box in the gloomap. To set the homepage content, add a `#url` to the root box:
```
cesmii.org
#https://www.cesmii.org
```

---

### Nav items without URLs
Nav items in the gloomap that have no `#url` line render as non-linked dropdown headers.
As HubSpot pages are published, add their URLs to the gloomap so the nav items become
navigable.
