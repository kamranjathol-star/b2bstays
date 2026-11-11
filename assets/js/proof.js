/* =====================================================================
   Proof strip: years trading, cities, hotels, accreditations, partner
   logos and agent quotes — all from SITE.proof (site-config.js).

   HONESTY RULE: every block is hidden until real content is entered, and the
   whole section stays hidden while everything is empty. Nothing is invented.
   ===================================================================== */
(function () {
  'use strict';
  var B2B = (window.B2B = window.B2B || {});
  var SITE = window.SITE || {};
  var P = SITE.proof || {};
  var root = document.getElementById('proof');
  if (!root) return;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function t(k) { return B2B.i18n.t(k); }
  function lang() { return B2B.i18n.getLang(); }
  function has(v) { return v !== '' && v != null && String(v).trim() !== ''; }
  function link(url, inner, cls) {
    return url ? '<a class="' + cls + '" href="' + esc(url) + '" target="_blank" rel="noopener">' + inner + '</a>'
               : '<div class="' + cls + '">' + inner + '</div>';
  }

  var box = {
    stats: root.querySelector('[data-proof="stats"]'),
    accred: root.querySelector('[data-proof="accreditations"]'),
    partners: root.querySelector('[data-proof="partners"]'),
    quotes: root.querySelector('[data-proof="quotes"]')
  };

  function render() {
    var l = lang();

    // --- numbers
    var stats = [['yearsTrading', 'proof.years'], ['cities', 'proof.cities'], ['hotels', 'proof.hotels']]
      .filter(function (s) { return has(P[s[0]]); });
    box.stats.innerHTML = stats.map(function (s) {
      var v = P[s[0]]; v = (typeof v === 'number') ? v.toLocaleString('en-US') : String(v).trim();
      return '<div class="proof-stat"><strong>' + esc(v) + '</strong><span>' + esc(t(s[1])) + '</span></div>';
    }).join('');
    box.stats.hidden = !stats.length;

    // --- accreditations (name required; number, logo and link optional)
    var acc = (P.accreditations || []).filter(function (a) { return a && has(a.name); });
    box.accred.querySelector('ul').innerHTML = acc.map(function (a) {
      var inner = (has(a.logo) ? '<img src="' + esc(a.logo) + '" alt="" loading="lazy" decoding="async">' : '<svg class="i"><use href="#i-badge"/></svg>') +
        '<span><b>' + esc(a.name) + '</b>' + (has(a.number) ? '<small dir="ltr">' + esc(a.number) + '</small>' : '') + '</span>';
      return '<li>' + link(a.url, inner, 'accred-item') + '</li>';
    }).join('');
    box.accred.hidden = !acc.length;

    // --- partner logos (name + logo required, so every logo has proper alt text)
    var par = (P.partners || []).filter(function (p) { return p && has(p.name) && has(p.logo); });
    box.partners.querySelector('ul').innerHTML = par.map(function (p) {
      return '<li>' + link(p.url, '<img src="' + esc(p.logo) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async">', 'logo-item') + '</li>';
    }).join('');
    box.partners.hidden = !par.length;

    // --- quotes (text and name required; up to 3)
    var qs = (P.quotes || []).filter(function (q) { return q && q.text && (has(q.text.en) || has(q.text.ar)) && has(q.name); }).slice(0, 3);
    box.quotes.querySelector('.quotes').innerHTML = qs.map(function (q) {
      var txt = q.text[l], fallback = '';
      if (!has(txt)) {                                        // no translation: show the other language, marked up correctly
        var other = has(q.text.en) ? 'en' : 'ar';
        txt = q.text[other];
        fallback = ' lang="' + other + '" dir="' + (other === 'ar' ? 'rtl' : 'ltr') + '"';
      }
      var who = [q.role, q.company, q.country].filter(has).map(esc).join(' · ');
      return '<figure class="quote"><svg class="qmark" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h4v4c0 3-1.5 5-4 6l-.8-1.4C7.700 14.800 8.300 13.800 8.300 12.500H7zm8 0h4v4c0 3-1.500 5-4 6l-.8-1.400c1.500-.8 2.100-1.800 2.100-3.100H15z"/></svg>' +
        '<blockquote><p' + fallback + '>' + esc(txt) + '</p></blockquote>' +
        '<figcaption><b>' + esc(q.name) + '</b>' + (who ? '<span>' + who + '</span>' : '') + '</figcaption></figure>';
    }).join('');
    box.quotes.hidden = !qs.length;

    // --- whole section
    root.hidden = !(stats.length || acc.length || par.length || qs.length);
  }

  B2B.i18n.onChange(render);
  render();
})();
