require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const HUBSPOT_PORTAL_ID = process.env.HUBSPOT_PORTAL_ID;
const HUBSPOT_REGION = process.env.HUBSPOT_REGION || 'na1';
const HUBSPOT_API_BASE = 'https://api.hubapi.com';

// --- Static files ---
app.use(express.static(path.join(__dirname, 'public')));

// --- /api/config — public, non-secret config for client JS ---
app.get('/api/config', (req, res) => {
  res.json({
    portalId: HUBSPOT_PORTAL_ID,
    region: HUBSPOT_REGION,
  });
});

// --- Blog proxy: list posts ---
app.get('/api/blog/posts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;

    const url = new URL(`${HUBSPOT_API_BASE}/cms/v3/blogs/posts`);
    url.searchParams.set('state', 'PUBLISHED');
    url.searchParams.set('sort', '-publishDate');
    url.searchParams.set('limit', limit);
    url.searchParams.set('offset', offset);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}` },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('HubSpot blog list error:', response.status, text);
      return res.status(response.status).json({ error: 'HubSpot API error' });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Blog proxy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Blog proxy: single post ---
app.get('/api/blog/posts/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const url = `${HUBSPOT_API_BASE}/cms/v3/blogs/posts/${encodeURIComponent(postId)}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}` },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('HubSpot blog post error:', response.status, text);
      return res.status(response.status).json({ error: 'HubSpot API error' });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Blog post proxy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- SPA-style fallback: serve index.html for unmatched routes ---
// (Not needed since we use separate .html files, but keeps clean 404s)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
