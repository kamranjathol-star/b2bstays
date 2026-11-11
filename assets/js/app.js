/* =====================================================================
   Home page behaviour: the access card (request form + agent-login state).
   Support hours, photo tiles and scroll effects live in pages.js.
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
  var behavior = reduce ? 'auto' : 'smooth';
  var loadedAt = Date.now();

  /* =============================================================
     1. ACCESS CARD — tabs (Request access / Agent login)
     ============================================================= */
  var card = $('#request');
  var seg = $('#cardTabs');
  var tabs = $$('[role=tab]', seg);
  var panels = { req: $('#panelReq'), login: $('#panelLogin') };

  function pingCard() {
    if (reduce) return;
    card.classList.remove('ping'); void card.offsetWidth; card.classList.add('ping');
    setTimeout(function () { card.classList.remove('ping'); }, 1400);
  }

  function showTab(name, opts) {
    opts = opts || {};
    tabs.forEach(function (tb) {
      var on = tb.getAttribute('data-tab') === name;
      tb.setAttribute('aria-selected', String(on));
      tb.tabIndex = on ? 0 : -1;
    });
    seg.setAttribute('data-active', name === 'login' ? '1' : '0');
    Object.keys(panels).forEach(function (k) {
      panels[k].hidden = k !== name;
      panels[k].classList.toggle('is-active', k === name);
    });
    if (opts.scroll) { card.scrollIntoView({ behavior: behavior, block: 'start' }); pingCard(); }
    if (opts.focus) {
      setTimeout(function () {
        if (name === 'login') { panels.login.focus({ preventScroll: true }); return; }
        if (!$('#outcome').hidden) { $('#outcome').focus({ preventScroll: true }); return; }
        var bad = $('.has-error input, .has-error select', form);
        var first = bad || $('.step.is-active input:not([type=checkbox]):not(.hp input), .step.is-active select', form);
        if (first) first.focus({ preventScroll: true });
      }, opts.scroll && !reduce ? 450 : 0);
    }
  }
  B2B.home = { showTab: showTab };

  tabs.forEach(function (tb, i) {
    tb.addEventListener('click', function () { showTab(tb.getAttribute('data-tab')); });
    tb.addEventListener('keydown', function (e) {
      var rtl = document.documentElement.dir === 'rtl';
      var next = null;
      if (e.key === 'ArrowRight') next = rtl ? i - 1 : i + 1;
      else if (e.key === 'ArrowLeft') next = rtl ? i + 1 : i - 1;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next == null) return;
      e.preventDefault();
      var target = tabs[(next + tabs.length) % tabs.length];
      showTab(target.getAttribute('data-tab')); target.focus();
    });
  });
  $$('[data-go-request]').forEach(function (b) { b.addEventListener('click', function () { showTab('req', { focus: true }); }); });

  /* =============================================================
     2. REQUEST FORM
     ============================================================= */
  var form = $('#requestForm');
  var steps = $$('.step', form);
  var bars = $$('.stepper .bar');
  var stepLabel = $('#stepLabel'); stepLabel.tabIndex = -1;
  var formWrap = $('#formWrap');
  var outcome = $('#outcome');
  var formError = $('#formError');
  var cur = 1;

  var ISO = ('AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ ' +
    'DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP ' +
    'KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ ' +
    'OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ ' +
    'UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' ');

  function buildCountries() {
    var sel = $('#fCountry');
    var keep = sel.value;
    var lang = B2B.i18n.getLang();
    var dn = null;
    try { dn = new Intl.DisplayNames([lang === 'ar' ? 'ar' : 'en'], { type: 'region' }); } catch (e) { /* older browsers: codes */ }
    var items = ISO.map(function (c) { return { c: c, n: (dn && dn.of(c)) || c }; });
    var coll = new Intl.Collator(lang === 'ar' ? 'ar' : 'en');
    var pinned = ['GB', 'SA'];
    var top = pinned.map(function (c) { return items.filter(function (x) { return x.c === c; })[0]; });
    var rest = items.filter(function (x) { return pinned.indexOf(x.c) < 0; }).sort(function (a, b) { return coll.compare(a.n, b.n); });
    var ph = sel.querySelector('option[value=""]');
    sel.innerHTML = '';
    sel.appendChild(ph);
    function opt(x) { var o = document.createElement('option'); o.value = x.c; o.textContent = x.n; return o; }
    top.forEach(function (x) { sel.appendChild(opt(x)); });
    var sep = document.createElement('option'); sep.disabled = true; sep.textContent = '──────────'; sel.appendChild(sep);
    rest.forEach(function (x) { sel.appendChild(opt(x)); });
    sel.value = keep;
  }

  function updateStepLabel() { stepLabel.textContent = t('card.step', { n: cur }); }

  function goStep(n, opts) {
    cur = n;
    steps.forEach(function (s) { s.classList.toggle('is-active', +s.getAttribute('data-step') === n); });
    bars.forEach(function (b, i) { b.classList.toggle('on', i < n); });
    updateStepLabel();
    if (!opts || opts.focus !== false) {
      stepLabel.focus({ preventScroll: true });
      if (card.getBoundingClientRect().top < 0) card.scrollIntoView({ behavior: behavior, block: 'start' });
    }
  }

  /* ---- validation ---- */
  function wrapOf(el) { return el.closest('[data-field]'); }
  function setErr(wrap, key) {
    wrap.classList.add('has-error');
    var e = $('.err', wrap);
    e.textContent = t(key); e.setAttribute('data-key', key);
    $$('input,select', wrap).forEach(function (i) { i.setAttribute('aria-invalid', 'true'); });
  }
  function clearErr(wrap) {
    wrap.classList.remove('has-error');
    var e = $('.err', wrap); e.textContent = ''; e.removeAttribute('data-key');
    $$('input,select', wrap).forEach(function (i) { i.removeAttribute('aria-invalid'); });
  }
  form.addEventListener('input', function (e) { var w = wrapOf(e.target); if (w) clearErr(w); });
  form.addEventListener('change', function (e) { var w = wrapOf(e.target); if (w) clearErr(w); });

  function normalisePhone(raw) {
    var s = String(raw || '').trim().replace(/[\s().\-]/g, '');
    if (s.indexOf('00') === 0) s = '+' + s.slice(2);
    return /^\+\d{7,15}$/.test(s) ? s : null;
  }
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /** Validates one step, marks every bad field, returns the first bad focusable element (or null). */
  function validateStep(n) {
    var first = null;
    function bad(el, key) { var w = wrapOf(el); setErr(w, key); if (!first) first = el; }
    function val(id) { return $(id).value.trim(); }

    if (n === 1) {
      if (val('#fCompany').length < 2) bad($('#fCompany'), 'err.required'); else clearErr(wrapOf($('#fCompany')));
      if (val('#fName').length < 2) bad($('#fName'), 'err.required'); else clearErr(wrapOf($('#fName')));
      var em = val('#fEmail');
      if (!em) bad($('#fEmail'), 'err.required'); else if (!EMAIL_RE.test(em)) bad($('#fEmail'), 'err.email'); else clearErr(wrapOf($('#fEmail')));
      var wa = val('#fWhatsapp');
      if (!wa) bad($('#fWhatsapp'), 'err.required'); else if (!normalisePhone(wa)) bad($('#fWhatsapp'), 'err.whatsapp'); else clearErr(wrapOf($('#fWhatsapp')));
      if (!$('#fCountry').value) bad($('#fCountry'), 'err.country'); else clearErr(wrapOf($('#fCountry')));
    } else {
      var set = $('.chips-set', form);
      if (!$$('input[name=services]:checked', form).length) { setErr(set, 'err.services'); if (!first) first = $('input[name=services]', form); } else clearErr(set);
      if (!$('#fVolume').value) bad($('#fVolume'), 'err.volume'); else clearErr(wrapOf($('#fVolume')));
      var cons = $('.consent', form);
      if (!$('#fConsent').checked) { setErr(cons, 'err.consent'); if (!first) first = $('#fConsent'); } else clearErr(cons);
    }
    return first;
  }

  function shake() {
    if (reduce) return;
    card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    setTimeout(function () { card.classList.remove('shake'); }, 500);
  }

  $('#stepNext').addEventListener('click', function () {
    var bad = validateStep(1);
    if (bad) { shake(); bad.focus(); return; }
    goStep(2);
  });
  $('#stepBack').addEventListener('click', function () { goStep(1); });
  form.addEventListener('keydown', function (e) {           // Enter on step 1 = Continue (not submit)
    if (e.key === 'Enter' && cur === 1 && e.target.tagName === 'INPUT') { e.preventDefault(); $('#stepNext').click(); }
  });

  /* ---- build payload (schema documented in assets/js/api.js) ---- */
  function buildPayload() {
    var now = new Date();
    return {
      company: $('#fCompany').value.trim(),
      contactName: $('#fName').value.trim(),
      email: $('#fEmail').value.trim(),
      whatsapp: normalisePhone($('#fWhatsapp').value),
      country: $('#fCountry').value,
      tradeNumber: $('#fTrade').value.trim(),
      services: $$('input[name=services]:checked', form).map(function (i) { return i.value; }),
      monthlyVolume: $('#fVolume').value,
      consent: {
        accepted: true,
        text: $('#consentText').textContent.trim(),
        version: (SITE.form && SITE.form.privacyVersion) || '',
        at: now.toISOString()
      },
      website: $('#fWebsite').value,                       // honeypot
      meta: {
        lang: B2B.i18n.getLang(),
        page: location.href.split('#')[0],
        submittedAt: now.toISOString(),
        elapsedMs: now.getTime() - loadedAt
      }
    };
  }

  function setLoading(on) {
    var b = $('#submitBtn');
    b.classList.toggle('is-loading', on);
    b.disabled = on;
    b.setAttribute('aria-busy', String(on));
  }
  function showFormError(msg) { formError.textContent = msg; formError.hidden = false; shake(); }

  var OUT_KEYS = { 'sent': 'out.sent', 'prepared': 'out.prepared', 'not-configured': 'out.nc' };
  function renderOutcome() {
    var st = outcome.getAttribute('data-status');
    if (!st) return;
    $('#outTitle').textContent = t(OUT_KEYS[st] + '.t');
    $('#outText').textContent = t(OUT_KEYS[st] + '.d');
  }
  function showOutcome(status, reference) {
    outcome.setAttribute('data-status', status);
    $('[data-ico=ok]', outcome).hidden = status !== 'sent';
    $('[data-ico=info]', outcome).hidden = status === 'sent';
    var ref = $('#outRef');
    ref.hidden = !reference;
    if (reference) $('b', ref).textContent = reference;
    renderOutcome();
    formWrap.hidden = true;
    outcome.hidden = false;
    outcome.focus({ preventScroll: true });
    if (card.getBoundingClientRect().top < 0) card.scrollIntoView({ behavior: behavior, block: 'start' });
  }
  $('#outAgain').addEventListener('click', function () {
    var st = outcome.getAttribute('data-status');
    outcome.hidden = true; formWrap.hidden = false;
    if (st === 'sent') { form.reset(); $$('[data-field]', form).forEach(clearErr); clearErr($('.consent', form)); goStep(1); }
    else goStep(2);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formError.hidden = true;
    var bad1 = validateStep(1);
    if (bad1) { goStep(1, { focus: false }); shake(); bad1.focus(); return; }
    var bad2 = validateStep(2);
    if (bad2) { goStep(2, { focus: false }); shake(); bad2.focus(); return; }

    var payload = buildPayload();
    if (payload.website) { showOutcome('sent'); return; }  // spam trap tripped: look successful, send nothing

    setLoading(true);
    B2B.api.submitAccessRequest(payload).then(function (res) {
      setLoading(false);
      showOutcome(res.status, res.reference);
    }).catch(function () {
      setLoading(false);
      showFormError(t('err.send'));
    });
  });


  /* =============================================================
     4. LANGUAGE CHANGES + START-UP
     ============================================================= */
  B2B.i18n.onChange(function () {
    buildCountries();
    updateStepLabel();
    $$('.err[data-key]').forEach(function (e) { e.textContent = t(e.getAttribute('data-key')); });
    if (!formError.hidden) formError.textContent = t('err.send');
    renderOutcome();
  });

  if (location.hash === '#request') setTimeout(pingCard, 600);
})();
