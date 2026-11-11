/* =====================================================================
   Extra translations (proof strip, portal preview, fuller footer).
   Same rules as i18n.js: Arabic written by an AI assistant -> needs review by
   a native Arabic speaker before launch.
   ===================================================================== */
(function () {
  'use strict';
  if (!window.B2B || !B2B.i18n || !B2B.i18n.extend) return;

  var AR = {
    /* proof strip */
    'proof.k': 'سجلّ الأعمال',
    'proof.t': 'سجلّ أعمالنا',
    'proof.years': 'سنوات من العمل',
    'proof.cities': 'مدن',
    'proof.hotels': 'فنادق',
    'proof.accred': 'الاعتمادات',
    'proof.partners': 'الشركاء',
    'proof.quotes': 'ماذا يقول الوكلاء',

    /* portal preview */
    'portal.k': 'اطّلع على البوابة',
    'portal.t': 'نظرة أولى على بوابة الشركاء',
    'portal.d': 'معاينة لبوابة الشركاء المخطَّطة، تُعرض ببيانات تجريبية. قد تختلف الشاشات النهائية.',
    'portal.b1': 'لوحة تحكم للحجوزات وطلبات التأشيرات والمحفظة',
    'portal.b2': 'قسائم فنادق برمز QR',
    'portal.badge': 'معاينة · بيانات تجريبية',
    'portal.cta': 'طلب الوصول',
    'portal.aria': 'معاينة لبوابة الشركاء ببيانات تجريبية: لوحة تحكم وقسيمة فندق تجريبية',
    'mock.title': 'بوابة الشركاء — معاينة',
    'mock.sample': 'بيانات تجريبية',
    'mock.nav.dash': 'لوحة التحكم',
    'mock.nav.bookings': 'الحجوزات',
    'mock.nav.wallet': 'المحفظة',
    'mock.search': 'ابحث في الحجوزات…',
    'mock.kpi1': 'حجوزات هذا الشهر',
    'mock.kpi2': 'طلبات تأشيرات قيد المعالجة',
    'mock.kpi3': 'رصيد المحفظة',
    'mock.kpi4': 'وصولات هذا الأسبوع',
    'mock.recent': 'أحدث الحجوزات',
    'mock.col.ref': 'المرجع',
    'mock.col.service': 'الخدمة',
    'mock.col.client': 'العميل',
    'mock.col.dates': 'التواريخ',
    'mock.col.status': 'الحالة',
    'mock.svc.hotel': 'فندق · دبي',
    'mock.svc.transfer': 'توصيل · دبي (DXB)',
    'mock.svc.visa': 'تأشيرة',
    'mock.svc.train': 'قطار الحرمين',
    'mock.client': 'عميل تجريبي',
    'mock.st.confirmed': 'مؤكَّد',
    'mock.st.progress': 'قيد المعالجة',
    'mock.st.pending': 'معلَّق',
    'v.wm': 'تجريبي',
    'v.title': 'قسيمة فندق',
    'v.preview': 'معاينة فقط — ليست قسيمة صالحة',
    'v.no': 'رقم القسيمة',
    'v.hotel': 'الفندق',
    'v.hotelname': 'فندق تجريبي · دبي',
    'v.guest': 'النزيل',
    'v.guestname': 'نزيل تجريبي',
    'v.in': 'تسجيل الوصول',
    'v.out': 'تسجيل المغادرة',
    'v.room': 'الغرفة',
    'v.roomtype': 'غرفة واحدة · نزيلان',
    'v.scan': 'رمز QR (تجريبي)',

    /* footer */
    'foot.touch': 'تواصل معنا',
    'foot.portal': 'معاينة البوابة',
    'foot.t.wa': 'راسلنا عبر واتساب',
    'foot.t.email': 'راسلنا بالبريد الإلكتروني',
    'foot.t.phone': 'اتصل بنا',

    /* photo credits line + "trading for N years" chip (rendered by pages.js) */
    'credits.photos': 'الصور',
    'hero.years': 'نعمل منذ {n} {u}',
    'hero.years.plus': 'نعمل منذ أكثر من {n} {u}'
  };

  // English for strings that JavaScript renders (everything else is read from the HTML).
  var EN = {
    'credits.photos': 'Photos',
    'hero.years': 'Trading for {n} {u}',
    'hero.years.plus': 'Trading for {n}+ {u}',
    'proof.years': 'Years trading',
    'proof.cities': 'Cities',
    'proof.hotels': 'Hotels'
  };

  B2B.i18n.extend(AR, EN);
})();
