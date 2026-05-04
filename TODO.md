# TODO — Deferred Tasks

## Pre-Launch

### Tune HubSpot content extraction
**Priority: Medium — verify extraction quality on each linked page**

`public/proxy.php` strips `<header>`, `<footer>`, `<nav>`, all scripts, and styles, then
extracts `<main>` (falling back to `<body>`). This works for standard HubSpot templates but
may need adjustment once real pages are loaded:

- If HubSpot doesn't use a semantic `<main>`, the body fallback may include unwanted wrapper
  divs. Inspect the rendered output and add more specific element removal in `_hs_extract()`
  if needed.
- HubSpot `srcset` attributes on `<img>` are not yet rewritten to absolute URLs — only `src`
  and `href` are handled. Add a `srcset` rewrite pass if responsive images break.
- The 1-hour disk cache (`HS_CACHE_TTL`) can be adjusted or cleared by deleting
  `/tmp/cesmii_*.html` on the server.

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
