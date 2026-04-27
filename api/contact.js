// Vercel Serverless Function: /api/contact
// Receives diagnostic request from CTA form and posts to Slack via Incoming Webhook.
// Required env var: SLACK_WEBHOOK_URL

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { company, url, email, source } = (req.body && typeof req.body === 'object') ? req.body : {};

  if (!company || !url || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Notification channel not configured' });
  }

  const submittedAt = new Date().toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  const slackPayload = {
    text: `🎯 GeoRank24 무료 진단 신청 — ${company}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🎯 GeoRank24 무료 진단 신청', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*회사명*\n${company}` },
          { type: 'mrkdwn', text: `*이메일*\n${email}` },
          { type: 'mrkdwn', text: `*콘텐츠 URL / 도메인*\n${url}` },
          { type: 'mrkdwn', text: `*신청 시각*\n${submittedAt} KST` },
        ],
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `georank24.com${source ? ` · ${source}` : ''}` },
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
      const text = await slackRes.text();
      console.error('Slack webhook error:', slackRes.status, text);
      return res.status(502).json({ error: 'Notification dispatch failed' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Notification error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
