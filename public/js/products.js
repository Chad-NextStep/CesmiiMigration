/**
 * products.js — HubDB product cards
 */

(function () {
  // Set this to your HubDB table ID for products
  const PRODUCTS_TABLE_ID = 'products';

  document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
  });

  async function loadProducts() {
    const grid = document.getElementById('products-grid');
    showLoading(grid);

    try {
      const data = await fetchHubDBRows(PRODUCTS_TABLE_ID);

      if (!data.results || data.results.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:var(--color-text-light);">No products available.</p>';
        return;
      }

      grid.innerHTML = data.results.map(renderProductCard).join('');
    } catch (err) {
      console.error('Products load error:', err);
      showError(grid, 'Could not load products. Please try again later.');
    }
  }

  function renderProductCard(row) {
    const values = row.values || {};
    const name = values.name || 'Untitled';
    const description = values.description || '';
    const image = values.image ? values.image.url : '';
    const link = values.link || '';

    const imgHtml = image
      ? `<img class="bridge-card-img" src="${image}" alt="${name}">`
      : '';

    const linkOpen = link
      ? `<a href="${link}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;">`
      : '<div>';
    const linkClose = link ? '</a>' : '</div>';

    return `
      ${linkOpen}
        <div class="bridge-card">
          ${imgHtml}
          <div class="bridge-card-body">
            <h3>${name}</h3>
            <p>${description}</p>
          </div>
        </div>
      ${linkClose}
    `;
  }
})();
