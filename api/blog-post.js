// Vercel Serverless Function — SSR a single Plurank platform post at
// /blog/<slug> (only reached when no static hand-written post file matches).
// Mirrors blog.plurank.com content natively in the home editorial theme, with a
// self-canonical (www is the SEO original; blog.plurank.com points here).
import {
  SITE_URL, escapeHtml, fmtDate, jsonLd, fetchPlatformPost,
  POST_UI_KO, POST_CSS, headExtras, navHtml, footerHtml,
} from './_lib/blog-shared.js';

const TOC_TITLE = '목차';

function tocHtml(toc) {
  const l2 = Array.isArray(toc) ? toc.filter((t) => t.level === 2) : [];
  if (l2.length < 3) return '';
  const items = l2.map((t) => `<li><a href="#${escapeHtml(t.anchor)}">${escapeHtml(t.text)}</a></li>`).join('');
  return `<aside class="toc"><div class="toc-title">${TOC_TITLE}</div><ol>${items}</ol></aside>`;
}

function shell(title, bodyInner, canonical) {
  // Minimal themed shell for error states (404/503).
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} · Plurank</title>
<meta name="robots" content="noindex">
${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
${headExtras()}
<style>${POST_CSS}</style>
</head>
<body>
${navHtml({ activeLang: 'ko', switchHrefs: { ko: `${SITE_URL}/blog`, en: `${SITE_URL}/blog/en`, ja: `${SITE_URL}/blog/ja` } })}
<div class="article-wrap">
  <a href="/blog" class="back-link">${POST_UI_KO.back_to_blog}</a>
  ${bodyInner}
</div>
${footerHtml(POST_UI_KO.footer_lead)}
</body>
</html>`;
}

function renderPost(p) {
  const slug = p.slug;
  const canonical = `${SITE_URL}/blog/${slug}`;
  const title = p.title || '';
  const subtitle = p.description || '';
  const category = Array.isArray(p.tags) && p.tags.length ? p.tags[0] : 'GEO';
  const date = fmtDate(p.publishedAt);
  const reading = p.readingTime || 1;
  const tags = Array.isArray(p.tags) ? p.tags : [];
  const ogImage = p.coverImage || `${SITE_URL}/og-image.png`;
  const ui = POST_UI_KO;

  const articleJsonLd = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: title, description: subtitle,
    datePublished: p.publishedAt || date, dateModified: p.updatedAt || p.publishedAt || date,
    inLanguage: 'ko', timeRequired: `PT${reading}M`,
    author: {
      '@type': 'Organization', name: 'Plurank', url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization', name: 'Plurank', url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-square.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    articleSection: category,
    keywords: tags.join(', '),
    image: [ogImage],
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: title, item: canonical },
    ],
  };

  const tagsRow = tags.length
    ? `<div class="tags-row">${tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join(' · ')}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} · Plurank Blog</title>
<meta name="description" content="${escapeHtml(subtitle)}">
<meta name="author" content="Plurank (투스텝스어헤드)">
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
<meta name="theme-color" content="#0a0a0a">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="ko" href="${canonical}">
<link rel="alternate" hreflang="x-default" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(subtitle)}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="Plurank">
<meta property="og:locale" content="ko_KR">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:alt" content="${escapeHtml(title)}">
${p.publishedAt ? `<meta property="article:published_time" content="${p.publishedAt}">` : ''}
<meta property="article:section" content="${escapeHtml(category)}">
${tags.map((t) => `<meta property="article:tag" content="${escapeHtml(t)}">`).join('\n')}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(subtitle)}">
<meta name="twitter:image" content="${ogImage}">
${headExtras()}
<script type="application/ld+json">${jsonLd(articleJsonLd)}</script>
<script type="application/ld+json">${jsonLd(breadcrumbJsonLd)}</script>
<style>${POST_CSS}</style>
</head>
<body>
${navHtml({ activeLang: 'ko', switchHrefs: { ko: canonical, en: `${SITE_URL}/blog/en`, ja: `${SITE_URL}/blog/ja` } })}
<div class="article-wrap">
  <a href="/blog" class="back-link">${ui.back_to_blog}</a>
  <header class="article-header">
    <div class="eyebrow">${escapeHtml(category)} · ${date}</div>
    <h1 class="article-title">${escapeHtml(title)}</h1>
    <p class="article-subtitle">${escapeHtml(subtitle)}</p>
    <div class="article-meta">
      <div class="author-row">
        <div class="author-avatar">P</div>
        <div>
          <div class="author-name">Plurank</div>
          <div class="author-title">투스텝스어헤드(주)</div>
        </div>
      </div>
      <span class="meta-sep">·</span>
      <span>${reading}${ui.reading_time_suffix}</span>
    </div>
  </header>
  ${tocHtml(p.toc)}
  <article class="body">
    ${p.html || ''}
  </article>
  ${tagsRow}
  <div class="cta-card">
    <h2>${ui.cta_title}</h2>
    <p>${ui.cta_sub}</p>
    <a href="/#contact" class="btn">${ui.cta_btn} <span style="font-family:var(--f-display);font-style:italic;">→</span></a>
  </div>
</div>
${footerHtml(ui.footer_lead)}
</body>
</html>`;
}

// AI 크롤러 비콘 — 봇이 www 글을 크롤하면 우리 트래킹 서버(api.plurank.com)에 기록한다.
// www 글은 blog.plurank.com KR 블로그의 미러(self-canonical)이므로, host 를 blog.plurank.com
// 으로 리매핑해 보내면 서버가 ws1 플루랭크 블로그 + 해당 글로 자동 귀속한다.
// 사람 요청엔 영향 없음(봇 UA 만 ≤800ms, 실패해도 페이지 응답 정상).
const AI_BOT_PATTERN =
  /(gptbot|chatgpt-user|oai-searchbot|claudebot|claude-user|anthropic|perplexitybot|perplexity-user|ccbot|google-extended|googlebot|bingbot|applebot|bytespider|amazonbot|meta-external|cohere|bot|crawler|spider)/i;

async function trackBotVisit(req, slug) {
  const ua = String(req.headers['user-agent'] || '');
  if (!ua || !AI_BOT_PATTERN.test(ua)) return;
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const base = process.env.TRACK_API || 'https://api.plurank.com';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2500);
  try {
    await fetch(`${base}/api/plurank/track/bot-visit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ host: 'blog.plurank.com', path: `/${slug}`, ua, ip, method: req.method }),
      signal: ctrl.signal,
    });
  } catch {
    /* best-effort */
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const slug = String(req.query.slug || '').trim();
  if (!slug) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).send(shell('찾을 수 없는 글', '<header class="article-header"><h1 class="article-title">404</h1><p class="article-subtitle">요청하신 글을 찾을 수 없습니다.</p></header>', null));
  }

  const { ok, status, data } = await fetchPlatformPost(slug);

  if (ok && data && data.slug) {
    const html = renderPost(data);
    await trackBotVisit(req, slug); // 봇이면 AI 크롤러 비콘(≤800ms), 사람이면 즉시 통과
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(html);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (status === 404) {
    return res.status(404).send(shell('찾을 수 없는 글', '<header class="article-header"><h1 class="article-title">404</h1><p class="article-subtitle">요청하신 글을 찾을 수 없습니다.</p></header>', null));
  }
  // Upstream timeout / 5xx — don't hard-fail; the post still lives on blog.plurank.com.
  res.setHeader('Cache-Control', 'no-store');
  return res.status(503).send(shell('일시적으로 표시할 수 없음', '<header class="article-header"><h1 class="article-title">잠시 후 다시 시도해 주세요</h1><p class="article-subtitle">글을 불러오는 중 문제가 발생했습니다.</p></header>', null));
}
