# Design: Mirror platform blog posts onto the home `/blog` (www canonical, SSR)

**Date:** 2026-06-05
**Status:** Approved (design)
**Repos touched:** `plurank-platform` (deployable by us), `home-plurank` (we prepare, user pushes)

## Problem

Plurank publishes blog posts from two places:

- **Home blog** — `www.plurank.com/blog`, a static site built by Python scripts (`scripts/build_blog_*.py`) from `posts/<slug>/{meta.json,ko.md,en.md,ja.md}`. Currently 1 hand-written post. Not SSR.
- **Platform blog** — `blog.plurank.com`, a Next.js 14 SSR app on EC2 reading `blog_articles` from MySQL. Currently 13 Plurank-owned ("dogfood") posts, published almost daily, indexable, with a submitted sitemap.

We want the platform's Plurank-owned posts to also appear on the home `/blog` **as if natively published there** (full body rendered on `www.plurank.com/blog/<slug>`, listed after the existing hand-written post). It must be **server-side rendered** so search engines read it, and it must **not harm existing SEO**.

## Key decisions (locked)

1. **Full mirror, native appearance.** Platform posts render on the home domain (`www.plurank.com/blog/<slug>`) with the home theme — not a link-out to `blog.plurank.com`.
2. **`www.plurank.com` is the SEO canonical** (offensive consolidation). The same article exists on two domains; `rel=canonical` points search exposure to the main brand domain via the `/blog` subfolder. Rationale: matches the intent (home version should be a first-class, indexable citizen), subfolders inherit main-domain authority better than the `blog.` subdomain, and the platform blog is only ~3 weeks old (13 posts) so migration cost is near-zero now.
3. **Render markdown → HTML on the platform side.** The public API returns sanitized HTML, so the home (dependency-free static site) does not need a markdown library.
4. **Runtime SSR via Vercel functions** (same style as existing `api/*.js`), not a build-time regeneration. New platform posts surface automatically on the next request (300s edge cache). No rebuild/redeploy on publish.

## URL & trailing-slash convention (load-bearing)

Existing indexed URLs use **trailing slashes**: the index self-canonicals as `https://www.plurank.com/blog/` and the hand-written post as `https://www.plurank.com/blog/global-tourists-search-differently/`. The new pieces introduce a no-slash form, so we fix the convention explicitly to avoid a canonical-vs-served-URL mismatch:

- **Platform posts** (new, no legacy URL to preserve): served and self-canonicaled at `https://www.plurank.com/blog/<slug>` **(no trailing slash)**. This must byte-for-byte match the canonical the platform emits in A-2 and the link the index renders. This is the contract.
- **Index**: standardize on `https://www.plurank.com/blog` **(no trailing slash)** going forward. Add a `redirects` entry `/blog/` → `/blog` (301) so the one already-indexed URL transfers its equity. Update the index self-canonical to `/blog`.
- **Hand-written post**: unchanged — stays at `/blog/<slug>/` (trailing slash) and self-canonicals as today. The index links to it with the trailing slash; the catch-all rewrite never touches it (static file wins).

Net rule: every page's self-canonical equals the exact URL it is served at and linked with. Platform posts = no slash (matches platform emission); legacy hand post = slash (unchanged).

## Scope: what we are NOT doing (YAGNI)

- Mirroring en/ja translations of platform posts (they are Korean-only; shown only on `/blog` ko).
- Comments, related-post recommendation algorithms, real-time webhook revalidation.
- Touching customer blog projects on the platform in any way.
- Touching the home `sitemap.xml` (a separate blog sitemap is added instead).

---

## Part A — `plurank-platform` changes (we deploy)

### A-1. Public read API

New file `apps/server/src/api/blog-public-routes.ts` exporting `createBlogPublicRouter()`. Mounted in `apps/server/src/api/server.ts` **before** `createPlurankRouter()` so the global `requireAuth` does NOT apply (mirror the pattern in `blog-tracking-routes.ts`). No auth. `cors({ origin: true, credentials: false, methods: ['GET','OPTIONS'] })`.

**Project scoping.** Resolve the Plurank-owned project once (id cached in module scope):

```sql
SELECT id FROM blog_projects
WHERE hostname='blog.plurank.com' AND hostname_verified_at IS NOT NULL
LIMIT 1
```

All queries below are scoped to that `blog_project_id` and `status='published'`. If the project cannot be resolved, the routes return `503` (never fall back to all projects — customer content must never leak).

**Endpoints:**

- `GET /api/plurank/public/blog/posts`
  - Reuse `selectPublishedArticles(projectId, limit, offset)` (already in `apps/blog-public/src/lib/db.ts` — extract to a shared helper or replicate the query in the server route). Default `limit=50`, `offset=0`, `limit` capped at 100 so the index function's single fetch stays bounded as the post count grows (13 today). The home index only renders ko posts so 50 is ample; pagination is not exposed to the home (YAGNI).
  - Response (no `id`, no internal scoring fields):
    ```json
    {
      "posts": [
        {
          "slug": "...",
          "title": "...",
          "description": "...",         // meta_description
          "publishedAt": "2026-06-04T23:27:52Z",
          "tags": ["GEO", "AI Search"], // tags_json
          "coverImage": "https://.../hero.png | null",
          "readingTime": 6
        }
      ]
    }
    ```
  - `coverImage`: first usable hero URL from `auto_images_json` — pick `autoImagesJson.hero` if present, else the first URL in the object; `null` if none. (Confirm the exact `BlogArticleAutoImages` key shape during implementation.)
  - `readingTime`: CJK-aware estimate from the markdown body — `Math.max(1, round(visibleCharCount / 500))` (Korean is not whitespace-delimited, so word/200 is meaningless). Cosmetic; if the heuristic proves noisy, drop the field rather than over-tune it.
- `GET /api/plurank/public/blog/posts/:slug`
  - Reuse `selectPublishedArticleBySlug(projectId, slug)`.
  - Same fields as above **plus** `"html"`: the rendered, sanitized body. Render with the existing `renderMarkdown()` from `apps/blog-public/src/lib/blog-renderer.ts` (markdown-it `html:false, linkify:true` + DOMPurify). **Extract `renderMarkdown` into a small shared package** (e.g. `packages/blog-render`) imported by both `blog-public` and `server` — preferred over duplication, because the home inserts this HTML verbatim and a future drift in a duplicated server copy would silently weaken sanitization. Duplicate the ~15-line util only as a last resort, with a comment pointing at the original.
  - `404` if slug not found / not published.
- Both: GET only (`405` on other methods, matching existing `api/*.js`). `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`.

### A-2. Canonical change in `blog-public`

In `apps/blog-public/src/app/[slug]/page.tsx` `generateMetadata`, change the canonical (and `openGraph.url`) for the Plurank-owned project only:

```ts
const canonical = project.hostname === 'blog.plurank.com'
  ? `https://www.plurank.com/blog/${article.slug}`
  : `https://${canonicalHostnameFor(project)}/${article.slug}`;
```

Customer projects are unaffected.

**Also drop Plurank-owned posts from `blog.plurank.com/sitemap.xml`** (in the blog-public sitemap route, exclude the project whose `hostname='blog.plurank.com'`). A sitemap that lists URLs whose `rel=canonical` points to another domain is a contradictory signal Google may distrust ("you submitted this for crawling but told me the real one is elsewhere"). Removing them leaves canonical as the sole, consistent signal. Interim expectation: for a short period both `blog.plurank.com/<slug>` and `www.plurank.com/blog/<slug>` may appear in results until Google reprocesses canonicals; www should win and the subdomain version should drop out.

### Deploy

- API server: manual EC2 deploy — `ssh ... 'cd ~/plurank-platform && git pull && pnpm install && pm2 restart plurank-server --update-env'`.
- `blog-public`: EC2 (PM2 `blog-public`) — build + restart per its deploy procedure.
- Per `plurank-platform` CLAUDE.md: work in an isolated worktree off `origin/main`, PR from there; never touch other sessions' uncommitted changes.

---

## Part B — `home-plurank` changes (we prepare, user pushes)

The home site is static on Vercel (`cleanUrls: true`). We add SSR via serverless functions in `api/` (ESM `export default (req,res)`), matching `api/contact.js` / `api/apply.js`.

### B-1. SSR functions

- **`api/blog-index.js`** — handles `/blog`, `/blog/en`, `/blog/ja` (lang from rewrite query).
  - Fetch `GET {API_BASE}/api/plurank/public/blog/posts` (server-side; 3s timeout).
  - Read local hand-written post metadata from the bundled `blog/local-posts.json` (B-2).
  - Merge: local posts first, then platform posts by `publishedAt` desc. Platform posts only included for `lang=ko`.
  - Render the existing dark editorial index theme (same `<head>`, `<style>`, hero, card markup as `build_blog_index.py` output). Local post links → existing static pages; platform post links → `/blog/<slug>`.
  - Self-canonical per lang, no trailing slash: ko → `https://www.plurank.com/blog`, en → `/blog/en`, ja → `/blog/ja`.
  - `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`.
- **`api/blog-post.js`** — handles `/blog/<slug>` for platform posts.
  - Fetch `GET {API_BASE}/api/plurank/public/blog/posts/:slug` (3s timeout).
  - Render the existing post template (header nav, footer, title/subtitle, body, author block) from `build_blog_post.py`, inserting the returned `html` body verbatim (already sanitized).
  - `<link rel="canonical">` = self (`https://www.plurank.com/blog/<slug>`), since www is now canonical. Full OG/Twitter/JSON-LD `BlogPosting` meta from the post fields.
  - Author defaults to "Plurank" / "투스텝스어헤드"; cover image from `coverImage` if present.
  - `404` (rendered in theme) if the API returns 404.

Both functions are GET-only (`405` otherwise, matching existing `api/*.js`). `API_BASE` defaults to `https://api.plurank.com` (verified: `OPTIONS https://api.plurank.com/api/plurank/track/blog-view` → `204`, i.e. it routes to `apps/server` which will host the new public router), overridable via env for local testing.

### B-2. Local post manifest

Extend `scripts/build_blog_index.py` to also emit `blog/local-posts.json`: one entry per hand-written post **per language**, each `{ slug, lang, title, subtitle, description, date, category, tags, reading_time, author, url }` where `url` is the language-correct path (e.g. ko → `/blog/<slug>/`, en → `/blog/<slug>/en`). `api/blog-index.js` reads this (bundled with the function via Vercel `includeFiles` if needed), **filters local entries by the requested `lang`** (just like platform posts are gated to `lang=ko`), and merges. So both local and platform posts respect `lang`; hand-written post info has a single source of truth.

### B-3. Vercel routing (`vercel.json`)

Vercel serves matching static files **before** applying `rewrites`, so existing hand-written post pages (`blog/<slug>/index.html`, `/en.html`, `/ja.html`) keep serving directly. Add rewrites (ordered; specific before catch-all):

```json
{
  "cleanUrls": true,
  "redirects": [
    { "source": "/blog/", "destination": "/blog", "permanent": true }
  ],
  "rewrites": [
    { "source": "/blog",    "destination": "/api/blog-index?lang=ko" },
    { "source": "/blog/en", "destination": "/api/blog-index?lang=en" },
    { "source": "/blog/ja", "destination": "/api/blog-index?lang=ja" },
    { "source": "/blog/sitemap.xml", "destination": "/api/blog-sitemap" },
    { "source": "/blog/:slug", "destination": "/api/blog-post?slug=:slug" }
  ]
}
```

The static index files `blog/index.html`, `blog/en.html`, `blog/ja.html` are **removed** (otherwise filesystem priority shadows the SSR index). `build_blog_index.py` stops emitting them (or they are deleted and the script adjusted). The `/blog/` → `/blog` redirect preserves the equity of the one already-indexed index URL under the new no-slash convention.

**Load-bearing invariants (a future edit must not break):**
- Hand-written post **static files stay** (`blog/<slug>/index.html`, `/en.html`, `/ja.html`). They are served by filesystem priority before any rewrite, so the `/blog/:slug` catch-all never shadows them. If someone deletes these statics, `/blog/<slug>` would route to the platform API, which doesn't have that slug → 404. The build script must keep emitting them.
- The `/blog/:slug` rewrite matches only one path segment, so it does **not** catch `/blog/<slug>/en` or `/ja` (deeper paths) — language variants of the hand-written post are safe as static files. It also never catches `/blog/en|ja` because those specific rewrites precede it (first match wins).
- Only the **index** statics are removed; the **post** statics are kept. This asymmetry is intentional and required.

### B-4. Blog sitemap

- **`api/blog-sitemap.js`** → served at `/blog/sitemap.xml`: lists local hand-written post URLs (from `local-posts.json`, using its language-correct `url` field) + platform post URLs (`/blog/<slug>`, no slash) + the index (`/blog`), all under `www.plurank.com`. URL forms must match each page's self-canonical per the trailing-slash convention above. `Cache-Control: s-maxage=600`.
- Add `Sitemap: https://www.plurank.com/blog/sitemap.xml` to `robots.txt`. The existing `sitemap.xml` is untouched.

---

## Data flow

```
Publish on platform admin
        │
        ▼
blog_articles (status=published, Plurank project)
        │  (read-only, scoped)
        ▼
GET api.plurank.com/api/plurank/public/blog/posts[/:slug]   ← renders markdown→HTML, s-maxage 300
        │  (server-side fetch, 3s timeout)
        ▼
Vercel fn api/blog-index.js / api/blog-post.js   ← merge w/ local-posts.json, home theme
        │
        ▼
www.plurank.com/blog  +  /blog/<slug>   (SSR HTML, self-canonical)
        ▲
blog.plurank.com/<slug>  → rel=canonical → www.plurank.com/blog/<slug>
```

## Failure modes & handling

- **Platform API down/slow on index:** catch + 3s timeout → render local hand-written posts only. Page never 500s.
- **Platform API down on post page:** return a themed 503/“temporarily unavailable” (not a hard 500); the post still exists at `blog.plurank.com`.
- **Slug not found:** themed 404.
- **Project not resolvable on platform:** API returns 503; home falls back to local-only. No customer content can leak (queries are project-scoped; no project → no rows).
- **HTML safety:** body is sanitized once on the platform (DOMPurify, `html:false`); home inserts it verbatim and never renders untrusted markdown itself.

## Out-of-scope assumptions to confirm during implementation

- Platform posts are Korean-only and surface only under `/blog` (ko). en/ja indexes keep only translated hand-written posts.
- A single Plurank-owned `blog_projects` row identified by `hostname='blog.plurank.com'` exists and is verified.

## Verification

- **A-1:** `curl https://api.plurank.com/api/plurank/public/blog/posts` returns the 13 Plurank posts and no customer posts; `/posts/:slug` returns sanitized `html`. Unauthenticated. No customer project leaks (test with a known customer slug → 404).
- **A-2:** `view-source` of a `blog.plurank.com/<slug>` page shows `<link rel="canonical" href="https://www.plurank.com/blog/<slug>">`; a customer blog page still self-canonicals.
- **B:** `/blog` SSR HTML (curl, no JS) lists hand-written post + platform posts; `/blog/<platform-slug>` renders full body server-side with self-canonical; existing hand-written post URLs still served from static files; `/blog/sitemap.xml` lists all; platform-API-down simulation still renders local posts.
- **End-to-end SEO:** Google sees `www.plurank.com/blog/<slug>` as canonical for both URLs.
