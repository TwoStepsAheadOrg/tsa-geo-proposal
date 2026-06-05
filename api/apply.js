// Vercel Serverless Function: /api/apply
// Receives job-application submissions from the Plurank careers page (/hr)
// and posts to Slack via Incoming Webhook.
// Required env var: SLACK_WEBHOOK_URL (already configured for /api/contact)

const POSITION_LABELS = {
  'engineer': '⚙️ 소프트웨어 / 데이터 엔지니어',
  'marketer': '📣 그로스 / 콘텐츠 마케터',
  'other':    '✷ 기타 / 자유 지원',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body && typeof req.body === 'object') ? req.body : {};
  const {
    name = '',
    email = '',
    position = '',
    link = '',
    resumeUrl = '',
    q1 = '',
    q2 = '',
    q3 = '',
    source = '',
  } = body;

  if (!name || !email || !position || !q1 || !q2 || !q3) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Notification channel not configured' });
  }

  const positionLabel = POSITION_LABELS[position] || position;

  const submittedAt = new Date().toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  const fields = [
    { type: 'mrkdwn', text: `*지원 포지션*\n${positionLabel}` },
    { type: 'mrkdwn', text: `*이름*\n${name}` },
    { type: 'mrkdwn', text: `*이메일*\n${email}` },
  ];
  if (link) fields.push({ type: 'mrkdwn', text: `*링크 (포트폴리오/GitHub/LinkedIn)*\n${link}` });
  if (resumeUrl) fields.push({ type: 'mrkdwn', text: `*첨부 지원서*\n<${resumeUrl}|파일 열기>` });
  fields.push({ type: 'mrkdwn', text: `*지원 시각*\n${submittedAt} KST` });

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `🧑‍💻 Plurank 채용 지원 — ${name}`, emoji: true },
    },
    { type: 'section', fields },
  ];

  const QA = [
    ['Q1. 스스로 정의해 끝까지 끌고 간 일', q1],
    ['Q2. 새 도구·AI로 빠르게 배워 만든 경험', q2],
    ['Q3. 6~12개월 안에 만들고 싶은 변화', q3],
  ];
  for (const [q, a] of QA) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*${q}*\n${String(a).slice(0, 2800)}` },
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      { type: 'mrkdwn', text: `plurank.com/hr · position: \`${position}\`${source ? ` · ${source}` : ''}` },
    ],
  });

  const slackPayload = {
    text: `🧑‍💻 Plurank 채용 지원 — ${positionLabel} · ${name}`,
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
