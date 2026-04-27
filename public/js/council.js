/**
 * council.js — Load executive council members from HubDB and render
 */

(function () {
  const TABLE_ID = 'Executive_Council';

  document.addEventListener('DOMContentLoaded', () => {
    loadCouncilMembers();
  });

  async function loadCouncilMembers() {
    const container = document.getElementById('hubdb-council');
    if (!container) return;

    showLoading(container);

    try {
      const data = await fetchHubDBRows(TABLE_ID);

      if (!data.results || data.results.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);">No council members available.</p>';
        return;
      }

      const sorted = data.results.sort((a, b) => (a.renderOrder || 0) - (b.renderOrder || 0));

      container.innerHTML = `
        <section class="section section-alt">
          <div class="team-grid board-grid">
            ${sorted.map(renderCard).join('')}
          </div>
        </section>
      `;
    } catch (err) {
      console.error('Council load error:', err);
      showError(container, 'Could not load council members. Please try again later.');
    }
  }

  function renderCard(row) {
    const v = row.values || {};
    const name = v.name || 'Untitled';
    const title = v.title || '';
    const image = v.profile_pic ? v.profile_pic.url : (v.photo ? v.photo.url : '');
    const logo = v.company_logo ? v.company_logo.url : '';
    const linkedin = v.linkedin_url || v.linkedin || '';

    const imgHtml = image
      ? `<img src="${image}" alt="${name}" class="team-photo">`
      : '';

    const logoHtml = logo
      ? `<img src="${logo}" alt="" class="board-company-logo">`
      : '';

    const cardContent = `
        <div class="board-photo-name">
          ${imgHtml}
          <h3>${name}</h3>
        </div>
        <div class="team-card-info">
          ${logoHtml}
          <p>${title}</p>
        </div>
    `;

    if (linkedin) {
      return `
        <a href="${linkedin}" target="_blank" rel="noopener" class="team-card team-card-link" aria-label="${name} on LinkedIn">
          ${cardContent}
        </a>
      `;
    }

    return `<div class="team-card">${cardContent}</div>`;
  }
})();
