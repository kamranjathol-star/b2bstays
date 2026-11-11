/* =====================================================================
   SITE CONFIG — the single place to edit facts about the business.

   RULE: nothing in the "legal", "contact" or "support" blocks is shown on the
   site until you fill it in. Empty string = hidden. Do not invent values.

   NEVER put API keys, passwords or tokens in this file. It is public: every
   visitor can read it. Secrets belong on your server only.
   ===================================================================== */
window.SITE = {

  /* Trading name shown in the header, footer and page titles. */
  brand: { name: 'B2B Stays' },

  /* Public contact details. Shown only when filled in.
     whatsapp: digits only, with country code and no "+" or spaces, e.g. '447700900000'.
     When set, a WhatsApp button appears on every page. */
  contact: {
    email: '',
    whatsapp: '',
    phone: '',
  },

  /* Registered business details. Each line appears in the footer (and on the
     Privacy / Terms pages) ONLY when it has a value. */
  legal: {
    legalName: '',          // e.g. 'Example Travel Ltd' (if different from the trading name)
    companyNumber: '',      // Companies House number
    registeredOffice: '',   // full registered office address, one line
    vatNumber: '',
    licenceName: '',        // e.g. the name of your Saudi / UK licence or registration
    licenceNumber: '',
    iataNumber: '',
  },

  /* Support hours, defined in Saudi time (Asia/Riyadh, UTC+3, no daylight saving).
     The page converts them to UK time automatically (including BST/GMT changes).
     days: 0 = Sunday … 6 = Saturday.
     >>> CONFIRM THESE — they are placeholder working hours, not a promise. <<<
     Set days to [] (or open to '') to hide the whole support-hours block. */
  support: {
    timezone: 'Asia/Riyadh',
    days: [0, 1, 2, 3, 4],
    open: '09:00',
    close: '18:00',
  },

  /* Access-request form.
     endpoint: HTTPS URL of YOUR backend that accepts the JSON described in
               assets/js/api.js. Leave '' until it exists.
               - endpoint empty + contact.email set  -> opens the visitor's email app (mailto)
               - endpoint empty + no email           -> form shows "not connected yet" (nothing is sent) */
  form: {
    endpoint: '',
    timeoutMs: 15000,
    privacyVersion: '2026-11-10',   // bump when you change the privacy policy
  },

  /* Agent login. Leave '' while the portal is not live: every "Agent login"
     link then shows the "Portal opening soon" state. When the portal exists,
     put its URL here and all "Agent login" links will point to it. */
  portal: { loginUrl: '' },

  /* =====================================================================
     PHOTOS — use ONLY photos you own or have licensed. Leave src '' to keep
     the site's built-in illustration (or plain tile) for that slot.

     CURRENT PHOTOS are free-licence stock from Pexels (https://www.pexels.com/license/ —
     commercial use allowed, no attribution required; credits are shown anyway).
     They are generic pictures of famous places and premium hotels, NOT photos of
     specific hotels you sell: the alt text only says what is visible. Swap in your own
     whenever you have them.

     How to add / swap a photo:
       1. Put the original in  images-src/  named:  hero.jpg | svc-hotels.jpg |
          city-paris.jpg | hotel-pool.jpg   (see the groups below).
       2. Run:  cd tools && npm install && node optimize-images.mjs
          It writes AVIF + WebP + JPEG at several widths into assets/img/photos/
          (hero stays under 250 KB per file) and prints the exact line to paste here.
       3. Paste that line below and write the alt text in English AND Arabic
          (describe what the photo shows).

     Each entry: { src, widths, alt: { en, ar }, credit, position }
       credit   - licence / photographer text, shown small on the photo (optional)
       position - which part stays visible when cropped, e.g. '50% 30%' (optional)
     ===================================================================== */
  images: {
    hero: { src: 'assets/img/photos/hero', widths: [640, 1024, 1440, 1920],
      alt: { en: 'Rooftop infinity pool at twilight with the Kuala Lumpur skyline and the Petronas Towers beyond',
             ar: 'مسبح لا متناهٍ على سطح فندق عند الغسق تظهر خلفه أفق كوالالمبور وبرجا بتروناس' },
      credit: 'Photo: Azri Suratmin / Pexels', position: '50% 50%' },

    services: {            // photo header on each card of the Services page
      hotels:    { src: 'assets/img/photos/svc-hotels', widths: [480, 800, 1200],
        alt: { en: 'Hotel lobby with a grand staircase, marble floor and chandelier',
               ar: 'ردهة فندق فيها درج فخم وأرضية رخامية وثريا' },
        credit: 'Photo: Quang Nguyen Vinh / Pexels' },
      visa:      { src: 'assets/img/photos/svc-visa', widths: [480, 800, 1200],
        alt: { en: 'Hand holding an open passport whose pages carry colourful entry stamps',
               ar: 'يد تمسك جواز سفر مفتوحًا تحمل صفحاته أختام دخول ملونة' },
        credit: 'Photo: Ekaterina Belinskaya / Pexels', position: '50% 50%' },
      transfers: { src: 'assets/img/photos/svc-transfers', widths: [480, 800, 1200],
        alt: { en: 'White minibus parked at an airport terminal drop-off area',
               ar: 'حافلة صغيرة بيضاء متوقفة عند منطقة نزول الركاب في مبنى المطار' },
        credit: 'Photo: Yazid N / Pexels' },
      transport: { src: 'assets/img/photos/svc-transport', widths: [480, 800, 1200],
        alt: { en: 'White coach bus parked in an open lot',
               ar: 'حافلة سياحية بيضاء متوقفة في ساحة مفتوحة' },
        credit: 'Photo: Safi Erneste / Pexels' },
      ziyarat:   { src: 'assets/img/photos/svc-ziyarat', widths: [480, 800, 1200],
        alt: { en: 'Elephant Rock, a sandstone formation in AlUla, Saudi Arabia, in warm desert light',
               ar: 'صخرة الفيل، تكوين صخري رملي في العُلا بالمملكة العربية السعودية، في ضوء الصحراء الدافئ' },
        credit: 'Photo: ahmed moawad / Pexels', position: '50% 55%' },
      train:     { src: 'assets/img/photos/svc-train', widths: [480, 800, 1200],
        alt: { en: 'Railway station information board in Saudi Arabia showing Makkah and Jeddah Sulaymaniyah in Arabic',
               ar: 'لوحة معلومات في محطة قطار بالمملكة تعرض مكة المكرمة وجدة السليمانية' },
        credit: 'Photo: brokenadmiral_ / Pexels', position: '50% 53%' },
      corp:      { src: 'assets/img/photos/svc-corp', widths: [480, 800, 1200],
        alt: { en: 'Empty conference room with rows of chairs facing a projector screen',
               ar: 'قاعة مؤتمرات فارغة فيها صفوف من المقاعد تقابل شاشة عرض' },
        credit: 'Photo: Pavel Danilyuk / Pexels' },
    },

    destinations: {        // the world-destination tiles on the home page (keys match data-dest in index.html)
      dubai:     { src: 'assets/img/photos/city-dubai', widths: [480, 800, 1200],
        alt: { en: 'Aerial view of the skyscrapers of Dubai Marina lit up at night',
               ar: 'منظر جوي لأبراج دبي مارينا المضاءة ليلًا' },
        credit: 'Photo: Hassan Pasha / Pexels' },
      london:    { src: 'assets/img/photos/city-london', widths: [480, 800, 1200],
        alt: { en: 'Tower Bridge crossing the River Thames in London under a clear sky',
               ar: 'جسر البرج يعبر نهر التايمز في لندن تحت سماء صافية' },
        credit: 'Photo: Enrique / Pexels' },
      paris:     { src: 'assets/img/photos/city-paris', widths: [480, 800, 1200],
        alt: { en: 'The Eiffel Tower rising above Parisian rooftops',
               ar: 'برج إيفل يعلو أسطح باريس' },
        credit: 'Photo: Svitlana Shakalova / Pexels' },
      newyork:   { src: 'assets/img/photos/city-newyork', widths: [480, 800, 1200],
        alt: { en: 'Aerial view of the New York City skyline under a clear blue sky',
               ar: 'منظر جوي لأفق مدينة نيويورك تحت سماء زرقاء صافية' },
        credit: 'Photo: Vinicius A. Nascimento / Pexels' },
      singapore: { src: 'assets/img/photos/city-singapore', widths: [480, 800, 1200],
        alt: { en: 'The Marina Bay skyline in Singapore at dusk',
               ar: 'أفق خليج مارينا في سنغافورة عند الغسق' },
        credit: 'Photo: Bey The Great / Pexels' },
      maldives:  { src: 'assets/img/photos/city-maldives', widths: [480, 800, 1200],
        alt: { en: 'Overwater villas in the Maldives at sunset',
               ar: 'فلل فوق الماء في جزر المالديف عند الغروب' },
        credit: 'Photo: Asad Photo Maldives / Pexels' },
      istanbul:  { src: 'assets/img/photos/city-istanbul', widths: [480, 800, 1200],
        alt: { en: 'Galata Tower and the Bosphorus in Istanbul',
               ar: 'برج غلطة ومضيق البوسفور في إسطنبول' },
        credit: 'Photo: Naz Kurtuluş / Pexels' },
      bangkok:   { src: 'assets/img/photos/city-bangkok', widths: [480, 800, 1200],
        alt: { en: 'The Bangkok skyline along the Chao Phraya River under a partly cloudy sky',
               ar: 'أفق بانكوك على امتداد نهر تشاو فرايا تحت سماء غائمة جزئيًا' },
        credit: 'Photo: Sergei Gussev / Pexels' },
    },

    hotels: {              // the "premium hotels" tiles on the home page
      lobby: { src: 'assets/img/photos/svc-hotels', widths: [480, 800, 1200],
        alt: { en: 'Hotel lobby with a grand staircase, marble floor and chandelier',
               ar: 'ردهة فندق فيها درج فخم وأرضية رخامية وثريا' },
        credit: 'Photo: Quang Nguyen Vinh / Pexels' },
      suite: { src: 'assets/img/photos/hotel-suite', widths: [480, 800, 1200],
        alt: { en: 'Elegant hotel suite with ornate decor and plush bedding',
               ar: 'جناح فندقي أنيق بديكور مزخرف وفراش وثير' },
        credit: 'Photo: Chrislyn Dsouza / Pexels' },
      pool:  { src: 'assets/img/photos/hotel-pool', widths: [480, 800, 1200],
        alt: { en: 'Hotel resort with an infinity pool, palm trees and elegant architecture in warm evening light',
               ar: 'منتجع فندقي بمسبح لا متناهٍ ونخيل وعمارة أنيقة في ضوء المساء الدافئ' },
        credit: 'Photo: Сокіл Sokil / Pexels' },
    },
  },

  /* =====================================================================
     PROOF STRIP (shown on the "How it works" page) — every block is hidden
     until you fill it in, and the whole section stays hidden while everything
     is empty.
     Enter ONLY real, checkable facts. Quotes and logos need the person's /
     company's permission. Never invent numbers, awards or partners.
     ===================================================================== */
  proof: {
    yearsTrading: '',      // a number, e.g. 12
    cities: '',            // a number, e.g. 4
    hotels: '',            // a number of hotels you can book, e.g. 150
    accreditations: [],    // [{ name: 'Body name', number: 'Membership no.', logo: '', url: '' }]
    partners: [],          // [{ name: 'Partner name', logo: 'assets/img/partners/name.svg', url: '' }]
    quotes: [],            // [{ text: { en: '', ar: '' }, name: '', role: '', company: '', country: '' }]  (up to 3 shown)
  },

  /* Privacy / Terms / Cookies pages ship as DRAFT templates. A "draft" notice is
     shown on them until a qualified person has reviewed them and you set this to true. */
  legalPagesReviewed: false,

  /* Date shown as "last updated" on the legal pages. */
  legalUpdated: '10 November 2026',
};
