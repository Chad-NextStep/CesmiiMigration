/**
 * team.js — Load team members from HubDB and render by department
 */

(function () {
  const TEAM_TABLE_ID = 'team';

  document.addEventListener('DOMContentLoaded', () => {
    loadTeamMembers();
    initModal();
  });

  // --- Modal ---
  function initModal() {
    const modal = document.createElement('div');
    modal.id = 'team-modal';
    modal.className = 'team-modal';
    modal.innerHTML = `
      <div class="team-modal-backdrop"></div>
      <div class="team-modal-content">
        <button class="team-modal-close" aria-label="Close">&times;</button>
        <div class="team-modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.team-modal-backdrop').addEventListener('click', closeModal);
    modal.querySelector('.team-modal-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  function openModal(data) {
    const modal = document.getElementById('team-modal');
    const body = modal.querySelector('.team-modal-body');

    const imgHtml = data.image
      ? `<img src="${data.image}" alt="${data.name}" class="team-modal-photo">`
      : '';

    const linkedinHtml = data.linkedin
      ? `<a href="${data.linkedin}" target="_blank" rel="noopener" class="team-linkedin" aria-label="${data.name} on LinkedIn" style="margin-top:0.75rem;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>`
      : '';

    body.innerHTML = `
      <div class="team-modal-header">
        ${imgHtml}
        <div>
          <h3>${data.name}</h3>
          <p class="team-modal-title">${data.title}</p>
          ${linkedinHtml}
        </div>
      </div>
      <div class="team-modal-bio">${data.bio}</div>
    `;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = document.getElementById('team-modal');
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // --- Load & render ---
  async function loadTeamMembers() {
    const container = document.getElementById('hubdb-team');
    if (!container) return;

    showLoading(container);

    try {
      const data = await fetchHubDBRows(TEAM_TABLE_ID);

      if (!data.results || data.results.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);">No team members available.</p>';
        return;
      }

      const sorted = data.results.sort((a, b) => (a.renderOrder || 0) - (b.renderOrder || 0));

      const groups = {};
      sorted.forEach((row) => {
        const dept = row.values.department;
        const key = dept ? dept.name : 'other';
        const label = dept ? dept.label : 'Other';
        if (!groups[key]) groups[key] = { label, order: dept ? dept.order : 999, members: [] };
        groups[key].members.push(row);
      });

      const sortedGroups = Object.values(groups).sort((a, b) => a.order - b.order);

      const themeCount = 4;
      container.innerHTML = sortedGroups
        .map(
          (group, i) => `
          <div class="team-section team-theme-${i % themeCount}">
            <h2 class="section-title">${group.label}</h2>
            <div class="team-grid">
              ${group.members.map(renderTeamCard).join('')}
            </div>
          </div>
        `
        )
        .join('');

      // Attach "Read more" click handlers
      container.querySelectorAll('.team-read-more').forEach((btn) => {
        btn.addEventListener('click', () => {
          openModal({
            name: btn.dataset.name,
            title: btn.dataset.title,
            image: btn.dataset.image,
            linkedin: btn.dataset.linkedin,
            bio: btn.dataset.bio,
          });
        });
      });
    } catch (err) {
      console.error('Team load error:', err);
      showError(container, 'Could not load team members. Please try again later.');
    }
  }

  function renderTeamCard(row) {
    const v = row.values || {};
    const name = v.name || 'Untitled';
    const title = v.title || '';
    const image = v.profile_pic ? v.profile_pic.url : '';
    const linkedin = v.linkedin || '';
    const bio = v.bio || '';

    const imgHtml = image
      ? `<img src="${image}" alt="${name}" class="team-photo">`
      : '';

    const linkedinHtml = linkedin
      ? `<a href="${linkedin}" target="_blank" rel="noopener" class="team-linkedin" aria-label="${name} on LinkedIn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>`
      : '';

    const bioHtml = bio
      ? `<p class="team-bio">${bio}</p>
         <button class="team-read-more"
           data-name="${name.replace(/"/g, '&quot;')}"
           data-title="${title.replace(/"/g, '&quot;')}"
           data-image="${image}"
           data-linkedin="${linkedin}"
           data-bio="${bio.replace(/"/g, '&quot;')}">Read more</button>`
      : '';

    const socialHtml = linkedinHtml
      ? `<div class="team-card-social">${linkedinHtml}</div>`
      : '';

    return `
      <div class="team-card">
        ${imgHtml}
        <div class="team-card-info">
          <h3>${name}</h3>
          <p>${title}</p>
          ${bioHtml}
        </div>
        ${socialHtml}
      </div>
    `;
  }
})();
