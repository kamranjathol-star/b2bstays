/* =====================================================================
   Behaviour shared by every page: support hours, photo tiles / service
   photos from the config, scroll reveal. Each part does nothing when its
   elements are not on the page, so this file is safe to load everywhere.
   ===================================================================== */
(function () {
  'use strict';
  var B2B = (window.B2B = window.B2B || {});
  var SITE = window.SITE || {};
  var chrome = B2B.chrome || {};
  var esc = chrome.esc || String;
  var digits = chrome.digits || function (s) { return String(s || '').replace(/\D/g, ''); };

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function t(k, v) { return B2B.i18n.t(k, v); }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =============================================================
     1. SUPPORT HOURS (defined in KSA time, shown in KSA + UK time)
     ============================================================= */
  function tzParts(date, tz) {
    var p = {};
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short' })
      .formatToParts(date).forEach(function (x) { p[x.type] = x.value; });
    return p;
  }
  function tzOffsetMin(date, tz) {
    var p = tzParts(date, tz);
    var asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return Math.round((asUTC - Math.floor(date.getTime() / 1000) * 1000) / 60000);
  }
  function zonedToUtc(y, m, d, h, mi, tz) {
    var guess = Date.UTC(y, m - 1, d, h, mi);
    return new Date(guess - tzOffsetMin(new Date(guess), tz) * 60000);
  }
  function toMin(hhmm) { var a = hhmm.split(':'); return (+a[0]) * 60 + (+a[1]); }
  function fmtHM(date, tz) { return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(date); }

  function dayLabel(days, lang) {
    var loc = lang === 'ar' ? 'ar' : 'en-GB';
    var style = lang === 'ar' ? 'long' : 'short';
    var f = new Intl.DateTimeFormat(loc, { weekday: style, timeZone: 'UTC' });
    function name(i) { return f.format(new Date(Date.UTC(2024, 0, 7 + i))); }   // 7 Jan 2024 was a Sunday
    var d = days.slice().sort(function (a, b) { return a - b; });
    var contiguous = d.length >= 3 && d.every(function (v, i) { return i === 0 || v === d[i - 1] + 1; });
    return contiguous ? name(d[0]) + ' – ' + name(d[d.length - 1]) : d.map(name).join(', ');
  }

  function renderHours() {
    var box = $('#hoursBox');
    if (!box) return;
    var s = SITE.support || {};
    var okTime = /^\d{1,2}:\d{2}$/;
    if (!s.days || !s.days.length || !okTime.test(s.open || '') || !okTime.test(s.close || '')) { box.hidden = true; return; }
    var tz = s.timezone || 'Asia/Riyadh';
    var lang = B2B.i18n.getLang();
    var now = new Date();
    var np = tzParts(now, tz);
    var openM = toMin(s.open), closeM = toMin(s.close);
    var wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[np.weekday];
    var nowM = (+np.hour) * 60 + (+np.minute);
    var isOpen = s.days.indexOf(wd) > -1 && nowM >= openM && nowM < closeM;
    var openUtc = zonedToUtc(+np.year, +np.month, +np.day, Math.floor(openM / 60), openM % 60, tz);
    var closeUtc = zonedToUtc(+np.year, +np.month, +np.day, Math.floor(closeM / 60), closeM % 60, tz);
    var abbr = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', timeZoneName: 'short' }).formatToParts(openUtc)
      .filter(function (p) { return p.type === 'timeZoneName'; })[0];
    // Some browsers return "GMT+0" / "GMT+1" for London instead of "GMT" / "BST".
    var ukLabel = abbr ? ({ 'GMT+0': 'GMT', 'GMT+1': 'BST' }[abbr.value] || abbr.value) : '';
    var C = SITE.contact || {};

    var actions = [];
    if (C.email) actions.push('<a class="btn btn-outline" href="mailto:' + esc(C.email) + '"><svg class="i"><use href="#i-mail"/></svg><span>' + esc(t('hours.email')) + '</span></a>');
    if (C.phone) actions.push('<a class="btn btn-outline" href="tel:+' + digits(C.phone) + '"><svg class="i"><use href="#i-phone"/></svg><span>' + esc(t('hours.phone')) + '</span></a>');
    if (digits(C.whatsapp)) actions.push('<a class="btn btn-outline" href="https://wa.me/' + digits(C.whatsapp) + '" target="_blank" rel="noopener"><svg class="i"><use href="#i-chat"/></svg><span>' + esc(t('hours.wa')) + '</span></a>');

    box.innerHTML =
      '<div class="hours-head"><span class="pill ' + (isOpen ? 'open' : 'closed') + '"><i></i>' + esc(t(isOpen ? 'hours.open' : 'hours.closed')) + '</span>' +
      '<span class="hours-days">' + esc(dayLabel(s.days, lang)) + '</span></div>' +
      '<dl class="hours-list">' +
        '<div><dt><svg class="i"><use href="#i-pin"/></svg>' + esc(t('hours.ksa')) + '</dt><dd>' + fmtHM(openUtc, tz) + ' – ' + fmtHM(closeUtc, tz) + '</dd></div>' +
        '<div><dt><svg class="i"><use href="#i-clock"/></svg>' + esc(t('hours.uk')) + '</dt><dd>' + fmtHM(openUtc, 'Europe/London') + ' – ' + fmtHM(closeUtc, 'Europe/London') + (ukLabel ? ' <small>' + ukLabel + '</small>' : '') + '</dd></div>' +
      '</dl>' +
      '<p class="hours-note">' + esc(t('hours.note')) + '</p>' +
      (actions.length ? '<div class="hours-actions">' + actions.join('') + '</div>' : '');
    box.hidden = false;
  }

  /* =============================================================
     2. PHOTO TILES — a photo from SITE.images[group][key]
        <li class="dest" data-dest="paris" [data-group="hotels"]>
        No photo configured (or it fails to load) = a plain dark tile, or the
        built-in illustration when B2B.art has one for that key.
     ============================================================= */
  function renderTiles() {
    $$('.dest[data-dest]').forEach(function (el) {
      var key = el.getAttribute('data-dest');
      var group = el.getAttribute('data-group') || 'destinations';
      var imgs = (SITE.images && SITE.images[group]) || {};
      var host = $('[data-art]', el);
      if (!host) return;
      var art = (group === 'destinations' && B2B.art && B2B.art.dest && B2B.art.dest[key]) || '';
      var entry = imgs[key];
      host.innerHTML = art;                                   // illustration first (also the fallback)
      if (B2B.photos && B2B.photos.valid(entry)) {
        var ok = B2B.photos.mount(host, entry, {
          sizes: '(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw',
          onFail: function () { host.innerHTML = art; el.classList.remove('has-photo'); var c = $('.photo-credit', el); if (c) c.remove(); }
        });
        if (ok) {
          el.classList.add('has-photo');
          if (entry.credit) el.insertAdjacentHTML('beforeend', '<span class="photo-credit">' + esc(entry.credit) + '</span>');
        }
      }
    });
    renderCredits();
  }

  /* One quiet "Photos: names · Pexels" line instead of a badge on every tile. */
  function renderCredits() {
    var box = $('[data-credits]');
    if (!box) return;
    var names = [];
    $$('.dest.has-photo .photo-credit').forEach(function (c) {
      var n = c.textContent.replace(/^\s*Photo:\s*/i, '').replace(/\s*\/\s*Pexels\s*$/i, '').trim();
      if (n && names.indexOf(n) < 0) names.push(n);
    });
    if (!names.length) { box.hidden = true; return; }
    box.innerHTML = '<span data-i18n="credits.photos">' + esc(t('credits.photos')) + '</span>: <bdi>' + esc(names.join(', ')) + '</bdi> · <bdi>Pexels</bdi>';
    box.hidden = false;
  }

  /* Service cards: an optional photo header (SITE.images.services). No photo = the card looks as before. */
  function renderServicePhotos() {
    var imgs = (SITE.images && SITE.images.services) || {};
    $$('.svc-card[data-svc]').forEach(function (card) {
      var entry = imgs[card.getAttribute('data-svc')];
      if (!B2B.photos || !B2B.photos.valid(entry)) return;
      var host = document.createElement('div');
      host.className = 'svc-photo';
      card.insertBefore(host, card.firstChild);
      var ok = B2B.photos.mount(host, entry, {
        sizes: '(min-width:1024px) 600px, (min-width:640px) 50vw, 100vw',
        onFail: function () { host.remove(); card.classList.remove('has-photo'); }
      });
      if (ok) {
        card.classList.add('has-photo');
        if (entry.credit) host.insertAdjacentHTML('beforeend', '<span class="photo-credit">' + esc(entry.credit) + '</span>');
      } else host.remove();
    });
  }

  /* =============================================================
     3. SCROLL REVEAL + CARD SPOTLIGHT
     ============================================================= */
  function initReveal() {
    var items = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduce) { items.forEach(function (n) { n.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (n) { io.observe(n); });
  }
  function initSpotlight() {
    if (!window.matchMedia('(hover:hover)').matches) return;
    $$('.svc-card').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--x', (e.clientX - r.left) + 'px');
        c.style.setProperty('--y', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* "Trading for 4+ years" chip on the home page. The number comes from SITE.proof.yearsTrading
     (e.g. 4 or '4+') and nothing is shown while it is empty. */
  function renderYears() {
    var chip = $('[data-years]');
    if (!chip) return;
    var raw = (SITE.proof || {}).yearsTrading;
    var m = /^\s*(\d{1,3})\s*(\+?)\s*$/.exec(raw == null ? '' : String(raw));
    if (!m) { chip.hidden = true; return; }
    var n = parseInt(m[1], 10), ar = B2B.i18n.getLang() === 'ar', num = n, unit;
    if (ar) {
      if (n === 1) { unit = 'سنة'; num = ''; }
      else if (n === 2) { unit = 'سنتين'; num = ''; }
      else unit = (n >= 3 && n <= 10) ? 'سنوات' : 'سنة';
    } else unit = n === 1 ? 'year' : 'years';
    chip.textContent = t(m[2] ? 'hero.years.plus' : 'hero.years', { n: num, u: unit }).replace(/\s+/g, ' ').trim();
    chip.hidden = false;
  }

  /* =============================================================
     4. START-UP
     ============================================================= */
  if (B2B.i18n) B2B.i18n.onChange(function () { renderHours(); renderYears(); });
  renderYears();
  renderTiles();
  renderServicePhotos();
  initReveal();
  initSpotlight();
  if ($('#hoursBox')) setInterval(renderHours, 60000);
})();
