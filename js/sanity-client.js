/* ============================================================
   WealthBridge — Sanity CMS Client (Vanilla JS)
   ============================================================
   SETUP: Replace YOUR_PROJECT_ID with your Sanity project ID
   from https://sanity.io/manage  after creating your project.
   ============================================================ */

var SANITY_PROJECT_ID  = 'YOUR_PROJECT_ID'; // ← paste your ID here
var SANITY_DATASET     = 'production';
var SANITY_API_VERSION = '2024-01-01';

/* CDN for public reads (fast, cached ~60s) */
var SANITY_CDN_URL = 'https://' + SANITY_PROJECT_ID + '.apicdn.sanity.io/v' +
  SANITY_API_VERSION + '/data/query/' + SANITY_DATASET;

var SANITY_IMG_BASE  = 'https://cdn.sanity.io/images/' + SANITY_PROJECT_ID + '/' + SANITY_DATASET;
var SANITY_FILE_BASE = 'https://cdn.sanity.io/files/'  + SANITY_PROJECT_ID + '/' + SANITY_DATASET;

/* ── Fetch from Sanity ──────────────────────────────────────── */
function sanityFetch(query, params) {
  if (SANITY_PROJECT_ID === 'YOUR_PROJECT_ID') {
    return Promise.resolve([]); /* CMS not configured yet */
  }
  var url = SANITY_CDN_URL + '?query=' + encodeURIComponent(query.trim());
  if (params) {
    Object.keys(params).forEach(function (k) {
      url += '&$' + k + '=' + encodeURIComponent(JSON.stringify(params[k]));
    });
  }
  return fetch(url, { headers: { Accept: 'application/json' } })
    .then(function (r) {
      if (!r.ok) throw new Error('Sanity ' + r.status);
      return r.json();
    })
    .then(function (d) { return d.result || []; });
}

/* ── Image URL Builder ──────────────────────────────────────── */
function sanityImg(asset, w, h) {
  if (!asset) return '';
  var url = '';
  if (typeof asset === 'string' && asset.startsWith('http')) {
    url = asset;
  } else if (asset && asset.url) {
    url = asset.url;
  } else if (asset && asset._ref) {
    /* ref: "image-{hash}-{WxH}-{format}" */
    var r   = asset._ref.replace(/^image-/, '');
    var fmt = r.split('-').pop();
    var dim = r.split('-').slice(-2, -1)[0];
    var id  = r.split('-').slice(0, -2).join('-');
    url = SANITY_IMG_BASE + '/' + id + '-' + dim + '.' + fmt;
  } else {
    return '';
  }
  var q = [];
  if (w) q.push('w=' + w);
  if (h) q.push('h=' + h);
  q.push('auto=format', 'fit=crop', 'q=80');
  return url + '?' + q.join('&');
}

/* ── File URL Builder (PDFs) ────────────────────────────────── */
function sanityFile(asset) {
  if (!asset || !asset._ref) return '';
  /* ref: "file-{hash}-{ext}" */
  var r   = asset._ref.replace(/^file-/, '');
  var ext = r.split('-').pop();
  var id  = r.split('-').slice(0, -1).join('-');
  return SANITY_FILE_BASE + '/' + id + '.' + ext;
}

/* ── YouTube embed URL ──────────────────────────────────────── */
function ytEmbed(url) {
  if (!url) return '';
  return url
    .replace('watch?v=',   'embed/')
    .replace('youtu.be/',  'youtube.com/embed/')
    .replace('youtube.com/shorts/', 'youtube.com/embed/');
}

/* ── Format date ────────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

/* ── Reading time ───────────────────────────────────────────── */
function readTime(blocks) {
  if (!blocks || !Array.isArray(blocks)) return '2 min';
  var words = blocks
    .filter(function (b) { return b._type === 'block' && b.children; })
    .map(function (b) { return b.children.map(function (c) { return c.text || ''; }).join(' '); })
    .join(' ')
    .split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 220)) + ' min read';
}

/* ── Escape HTML ────────────────────────────────────────────── */
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Portable Text → HTML ───────────────────────────────────── */
function ptHtml(blocks) {
  if (!Array.isArray(blocks)) return '';
  var listBuf = [], listType = null;

  function flushList() {
    if (!listBuf.length) return '';
    var tag = listType === 'number' ? 'ol' : 'ul';
    var out = '<' + tag + ' class="pt-list">' + listBuf.join('') + '</' + tag + '>';
    listBuf = []; listType = null;
    return out;
  }

  var html = '';
  blocks.forEach(function (block) {
    if (!block) return;

    /* ── list item ── */
    if (block._type === 'block' && block.listItem) {
      if (listType && listType !== block.listItem) html += flushList();
      listType = block.listItem;
      listBuf.push('<li>' + renderInlines(block) + '</li>');
      return;
    }

    /* flush pending list before non-list block */
    html += flushList();

    /* ── text block ── */
    if (block._type === 'block') {
      var tagMap = { normal: 'p', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', blockquote: 'blockquote' };
      var tag = tagMap[block.style || 'normal'] || 'p';
      var cls = tag === 'blockquote' ? ' class="pt-quote"' : ' class="pt-' + tag + '"';
      html += '<' + tag + cls + '>' + renderInlines(block) + '</' + tag + '>';
      return;
    }

    /* ── inline image ── */
    if (block._type === 'image' && block.asset) {
      var src = sanityImg(block.asset, 900);
      var alt = esc(block.alt || '');
      var cap = block.caption ? '<figcaption>' + esc(block.caption) + '</figcaption>' : '';
      html += '<figure class="pt-img">' +
        '<img src="' + src + '" alt="' + alt + '" loading="lazy">' + cap + '</figure>';
      return;
    }

    /* ── callout block ── */
    if (block._type === 'callout') {
      html += '<div class="pt-callout pt-callout--' + (block.style || 'info') + '">' +
        '<span class="pt-callout__icon"></span>' + esc(block.text) + '</div>';
      return;
    }
  });

  html += flushList();
  return html;
}

function renderInlines(block) {
  return (block.children || []).map(function (child) {
    var t = esc(child.text || '').replace(/\n/g, '<br>');
    var marks = child.marks || [];
    /* link annotation */
    var link = marks
      .map(function (m) { return (block.markDefs || []).find(function (d) { return d._key === m && d._type === 'link'; }); })
      .find(Boolean);
    if (link) t = '<a href="' + esc(link.href) + '"' + (link.blank !== false ? ' target="_blank" rel="noopener"' : '') + '>' + t + '</a>';
    if (marks.includes('strong'))         t = '<strong>' + t + '</strong>';
    if (marks.includes('em'))             t = '<em>' + t + '</em>';
    if (marks.includes('underline'))      t = '<u>' + t + '</u>';
    if (marks.includes('code'))           t = '<code>' + t + '</code>';
    if (marks.includes('strike-through')) t = '<s>' + t + '</s>';
    return t;
  }).join('');
}

/* ── Content type config ────────────────────────────────────── */
var CT = {
  blog:         { label: 'Blog',            icon: 'fas fa-pen-nib',        color: '#0f2b4a' },
  marketUpdate: { label: 'Market Update',   icon: 'fas fa-chart-line',     color: '#059669' },
  educational:  { label: 'Educational',     icon: 'fas fa-graduation-cap', color: '#7c3aed' },
  video:        { label: 'Video',           icon: 'fas fa-play-circle',    color: '#dc2626' },
  infographic:  { label: 'Infographic',     icon: 'fas fa-chart-pie',      color: '#ea580c' },
  research:     { label: 'Research',        icon: 'fas fa-file-alt',       color: '#b45309' },
};

function ctLabel(type) { return (CT[type] || CT.blog).label; }
function ctIcon(type)  { return (CT[type] || CT.blog).icon;  }
function ctColor(type) { return (CT[type] || CT.blog).color; }

/* expose everything globally */
window.SANITY = {
  fetch: sanityFetch, img: sanityImg, file: sanityFile,
  ytEmbed, fmtDate, readTime, ptHtml, esc,
  ctLabel, ctIcon, ctColor,
  isCMSConfigured: function () { return SANITY_PROJECT_ID !== 'YOUR_PROJECT_ID'; }
};
