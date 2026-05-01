# CESMII Website — Architecture & Design Overview

*Written for a semi-technical Product Manager.*

---

## What this project does

This repository controls the **navigation shell** of cesmii.org — the top bar, header, main nav, and footer that appear on every page. It does not contain the page content itself; that lives in HubSpot, where the content team works.

When a visitor loads a page on cesmii.org, they get:
- Our chrome (nav, header, footer) — rendered from this repo
- The page content — loaded from HubSpot inside an embedded frame

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
| `#https://...` | HubSpot page — loaded in an embedded frame | `#https://43818189.hs-sites.com/our-story` |
| `#/path` | Local static file in this repo | `#/pages/home.html` |

If a box has no URL line, the nav item is still generated as a navigable page, but it shows a "coming soon" placeholder. This means you can build out the navigation structure ahead of the content.

---

## How a change gets published

1. A non-technical person edits the site map in Gloomaps, adding or rearranging boxes and `#url` lines
2. They export the XML and commit `gloomap.xml` to this repo
3. A developer runs `npm run build` — this generates the complete site into an `out/` folder in about 40ms
4. The `out/` folder is deployed to the nginx web server

There is no Node.js server running in production. The build produces plain HTML files that nginx serves statically. This is fast, simple, and cheap to host.

---

## Content: HubSpot vs. static pages

**HubSpot pages** are the default. The content team creates and manages these in HubSpot's page editor. Our server loads them inside an embedded frame. The content team is responsible for ensuring HubSpot page templates do not render HubSpot's own header/footer (since we supply those).

**Static pages** are HTML files stored in `public/pages/` in this repo. They are injected directly into the page shell at build time — no frame involved. Static pages are appropriate for content that doesn't need HubSpot's CMS tooling, such as a Privacy Statement, a custom landing page, or the homepage (which currently uses a static file).

---

## The homepage

The homepage is currently a static page (`public/pages/home.html`). It is referenced in `gloomap.xml` on the root box:

```
cesmii.org
#/pages/home.html
```

---

## Key files

| File | Purpose |
|------|---------|
| `gloomap.xml` | Site map and nav source of truth — edit this to change navigation |
| `build.js` | Build script — reads gloomap, generates `out/` |
| `public/css/theme-bridge.css` | All styles for the nav shell (header, footer, chrome) |
| `public/js/app.js` | Interactivity for the shell (mobile nav, dropdowns, scroll effects) |
| `public/pages/` | Static page fragments (homepage, future privacy page, etc.) |
| `public/images/` | Logo and shared image assets |
| `nginx.conf` | Ready-to-use nginx server configuration |
| `TODO.md` | Deferred tasks and known pre-launch items |
| `out/` | Generated site — what gets deployed (not committed to git) |

---

## Local development

```bash
npm install       # first time only
npm run dev       # build + start local server at http://localhost:3000
```

Note: the site uses absolute asset paths (`/css/...`, `/js/...`) so it must be served over HTTP — opening HTML files directly in a browser won't work.

---

## Known limitations and deferred work

See **`TODO.md`** for the full list. The two most important items before production launch:

**1. Iframe → proxy rewrite (SEO)**
Content loaded in an embedded frame is invisible to search engines. Before launch, the HubSpot content loader should be replaced with a server-side proxy that fetches the HubSpot page, strips its chrome, and injects the body directly into our shell. The server runs nginx + PHP 7, so this can be a PHP script — no new runtime dependencies. The swap point in the code is `renderIframeContent()` in `lib/shell-renderer.js`.

**2. X-Frame-Options on HubSpot pages**
HubSpot pages may include headers that prevent them from being loaded in a frame from another domain. The HubSpot template used for iframed pages must be confirmed to not set these headers. If they do, the proxy approach becomes an immediate requirement.

---

## Build and deploy (SFTP / FileZilla)

### 1. Build the site

```bash
npm run build
```

This regenerates the `out/` folder from scratch. The entire process takes under a second. Always run a fresh build before deploying — never upload a stale `out/` from a previous session.

### 2. Connect to the server in FileZilla

- **Protocol:** SFTP
- **Host:** your server hostname or IP
- **Port:** 22
- **Logon type:** your credentials or key file

### 3. Upload the contents of `out/`

On the **remote** side, navigate to `/var/www/cesmii/out/`.

On the **local** side, open the `out/` folder inside this project.

Select all files and folders inside `out/` and upload them, choosing **overwrite** when prompted. You are uploading the *contents* of `out/`, not the folder itself — the remote path should end in `out/`, not `out/out/`.

> **Tip — use "Synchronized Browsing" in FileZilla:**
> Site Manager → your connection → Advanced tab → check *Synchronized browsing* and set the local directory to this project's `out/` folder and the remote directory to `/var/www/cesmii/out/`. After that, navigating locally mirrors the remote side, making uploads easier.

### 4. Verify

Open `https://cesmii.org` in a browser and confirm the nav and pages load correctly. Because the files are static HTML, changes take effect immediately — there is no cache to clear on the server.

### What gets deployed

Only the `out/` folder is deployed. Everything else in this repo (source files, `node_modules`, `build.js`, etc.) stays local. The `out/` folder is excluded from git for this reason.

---

## Roles and responsibilities

| Area | Owner |
|------|-------|
| Page content, layouts, campaigns | Content team (HubSpot) |
| Site navigation structure | Gloomaps → `gloomap.xml` |
| Chrome styles (header, footer) | This repo |
| Static pages (homepage, privacy, etc.) | This repo |
| Build and deployment | Developer |
