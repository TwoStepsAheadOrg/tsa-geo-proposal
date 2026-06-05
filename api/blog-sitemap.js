// Vercel Serverless Function — /blog/sitemap.xml. Lists the blog index + local
// hand-written posts (all language variants) + Plurank platform posts, all under
// www.plurank.com. URL forms match each page's self-canonical. The site-wide
// sitemap.xml is left untouched; robots.txt references this one too.
import { readFileSync } from 'node:fs';
import { SITE_URL, fmtDate, fetchPlatformPosts } from './_lib/blog-shared.js';

let LOCAL_POSTS = [];
try {
  LOCAL_POSTS = JSON.parse(
    readFileSync(new URL('./_lib/blog-local-posts.json', import.meta.url), 'utf8'),
  );
} catch {
  LOCAL_POSTS = [];
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const platform = await fetchPlatformPosts();

  const entries = [
    { loc: `${SITE_URL}/blog`, lastmod: null },
    { loc: `${SITE_URL}/blog/en`, lastmod: null },
    { loc: `${SITE_URL}/blog/ja`, lastmod: null },
    ...LOCAL_POSTS.map((e) => ({ loc: `${SITE_URL}${e.url}`, lastmod: e.date || null })),
    ...platform.map((p) => ({ loc: `${SITE_URL}/blog/${p.slug}`, lastmod: fmtDate(p.publishedAt) || null })),
  ];

  const body = entries
    .map((e) => `  <url><loc>${e.loc}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;

  // Use res.end (raw Node) rather than Vercel's res.send(), which overrode the
  // Content-Type to application/json for this string body. We need real XML.
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
  return res.end(xml);
}
