(function () {
  var COOKIE_NAME = 'plurank_lang';
  var ONE_YEAR = 60 * 60 * 24 * 365;
  var languageByPath = {
    '/': 'ko',
    '/index.html': 'ko',
    '/ko.html': 'ko',
    '/en': 'en',
    '/ja': 'ja'
  };

  function setLanguage(lang) {
    if (!lang) return;
    var secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = COOKIE_NAME + '=' + encodeURIComponent(lang) + '; Path=/; Max-Age=' + ONE_YEAR + '; SameSite=Lax' + secure;
  }

  setLanguage(languageByPath[window.location.pathname]);

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;

    var url = new URL(link.getAttribute('href'), window.location.href);
    if (url.origin !== window.location.origin) return;

    setLanguage(languageByPath[url.pathname]);
  });
})();
