// Vercel Serverless Function — SSR blog index for /blog, /blog/en, /blog/ja.
// Merges hand-written local posts (api/_lib/blog-local-posts.json) with Plurank
// platform posts (blog.plurank.com via the public API). Local posts are pinned
// first; platform posts (Korean-only) follow, newest first, on the ko index.
// Renders the existing dark editorial theme. Degrades to local-only if the
// platform API is unavailable.
import { readFileSync } from 'node:fs';
import {
  SITE_URL, escapeHtml, fmtDate, jsonLd, fetchPlatformPosts,
  INDEX_UI, LANG_MAP, INDEX_CSS, headExtras, navHtml, footerHtml,
} from './_lib/blog-shared.js';

let LOCAL_POSTS = [];
try {
  LOCAL_POSTS = JSON.parse(
    readFileSync(new URL('./_lib/blog-local-posts.json', import.meta.url), 'utf8'),
  );
} catch {
  LOCAL_POSTS = [];
}

/** Normalize a platform API post into the card/featured shape. */
function fromPlatform(p) {
  return {
    url: `/blog/${p.slug}`,
    title: p.title || '',
    description: p.description || '',
    category: Array.isArray(p.tags) && p.tags.length ? p.tags[0] : 'GEO',
    date: fmtDate(p.publishedAt),
    reading: p.readingTime || 1,
    author: 'Plurank',
  };
}

function fromLocal(e) {
  return {
    url: e.url,
    title: e.title || '',
    description: e.description || '',
    category: e.category || '',
    date: e.date || '',
    reading: e.reading_time || 0,
    author: e.author || '',
  };
}

function featuredHtml(post, ui) {
  return `
<a href="${post.url}" class="featured">
  <div class="featured-meta">
    <span class="badge">${ui.latest_label}</span>
    <span class="cat">${escapeHtml(post.category)}</span>
    <span class="sep">·</span>
    <span class="date">${post.date}</span>
    <span class="sep">·</span>
    <span>${post.reading}${ui.min_read}</span>
  </div>
  <h2 class="featured-title"><em>${escapeHtml(post.title)}</em></h2>
  <p class="featured-excerpt">${escapeHtml(post.description)}</p>
  <div class="featured-footer">
    <span class="author">${ui.by} <strong>${escapeHtml(post.author)}</strong></span>
    <span class="read-more">${ui.read_more} <span class="arrow">→</span></span>
  </div>
</a>`;
}

function cardHtml(post, ui, idx) {
  const num = String(idx).padStart(2, '0');
  return `
<a href="${post.url}" class="post-card">
  <div class="post-num">${num}</div>
  <div class="post-body">
    <div class="post-meta">
      <span class="cat">${escapeHtml(post.category)}</span>
      <span class="sep">·</span>
      <span>${post.date}</span>
      <span class="sep">·</span>
      <span>${post.reading}${ui.min_read}</span>
    </div>
    <h3 class="post-title">${escapeHtml(post.title)}</h3>
    <p class="post-excerpt">${escapeHtml(post.description)}</p>
    <div class="post-author">${ui.by} ${escapeHtml(post.author)}</div>
  </div>
  <div class="post-arrow">→</div>
</a>`;
}

function renderIndex(lang, posts) {
  const ui = INDEX_UI[lang];
  const [ogLocale, htmlLang] = LANG_MAP[lang];
  const canonical = lang === 'ko' ? `${SITE_URL}/blog` : `${SITE_URL}/blog/${lang}`;
  const hrefKo = `${SITE_URL}/blog`;
  const hrefEn = `${SITE_URL}/blog/en`;
  const hrefJa = `${SITE_URL}/blog/ja`;

  let bodySection;
  if (posts.length) {
    const featured = featuredHtml(posts[0], ui);
    const rest = posts.slice(1).map((p, i) => cardHtml(p, ui, i + 2)).join('\n');
    bodySection = featured + (posts.length > 1 ? `<div class="post-list">${rest}</div>` : '');
  } else {
    bodySection = `<div class="empty">${ui.empty}</div>`;
  }

  const blogJsonLd = {
    '@context': 'https://schema.org', '@type': 'Blog',
    name: 'Plurank Journal', url: canonical, inLanguage: htmlLang,
    publisher: { '@type': 'Organization', name: 'Plurank', url: SITE_URL },
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting', headline: p.title, description: p.description,
      url: `${SITE_URL}${p.url}`, datePublished: p.date,
      author: { '@type': 'Person', name: p.author },
    })),
  };

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(ui.page_title)}</title>
<meta name="description" content="${escapeHtml(ui.page_desc)}">
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
<meta name="theme-color" content="#0a0a0a">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="ko" href="${hrefKo}">
<link rel="alternate" hreflang="en" href="${hrefEn}">
<link rel="alternate" hreflang="ja" href="${hrefJa}">
<link rel="alternate" hreflang="x-default" href="${hrefKo}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(ui.page_title)}">
<meta property="og:description" content="${escapeHtml(ui.page_desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="Plurank">
<meta property="og:locale" content="${ogLocale}">
<meta property="og:image" content="${SITE_URL}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="${escapeHtml(ui.page_title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(ui.page_title)}">
<meta name="twitter:description" content="${escapeHtml(ui.page_desc)}">
<meta name="twitter:image" content="${SITE_URL}/og-image.png">
${headExtras()}
<script type="application/ld+json">${jsonLd(blogJsonLd)}</script>
<style>${INDEX_CSS}</style>
</head>
<body>
${navHtml({ activeLang: lang, switchHrefs: { ko: hrefKo, en: hrefEn, ja: hrefJa } })}
<section class="hero">
  <div class="hero-inner">
    <div class="kicker">
      <span class="dot"></span>
      ${ui.kicker} · ${String(posts.length).padStart(2, '0')} ${posts.length === 1 ? 'POST' : 'POSTS'}
    </div>
    <h1 class="hero-title">
      <span class="line">${escapeHtml(ui.hero_title_a)}</span>
      <span class="line italic">${escapeHtml(ui.hero_title_b)}</span>
      <span class="line">${escapeHtml(ui.hero_title_c)}</span>
    </h1>
    <p class="hero-sub">${escapeHtml(ui.hero_sub)}</p>
    <div class="hero-meta-bar">
      <div>${ui.latest_label}<strong>${posts.length ? posts[0].date : '—'}</strong></div>
      <div>POSTS<strong>${String(posts.length).padStart(2, '0')}</strong></div>
      <div>LANGUAGES<strong>KO · EN · JA</strong></div>
      <div>FOCUS<strong>GEO · AI Search</strong></div>
    </div>
  </div>
</section>
<section class="posts-wrap">
${bodySection}
</section>
${footerHtml(ui.footer_lead)}
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const lang = ['ko', 'en', 'ja'].includes(req.query.lang) ? req.query.lang : 'ko';

  // Local posts for this language, newest first (pinned ahead of platform posts).
  const local = LOCAL_POSTS
    .filter((e) => e.lang === lang)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(fromLocal);

  // Platform posts are Korean-only → only surface them on the ko index.
  let platform = [];
  if (lang === 'ko') {
    platform = (await fetchPlatformPosts()).map(fromPlatform);
  }

  const posts = [...local, ...platform];
  const html = renderIndex(lang, posts);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  return res.status(200).send(html);
}
