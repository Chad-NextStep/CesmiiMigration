/**
 * hubspot-pages.js — Fetch HubSpot landing pages and extract widget content
 */

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

/**
 * Fetch a single landing page by ID from HubSpot CMS API.
 */
async function fetchLandingPage(pageId, token) {
  const url = `${HUBSPOT_API_BASE}/cms/v3/pages/landing-pages/${encodeURIComponent(pageId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HubSpot API error ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Extract the module path basename from a params.path like
 * "./../modules/FAQ Column.module" → "FAQ Column"
 */
function getModuleType(params) {
  const p = params && params.path;
  if (p) {
    const match = p.match(/\/([^/]+)\.module$/);
    if (match) return match[1];
  }
  // Some modules use module_id instead of path — fall back to label-based detection
  return 'unknown';
}

/**
 * Convert HubSpot RGBA object {r,g,b,a} to CSS rgba() string.
 */
function rgbaToCSS(color) {
  if (!color) return null;
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

/**
 * Recursively extract all content-bearing fields from a params object.
 * Returns an object with any fields that contain actual content
 * (description, heading, text, html, etc.).
 */
function extractParamsContent(params) {
  if (!params) return {};

  const contentKeys = [
    'description', 'html', 'value', 'body', 'text', 'content',
    'heading', 'subheading', 'paragraph', 'title', 'alt',
    'src', 'href', 'url', 'label', 'header', 'sub_header',
    'button_text', 'link_url', 'image_src', 'form_id', 'formId',
    'video_url', 'video_id',
    'section_heading', 'section_subheading',
  ];

  const result = {};

  for (const key of contentKeys) {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      result[key] = params[key];
    }
  }

  // Also look for nested objects that might contain repeating groups
  // (e.g. FAQ items, logo lists, CTA groups)
  for (const [key, val] of Object.entries(params)) {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
      result[key] = val;
    }
    if (typeof val === 'object' && val !== null && !Array.isArray(val) && !contentKeys.includes(key)) {
      // Check if this sub-object has content keys
      const sub = extractParamsContent(val);
      if (Object.keys(sub).length > 0) {
        result[key] = sub;
      }
    }
  }

  return result;
}

/**
 * Walk the layoutSections tree and return a flat list of extracted widgets.
 * Each widget: { name, label, moduleType, params, content, gridX, gridW, rowIndex }
 *
 * Also returns rowMeta (background colors, padding) from rowMetaData.
 */
function extractContent(layoutSections) {
  const widgets = [];
  const rowStyles = [];

  // Find the main layout section (usually "dnd_arealanding" but handle any key)
  const sectionKey = Object.keys(layoutSections || {})[0];
  if (!sectionKey) return { widgets, rowStyles };

  const section = layoutSections[sectionKey];
  const rows = section.rows || [];
  const rowMetaData = section.rowMetaData || [];

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    const meta = rowMetaData[rowIdx] || {};

    // Extract row-level styling
    const bgColor = meta.styles && meta.styles.backgroundColor
      ? rgbaToCSS(meta.styles.backgroundColor)
      : null;
    rowStyles.push({ rowIndex: rowIdx, backgroundColor: bgColor });

    // Columns are keyed by numeric strings representing grid position
    const colKeys = Object.keys(row)
      .filter((k) => !isNaN(k))
      .sort((a, b) => Number(a) - Number(b));

    for (const colKey of colKeys) {
      const col = row[colKey];

      if (col.type === 'custom_widget') {
        const moduleType = getModuleType(col.params);
        const content = extractParamsContent(col.params);

        widgets.push({
          name: col.name,
          label: col.label,
          moduleType,
          content,
          gridX: col.x,
          gridW: col.w,
          rowIndex: rowIdx,
        });
      }

      // Recurse into nested rows (handles type "cell" containers and nested widgets)
      if (col.rows && col.rows.length > 0) {
        const nested = extractContent({
          nested: { rows: col.rows, rowMetaData: col.rowMetaData || [] },
        });
        widgets.push(...nested.widgets);
      }
    }
  }

  return { widgets, rowStyles };
}

module.exports = { fetchLandingPage, extractContent, getModuleType };
