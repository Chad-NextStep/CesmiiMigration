/**
 * blog.js — Blog listing page with "Load More" pagination
 */

(function () {
  const PAGE_SIZE = 6;
  let currentOffset = 0;
  let totalPosts = 0;

  document.addEventListener('DOMContentLoaded', () => {
    loadPosts(true);

    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => loadPosts(false));
    }
  });

  async function loadPosts(initial) {
    const grid = document.getElementById('blog-grid');
    const loadMoreBtn = document.getElementById('load-more-btn');

    if (initial) {
      showLoading(grid);
    } else if (loadMoreBtn) {
      loadMoreBtn.textContent = 'Loading...';
      loadMoreBtn.disabled = true;
    }

    try {
      const data = await fetchBlogPosts({ limit: PAGE_SIZE, offset: currentOffset });
      totalPosts = data.total || 0;

      if (initial) grid.innerHTML = '';

      if (!data.results || data.results.length === 0) {
        if (initial) {
          grid.innerHTML = '<p style="text-align:center;color:var(--color-text-light);">No blog posts found.</p>';
        }
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        return;
      }

      const html = data.results.map(renderBlogCard).join('');
      grid.insertAdjacentHTML('beforeend', html);

      currentOffset += data.results.length;

      if (loadMoreBtn) {
        loadMoreBtn.textContent = 'Load More';
        loadMoreBtn.disabled = false;
        loadMoreBtn.style.display = currentOffset >= totalPosts ? 'none' : '';
      }
    } catch (err) {
      console.error('Blog load error:', err);
      if (initial) {
        showError(grid, 'Could not load blog posts. Please try again later.');
      }
      if (loadMoreBtn) {
        loadMoreBtn.textContent = 'Load More';
        loadMoreBtn.disabled = false;
      }
    }
  }

  function renderBlogCard(post) {
    const image = post.featuredImage
      ? `<img class="bridge-card-img" src="${post.featuredImage}" alt="${post.name}">`
      : '';
    const summary = truncateText(stripHtml(post.postBody || post.postSummary || ''), 150);
    const date = formatDate(post.publishDate);
    return `
      <a href="/blog-post.html?id=${post.id}" class="bridge-card" style="text-decoration:none;color:inherit;">
        ${image}
        <div class="bridge-card-body">
          <h3>${post.name}</h3>
          <p>${summary}</p>
          <span class="bridge-card-meta">${date}</span>
        </div>
      </a>
    `;
  }
})();
