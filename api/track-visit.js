// Vercel Serverless Function: /api/track-visit
// Receives engaged-visit signals (30s dwell or 50% scroll) and posts to Slack.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body && typeof req.body === 'object') ? req.body : {};
  const event = body.event || 'visit';
  const path = body.path || '/';
  const referrer = body.referrer || 'direct';
  const ua = body.ua || '';

  // Vercel auto-attaches geo headers
  const country = req.headers['x-vercel-ip-country'] || '??';
  const city = req.headers['x-vercel-ip-city'] || '?';
  const region = req.headers['x-vercel-ip-country-region'] || '';
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

  // Browser/OS detection
  const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
  const browserMatch = ua.match(/Edg|Chrome|Firefox|Safari/);
  const browser = browserMatch ? browserMatch[0] : 'Unknown';
  const osMatch = ua.match(/Mac OS X [\d_]+|Windows NT [\d.]+|Android [\d.]+|iPhone OS [\d_]+/);
  const os = osMatch ? osMatch[0].replace(/_/g, '.') : '?';

  const decodedCity = decodeURIComponent(city);

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Notification channel not configured' });
  }

  const submittedAt = new Date().toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  // Determine emoji from event
  const emoji = event.includes('scroll') ? '📜'
              : event.includes('dwell')  ? '⏱️'
              : event.includes('cta')    ? '🎯'
              : '👀';

  const slackPayload = {
    text: `${emoji} georank24 방문 — ${decodedCity}, ${country} (${event})`,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `${emoji} *georank24.com 방문자 — ${event}*` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*위치*\n${decodedCity}${region ? ', ' + region : ''} (${country})` },
          { type: 'mrkdwn', text: `*기기*\n${browser} · ${isMobile ? '📱 Mobile' : '💻 Desktop'}` },
          { type: 'mrkdwn', text: `*페이지*\n\`${path}\`` },
          { type: 'mrkdwn', text: `*Referrer*\n${referrer.length > 60 ? referrer.slice(0, 60) + '…' : referrer}` },
        ],
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `${submittedAt} KST · ${os}` },
        ],
      },
    ],
  };

  try {
    const slackRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
    });
    if (!slackRes.ok) {
      console.error('Slack visit-track error:', slackRes.status, await slackRes.text());
      return res.status(502).json({ error: 'Notification dispatch failed' });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('track-visit error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
