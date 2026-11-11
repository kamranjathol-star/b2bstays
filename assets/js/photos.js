/* =====================================================================
   Photo renderer.

   Turns a config entry  { src, widths, alt:{en,ar}, credit, position }
   (see SITE.images in site-config.js) into:

     <picture>
       <source type="image/avif" srcset="src-640.avif 640w, src-1024.avif 1024w, ...">
       <source type="image/webp" srcset="...">
       <img src="src-1024.jpg" srcset="..." sizes="..." alt="..." loading="lazy">
     </picture>

   - lazy-loaded (the hero is eager + fetchpriority=high so it paints fast)
   - alt text follows the page language (English / Arabic)
   - if any file fails to load, the slot falls back to the built-in illustration
   ===================================================================== */
(function () {
  'use strict';
  var B2B = (window.B2B = window.B2B || {});
  var mounted = [];

  function lang() { return (B2B.i18n && B2B.i18n.getLang && B2B.i18n.getLang()) || 'en'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function valid(e) { return !!(e && e.src && e.widths && e.widths.length); }
  function altOf(e) { var a = (e && e.alt) || {}; return a[lang()] || a.en || ''; }
  function widthsOf(e) { return e.widths.slice().sort(function (a, b) { return a - b; }); }
  function ladder(e, ext) { return widthsOf(e).map(function (w) { return esc(e.src) + '-' + w + '.' + ext + ' ' + w + 'w'; }).join(', '); }

  function html(e, o) {
    var ws = widthsOf(e);
    var fallbackW = ws[Math.floor((ws.length - 1) / 2)];   // middle rung for the plain <img src>
    var sizes = esc(o.sizes || '100vw');
    return '<picture>' +
      '<source type="image/avif" srcset="' + ladder(e, 'avif') + '" sizes="' + sizes + '">' +
      '<source type="image/webp" srcset="' + ladder(e, 'webp') + '" sizes="' + sizes + '">' +
      '<img src="' + esc(e.src) + '-' + fallbackW + '.jpg" srcset="' + ladder(e, 'jpg') + '" sizes="' + sizes + '"' +
      ' alt="' + esc(altOf(e)) + '" decoding="async" loading="' + (o.eager ? 'eager' : 'lazy') + '"' +
      (o.eager ? ' fetchpriority="high"' : '') + '></picture>';
  }

  /** Mounts the photo into `host`. Returns true if a photo was rendered. */
  function mount(host, entry, opts) {
    opts = opts || {};
    if (!valid(entry)) return false;
    var hasAlt = entry.alt && (entry.alt.en || entry.alt.ar);
    if (!hasAlt && window.console) console.warn('[photos] Add alt text (en + ar) for ' + entry.src);
    host.innerHTML = html(entry, opts);
    var img = host.querySelector('img');
    if (entry.position) img.style.objectPosition = entry.position;
    var rec = { img: img, entry: entry };
    mounted.push(rec);
    img.addEventListener('error', function () {
      mounted = mounted.filter(function (m) { return m !== rec; });
      host.innerHTML = '';
      if (window.console) console.warn('[photos] Could not load ' + entry.src + ' — showing the illustration instead.');
      if (opts.onFail) opts.onFail();
    });
    return true;
  }

  if (B2B.i18n && B2B.i18n.onChange) {
    B2B.i18n.onChange(function () { mounted.forEach(function (m) { m.img.alt = altOf(m.entry); }); });
  }

  B2B.photos = { mount: mount, valid: valid };
})();
