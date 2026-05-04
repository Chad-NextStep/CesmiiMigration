/**
 * shell-renderer.js
 *
 * Renders the full HTML page shell: top-bar, header with server-side nav,
 * main content area (iframe for HubSpot pages or injected HTML for static pages),
 * and footer. No client-side HTML injection — everything is in the initial response.
 *
 * The content area uses a flex-column full-viewport layout so the iframe fills
 * exactly the space between header and footer and scrolls internally.
 * See TODO.md for the planned swap to a proxy/rewrite approach.
 */

const fs = require('fs');
const path = require('path');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- Nav HTML builders ---

function buildDropdownItem(child, currentPath) {
  const isActive = currentPath === child.localPath ||
    currentPath.startsWith(child.localPath + '/');
  if (child.url) {
    return `<li><a href="${child.localPath}"${isActive ? ' class="active"' : ''}>${escapeHtml(child.label)}</a></li>`;
  }
  return `<li><span class="nav-label"${isActive ? ' class="active"' : ''}>${escapeHtml(child.label)}</span></li>`;
}

function buildNavItem(item, currentPath) {
  const isActive = currentPath === item.localPath ||
    currentPath.startsWith(item.localPath + '/');

  if (item.children.length > 0) {
    const childrenHtml = item.children.map((c) => buildDropdownItem(c, currentPath)).join('');
    const activeClass = isActive ? ' active' : '';
    return `
        <li class="nav-dropdown${activeClass}">
          <button class="nav-dropdown-btn${activeClass}" aria-expanded="false">
            ${escapeHtml(item.label)}
            <svg class="dropdown-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg>
          </button>
          <ul class="dropdown-menu">${childrenHtml}</ul>
        </li>`;
  }

  const href = item.url ? item.localPath : null;
  const activeClass = isActive ? ' class="active"' : '';
  if (href) {
    return `<li><a href="${href}"${activeClass}>${escapeHtml(item.label)}</a></li>`;
  }
  return `<li><span class="nav-label"${activeClass}>${escapeHtml(item.label)}</span></li>`;
}

function buildNavHtml(navItems, currentPath) {
  return navItems.map((item) => buildNavItem(item, currentPath)).join('\n');
}

// --- Content area builders ---

/**
 * HubSpot content: fetched server-side by proxy.php and injected directly.
 * The URL is hardcoded into the generated .php file at build time.
 */
function renderProxyContent(url) {
  const safeUrl = url.replace(/'/g, "\\'");
  return `<div class="content-proxy"><?php require_once $_SERVER['DOCUMENT_ROOT'] . '/proxy.php'; echo hs_fetch('${safeUrl}'); ?></div>`;
}

/**
 * Static content: read a local HTML file from public/ and inject it directly.
 * filePath is relative to public/, e.g. "/pages/privacy.html".
 */
function renderStaticContent(filePath, projectRoot) {
  try {
    const abs = path.join(projectRoot, 'public', filePath);
    return `<div class="content-static">${fs.readFileSync(abs, 'utf8')}</div>`;
  } catch {
    return '<div class="content-error">Page content unavailable.</div>';
  }
}

function renderNotFound() {
  return `
    <div class="content-not-found">
      <h1>Page Not Found</h1>
      <p>The page you&rsquo;re looking for doesn&rsquo;t exist or hasn&rsquo;t been linked yet.</p>
      <a href="/" class="btn-primary">Return Home</a>
    </div>`;
}

function renderPlaceholder(label) {
  return `
    <div class="content-placeholder">
      <p>Content for <strong>${escapeHtml(label)}</strong> is coming soon.</p>
    </div>`;
}

// --- Social SVG icons (inlined to avoid extra requests) ---

const ICON_LINKEDIN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;
const ICON_YOUTUBE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
const ICON_GITHUB = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`;

// --- Full shell ---

function renderShell({ navItems, title, currentPath, contentHtml, contentType }) {
  const navHtml = buildNavHtml(navItems, currentPath);
  const pageTitle = title ? `${escapeHtml(title)} – CESMII` : 'CESMII – The Smart Manufacturing Institute';
  const year = new Date().getFullYear();
  const bodyClass = 'site-body';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <link rel="stylesheet" href="/css/theme-bridge.css">
</head>
<body class="${bodyClass}">

  <header class="site-header" id="site-header">
    <div class="header-inner">
      <a href="/" class="site-logo" aria-label="CESMII home">
        <img src="/images/cesmii-logo.png" alt="CESMII" class="logo-img">
      </a>
      <div class="header-right">
        <div class="top-bar-row">
          <a href="/membership/become-a-member" class="top-bar-btn">Become a Member</a>
          <a href="/our-focus/sm-roadmapping" class="top-bar-btn top-bar-btn-secondary">Start Your Roadmap</a>
          <div class="top-bar-social">
            <a href="https://www.linkedin.com/company/clean-energy-smart-manufacturing-innovation-institute" target="_blank" rel="noopener" aria-label="LinkedIn">${ICON_LINKEDIN}</a>
            <a href="https://www.youtube.com/@caborakah" target="_blank" rel="noopener" aria-label="YouTube">${ICON_YOUTUBE}</a>
            <a href="https://github.com/cesmii" target="_blank" rel="noopener" aria-label="GitHub">${ICON_GITHUB}</a>
          </div>
        </div>
        <nav aria-label="Main">
          <ul class="nav-links" id="nav-links">
            ${navHtml}
          </ul>
        </nav>
      </div>
      <button class="nav-toggle" aria-label="Open navigation" aria-expanded="false" aria-controls="nav-links">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>

  <main class="site-content" id="site-content">
    ${contentHtml}
  </main>

  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-col footer-brand">
        <img src="/images/cesmii-logo.png" alt="CESMII" class="footer-logo-img">
        <p class="footer-tagline">The Smart Manufacturing Institute</p>
        <div class="footer-social">
          <a href="https://www.linkedin.com/company/clean-energy-smart-manufacturing-innovation-institute" target="_blank" rel="noopener" aria-label="LinkedIn">${ICON_LINKEDIN}</a>
          <a href="https://www.youtube.com/@caborakah" target="_blank" rel="noopener" aria-label="YouTube">${ICON_YOUTUBE}</a>
          <a href="https://github.com/cesmii" target="_blank" rel="noopener" aria-label="GitHub">${ICON_GITHUB}</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>About</h4>
        <ul>
          <li><a href="/about/our-story">Our Story</a></li>
          <li><a href="/about/team">Team</a></li>
          <li><a href="/about/board-of-directors">Board of Directors</a></li>
          <li><a href="/about/sm-executive-council">SM Executive Council</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Get Involved</h4>
        <ul>
          <li><a href="/membership/become-a-member">Become a Member</a></li>
          <li><a href="/news-events">News &amp; Events</a></li>
          <li><a href="/about/contact-us">Contact Us</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Contact</h4>
        <p>Los Angeles, California</p>
        <p><a href="tel:8887208096">(888) 720-8096</a></p>
        <p><a href="mailto:info@cesmii.org">info@cesmii.org</a></p>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; ${year} CESMII &ndash; The Smart Manufacturing Institute</p>
    </div>
  </footer>

  <script src="/js/app.js"></script>
</body>
</html>`;
}

module.exports = { renderShell, renderProxyContent, renderStaticContent, renderNotFound, renderPlaceholder };
