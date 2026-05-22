/* ============================================================
   WealthBridge — Post Detail Page Logic
   ============================================================ */
(function () {
  'use strict';

  /* ── GROQ: single post ─────────────────────────────────────── */
  var QUERY_POST = `
    *[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
      _id, title,
      "slug":          slug.current,
      contentType,
      excerpt,
      publishedAt,
      featured,
      body,
      videoUrl,
      videoDuration,
      videoDescription,
      reportYear,
      reportPages,
      "reportFile":    reportFile { "url": asset->url },
      "featuredImage": featuredImage { alt, caption, "url": asset->url },
      "category":      category->{ name, color, "slug": slug.current },
      tags,
      "author":        author->{ name, role, bio, linkedin, twitter,
                                 "image": profileImage { alt, "url": asset->url } },
      "seo":           seo { metaTitle, metaDescription, "ogImage": ogImage { "url": asset->url } },
      "cta":           cta { heading, description, buttonText, buttonLink }
    }`.trim();

  /* ── GROQ: related posts ────────────────────────────────────── */
  var QUERY_RELATED = `
    *[_type == "post" && !(_id in path("drafts.**"))
      && slug.current != $slug
      && (contentType == $type || defined(category) && category->slug.current == $cat)]
    | order(publishedAt desc)[0...3] {
      _id, title,
      "slug":          slug.current,
      contentType,
      excerpt,
      publishedAt,
      "featuredImage": featuredImage { alt, "url": asset->url }
    }`.trim();

  /* ── Init ──────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var slug = new URLSearchParams(window.location.search).get('slug');
    if (!slug) { showNotFound(); return; }
    if (!SANITY.isCMSConfigured()) { showNotConfigured(); return; }
    loadPost(slug);
  });

  /* ── Load post ─────────────────────────────────────────────── */
  function loadPost(slug) {
    showSkeleton();
    SANITY.fetch(QUERY_POST, { slug: slug })
      .then(function (post) {
        if (!post) { showNotFound(); return; }
        renderPost(post);
        loadRelated(post);
        setMeta(post);
        updateReadingProgress();
      })
      .catch(function (err) {
        console.error('Post fetch error:', err);
        showNotFound();
      });
  }

  /* ── Render post ────────────────────────────────────────────── */
  function renderPost(post) {
    /* Hero image */
    var heroEl = document.getElementById('wb-post-hero');
    if (heroEl && post.featuredImage) {
      heroEl.style.backgroundImage = 'url(' + SANITY.img(post.featuredImage, 1400, 600) + ')';
      heroEl.classList.add('wb-post-hero--img');
    }

    /* Category badge */
    setText('wb-post-category', SANITY.ctLabel(post.contentType));
    var badge = document.getElementById('wb-post-category');
    if (badge) badge.style.background = SANITY.ctColor(post.contentType);

    /* Title & meta */
    setText('wb-post-title',  post.title);
    setText('wb-post-date',   SANITY.fmtDate(post.publishedAt));
    setText('wb-post-author', post.author ? post.author.name : '');
    var rt = SANITY.readTime(post.body);
    setText('wb-post-readtime', rt);

    /* Breadcrumb */
    setText('wb-post-breadcrumb', post.title);

    /* ── VIDEO ─────────────────────────────── */
    var videoSec = document.getElementById('wb-video-section');
    if (post.contentType === 'video' && post.videoUrl && videoSec) {
      var iframeEl = document.getElementById('wb-video-iframe');
      if (iframeEl) iframeEl.src = SANITY.ytEmbed(post.videoUrl);
      videoSec.style.display = '';
      /* show description as body */
      if (post.videoDescription) {
        var bd = document.getElementById('wb-post-body');
        if (bd) bd.innerHTML = '<p class="pt-p">' + SANITY.esc(post.videoDescription) + '</p>';
      }
    } else if (videoSec) {
      videoSec.style.display = 'none';
    }

    /* ── RESEARCH PDF ──────────────────────── */
    var resSec = document.getElementById('wb-report-section');
    if (post.contentType === 'research' && resSec) {
      var dlLink = document.getElementById('wb-report-download');
      if (dlLink && post.reportFile && post.reportFile.url) {
        dlLink.href = post.reportFile.url;
      }
      var pages = document.getElementById('wb-report-pages');
      if (pages && post.reportPages) pages.textContent = post.reportPages + ' pages';
      var year = document.getElementById('wb-report-year');
      if (year && post.reportYear) year.textContent = post.reportYear;
      resSec.style.display = '';
    } else if (resSec) {
      resSec.style.display = 'none';
    }

    /* ── BODY ──────────────────────────────── */
    var bodyEl = document.getElementById('wb-post-body');
    if (bodyEl && post.body) {
      bodyEl.innerHTML = SANITY.ptHtml(post.body);
    }

    /* ── TAGS ──────────────────────────────── */
    var tagsEl = document.getElementById('wb-post-tags');
    if (tagsEl && post.tags && post.tags.length) {
      tagsEl.innerHTML = post.tags
        .map(function (t) { return '<a href="insights.html?tag=' + encodeURIComponent(t) + '" class="wb-tag">' + SANITY.esc(t) + '</a>'; })
        .join('');
      tagsEl.closest('.wb-tags-section').style.display = '';
    }

    /* ── AUTHOR BIO ────────────────────────── */
    var authorEl = document.getElementById('wb-author-bio');
    if (authorEl && post.author) {
      var a = post.author;
      var aImg = a.image ? '<img src="' + SANITY.img(a.image, 120, 120) + '" alt="' + SANITY.esc(a.name) + '">' : '';
      authorEl.innerHTML = `
        <div class="wb-author-card">
          <div class="wb-author-photo">${aImg || '<i class="fas fa-user-circle"></i>'}</div>
          <div class="wb-author-info">
            <h4>${SANITY.esc(a.name)}</h4>
            <div class="wb-author-role">${SANITY.esc(a.role || '')}</div>
            ${a.bio ? '<p>' + SANITY.esc(a.bio) + '</p>' : ''}
            <div class="wb-author-links">
              ${a.linkedin ? '<a href="' + SANITY.esc(a.linkedin) + '" target="_blank" rel="noopener"><i class="fab fa-linkedin"></i></a>' : ''}
              ${a.twitter  ? '<a href="' + SANITY.esc(a.twitter)  + '" target="_blank" rel="noopener"><i class="fab fa-x-twitter"></i></a>' : ''}
            </div>
          </div>
        </div>`;
      authorEl.style.display = '';
    }

    /* ── CTA ───────────────────────────────── */
    var ctaEl = document.getElementById('wb-post-cta');
    if (ctaEl && post.cta && post.cta.heading) {
      document.getElementById('wb-cta-heading').textContent     = post.cta.heading;
      document.getElementById('wb-cta-desc').textContent        = post.cta.description || '';
      var ctaBtn = document.getElementById('wb-cta-btn');
      if (ctaBtn) {
        ctaBtn.textContent = post.cta.buttonText || 'Get Started';
        ctaBtn.href        = post.cta.buttonLink  || 'contact.html';
      }
      ctaEl.style.display = '';
    } else if (ctaEl) {
      ctaEl.style.display = 'none';
    }

    /* ── SHARE ─────────────────────────────── */
    setupShare(post);

    /* reveal article */
    var article = document.getElementById('wb-article');
    if (article) article.style.opacity = '1';
    hideSkeleton();
  }

  /* ── Share buttons ─────────────────────────────────────────── */
  function setupShare(post) {
    var pageUrl  = encodeURIComponent(window.location.href);
    var pageText = encodeURIComponent(post.title + ' — WealthBridge Insights');

    var tw = document.getElementById('wb-share-twitter');
    if (tw) tw.href = 'https://twitter.com/intent/tweet?text=' + pageText + '&url=' + pageUrl;

    var li = document.getElementById('wb-share-linkedin');
    if (li) li.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + pageUrl;

    var wa = document.getElementById('wb-share-whatsapp');
    if (wa) wa.href = 'https://wa.me/?text=' + pageText + '%20' + pageUrl;

    var cp = document.getElementById('wb-share-copy');
    if (cp) {
      cp.addEventListener('click', function (e) {
        e.preventDefault();
        navigator.clipboard.writeText(window.location.href)
          .then(function () {
            cp.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(function () { cp.innerHTML = '<i class="fas fa-link"></i>'; }, 2000);
          });
      });
    }
  }

  /* ── Related posts ─────────────────────────────────────────── */
  function loadRelated(post) {
    var slug = post.slug;
    var type = post.contentType;
    var cat  = post.category ? post.category.slug : '';

    SANITY.fetch(QUERY_RELATED, { slug: slug, type: type, cat: cat })
      .then(function (posts) {
        var el = document.getElementById('wb-related');
        if (!el || !posts || !posts.length) {
          var sec = document.getElementById('wb-related-section');
          if (sec) sec.style.display = 'none';
          return;
        }
        el.innerHTML = posts.map(function (p) {
          var img = p.featuredImage ? SANITY.img(p.featuredImage, 400, 220) : '';
          return `
            <a href="post.html?slug=${SANITY.esc(p.slug)}" class="wb-related-card">
              <div class="wb-related-thumb" ${img ? 'style="background-image:url(' + img + ')"' : ''}></div>
              <div class="wb-related-body">
                <span class="wb-ct-tiny" style="color:${SANITY.ctColor(p.contentType)}">${SANITY.ctLabel(p.contentType)}</span>
                <h4>${SANITY.esc(p.title)}</h4>
                <span>${SANITY.fmtDate(p.publishedAt)}</span>
              </div>
            </a>`;
        }).join('');
      });
  }

  /* ── SEO meta ──────────────────────────────────────────────── */
  function setMeta(post) {
    var seo    = post.seo || {};
    var title  = seo.metaTitle  || post.title + ' — WealthBridge Insights';
    var desc   = seo.metaDescription || post.excerpt || '';
    var ogImg  = (seo.ogImage && seo.ogImage.url) ? seo.ogImage.url
                 : (post.featuredImage ? SANITY.img(post.featuredImage, 1200, 630) : '');

    document.title = title;
    setMeta2('description',       desc);
    setMeta2('og:title',          title);
    setMeta2('og:description',    desc);
    setMeta2('og:type',           'article');
    setMeta2('og:url',            window.location.href);
    if (ogImg) setMeta2('og:image', ogImg);
    setMeta2('twitter:card',      'summary_large_image');
    setMeta2('twitter:title',     title);
    setMeta2('twitter:description', desc);
    if (ogImg) setMeta2('twitter:image', ogImg);
  }

  function setMeta2(name, content) {
    var el = document.querySelector('meta[name="' + name + '"],meta[property="' + name + '"]');
    if (el) { el.setAttribute('content', content); return; }
    var m = document.createElement('meta');
    m.setAttribute(name.startsWith('og:') || name.startsWith('twitter:') ? 'property' : 'name', name);
    m.setAttribute('content', content);
    document.head.appendChild(m);
  }

  /* ── Reading progress bar ──────────────────────────────────── */
  function updateReadingProgress() {
    var bar = document.getElementById('wb-progress-bar');
    if (!bar) return;
    window.addEventListener('scroll', function () {
      var el   = document.getElementById('wb-post-body');
      if (!el) return;
      var rect = el.getBoundingClientRect();
      var h    = el.offsetHeight;
      var pct  = Math.min(100, Math.max(0, (-rect.top / (h - window.innerHeight)) * 100));
      bar.style.width = pct + '%';
    }, { passive: true });
  }

  /* ── Helpers ────────────────────────────────────────────────── */
  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text || '';
  }

  function showSkeleton() {
    var article = document.getElementById('wb-article');
    if (article) article.style.opacity = '0';
    var skel = document.getElementById('wb-post-skeleton');
    if (skel) skel.style.display = '';
  }

  function hideSkeleton() {
    var skel = document.getElementById('wb-post-skeleton');
    if (skel) skel.style.display = 'none';
    var article = document.getElementById('wb-article');
    if (article) { article.style.transition = 'opacity 0.4s'; article.style.opacity = '1'; }
  }

  function showNotFound() {
    hideSkeleton();
    var el = document.getElementById('wb-not-found');
    if (el) el.style.display = 'flex';
    var article = document.getElementById('wb-article');
    if (article) article.style.display = 'none';
  }

  function showNotConfigured() {
    hideSkeleton();
    showNotFound();
  }

})();
