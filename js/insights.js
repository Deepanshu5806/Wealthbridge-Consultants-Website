/* ============================================================
   WealthBridge — Insights Hub Page Logic
   ============================================================ */
(function () {
  'use strict';

  var PAGE_SIZE   = 9;
  var currentFilter = 'all';
  var allPosts    = [];

  /* ── GROQ Queries ─────────────────────────────────────────── */
  var QUERY_ALL = `
    *[_type == "post" && !(_id in path("drafts.**")) && defined(slug.current)]
    | order(featured desc, publishedAt desc) {
      _id, title,
      "slug":        slug.current,
      contentType,
      excerpt,
      publishedAt,
      featured,
      readTime,
      videoUrl,
      videoDuration,
      reportYear,
      reportPages,
      "featuredImage": featuredImage { alt, "url": asset->url },
      "category":      category->{ name, color },
      tags,
      "author":        author->{ name, role }
    }`.trim();

  /* ── Init ─────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    loadAllPosts();
    setupFilters();
  });

  /* ── Load posts ───────────────────────────────────────────── */
  function loadAllPosts() {
    showSkeleton();

    if (!SANITY.isCMSConfigured()) {
      showNotConfigured();
      return;
    }

    SANITY.fetch(QUERY_ALL)
      .then(function (posts) {
        allPosts = posts || [];
        renderPage();
      })
      .catch(function (err) {
        console.error('Insights fetch error:', err);
        showError();
      });
  }

  /* ── Render everything ────────────────────────────────────── */
  function renderPage() {
    var filtered = filterPosts(allPosts, currentFilter);

    /* Featured */
    var featured  = allPosts.filter(function (p) { return p.featured; })[0] || allPosts[0];
    renderFeatured(featured);

    /* Grid */
    var gridPosts = filtered.filter(function (p) { return !p.featured || currentFilter !== 'all' || p !== featured; });
    renderGrid(gridPosts.slice(0, PAGE_SIZE));

    /* Load more */
    updateLoadMore(filtered.length > PAGE_SIZE + (currentFilter === 'all' && featured ? 1 : 0));

    hideSkeleton();
    updateCounts();
  }

  /* ── Featured card ────────────────────────────────────────── */
  function renderFeatured(post) {
    var el = document.getElementById('wb-featured');
    if (!el) return;
    if (!post) { el.style.display = 'none'; return; }

    var img = post.featuredImage ? SANITY.img(post.featuredImage, 1200, 500) : '';
    var bgStyle = img ? 'background-image:url(' + img + ')' : 'background:#0f2b4a';

    el.innerHTML = `
      <a href="post.html?slug=${SANITY.esc(post.slug)}" class="wb-featured-card" style="${bgStyle}">
        <div class="wb-featured-overlay">
          <div class="wb-featured-body">
            <span class="wb-ct-badge" style="background:${SANITY.ctColor(post.contentType)}">
              <i class="${SANITY.ctIcon(post.contentType)}"></i> ${SANITY.ctLabel(post.contentType)}
            </span>
            <h2 class="wb-featured-title">${SANITY.esc(post.title)}</h2>
            <p class="wb-featured-excerpt">${SANITY.esc(post.excerpt || '')}</p>
            <div class="wb-card-meta">
              ${post.author ? `<span><i class="fas fa-user-circle"></i> ${SANITY.esc(post.author.name)}</span>` : ''}
              <span><i class="fas fa-calendar-alt"></i> ${SANITY.fmtDate(post.publishedAt)}</span>
              <span class="wb-read-more">Read Article <i class="fas fa-arrow-right"></i></span>
            </div>
          </div>
        </div>
      </a>`;
    el.style.display = '';
  }

  /* ── Posts grid ───────────────────────────────────────────── */
  function renderGrid(posts) {
    var grid = document.getElementById('wb-grid');
    if (!grid) return;

    if (!posts || posts.length === 0) {
      grid.innerHTML = '<div class="wb-empty"><i class="fas fa-newspaper"></i><p>No content found in this category yet.</p></div>';
      return;
    }
    grid.innerHTML = posts.map(cardHtml).join('');
  }

  function cardHtml(post) {
    var img    = post.featuredImage ? SANITY.img(post.featuredImage, 600, 340) : '';
    var isVid  = post.contentType === 'video';
    var isRes  = post.contentType === 'research';

    var thumb = img
      ? `<div class="wb-card-thumb" style="background-image:url(${img})">
           ${isVid ? '<div class="wb-play-btn"><i class="fas fa-play"></i></div>' : ''}
           <span class="wb-ct-badge" style="background:${SANITY.ctColor(post.contentType)}">
             <i class="${SANITY.ctIcon(post.contentType)}"></i> ${SANITY.ctLabel(post.contentType)}
           </span>
         </div>`
      : `<div class="wb-card-thumb wb-card-thumb--empty">
           <i class="${SANITY.ctIcon(post.contentType)}" style="color:${SANITY.ctColor(post.contentType)}"></i>
           <span class="wb-ct-badge" style="background:${SANITY.ctColor(post.contentType)}">
             ${SANITY.ctLabel(post.contentType)}
           </span>
         </div>`;

    var action = isRes
      ? `<a href="post.html?slug=${SANITY.esc(post.slug)}" class="wb-card-action">
           <i class="fas fa-download"></i> View Report
         </a>`
      : isVid
      ? `<a href="post.html?slug=${SANITY.esc(post.slug)}" class="wb-card-action">
           <i class="fas fa-play"></i> Watch Video ${post.videoDuration ? '· ' + SANITY.esc(post.videoDuration) : ''}
         </a>`
      : '';

    return `
      <article class="wb-card reveal" data-type="${post.contentType}">
        <a href="post.html?slug=${SANITY.esc(post.slug)}" class="wb-card-link">
          ${thumb}
          <div class="wb-card-body">
            ${post.category ? `<span class="wb-category-label">${SANITY.esc(post.category.name)}</span>` : ''}
            <h3 class="wb-card-title">${SANITY.esc(post.title)}</h3>
            <p class="wb-card-excerpt">${SANITY.esc(post.excerpt || '')}</p>
          </div>
        </a>
        <div class="wb-card-footer">
          <div class="wb-card-meta">
            ${post.author ? `<span><i class="fas fa-user-circle"></i> ${SANITY.esc(post.author.name)}</span>` : ''}
            <span><i class="fas fa-calendar-alt"></i> ${SANITY.fmtDate(post.publishedAt)}</span>
          </div>
          ${action}
        </div>
      </article>`;
  }

  /* ── Filters ──────────────────────────────────────────────── */
  function setupFilters() {
    document.querySelectorAll('.wb-filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.wb-filter-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter') || 'all';
        renderPage();
        window.scrollTo({ top: document.getElementById('wb-insights-grid') ? document.getElementById('wb-insights-grid').offsetTop - 120 : 0, behavior: 'smooth' });
      });
    });
  }

  function filterPosts(posts, type) {
    if (!type || type === 'all') return posts;
    return posts.filter(function (p) { return p.contentType === type; });
  }

  function updateCounts() {
    var types = ['blog', 'marketUpdate', 'educational', 'video', 'infographic', 'research'];
    types.forEach(function (t) {
      var el = document.getElementById('wb-count-' + t);
      if (el) el.textContent = allPosts.filter(function (p) { return p.contentType === t; }).length;
    });
    var total = document.getElementById('wb-count-all');
    if (total) total.textContent = allPosts.length;
  }

  /* ── Load More ────────────────────────────────────────────── */
  function updateLoadMore(show) {
    var btn = document.getElementById('wb-load-more');
    if (!btn) return;
    btn.style.display = show ? 'inline-flex' : 'none';
    btn.onclick = function () {
      var filtered = filterPosts(allPosts, currentFilter);
      var grid     = document.getElementById('wb-grid');
      if (!grid) return;
      var current  = grid.querySelectorAll('.wb-card').length;
      var more     = filtered.slice(current, current + PAGE_SIZE);
      more.forEach(function (p) {
        var div = document.createElement('div');
        div.innerHTML = cardHtml(p);
        var card = div.firstElementChild;
        grid.appendChild(card);
        /* trigger reveal */
        setTimeout(function () { if (card) card.classList.add('visible'); }, 50);
      });
      if (current + more.length >= filtered.length) btn.style.display = 'none';
    };
  }

  /* ── Skeleton / States ────────────────────────────────────── */
  function showSkeleton() {
    var grid = document.getElementById('wb-grid');
    if (!grid) return;
    var s = '';
    for (var i = 0; i < 6; i++) {
      s += '<div class="wb-card wb-skeleton"><div class="wb-skeleton-thumb"></div>' +
        '<div class="wb-card-body"><div class="wb-skeleton-line wb-skeleton-line--sm"></div>' +
        '<div class="wb-skeleton-line"></div><div class="wb-skeleton-line wb-skeleton-line--md"></div></div></div>';
    }
    grid.innerHTML = s;
    var feat = document.getElementById('wb-featured');
    if (feat) feat.innerHTML = '<div class="wb-skeleton wb-skeleton--featured"></div>';
  }

  function hideSkeleton() { /* renderGrid replaces it */ }

  function showNotConfigured() {
    var grid = document.getElementById('wb-grid');
    if (grid) grid.innerHTML = `
      <div class="wb-setup-notice">
        <i class="fas fa-cog fa-spin"></i>
        <h3>CMS Setup Required</h3>
        <p>Connect Sanity CMS to start publishing content.<br>
        Add your Project ID to <code>js/sanity-client.js</code>.</p>
        <a href="https://sanity.io/manage" target="_blank" class="btn btn-primary" style="margin-top:16px;">
          Open Sanity Dashboard <i class="fas fa-external-link-alt"></i>
        </a>
      </div>`;
    var feat = document.getElementById('wb-featured');
    if (feat) feat.style.display = 'none';
  }

  function showError() {
    var grid = document.getElementById('wb-grid');
    if (grid) grid.innerHTML = `
      <div class="wb-empty">
        <i class="fas fa-exclamation-circle" style="color:#ef4444;"></i>
        <p>Could not load content. Please try refreshing the page.</p>
      </div>`;
  }

})();
