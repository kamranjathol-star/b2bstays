'use strict';
/* Server-side validation of the access-request form (the page validates too, but never trust the page). */

const ISO = new Set(('AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ ' +
  'DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP ' +
  'KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ ' +
  'OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ ' +
  'UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' '));

const SERVICES = ['hotels', 'visa', 'transfers', 'transport', 'ziyarat', 'train', 'corporate'];
const VOLUMES = ['unsure', 'lt10', '10-50', '51-200', 'gt200'];

// ASCII control characters plus the Unicode line / paragraph separators (built from char codes on purpose).
const CONTROL = new RegExp('[\\x00-\\x1f\\x7f' + String.fromCharCode(0x2028, 0x2029) + ']+', 'g');

/** Plain text: strip control characters, collapse spaces, cap the length. */
function text(v, max) {
  return String(v == null ? '' : v).replace(CONTROL, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

/**
 * @param {object} b the parsed JSON body
 * @returns {{ok:true, data:object} | {ok:false, errors:object}}
 */
function validateAccessRequest(b) {
  const errors = {};
  if (!b || typeof b !== 'object' || Array.isArray(b)) return { ok: false, errors: { _: 'Invalid request.' } };

  const company = text(b.company, 120);
  if (company.length < 2) errors.company = 'Enter your company name.';

  const contactName = text(b.contactName, 100);
  if (contactName.length < 2) errors.contactName = 'Enter your name.';

  const email = text(b.email, 160).toLowerCase();
  if (!/^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/.test(email) || email.length > 160) errors.email = 'Enter a valid email address.';

  const whatsapp = text(b.whatsapp, 24).replace(/[\s\-().]/g, '');
  if (!/^\+[1-9]\d{6,14}$/.test(whatsapp)) errors.whatsapp = 'Enter a valid number including the country code.';

  const country = text(b.country, 2).toUpperCase();
  if (!ISO.has(country)) errors.country = 'Choose your country.';

  const tradeNumber = text(b.tradeNumber, 60);

  const services = Array.isArray(b.services) ? b.services.map(function (s) { return text(s, 20); }).filter(function (s, i, a) { return SERVICES.indexOf(s) !== -1 && a.indexOf(s) === i; }) : [];
  if (!services.length) errors.services = 'Choose at least one service.';

  const monthlyVolume = text(b.monthlyVolume, 10);
  if (VOLUMES.indexOf(monthlyVolume) === -1) errors.monthlyVolume = 'Choose your expected volume.';

  const consent = b.consent && typeof b.consent === 'object' ? b.consent : {};
  if (consent.accepted !== true) errors.consent = 'Consent is required.';
  const at = Date.parse(consent.at);

  const meta = b.meta && typeof b.meta === 'object' ? b.meta : {};

  if (Object.keys(errors).length) return { ok: false, errors: errors };

  return {
    ok: true,
    data: {
      company: company,
      contactName: contactName,
      email: email,
      whatsapp: whatsapp,
      country: country,
      tradeNumber: tradeNumber,
      services: services,
      monthlyVolume: monthlyVolume,
      consent: {
        accepted: true,
        text: text(consent.text, 800),
        version: text(consent.version, 24),
        at: isNaN(at) ? null : new Date(at).toISOString()
      },
      lang: meta.lang === 'ar' ? 'ar' : 'en'
    }
  };
}

module.exports = { validateAccessRequest, text, SERVICES, VOLUMES };
