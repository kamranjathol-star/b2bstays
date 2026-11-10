/* =====================================================================
   Shared page chrome: icon sprite, header, footer, WhatsApp button, hero
   background, and the "only show what is filled in" legal/contact blocks.
   Runs on every page.
   ===================================================================== */
(function () {
  'use strict';
  var B2B = (window.B2B = window.B2B || {});
  var SITE = window.SITE || {};
  var L = SITE.legal || {};
  var C = SITE.contact || {};
  var NAME = (SITE.brand && SITE.brand.name) || 'B2B Stays';

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function t(k, v) { return B2B.i18n ? B2B.i18n.t(k, v) : k; }

  var isHome = document.body.classList.contains('page-home');
  var loginUrl = SITE.portal && SITE.portal.loginUrl;

  /* ---------------- icon sprite ---------------- */
  var SPRITE = '' +
    '<symbol id="i-visa" viewBox="0 0 24 24"><rect x="4.5" y="2.5" width="15" height="19" rx="2.5"/><circle cx="12" cy="10" r="3.2"/><path d="M8.5 17h7"/></symbol>' +
    '<symbol id="i-bed" viewBox="0 0 24 24"><path d="M3 19v-9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9"/><path d="M3 16h18"/><path d="M7 8V6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2"/><path d="M3 19v2M21 19v2"/></symbol>' +
    '<symbol id="i-plane" viewBox="0 0 24 24"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></symbol>' +
    '<symbol id="i-bus" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 7h16M4 11h16M9 18v2.5M15 18v2.5"/><circle cx="8" cy="14.5" r=".6"/><circle cx="16" cy="14.5" r=".6"/></symbol>' +
    '<symbol id="i-train" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="15" rx="3.5"/><path d="M5 11h14M9 18l-2.5 3M15 18l2.5 3M9.5 6.5h5"/><circle cx="9" cy="14.5" r=".6"/><circle cx="15" cy="14.5" r=".6"/></symbol>' +
    '<symbol id="i-brief" viewBox="0 0 24 24"><rect x="2.5" y="7" width="19" height="13.5" rx="2.5"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2.5 13h19"/></symbol>' +
    '<symbol id="i-landmark" viewBox="0 0 24 24"><path d="M3 21h18M5 21V10M9.5 21V10M14.5 21V10M19 21V10M2.5 10 12 3.5 21.5 10"/></symbol>' +
    '<symbol id="i-qr" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4M20 17v.01"/></symbol>' +
    '<symbol id="i-user" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></symbol>' +
    '<symbol id="i-lock" viewBox="0 0 24 24"><rect x="3.5" y="11" width="17" height="10.5" rx="2.5"/><path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11"/></symbol>' +
    '<symbol id="i-building" viewBox="0 0 24 24"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M2 22h20M10 6h4M10 10h4M10 14h4M10 18h4"/></symbol>' +
    '<symbol id="i-mail" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-10 6L2 7"/></symbol>' +
    '<symbol id="i-phone" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></symbol>' +
    '<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 5l7 7-7 7"/></symbol>' +
    '<symbol id="i-arrow-left" viewBox="0 0 24 24"><path d="M19 12H5M11 5l-7 7 7 7"/></symbol>' +
    '<symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>' +
    '<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></symbol>' +
    '<symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></symbol>' +
    '<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></symbol>' +
    '<symbol id="i-chat" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></symbol>' +
    '<symbol id="i-alert" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></symbol>' +
    '<symbol id="i-badge" viewBox="0 0 24 24"><path d="M12 2l2.4 2.1 3.2-.2.9 3.1 2.7 1.8-1 3.1 1 3.1-2.7 1.8-.9 3.1-3.2-.2L12 22l-2.4-2.1-3.2.2-.9-3.1L2.8 15l1-3.1-1-3.1 2.7-1.8.9-3.1 3.2.2z"/><path d="m9 12 2 2 4-4"/></symbol>' +
    '<symbol id="i-pin" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></symbol>' +
    '<symbol id="i-send" viewBox="0 0 24 24"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></symbol>';

  function renderSprite() {
    document.body.insertAdjacentHTML('afterbegin',
      '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>' + SPRITE + '</defs></svg>');
  }

  /* ---------------- "show only what is filled in" ---------------- */
  /** Registered-business lines, only those that have a value. */
  function legalLines() {
    var out = [];
    if (L.legalName) out.push(['leg.company', 'Company', L.legalName]);
    if (L.companyNumber) out.push(['leg.number', 'Company number', L.companyNumber]);
    if (L.registeredOffice) out.push(['leg.office', 'Registered office', L.registeredOffice]);
    if (L.vatNumber) out.push(['leg.vat', 'VAT number', L.vatNumber]);
    // A custom licence name is the owner's own wording, so it is not machine-translated.
    if (L.licenceNumber || L.licenceName) out.push([L.licenceName ? '' : 'leg.licence', L.licenceName || 'Licence', L.licenceNumber || L.licenceName]);
    if (L.iataNumber) out.push(['leg.iata', 'IATA number', L.iataNumber]);
    return out;
  }

  /* ---------------- header ---------------- */
  function headerHTML() {
    var login = loginUrl || 'login.html';
    return '' +
'<div class="wrap">' +
  '<a class="brand" href="index.html#top" aria-label="' + esc(NAME) + '">' +
    '<img class="logo" src="assets/img/logo-mark.svg" alt="" width="40" height="40">' +
    '<span class="brand-text"><b>' + esc(NAME) + '</b><small data-i18n="brand.tag">For the travel trade</small></span>' +
  '</a>' +
  '<nav class="nav" id="siteNav" aria-label="Primary">' +
    '<a href="index.html#services" data-i18n="nav.services">Services</a>' +
    '<a href="index.html#how" data-i18n="nav.how">How it works</a>' +
    '<a href="index.html#destinations" data-i18n="nav.destinations">Destinations</a>' +
    '<a href="index.html#faq" data-i18n="nav.faq">FAQ</a>' +
    '<a href="index.html#support" data-i18n="nav.support">Support</a>' +
    '<div class="nav-actions">' +
      '<a class="btn btn-gold" href="index.html#request" data-request><span data-i18n="nav.request">Request access</span><svg class="i flip"><use href="#i-arrow"/></svg></a>' +
      '<a class="btn btn-ghost" href="' + esc(login) + '" data-agent-login><svg class="i"><use href="#i-lock"/></svg><span data-i18n="nav.login">Agent login</span></a>' +
    '</div>' +
  '</nav>' +
  '<div class="top-right">' +
    '<div class="clock" aria-hidden="true"><svg class="i"><use href="#i-clock"/></svg>' +
      '<span data-i18n="clock.ksa">KSA</span> <b id="clockKsa">--:--</b><span class="dot-sep">•</span>' +
      '<span data-i18n="clock.uk">UK</span> <b id="clockUk">--:--</b></div>' +
    '<button class="lang" id="langBtn" type="button" aria-label="Switch language" data-i18n-aria="lang.aria">' +
      '<svg class="i"><use href="#i-globe"/></svg><span id="langLabel" lang="ar">العربية</span></button>' +
    '<a class="btn btn-ghost sm hide-sm" href="' + esc(login) + '" data-agent-login data-i18n="nav.login">Agent login</a>' +
    '<a class="btn btn-gold sm hide-xs" href="index.html#request" data-request data-i18n="nav.request">Request access</a>' +
    '<button class="menu-btn" id="menuBtn" type="button" aria-expanded="false" aria-controls="siteNav" aria-label="Menu" data-i18n-aria="nav.menu"><span></span><span></span><span></span></button>' +
  '</div>' +
'</div>';
  }

  /* ---------------- footer ---------------- */
  function footerHTML() {
    var lines = legalLines();
    var contact = [];
    if (C.email) contact.push('<li><svg class="i"><use href="#i-mail"/></svg><a href="mailto:' + esc(C.email) + '" dir="ltr">' + esc(C.email) + '</a></li>');
    if (C.phone) contact.push('<li><svg class="i"><use href="#i-phone"/></svg><a href="tel:' + esc(digits(C.phone) ? '+' + digits(C.phone) : C.phone) + '" dir="ltr">' + esc(C.phone) + '</a></li>');
    if (digits(C.whatsapp)) contact.push('<li><svg class="i"><use href="#i-chat"/></svg><a href="https://wa.me/' + digits(C.whatsapp) + '" target="_blank" rel="noopener"><span data-i18n="wa.label">WhatsApp</span></a></li>');

    var col4 = '';
    if (contact.length) col4 += '<h4 data-i18n="foot.contact">Contact</h4><ul class="contact">' + contact.join('') + '</ul>';
    if (lines.length) {
      col4 += '<div class="legal-box" style="margin-top:' + (contact.length ? '22px' : '0') + '"><h4 data-i18n="foot.reg">Registered details</h4><dl>' +
        lines.map(function (l) { return '<div><dt' + (l[0] ? ' data-i18n="' + l[0] + '"' : '') + '>' + esc(l[1]) + '</dt><dd>' + esc(l[2]) + '</dd></div>'; }).join('') + '</dl></div>';
    }

    return '' +
'<div class="container foot-grid">' +
  '<div class="foot-brand">' +
    '<a class="brand" href="index.html#top"><img class="logo" src="assets/img/logo-mark.svg" alt="" width="40" height="40"><span class="brand-text"><b>' + esc(NAME) + '</b><small data-i18n="brand.tag">For the travel trade</small></span></a>' +
    '<p data-i18n="foot.about">Saudi Arabia travel services for registered travel agents and companies.</p>' +
  '</div>' +
  '<div><h4 data-i18n="foot.services">Services</h4><ul>' +
    '<li><a href="index.html#services" data-i18n="svc.hotels.s">Hotels</a></li>' +
    '<li><a href="index.html#services" data-i18n="svc.visa.s">Visa services</a></li>' +
    '<li><a href="index.html#services" data-i18n="svc.transfers.s">Transfers</a></li>' +
    '<li><a href="index.html#services" data-i18n="svc.transport.s">Transportation</a></li>' +
    '<li><a href="index.html#services" data-i18n="svc.ziyarat.s">Ziyarat &amp; sightseeing</a></li>' +
    '<li><a href="index.html#services" data-i18n="svc.train.s">Haramain train</a></li>' +
    '<li><a href="index.html#services" data-i18n="svc.corp.s">Corporate tours</a></li>' +
  '</ul></div>' +
  '<div><h4 data-i18n="foot.company">Company</h4><ul>' +
    '<li><a href="index.html#how" data-i18n="nav.how">How it works</a></li>' +
    '<li><a href="index.html#faq" data-i18n="nav.faq">FAQ</a></li>' +
    '<li><a href="index.html#request" data-request data-i18n="nav.request">Request access</a></li>' +
    '<li><a href="' + esc(loginUrl || 'login.html') + '" data-agent-login data-i18n="nav.login">Agent login</a></li>' +
  '</ul><h4 style="margin-top:22px" data-i18n="foot.legal">Legal</h4><ul>' +
    '<li><a href="privacy.html" data-i18n="legal.privacy">Privacy Policy</a></li>' +
    '<li><a href="terms.html" data-i18n="legal.terms">Terms of use</a></li>' +
    '<li><a href="cookies.html" data-i18n="legal.cookies">Cookie Policy</a></li>' +
  '</ul></div>' +
  (col4 ? '<div>' + col4 + '</div>' : '') +
'</div>' +
'<div class="container foot-bar"><span>© <span id="year">' + new Date().getFullYear() + '</span> ' + esc(NAME) + '. <span data-i18n="foot.rights">All rights reserved.</span></span></div>';
  }

  /* ---------------- WhatsApp button (only when a number is configured) ---------------- */
  function renderFloaters() {
    var host = $('#floaters');
    if (!host || !digits(C.whatsapp)) return;
    host.innerHTML = '<a class="wa-fab" id="waFab" href="#" target="_blank" rel="noopener" aria-label="WhatsApp" data-i18n-aria="wa.label">' +
      '<svg class="i"><use href="#i-chat"/></svg><span data-i18n="wa.label">WhatsApp</span></a>';
  }
  function updateWaHref() {
    var a = $('#waFab');
    if (a) a.href = 'https://wa.me/' + digits(C.whatsapp) + '?text=' + encodeURIComponent(t('wa.text'));
  }

  /* ---------------- two-timezone clock ---------------- */
  function fmtTime(tz) {
    try { return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()); }
    catch (e) { return '--:--'; }
  }
  function tickClock() {
    var a = $('#clockKsa'), b = $('#clockUk');
    if (a) a.textContent = fmtTime('Asia/Riyadh');
    if (b) b.textContent = fmtTime('Europe/London');
  }

  /* ---------------- header behaviour ---------------- */
  function wireHeader() {
    var bar = $('#topbar'), btn = $('#menuBtn'), nav = $('#siteNav');

    function onScroll() { bar.classList.toggle('is-solid', window.scrollY > 10 || document.body.classList.contains('page-legal')); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function setMenu(open) {
      nav.classList.toggle('open', open);
      bar.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
    }
    btn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); btn.focus(); }
    });
    window.matchMedia('(min-width:1180px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });

    $('#langBtn').addEventListener('click', function () { B2B.i18n.toggle(); });

    // "Request access" / "Agent login" links: on the home page switch the card inline;
    // on other pages the normal href navigates to index.html#request / login.html.
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-request],[data-agent-login]');
      if (!a || !B2B.home) return;
      if (a.hasAttribute('data-agent-login') && loginUrl) return;     // real portal: let the link go
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      setMenu(false);
      B2B.home.showTab(a.hasAttribute('data-agent-login') ? 'login' : 'req', { scroll: true, focus: true });
    });
  }

  function updateLangUi(lang) {
    var label = $('#langLabel');
    if (label) { label.textContent = lang === 'ar' ? 'English' : 'العربية'; label.lang = lang === 'ar' ? 'en' : 'ar'; }
    updateWaHref();
  }

  /* ---------------- hero background + gentle parallax ---------------- */
  function wireHeroBg() {
    var bg = $('[data-hero-bg]');
    if (!bg || !B2B.art) return;
    bg.innerHTML = B2B.art.heroBg();
    var host = bg.parentElement;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(hover:hover)').matches) return;
    var raf = 0;
    host.addEventListener('pointermove', function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = host.getBoundingClientRect();
        host.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3));
        host.style.setProperty('--my', ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3));
      });
    });
  }

  /* ---------------- legal pages: operator block, draft notice, date ---------------- */
  function wireLegalPages() {
    $$('[data-draft-note]').forEach(function (n) { n.hidden = !!SITE.legalPagesReviewed; });
    $$('[data-updated]').forEach(function (n) { n.textContent = SITE.legalUpdated || ''; });
    $$('[data-operator]').forEach(function (box) {
      var lines = legalLines();
      var html = '<dl><div><dt>Trading name</dt><dd>' + esc(NAME) + '</dd></div>';
      lines.forEach(function (l) { html += '<div><dt>' + esc(l[1]) + '</dt><dd>' + esc(l[2]) + '</dd></div>'; });
      if (C.email) html += '<div><dt>Email</dt><dd><a href="mailto:' + esc(C.email) + '">' + esc(C.email) + '</a></dd></div>';
      html += '</dl>';
      if (!SITE.legalPagesReviewed && !lines.length) {
        html += '<p><mark>[Add your registered business details in assets/js/site-config.js — they will appear here automatically.]</mark></p>';
      }
      box.innerHTML = html;
    });
  }

  /* ---------------- boot ---------------- */
  renderSprite();
  var header = $('#topbar'); if (header) header.innerHTML = headerHTML();
  var footer = $('#siteFooter'); if (footer) footer.innerHTML = footerHTML();
  renderFloaters();
  wireHeader();
  wireHeroBg();
  wireLegalPages();
  tickClock(); setInterval(tickClock, 30000);

  // Point every "Agent login" link at the real portal once SITE.portal.loginUrl is set.
  if (loginUrl) $$('[data-agent-login]').forEach(function (a) { a.setAttribute('href', loginUrl); });

  if (B2B.i18n) B2B.i18n.onChange(updateLangUi);

  B2B.chrome = { legalLines: legalLines, esc: esc, digits: digits, isHome: isHome };
})();
