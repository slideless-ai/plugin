/* ─────────────────────────────────────────────────────────────────────
   Shared i18n + cross-page nav for the three-page deck.

   Pages declare their dictionary in a global `window.I18N = { en: {...},
   fr: {...} }` before loading this script (defer is fine — this script
   waits for DOMContentLoaded).

   Pages also embed their EN/FR-aware language toggle button as
   <button id="lang-switch">…<span data-lang-opt="en">EN</span>
   <span data-lang-opt="fr">FR</span></button>.

   Active page is marked at the markup level via
   <a class="miniNav-tab is-current" data-page="article">…</a>
   on whichever tab matches the file. The JS doesn't pick — keeps it
   trivially diff-able.

   Language is persisted in localStorage under the SAME key for all three
   pages so the user's choice survives navigation.
   ───────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var LS_KEY = 'syndicable.article.lang';

  function safeGetLang() {
    try {
      var saved = window.localStorage.getItem(LS_KEY);
      if (saved === 'en' || saved === 'fr') return saved;
    } catch (_) {}
    return 'fr';
  }

  function applyLanguage(lang) {
    if (lang !== 'en' && lang !== 'fr') lang = 'fr';
    var I18N = window.I18N || {};
    var dict = I18N[lang] || {};

    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('data-lang', lang);

    var nodes = document.querySelectorAll('[data-i18n-key]');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var key = n.getAttribute('data-i18n-key');
      if (!Object.prototype.hasOwnProperty.call(dict, key)) continue;
      var val = dict[key];
      var attr = n.getAttribute('data-i18n-key-attr');
      if (attr) {
        n.setAttribute(attr, val);
      } else {
        n.innerHTML = val;
      }
    }

    var sw = document.getElementById('lang-switch');
    if (sw) sw.setAttribute('aria-checked', lang === 'en' ? 'true' : 'false');

    try { window.localStorage.setItem(LS_KEY, lang); } catch (_) {}
  }

  function currentLang() {
    var l = document.documentElement.getAttribute('data-lang');
    return (l === 'en' || l === 'fr') ? l : 'fr';
  }

  function toggleLang() {
    applyLanguage(currentLang() === 'fr' ? 'en' : 'fr');
  }

  // Active-section highlighter for sticky in-page navs (article side nav,
  // plan TOC). It's a no-op on roadmap.html (no #-anchored side nav).
  function wireSectionHighlight() {
    if (!('IntersectionObserver' in window)) return;
    var links = Array.prototype.slice.call(
      document.querySelectorAll('.nav a[href^="#"], .toc a[href^="#"]')
    );
    if (!links.length) return;

    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = a;
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var link = map[e.target.id];
        if (!link) return;
        if (e.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('is-active'); });
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) io.observe(sec);
    });
  }

  function init() {
    applyLanguage(currentLang() || safeGetLang());

    var sw = document.getElementById('lang-switch');
    if (sw) {
      sw.addEventListener('click', function () { toggleLang(); });
      sw.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          toggleLang();
        }
      });
    }

    wireSectionHighlight();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose helpers for pages that need to refresh i18n after late-render
  // (plan.html builds its TOC from rendered markdown).
  window.SyndDeck = {
    applyLanguage: applyLanguage,
    currentLang: currentLang,
    toggleLang: toggleLang,
    wireSectionHighlight: wireSectionHighlight
  };
})();
