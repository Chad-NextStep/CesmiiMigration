# CESMII Website — Architecture & Design Overview

*Written for a semi-technical Product Manager.*

---

## What this project does

This repository controls the **navigation shell** of cesmii.org — the top bar, header, main nav, and footer that appear on every page. It does not contain the page content itself; that lives in HubSpot, where the content team works.

When a visitor loads a page on cesmii.org, they get:
- Our chrome (nav, header, footer) — rendered from this repo
- The page content — fetched from HubSpot and injected directly into the shell

This separation means the content team keeps full control over page layouts, design, and campaigns in HubSpot, while our server owns the navigation and brand chrome.

---

## How the site map works

The file **`gloomap.xml`** is the single source of truth for the site's navigation structure. A non-technical person designs the site map visually in [Gloomaps](https://www.gloomaps.com), exports it as XML, and commits the file to this repo. Running the build generates the entire site from it.

Each box in the Gloomaps diagram becomes a nav item. To attach a URL to a nav item, the box's label uses a two-line format:

```
Page Label
#https://page-url-here
```

Two URL types are supported:

| Prefix | Meaning | Example |
|--------|---------|---------|
| `#https://...` | HubSpot page — fetched server-side and injected into the shell | `#https://43818189.hs-sites.com/our-story` |
| `#/path` | Local static file in this repo | `#/index.html` |

If a box has no URL line, it appears in the navigation as a label but no page is generated for it. This lets you build out the navigation structure ahead of the content — placeholder items show in dropdown menus in a dimmed style.

---

## How a change gets published

1. A non-technical person edits the site map in Gloomaps, adding or rearranging boxes and `#url` lines
2. They export the XML and commit `gloomap.xml` to this repo
3. The web server picks up the change automatically — a cron job runs `deploy.sh` every 10 minutes, pulls from git, and rebuilds if anything changed

There is no Node.js server running in production. The build produces HTML and PHP files that nginx serves directly. This is fast, simple, and cheap to host.

---

## Content: HubSpot vs. static pages

**HubSpot pages** are the default. The content team creates and manages these in HubSpot's page editor. When a visitor loads the page, our server fetches the HubSpot content, strips HubSpot's own chrome, and injects the body into our shell. The content team is responsible for ensuring HubSpot page templates do not render HubSpot's own header/footer (since we supply those).

**Static pages** are HTML files stored in `public/` in this repo. They are injected directly into the page shell at build time. Static pages are appropriate for content that doesn't need HubSpot's CMS tooling, such as a Privacy Statement, a custom landing page, or the homepage.

---

## The homepage

The homepage is currently a static page (`public/index.html`). It is referenced in `gloomap.xml` on the root box:

```
cesmii.org
#/index.html
```

---

## Key files

| File | Purpose |
|------|---------|
| `gloomap.xml` | Site map and nav source of truth — edit this to change navigation |
| `build.js` | Build script — reads gloomap, generates `out/` |
| `public/proxy.php` | Server-side HubSpot content proxy (included by generated PHP pages) |
| `public/css/theme-bridge.css` | All styles for the nav shell (header, footer, chrome) |
| `public/js/app.js` | Interactivity for the shell (mobile nav, dropdowns, scroll effects) |
| `public/images/` | Logo and shared image assets |
| `nginx-example.config` | Reference nginx config for production deployment |
| `deploy.sh` | Cron-driven deploy script — git pull + conditional rebuild |
| `TODO.md` | Deferred tasks and known pre-launch items |
| `out/` | Generated site — served by nginx (not committed to git) |

---

## Local development

```bash
npm install       # first time only
npm run dev       # build + start local server at http://localhost:3000
```

Note: the site uses absolute asset paths (`/css/...`, `/js/...`) so it must be served over HTTP — opening HTML files directly in a browser won't work.

---

## Known limitations and deferred work

See **`TODO.md`** for the full list.

---

## Build and deploy

### Local development

```bash
npm install       # first time only
npm run dev       # build + start local server at http://localhost:3000
```

### Production deployment

The server runs `deploy.sh` via cron every 10 minutes. Committing to `main` is all that's needed — the server picks it up automatically.

To trigger an immediate deploy, SSH into the server and run:

```bash
/var/www/cesmii/deploy.sh
```

Logs are at `/var/log/cesmii-deploy.log`.

### What lives on the server

The full repo is checked out at `/var/www/cesmii/`. nginx serves the `out/` subdirectory as the document root. `deploy.sh` runs `build.js` in place — there is no separate upload step.

---

## Roles and responsibilities

| Area | Owner |
|------|-------|
| Page content, layouts, campaigns | Content team (HubSpot) |
| Site navigation structure | Gloomaps → `gloomap.xml` |
| Chrome styles (header, footer) | This repo |
| Static pages (homepage, privacy, etc.) | This repo |
| Build and deployment | Developer |
