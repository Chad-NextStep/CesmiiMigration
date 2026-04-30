/**
 * sync-engine.js — Poll HubSpot for landing page changes, render + write HTML
 */

const fs = require('fs');
const path = require('path');
const { fetchLandingPage, extractContent } = require('./hubspot-pages');
const { renderPage } = require('./page-renderer');

const PAGE_MAP_PATH = path.join(__dirname, 'page-map.json');

function loadPageMap() {
  return JSON.parse(fs.readFileSync(PAGE_MAP_PATH, 'utf8'));
}

function savePageMap(pageMap) {
  fs.writeFileSync(PAGE_MAP_PATH, JSON.stringify(pageMap, null, 2) + '\n', 'utf8');
}

/**
 * Sync all pages in page-map.json.
 * Fetches each page from HubSpot, compares updatedAt, re-renders HTML if changed.
 *
 * @param {string} token - HubSpot access token
 * @param {string} projectRoot - Absolute path to the project root
 * @returns {object[]} Array of results per page
 */
async function syncAll(token, projectRoot) {
  const pageMap = loadPageMap();
  const results = [];

  for (const entry of pageMap.pages) {
    try {
      const pageData = await fetchLandingPage(entry.hubspotPageId, token);
      const remoteUpdatedAt = pageData.updatedAt;

      // Skip if unchanged
      if (entry.lastUpdatedAt && entry.lastUpdatedAt === remoteUpdatedAt) {
        results.push({
          pageId: entry.hubspotPageId,
          file: entry.localFile,
          status: 'unchanged',
          updatedAt: remoteUpdatedAt,
        });
        continue;
      }

      // Extract content from layout sections
      const extracted = extractContent(pageData.layoutSections || {});

      // Render HTML
      const html = renderPage(pageData, extracted);

      // Write to local file
      const outPath = path.join(projectRoot, entry.localFile);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html, 'utf8');

      // Update lastUpdatedAt in page map
      entry.lastUpdatedAt = remoteUpdatedAt;

      results.push({
        pageId: entry.hubspotPageId,
        file: entry.localFile,
        status: 'updated',
        updatedAt: remoteUpdatedAt,
      });

      console.log(`[sync] Updated ${entry.localFile} (page ${entry.hubspotPageId})`);
    } catch (err) {
      console.error(`[sync] Error syncing page ${entry.hubspotPageId}:`, err.message);
      results.push({
        pageId: entry.hubspotPageId,
        file: entry.localFile,
        status: 'error',
        error: err.message,
      });
    }
  }

  // Persist updated timestamps
  savePageMap(pageMap);

  return results;
}

module.exports = { syncAll, loadPageMap };
