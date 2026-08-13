import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/**
 * 2026-08-13 랜딩 전면 개편(AI 검색 분석 포지셔닝) 기준 산출물 검증.
 * 소스는 plurank_landing 리포이며, 여기서는 배포되는 프리렌더 결과물을 본다.
 */
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const ko = await readFile(new URL('../ko.html', import.meta.url), 'utf8');

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

test('핵심 섹션 앵커가 모두 있다', () => {
  for (const id of ['diagnosis', 'metrics', 'features', 'coverage', 'naver', 'prediction', 'method', 'clients', 'contact', 'faq']) {
    assert.match(html, new RegExp(`id="${id}"`), `누락된 섹션: ${id}`);
  }
});

test('무료 진단 게이트가 렌더된다', () => {
  assert.match(html, /무료 진단 신청/);
  assert.match(html, /7일치 관측/);
});

test('네이버 커버리지를 명시한다', () => {
  assert.match(html, /네이버 AI 브리핑/);
});

test('예측 모델 수치에 검증 조건이 병기돼 있다', () => {
  assert.match(html, /8\.6%/);
  assert.match(html, /홀드아웃/);
  assert.match(html, /업종·언어·질의 유형에 따라/);
});

test('GEO는 풀네임을 병기한다 (지역 혼동 방지)', () => {
  assert.match(html, /GEO\(생성형 엔진 최적화\)/);
});

test('구조화 데이터 3종이 들어 있다 (peec.ai 결함 공략)', () => {
  assert.match(html, /"@type":\s*"Organization"/);
  assert.match(html, /"@type":\s*"SoftwareApplication"/);
  assert.match(html, /"@type":\s*"FAQPage"/);
});

test('FAQ 6문항이 JSON-LD와 본문에 모두 있다', () => {
  assert.equal((html.match(/<details/g) || []).length, 6);
  assert.equal((html.match(/"@type":\s*"Question"/g) || []).length, 6);
});

test('법인 정보와 통신판매업신고가 푸터에 있다', () => {
  assert.match(html, /주식회사 투스텝스어헤드/);
  assert.match(html, /319-87-03770/);
  assert.match(html, /2025-서울강남-05963/);
});

test('트래킹과 canonical이 보존돼 있다', () => {
  assert.match(html, /AW-18267771264/);
  assert.match(html, /_vercel\/insights\/script\.js/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.plurank\.com\/">/);
});

test('고객사는 기공개 실명만 노출한다', () => {
  assert.match(html, /어센트코리아/);
  // 익명 유지 대상이 실명으로 새어나오지 않아야 한다
  for (const secret of ['라움', 'raum-clinic', '삼성']) {
    assert.equal(html.includes(secret), false, `노출되면 안 되는 값: ${secret}`);
  }
});

test('ko.html이 index.html과 동일하다', () => {
  assert.equal(ko, html);
});
