// Shared helpers + theme for the SSR blog (api/blog-index.js, api/blog-post.js,
// api/blog-sitemap.js). Lives under api/_lib so Vercel does NOT treat it as a
// serverless endpoint (underscore-prefixed paths are excluded from functions).
//
// The CSS blocks below are copied verbatim from scripts/build_blog_post.py and
// scripts/build_blog_index.py (the static hand-written posts inline the same CSS).
// Keep in sync if the editorial theme changes.

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
    footer_lead: 'Plurank — 투스텝스어헤드(주)의 독보적인 GEO 솔루션',
    empty: '곧 새 글이 올라옵니다.', read_more: '이어 읽기',
  },
  en: {
    page_title: 'Plurank Journal — GEO Insights & Case Studies',
    page_desc: 'GEO marketing insights, case studies, market trends, and product updates from Plurank. Updated weekly.',
    kicker: 'PLURANK JOURNAL',
    hero_title_a: 'How brands', hero_title_b: 'actually appear', hero_title_c: 'inside AI answers',
    hero_sub: 'Insights, case studies and findings from the Plurank team — for the AI search era. Updated weekly.',
    latest_label: 'LATEST', min_read: ' min', by: 'by',
    footer_lead: "Plurank — TwoStepsAhead Inc.'s unrivaled GEO solution",
    empty: 'New posts coming soon.', read_more: 'Read article',
  },
  ja: {
    page_title: 'Plurank Journal — GEOインサイトと事例研究',
    page_desc: 'AI検索時代のGEOマーケティング・インサイト、事例研究、市場トレンド、Plurank最新情報。毎週更新。',
    kicker: 'PLURANK JOURNAL',
    hero_title_a: 'AIの回答の中で、', hero_title_b: 'ブランドは', hero_title_c: 'どう見られているか',
    hero_sub: 'AI検索時代に向けた、Plurankチームによるインサイト・事例・発見。毎週更新。',
    latest_label: 'LATEST', min_read: '分', by: 'by',
    footer_lead: 'Plurank — TwoStepsAhead社の唯一無二のGEOソリューション',
    empty: '新しい記事をまもなく公開します。', read_more: '記事を読む',
  },
};

// Platform posts are Korean-only, so the post page only needs ko labels.
export const POST_UI_KO = {
  back_to_blog: '← Journal 전체 보기',
  reading_time_suffix: '분 읽기',
  cta_title: 'AI 답변 안의 우리 브랜드를 <em>직접 확인</em>하세요',
  cta_sub: '30분 데모로 7 AI · 12개국에서 브랜드가 어떻게 보이고 있는지 확인합니다.',
  cta_btn: '30분 데모 신청',
  footer_lead: 'Plurank — 투스텝스어헤드(주)의 독보적인 GEO 솔루션',
};

export const LANG_MAP = { ko: ['ko_KR', 'ko'], en: ['en_US', 'en'], ja: ['ja_JP', 'ja'] };

// ── Shared chrome ────────────────────────────────────────────────────────────
export function headExtras() {
  return `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<script defer src="/_vercel/insights/script.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,300;1,9..144,400&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@300;400;500&display=swap" rel="stylesheet">`;
}

/** activeLang highlights the journal/lang switcher. switchHrefs = {ko,en,ja}. */
export function navHtml({ activeLang, switchHrefs }) {
  const homeHref = activeLang === 'en' ? '/en' : activeLang === 'ja' ? '/ja' : '/';
  const journalHref = activeLang === 'en' ? '/blog/en' : activeLang === 'ja' ? '/blog/ja' : '/blog';
  const a = (l) => (l === activeLang ? ' class="active"' : '');
  return `<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="nav-brand" aria-label="Plurank home">
      <img src="/logo-wordmark.png" alt="Plurank AI Discovery AdTech" width="600" height="172">
    </a>
    <div class="nav-links">
      <a href="${homeHref}">Home</a>
      <div class="nav-menu">
        <a href="/content/insta-toon" class="nav-menu-trigger">Content</a>
        <div class="nav-dropdown" aria-label="Content services">
          <a href="/content/insta-toon"><span>Insta Toon</span><small>Instagram webtoon production</small></a>
          <a href="/content/youtube-shorts"><span>Youtube Shorts</span><small>Shorts and Reels video ads</small></a>
        </div>
      </div>
      <a href="${journalHref}" class="active">Journal</a>
    </div>
    <div class="nav-meta">
      <a href="${switchHrefs.ko}"${a('ko')}>KO</a>
      <span style="color:var(--text-faint)">·</span>
      <a href="${switchHrefs.en}"${a('en')}>EN</a>
      <span style="color:var(--text-faint)">·</span>
      <a href="${switchHrefs.ja}"${a('ja')}>JA</a>
    </div>
  </div>
</nav>`;
}

export function footerHtml(footerLead) {
  return `<footer class="footer">
  <div class="footer-lead">${footerLead}</div>
  © 2026 TwoStepsAhead Inc · <a href="mailto:glenn.kim@twostepsahead.co.kr">glenn.kim@twostepsahead.co.kr</a> · <a href="/privacy">Privacy Policy</a>
</footer>`;
}

// ── Theme CSS (verbatim from the Python builders) ────────────────────────────
const ROOT_VARS = `:root {
  --bg: #0a0a0a;
  --bg-soft: #101010;
  --surface: #161616;
  --border: rgba(255,255,255,0.08);
  --border-strong: rgba(255,255,255,0.16);
  --text: #f5f5f5;
  --text-soft: rgba(255,255,255,0.72);
  --text-mute: rgba(255,255,255,0.46);
  --text-faint: rgba(255,255,255,0.28);
  --warm: #d6d3c7;
  --warm-soft: #b8b3a3;
  --highlight: #f59e0b;
  --f-display: 'Fraunces', 'Noto Serif KR', Georgia, serif;
  --f-sans: 'Geist', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  --f-mono: 'Geist Mono', 'SF Mono', monospace;
}`;

const NAV_CSS = `.nav {
  position: sticky; top: 0; z-index: 50;
  background: rgba(10,10,10,0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border); padding: 22px 32px;
}
.nav-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.nav-brand { display: flex; align-items: center; width: 132px; }
.nav-brand img { width: 100%; height: auto; display: block; opacity: 0.95; }
.nav-links { display: flex; align-items: center; gap: 28px; font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-mute); }
.nav-links a, .nav-menu-trigger { transition: color 0.2s; }
.nav-links a:hover, .nav-links a.active, .nav-menu:hover .nav-menu-trigger { color: var(--text); }
.nav-menu { position: relative; display: inline-flex; align-items: center; padding: 8px 0; }
.nav-dropdown {
  position: absolute; left: -18px; top: calc(100% + 8px); width: 238px; padding: 10px;
  background: rgba(18,18,18,0.96); border: 1px solid var(--border); border-radius: 8px;
  box-shadow: 0 24px 70px rgba(0,0,0,0.38); opacity: 0; visibility: hidden; transform: translateY(6px);
  transition: opacity 0.18s, transform 0.18s, visibility 0.18s;
}
.nav-menu:hover .nav-dropdown, .nav-menu:focus-within .nav-dropdown { opacity: 1; visibility: visible; transform: translateY(0); }
.nav-dropdown a { display: grid; gap: 2px; padding: 12px; border-radius: 6px; letter-spacing: 0; text-transform: none; }
.nav-dropdown a:hover { background: rgba(255,255,255,0.06); }
.nav-dropdown span { font-family: var(--f-sans); font-size: 14px; font-weight: 700; color: var(--text); }
.nav-dropdown small { font-family: var(--f-sans); font-size: 12px; color: var(--text-mute); }
.nav-meta { display: flex; align-items: center; gap: 14px; font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.1em; color: var(--text-mute); }
.nav-meta a { transition: color 0.2s; }
.nav-meta a.active { color: var(--text); }
.nav-meta a:hover { color: var(--text); }
@media (max-width: 900px) { .nav-links { display: none; } }`;

const FOOTER_CSS = `footer.footer {
  padding: 72px 32px 56px; text-align: center;
  border-top: 1px solid var(--border);
  font-family: var(--f-mono); font-size: 11px;
  letter-spacing: 0.06em; color: var(--text-faint);
}
footer.footer .footer-lead {
  font-family: var(--f-display); font-weight: 300; font-style: italic;
  font-size: 16px; color: var(--text-soft); letter-spacing: -0.01em;
  margin-bottom: 14px; font-variation-settings: "opsz" 60;
}
footer.footer a { color: var(--text-mute); border-bottom: 1px solid transparent; transition: border-color 0.2s, color 0.2s; }
footer.footer a:hover { color: var(--text); border-color: var(--text-mute); }`;

export const INDEX_CSS = `${ROOT_VARS}
* { box-sizing: border-box; margin: 0; padding: 0; }
em, i, cite, address, dfn { font-style: normal; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--f-sans); background: var(--bg); color: var(--text);
  font-weight: 400; line-height: 1.6; -webkit-font-smoothing: antialiased;
  overflow-x: hidden; font-feature-settings: "ss01", "cv11";
}
a { color: inherit; text-decoration: none; }
::selection { background: var(--text); color: var(--bg); }
${NAV_CSS}
.hero { position: relative; padding: 140px 32px 110px; border-bottom: 1px solid var(--border); overflow: hidden; }
.hero::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%);
}
.hero::after {
  content: ""; position: absolute;
  top: -160px; right: -120px; width: 620px; height: 620px;
  background: radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 60%);
  pointer-events: none;
}
.hero-inner { position: relative; max-width: 1200px; margin: 0 auto; }
.kicker {
  display: inline-flex; align-items: center; gap: 12px;
  font-family: var(--f-mono); font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--text-mute); margin-bottom: 36px;
}
.kicker::before { content: ""; display: inline-block; width: 28px; height: 1px; background: var(--warm); }
.kicker .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--highlight); box-shadow: 0 0 14px rgba(245,158,11,0.6); animation: pulse 2.4s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.hero-title {
  font-family: var(--f-display); font-weight: 300;
  font-size: clamp(48px, 7.5vw, 96px);
  line-height: 1.02; letter-spacing: -0.028em;
  font-variation-settings: "opsz" 144;
  color: var(--text); max-width: 1080px;
}
.hero-title .line { display: block; }
.hero-title .line.italic { font-style: italic; font-weight: 400; color: var(--warm); font-variation-settings: "opsz" 144; }
.hero-sub { margin-top: 36px; font-family: var(--f-sans); font-size: 18px; line-height: 1.7; color: var(--text-soft); max-width: 580px; }
.hero-meta-bar {
  margin-top: 64px; padding-top: 22px;
  border-top: 1px solid var(--border);
  display: flex; gap: 48px; flex-wrap: wrap;
  font-family: var(--f-mono); font-size: 11px;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--text-mute);
}
.hero-meta-bar strong {
  display: block;
  font-family: var(--f-display); font-weight: 400;
  font-size: 22px; letter-spacing: -0.015em;
  text-transform: none; color: var(--text); margin-bottom: 4px;
  font-variation-settings: "opsz" 60;
}
.posts-wrap { max-width: 1200px; margin: 0 auto; padding: 88px 32px 120px; }
.featured { display: block; padding: 56px 0 64px; border-bottom: 1px solid var(--border); transition: padding 0.3s ease; }
.featured-meta {
  display: flex; align-items: center; gap: 14px;
  font-family: var(--f-mono); font-size: 11px;
  letter-spacing: 0.08em; color: var(--text-mute);
  margin-bottom: 22px; flex-wrap: wrap;
}
.featured-meta .badge {
  background: var(--highlight); color: #0a0a0a;
  padding: 3px 9px; border-radius: 3px;
  font-family: var(--f-mono); font-size: 10px;
  letter-spacing: 0.16em; font-weight: 500;
}
.featured-meta .cat { text-transform: uppercase; letter-spacing: 0.16em; color: var(--text); font-weight: 500; }
.featured-meta .sep { color: var(--text-faint); }
.featured-title {
  font-family: var(--f-display); font-weight: 300;
  font-size: clamp(34px, 5vw, 62px);
  line-height: 1.08; letter-spacing: -0.022em;
  font-variation-settings: "opsz" 144;
  color: var(--text); margin-bottom: 24px; max-width: 1080px;
  transition: color 0.2s;
}
.featured-title em { font-style: italic; font-weight: 300; color: var(--text); font-variation-settings: "opsz" 144; }
.featured:hover .featured-title em { color: var(--warm); }
.featured-excerpt { font-family: var(--f-sans); font-size: 17px; line-height: 1.7; color: var(--text-soft); max-width: 720px; margin-bottom: 32px; }
.featured-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; padding-top: 22px; border-top: 1px solid var(--border); }
.featured-footer .author { font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.08em; color: var(--text-mute); }
.featured-footer .author strong { color: var(--text); font-weight: 500; }
.featured-footer .read-more { font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text); display: inline-flex; align-items: center; gap: 10px; }
.featured-footer .read-more .arrow { transition: transform 0.25s; }
.featured:hover .featured-footer .read-more .arrow { transform: translateX(6px); }
.post-list { display: flex; flex-direction: column; }
.post-card {
  position: relative;
  display: grid; grid-template-columns: 80px 1fr 60px;
  align-items: center; gap: 36px;
  padding: 36px 0;
  border-bottom: 1px solid var(--border);
  transition: padding 0.25s ease, background 0.25s ease;
}
.post-card:hover { padding-left: 16px; padding-right: 16px; background: linear-gradient(90deg, rgba(255,255,255,0.015), transparent 60%); }
.post-card:last-child { border-bottom: none; }
.post-num { font-family: var(--f-display); font-style: italic; font-weight: 300; font-size: 38px; color: var(--text-mute); font-variation-settings: "opsz" 96; line-height: 1; }
.post-card:hover .post-num { color: var(--warm); }
.post-meta { font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.08em; color: var(--text-mute); margin-bottom: 10px; }
.post-meta .cat { text-transform: uppercase; letter-spacing: 0.14em; color: var(--text); font-weight: 500; }
.post-meta .sep { margin: 0 8px; color: var(--text-faint); }
.post-title {
  font-family: var(--f-display); font-weight: 400;
  font-size: clamp(22px, 2.4vw, 28px); line-height: 1.28;
  letter-spacing: -0.014em; color: var(--text);
  margin-bottom: 10px; font-variation-settings: "opsz" 96;
}
.post-card:hover .post-title { color: var(--warm); }
.post-excerpt { font-family: var(--f-sans); font-size: 15px; line-height: 1.6; color: var(--text-soft); max-width: 720px; margin-bottom: 12px; }
.post-author { font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-mute); }
.post-arrow { font-family: var(--f-mono); font-size: 22px; color: var(--text-mute); transition: color 0.25s, transform 0.25s; }
.post-card:hover .post-arrow { color: var(--text); transform: translateX(6px); }
@media (max-width: 760px) {
  .post-card { grid-template-columns: 56px 1fr; gap: 20px; }
  .post-arrow { display: none; }
  .post-num { font-size: 28px; }
}
.empty { padding: 80px 0; text-align: center; font-family: var(--f-display); font-style: italic; font-weight: 300; font-size: 26px; color: var(--text-mute); }
${FOOTER_CSS}
@keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
.hero-inner > * { animation: fadeUp 0.7s ease-out backwards; }
.hero-inner .kicker { animation-delay: 0s; }
.hero-inner .hero-title { animation-delay: 0.08s; }
.hero-inner .hero-sub { animation-delay: 0.18s; }
.hero-inner .hero-meta-bar { animation-delay: 0.28s; }
.featured, .post-card { animation: fadeUp 0.6s ease-out backwards; }
.featured { animation-delay: 0.36s; }`;

export const POST_CSS = `${ROOT_VARS}
* { box-sizing: border-box; margin: 0; padding: 0; }
em, i, cite, address, dfn { font-style: normal; }
body {
  font-family: var(--f-sans); background: var(--bg); color: var(--text);
  font-weight: 400; line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  word-break: keep-all; overflow-wrap: break-word;
  font-feature-settings: "ss01", "cv11";
}
a { color: inherit; text-decoration: none; }
::selection { background: var(--warm); color: var(--bg); }
${NAV_CSS}
.article-wrap { max-width: 760px; margin: 0 auto; padding: 80px 24px 80px; position: relative; }
.back-link {
  display: inline-flex; align-items: center; gap: 8px; margin-bottom: 56px;
  font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--text-mute); transition: color 0.2s, transform 0.2s;
}
.back-link:hover { color: var(--text); transform: translateX(-3px); }
.article-header { margin-bottom: 56px; padding-bottom: 44px; border-bottom: 1px solid var(--border); position: relative; }
.article-header::after { content: ""; position: absolute; bottom: -1px; left: 0; width: 64px; height: 1px; background: var(--warm); }
.eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--text-mute); margin-bottom: 28px;
}
.eyebrow::before { content: ""; display: inline-block; width: 24px; height: 1px; background: var(--warm); }
h1.article-title {
  font-family: var(--f-display); font-weight: 300;
  font-size: clamp(34px, 5.4vw, 60px); line-height: 1.06; letter-spacing: -0.026em;
  font-variation-settings: "opsz" 144; margin: 0 0 24px; color: var(--text);
}
.article-title em { font-style: italic; font-weight: 400; color: var(--warm); font-variation-settings: "opsz" 144; }
.article-subtitle {
  font-family: var(--f-sans); font-size: 18px; line-height: 1.65;
  color: var(--text-soft); font-weight: 400; margin: 0 0 36px; max-width: 660px;
}
.article-meta {
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.06em; color: var(--text-mute);
  padding-top: 22px; border-top: 1px solid var(--border);
}
.author-row { display: flex; align-items: center; gap: 12px; }
.author-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--warm); color: var(--bg);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--f-display); font-weight: 400; font-size: 15px; font-variation-settings: "opsz" 60;
}
.author-name { font-family: var(--f-sans); font-size: 13px; color: var(--text); font-weight: 500; letter-spacing: 0; text-transform: none; line-height: 1.2; }
.author-title { font-size: 10px; color: var(--text-mute); letter-spacing: 0.06em; margin-top: 2px; }
.meta-sep { color: var(--text-faint); }
.toc { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 22px 26px; margin: 0 0 48px; }
.toc-title { font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-mute); margin-bottom: 14px; }
.toc ol { margin: 0; padding-left: 22px; color: var(--text-soft); font-size: 14px; list-style: decimal; counter-reset: toc; }
.toc ol li { margin: 8px 0; padding-left: 6px; }
.toc a { color: var(--text-soft); transition: color 0.2s, padding-left 0.2s; display: inline-block; }
.toc a:hover { color: var(--warm); padding-left: 4px; }
article.body { font-family: var(--f-sans); font-size: 17px; line-height: 1.82; color: var(--text-soft); }
article.body h2 {
  font-family: var(--f-display); font-weight: 400;
  font-size: clamp(24px, 3vw, 32px); line-height: 1.22; letter-spacing: -0.015em;
  font-variation-settings: "opsz" 96; margin: 64px 0 20px; color: var(--text);
}
article.body h3 { font-family: var(--f-sans); font-weight: 500; font-size: 19px; line-height: 1.4; letter-spacing: -0.005em; margin: 40px 0 14px; color: var(--text); }
article.body p { margin: 0 0 24px; }
article.body strong { color: var(--text); font-weight: 500; }
article.body em { color: var(--warm); font-style: italic; }
article.body ul, article.body ol { margin: 0 0 28px; padding-left: 24px; }
article.body li { margin: 10px 0; color: var(--text-soft); }
article.body li::marker { color: var(--text-mute); }
article.body blockquote {
  margin: 32px 0; padding: 20px 28px;
  border-left: 2px solid var(--warm); background: var(--surface);
  color: var(--text); font-family: var(--f-display); font-style: italic; font-weight: 300;
  font-size: 19px; line-height: 1.55; font-variation-settings: "opsz" 96; border-radius: 2px;
}
article.body a { color: var(--warm); border-bottom: 1px solid var(--border-strong); transition: border-color 0.15s, color 0.15s; }
article.body a:hover { border-bottom-color: var(--warm); color: var(--text); }
article.body hr { border: none; border-top: 1px solid var(--border); margin: 48px 0; }
article.body img { max-width: 100%; height: auto; border-radius: 4px; margin: 32px 0; display: block; }
article.body code { font-family: var(--f-mono); font-size: 0.92em; background: var(--surface); padding: 2px 8px; border-radius: 3px; border: 1px solid var(--border); color: var(--warm); }
.tags-row {
  margin-top: 64px; padding-top: 32px; border-top: 1px solid var(--border);
  font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-mute);
}
.tags-row .tag {
  display: inline-block; margin-right: 6px; margin-bottom: 6px;
  padding: 5px 12px; background: var(--surface); border: 1px solid var(--border);
  border-radius: 999px; color: var(--text-soft); transition: border-color 0.2s, color 0.2s;
}
.tags-row .tag:hover { border-color: var(--border-strong); color: var(--text); }
.cta-card {
  margin: 80px 0 0; padding: 56px 44px;
  background: linear-gradient(135deg, var(--surface) 0%, var(--bg-soft) 100%);
  border: 1px solid var(--border); border-radius: 4px;
  text-align: center; position: relative; overflow: hidden;
}
.cta-card::before { content: ""; position: absolute; top: -100px; right: -100px; width: 320px; height: 320px; background: radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 60%); pointer-events: none; }
.cta-card h2 {
  font-family: var(--f-display); font-weight: 300;
  font-size: clamp(24px, 3.4vw, 32px); line-height: 1.22; letter-spacing: -0.015em;
  font-variation-settings: "opsz" 96; margin: 0 0 14px; color: var(--text); position: relative;
}
.cta-card h2 em { font-style: italic; color: var(--warm); }
.cta-card p { font-size: 15px; color: var(--text-soft); margin: 0 0 28px; line-height: 1.65; position: relative; }
.cta-card .btn {
  display: inline-flex; align-items: center; gap: 10px; position: relative;
  padding: 14px 28px; background: var(--warm); color: var(--bg);
  border-radius: 999px; font-family: var(--f-mono); font-size: 12px; font-weight: 500;
  letter-spacing: 0.08em; text-transform: uppercase;
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 0 0 0 rgba(214,211,199,0);
}
.cta-card .btn:hover { background: var(--text); transform: translateY(-2px); box-shadow: 0 12px 30px rgba(245,245,245,0.10); }
${FOOTER_CSS}
footer.footer { margin-top: 80px; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.article-header > *, .toc, article.body { animation: fadeUp 0.6s ease-out backwards; }
.article-header .eyebrow { animation-delay: 0.05s; }
.article-header h1 { animation-delay: 0.1s; }
.article-header .article-subtitle { animation-delay: 0.18s; }
.article-header .article-meta { animation-delay: 0.26s; }
.toc { animation-delay: 0.34s; }
article.body { animation-delay: 0.42s; }`;
