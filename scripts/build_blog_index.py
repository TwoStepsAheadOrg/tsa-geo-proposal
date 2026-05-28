#!/usr/bin/env python3
"""Build /blog/, /blog/en, /blog/ja index pages — Plurank editorial dark theme."""
import json
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "posts"
BLOG_DIR = ROOT / "blog"
SITE_URL = "https://www.plurank.com"

UI = {
    "ko": {
        "page_title": "Plurank Journal — GEO 인사이트와 케이스 스터디",
        "page_desc": "AI 검색 시대 GEO 마케팅 인사이트, 케이스 스터디, 시장 트렌드, Plurank 소식. 매주 갱신.",
        "kicker": "PLURANK JOURNAL",
        "hero_title_a": "AI 답변 안에서",
        "hero_title_b": "브랜드가 어떻게",
        "hero_title_c": "보이고 있는가",
        "hero_sub": "AI 검색 시대 GEO 마케팅 인사이트, 케이스 스터디, 그리고 Plurank 팀의 발견. 매주 갱신.",
        "filter_all": "All",
        "latest_label": "LATEST",
        "post_label": "POST",
        "min_read": "분",
        "by": "by",
        "footer_lead": "Plurank — 투스텝스어헤드(주)의 독보적인 GEO 솔루션",
        "empty": "곧 새 글이 올라옵니다.",
        "read_more": "이어 읽기",
    },
    "en": {
        "page_title": "Plurank Journal — GEO Insights & Case Studies",
        "page_desc": "GEO marketing insights, case studies, market trends, and product updates from Plurank. Updated weekly.",
        "kicker": "PLURANK JOURNAL",
        "hero_title_a": "How brands",
        "hero_title_b": "actually appear",
        "hero_title_c": "inside AI answers",
        "hero_sub": "Insights, case studies and findings from the Plurank team — for the AI search era. Updated weekly.",
        "filter_all": "All",
        "latest_label": "LATEST",
        "post_label": "POST",
        "min_read": " min",
        "by": "by",
        "footer_lead": "Plurank — TwoStepsAhead Inc.'s unrivaled GEO solution",
        "empty": "New posts coming soon.",
        "read_more": "Read article",
    },
    "ja": {
        "page_title": "Plurank Journal — GEOインサイトと事例研究",
        "page_desc": "AI検索時代のGEOマーケティング・インサイト、事例研究、市場トレンド、Plurank最新情報。毎週更新。",
        "kicker": "PLURANK JOURNAL",
        "hero_title_a": "AIの回答の中で、",
        "hero_title_b": "ブランドは",
        "hero_title_c": "どう見られているか",
        "hero_sub": "AI検索時代に向けた、Plurankチームによるインサイト・事例・発見。毎週更新。",
        "filter_all": "All",
        "latest_label": "LATEST",
        "post_label": "POST",
        "min_read": "分",
        "by": "by",
        "footer_lead": "Plurank — TwoStepsAhead社の唯一無二のGEOソリューション",
        "empty": "新しい記事をまもなく公開します。",
        "read_more": "記事を読む",
    },
}

LANG_MAP = {"ko": ("ko_KR", "ko"), "en": ("en_US", "en"), "ja": ("ja_JP", "ja")}


def collect_posts():
    posts = []
    for d in POSTS_DIR.iterdir():
        if not d.is_dir():
            continue
        meta_path = d / "meta.json"
        if not meta_path.exists():
            continue
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        posts.append(meta)
    posts.sort(key=lambda m: m.get("date", ""), reverse=True)
    return posts


def render_featured(meta, lang, ui):
    slug = meta["slug"]
    url = f"/blog/{slug}/" if lang == "ko" else f"/blog/{slug}/{lang}"
    title = meta[f"title_{lang}"]
    desc = meta[f"description_{lang}"]
    category = meta.get(f"category_{lang}", meta["category"])
    date = meta["date"]
    reading = meta["reading_time"]
    author = meta["author"][f"name_{lang}"]
    return f'''
<a href="{url}" class="featured">
  <div class="featured-meta">
    <span class="badge">{ui["latest_label"]}</span>
    <span class="cat">{escape(category)}</span>
    <span class="sep">·</span>
    <span class="date">{date}</span>
    <span class="sep">·</span>
    <span>{reading}{ui["min_read"]}</span>
  </div>
  <h2 class="featured-title"><em>{escape(title)}</em></h2>
  <p class="featured-excerpt">{escape(desc)}</p>
  <div class="featured-footer">
    <span class="author">{ui["by"]} <strong>{escape(author)}</strong></span>
    <span class="read-more">{ui["read_more"]} <span class="arrow">→</span></span>
  </div>
</a>
'''


def render_card(meta, lang, ui, idx):
    slug = meta["slug"]
    url = f"/blog/{slug}/" if lang == "ko" else f"/blog/{slug}/{lang}"
    title = meta[f"title_{lang}"]
    desc = meta[f"description_{lang}"]
    category = meta.get(f"category_{lang}", meta["category"])
    date = meta["date"]
    reading = meta["reading_time"]
    author = meta["author"][f"name_{lang}"]
    num = f"{idx:02d}"
    return f'''
<a href="{url}" class="post-card">
  <div class="post-num">{num}</div>
  <div class="post-body">
    <div class="post-meta">
      <span class="cat">{escape(category)}</span>
      <span class="sep">·</span>
      <span>{date}</span>
      <span class="sep">·</span>
      <span>{reading}{ui["min_read"]}</span>
    </div>
    <h3 class="post-title">{escape(title)}</h3>
    <p class="post-excerpt">{escape(desc)}</p>
    <div class="post-author">{ui["by"]} {escape(author)}</div>
  </div>
  <div class="post-arrow">→</div>
</a>
'''


def render_index(lang, posts):
    ui = UI[lang]
    og_locale, html_lang = LANG_MAP[lang]
    canonical = f"{SITE_URL}/blog/" if lang == "ko" else f"{SITE_URL}/blog/{lang}"

    if posts:
        featured = render_featured(posts[0], lang, ui)
        rest_cards = "\n".join(render_card(p, lang, ui, i + 2) for i, p in enumerate(posts[1:]))
        body_section = featured + (
            f'<div class="post-list">{rest_cards}</div>' if posts[1:] else ""
        )
    else:
        body_section = f'<div class="empty">{ui["empty"]}</div>'

    href_ko = f"{SITE_URL}/blog/"
    href_en = f"{SITE_URL}/blog/en"
    href_ja = f"{SITE_URL}/blog/ja"

    blog_jsonld = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Plurank Journal",
        "url": canonical,
        "inLanguage": html_lang,
        "publisher": {"@type": "Organization", "name": "Plurank", "url": SITE_URL},
        "blogPost": [
            {
                "@type": "BlogPosting",
                "headline": p[f"title_{lang}"],
                "description": p[f"description_{lang}"],
                "url": f"{SITE_URL}/blog/{p['slug']}/" if lang == "ko" else f"{SITE_URL}/blog/{p['slug']}/{lang}",
                "datePublished": p["date"],
                "author": {"@type": "Person", "name": p["author"][f"name_{lang}"]},
            }
            for p in posts
        ],
    }

    return f"""<!DOCTYPE html>
<html lang="{html_lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{escape(ui["page_title"])}</title>
<meta name="description" content="{escape(ui["page_desc"])}">
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
<meta name="theme-color" content="#0a0a0a">
<link rel="canonical" href="{canonical}">
<link rel="alternate" hreflang="ko" href="{href_ko}">
<link rel="alternate" hreflang="en" href="{href_en}">
<link rel="alternate" hreflang="ja" href="{href_ja}">
<link rel="alternate" hreflang="x-default" href="{href_ko}">
<meta property="og:type" content="website">
<meta property="og:title" content="{escape(ui["page_title"])}">
<meta property="og:description" content="{escape(ui["page_desc"])}">
<meta property="og:url" content="{canonical}">
<meta property="og:site_name" content="Plurank">
<meta property="og:locale" content="{og_locale}">
<meta property="og:image" content="{SITE_URL}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="{escape(ui['page_title'])}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{escape(ui["page_title"])}">
<meta name="twitter:description" content="{escape(ui["page_desc"])}">
<meta name="twitter:image" content="{SITE_URL}/og-image.png">

<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">

<script type="application/ld+json">{json.dumps(blog_jsonld, ensure_ascii=False)}</script>
<script defer src="/_vercel/insights/script.js"></script>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,300;1,9..144,400&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@300;400;500&display=swap" rel="stylesheet">

<style>
:root {{
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
}}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
em, i, cite, address, dfn {{ font-style: normal; }}
html {{ scroll-behavior: smooth; }}
body {{
  font-family: var(--f-sans); background: var(--bg); color: var(--text);
  font-weight: 400; line-height: 1.6; -webkit-font-smoothing: antialiased;
  overflow-x: hidden; font-feature-settings: "ss01", "cv11";
}}
a {{ color: inherit; text-decoration: none; }}
::selection {{ background: var(--text); color: var(--bg); }}

/* ===== NAV (same as main site) ===== */
.nav {{
  position: sticky; top: 0; z-index: 50;
  background: rgba(10,10,10,0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border); padding: 22px 32px;
}}
.nav-inner {{ max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; }}
.nav-brand {{ display: flex; align-items: center; width: 132px; }}
.nav-brand img {{ width: 100%; height: auto; display: block; opacity: 0.95; }}
.nav-links {{ display: flex; gap: 28px; font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-mute); }}
.nav-links a {{ transition: color 0.2s; }}
.nav-links a:hover, .nav-links a.active {{ color: var(--text); }}
.nav-meta {{ display: flex; align-items: center; gap: 14px; font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.1em; color: var(--text-mute); }}
.nav-meta a {{ transition: color 0.2s; }}
.nav-meta a.active {{ color: var(--text); }}
.nav-meta a:hover {{ color: var(--text); }}
@media (max-width: 900px) {{ .nav-links {{ display: none; }} }}

/* ===== HERO ===== */
.hero {{
  position: relative; padding: 140px 32px 110px;
  border-bottom: 1px solid var(--border);
  overflow: hidden;
}}
/* subtle grid */
.hero::before {{
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%);
}}
/* warm spot */
.hero::after {{
  content: ""; position: absolute;
  top: -160px; right: -120px; width: 620px; height: 620px;
  background: radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 60%);
  pointer-events: none;
}}
.hero-inner {{ position: relative; max-width: 1200px; margin: 0 auto; }}

.kicker {{
  display: inline-flex; align-items: center; gap: 12px;
  font-family: var(--f-mono); font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--text-mute); margin-bottom: 36px;
}}
.kicker::before {{ content: ""; display: inline-block; width: 28px; height: 1px; background: var(--warm); }}
.kicker .dot {{ width: 6px; height: 6px; border-radius: 50%; background: var(--highlight); box-shadow: 0 0 14px rgba(245,158,11,0.6); animation: pulse 2.4s ease-in-out infinite; }}
@keyframes pulse {{ 0%, 100% {{ opacity: 1; }} 50% {{ opacity: 0.5; }} }}

.hero-title {{
  font-family: var(--f-display); font-weight: 300;
  font-size: clamp(48px, 7.5vw, 96px);
  line-height: 1.02; letter-spacing: -0.028em;
  font-variation-settings: "opsz" 144;
  color: var(--text); max-width: 1080px;
}}
.hero-title .line {{ display: block; }}
.hero-title .line.italic {{ font-style: italic; font-weight: 400; color: var(--warm); font-variation-settings: "opsz" 144; }}

.hero-sub {{
  margin-top: 36px; font-family: var(--f-sans); font-size: 18px;
  line-height: 1.7; color: var(--text-soft); max-width: 580px;
}}

.hero-meta-bar {{
  margin-top: 64px; padding-top: 22px;
  border-top: 1px solid var(--border);
  display: flex; gap: 48px; flex-wrap: wrap;
  font-family: var(--f-mono); font-size: 11px;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--text-mute);
}}
.hero-meta-bar strong {{
  display: block;
  font-family: var(--f-display); font-weight: 400;
  font-size: 22px; letter-spacing: -0.015em;
  text-transform: none; color: var(--text); margin-bottom: 4px;
  font-variation-settings: "opsz" 60;
}}

/* ===== POSTS LAYOUT ===== */
.posts-wrap {{
  max-width: 1200px; margin: 0 auto; padding: 88px 32px 120px;
}}

/* Featured post */
.featured {{
  display: block; padding: 56px 0 64px;
  border-bottom: 1px solid var(--border);
  transition: padding 0.3s ease;
}}
.featured-meta {{
  display: flex; align-items: center; gap: 14px;
  font-family: var(--f-mono); font-size: 11px;
  letter-spacing: 0.08em; color: var(--text-mute);
  margin-bottom: 22px; flex-wrap: wrap;
}}
.featured-meta .badge {{
  background: var(--highlight); color: #0a0a0a;
  padding: 3px 9px; border-radius: 3px;
  font-family: var(--f-mono); font-size: 10px;
  letter-spacing: 0.16em; font-weight: 500;
}}
.featured-meta .cat {{ text-transform: uppercase; letter-spacing: 0.16em; color: var(--text); font-weight: 500; }}
.featured-meta .sep {{ color: var(--text-faint); }}

.featured-title {{
  font-family: var(--f-display); font-weight: 300;
  font-size: clamp(34px, 5vw, 62px);
  line-height: 1.08; letter-spacing: -0.022em;
  font-variation-settings: "opsz" 144;
  color: var(--text); margin-bottom: 24px; max-width: 1080px;
  transition: color 0.2s;
}}
.featured-title em {{
  font-style: italic; font-weight: 300;
  color: var(--text); font-variation-settings: "opsz" 144;
}}
.featured:hover .featured-title em {{ color: var(--warm); }}

.featured-excerpt {{
  font-family: var(--f-sans); font-size: 17px; line-height: 1.7;
  color: var(--text-soft); max-width: 720px; margin-bottom: 32px;
}}
.featured-footer {{
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 16px;
  padding-top: 22px; border-top: 1px solid var(--border);
}}
.featured-footer .author {{
  font-family: var(--f-mono); font-size: 11px;
  letter-spacing: 0.08em; color: var(--text-mute);
}}
.featured-footer .author strong {{ color: var(--text); font-weight: 500; }}
.featured-footer .read-more {{
  font-family: var(--f-mono); font-size: 11px;
  letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--text); display: inline-flex; align-items: center; gap: 10px;
}}
.featured-footer .read-more .arrow {{ transition: transform 0.25s; }}
.featured:hover .featured-footer .read-more .arrow {{ transform: translateX(6px); }}

/* Post list */
.post-list {{
  display: flex; flex-direction: column;
}}
.post-card {{
  position: relative;
  display: grid; grid-template-columns: 80px 1fr 60px;
  align-items: center; gap: 36px;
  padding: 36px 0;
  border-bottom: 1px solid var(--border);
  transition: padding 0.25s ease, background 0.25s ease;
}}
.post-card:hover {{ padding-left: 16px; padding-right: 16px; background: linear-gradient(90deg, rgba(255,255,255,0.015), transparent 60%); }}
.post-card:last-child {{ border-bottom: none; }}

.post-num {{
  font-family: var(--f-display); font-style: italic; font-weight: 300;
  font-size: 38px; color: var(--text-mute);
  font-variation-settings: "opsz" 96;
  line-height: 1;
}}
.post-card:hover .post-num {{ color: var(--warm); }}

.post-meta {{
  font-family: var(--f-mono); font-size: 11px;
  letter-spacing: 0.08em; color: var(--text-mute);
  margin-bottom: 10px;
}}
.post-meta .cat {{ text-transform: uppercase; letter-spacing: 0.14em; color: var(--text); font-weight: 500; }}
.post-meta .sep {{ margin: 0 8px; color: var(--text-faint); }}

.post-title {{
  font-family: var(--f-display); font-weight: 400;
  font-size: clamp(22px, 2.4vw, 28px); line-height: 1.28;
  letter-spacing: -0.014em; color: var(--text);
  margin-bottom: 10px; font-variation-settings: "opsz" 96;
}}
.post-card:hover .post-title {{ color: var(--warm); }}

.post-excerpt {{
  font-family: var(--f-sans); font-size: 15px; line-height: 1.6;
  color: var(--text-soft); max-width: 720px; margin-bottom: 12px;
}}
.post-author {{
  font-family: var(--f-mono); font-size: 10px;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--text-mute);
}}
.post-arrow {{
  font-family: var(--f-mono); font-size: 22px;
  color: var(--text-mute);
  transition: color 0.25s, transform 0.25s;
}}
.post-card:hover .post-arrow {{ color: var(--text); transform: translateX(6px); }}

@media (max-width: 760px) {{
  .post-card {{ grid-template-columns: 56px 1fr; gap: 20px; }}
  .post-arrow {{ display: none; }}
  .post-num {{ font-size: 28px; }}
}}

/* Empty state */
.empty {{
  padding: 80px 0; text-align: center;
  font-family: var(--f-display); font-style: italic; font-weight: 300;
  font-size: 26px; color: var(--text-mute);
}}

/* ===== FOOTER ===== */
footer.footer {{
  padding: 72px 32px 56px; text-align: center;
  border-top: 1px solid var(--border);
  font-family: var(--f-mono); font-size: 11px;
  letter-spacing: 0.06em; color: var(--text-faint);
}}
footer.footer .footer-lead {{
  font-family: var(--f-display); font-weight: 300; font-style: italic;
  font-size: 16px; color: var(--text-soft); letter-spacing: -0.01em;
  margin-bottom: 14px; font-variation-settings: "opsz" 60;
}}
footer.footer a {{ color: var(--text-mute); border-bottom: 1px solid transparent; transition: border-color 0.2s, color 0.2s; }}
footer.footer a:hover {{ color: var(--text); border-color: var(--text-mute); }}

/* Reveal animation */
@keyframes fadeUp {{
  from {{ opacity: 0; transform: translateY(18px); }}
  to   {{ opacity: 1; transform: translateY(0); }}
}}
.hero-inner > * {{ animation: fadeUp 0.7s ease-out backwards; }}
.hero-inner .kicker {{ animation-delay: 0s; }}
.hero-inner .hero-title {{ animation-delay: 0.08s; }}
.hero-inner .hero-sub {{ animation-delay: 0.18s; }}
.hero-inner .hero-meta-bar {{ animation-delay: 0.28s; }}
.featured, .post-card {{ animation: fadeUp 0.6s ease-out backwards; }}
.featured {{ animation-delay: 0.36s; }}
.post-card:nth-child(1) {{ animation-delay: 0.42s; }}
.post-card:nth-child(2) {{ animation-delay: 0.48s; }}
.post-card:nth-child(3) {{ animation-delay: 0.54s; }}
.post-card:nth-child(4) {{ animation-delay: 0.60s; }}
</style>
</head>
<body>

<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="nav-brand" aria-label="Plurank home">
      <img src="/logo-wordmark.png" alt="Plurank AI Discovery AdTech" width="600" height="172">
    </a>
    <div class="nav-links">
      <a href="/{('en' if lang=='en' else ('ja' if lang=='ja' else ''))}">Home</a>
      <a href="/blog/{('en' if lang=='en' else ('ja' if lang=='ja' else ''))}" class="active">Journal</a>
    </div>
    <div class="nav-meta">
      <a href="{href_ko}" class="{'active' if lang=='ko' else ''}">KO</a>
      <span style="color:var(--text-faint)">·</span>
      <a href="{href_en}" class="{'active' if lang=='en' else ''}">EN</a>
      <span style="color:var(--text-faint)">·</span>
      <a href="{href_ja}" class="{'active' if lang=='ja' else ''}">JA</a>
    </div>
  </div>
</nav>

<section class="hero">
  <div class="hero-inner">
    <div class="kicker">
      <span class="dot"></span>
      {ui["kicker"]} · {len(posts):02d} {"POSTS" if len(posts) != 1 else "POST"}
    </div>
    <h1 class="hero-title">
      <span class="line">{escape(ui["hero_title_a"])}</span>
      <span class="line italic">{escape(ui["hero_title_b"])}</span>
      <span class="line">{escape(ui["hero_title_c"])}</span>
    </h1>
    <p class="hero-sub">{escape(ui["hero_sub"])}</p>
    <div class="hero-meta-bar">
      <div>{ui["latest_label"]}<strong>{posts[0]["date"] if posts else "—"}</strong></div>
      <div>POSTS<strong>{len(posts):02d}</strong></div>
      <div>LANGUAGES<strong>KO · EN · JA</strong></div>
      <div>FOCUS<strong>GEO · AI Search</strong></div>
    </div>
  </div>
</section>

<section class="posts-wrap">
{body_section}
</section>

<footer class="footer">
  <div class="footer-lead">{ui["footer_lead"]}</div>
  © 2026 TwoStepsAhead Inc · <a href="mailto:glenn.kim@twostepsahead.co.kr">glenn.kim@twostepsahead.co.kr</a>
</footer>

</body>
</html>
"""


def main():
    posts = collect_posts()
    BLOG_DIR.mkdir(parents=True, exist_ok=True)
    for lang, out_name in [("ko", "index.html"), ("en", "en.html"), ("ja", "ja.html")]:
        html = render_index(lang, posts)
        (BLOG_DIR / out_name).write_text(html, encoding="utf-8")
        print(f"  ✅ blog/{out_name}")


if __name__ == "__main__":
    main()
