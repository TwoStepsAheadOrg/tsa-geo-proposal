import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/**
 * 2026-08-13 랜딩 개편(AI 검색 분석 포지셔닝) + 확장 페이지 기준 산출물 검증.
 * 소스는 plurank_landing 리포이며, 여기서는 배포되는 프리렌더 결과물을 본다.
 */
const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');

const html = await read('index.html');
const ko = await read('ko.html');
const en = await read('en/index.html');
const ja = await read('ja/index.html');
const pricing = await read('pricing.html');
const TRACKER_SLUGS = [
  'chatgpt-tracker',
  'naver-ai-briefing-tracker',
  'perplexity-tracker',
  'gemini-tracker',
  'claude-tracker',
  'google-ai-overview-tracker',
];
const trackers = Object.fromEntries(
  await Promise.all(TRACKER_SLUGS.map(async (s) => [s, await read(`tracker/${s}.html`)])),
);

// ── 홈 ──────────────────────────────────────────────
test('히어로가 새 포지셔닝을 담고 있다', () => {
  assert.match(html, /마케팅팀을 위한/);
  assert.match(html, /AI 검색 분석/);
  assert.match(html, /가시성·포지션·감성/);
});

test('구 포지셔닝(콘텐츠 발행 도구) 문구가 남아 있지 않다', () => {
  for (const stale of ['다채널 콘텐츠를 발행하는 도구', 'AI 최적화 콘텐츠를 발행', '툰에이전트', 'ToonAgent']) {
    assert.equal(html.includes(stale), false, `잔존 문구: ${stale}`);
  }
});

test('5대 검증 렌즈 섹션이 모두 존재한다', () => {
  // Customer/Problem
  assert.match(html, /id="problem"/);
  assert.match(html, /ChatGPT에 물어보면/);
  assert.match(html, /이런 팀이 씁니다/);
  // Demand — 계약 형태를 명시해 지불 근거를 보인다
  assert.match(html, /연간 엔터프라이즈 계약/);
  assert.match(html, /화이트라벨 재판매/);
  // Solution — 대안 비교
  assert.match(html, /id="alternatives"/);
  assert.match(html, /GEO 대행사/);
  // Execution — 반복·개선 사이클
  assert.match(html, /모델 재학습·검증/);
});

test('핵심 섹션 앵커가 모두 있다', () => {
  for (const id of ['problem', 'diagnosis', 'metrics', 'features', 'coverage', 'alternatives', 'naver', 'prediction', 'method', 'clients', 'contact', 'faq']) {
    assert.match(html, new RegExp(`id="${id}"`), `누락된 섹션: ${id}`);
  }
});

test('예측 모델 수치에 검증 조건이 병기돼 있다', () => {
  assert.match(html, /8\.6%/);
  assert.match(html, /홀드아웃/);
  assert.match(html, /업종·언어·질의 유형에 따라/);
});

test('GEO는 풀네임을 병기한다 (지역 혼동 방지)', () => {
  assert.match(html, /GEO\(생성형 엔진 최적화\)/);
});

test('고객사는 기공개 실명만 노출한다', () => {
  assert.match(html, /어센트코리아/);
  for (const secret of ['라움', 'raum-clinic', '삼성']) {
    assert.equal(html.includes(secret), false, `노출되면 안 되는 값: ${secret}`);
  }
});

test('법인 정보와 통신판매업신고가 푸터에 있다', () => {
  assert.match(html, /주식회사 투스텝스어헤드/);
  assert.match(html, /319-87-03770/);
  assert.match(html, /2025-서울강남-05963/);
});

test('ko.html이 index.html과 동일하다', () => {
  assert.equal(ko, html);
});

// ── 다국어 ──────────────────────────────────────────
test('EN/JA가 각자 언어로 렌더된다', () => {
  assert.match(en, /<html lang="en"/);
  assert.match(en, /AI search analytics/);
  assert.match(ja, /<html lang="ja"/);
  assert.match(ja, /AI検索アナリティクス/);
});

test('EN/JA도 문제·대안 섹션을 갖는다 (한국어판과 동일 구조)', () => {
  for (const [name, doc] of [['en', en], ['ja', ja]]) {
    assert.match(doc, /id="problem"/, `${name}: problem 누락`);
    assert.match(doc, /id="alternatives"/, `${name}: alternatives 누락`);
  }
});

test('언어별 canonical이 자기 URL이다', () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.plurank\.com\/">/);
  assert.match(en, /<link rel="canonical" href="https:\/\/www\.plurank\.com\/en">/);
  assert.match(ja, /<link rel="canonical" href="https:\/\/www\.plurank\.com\/ja">/);
});

// ── 요금제 ──────────────────────────────────────────
test('요금제 페이지에 4개 티어와 금액이 있다', () => {
  for (const t of ['무료 진단', '스타터', '그로스', '엔터프라이즈']) {
    assert.match(pricing, new RegExp(t), `티어 누락: ${t}`);
  }
  assert.match(pricing, /49만원/);
  assert.match(pricing, /129만원/);
});

test('요금제 근거 문서의 내부 정보가 랜딩에 새지 않았다', () => {
  for (const internal of ['내부 하한', '리셀 할인', '가격 책정 근거', '마진이 남지']) {
    assert.equal(pricing.includes(internal), false, `내부 정보 노출: ${internal}`);
  }
});

// ── 엔진별 트래커 ───────────────────────────────────
test('트래커 6종이 모두 생성됐고 canonical이 각자 URL이다', () => {
  for (const slug of TRACKER_SLUGS) {
    const doc = trackers[slug];
    assert.match(doc, new RegExp(`<link rel="canonical" href="https://www\\.plurank\\.com/tracker/${slug}">`), slug);
  }
});

test('트래커는 템플릿 복제가 아니라 엔진별 고유 내용이다', () => {
  const h1s = TRACKER_SLUGS.map((s) => (trackers[s].match(/<h1[^>]*>(.*?)<\/h1>/s) || [])[1] || s);
  assert.equal(new Set(h1s).size, TRACKER_SLUGS.length, '중복된 H1이 있습니다');
  assert.match(trackers['naver-ai-briefing-tracker'], /네이버/);
  assert.match(trackers['chatgpt-tracker'], /ChatGPT/);
});

// ── 공통 ────────────────────────────────────────────
test('전 페이지에 구조화 데이터 3종이 들어 있다 (peec.ai 결함 공략)', () => {
  const all = { index: html, en, ja, pricing, ...trackers };
  for (const [name, doc] of Object.entries(all)) {
    assert.match(doc, /"@type":\s*"Organization"/, `${name}: Organization 누락`);
    assert.match(doc, /"@type":\s*"SoftwareApplication"/, `${name}: SoftwareApplication 누락`);
    assert.match(doc, /"@type":\s*"FAQPage"/, `${name}: FAQPage 누락`);
  }
});

test('전 페이지에 트래킹이 보존돼 있다', () => {
  for (const [name, doc] of Object.entries({ index: html, en, ja, pricing, ...trackers })) {
    assert.match(doc, /AW-18267771264/, `${name}: gtag 누락`);
    assert.match(doc, /_vercel\/insights\/script\.js/, `${name}: insights 누락`);
  }
});
