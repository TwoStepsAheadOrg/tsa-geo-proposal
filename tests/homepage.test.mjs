import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("homepage keeps the production AI Discovery AdTech positioning", () => {
  assert.match(html, /AI Discovery AdTech/);
  assert.match(html, /AI 검색 시대의 마케팅,/);
  assert.match(html, /Plurank가 끝까지 맡습니다\./);
  assert.match(html, /질문을 찾고,\s*AI가 참고할 출처를 만들고/);
  assert.match(html, /브랜드가 발견되고 문의로 이어지는 흐름을 운영합니다\./);
});

test("homepage shows the Playad-inspired hero motion layer on the existing scene", () => {
  for (const label of ["hero-source-rail", "hero-product-loop", "splitHeroHeading", "setupScrollMotion", "motion-enabled", "data-parallax-layer"]) {
    assert.match(html, new RegExp(label));
  }
  for (const source of ["ChatGPT", "Gemini", "Perplexity", "YouTube", "Instagram", "Reddit", "Quora"]) {
    assert.match(html, new RegExp(source));
  }
  assert.match(html, /id="discovery-canvas"/);
  assert.match(html, /Live Signal Graph/);
});

test("homepage makes Plurank's execution loop visible near the top", () => {
  for (const label of ["질문 분석", "출처 설계", "콘텐츠 생성", "채널 배포", "답변 추적", "리드 확인"]) {
    assert.match(html, new RegExp(label));
  }
  for (const label of ["Question Map", "Content Engine", "Distribution", "Plurank Lead", "End-to-End Ops"]) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /분석에서 끝나지 않고,\s*AI가 참고할 콘텐츠를 실제로 만듭니다\./);
});

test("homepage splits CTA and service guide by brand and agency", () => {
  for (const label of ["브랜드 AI 마케팅 맡기기", "에이전시 GEO 데이터 제휴"]) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /data-pl-open="brand"/);
  assert.match(html, /data-pl-open="agency"/);
  assert.match(html, /브랜드용 상세 소개서 받기/);
  assert.match(html, /에이전시용 상세 소개서 받기/);
  assert.match(html, /name="type" value="brand-brochure"/);
  assert.match(html, /name="type" value="agency-brochure"/);
});

test("homepage surfaces portfolio and outcome proof", () => {
  for (const company of ["Ascent Korea", "Samsung 계열", "강남 의료기관 3곳", "Tokuyama Shoji", "Kozy.care"]) {
    assert.match(html, new RegExp(company));
  }
  for (const proof of ["15\\+", "30M\\+", "12", "Lead"]) {
    assert.match(html, new RegExp(proof));
  }
});
