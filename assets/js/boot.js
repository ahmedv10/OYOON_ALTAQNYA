/* Runs before first paint: pick the language (URL ?lang= › saved choice › browser)
   and set lang/dir so Arabic visitors never see a flash of the English LTR layout. */
(function () {
  var root = document.documentElement;
  var lang = null;

  root.classList.remove('no-js');
  root.classList.add('js');

  try {
    var fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl === 'ar' || fromUrl === 'en') {
      lang = fromUrl;
      window.localStorage.setItem('te-lang', fromUrl);
    } else {
      lang = window.localStorage.getItem('te-lang');
    }
  } catch (e) {
    /* storage can be unavailable (private mode, blocked cookies) */
  }

  if (lang !== 'ar' && lang !== 'en') {
    lang = /^ar\b/i.test(navigator.language || '') ? 'ar' : 'en';
  }

  if (lang === 'ar') {
    root.lang = 'ar';
    root.dir = 'rtl';
    root.classList.add('i18n-pending');
  }

  window.__TE_LANG = lang;

  /* If main.js never runs (blocked or failed), drop the JS-only states so content still shows. */
  window.setTimeout(function () {
    if (!window.__TE_READY) {
      root.classList.remove('js', 'i18n-pending');
      root.classList.add('no-js');
    }
  }, 4000);
})();
