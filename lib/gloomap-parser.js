/**
 * gloomap-parser.js
 *
 * Parses a Gloomaps XML export into a navigation tree used to build the site nav
 * and register Express routes.
 *
 * URL convention in gloomap box text (two-line format):
 *   Box Label
 *   #https://www.cesmii.org/some-page   ← HubSpot page (loaded in iframe)
 *   #/pages/privacy.html                ← local static file (served from public/)
 *
 * Structural boxes (Footer, Top Nav, Legend, Notes) and any box with a black
 * background (#000000) are filtered out — they are planning artifacts, not nav items.
 */

const fs = require('fs');
const xml2js = require('xml2js');

const STRUCTURAL_LABELS = new Set(['Footer', 'Top Nav', 'Legend', 'Notes']);
const STRUCTURAL_BG = '#000000';

function str(val) {
  if (!val) return '';
  return Array.isArray(val) ? (val[0] || '') : val;
}

/**
 * Split a box's raw text into a display label and an optional URL.
 * The URL line starts with '#' and may be on the same or a subsequent line.
 */
function parseTextAndUrl(rawText) {
  const lines = str(rawText).split('\n').map((l) => l.trim()).filter(Boolean);
  const urlLineIndex = lines.findIndex((l) => l.startsWith('#'));

  const label = urlLineIndex === -1
    ? lines.join(' ')
    : lines.slice(0, urlLineIndex).join(' ') || lines[0];

  const url = urlLineIndex !== -1 ? lines[urlLineIndex].slice(1).trim() : null;
  return { label: label.trim(), url };
}

/**
 * Convert a display label to a URL-safe slug.
 * "Board of Directors" → "board-of-directors"
 */
function toSlug(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Recursively parse an array of xml2js box objects into nav nodes.
 * parentPath is the accumulated path prefix, e.g. "/about".
 */
function parseBoxes(boxes, parentPath) {
  if (!Array.isArray(boxes)) return [];

  return boxes
    .map((box) => {
      const { label, url } = parseTextAndUrl(box.text);
      const bg = str(box.propa);

      if (!label || STRUCTURAL_LABELS.has(label) || bg === STRUCTURAL_BG) return null;

      const slug = toSlug(label);
      const localPath = parentPath ? `${parentPath}/${slug}` : `/${slug}`;
      const type = url
        ? url.startsWith('/')
          ? 'static'
          : 'hubspot'
        : null;

      // xml2js represents <member/> as '' and <member><box>...</box></member> as [{box:[...]}]
      const memberVal = box.member;
      const memberObj = Array.isArray(memberVal) && memberVal.length > 0 && typeof memberVal[0] === 'object'
        ? memberVal[0]
        : null;
      const childBoxes = memberObj && Array.isArray(memberObj.box) ? memberObj.box : [];

      const children = parseBoxes(childBoxes, localPath);

      return { label, url, type, localPath, children };
    })
    .filter(Boolean);
}

/**
 * Load and parse gloomap.xml.
 *
 * Returns:
 *   {
 *     homepageUrl: string|null,   // URL from the root "cesmii.org" box, if set
 *     navItems: NavNode[],        // top-level nav items (each may have .children)
 *   }
 *
 * NavNode shape:
 *   { label, url, type: 'hubspot'|'static'|null, localPath, children: NavNode[] }
 */
async function loadNavFromGloomap(xmlPath) {
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const result = await xml2js.parseStringPromise(xml);

  const rootBox = result.gloomaps.section[0].box[0];
  const { url: homepageUrl } = parseTextAndUrl(rootBox.text);

  const memberObj = Array.isArray(rootBox.member) && rootBox.member.length > 0 && typeof rootBox.member[0] === 'object'
    ? rootBox.member[0]
    : null;
  const topLevelBoxes = memberObj && Array.isArray(memberObj.box) ? memberObj.box : [];

  const navItems = parseBoxes(topLevelBoxes, '');

  return { homepageUrl, navItems };
}

/**
 * Walk the nav tree and return a flat list of all routable entries
 * (nodes that have a URL and therefore need an Express route).
 */
function flattenRoutes(navItems) {
  const routes = [];
  for (const item of navItems) {
    if (item.url) {
      routes.push({
        path: item.localPath,
        url: item.url,
        type: item.type,
        label: item.label,
      });
    }
    if (item.children.length > 0) {
      routes.push(...flattenRoutes(item.children));
    }
  }
  return routes;
}

module.exports = { loadNavFromGloomap, flattenRoutes };
