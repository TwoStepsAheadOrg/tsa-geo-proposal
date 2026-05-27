#!/usr/bin/env python3
"""
Plurank — Blog post builder.
Reads posts/{slug}/meta.json + ko.md + en.md + ja.md → generates 3 HTML pages
in blog/{slug}/index.html (ko), en.html, ja.html with full SEO + GEO metadata.

Also regenerates blog/index.html, blog/en.html, blog/ja.html (post listing)
+ sitemap.xml + llms.txt updates.

Usage:
  python3 scripts/build_blog_post.py {slug}
  python3 scripts/build_blog_post.py --all      # rebuild all posts
"""
import json
import re
import sys
from pathlib import Path
from datetime import datetime
from html import escape

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "posts"
BLOG_DIR = ROOT / "blog"
SITE_URL = "https://www.plurank.com"

# ───────────────────────────────────────────────────────────────────────
# Minimal markdown → HTML converter (handles: headings, paragraphs, lists,
# bold, italic, links, blockquote, hr, code spans)
# ───────────────────────────────────────────────────────────────────────
def md_to_html(md: str) -> tuple[str, list[dict]]:
    """Return (html, toc_entries). TOC entries: [{level, text, anchor}, …]"""
    lines = md.split("\n")
    out = []
    toc = []
    i = 0
    in_list = False
    list_type = None  # 'ul' or 'ol'

    def flush_list():
        nonlocal in_list, list_type
        if in_list:
            out.append(f"</{list_type}>")
            in_list = False
            list_type = None

    def inline(text: str) -> str:
        # links [text](url)
        text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)',
                      lambda m: f'<a href="{escape(m.group(2))}" rel="noopener">{escape(m.group(1))}</a>',
                      text)
        # bold **text**
        text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
        # italic *text* (not adjacent to bold marker)
        text = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'<em>\1</em>', text)
        # inline code `text`
        text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
        return text

    def slugify(text: str) -> str:
        s = re.sub(r'[^\w가-힣ぁ-んァ-ヶー一-龯\s-]', '', text).strip()
        s = re.sub(r'\s+', '-', s)
        return s.lower()

    while i < len(lines):
        raw = lines[i]
        line = raw.rstrip()

        # blank line — close paragraphs / lists
        if not line.strip():
            flush_list()
            i += 1
            continue

        # horizontal rule
        if line.strip() in ("---", "***", "___"):
            flush_list()
            out.append("<hr>")
            i += 1
            continue

        # headings
        m = re.match(r'^(#{1,6})\s+(.+)$', line)
        if m:
            flush_list()
            level = len(m.group(1))
            text = m.group(2).strip()
            anchor = slugify(text)
            toc.append({"level": level, "text": text, "anchor": anchor})
            out.append(f'<h{level} id="{anchor}">{inline(escape(text))}</h{level}>')
            i += 1
            continue

        # blockquote
        if line.startswith("> "):
            flush_list()
            quote_lines = []
            while i < len(lines) and lines[i].startswith("> "):
                quote_lines.append(lines[i][2:])
                i += 1
            quote_html = "<br>".join(inline(escape(q)) for q in quote_lines)
            out.append(f"<blockquote>{quote_html}</blockquote>")
            continue

        # unordered list
        if re.match(r'^[-*]\s+', line):
            if not in_list:
                out.append("<ul>")
                in_list = True
                list_type = "ul"
            elif list_type != "ul":
                flush_list()
                out.append("<ul>")
                in_list = True
                list_type = "ul"
            content = re.sub(r'^[-*]\s+', '', line)
            out.append(f"<li>{inline(escape(content))}</li>")
            i += 1
            continue

        # ordered list
        if re.match(r'^\d+\.\s+', line):
            if not in_list:
                out.append("<ol>")
                in_list = True
                list_type = "ol"
            elif list_type != "ol":
                flush_list()
                out.append("<ol>")
                in_list = True
                list_type = "ol"
            content = re.sub(r'^\d+\.\s+', '', line)
            out.append(f"<li>{inline(escape(content))}</li>")
            i += 1
            continue

        # paragraph (collect consecutive non-empty lines)
        flush_list()
        para_lines = [line]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r'^(#{1,6}\s|[-*]\s|\d+\.\s|>\s|---|---|\*\*\*|___)', lines[i]):
            para_lines.append(lines[i].rstrip())
            i += 1
        para = " ".join(para_lines)
        out.append(f"<p>{inline(escape(para))}</p>")

    flush_list()
    return "\n".join(out), toc


# ───────────────────────────────────────────────────────────────────────
# HTML template per language
# ───────────────────────────────────────────────────────────────────────
LANG_MAP = {"ko": ("ko_KR", "ko"), "en": ("en_US", "en"), "ja": ("ja_JP", "ja")}

UI = {
    "ko": {
        "back_to_blog": "← Blog 전체 보기",
        "category_label": "Category",
        "author_label": "Author",
        "reading_time_suffix": "분 읽기",
        "share": "공유",
        "toc_title": "목차",
        "originally_published": "이 글은 원래",
        "originally_published_suffix": "에 게재되었습니다.",
        "cta_title": "Plurank의 GEO 인텔리전스를 직접 보세요",
        "cta_sub": "30분 데모로 우리 브랜드가 AI 답변에 어떻게 보이고 있는지 확인합니다.",
        "cta_btn": "30분 데모 신청",
        "footer_lead": "Plurank — 투스텝스어헤드(주)의 독보적인 GEO 솔루션",
    },
    "en": {
        "back_to_blog": "← All Blog Posts",
        "category_label": "Category",
        "author_label": "Author",
        "reading_time_suffix": " min read",
        "share": "Share",
        "toc_title": "Table of Contents",
        "originally_published": "Originally published on",
        "originally_published_suffix": ".",
        "cta_title": "See Plurank's GEO intelligence yourself",
        "cta_sub": "Book a 30-minute demo to see how your brand looks inside AI answers.",
        "cta_btn": "Request a 30-min demo",
        "footer_lead": "Plurank — TwoStepsAhead Inc.'s unrivaled GEO solution",
    },
    "ja": {
        "back_to_blog": "← Blog 一覧へ",
        "category_label": "カテゴリ",
        "author_label": "著者",
        "reading_time_suffix": "分で読了",
        "share": "シェア",
        "toc_title": "目次",
        "originally_published": "この記事はもともと",
        "originally_published_suffix": "に掲載されました。",
        "cta_title": "PlurankのGEOインテリジェンスを実際にご覧ください",
        "cta_sub": "30分のデモで、自社ブランドがAIの回答にどう見えているかを確認します。",
        "cta_btn": "30分デモを申し込む",
        "footer_lead": "Plurank — TwoStepsAhead社の唯一無二のGEOソリューション",
    },
}


def build_post_html(slug: str, lang: str, meta: dict, body_md: str) -> str:
    body_html, toc = md_to_html(body_md)
    url_path = f"/blog/{slug}/" if lang == "ko" else f"/blog/{slug}/{lang}"
    canonical = f"{SITE_URL}{url_path}"
    ui = UI[lang]
    title = meta[f"title_{lang}"]
    subtitle = meta[f"subtitle_{lang}"]
    description = meta[f"description_{lang}"]
    og_locale, html_lang = LANG_MAP[lang]
    author_name = meta["author"][f"name_{lang}"]
    author_title = meta["author"][f"title_{lang}"]
    avatar_initial = meta["author"]["avatar_initial"]
    category = meta.get(f"category_{lang}", meta["category"])
    reading_time = meta["reading_time"]
    pub_date = meta["date"]
    tags = meta.get(f"tags_{lang}", meta.get("tags", []))
    medium_url = meta.get("medium_canonical", "")

    # hreflang URLs
    href_ko = f"{SITE_URL}/blog/{slug}/"
    href_en = f"{SITE_URL}/blog/{slug}/en"
    href_ja = f"{SITE_URL}/blog/{slug}/ja"

    # Article JSON-LD
    article_jsonld = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "datePublished": pub_date,
        "dateModified": pub_date,
        "inLanguage": html_lang,
        "author": {
            "@type": "Person",
            "name": author_name,
            "jobTitle": author_title,
            "affiliation": {"@type": "Organization", "name": "TwoStepsAhead Inc."},
        },
        "publisher": {
            "@type": "Organization",
            "name": "Plurank",
            "url": SITE_URL,
            "logo": {"@type": "ImageObject", "url": f"{SITE_URL}/logo-square.png"},
        },
        "mainEntityOfPage": {"@type": "WebPage", "@id": canonical},
        "articleSection": category,
        "keywords": ", ".join(tags),
        "image": [f"{SITE_URL}/og-image.png"],
    }

    breadcrumb_jsonld = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL + "/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": f"{SITE_URL}/blog/" if lang == "ko" else f"{SITE_URL}/blog/{lang}"},
            {"@type": "ListItem", "position": 3, "name": title, "item": canonical},
        ],
    }

    # TOC HTML
    toc_html = ""
    if len([t for t in toc if t["level"] == 2]) >= 3:
        toc_items = []
        for t in toc:
            if t["level"] == 2:
                toc_items.append(f'<li><a href="#{t["anchor"]}">{escape(t["text"])}</a></li>')
        toc_html = (
            f'<aside class="toc"><div class="toc-title">{ui["toc_title"]}</div>'
            f'<ol>{"".join(toc_items)}</ol></aside>'
        )

    # Medium origin notice (only if originally published on Medium)
    medium_notice = ""
    if medium_url:
        medium_notice = (
            f'<div class="medium-origin">{ui["originally_published"]} '
            f'<a href="{medium_url}" rel="noopener" target="_blank">Medium</a>{ui["originally_published_suffix"]}</div>'
        )

    tags_html = " · ".join(f'<span class="tag">{escape(t)}</span>' for t in tags)

    return f"""<!DOCTYPE html>
<html lang="{html_lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{escape(title)} · Plurank Blog</title>
<meta name="description" content="{escape(description)}">
<meta name="author" content="{escape(author_name)} ({escape(author_title)})">
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
<meta name="theme-color" content="#0a0a0a">

<link rel="canonical" href="{canonical}">
<link rel="alternate" hreflang="ko" href="{href_ko}">
<link rel="alternate" hreflang="en" href="{href_en}">
<link rel="alternate" hreflang="ja" href="{href_ja}">
<link rel="alternate" hreflang="x-default" href="{href_ko}">

<meta property="og:type" content="article">
<meta property="og:title" content="{escape(title)}">
<meta property="og:description" content="{escape(description)}">
<meta property="og:url" content="{canonical}">
<meta property="og:site_name" content="Plurank">
<meta property="og:locale" content="{og_locale}">
<meta property="og:image" content="{SITE_URL}/og-image.png">
<meta property="article:published_time" content="{pub_date}">
<meta property="article:author" content="{escape(author_name)}">
<meta property="article:section" content="{escape(category)}">
{"".join(f'<meta property="article:tag" content="{escape(t)}">' for t in tags)}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{escape(title)}">
<meta name="twitter:description" content="{escape(description)}">
<meta name="twitter:image" content="{SITE_URL}/og-image.png">

<!-- Favicons -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">

<!-- Schema.org -->
<script type="application/ld+json">{json.dumps(article_jsonld, ensure_ascii=False)}</script>
<script type="application/ld+json">{json.dumps(breadcrumb_jsonld, ensure_ascii=False)}</script>

<!-- Vercel Analytics -->
<script defer src="/_vercel/insights/script.js"></script>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

<style>
:root {{
  --bg: #ffffff;
  --paper: #fafaf7;
  --text: #0a0a0a;
  --text-soft: #2c2c2c;
  --text-mute: #6b6b6b;
  --text-faint: #a0a0a0;
  --border: #e8e8e8;
  --border-strong: #c8c8c8;
  --accent: #0a0a0a;
  --f-sans: 'Inter', 'Noto Sans KR', -apple-system, sans-serif;
  --f-mono: 'JetBrains Mono', ui-monospace, monospace;
}}
*, *::before, *::after {{ box-sizing: border-box; }}
em, i, cite, address, dfn {{ font-style: normal; }}
body {{
  margin: 0; background: var(--bg); color: var(--text);
  font-family: var(--f-sans);
  -webkit-font-smoothing: antialiased;
  word-break: keep-all; overflow-wrap: break-word;
  line-height: 1.65;
}}
a {{ color: inherit; text-decoration: none; }}
.nav {{
  position: sticky; top: 0; z-index: 100;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
  padding: 20px 32px;
}}
.nav-inner {{ max-width: 1240px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; }}
.nav-brand {{ display: flex; align-items: center; width: 132px; }}
.nav-brand img {{ width: 100%; height: auto; display: block; }}
.nav-links {{ display: flex; gap: 28px; font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-mute); }}
.nav-links a:hover {{ color: var(--text); }}
.nav-links .active {{ color: var(--text); }}
.nav-meta {{ display: flex; align-items: center; gap: 12px; font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.1em; color: var(--text-mute); }}
.nav-meta a {{ transition: color 0.15s; }}
.nav-meta a.active {{ color: var(--text); }}
@media (max-width: 900px) {{ .nav-links {{ display: none; }} }}

.article-wrap {{ max-width: 760px; margin: 0 auto; padding: 64px 24px 80px; }}

.breadcrumb {{ font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-mute); margin-bottom: 28px; }}
.breadcrumb a:hover {{ color: var(--text); }}
.breadcrumb .sep {{ margin: 0 8px; color: var(--text-faint); }}

.article-header {{ margin-bottom: 44px; padding-bottom: 36px; border-bottom: 1px solid var(--border); }}
.eyebrow {{
  display: inline-block;
  font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--text-mute); margin-bottom: 20px;
}}
.eyebrow::before {{ content: ""; display: inline-block; width: 22px; height: 1px; background: var(--text-mute); margin-right: 12px; vertical-align: middle; }}

h1.article-title {{
  font-family: var(--f-sans); font-weight: 700; font-size: clamp(28px, 4.4vw, 44px); line-height: 1.18; letter-spacing: -0.022em; margin: 0 0 18px;
}}
.article-subtitle {{ font-size: 18px; line-height: 1.6; color: var(--text-soft); font-weight: 400; margin: 0 0 28px; }}

.article-meta {{ display: flex; align-items: center; gap: 16px; flex-wrap: wrap; font-family: var(--f-mono); font-size: 12px; color: var(--text-mute); }}
.author-row {{ display: flex; align-items: center; gap: 10px; }}
.author-avatar {{ width: 32px; height: 32px; border-radius: 50%; background: var(--text); color: var(--bg); display: flex; align-items: center; justify-content: center; font-family: var(--f-sans); font-weight: 600; font-size: 13px; }}
.author-name {{ font-family: var(--f-sans); font-size: 14px; color: var(--text); font-weight: 500; letter-spacing: 0; text-transform: none; }}
.author-title {{ font-size: 11px; color: var(--text-mute); }}
.meta-sep {{ color: var(--text-faint); }}

.toc {{
  background: var(--paper); border: 1px solid var(--border); border-radius: 10px;
  padding: 18px 22px; margin: 0 0 36px;
}}
.toc-title {{ font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-mute); margin-bottom: 10px; }}
.toc ol {{ margin: 0; padding-left: 18px; color: var(--text-soft); font-size: 14px; }}
.toc li {{ margin: 6px 0; }}
.toc a:hover {{ color: var(--text); text-decoration: underline; }}

article.body {{ font-size: 17px; line-height: 1.78; color: var(--text-soft); }}
article.body h2 {{ font-family: var(--f-sans); font-weight: 700; font-size: 26px; line-height: 1.35; letter-spacing: -0.01em; margin: 48px 0 16px; color: var(--text); }}
article.body h3 {{ font-family: var(--f-sans); font-weight: 600; font-size: 20px; line-height: 1.4; margin: 32px 0 12px; color: var(--text); }}
article.body p {{ margin: 0 0 20px; }}
article.body strong {{ color: var(--text); font-weight: 600; }}
article.body em {{ color: var(--text-soft); }}
article.body ul, article.body ol {{ margin: 0 0 24px; padding-left: 24px; }}
article.body li {{ margin: 8px 0; }}
article.body blockquote {{ margin: 24px 0; padding: 16px 20px; border-left: 3px solid var(--text); background: var(--paper); color: var(--text); font-style: normal; }}
article.body a {{ color: var(--text); border-bottom: 1px solid var(--border-strong); transition: border-color 0.15s; }}
article.body a:hover {{ border-bottom-color: var(--text); }}
article.body hr {{ border: none; border-top: 1px solid var(--border); margin: 40px 0; }}
article.body code {{ font-family: var(--f-mono); font-size: 0.92em; background: var(--paper); padding: 2px 6px; border-radius: 4px; }}

.tags-row {{ margin-top: 48px; padding-top: 28px; border-top: 1px solid var(--border); font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-mute); }}
.tags-row .tag {{ display: inline-block; margin-right: 8px; padding: 4px 10px; background: var(--paper); border: 1px solid var(--border); border-radius: 999px; }}

.medium-origin {{ margin-top: 24px; font-size: 13px; color: var(--text-mute); font-style: normal; }}
.medium-origin a {{ color: var(--text); border-bottom: 1px solid var(--border-strong); }}

.cta-card {{
  margin: 64px 0 0; padding: 48px 40px; background: var(--text); color: var(--bg);
  border-radius: 16px; text-align: center;
}}
.cta-card h2 {{ font-family: var(--f-sans); font-weight: 700; font-size: 26px; line-height: 1.3; letter-spacing: -0.01em; margin: 0 0 12px; color: var(--bg); }}
.cta-card p {{ font-size: 15px; color: rgba(255,255,255,0.78); margin: 0 0 24px; line-height: 1.6; }}
.cta-card .btn {{
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 26px; background: var(--bg); color: var(--text);
  border-radius: 999px; font-family: var(--f-sans); font-size: 14px; font-weight: 500;
  transition: transform 0.15s;
}}
.cta-card .btn:hover {{ transform: translateY(-1px); }}

.back-link {{ display: inline-flex; align-items: center; gap: 6px; margin-bottom: 36px; font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-mute); }}
.back-link:hover {{ color: var(--text); }}

footer.footer {{ padding: 56px 32px; text-align: center; font-family: var(--f-mono); font-size: 12px; color: var(--text-faint); letter-spacing: 0.04em; border-top: 1px solid var(--border); margin-top: 60px; }}
footer.footer a {{ color: var(--text-mute); border-bottom: 1px solid transparent; transition: border-color 0.2s; }}
footer.footer a:hover {{ border-color: var(--text-mute); }}
footer.footer .footer-lead {{ font-size: 13px; color: var(--text-soft); margin-bottom: 10px; letter-spacing: 0.02em; }}
</style>
</head>
<body>

<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="nav-brand" aria-label="Plurank home">
      <img src="/logo-wordmark.png" alt="Plurank AI Discovery AdTech" width="600" height="172">
    </a>
    <div class="nav-links">
      <a href="/{('en.html' if lang=='en' else ('ja.html' if lang=='ja' else ''))}">Home</a>
      <a href="/blog/{('en' if lang=='en' else ('ja' if lang=='ja' else ''))}" class="active">Blog</a>
    </div>
    <div class="nav-meta">
      <a href="{href_ko}" class="{'active' if lang=='ko' else ''}" style="color:{'var(--text)' if lang=='ko' else 'var(--text-mute)'}">KO</a>
      <span style="color:var(--text-faint)">·</span>
      <a href="{href_en}" class="{'active' if lang=='en' else ''}" style="color:{'var(--text)' if lang=='en' else 'var(--text-mute)'}">EN</a>
      <span style="color:var(--text-faint)">·</span>
      <a href="{href_ja}" class="{'active' if lang=='ja' else ''}" style="color:{'var(--text)' if lang=='ja' else 'var(--text-mute)'}">JA</a>
    </div>
  </div>
</nav>

<div class="article-wrap">
  <a href="/blog/{('en' if lang=='en' else ('ja' if lang=='ja' else ''))}" class="back-link">{ui["back_to_blog"]}</a>

  <header class="article-header">
    <div class="eyebrow">{escape(category)}</div>
    <h1 class="article-title">{escape(title)}</h1>
    <p class="article-subtitle">{escape(subtitle)}</p>
    <div class="article-meta">
      <div class="author-row">
        <div class="author-avatar">{avatar_initial}</div>
        <div>
          <div class="author-name">{escape(author_name)}</div>
          <div class="author-title">{escape(author_title)}</div>
        </div>
      </div>
      <span class="meta-sep">·</span>
      <span>{pub_date}</span>
      <span class="meta-sep">·</span>
      <span>{reading_time}{ui["reading_time_suffix"]}</span>
    </div>
  </header>

  {toc_html}

  <article class="body">
    {body_html}
  </article>

  <div class="tags-row">{tags_html}</div>
  {medium_notice}

  <div class="cta-card">
    <h2>{ui["cta_title"]}</h2>
    <p>{ui["cta_sub"]}</p>
    <a href="/{'' if lang=='ko' else lang + '.html'}#contact" class="btn">{ui["cta_btn"]} →</a>
  </div>
</div>

<footer class="footer">
  <div class="footer-lead">{ui["footer_lead"]}</div>
  © 2026 TwoStepsAhead Inc · <a href="mailto:glenn.kim@twostepsahead.co.kr">glenn.kim@twostepsahead.co.kr</a>
</footer>

</body>
</html>
"""


# ───────────────────────────────────────────────────────────────────────
# Main build
# ───────────────────────────────────────────────────────────────────────
def build_post(slug: str):
    post_dir = POSTS_DIR / slug
    meta = json.loads((post_dir / "meta.json").read_text(encoding="utf-8"))

    out_dir = BLOG_DIR / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    for lang in ("ko", "en", "ja"):
        md_path = post_dir / f"{lang}.md"
        if not md_path.exists():
            print(f"⚠️ {lang}.md missing for {slug}")
            continue
        md = md_path.read_text(encoding="utf-8")
        html = build_post_html(slug, lang, meta, md)
        out_file = out_dir / ("index.html" if lang == "ko" else f"{lang}.html")
        out_file.write_text(html, encoding="utf-8")
        print(f"  ✅ {out_file.relative_to(ROOT)}")


def main():
    args = sys.argv[1:]
    if not args:
        print("Usage: build_blog_post.py {slug} | --all")
        sys.exit(1)

    if args[0] == "--all":
        slugs = [p.name for p in POSTS_DIR.iterdir() if p.is_dir() and (p / "meta.json").exists()]
    else:
        slugs = [args[0]]

    for slug in slugs:
        print(f"\n📝 Building: {slug}")
        build_post(slug)

    print("\n✅ Done.")


if __name__ == "__main__":
    main()
