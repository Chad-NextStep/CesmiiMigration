/**
 * app.js — Shared header/footer injection, theme asset loading, getConfig(), utilities
 * Uses HubSpot "Dark Business Theme" markup patterns.
 */

// --- Theme CSS & JS assets (injected into <head> / end of <body>) ---
const PORTAL_ID = '43818189';
const HS_ASSETS = `https://${PORTAL_ID}.hs-sites.com/hubfs/hub_generated`;

const THEME_CSS = [
  'https://unpkg.com/aos@2.3.4/dist/aos.css',
  `${HS_ASSETS}/template_assets/1/212022459039/1777565694123/template_main.min.css`,
  `${HS_ASSETS}/template_assets/1/212022459043/1777565694016/template_theme-overrides.min.css`,
  `${HS_ASSETS}/module_assets/1/205200445813/1768561361685/module_Heading_Section.min.css`,
  `${HS_ASSETS}/module_assets/1/205201196089/1768561361685/module_CTA_Strip.min.css`,
  `${HS_ASSETS}/module_assets/1/205201196087/1768561361685/module_Logo_Slider.min.css`,
  `${HS_ASSETS}/module_assets/1/205201196086/1768561361685/module_FAQ_Column.min.css`,
  `${HS_ASSETS}/module_assets/1/205200445811/1768561361731/module_Hero_Section.min.css`,
];

const THEME_JS = [
  `${HS_ASSETS}/template_assets/1/212025818169/1777565694874/template_main.min.js`,
  `${HS_ASSETS}/module_assets/1/205201196087/1768561361685/module_Logo_Slider.min.js`,
  `${HS_ASSETS}/module_assets/1/205201196086/1768561361685/module_FAQ_Column.min.js`,
  'https://unpkg.com/aos@2.3.4/dist/aos.js',
];

function injectThemeAssets() {
  // Inject theme CSS into <head>
  THEME_CSS.forEach(function (url) {
    if (!document.querySelector('link[href="' + url + '"]')) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    }
  });

  // Inject bridge CSS
  if (!document.querySelector('link[href="/css/theme-bridge.css"]')) {
    var bridge = document.createElement('link');
    bridge.rel = 'stylesheet';
    bridge.href = '/css/theme-bridge.css';
    document.head.appendChild(bridge);
  }

  // Inject theme JS at end of body
  var loaded = 0;
  THEME_JS.forEach(function (url) {
    if (!document.querySelector('script[src="' + url + '"]')) {
      var script = document.createElement('script');
      script.src = url;
      script.onload = function () {
        loaded++;
        if (loaded === THEME_JS.length && window.AOS) {
          AOS.init();
        }
      };
      document.body.appendChild(script);
    }
  });
}

// --- Header / Footer injection ---
function injectHeader() {
  var el = document.getElementById('site-header');
  if (!el) return;

  var path = window.location.pathname;

  var navItems = [
    {
      label: 'About',
      children: [
        { href: '/about.html', label: 'About CESMII' },
        { href: '/our-story.html', label: 'Our Story' },
        { href: '/team.html', label: 'Team' },
        { href: '/board-of-directors.html', label: 'Board of Directors' },
        { href: '/sm-executive-council.html', label: 'SM Executive Council' },
      ],
    },
    { href: '/membership.html', label: 'Membership' },
    { href: '/technology.html', label: 'Our Focus' },
    { href: '/projects.html', label: 'Impact' },
    { href: '/blog.html', label: 'News & Events' },
    { href: '/test.html', label: 'Test' },
  ];

  var menuHtml = navItems.map(function (item) {
    if (item.children) {
      var childLinks = item.children.map(function (child) {
        var isActive = path === child.href || (child.href !== '/' && path.startsWith(child.href.replace('.html', '')));
        return '<li><a href="' + child.href + '"' + (isActive ? ' class="active"' : '') + '>' + child.label + '</a></li>';
      }).join('');
      var parentActive = item.children.some(function (child) {
        return path === child.href || (child.href !== '/' && path.startsWith(child.href.replace('.html', '')));
      });
      return '<li class="hs-menu-item hs-menu-depth-1 hs-item-has-children">'
        + '<a href="javascript:void(0)" class="' + (parentActive ? 'active' : '') + '">' + item.label + '</a>'
        + '<ul class="hs-menu-children-wrapper">' + childLinks + '</ul>'
        + '</li>';
    }
    var isActive = path === item.href || (item.href !== '/' && path.startsWith(item.href.replace('.html', '')));
    return '<li class="hs-menu-item hs-menu-depth-1"><a href="' + item.href + '"' + (isActive ? ' class="active"' : '') + '>' + item.label + '</a></li>';
  }).join('');

  el.innerHTML = ''
    + '<header class="header">'
    +   '<div class="header__container content-wrapper">'
    +     '<div class="header__logo">'
    +       '<a href="/">'
    +         '<img src="/images/cesmii-logo.png" alt="CESMII — The Smart Manufacturing Institute" style="height:44px;width:auto;">'
    +       '</a>'
    +     '</div>'
    +     '<nav class="header__navigation" aria-label="Main navigation">'
    +       '<ul class="hs-menu-wrapper hs-menu-flow-horizontal">'
    +         menuHtml
    +       '</ul>'
    +     '</nav>'
    +     '<div class="header__buttons">'
    +       '<a href="/membership.html" class="button">Become a Member</a>'
    +     '</div>'
    +     '<button class="header__burger" aria-label="Toggle navigation">'
    +       '<span></span><span></span><span></span>'
    +     '</button>'
    +   '</div>'
    + '</header>';

  // Mobile toggle
  var burger = el.querySelector('.header__burger');
  var nav = el.querySelector('.header__navigation');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      nav.classList.toggle('open');
      burger.classList.toggle('is-active');
    });
  }

  // Dropdown hover/click for children
  el.querySelectorAll('.hs-item-has-children').forEach(function (li) {
    li.addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        li.classList.toggle('open');
      }
    });
  });
}

function injectFooter() {
  var el = document.getElementById('site-footer');
  if (!el) return;

  var year = new Date().getFullYear();
  el.innerHTML = ''
    + '<footer class="footer">'
    +   '<div class="footer__container content-wrapper">'
    +     '<div class="footer__columns__grid">'
    +       '<div class="footer__col">'
    +         '<a href="/" class="footer__logo">'
    +           '<img src="/images/cesmii-logo.png" alt="CESMII" style="height:40px;width:auto;margin-bottom:0.75rem;">'
    +         '</a>'
    +         '<div class="footer__social" style="display:flex;gap:0.75rem;margin-top:0.5rem;">'
    +           '<a href="https://www.linkedin.com/company/clean-energy-smart-manufacturing-innovation-institute" target="_blank" rel="noopener" aria-label="LinkedIn">'
    +             '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>'
    +           '</a>'
    +           '<a href="https://www.youtube.com/@caborakah" target="_blank" rel="noopener" aria-label="YouTube">'
    +             '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>'
    +           '</a>'
    +           '<a href="https://github.com/cesmii" target="_blank" rel="noopener" aria-label="GitHub">'
    +             '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>'
    +           '</a>'
    +         '</div>'
    +       '</div>'
    +       '<div class="footer__col">'
    +         '<h4>Quick Links</h4>'
    +         '<ul>'
    +           '<li><a href="/about.html">About</a></li>'
    +           '<li><a href="/technology.html">Technology</a></li>'
    +           '<li><a href="/education.html">Education</a></li>'
    +           '<li><a href="/projects.html">Projects</a></li>'
    +           '<li><a href="/ecosystem.html">Ecosystem</a></li>'
    +         '</ul>'
    +       '</div>'
    +       '<div class="footer__col">'
    +         '<h4>Get Involved</h4>'
    +         '<ul>'
    +           '<li><a href="/membership.html">Membership</a></li>'
    +           '<li><a href="/blog.html">News & Events</a></li>'
    +           '<li><a href="/contact.html">Contact Us</a></li>'
    +         '</ul>'
    +       '</div>'
    +       '<div class="footer__col">'
    +         '<h4>Contact</h4>'
    +         '<p>Los Angeles, California</p>'
    +         '<p><a href="tel:8887208096">(888) 720-8096</a></p>'
    +         '<p><a href="mailto:info@cesmii.org">info@cesmii.org</a></p>'
    +       '</div>'
    +     '</div>'
    +     '<div class="footer__bottom" style="border-top:1px solid rgba(255,255,255,0.08);text-align:center;padding:1.25rem 1.5rem;font-size:0.8rem;color:rgba(255,255,255,0.35);margin-top:2rem;">'
    +       '<p>&copy; ' + year + ' CESMII &ndash; The Smart Manufacturing Institute</p>'
    +     '</div>'
    +   '</div>'
    + '</footer>';
}

// --- Config cache ---
var _configPromise = null;

function getConfig() {
  if (_configPromise) return _configPromise;

  var cached = sessionStorage.getItem('hubspot_config');
  if (cached) {
    _configPromise = Promise.resolve(JSON.parse(cached));
    return _configPromise;
  }

  _configPromise = fetch('/api/config')
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load config');
      return res.json();
    })
    .then(function (config) {
      sessionStorage.setItem('hubspot_config', JSON.stringify(config));
      return config;
    });

  return _configPromise;
}

// --- Utilities ---
function formatDate(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trimEnd() + '...';
}

function stripHtml(html) {
  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function getQueryParam(name) {
  var params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function showLoading(container) {
  container.innerHTML = '<div class="loading">Loading...</div>';
}

function showError(container, message) {
  container.innerHTML = '<div class="error-message">' + message + '</div>';
}

// --- Scroll listener for header ---
function initScrollListener() {
  var header = document.querySelector('.header');
  if (!header) return;

  window.addEventListener('scroll', function () {
    if (window.scrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// --- Init on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', function () {
  injectThemeAssets();
  injectHeader();
  injectFooter();
  initScrollListener();
});
