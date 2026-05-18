const LANGUAGE_COOKIE = 'plurank_lang';
const ONE_YEAR = 60 * 60 * 24 * 365;

const BOT_PATTERN =
  /(bot|crawler|spider|crawling|facebookexternalhit|linkedinbot|twitterbot|slackbot|discordbot|whatsapp|telegrambot|kakaotalk|kakaostory|googlebot|bingbot|naverbot|yeti|daum|baiduspider|duckduckbot|semrush|ahrefs|mj12bot|petalbot|applebot|gptbot|claudebot|perplexitybot|oai-searchbot)/i;

function getCookie(headers, name) {
  const cookie = headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

function normalizeLanguage(value) {
  const lang = String(value || '').toLowerCase().slice(0, 2);
  return ['ko', 'en', 'ja'].includes(lang) ? lang : '';
}

function languageFromAcceptLanguage(header) {
  return String(header || '')
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params
        .map((param) => param.trim())
        .find((param) => param.startsWith('q='));
      return {
        lang: normalizeLanguage(tag),
        q: q ? Number(q.slice(2)) || 0 : 1,
      };
    })
    .filter((item) => item.lang)
    .sort((a, b) => b.q - a.q)[0]?.lang || '';
}

function languageFromCountry(country) {
  const code = String(country || '').toUpperCase();
  if (code === 'KR') return 'ko';
  if (code === 'JP') return 'ja';
  return '';
}

function pickLanguage(request) {
  const headers = request.headers;
  return (
    normalizeLanguage(getCookie(headers, LANGUAGE_COOKIE)) ||
    languageFromCountry(headers.get('x-vercel-ip-country')) ||
    languageFromAcceptLanguage(headers.get('accept-language')) ||
    'en'
  );
}

function cookieHeader(lang) {
  return `${LANGUAGE_COOKIE}=${lang}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax; Secure`;
}

export default function middleware(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return;

  const url = new URL(request.url);
  const accept = request.headers.get('accept') || '';
  const userAgent = request.headers.get('user-agent') || '';

  if (accept && !accept.toLowerCase().includes('text/html')) return;
  if (BOT_PATTERN.test(userAgent)) return;
  if (url.searchParams.has('no_lang_redirect')) return;

  const lang = pickLanguage(request);
  const targetPath = lang === 'ja' ? '/ja.html' : lang === 'en' ? '/en.html' : '';
  if (!targetPath) return;

  url.pathname = targetPath;

  return new Response(null, {
    status: 307,
    headers: {
      Location: url.toString(),
      'Set-Cookie': cookieHeader(lang),
      Vary: 'Accept-Language, Cookie, X-Vercel-IP-Country',
    },
  });
}

export const config = {
  matcher: ['/', '/index.html'],
};
