/* Plurank 광고 랜딩 퍼널 트래킹 (자체 비콘, Meta 픽셀 없음)
 * - 첫방문 UTM + visitor_id를 localStorage에 고정(first-touch)
 * - 페이지 로드 시 view 비콘을 plurank-server로 전송
 * - [data-content-form] 상담 폼에 attribution을 hidden input으로 주입
 *   → 폼이 /api/contact로 제출될 때 함께 실려가고, contact.js가 conversion으로 forward
 */
(function () {
  var TRACK = 'https://api.plurank.com/api/plurank/track';
  var LS_VID = 'plk_vid';
  var LS_UTM = 'plk_first_utm';

  function uuid() {
    try { return crypto.randomUUID(); }
    catch (e) { return 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10); }
  }
  function qs(name) {
    try { return new URLSearchParams(location.search).get(name) || ''; }
    catch (e) { return ''; }
  }

  // visitor_id — first-touch 고정
  var vid = '';
  try { vid = localStorage.getItem(LS_VID) || ''; } catch (e) {}
  if (!vid) { vid = uuid(); try { localStorage.setItem(LS_VID, vid); } catch (e) {} }

  // UTM — 이번 방문에 있으면 갱신(첫방문 고정), 없으면 저장된 first-touch 사용
  var cur = {
    utmSource: qs('utm_source'), utmMedium: qs('utm_medium'),
    utmCampaign: qs('utm_campaign'), utmContent: qs('utm_content'),
    utmTerm: qs('utm_term'), fbclid: qs('fbclid')
  };
  var hasCur = Object.keys(cur).some(function (k) { return cur[k]; });
  var utm;
  try {
    if (hasCur) { utm = cur; localStorage.setItem(LS_UTM, JSON.stringify(cur)); }
    else { utm = JSON.parse(localStorage.getItem(LS_UTM) || 'null') || cur; }
  } catch (e) { utm = cur; }

  var page = location.pathname;

  function beacon(url, data) {
    try {
      var body = JSON.stringify(data);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }));
      } else {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: body, keepalive: true });
      }
    } catch (e) {}
  }

  // 1) view 비콘
  beacon(TRACK + '/landing-view', {
    page: page, visitorId: vid, referrer: document.referrer || '',
    utmSource: utm.utmSource, utmMedium: utm.utmMedium, utmCampaign: utm.utmCampaign,
    utmContent: utm.utmContent, utmTerm: utm.utmTerm, fbclid: utm.fbclid
  });

  // 2) 상담 폼에 attribution 주입 (FormData로 자동 전송됨)
  function addHidden(form, name, value) {
    if (!value) return;
    var existing = form.querySelector('input[name="' + name + '"]');
    if (existing) { existing.value = value; return; }
    var i = document.createElement('input');
    i.type = 'hidden'; i.name = name; i.value = value;
    form.appendChild(i);
  }
  var forms = document.querySelectorAll('[data-content-form]');
  for (var n = 0; n < forms.length; n++) {
    var f = forms[n];
    addHidden(f, 'visitorId', vid);
    addHidden(f, 'page', page);
    addHidden(f, 'utmSource', utm.utmSource);
    addHidden(f, 'utmMedium', utm.utmMedium);
    addHidden(f, 'utmCampaign', utm.utmCampaign);
    addHidden(f, 'utmContent', utm.utmContent);
    addHidden(f, 'utmTerm', utm.utmTerm);
    addHidden(f, 'fbclid', utm.fbclid);
  }
})();
