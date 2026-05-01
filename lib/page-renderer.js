/**
 * page-renderer.js — Render extracted HubSpot widget data into static HTML
 * using the HubSpot Business Theme CSS/JS from the CDN.
 */

const PORTAL_ID = '43818189';
const HS_ASSETS = `https://${PORTAL_ID}.hs-sites.com/hubfs/hub_generated`;

// Theme CSS + module CSS from the HubSpot CDN
const THEME_CSS = [
  'https://unpkg.com/aos@2.3.4/dist/aos.css',
  `${HS_ASSETS}/template_assets/1/212022459039/1777565694123/template_main.min.css`,
  `${HS_ASSETS}/template_assets/1/212022459043/1777565694016/template_theme-overrides.min.css`,
  `${HS_ASSETS}/module_assets/1/205200445813/1768561361685/module_Heading_Section.min.css`,
  `${HS_ASSETS}/module_assets/1/205201196089/1768561361685/module_CTA_Strip.min.css`,
  `${HS_ASSETS}/module_assets/1/205201196087/1768561361685/module_Logo_Slider.min.css`,
  `${HS_ASSETS}/module_assets/1/205201196086/1768561361685/module_FAQ_Column.min.css`,
  `${HS_ASSETS}/module_assets/1/205200445811/1768561361731/module_Hero_Section.min.css`,
];

const THEME_JS = [
  `${HS_ASSETS}/template_assets/1/212025818169/1777565694874/template_main.min.js`,
  `${HS_ASSETS}/module_assets/1/205201196087/1768561361685/module_Logo_Slider.min.js`,
  `${HS_ASSETS}/module_assets/1/205201196086/1768561361685/module_FAQ_Column.min.js`,
  'https://unpkg.com/aos@2.3.4/dist/aos.js',
];

// --- Widget renderers using HubSpot theme markup ---

function renderContactFormText(widget) {
  const desc = widget.content.description || '';
  const formId = widget.content.form_id || widget.content.formId || '';

  return `
      <div class="row-fluid-wrapper row-depth-1 dnd-section">
        <div class="row-fluid">
          <div class="span12 widget-span widget-type-custom_widget dnd-module" data-widget-type="custom_widget" data-x="0" data-w="12">
            <div class="hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module">
              <div class="heading" style="max-width:80%;margin:auto;text-align:center;">
                ${desc}
                <div class="separator" style="background:var(--primary_color);"></div>
              </div>
              <div id="hubspot-form"${formId ? ` data-form-id="${formId}"` : ''}></div>
            </div>
          </div>
        </div>
      </div>`;
}

function renderHeadingSection(widget, rowBg) {
  const heading = widget.content.heading || widget.content.title || widget.content.text || widget.content.section_heading || '';
  const sub = widget.content.subheading || widget.content.sub_header || widget.content.description || widget.content.section_subheading || '';

  return `
      <div class="row-fluid-wrapper row-depth-1 dnd-section"${rowBg ? ` style="background:${rowBg};"` : ''}>
        <div class="row-fluid">
          <div class="span12 widget-span widget-type-custom_widget dnd-module" data-widget-type="custom_widget" data-x="0" data-w="12">
            <div class="hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module">
              <div class="heading" style="max-width:80%;margin:auto;text-align:center;">
                ${heading ? `<h2>${heading}</h2>` : ''}
                ${sub ? `<div class="description" style="text-align:center;max-width:80%;">${sub}</div>` : ''}
                <div class="separator" style="background:var(--primary_color);"></div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
}

function renderCTAStrip(widget, rowBg) {
  const heading = widget.content.section_heading || widget.content.heading || widget.content.title || '';
  const sub = widget.content.section_subheading || widget.content.subheading || widget.content.description || '';
  const btnText = widget.content.button_text || '';
  const btnUrl = widget.content.link_url || widget.content.href || widget.content.url || '';

  return `
      <div class="row-fluid-wrapper row-depth-1 dnd-section">
        <div class="row-fluid">
          <div class="span12 widget-span widget-type-custom_widget dnd-module" data-widget-type="custom_widget" data-x="0" data-w="12">
            <div class="hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module">
              <div class="button-strip" style="background:#f9fbfd;">
                <div class="container">
                  <div class="heading" style="text-align: center">
                    ${heading ? `<h2>${heading}</h2>` : ''}
                    ${sub ? `<div class="description">${sub}</div>` : ''}
                  </div>
                  ${btnText ? `
                  <div class="strip_buttons" style="text-align: center" data-aos="fade-up" data-aos-duration="3000">
                    <div class="link_btn">
                      <a class="button" href="${btnUrl}">${btnText}</a>
                    </div>
                  </div>` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
}

function renderFAQRow(faqWidgets, rowBg) {
  const columns = faqWidgets.map((w) => {
    let accordionItems = '';

    if (Array.isArray(w.content.features) && w.content.features.length > 0) {
      let btnId = 1;
      accordionItems = w.content.features.map((faq) => {
        const question = faq.faq_question || '';
        const answer = faq.faq_answer || '';
        return `
              <div class="accordion-item">
                <button id="accordion-button-${btnId++}" aria-expanded="false">
                  <span class="accordion-title">${question}</span>
                  <span class="icon" aria-hidden="true"></span>
                </button>
                <div class="accordion-content">
                  ${answer}
                </div>
              </div>`;
      }).join('\n');
    }

    const spanClass = w.gridW === 4 ? 'span4' : w.gridW === 6 ? 'span6' : `span${w.gridW}`;

    return `
          <div class="${spanClass} widget-span widget-type-custom_widget dnd-module" data-widget-type="custom_widget" data-x="${w.gridX}" data-w="${w.gridW}">
            <div class="hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module">
              <div class="accordion" data-wow-duration="1s" style="background:#f9fbfd;">
                ${accordionItems}
              </div>
            </div>
          </div>`;
  });

  return `
      <div class="row-fluid-wrapper row-depth-1 dnd-section"${rowBg ? ` style="background:${rowBg};"` : ''}>
        <div class="row-fluid">
          ${columns.join('\n')}
        </div>
      </div>`;
}

function renderHeroSection(widget, rowBg) {
  const heading = widget.content.heading || widget.content.title || '';
  const sub = widget.content.subheading || widget.content.description || widget.content.text || '';
  const btnText = widget.content.button_text || '';
  const btnUrl = widget.content.link_url || widget.content.href || widget.content.url || '';

  return `
      <div class="row-fluid-wrapper row-depth-1 dnd-section"${rowBg ? ` style="background:${rowBg};"` : ''}>
        <div class="row-fluid">
          <div class="span12 widget-span widget-type-custom_widget dnd-module" data-widget-type="custom_widget" data-x="0" data-w="12">
            <div class="hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module">
              <div class="video-banner">
                <div id="bannner">
                  <div class="banner-bg parallax" style="background:url(https://f.hubspotusercontent00.net/hubfs/7712601/background-form-pic.jpg);min-height:500px;">
                    <div class="banner-overlay1" style="background-color:rgba(0, 0, 0, 0.7);"></div>
                    <div class="container">
                      <div class="row">
                        <div class="offset-md-1 col-md-10 col-sm-12 col-xs-12">
                          <div class="banner-content" style="text-align: center;">
                            ${heading ? `<h1>${heading}</h1>` : ''}
                            ${sub ? `<div class="subheading"><div>${sub}</div></div>` : ''}
                            ${btnText ? `
                            <div class="buttons">
                              <div class="link_btn">
                                <a class="button" href="${btnUrl}">${btnText}</a>
                              </div>
                            </div>` : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
}

function renderVideoSection(widget, rowBg) {
  const videoUrl = widget.content.video_url || widget.content.url || widget.content.src || '';

  if (!videoUrl) {
    return `
      <!-- Video Section — content from HubSpot module defaults -->`;
  }

  return `
      <div class="row-fluid-wrapper row-depth-1 dnd-section"${rowBg ? ` style="background:${rowBg};"` : ''}>
        <div class="row-fluid">
          <div class="span12 widget-span widget-type-custom_widget dnd-module" data-widget-type="custom_widget" data-x="0" data-w="12">
            <div class="hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module">
              <div style="max-width:960px;margin:0 auto;padding:2rem;">
                <iframe src="${videoUrl}" width="100%" height="450" frameborder="0" allowfullscreen></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>`;
}

function renderLogoSlider(widget, rowBg) {
  const logos = widget.content.logos || widget.content.slides || widget.content.items || [];

  if (!Array.isArray(logos) || logos.length === 0) {
    return `
      <!-- Logo Slider — content from HubSpot module defaults -->`;
  }

  const slides = logos.map((logo) => {
    const src = logo.src || logo.image_src || logo.url || '';
    const alt = logo.alt || '';
    return src ? `
                <div>
                  <div class="sponsors_img" style="background:#f9fbfd;">
                    <img src="${src}" class="img-fluid" alt="${escapeHtml(alt)}">
                  </div>
                </div>` : '';
  }).filter(Boolean).join('\n');

  return `
      <div class="row-fluid-wrapper row-depth-1 dnd-section"${rowBg ? ` style="background:${rowBg};"` : ''}>
        <div class="row-fluid">
          <div class="span12 widget-span widget-type-custom_widget dnd-module" data-widget-type="custom_widget" data-x="0" data-w="12">
            <div class="hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module">
              <div class="sponsors_sec" style="background:#f9fbfd;">
                <div class="container">
                  <div class="row">
                    <div class="logo-slide slider">
                      ${slides}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
}

function renderGeneric(widget, rowBg) {
  const html = widget.content.html || widget.content.description || widget.content.text || '';

  if (!html) {
    return `
      <!-- ${widget.label || widget.moduleType} — no extractable content -->`;
  }

  return `
      <div class="row-fluid-wrapper row-depth-1 dnd-section"${rowBg ? ` style="background:${rowBg};"` : ''}>
        <div class="row-fluid">
          <div class="span12 widget-span widget-type-custom_widget dnd-module" data-widget-type="custom_widget" data-x="0" data-w="12">
            <div class="hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module">
              <div class="container">
                ${html}
              </div>
            </div>
          </div>
        </div>
      </div>`;
}

// --- Page assembly ---

function renderPage(pageData, extracted, opts = {}) {
  const title = pageData.htmlTitle || pageData.name || 'Page';
  const metaDesc = pageData.metaDescription || '';
  const { widgets, rowStyles } = extracted;

  const renderedRows = new Set();
  const sections = [];

  for (const widget of widgets) {
    if (renderedRows.has(`faq-${widget.rowIndex}`) && widget.moduleType === 'FAQ Column') {
      continue;
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
        if (widget.label === 'CTA Strip' || widget.content.section_heading) {
          sections.push(renderCTAStrip(widget, bg));
          break;
        }
        sections.push(renderGeneric(widget, bg));
        break;
    }
  }

  const hasForm = sections.some((s) => s.includes('id="hubspot-form"'));
  const formId = opts.formId || '789f2e3d-c32b-41d7-bcaa-51a6bd8db34b';

  const cssLinks = THEME_CSS.map((url) => `  <link rel="stylesheet" href="${url}">`).join('\n');
  const jsScripts = THEME_JS.map((url) => `  <script src="${url}"></script>`).join('\n');

  const formScript = hasForm
    ? `
  <script>
    (async function() {
      var cfg = await fetch('/api/config').then(function(r) { return r.json(); });
      var formEl = document.getElementById('hubspot-form');
      var fid = formEl && formEl.dataset.formId ? formEl.dataset.formId : '${formId}';
      var script = document.createElement('script');
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
  <link rel="stylesheet" href="/css/theme-bridge.css">
${cssLinks}
</head>
<body>
  <div class="body-wrapper hs-landing-page hs-page">
    <div id="site-header"></div>

    <main id="main-content" class="body-container-wrapper body-container">
      <section>
        <div class="container-fluid">
          <div class="row-fluid-wrapper">
            <div class="row-fluid">
              <div class="span12 widget-span widget-type-cell" data-widget-type="cell" data-x="0" data-w="12">
${sections.join('\n')}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <div id="site-footer"></div>
  </div>

  <script src="/js/app.js"></script>
${jsScripts}
  <script>AOS.init();</script>${formScript}
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
