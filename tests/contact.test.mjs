import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../api/contact.js';

const audit = {
  company: 'example.com', url: 'example.com', email: 'audit@example.com',
  name: '테스트 담당자', phone: '+82 10-1234-5678',
  type: 'diagnostic', source: 'plurank-landing-hero-gate',
};

async function submit(body) {
  const res = {
    setHeader() {},
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
  await handler({ method: 'POST', body }, res);
  return res;
}

function notifications(t, ok = true) {
  const previous = process.env.SLACK_WEBHOOK_URL;
  process.env.SLACK_WEBHOOK_URL = 'https://slack.invalid/test';
  t.after(() => {
    if (previous === undefined) delete process.env.SLACK_WEBHOOK_URL;
    else process.env.SLACK_WEBHOOK_URL = previous;
  });
  return t.mock.method(globalThis, 'fetch', async () => ({ ok, status: ok ? 200 : 500, text: async () => 'test response' }));
}

test('seven-day audit rejects missing, malformed, or oversized contact details before dispatch', async (t) => {
  const fetch = notifications(t);
  for (const invalid of [
    { name: '' }, { name: '   ' }, { name: null }, { name: 'x'.repeat(101) },
    { phone: '' }, { phone: '   ' }, { phone: 1012345678 },
    { phone: 'call me' }, { phone: '123' }, { phone: '1234567890123456' },
    { phone: '+82 10-1234-5678 ext 42' },
  ]) {
    const res = await submit({ ...audit, ...invalid });
    assert.equal(res.statusCode, 400, JSON.stringify(invalid));
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('domestic and international numbers are included in Slack with the contact name', async (t) => {
  const fetch = notifications(t);
  for (const phone of ['010-1234-5678', '+1 (202) 555-0123', '+81 90-1234-5678']) {
    const before = fetch.mock.callCount();
    const res = await submit({ ...audit, phone });
    assert.equal(res.statusCode, 200);
    const [url, options] = fetch.mock.calls[before].arguments;
    assert.equal(url, 'https://slack.invalid/test');
    const payload = JSON.parse(options.body);
    const fields = payload.blocks.flatMap((block) => block.fields || []).map((field) => field.text);
    assert.ok(fields.includes(`*담당자*\n${audit.name}`));
    assert.ok(fields.includes(`*연락처*\n${phone}`));
    assert.ok(fields.includes(`*이메일*\n${audit.email}`));
  }
});

test('attribution and contact details fit Slack section field limits', async (t) => {
  const fetch = notifications(t);
  const res = await submit({ ...audit, persona: 'brand', service: 'audit', request: 'report', slot: 'morning', pageUrl: 'https://plurank.com/', referrer: 'https://example.com/', utm_source: 'test' });
  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(fetch.mock.calls[0].arguments[1].body);
  const sections = payload.blocks.filter((block) => block.fields);
  assert.ok(sections.length > 1);
  assert.ok(sections.every((section) => section.fields.length <= 10));
});

test('other inquiry forms retain their existing required fields', async (t) => {
  notifications(t);
  const res = await submit({ company: 'Example', email: 'audit@example.com', type: 'general' });
  assert.equal(res.statusCode, 200);
});

test('failed notification is not reported as a successful audit request', async (t) => {
  const fetch = notifications(t, false);
  t.mock.method(console, 'error', () => {});
  const res = await submit(audit);
  assert.equal(res.statusCode, 502);
  assert.equal(fetch.mock.callCount(), 1);
});
