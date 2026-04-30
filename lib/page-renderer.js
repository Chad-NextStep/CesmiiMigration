/**
 * page-renderer.js — Render extracted HubSpot widget data into static HTML
 * that matches the existing site patterns (dark theme, CSS classes from test.html).
 */

/**
 * Render a "Contact Form Text" widget.
 * Has rich HTML in content.description, and we embed a HubSpot form.
 */
function renderContactFormText(widget) {
  const desc = widget.content.description || '';
  const formId = widget.content.form_id || widget.content.formId || '';

  let formHtml = '';
  if (formId) {
    formHtml = `
      <div class="mtp-form-wrap">
        <div id="hubspot-form" data-form-id="${formId}"></div>
      </div>`;
  } else {
    // Default form embed — the form ID is baked into the module template
    // and not exposed in the API. Use a placeholder that app.js can hydrate.
    formHtml = `
      <div class="mtp-form-wrap">
        <div id="hubspot-form"></div>
      </div>`;
  }

  return `
  <section class="mtp-dark">
    <div class="mtp-intro">
      ${desc}
      ${formHtml}
    </div>
  </section>`;
}

/**
 * Render a "Heading Section" widget.
 * Content may be in params or may use module defaults.
 */
function renderHeadingSection(widget, rowBg) {
  const heading = widget.content.heading || widget.content.title || widget.content.text || '';
  const sub = widget.content.subheading || widget.content.sub_header || '';
  const bg = rowBg || 'rgb(23, 24, 31)';

  // If no heading content is available from API, render a placeholder
  // that signals the heading section exists but uses module defaults
  if (!heading && !sub) {
    return `
  <div class="mtp-faq-heading" style="background: ${bg};">
    <h2><!-- Heading from HubSpot module defaults --></h2>
  </div>`;
  }

  return `
  <div class="mtp-faq-heading" style="background: ${bg};">
    <h2>${heading}</h2>
    ${sub ? `<p>${sub}</p>` : ''}
  </div>`;
}

/**
 * Render a group of FAQ Column widgets (collected from the same row).
 */
function renderFAQRow(faqWidgets, rowBg) {
  const bg = rowBg || 'rgb(23, 24, 31)';

  const items = [];
  for (const w of faqWidgets) {
    // HubSpot FAQ Column uses a "features" repeating group with faq_question/faq_answer
    if (Array.isArray(w.content.features) && w.content.features.length > 0) {
      for (const faq of w.content.features) {
        const question = faq.faq_question || '';
        const answer = faq.faq_answer || '';
        items.push(`
      <div class="mtp-faq-item">
        <h4>${question}</h4>
        ${answer}
      </div>`);
      }
    } else {
      const question = w.content.heading || w.content.title || w.content.header || '';
      const answer = w.content.description || w.content.text || w.content.body || '';

      if (!question && !answer) {
        items.push(`
      <div class="mtp-faq-item">
        <h4><!-- FAQ question from module defaults --></h4>
        <p><!-- FAQ answer from module defaults --></p>
      </div>`);
      } else {
        items.push(`
      <div class="mtp-faq-item">
        <h4>${question}</h4>
        <p>${answer}</p>
      </div>`);
      }
    }
  }

  return `
  <section style="background: ${bg};">
    <div class="mtp-faq-grid">
      ${items.join('\n')}
    </div>
  </section>`;
}

/**
 * Render a "Hero Section" widget (CTA area).
 */
function renderHeroSection(widget, rowBg) {
  const heading = widget.content.heading || widget.content.title || '';
  const sub = widget.content.subheading || widget.content.description || widget.content.text || '';
  const btnText = widget.content.button_text || '';
  const btnUrl = widget.content.link_url || widget.content.href || widget.content.url || '';
  const bg = rowBg || '#010101';

  if (!heading && !sub && !btnText) {
    return `
  <section class="mtp-cta" style="background: ${bg};">
    <h2><!-- Hero heading from module defaults --></h2>
    <p><!-- Hero text from module defaults --></p>
  </section>`;
  }

  return `
  <section class="mtp-cta" style="background: ${bg};">
    <h2>${heading}</h2>
    ${sub ? `<p>${sub}</p>` : ''}
    ${btnText ? `<a href="${btnUrl}" class="btn btn-primary">${btnText}</a>` : ''}
  </section>`;
}

/**
 * Render a "Video Section" widget.
 */
function renderVideoSection(widget, rowBg) {
  const videoUrl = widget.content.video_url || widget.content.url || widget.content.src || '';
  const bg = rowBg || '#010101';

  if (!videoUrl) {
    return `
  <section style="background: ${bg}; padding: 3rem 1.5rem; text-align: center;">
    <!-- Video Section — content from HubSpot module defaults -->
  </section>`;
  }

  return `
  <section style="background: ${bg}; padding: 3rem 1.5rem; text-align: center;">
    <div style="max-width: var(--max-width); margin: 0 auto;">
      <iframe src="${videoUrl}" width="100%" height="450" frameborder="0" allowfullscreen></iframe>
    </div>
  </section>`;
}

/**
 * Render a "Logo Slider" widget.
 */
function renderLogoSlider(widget, rowBg) {
  const bg = rowBg || '#010101';

  // Logo images are typically in a repeating group in params
  const logos = widget.content.logos || widget.content.slides || widget.content.items || [];

  if (!Array.isArray(logos) || logos.length === 0) {
    return `
  <section style="background: ${bg}; padding: 2rem 1.5rem;">
    <!-- Logo Slider — content from HubSpot module defaults -->
  </section>`;
  }

  const imgs = logos
    .map((logo) => {
      const src = logo.src || logo.image_src || logo.url || '';
      const alt = logo.alt || '';
      return src ? `<img src="${src}" alt="${alt}" style="max-height: 60px; margin: 0 1rem;">` : '';
    })
    .filter(Boolean)
    .join('\n');

  return `
  <section style="background: ${bg}; padding: 2rem 1.5rem;">
    <div style="max-width: var(--max-width); margin: 0 auto; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 2rem;">
      ${imgs}
    </div>
  </section>`;
}

/**
 * Render a "CTA Strip" widget.
 */
function renderCTAStrip(widget, rowBg) {
  const bg = rowBg || '#010101';
  const heading = widget.content.section_heading || widget.content.heading || widget.content.title || '';
  const sub = widget.content.section_subheading || widget.content.subheading || widget.content.description || '';
  const btnText = widget.content.button_text || '';
  const btnUrl = widget.content.link_url || widget.content.href || widget.content.url || '';

  return `
  <section class="mtp-cta" style="background: ${bg};">
    ${heading ? `<h2>${heading}</h2>` : ''}
    ${sub ? `<p>${sub}</p>` : ''}
    ${btnText ? `<a href="${btnUrl}" class="btn btn-primary">${btnText}</a>` : ''}
  </section>`;
}

/**
 * Render a generic/unknown widget (fallback).
 */
function renderGeneric(widget, rowBg) {
  const bg = rowBg || '#010101';
  const html = widget.content.html || widget.content.description || widget.content.text || '';

  if (!html) {
    return `
  <!-- ${widget.label || widget.moduleType} — no extractable content -->`;
  }

  return `
  <section style="background: ${bg}; padding: 2rem 1.5rem;">
    <div style="max-width: var(--max-width); margin: 0 auto;">
      ${html}
    </div>
  </section>`;
}

/**
 * Build a full HTML page from extracted widgets and page metadata.
 *
 * @param {object} pageData - Top-level page data from HubSpot API (for title, meta)
 * @param {object} extracted - { widgets, rowStyles } from extractContent()
 * @param {object} opts - { portalId, region, formId } for form embedding
 */
function renderPage(pageData, extracted, opts = {}) {
  const title = pageData.htmlTitle || pageData.name || 'Page';
  const metaDesc = pageData.metaDescription || '';
  const { widgets, rowStyles } = extracted;

  // Group FAQ widgets by rowIndex so we can render them as a single grid
  const renderedRows = new Set();
  const sections = [];

  for (const widget of widgets) {
    if (renderedRows.has(`faq-${widget.rowIndex}`) && widget.moduleType === 'FAQ Column') {
      continue; // Already rendered as part of a FAQ group
    }

    const rowStyle = rowStyles.find((r) => r.rowIndex === widget.rowIndex);
    const bg = rowStyle && rowStyle.backgroundColor;

    switch (widget.moduleType) {
      case 'Contact Form Text':
        sections.push(renderContactFormText(widget));
        break;

      case 'Video Section':
        sections.push(renderVideoSection(widget, bg));
        break;

      case 'Logo Slider':
        sections.push(renderLogoSlider(widget, bg));
        break;

      case 'Heading Section':
        sections.push(renderHeadingSection(widget, bg));
        break;

      case 'FAQ Column': {
        // Collect all FAQ widgets from the same row
        const rowFaqs = widgets.filter(
          (w) => w.moduleType === 'FAQ Column' && w.rowIndex === widget.rowIndex
        );
        sections.push(renderFAQRow(rowFaqs, bg));
        renderedRows.add(`faq-${widget.rowIndex}`);
        break;
      }

      case 'Hero Section':
        sections.push(renderHeroSection(widget, bg));
        break;

      default:
        // Handle modules identified by label (e.g. CTA Strip uses module_id, not path)
        if (widget.label === 'CTA Strip' || widget.content.section_heading) {
          sections.push(renderCTAStrip(widget, bg));
          break;
        }
        sections.push(renderGeneric(widget, bg));
        break;
    }
  }

  // Detect if any form embed exists (for the form script)
  const hasForm = sections.some((s) => s.includes('id="hubspot-form"'));
  const formId = opts.formId || '789f2e3d-c32b-41d7-bcaa-51a6bd8db34b';

  const formScript = hasForm
    ? `
  <script>
    // Load HubSpot form
    (async function() {
      const cfg = await fetch('/api/config').then(r => r.json());
      const formEl = document.getElementById('hubspot-form');
      const fid = formEl && formEl.dataset.formId ? formEl.dataset.formId : '${formId}';
      const script = document.createElement('script');
      script.src = '//js.hsforms.net/forms/embed/v2.js';
      script.onload = function() {
        if (window.hbspt) {
          window.hbspt.forms.create({
            region: cfg.region || 'na1',
            portalId: cfg.portalId,
            formId: fid,
            target: '#hubspot-form'
          });
        }
      };
      document.head.appendChild(script);
    })();
  </script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} &ndash; CESMII</title>
  <meta name="description" content="${escapeHtml(metaDesc)}">
  <link rel="stylesheet" href="/css/style.css">
  <style>
    .mtp-dark {
      background: #010101;
      color: #ffffff;
    }

    /* Contact / Intro section */
    .mtp-intro {
      max-width: var(--max-width);
      margin: 0 auto;
      padding: 4rem 1.5rem;
    }
    .mtp-intro h2 {
      font-family: var(--font-heading);
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 1rem;
    }
    .mtp-intro p {
      font-size: 1.05rem;
      line-height: 1.7;
      color: rgba(255, 255, 255, 0.85);
      margin-bottom: 1rem;
    }
    .mtp-intro ul {
      margin: 1rem 0 2rem 1.25rem;
      color: rgba(255, 255, 255, 0.85);
      line-height: 1.8;
    }
    .mtp-intro li {
      margin-bottom: 0.35rem;
    }

    /* FAQ section */
    .mtp-faq-heading {
      background: rgb(23, 24, 31);
      padding: 3rem 1.5rem 1rem;
    }
    .mtp-faq-heading h2 {
      font-family: var(--font-heading);
      font-weight: 800;
      text-align: center;
      color: #ffffff;
      max-width: var(--max-width);
      margin: 0 auto;
    }

    .mtp-faq-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      max-width: var(--max-width);
      margin: 0 auto;
      padding: 2rem 1.5rem 3rem;
    }
    .mtp-faq-item {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius);
      padding: 1.75rem;
    }
    .mtp-faq-item h4 {
      font-family: var(--font-heading);
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 0.75rem;
      font-size: 1rem;
    }
    .mtp-faq-item p {
      font-size: 0.9rem;
      line-height: 1.7;
      color: rgba(255, 255, 255, 0.75);
    }

    /* CTA / Hero section */
    .mtp-cta {
      background: #010101;
      text-align: center;
      padding: 5rem 1.5rem;
    }
    .mtp-cta h2 {
      font-family: var(--font-heading);
      font-size: 2rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 0.75rem;
    }
    .mtp-cta p {
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.75);
      max-width: 600px;
      margin: 0 auto 2rem;
    }

    /* HubSpot form embed */
    .mtp-form-wrap {
      max-width: 500px;
      margin: 2rem auto 0;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius);
      padding: 2rem;
      min-height: 300px;
    }

    @media (max-width: 768px) {
      .mtp-faq-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div id="site-header"></div>
${sections.join('\n')}
  <div id="site-footer"></div>

  <script src="/js/app.js"></script>${formScript}
</body>
</html>
`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { renderPage };
