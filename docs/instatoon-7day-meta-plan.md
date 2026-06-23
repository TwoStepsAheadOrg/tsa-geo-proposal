# Plurank Insta Toon 7일 Meta 광고 테스트 계획

작성일: 2026-06-11

## 결론

업종별 이미지 카드 10개와 영상 카드 1개를 각각 별도 광고로 분리해 7일 테스트한다.

각 광고는 일예산 약 5,000원으로 시작한다. 총 일예산은 약 55,000원이며, 7일 총 집행비는 약 385,000원 수준이다. 업종별로 소재 반응과 상담 전환 의도를 분리해서 볼 수 있는 구조다.

## 캠페인 구조

- 기간: 7일
- 총 예산: 약 385,000원
- 일 예산: 약 55,000원
- 캠페인 수: 1개
- 광고 세트 수: 11개
- 광고 수: 11개
- 광고 형식: 단일 이미지 10개 + 단일 영상 1개
- 소재 구성: 업종별 이미지 카드 10장 + 쇼츠·릴스 영상화 안내 영상 1개
- 상태: API 생성 시 먼저 `PAUSED`, 검수 후 `ACTIVE`

## 권장 목적

1차는 `Traffic` 또는 `Messages` 중 하나를 선택한다.

- 랜딩페이지 검증 중심: `Traffic`
- 상담 시작 중심: `Messages`

랜딩페이지와 개인정보처리방침이 배포되면 `Traffic`으로 시작해도 된다. Meta Pixel 전환 이벤트가 아직 명확하지 않다면 첫 주부터 웹사이트 전환 최적화로 가는 것은 권장하지 않는다.

## 광고 구성

### Ad 1. 식당

- 소재: `/assets/content/instatoon/restaurant-instatoon.png`
- 메시지: 메뉴 소개만으로는 방문 이유가 부족합니다. 손님이 저장하는 이야기형 콘텐츠로 바꾸세요.
- 링크: `https://www.plurank.com/content/insta-toon?utm_source=meta&utm_medium=paid_social&utm_campaign=plurank_instatoon_7d_test&utm_content=card_restaurant&utm_term=kr_broad_24_55&plurank_offer=instatoon_4w15_190&creative_type=card_news&industry=restaurant#consult`

### Ad 2. 카페

- 소재: `/assets/content/instatoon/cafe-instatoon.png`
- 메시지: 예쁜 사진은 많지만 기억나는 카페는 적습니다. 공간과 메뉴를 저장되는 이야기로 바꾸세요.
- 링크: `https://www.plurank.com/content/insta-toon?utm_source=meta&utm_medium=paid_social&utm_campaign=plurank_instatoon_7d_test&utm_content=card_cafe&utm_term=kr_broad_24_55&plurank_offer=instatoon_4w15_190&creative_type=card_news&industry=cafe#consult`

### Ad 3. 병원

- 소재: `/assets/content/instatoon/clinic-instatoon.png`
- 메시지: 어려운 진료 설명을 고객이 이해하는 장면으로 바꾸면 상담 전 신뢰가 먼저 생깁니다.
- 링크: `https://www.plurank.com/content/insta-toon?utm_source=meta&utm_medium=paid_social&utm_campaign=plurank_instatoon_7d_test&utm_content=card_clinic&utm_term=kr_broad_24_55&plurank_offer=instatoon_4w15_190&creative_type=card_news&industry=clinic#consult`

### Ad 4. 치과

- 소재: `/assets/content/instatoon/dental-instatoon.png`
- 메시지: 치료 전 두려움을 설명 콘텐츠로 낮추세요. 환자가 미루는 이유를 먼저 풀어줍니다.
- 링크: `https://www.plurank.com/content/insta-toon?utm_source=meta&utm_medium=paid_social&utm_campaign=plurank_instatoon_7d_test&utm_content=card_dental&utm_term=kr_broad_24_55&plurank_offer=instatoon_4w15_190&creative_type=card_news&industry=dental#consult`

### Ad 5. 변호사

- 소재: `/assets/content/instatoon/lawyer-instatoon.png`
- 메시지: 법률 서비스는 비교가 어렵습니다. 사례와 절차를 인스타툰으로 먼저 이해시키세요.
- 링크: `https://www.plurank.com/content/insta-toon?utm_source=meta&utm_medium=paid_social&utm_campaign=plurank_instatoon_7d_test&utm_content=card_lawyer&utm_term=kr_broad_24_55&plurank_offer=instatoon_4w15_190&creative_type=card_news&industry=lawyer#consult`

### Ad 6. 세무사

- 소재: `/assets/content/instatoon/tax-instatoon.png`
- 메시지: 세금 이슈는 필요할 때만 찾습니다. 저장되는 콘텐츠로 먼저 떠오르는 세무사가 되세요.
- 링크: `https://www.plurank.com/content/insta-toon?utm_source=meta&utm_medium=paid_social&utm_campaign=plurank_instatoon_7d_test&utm_content=card_tax&utm_term=kr_broad_24_55&plurank_offer=instatoon_4w15_190&creative_type=card_news&industry=tax#consult`

### Ad 7. 동물병원

- 소재: `/assets/content/instatoon/vet-instatoon.png`
- 메시지: 보호자는 증상보다 불안을 먼저 검색합니다. 병원의 설명을 저장되는 콘텐츠로 바꾸세요.
- 링크: `https://www.plurank.com/content/insta-toon?utm_source=meta&utm_medium=paid_social&utm_campaign=plurank_instatoon_7d_test&utm_content=card_vet&utm_term=kr_broad_24_55&plurank_offer=instatoon_4w15_190&creative_type=card_news&industry=vet#consult`

### Ad 8. 학원

- 소재: `/assets/content/instatoon/academy-instatoon.png`
- 메시지: 학부모는 커리큘럼보다 먼저 묻습니다. 우리 아이에게 맞을지 장면으로 보여주세요.
- 링크: `https://www.plurank.com/content/insta-toon?utm_source=meta&utm_medium=paid_social&utm_campaign=plurank_instatoon_7d_test&utm_content=card_academy&utm_term=kr_broad_24_55&plurank_offer=instatoon_4w15_190&creative_type=card_news&industry=academy#consult`

### Ad 9. 부동산

- 소재: `/assets/content/instatoon/realestate-instatoon.png`
- 메시지: 매물 사진만으로는 문의 이유가 부족합니다. 입지와 체크포인트를 이야기로 보여주세요.
- 링크: `https://www.plurank.com/content/insta-toon?utm_source=meta&utm_medium=paid_social&utm_campaign=plurank_instatoon_7d_test&utm_content=card_realestate&utm_term=kr_broad_24_55&plurank_offer=instatoon_4w15_190&creative_type=card_news&industry=realestate#consult`

### Ad 10. 뷰티

- 소재: `/assets/content/instatoon/beauty-instatoon.png`
- 메시지: 스타일 사진은 많지만 선택 기준은 잘 안 보입니다. 상담 포인트를 인스타툰으로 보여주세요.
- 링크: `https://www.plurank.com/content/insta-toon?utm_source=meta&utm_medium=paid_social&utm_campaign=plurank_instatoon_7d_test&utm_content=card_beauty&utm_term=kr_broad_24_55&plurank_offer=instatoon_4w15_190&creative_type=card_news&industry=beauty#consult`

### Ad 11. 쇼츠·릴스 영상화

- 소재: `/assets/content/videos/restaurant-instatoon-shorts.mp4`
- 메시지: 만든 인스타툰은 쇼츠·릴스 광고 소재로도 확장할 수 있습니다. 영상화 비용은 상담 후 안내드립니다.
- 링크: `https://www.plurank.com/content/youtube-shorts?utm_source=meta&utm_medium=paid_social&utm_campaign=plurank_instatoon_7d_test&utm_content=shorts_video&utm_term=kr_broad_24_55&plurank_offer=instatoon_4w15_190&creative_type=video&industry=shorts_common#consult`

## Primary Text

긴 설명은 고객이 끝까지 읽지 않습니다.

식당, 병원, 변호사, 세무사, 동물병원처럼 설명이 필요한 업종이라면 먼저 이해되는 콘텐츠가 필요합니다.

Plurank는 업종별 인스타툰을 기획하고, 필요하면 쇼츠·릴스 영상 광고 소재까지 이어서 제작합니다.

기본 인스타툰 4주 15편 190만원.
쇼츠·릴스 영상화는 상담 후 안내드립니다.

## Headline

업종별 인스타툰 제작 상담

## Description

4주 15편 190만원부터, 영상화는 상담 후 안내

## CTA

상담 신청하기

## 7일 후 판단 기준

- 광고별 클릭률
- 랜딩페이지 조회수
- 상담 폼 제출 수
- 메시지 시작 수
- 업종별 저장, 공유, 댓글 반응
- 영상 광고 3초 조회율 및 25% 조회율

## 의사결정

- 이미지 카드 클릭이 높고 영상 카드 반응이 낮다: 2주차는 업종별 이미지 카드 확장
- 영상 카드 조회율이 높다: 이긴 업종 1개를 쇼츠·릴스 영상으로 추가 제작
- 병원/변호사/세무사 반응이 높다: 전문직 전용 문구와 상세 랜딩 분리
- 식당/동물병원 반응이 높다: 저장형 FAQ·후기형 인스타툰으로 확장
