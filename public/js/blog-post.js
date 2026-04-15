/**
 * blog-post.js — Single post rendering from ?id= query param
 */

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const postId = getQueryParam('id');
    if (!postId) {
      window.location.href = '/blog.html';
      return;
    }
    loadPost(postId);
  });

  async function loadPost(postId) {
    const container = document.getElementById('blog-post-content');
    showLoading(container);

    try {
      const post = await fetchBlogPost(postId);

      document.title = `${post.name} — CESMII Blog`;

      const featuredImage = post.featuredImage
        ? `<img src="${post.featuredImage}" alt="${post.name}" style="width:100%;border-radius:var(--radius);margin-bottom:2rem;">`
        : '';

      container.innerHTML = `
        <article>
          <div class="blog-header">
            <h1>${post.name}</h1>
            <p class="blog-meta">
              ${formatDate(post.publishDate)}
              ${post.blogAuthor ? ` &middot; ${post.blogAuthor.displayName || post.blogAuthor.fullName || ''}` : ''}
            </p>
          </div>
          ${featuredImage}
          <div class="blog-content">
            ${post.postBody || ''}
          </div>
          <div style="margin-top:3rem;padding-top:1.5rem;border-top:1px solid var(--color-border);">
            <a href="/blog.html">&larr; Back to Blog</a>
          </div>
        </article>
      `;
    } catch (err) {
      console.error('Blog post load error:', err);
      showError(container, 'Could not load this blog post. It may have been removed or is unavailable.');
    }
  }
})();
