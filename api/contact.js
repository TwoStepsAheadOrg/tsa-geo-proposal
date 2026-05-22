// Vercel Serverless Function: /api/contact
// Receives form submissions from Plurank (Hero modal & #contact section)
// and posts to Slack via Incoming Webhook.
// Required env var: SLACK_WEBHOOK_URL

const TYPE_LABELS = {
  'demo':          { emoji: '🤝', title: '데모 신청' },
  'brand-brochure': { emoji: '🎯', title: '브랜드 Full 스펙 마케팅 소개서 요청' },
  'agency-brochure': { emoji: '📊', title: '에이전시 GEO 데이터 제휴 소개서 요청' },
  'agency-demo':   { emoji: '🤝', title: '에이전시 데모 요청' },
  'data-catalog':  { emoji: '📊', title: '데이터 카탈로그 문의' },
  'api-key':       { emoji: '🔑', title: 'API Key 요청' },
  'diagnostic':    { emoji: '🎯', title: '무료 진단 신청' },
  'general':       { emoji: '✉️', title: '일반 문의' },
};

const PERSONA_LABELS = {
  'agency':  '🏢 마케팅 에이전시',
  'brand':   '🎯 브랜드 인하우스 (마케팅 담당자)',
  'developer': '⚙️ 개발자 / AI 엔지니어',
  'other':   '기타',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body && typeof req.body === 'object') ? req.body : {};
  const {
    company,
    url = '',
    email,
    message = '',
    source = '',
    type = 'diagnostic',
    name = '',
    persona = '',
    slot = '',
    service = '',
    request = '',
  } = body;

  if (!company || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Notification channel not configured' });
  }

  const t = TYPE_LABELS[type] || TYPE_LABELS.general;

  const submittedAt = new Date().toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  const fields = [];
  if (persona && PERSONA_LABELS[persona]) {
    fields.push({ type: 'mrkdwn', text: `*신청자 유형*\n${PERSONA_LABELS[persona]}` });
  }
  fields.push({ type: 'mrkdwn', text: `*회사명*\n${company}` });
  fields.push({ type: 'mrkdwn', text: `*이메일*\n${email}` });
  if (name)  fields.push({ type: 'mrkdwn', text: `*담당자*\n${name}` });
  if (url)   fields.push({ type: 'mrkdwn', text: `*URL / 도메인*\n${url}` });
  if (service) fields.push({ type: 'mrkdwn', text: `*관심 서비스*\n${service}` });
  if (request) fields.push({ type: 'mrkdwn', text: `*요청 자료*\n${request}` });
  if (slot)  fields.push({ type: 'mrkdwn', text: `*희망 미팅 시간*\n${slot}` });
  fields.push({ type: 'mrkdwn', text: `*신청 시각*\n${submittedAt} KST` });

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `${t.emoji} Plurank · ${t.title}`, emoji: true },
    },
    { type: 'section', fields },
  ];

  if (message) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*문의 내용*\n${message.slice(0, 1800)}` },
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      { type: 'mrkdwn', text: `plurank.com · type: \`${type}\`${source ? ` · ${source}` : ''}` },
    ],
  });

  const slackPayload = {
    text: `${t.emoji} Plurank ${t.title} — ${company}`,
    blocks,
  };

  try {
    const slackRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
    });

    if (!slackRes.ok) {
      const txt = await slackRes.text();
      console.error('Slack webhook error:', slackRes.status, txt);
      return res.status(502).json({ error: 'Notification dispatch failed' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Notification error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
