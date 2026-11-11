/* =====================================================================
   EN / AR translation engine.

   - English text lives in the HTML itself (data-i18n="key"). It is captured on load.
   - Arabic lives in the AR object below, one key per line, so a reviewer can read it
     side by side with the English.
   - EN holds English for strings created by JavaScript (form errors, hours box, etc.).

   >>> The Arabic was written in Modern Standard Arabic by an AI assistant.
   >>> It MUST be reviewed by a native Arabic speaker (ideally someone who knows
   >>> travel-trade wording) before launch. <<<
   ===================================================================== */
(function () {
  'use strict';
  var B2B = (window.B2B = window.B2B || {});
  var STORE_KEY = 'b2b-lang';

  function sget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked: fine */ } }

  /* ---------- English strings that are not in the HTML ---------- */
  var EN = {
    'card.step': 'Step {n} of 2',
    'err.required': 'This field is required.',
    'err.email': 'Enter a valid email address.',
    'err.whatsapp': 'Enter a valid number including the country code.',
    'err.country': 'Choose your country.',
    'err.services': 'Choose at least one service.',
    'err.volume': 'Choose your expected volume.',
    'err.consent': 'Please tick the box to continue.',
    'err.send': 'We couldn’t send your request. Please try again in a moment.',
    'err.fix': 'Please correct the highlighted fields.',
    'out.sent.t': 'Request received',
    'out.sent.d': 'Thank you. We’ll review your details and contact you using the email or WhatsApp number you gave us.',
    'out.prepared.t': 'Almost done — check your email app',
    'out.prepared.d': 'Your email app should have opened with your request ready. Nothing is sent until you press Send there.',
    'out.nc.t': 'Online requests are unavailable',
    'out.nc.d': 'We couldn’t send your request online just now, so nothing was sent. Please try again later.',
    'hours.ksa': 'Saudi Arabia',
    'hours.uk': 'United Kingdom',
    'hours.open': 'Open now',
    'hours.closed': 'Closed now',
    'hours.note': 'Outside these hours, send a request and we’ll reply when we’re back.',
    'hours.email': 'Email',
    'hours.phone': 'Call',
    'hours.wa': 'WhatsApp',
    'wa.text': 'Hello, I’d like to ask about trade access.'
  };

  /* ---------- Arabic ---------- */
  var AR = {
    'skip': 'تخطَّ إلى نموذج الطلب',
    'skip.main': 'تخطَّ إلى المحتوى',
    'meta.title': 'B2B Stays — فنادق وخدمات سفر لقطاع السفر',
    'meta.desc': 'للأعمال فقط. فنادق حول العالم، إضافةً إلى خدمات التأشيرات، والتوصيل من المطارات وبين المدن، والنقل، والسياحة، وتذاكر القطار، ورحلات الشركات — لوكلاء السفر والشركات المسجّلة.',
    'login.meta.title': 'دخول الوكلاء — B2B Stays',

    'brand.tag': 'لقطاع السفر',
    'nav.services': 'الخدمات',
    'nav.how': 'كيف يعمل',
    'nav.destinations': 'الوجهات',
    'nav.faq': 'الأسئلة الشائعة',
    'nav.support': 'الدعم',
    'nav.login': 'دخول الوكلاء',
    'nav.request': 'طلب الوصول',
    'nav.menu': 'القائمة',
    'lang.aria': 'تغيير اللغة',
    'clock.ksa': 'السعودية',
    'clock.uk': 'بريطانيا',

    'hero.eyebrow': 'للأعمال فقط · وكلاء السفر والشركات المسجّلة',
    'hero.title': 'فنادق حول العالم، <em>صُمّمت لقطاع السفر.</em>',
    'hero.lead': 'فنادق في أشهر الوجهات حول العالم، مع خدمات السفر المصاحبة لها — لوكلاء السفر والشركات المسجّلة.',
    'hero.cta1': 'طلب الوصول',
    'hero.cta2': 'دخول الوكلاء',
    'hero.note': 'نتعامل مع قطاع السفر فقط، ولا نبيع للأفراد.',

    'svc.hotels.s': 'فنادق',
    'svc.visa.s': 'خدمات التأشيرات',
    'svc.transfers.s': 'التوصيل',
    'svc.transport.s': 'النقل',
    'svc.ziyarat.s': 'الزيارات والسياحة',
    'svc.train.s': 'قطار الحرمين',
    'svc.corp.s': 'رحلات الشركات',

    'card.tab.req': 'طلب الوصول',
    'card.tab.login': 'دخول الوكلاء',
    'card.badge': 'للأعمال فقط',
    'card.title': 'اطلب الوصول التجاري',
    'card.sub': 'لوكلاء السفر والشركات المسجّلة في المملكة المتحدة وخارجها.',
    'card.step': 'الخطوة {n} من 2',
    'card.foot': 'نردّ عليك عبر البيانات التي تزوّدنا بها.',

    'form.company': 'اسم الشركة / الاسم التجاري',
    'form.contact': 'اسم جهة الاتصال',
    'form.email': 'البريد الإلكتروني للعمل',
    'form.whatsapp': 'رقم واتساب',
    'form.whatsapp.hint': 'أضِف رمز الدولة، مثل <bdi dir="ltr">+44 …</bdi>',
    'form.country': 'الدولة',
    'form.country.ph': 'اختر الدولة',
    'form.next': 'متابعة',
    'form.trade': 'رقم الترخيص التجاري أو رقم IATA',
    'form.trade.hint': 'اختياري — أضِفه إن وُجد.',
    'form.services': 'الخدمات المطلوبة',
    'form.volume': 'عدد الحجوزات المتوقع شهريًا',
    'form.volume.ph': 'اختر',
    'vol.unsure': 'غير متأكد بعد',
    'vol.lt10': 'أقل من 10',
    'vol.10': '10–50',
    'vol.51': '51–200',
    'vol.gt200': 'أكثر من 200',
    'form.consent': 'أوافق على أن تستخدموا هذه البيانات للتواصل معي بشأن هذا الطلب، وفق ما هو موضّح في <a href="privacy.html" target="_blank" rel="noopener">سياسة الخصوصية</a>.',
    'form.back': 'رجوع',
    'form.submit': 'إرسال الطلب',

    'err.required': 'هذا الحقل مطلوب.',
    'err.email': 'أدخل بريدًا إلكترونيًا صحيحًا.',
    'err.whatsapp': 'أدخل رقمًا صحيحًا مع رمز الدولة.',
    'err.country': 'اختر الدولة.',
    'err.services': 'اختر خدمة واحدة على الأقل.',
    'err.volume': 'اختر عدد الحجوزات المتوقع.',
    'err.consent': 'يُرجى وضع علامة في المربع للمتابعة.',
    'err.send': 'تعذّر إرسال طلبك. حاول مرة أخرى بعد قليل.',
    'err.fix': 'يُرجى تصحيح الحقول المحدَّدة.',

    'out.ref': 'المرجع',
    'out.again': 'العودة إلى النموذج',
    'out.sent.t': 'تم استلام طلبك',
    'out.sent.d': 'شكرًا لك. سنراجع بياناتك ونتواصل معك عبر البريد الإلكتروني أو رقم واتساب الذي زوّدتنا به.',
    'out.prepared.t': 'اكتمل تقريبًا — تحقّق من تطبيق البريد',
    'out.prepared.d': 'كان ينبغي أن يُفتح تطبيق البريد لديك وطلبك جاهز للإرسال. لا يُرسَل شيء إلا بعد ضغطك على «إرسال» هناك.',
    'out.nc.t': 'الطلبات عبر الإنترنت غير متاحة',
    'out.nc.d': 'تعذّر إرسال طلبك عبر الإنترنت الآن، ولذلك لم يُرسَل شيء. يُرجى المحاولة لاحقًا.',

    'acct.badge': 'بعد الموافقة',
    'acct.title': 'حسابات الوكلاء',
    'acct.d': 'يفتح فريقنا الحسابات بعد مراجعة الطلب. اطلب الوصول وسنتواصل معك بالخطوات التالية.',
    'acct.cta': 'طلب الوصول',
    'login.home': 'العودة إلى الرئيسية',


    'sec.svc.k': 'الخدمات',
    'sec.svc.t': 'ما نرتّبه لقطاع السفر',
    'sec.svc.s': 'شريك واحد لقطاع السفر — من الفندق إلى التوصيل من المطار.',
    'svc.cta': 'طلب الوصول',
    'svc.hotels.t': 'الفنادق',
    'svc.hotels.d': 'إقامة فندقية حول العالم للمسافرين الأفراد والمجموعات.',
    'tag.makkah': 'مكة المكرمة',
    'tag.madinah': 'المدينة المنورة',
    'tag.jeddah': 'جدة',
    'tag.riyadh': 'الرياض',
    'svc.visa.t': 'خدمات التأشيرات',
    'svc.visa.d': 'مساندة في طلبات التأشيرة السعودية لعملائك.',
    'svc.visa.n': 'خدمات التأشيرات تخضع للأنظمة السعودية ولترخيصنا.',
    'svc.transfers.t': 'التوصيل من المطارات وبين المدن',
    'svc.transfers.d': 'خدمات استقبال وتوصيل بين المطارات والفنادق والمدن.',
    'svc.transport.t': 'النقل',
    'svc.transport.d': 'نقل بري يُرتَّب وفق برنامج مجموعتك.',
    'svc.ziyarat.t': 'الزيارات والسياحة',
    'svc.ziyarat.d': 'برامج زيارات وسياحة للأفراد والمجموعات.',
    'svc.train.t': 'تذاكر قطار الحرمين',
    'svc.train.d': 'تذاكر قطار الحرمين السريع بين مكة المكرمة وجدة والمدينة المنورة.',
    'svc.corp.t': 'رحلات الشركات',
    'svc.corp.d': 'برامج سفر للمجموعات والشركات تُصمَّم وفق متطلبات شركتك.',

    'how.k': 'كيف يعمل',
    'how.t': 'أربع خطوات للوصول التجاري',
    'how.1.t': 'اطلب الوصول',
    'how.1.d': 'عرّفنا بنشاطك والخدمات التي تحتاجها.',
    'how.2.t': 'نراجع طلبك',
    'how.2.d': 'نتحقق من بياناتك — ومن رقم ترخيصك التجاري أو IATA إن وُجد.',
    'how.3.t': 'نتواصل معك',
    'how.3.d': 'نتواصل معك عبر البريد الإلكتروني أو واتساب بالخطوات التالية وبيانات الوصول.',
    'how.4.t': 'احجز لعملائك',
    'how.4.d': 'احجز الفنادق والخدمات الأخرى لعملائك.',

    'dest.k': 'الوجهات',
    'dest.t': 'وجهات عالمية مشهورة',
    'dest.dubai': 'دبي',
    'dest.london': 'لندن',
    'dest.paris': 'باريس',
    'dest.newyork': 'نيويورك',
    'dest.singapore': 'سنغافورة',
    'dest.maldives': 'جزر المالديف',
    'dest.istanbul': 'إسطنبول',
    'dest.bangkok': 'بانكوك',
    'hotels.k': 'الفنادق',
    'hotels.t': 'فنادق حول العالم',
    'services.meta.title': 'الخدمات — B2B Stays',
    'services.meta.desc': 'فنادق حول العالم، وخدمات التأشيرات، والتوصيل من المطارات وبين المدن، والنقل، والزيارات والسياحة، وتذاكر قطار الحرمين، ورحلات الشركات — لوكلاء السفر والشركات المسجّلة.',
    'how.meta.title': 'كيف يعمل — B2B Stays',
    'how.meta.desc': 'أربع خطوات للوصول التجاري، ونظرة أولى على بوابة الشركاء (ببيانات تجريبية). لوكلاء السفر والشركات المسجّلة.',
    'faq.meta.title': 'الأسئلة الشائعة — B2B Stays',
    'faq.meta.desc': 'إجابات لوكلاء السفر والشركات: من يمكنه استخدام B2B Stays، والبوابة، والتأشيرات، والخدمات، وطريقة التقديم، وكيف نستخدم بياناتك.',
    'support.meta.title': 'الدعم — B2B Stays',
    'support.meta.desc': 'ساعات الدعم بتوقيت السعودية وبريطانيا، وطرق التواصل مع B2B Stays.',

    'faq.k': 'الأسئلة الشائعة',
    'faq.t': 'أسئلة وأجوبة',
    'faq.1.q': 'من يمكنه استخدام الخدمة؟',
    'faq.1.a': 'وكلاء السفر ومنظمو الرحلات والشركات المسجّلة في المملكة المتحدة وخارجها. نتعامل مع قطاع السفر فقط ولا نبيع للأفراد.',
    'faq.2.q': 'كيف أحصل على حساب؟',
    'faq.2.a': 'اطلب الوصول عبر النموذج في الصفحة الرئيسية. يراجع فريقنا كل طلب ويتواصل معك عبر البريد الإلكتروني أو واتساب بالخطوات التالية.',
    'faq.3.q': 'هل تتولّون التأشيرات؟',
    'faq.3.a': 'نقدّم خدمات التأشيرات لعملائك، وهي تخضع للأنظمة السعودية ولترخيصنا. المتطلبات وإجراءات المعالجة تحدّدها الجهات السعودية وقد تتغيّر.',
    'faq.4.q': 'ما الخدمات التي يمكنني طلبها؟',
    'faq.4.a': 'فنادق حول العالم؛ وخدمات التأشيرات؛ والتوصيل من المطارات وبين المدن؛ والنقل؛ والزيارات والسياحة؛ وتذاكر قطار الحرمين؛ ورحلات الشركات.',
    'faq.5.q': 'ماذا أحتاج للتقديم؟',
    'faq.5.a': 'بيانات شركتك وجهة الاتصال، والخدمات التي تهمّك، وعدد الحجوزات المتوقع شهريًا. رقم الترخيص التجاري أو IATA اختياري — أضِفه إن كان لديك.',
    'faq.6.q': 'كيف ستتواصلون معي؟',
    'faq.6.a': 'عبر البريد الإلكتروني أو واتساب، باستخدام البيانات الواردة في طلبك.',
    'faq.7.q': 'كيف تُستخدم بياناتي؟',
    'faq.7.a': 'لمراجعة طلبك والرد عليه. راجِع <a href="privacy.html">سياسة الخصوصية</a> للتفاصيل.',

    'sup.k': 'الدعم',
    'sup.t': 'ساعات الدعم',
    'sup.s': 'تُعرض بتوقيت السعودية وبريطانيا. يتبع التوقيت البريطاني التوقيت الصيفي.',
    'hours.ksa': 'المملكة العربية السعودية',
    'hours.uk': 'المملكة المتحدة',
    'hours.open': 'مفتوح الآن',
    'hours.closed': 'مغلق الآن',
    'hours.note': 'خارج هذه الساعات، أرسل طلبًا وسنردّ عند عودتنا.',
    'hours.email': 'البريد الإلكتروني',
    'hours.phone': 'اتصال',
    'hours.wa': 'واتساب',

    'cta.t': 'هل أنت مستعد للعمل معنا؟',
    'cta.d': 'اطلب الوصول التجاري. نتعامل مع وكلاء السفر والشركات المسجّلة فقط.',
    'cta.b1': 'طلب الوصول',
    'cta.b2': 'دخول الوكلاء',

    'foot.about': 'فنادق وخدمات سفر لوكلاء السفر والشركات المسجّلة.',
    'foot.services': 'الخدمات',
    'foot.company': 'الشركة',
    'foot.legal': 'قانوني',
    'foot.contact': 'التواصل',
    'foot.reg': 'بيانات التسجيل',
    'foot.rights': 'جميع الحقوق محفوظة.',
    'legal.privacy': 'سياسة الخصوصية',
    'legal.terms': 'شروط الاستخدام',
    'legal.cookies': 'سياسة ملفات تعريف الارتباط',
    'leg.company': 'اسم الشركة',
    'leg.number': 'رقم الشركة',
    'leg.office': 'المكتب المسجّل',
    'leg.vat': 'الرقم الضريبي (VAT)',
    'leg.licence': 'الترخيص',
    'leg.iata': 'رقم IATA',
    'wa.label': 'واتساب',
    'wa.text': 'مرحبًا، أودّ الاستفسار عن الوصول التجاري.'
  };

  var lang = 'en';
  var listeners = [];

  function t(key, vars) {
    var s = (lang === 'ar' && AR[key] != null) ? AR[key] : (EN[key] != null ? EN[key] : key);
    if (vars) s = s.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : ''; });
    return s;
  }

  function captureEnglish() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (EN[k] == null) EN[k] = el.innerHTML;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-aria');
      if (EN[k] == null) EN[k] = el.getAttribute('aria-label') || '';
    });
    document.querySelectorAll('[data-i18n-content]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-content');
      if (EN[k] == null) EN[k] = el.getAttribute('content') || '';
    });
  }

  function apply() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
    document.querySelectorAll('[data-i18n-content]').forEach(function (el) { el.setAttribute('content', t(el.getAttribute('data-i18n-content'))); });
    document.querySelectorAll('[data-only-lang]').forEach(function (el) { el.hidden = el.getAttribute('data-only-lang') !== lang; });
  }

  function emit() { listeners.forEach(function (fn) { try { fn(lang); } catch (e) { if (window.console) console.error(e); } }); }

  function setLang(l, persist) {
    lang = (l === 'ar') ? 'ar' : 'en';
    var root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (persist !== false) sset(STORE_KEY, lang);
    apply();
    emit();
  }

  function init() {
    captureEnglish();
    var q = null;
    try { q = new URLSearchParams(location.search).get('lang'); } catch (e) { /* ignore */ }
    var start = (q === 'ar' || q === 'en') ? q : (sget(STORE_KEY) || 'en');
    setLang(start, q ? true : false);   // first paint: don't write storage unless the visitor chose
  }

  B2B.i18n = {
    t: t,
    setLang: setLang,
    getLang: function () { return lang; },
    toggle: function () { setLang(lang === 'ar' ? 'en' : 'ar'); },
    onChange: function (fn) { listeners.push(fn); },
    /** Lets other scripts add translations (assets/js/i18n-extra.js). Must run before DOMContentLoaded. */
    extend: function (arObj, enObj) {
      var k;
      for (k in (arObj || {})) AR[k] = arObj[k];
      for (k in (enObj || {})) EN[k] = enObj[k];
    },
    apply: apply,
    _dump: function () { return Object.keys(AR).map(function (k) { return [k, EN[k] == null ? '' : EN[k], AR[k]]; }); }
  };

  // Deferred scripts run while readyState is already "interactive", so wait for
  // DOMContentLoaded (fires after ALL deferred scripts, i.e. after chrome.js / app.js
  // have rendered their markup and registered their onChange listeners).
  if (document.readyState === 'complete') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
