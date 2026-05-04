# CESMII Website — Developer Notes for Claude

This file is read by Claude Code at session start. It covers architecture decisions,
current state, and things that aren't obvious from reading the code alone.

---

## Architecture in one sentence

`gloomap.xml` → `build.js` → `out/` (static HTML + PHP files) → nginx serves them.

---

## How content loading works

HubSpot pages (gloomap URLs starting with `https://`) are fetched **server-side** at
request time by `public/proxy.php`. The build generates `index.php` files for those
pages; nginx passes them to PHP-FPM which calls `hs_fetch()` in proxy.php.

Static pages (gloomap URLs starting with `/`) are read from `public/` at **build time**
and injected directly into the shell HTML. They produce `index.html` files.

Gloomap entries with **no URL** appear in the nav but produce **no output file**. They
are nav structure only — placeholders for content not yet linked.

---

## Key files

| File | What a developer touches |
|------|--------------------------|
| `gloomap.xml` | Site map and nav — edit in Gloomaps, export, commit |
| `build.js` | Build orchestrator — reads gloomap, writes `out/` |
| `lib/gloomap-parser.js` | Parses gloomap XML into a nav tree |
| `lib/shell-renderer.js` | Renders the HTML/PHP shell for each page |
| `public/proxy.php` | PHP function library — `hs_fetch()` fetches and strips HubSpot pages |
| `public/css/theme-bridge.css` | All chrome styles (header, nav, footer, content areas) |
| `public/js/app.js` | Client-side nav interactivity (mobile toggle, dropdowns, scroll) |
| `nginx-example.config` | Reference nginx config for production (HTTP redirect + HTTPS) |
| `deploy.sh` | Cron-driven deploy script — git pull + conditional rebuild |

---

## Build behaviour

- `out/` is wiped and regenerated on every build — never edit files there directly.
- `public/` is copied to `out/` first, then gloomap pages are written on top.
- HubSpot pages → `out/{path}/index.php`
- Static pages → `out/{path}/index.html`
- Entries without URLs → nothing written, but the entry still appears in the nav.

---

## Server requirements

- **OS:** Ubuntu 24.04 LTS
- **nginx** with PHP-FPM: `php8.3-fpm`, `php8.3-curl`, `php8.3-xml`
- **Node.js** for the build (only needed at build time, not at runtime)
- The full repo is checked out on the server at `/var/www/cesmii/` (not just `out/`)
- nginx serves `out/` as the document root — see `nginx-example.config`

---

## Deployment

`deploy.sh` is the deploy mechanism — intended to run from cron:

```
*/10 * * * * /var/www/cesmii/deploy.sh >> /var/log/cesmii-deploy.log 2>&1
```

It: pulls from git, detects changes via HEAD hash comparison, runs `npm install` if
`node_modules/` is missing or `package-lock.json` changed, then runs `build.js`.
Also builds on first run if `out/` doesn't exist yet (fresh clone).

---

## PHP proxy details

`proxy.php` is a function library, not a web endpoint. Direct access is blocked by
nginx (`location = /proxy.php { return 404; }`).

Generated `index.php` pages include it like this:
```php
require_once $_SERVER['DOCUMENT_ROOT'] . '/proxy.php';
echo hs_fetch('https://43818189.hs-sites.com/page-slug');
```

`hs_fetch()` caches results in `/tmp/cesmii_<md5>.html` for 1 hour. On upstream
failure it serves stale cache rather than an error. Clear cache by deleting those files.

Content extraction strips `<script>`, `<style>`, `<link>`, `<header>`, `<footer>`,
`<nav>`, `<iframe>` via DOMDocument, then prefers `<main>` with `<body>` as fallback.
Root-relative URLs (`src="/..."`, `href="/..."`) are rewritten to absolute HubSpot URLs.
If extraction quality is wrong for a specific page, adjust `_hs_extract()` in proxy.php.

---

## Things to watch for

- **`add_header` inheritance in nginx:** a `location` block that defines any `add_header`
  directive does NOT inherit `add_header` from the outer server block. Security headers
  are therefore repeated in every location block that sets headers. This is intentional.
- **PHP pages need PHP-FPM running** — if pages return 502, check `systemctl status php8.3-fpm`.
- **Stale deploy lock** — if deploy.sh was killed mid-run, remove `/tmp/cesmii-deploy.lock`
  manually before the next run.
- **srcset not rewritten** — `hs_rewrite_urls()` handles `src` and `href` but not `srcset`.
  If responsive images break on a proxied page, add a srcset rewrite pass in proxy.php.
