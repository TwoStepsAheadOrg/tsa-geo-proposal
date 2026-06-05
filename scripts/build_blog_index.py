#!/usr/bin/env python3
"""Emit the local hand-written post manifest consumed by the SSR blog index.

The /blog, /blog/en, /blog/ja index pages are now server-rendered by
api/blog-index.js (which merges these local posts with platform posts pulled
from blog.plurank.com via the public API). So this script no longer writes
blog/index.html etc. — it only emits api/_lib/blog-local-posts.json, the single
source of truth for the hand-written posts that live in posts/<slug>/.

Hand-written POST detail pages (blog/<slug>/*.html) are still built by
build_blog_post.py and remain static files.

Usage: python3 scripts/build_blog_index.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "posts"
MANIFEST = ROOT / "api" / "_lib" / "blog-local-posts.json"

# Language-correct URL of a hand-written post (matches the static files'
# self-canonical: ko keeps the trailing slash, en/ja are clean URLs).
def post_url(slug: str, lang: str) -> str:
    return f"/blog/{slug}/" if lang == "ko" else f"/blog/{slug}/{lang}"


def collect():
    posts = []
    for d in sorted(POSTS_DIR.iterdir()):
        if not d.is_dir():
            continue
        meta_path = d / "meta.json"
        if not meta_path.exists():
            continue
        posts.append(json.loads(meta_path.read_text(encoding="utf-8")))
    posts.sort(key=lambda m: m.get("date", ""), reverse=True)

    entries = []
    for m in posts:
        slug = m["slug"]
        for lang in ("ko", "en", "ja"):
            if f"title_{lang}" not in m:
                continue
            entries.append({
                "slug": slug,
                "lang": lang,
                "title": m[f"title_{lang}"],
                "description": m.get(f"description_{lang}", ""),
                "category": m.get(f"category_{lang}", m.get("category", "")),
                "date": m.get("date", ""),
                "reading_time": m.get("reading_time", 0),
                "author": m["author"][f"name_{lang}"],
                "url": post_url(slug, lang),
            })
    return entries


def main():
    entries = collect()
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"  ✅ {MANIFEST.relative_to(ROOT)} ({len(entries)} entries)")


if __name__ == "__main__":
    main()
