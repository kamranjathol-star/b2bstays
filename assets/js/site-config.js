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

  /* Destination photos. Use ONLY photos you own or have licensed.
     Put files in assets/img/ and reference them here, e.g.
       makkah: { photo: 'assets/img/makkah.jpg', alt: 'Description', credit: 'Photo: Name / Licence' }
     Without a photo, the site shows its own illustrated artwork. */
  destinations: {
    makkah:  { photo: '', alt: '', credit: '' },
    madinah: { photo: '', alt: '', credit: '' },
    jeddah:  { photo: '', alt: '', credit: '' },
    riyadh:  { photo: '', alt: '', credit: '' },
  },

  /* Privacy / Terms / Cookies pages ship as DRAFT templates. A "draft" notice is
     shown on them until a qualified person has reviewed them and you set this to true. */
  legalPagesReviewed: false,

  /* Date shown as "last updated" on the legal pages. */
  legalUpdated: '10 November 2026',
};
