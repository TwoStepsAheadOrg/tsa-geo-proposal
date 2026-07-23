// Shared helpers + theme for the SSR blog (api/blog-index.js, api/blog-post.js,
// api/blog-sitemap.js). Lives under api/_lib so Vercel does NOT treat it as a
// serverless endpoint (underscore-prefixed paths are excluded from functions).
//
// 2026-07: re-themed to match the redesigned Plurank landing (plurank_landing SPA)
// — light surface, Geist type, floating pill header. Class names kept so the
// blog-index / blog-post templates need no structural change.

export const SITE_URL = 'https://www.plurank.com';
export const API_BASE = process.env.BLOG_API_BASE || 'https://api.plurank.com';

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Serialize JSON-LD safely for inline <script> — escape < > & so a title
 *  containing "</script>" or "<" can't break out of the script element. */
export function jsonLd(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/** ISO datetime → YYYY-MM-DD (templates display date-only). */
export function fmtDate(v) {
  if (!v) return '';
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

// ── Platform public blog API (blog.plurank.com via api.plurank.com) ──────────
async function rawGet(url, ms = 3500) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    let data = null;
    try { data = await r.json(); } catch { /* non-JSON */ }
    return { ok: r.ok, status: r.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  } finally {
    clearTimeout(timer);
  }
}

/** Published Plurank posts, newest first. [] on any failure (graceful degradation). */
export async function fetchPlatformPosts() {
  const { ok, data } = await rawGet(`${API_BASE}/api/plurank/public/blog/posts?limit=50`);
  return ok && Array.isArray(data?.posts) ? data.posts : [];
}

/** Single post. Returns { ok, status, data }. status 404 → not found; 0/5xx → upstream error. */
export async function fetchPlatformPost(slug) {
  return rawGet(`${API_BASE}/api/plurank/public/blog/posts/${encodeURIComponent(slug)}`);
}

// ── i18n labels ──────────────────────────────────────────────────────────────
export const INDEX_UI = {
  ko: {
    page_title: 'Plurank Journal — GEO 인사이트와 케이스 스터디',
    page_desc: 'AI 검색 시대 GEO 마케팅 인사이트, 케이스 스터디, 시장 트렌드, Plurank 소식. 매주 갱신.',
    kicker: 'PLURANK JOURNAL',
    hero_title_a: 'AI 답변 안에서', hero_title_b: '브랜드가 어떻게', hero_title_c: '보이고 있는가',
    hero_sub: 'AI 검색 시대 GEO 마케팅 인사이트, 케이스 스터디, 그리고 Plurank 팀의 발견. 매주 갱신.',
    latest_label: 'LATEST', min_read: '분', by: 'by',
    footer_lead: 'Plurank — 투스텝스어헤드(주)의 GEO 솔루션',
    empty: '곧 새 글이 올라옵니다.', read_more: '이어 읽기',
  },
  en: {
    page_title: 'Plurank Journal — GEO Insights & Case Studies',
    page_desc: 'GEO marketing insights, case studies, market trends, and product updates from Plurank. Updated weekly.',
    kicker: 'PLURANK JOURNAL',
    hero_title_a: 'How brands', hero_title_b: 'actually appear', hero_title_c: 'inside AI answers',
    hero_sub: 'Insights, case studies and findings from the Plurank team — for the AI search era. Updated weekly.',
    latest_label: 'LATEST', min_read: ' min', by: 'by',
    footer_lead: "Plurank — TwoStepsAhead Inc.'s GEO solution",
    empty: 'New posts coming soon.', read_more: 'Read article',
  },
  ja: {
    page_title: 'Plurank Journal — GEOインサイトと事例研究',
    page_desc: 'AI検索時代のGEOマーケティング・インサイト、事例研究、市場トレンド、Plurank最新情報。毎週更新。',
    kicker: 'PLURANK JOURNAL',
    hero_title_a: 'AIの回答の中で、', hero_title_b: 'ブランドは', hero_title_c: 'どう見られているか',
    hero_sub: 'AI検索時代に向けた、Plurankチームによるインサイト・事例・発見。毎週更新。',
    latest_label: 'LATEST', min_read: '分', by: 'by',
    footer_lead: 'Plurank — TwoStepsAhead社のGEOソリューション',
    empty: '新しい記事をまもなく公開します。', read_more: '記事を読む',
  },
};

// Platform posts are Korean-only, so the post page only needs ko labels.
export const POST_UI_KO = {
  back_to_blog: '← Journal 전체 보기',
  reading_time_suffix: '분 읽기',
  cta_title: 'AI 답변 안의 우리 브랜드를 직접 확인하세요',
  cta_sub: 'AI 검색 데이터 분석부터 채널별 콘텐츠 발행까지, 무료 진단으로 먼저 현황을 확인해보세요.',
  cta_btn: '무료 진단 신청',
  footer_lead: 'Plurank — 투스텝스어헤드(주)의 GEO 솔루션',
};

export const LANG_MAP = { ko: ['ko_KR', 'ko'], en: ['en_US', 'en'], ja: ['ja_JP', 'ja'] };

// ── Shared chrome ────────────────────────────────────────────────────────────
export function headExtras() {
  return `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<script defer src="/_vercel/insights/script.js"></script>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-18267771264"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-18267771264');
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet">`;
}

/** Floating pill header identical in spirit to the landing nav.
 *  Content anchors point at the SPA home ("/#about" …) where those ids exist. */
export function navHtml({ activeLang, switchHrefs }) {
  const labels = {
    en: { about: 'Overview', diff: 'Why Plurank', feat: 'Features', faq: 'FAQ', blog: 'Blog', cta: 'Consultation' },
    ja: { about: 'Plurank 概要', diff: '特徴', feat: '機能', faq: 'FAQ', blog: 'ブログ', cta: 'お問い合わせ' },
    ko: { about: 'Plurank 소개', diff: '차별점', feat: '기능', faq: 'FAQ', blog: '블로그', cta: '상담하기' },
  };
  const t = labels[activeLang] || labels.ko;
  const blogHref = activeLang === 'en' ? '/blog/en' : activeLang === 'ja' ? '/blog/ja' : '/blog';
  const a = (l) => (l === activeLang ? ' class="on"' : '');
  return `<header class="nav">
  <a href="/" class="nav-brand" aria-label="Plurank home"><span class="wordmark">Plurank</span></a>
  <nav class="nav-links" aria-label="Primary navigation">
    <a href="/#about">${t.about}</a>
    <a href="/#difference">${t.diff}</a>
    <a href="/#features">${t.feat}</a>
    <a href="/#faq">${t.faq}</a>
    <a href="${blogHref}" class="active">${t.blog}</a>
  </nav>
  <div class="nav-right">
    <div class="nav-lang"><a href="${switchHrefs.ko}"${a('ko')}>KO</a><i>·</i><a href="${switchHrefs.en}"${a('en')}>EN</a><i>·</i><a href="${switchHrefs.ja}"${a('ja')}>JA</a></div>
    <a href="/" class="nav-cta">${t.cta} <span aria-hidden="true">→</span></a>
  </div>
</header>`;
}

export function footerHtml(footerLead) {
  return `<footer class="footer">
  <div class="footer-brand"><span class="wordmark">Plurank</span></div>
  <div class="footer-lead">${footerLead}</div>
  <div class="footer-line">© 2026 Plurank · 투스텝스어헤드(주) · <a href="mailto:contact@plurank.com">contact@plurank.com</a> · <a href="/privacy">Privacy</a></div>
</footer>`;
}

// ── Theme (light — matches the redesigned landing) ───────────────────────────
const ROOT_VARS = `:root {
  --bg: #f8f8f7;
  --surface: #ffffff;
  --surface-soft: #f1f2f3;
  --ink: #151515;
  --ink-soft: #3d3b38;
  --muted: #747472;
  --faint: #a4a3a0;
  --line: rgb(20 20 20 / 9%);
  --line-strong: rgb(20 20 20 / 16%);
  --gold: #b98228;
  --gold-soft: rgb(185 130 40 / 12%);
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --f-sans: "Geist", "Pretendard", -apple-system, BlinkMacSystemFont, sans-serif;
  --f-mono: "Geist Mono", "SF Mono", ui-monospace, monospace;
}`;

const NAV_CSS = `.nav {
  position: fixed; z-index: 100; top: 18px; left: 50%; transform: translateX(-50%);
  width: min(1000px, calc(100vw - 36px)); height: 64px;
  padding: 9px 10px 9px 24px;
  display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 20px;
  border: 1px solid rgb(255 255 255 / 76%); border-radius: 32px;
  background: rgb(247 247 245 / 82%);
  box-shadow: 0 10px 34px rgb(27 25 21 / 8%), inset 0 1px 0 rgb(255 255 255 / 88%);
  backdrop-filter: blur(26px) saturate(130%); -webkit-backdrop-filter: blur(26px) saturate(130%);
}
.wordmark { font-family: var(--f-sans); font-weight: 640; font-size: 21px; letter-spacing: -0.02em; color: var(--ink); line-height: 1; }
.nav-brand { display: inline-flex; align-items: center; }
.nav-links { display: flex; align-items: center; justify-content: center; gap: 26px; font-size: 14px; }
.nav-links a { color: #57574f; transition: color 0.18s ease; }
.nav-links a:hover, .nav-links a.active { color: var(--ink); }
.nav-right { display: flex; align-items: center; gap: 14px; justify-self: end; }
.nav-lang { display: flex; align-items: center; gap: 6px; font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.04em; color: var(--faint); }
.nav-lang a { color: var(--faint); transition: color 0.18s ease; }
.nav-lang a:hover, .nav-lang a.on { color: var(--ink); }
.nav-lang i { color: var(--line-strong); font-style: normal; }
.nav-cta {
  display: inline-flex; align-items: center; gap: 7px; height: 44px; padding: 0 19px;
  background: var(--ink); color: #fff; border-radius: 22px;
  font-size: 14px; font-weight: 500; white-space: nowrap; transition: background 0.2s ease, transform 0.2s ease;
}
.nav-cta:hover { background: #000; transform: translateY(-1px); }
.nav-cta span { font-size: 15px; }
@media (max-width: 860px) {
  .nav { grid-template-columns: auto auto; padding: 9px 12px 9px 20px; }
  .nav-links, .nav-lang { display: none; }
}`;

const FOOTER_CSS = `footer.footer {
  border-top: 1px solid var(--line);
  padding: 68px 32px 60px; text-align: center;
}
footer.footer .footer-brand { margin-bottom: 16px; }
footer.footer .footer-brand .wordmark { font-size: 24px; }
footer.footer .footer-lead {
  font-family: var(--f-sans); font-weight: 400; font-size: 15px;
  color: var(--muted); letter-spacing: -0.01em; margin-bottom: 18px;
}
footer.footer .footer-line { font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.03em; color: var(--faint); }
footer.footer a { color: var(--muted); border-bottom: 1px solid transparent; transition: border-color 0.2s, color 0.2s; }
footer.footer a:hover { color: var(--ink); border-color: var(--line-strong); }`;

const BASE_CSS = `${ROOT_VARS}
* { box-sizing: border-box; margin: 0; padding: 0; }
em, i, cite, address, dfn { font-style: normal; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body {
  font-family: var(--f-sans); background: var(--bg); color: var(--ink);
  font-weight: 400; line-height: 1.6; -webkit-font-smoothing: antialiased;
  overflow-x: hidden; word-break: keep-all; overflow-wrap: break-word;
}
a { color: inherit; text-decoration: none; }
::selection { background: var(--ink); color: var(--bg); }
${NAV_CSS}`;

export const INDEX_CSS = `${BASE_CSS}
.hero { position: relative; padding: 168px 32px 76px; overflow: hidden; }
.hero::after {
  content: ""; position: absolute; top: -180px; right: -140px; width: 620px; height: 620px;
  background: radial-gradient(circle, var(--gold-soft) 0%, transparent 62%); pointer-events: none;
}
.hero-inner { position: relative; max-width: 1120px; margin: 0 auto; text-align: center; }
.kicker {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--gold); background: var(--gold-soft); border: 1px solid rgb(185 130 40 / 24%);
  padding: 8px 15px; border-radius: 40px; margin-bottom: 30px;
}
.kicker .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); }
.hero-title {
  font-family: var(--f-sans); font-weight: 600;
  font-size: clamp(40px, 6vw, 74px); line-height: 1.1; letter-spacing: -0.03em;
  color: var(--ink); max-width: 900px; margin: 0 auto;
}
.hero-title .line { display: block; }
.hero-title .line.italic { color: var(--gold); }
.hero-sub { margin: 26px auto 0; font-size: 18px; line-height: 1.7; color: var(--muted); max-width: 580px; }
.hero-meta-bar {
  margin-top: 52px; padding-top: 26px; border-top: 1px solid var(--line);
  display: flex; justify-content: center; gap: 46px; flex-wrap: wrap;
  font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint);
}
.hero-meta-bar strong {
  display: block; font-family: var(--f-sans); font-weight: 600; font-size: 20px;
  letter-spacing: -0.01em; text-transform: none; color: var(--ink); margin-bottom: 5px;
}
.posts-wrap { max-width: 1000px; margin: 0 auto; padding: 40px 32px 110px; }
.featured {
  display: block; padding: 40px; margin-bottom: 28px;
  background: var(--surface); border: 1px solid var(--line); border-radius: 24px;
  box-shadow: 0 1px 2px rgb(20 20 20 / 3%); transition: box-shadow 0.25s ease, transform 0.25s ease;
}
.featured:hover { box-shadow: 0 18px 44px rgb(20 20 20 / 8%); transform: translateY(-2px); }
.featured-meta {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 20px;
}
.featured-meta .badge {
  background: var(--gold); color: #fff; padding: 3px 9px; border-radius: 20px;
  font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.12em; font-weight: 500;
}
.featured-meta .cat { text-transform: uppercase; letter-spacing: 0.12em; color: var(--ink); font-weight: 500; }
.featured-meta .sep { color: var(--faint); }
.featured-title {
  font-family: var(--f-sans); font-weight: 600;
  font-size: clamp(28px, 3.8vw, 42px); line-height: 1.16; letter-spacing: -0.02em;
  color: var(--ink); margin-bottom: 18px; max-width: 780px; transition: color 0.2s;
}
.featured-title em { color: var(--ink); }
.featured:hover .featured-title { color: var(--gold); }
.featured-excerpt { font-size: 17px; line-height: 1.68; color: var(--muted); max-width: 700px; margin-bottom: 26px; }
.featured-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; padding-top: 22px; border-top: 1px solid var(--line); }
.featured-footer .author { font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.06em; color: var(--muted); }
.featured-footer .author strong { color: var(--ink); font-weight: 500; }
.featured-footer .read-more { font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); display: inline-flex; align-items: center; gap: 9px; }
.featured-footer .read-more .arrow { transition: transform 0.25s; }
.featured:hover .featured-footer .read-more .arrow { transform: translateX(5px); }
.post-list { display: flex; flex-direction: column; gap: 0; border-top: 1px solid var(--line); margin-top: 8px; }
.post-card {
  position: relative; display: grid; grid-template-columns: 64px 1fr 40px;
  align-items: center; gap: 30px; padding: 32px 8px;
  border-bottom: 1px solid var(--line); transition: background 0.22s ease, padding 0.22s ease;
}
.post-card:hover { background: var(--surface); padding-left: 20px; padding-right: 20px; border-radius: 16px; }
.post-num { font-family: var(--f-sans); font-weight: 600; font-size: 26px; color: var(--faint); line-height: 1; }
.post-card:hover .post-num { color: var(--gold); }
.post-meta { font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 9px; }
.post-meta .cat { text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink); font-weight: 500; }
.post-meta .sep { margin: 0 8px; color: var(--faint); }
.post-title {
  font-family: var(--f-sans); font-weight: 600; font-size: clamp(19px, 2.2vw, 24px);
  line-height: 1.32; letter-spacing: -0.015em; color: var(--ink); margin-bottom: 9px;
}
.post-card:hover .post-title { color: var(--gold); }
.post-excerpt { font-size: 15px; line-height: 1.6; color: var(--muted); max-width: 700px; margin-bottom: 10px; }
.post-author { font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint); }
.post-arrow { font-family: var(--f-mono); font-size: 20px; color: var(--faint); transition: color 0.25s, transform 0.25s; }
.post-card:hover .post-arrow { color: var(--gold); transform: translateX(5px); }
@media (max-width: 760px) {
  .hero { padding-top: 132px; }
  .post-card { grid-template-columns: 46px 1fr; gap: 18px; }
  .post-arrow { display: none; }
  .featured { padding: 28px 22px; }
}
.empty { padding: 80px 0; text-align: center; font-size: 20px; color: var(--muted); }
${FOOTER_CSS}
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.hero-inner > * { animation: fadeUp 0.7s var(--ease) backwards; }
.hero-inner .hero-title { animation-delay: 0.06s; }
.hero-inner .hero-sub { animation-delay: 0.14s; }
.hero-inner .hero-meta-bar { animation-delay: 0.22s; }
.featured, .post-card { animation: fadeUp 0.6s var(--ease) backwards; }
.featured { animation-delay: 0.28s; }`;

export const POST_CSS = `${BASE_CSS}
::selection { background: var(--gold); color: #fff; }
.article-wrap { max-width: 720px; margin: 0 auto; padding: 148px 24px 40px; position: relative; }
.back-link {
  display: inline-flex; align-items: center; gap: 8px; margin-bottom: 44px;
  font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--muted); transition: color 0.2s, transform 0.2s;
}
.back-link:hover { color: var(--gold); transform: translateX(-3px); }
.article-header { margin-bottom: 48px; padding-bottom: 40px; border-bottom: 1px solid var(--line); position: relative; }
.article-header::after { content: ""; position: absolute; bottom: -1px; left: 0; width: 60px; height: 2px; background: var(--gold); }
.eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--gold); margin-bottom: 24px;
}
.eyebrow::before { content: ""; display: inline-block; width: 22px; height: 1px; background: var(--gold); }
h1.article-title {
  font-family: var(--f-sans); font-weight: 600;
  font-size: clamp(32px, 5vw, 52px); line-height: 1.12; letter-spacing: -0.03em;
  margin: 0 0 22px; color: var(--ink);
}
.article-title em { color: var(--gold); }
.article-subtitle { font-size: 18px; line-height: 1.66; color: var(--muted); font-weight: 400; margin: 0 0 34px; max-width: 640px; }
.article-meta {
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.04em; color: var(--muted);
  padding-top: 22px; border-top: 1px solid var(--line);
}
.author-row { display: flex; align-items: center; gap: 12px; }
.author-avatar {
  width: 38px; height: 38px; border-radius: 50%; background: var(--ink); color: #fff;
  display: flex; align-items: center; justify-content: center; font-family: var(--f-sans); font-weight: 600; font-size: 15px;
}
.author-name { font-family: var(--f-sans); font-size: 13px; color: var(--ink); font-weight: 500; letter-spacing: 0; text-transform: none; line-height: 1.2; }
.author-title { font-size: 10px; color: var(--muted); letter-spacing: 0.04em; margin-top: 2px; }
.meta-sep { color: var(--faint); }
.toc { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 22px 26px; margin: 0 0 44px; }
.toc-title { font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; }
.toc ol { margin: 0; padding-left: 20px; color: var(--ink-soft); font-size: 14px; list-style: decimal; }
.toc ol li { margin: 8px 0; padding-left: 6px; }
.toc a { color: var(--ink-soft); transition: color 0.2s, padding-left 0.2s; display: inline-block; }
.toc a:hover { color: var(--gold); padding-left: 3px; }
article.body { font-size: 17px; line-height: 1.82; color: var(--ink-soft); }
article.body h2 {
  font-family: var(--f-sans); font-weight: 600; font-size: clamp(23px, 3vw, 30px);
  line-height: 1.24; letter-spacing: -0.02em; margin: 60px 0 18px; color: var(--ink);
}
article.body h3 { font-family: var(--f-sans); font-weight: 600; font-size: 19px; line-height: 1.4; letter-spacing: -0.01em; margin: 38px 0 14px; color: var(--ink); }
article.body p { margin: 0 0 24px; }
article.body strong { color: var(--ink); font-weight: 600; }
article.body em { color: var(--gold); }
article.body ul, article.body ol { margin: 0 0 28px; padding-left: 24px; }
article.body li { margin: 10px 0; color: var(--ink-soft); }
article.body li::marker { color: var(--faint); }
article.body blockquote {
  margin: 32px 0; padding: 20px 28px; border-left: 3px solid var(--gold);
  background: var(--surface); border-radius: 0 12px 12px 0; color: var(--ink);
  font-size: 18px; line-height: 1.6;
}
article.body a { color: var(--gold); border-bottom: 1px solid var(--line-strong); transition: border-color 0.15s, color 0.15s; }
article.body a:hover { border-bottom-color: var(--gold); }
article.body hr { border: none; border-top: 1px solid var(--line); margin: 48px 0; }
article.body img { max-width: 100%; height: auto; border-radius: 14px; margin: 32px 0; display: block; }
article.body code { font-family: var(--f-mono); font-size: 0.92em; background: var(--surface-soft); padding: 2px 8px; border-radius: 6px; border: 1px solid var(--line); color: var(--gold); }
.tags-row {
  margin-top: 60px; padding-top: 30px; border-top: 1px solid var(--line);
  font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted);
}
.tags-row .tag {
  display: inline-block; margin-right: 6px; margin-bottom: 6px; padding: 5px 13px;
  background: var(--surface); border: 1px solid var(--line); border-radius: 999px;
  color: var(--muted); transition: border-color 0.2s, color 0.2s;
}
.tags-row .tag:hover { border-color: var(--line-strong); color: var(--ink); }
.cta-card {
  margin: 76px 0 0; padding: 52px 44px; background: var(--surface);
  border: 1px solid var(--line); border-radius: 24px; text-align: center; position: relative; overflow: hidden;
  box-shadow: 0 12px 40px rgb(20 20 20 / 5%);
}
.cta-card::before { content: ""; position: absolute; top: -110px; right: -90px; width: 320px; height: 320px; background: radial-gradient(circle, var(--gold-soft) 0%, transparent 62%); pointer-events: none; }
.cta-card h2 {
  font-family: var(--f-sans); font-weight: 600; font-size: clamp(23px, 3.4vw, 30px);
  line-height: 1.24; letter-spacing: -0.02em; margin: 0 0 14px; color: var(--ink); position: relative;
}
.cta-card h2 em { color: var(--gold); }
.cta-card p { font-size: 15px; color: var(--muted); margin: 0 0 26px; line-height: 1.66; position: relative; }
.cta-card .btn {
  display: inline-flex; align-items: center; gap: 9px; position: relative;
  padding: 14px 26px; background: var(--ink); color: #fff; border-radius: 26px;
  font-size: 14px; font-weight: 500; transition: background 0.2s, transform 0.2s;
}
.cta-card .btn:hover { background: #000; transform: translateY(-2px); }
${FOOTER_CSS}
footer.footer { margin-top: 80px; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.article-header > *, .toc, article.body { animation: fadeUp 0.6s var(--ease) backwards; }
.article-header .eyebrow { animation-delay: 0.05s; }
.article-header h1 { animation-delay: 0.1s; }
.article-header .article-subtitle { animation-delay: 0.18s; }
.article-header .article-meta { animation-delay: 0.26s; }
.toc { animation-delay: 0.34s; }
article.body { animation-delay: 0.42s; }`;
