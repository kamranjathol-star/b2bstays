/* =====================================================================
   Admin area: sign-in + access-request list (admin.html).
   Talks only to /api/admin/*. Every value from a request is inserted as
   plain text (never as HTML), and the page runs under a strict CSP.
   ===================================================================== */
(function () {
  'use strict';

  var SERVICE = { hotels: 'Hotels', visa: 'Visa services', transfers: 'Transfers', transport: 'Transportation', ziyarat: 'Ziyarat & sightseeing', train: 'Haramain train', corporate: 'Corporate tours' };
  var VOLUME = { unsure: 'Not sure yet', lt10: 'Fewer than 10', '10-50': '10–50', '51-200': '51–200', gt200: 'More than 200' };
  var STATUS = [['new', 'New'], ['contacted', 'Contacted'], ['approved', 'Approved'], ['rejected', 'Rejected']];
  var STATUS_LABEL = {};
  STATUS.forEach(function (s) { STATUS_LABEL[s[0]] = s[1]; });

  var state = { items: [], filter: 'all', q: '', info: null, openId: null, timer: 0, lastRow: null, noStorage: false };

  function $(s, r) { return (r || document).querySelector(s); }

  var regionNames = null;
  try { regionNames = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) { /* older browser: show the code */ }
  function country(code) { try { return (regionNames && regionNames.of(code)) || code; } catch (e) { return code; } }
  function when(iso) {
    var d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function services(d) { return (d.services || []).map(function (s) { return SERVICE[s] || s; }).join(', '); }

  /** Tiny DOM builder: h('div', { class: 'x', text: 'hi', onclick: fn }, child, 'text') */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
  }

  /* ---------- network ---------- */
  async function api(method, url, body) {
    var opt = { method: method, credentials: 'same-origin', headers: { Accept: 'application/json' } };
    if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    var res = await fetch(url, opt);
    var data = {};
    try { data = await res.json(); } catch (e) { /* no body */ }
    return { ok: res.ok, status: res.status, data: data };
  }

  /* ---------- views ---------- */
  function show(view) {
    ['Loading', 'Login', 'App'].forEach(function (n) { $('#view' + n).hidden = n !== view; });
    $('#admUser').hidden = view !== 'App';
  }

  function toast(msg) {
    var t = $('#admToast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ---------- sign-in ---------- */
  function loginMessage(msg, kind) {
    var m = $('#loginMsg');
    m.hidden = !msg;
    m.textContent = msg || '';
    m.className = 'adm-msg' + (kind === 'info' ? ' info' : '');
  }
  function showLogin(msg, kind) {
    stopRefresh();
    show('Login');
    loginMessage(msg, kind);
    $('#loginPassword').value = '';
    setTimeout(function () { ($('#loginEmail').value ? $('#loginPassword') : $('#loginEmail')).focus(); }, 30);
  }
  function sessionEnded() {
    closeDetail();
    showLogin('Your session has ended. Please sign in again.', 'info');
  }
  function setBusy(on) {
    var b = $('#loginBtn');
    b.classList.toggle('is-loading', on);
    b.disabled = on;
    b.setAttribute('aria-busy', String(on));
  }

  $('#loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var email = $('#loginEmail').value.trim(), pw = $('#loginPassword').value;
    if (!email || !pw) { loginMessage('Enter your email and password.'); return; }
    setBusy(true);
    try {
      var r = await api('POST', '/api/admin/login', { email: email, password: pw });
      if (r.ok) { loginMessage(''); $('#loginPassword').value = ''; await enter(); return; }
      loginMessage(r.status === 429 ? 'Too many attempts. Please wait 15 minutes and try again.'
        : r.status === 503 ? 'The admin area has not been set up yet.'
        : r.status === 401 ? 'That email or password is not right.'
        : 'Something went wrong. Please try again.');
      $('#loginPassword').value = '';
      $('#loginPassword').focus();
    } catch (err) {
      loginMessage('Could not reach the server. Check your connection and try again.');
    } finally { setBusy(false); }
  });

  $('#btnSignOut').addEventListener('click', async function () {
    try { await api('POST', '/api/admin/logout', {}); } catch (e) { /* the cookie is cleared by the server; ignore network errors */ }
    closeDetail();
    showLogin('You have been signed out.', 'info');
  });

  async function enter() {
    var s = await api('GET', '/api/admin/session');
    if (!s.ok) { showLogin(s.status === 503 ? 'The admin area has not been set up yet.' : '', 'info'); return; }
    state.info = s.data;
    $('#admEmail').textContent = s.data.email;
    show('App');
    await load();
    $('#appTitle').focus();
    startRefresh();
  }

  /* ---------- list ---------- */
  async function load() {
    var r = await api('GET', '/api/admin/requests');
    if (r.status === 401) { sessionEnded(); return; }
    if (r.status === 503) { state.items = []; state.noStorage = true; }
    else if (!r.ok) { toast('Could not load the requests.'); return; }
    else { state.items = r.data.items || []; state.noStorage = false; }
    render();
  }

  function startRefresh() {
    stopRefresh();
    state.timer = setInterval(function () { if (!$('#detail').open && !document.hidden) load(); }, 90000);
  }
  function stopRefresh() { clearInterval(state.timer); state.timer = 0; }

  function matches(r) {
    if (state.filter !== 'all' && r.status !== state.filter) return false;
    if (!state.q) return true;
    var d = r.data || {};
    var hay = [r.id, d.company, d.contactName, d.email, d.whatsapp, country(d.country), d.tradeNumber, services(d)].join(' ').toLowerCase();
    return state.q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
  }

  function renderBanners() {
    var box = $('#admBanners');
    box.textContent = '';
    var info = state.info || {};
    if (state.noStorage || info.storage === false) {
      box.appendChild(h('p', { class: 'adm-msg', role: 'status', text: 'Storage is not connected, so requests cannot be listed here. ' + (info.mail ? 'New requests are still emailed to ' + info.notifyTo + '.' : 'Nothing is being saved or emailed until storage or email is set up (see the README, "Backend").') }));
    }
    if (info.mail === false) {
      box.appendChild(h('p', { class: 'adm-msg info', role: 'status', text: 'Email notifications are off, so new requests are not emailed to ' + (info.notifyTo || 'the team') + ' yet. They still appear here.' }));
    }
  }

  function renderStats() {
    var counts = { all: state.items.length };
    STATUS.forEach(function (s) { counts[s[0]] = 0; });
    state.items.forEach(function (r) { if (counts[r.status] != null) counts[r.status]++; });
    var box = $('#admStats');
    box.textContent = '';
    [['all', 'All']].concat(STATUS).forEach(function (s) {
      box.appendChild(h('button', {
        type: 'button', class: 'adm-stat', 'aria-pressed': String(state.filter === s[0]),
        onclick: function () { state.filter = s[0]; render(); }
      }, h('b', { text: String(counts[s[0]]) }), h('span', { text: s[1] })));
    });
  }

  function render() {
    renderBanners();
    renderStats();
    var rows = $('#admRows');
    rows.textContent = '';
    var list = state.items.filter(matches);
    list.forEach(function (r) {
      var d = r.data || {};
      var btn = h('button', { type: 'button', class: 'adm-row' + (r.status === 'new' ? ' is-new' : ''), 'data-id': r.id, onclick: function () { state.lastRow = btn; openDetail(r.id); } },
        h('span', { class: 'r-co' }, h('b', { text: d.company || '(no name)' }), h('small', { text: (d.contactName || '') + (d.email ? ' · ' + d.email : '') })),
        h('span', { class: 'r-st' }, h('i', { class: 'st st-' + r.status, text: STATUS_LABEL[r.status] || r.status })),
        h('span', { class: 'r-ref' }, h('b', { text: r.id }), h('small', { text: when(r.receivedAt) })),
        h('span', { class: 'r-meta', text: [country(d.country), services(d), VOLUME[d.monthlyVolume] ? VOLUME[d.monthlyVolume] + ' / month' : ''].filter(Boolean).join(' · ') })
      );
      rows.appendChild(h('li', null, btn));
    });

    var empty = $('#admEmpty');
    if (!state.items.length) {
      empty.hidden = false;
      empty.textContent = state.noStorage ? '' : 'No requests yet. New requests appear here' + ((state.info && state.info.mail) ? ' and are emailed to ' + state.info.notifyTo : '') + '.';
      empty.hidden = !empty.textContent;
    } else if (!list.length) {
      empty.hidden = false;
      empty.textContent = 'No requests match this filter.';
    } else empty.hidden = true;

    var n = state.items.length;
    $('#admCount').textContent = n ? (list.length === n ? n + (n === 1 ? ' request' : ' requests') : list.length + ' of ' + n + ' requests') : '';
    $('#btnCsv').hidden = !n;
  }

  $('#admSearch').addEventListener('input', function () {
    state.q = this.value.trim().toLowerCase();
    render();
  });
  $('#btnRefresh').addEventListener('click', async function () { await load(); toast('Updated'); });

  /* ---------- one request ---------- */
  var dlg = $('#detail');

  function copy(text, label) {
    function done() { toast(label + ' copied'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { toast('Could not copy'); });
    else toast('Could not copy');
  }

  function find(id) { return state.items.filter(function (r) { return r.id === id; })[0]; }

  function fillDetail(r) {
    var d = r.data || {};
    $('#detRef').textContent = r.id;
    $('#detTitle').textContent = d.company || '(no name)';
    $('#detWhen').textContent = 'Received ' + when(r.receivedAt);

    var grid = $('#detGrid');
    grid.textContent = '';
    [
      ['Contact', d.contactName],
      ['Email', h('a', { href: 'mailto:' + d.email, text: d.email })],
      ['WhatsApp', h('span', { dir: 'ltr', text: d.whatsapp })],
      ['Country', country(d.country) + ' (' + d.country + ')'],
      ['Trade licence / IATA', d.tradeNumber || '—'],
      ['Services', services(d) || '—'],
      ['Bookings per month', VOLUME[d.monthlyVolume] || d.monthlyVolume || '—'],
      ['Form language', d.lang === 'ar' ? 'Arabic' : 'English'],
      ['Team emailed', r.notified ? 'Yes' : 'No']
    ].forEach(function (row) {
      grid.appendChild(h('div', null, h('dt', { text: row[0] }), h('dd', null, row[1])));
    });

    var digits = String(d.whatsapp || '').replace(/\D/g, '');
    var contact = $('#detContact');
    contact.textContent = '';
    contact.appendChild(h('a', { class: 'btn btn-primary sm', href: 'mailto:' + d.email + '?subject=' + encodeURIComponent('B2B Stays — your access request (' + r.id + ')'), text: 'Reply by email' }));
    if (digits) contact.appendChild(h('a', { class: 'btn btn-outline sm', href: 'https://wa.me/' + digits, target: '_blank', rel: 'noopener', text: 'Open WhatsApp' }));
    contact.appendChild(h('button', { type: 'button', class: 'btn btn-outline sm', text: 'Copy email', onclick: function () { copy(d.email, 'Email'); } }));
    contact.appendChild(h('button', { type: 'button', class: 'btn btn-outline sm', text: 'Copy number', onclick: function () { copy(d.whatsapp, 'Number'); } }));

    var opts = $('#detStatus');
    opts.textContent = '';
    STATUS.forEach(function (s) {
      opts.appendChild(h('button', { type: 'button', 'aria-pressed': String(r.status === s[0]), text: s[1], onclick: function () { if (r.status !== s[0]) patch(r.id, { status: s[0] }); } }));
    });

    var notes = $('#detNotes');
    notes.textContent = '';
    (r.notes || []).forEach(function (n) { notes.appendChild(h('li', null, h('small', { text: when(n.at) }), n.text)); });
    notes.hidden = !(r.notes || []).length;

    var more = $('#detMore');
    more.textContent = '';
    var c = d.consent || {};
    more.appendChild(h('p', { text: 'Agreed to be contacted: ' + (c.at ? when(c.at) : 'date not recorded') + (c.version ? ' · privacy policy version ' + c.version : '') }));
    if (c.text) more.appendChild(h('p', { text: 'Wording shown: “' + c.text + '”' }));
    (r.history || []).forEach(function (x) { more.appendChild(h('p', { text: when(x.at) + ': ' + (STATUS_LABEL[x.from] || x.from) + ' → ' + (STATUS_LABEL[x.to] || x.to) })); });
  }

  function openDetail(id) {
    var r = find(id);
    if (!r) return;
    state.openId = id;
    fillDetail(r);
    resetDelete();
    $('#detNote').value = '';
    if (!dlg.open) dlg.showModal();
  }
  function closeDetail() {
    if (dlg.open) dlg.close();
  }
  dlg.addEventListener('close', function () {
    state.openId = null;
    resetDelete();
    if (state.lastRow && document.contains(state.lastRow)) state.lastRow.focus();
  });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDetail(); });
  $('#detClose').addEventListener('click', closeDetail);

  async function patch(id, body) {
    var r = await api('PATCH', '/api/admin/requests?id=' + encodeURIComponent(id), body);
    if (r.status === 401) { sessionEnded(); return null; }
    if (!r.ok) { toast('Could not save. Please try again.'); return null; }
    var i = state.items.findIndex(function (x) { return x.id === id; });
    if (i > -1) state.items[i] = r.data.item;
    render();
    if (state.openId === id) fillDetail(r.data.item);
    return r.data.item;
  }

  $('#detAddNote').addEventListener('click', async function () {
    var text = $('#detNote').value.trim();
    if (!text || !state.openId) return;
    var item = await patch(state.openId, { note: text });
    if (item) { $('#detNote').value = ''; toast('Note added'); }
  });

  var delTimer = 0;
  function resetDelete() {
    clearTimeout(delTimer);
    var b = $('#detDelete');
    b.textContent = 'Delete permanently';
    b.classList.remove('confirm');
    b.removeAttribute('data-armed');
  }
  $('#detDelete').addEventListener('click', async function () {
    var b = this;
    if (!b.hasAttribute('data-armed')) {          // first click only arms the button
      b.setAttribute('data-armed', '1');
      b.classList.add('confirm');
      b.textContent = 'Click again to delete for good';
      delTimer = setTimeout(resetDelete, 5000);
      return;
    }
    var id = state.openId;
    resetDelete();
    if (!id) return;
    var r = await api('DELETE', '/api/admin/requests?id=' + encodeURIComponent(id));
    if (r.status === 401) { sessionEnded(); return; }
    if (!r.ok) { toast('Could not delete. Please try again.'); return; }
    state.items = state.items.filter(function (x) { return x.id !== id; });
    closeDetail();
    render();
    toast('Request deleted');
  });

  /* ---------- start ---------- */
  (async function boot() {
    try {
      var s = await api('GET', '/api/admin/session');
      if (s.ok) { await enter(); return; }
      showLogin(s.status === 503 ? 'The admin area has not been set up yet.' : '', 'info');
    } catch (e) {
      showLogin('Could not reach the server. Check your connection and reload the page.');
    }
  })();
})();
