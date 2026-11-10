/* =====================================================================
   Original illustrated artwork (SVG) — hero skyline and destination tiles.
   Drawn for this site; no third-party images. To use real photography
   (own or licensed only) set the paths in SITE.destinations.
   ===================================================================== */
(function () {
  'use strict';
  var B2B = (window.B2B = window.B2B || {});

  function heroBg() {
    return '' +
'<div class="aurora a1"></div><div class="aurora a2"></div><div class="geo"></div><div class="stars"></div><div class="ring"></div>' +
'<svg class="skyline" viewBox="0 0 1600 360" preserveAspectRatio="xMidYMax meet" focusable="false">' +
'<defs>' +
'<linearGradient id="skFar" gradientUnits="userSpaceOnUse" x1="0" y1="160" x2="0" y2="360"><stop offset="0" stop-color="#2a8f7a" stop-opacity=".42"/><stop offset="1" stop-color="#0b5a4b" stop-opacity=".08"/></linearGradient>' +
'<linearGradient id="skMid" gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="360"><stop offset="0" stop-color="#15735f"/><stop offset=".55" stop-color="#083d33"/><stop offset="1" stop-color="#041f1a"/></linearGradient>' +
'<linearGradient id="skNear" gradientUnits="userSpaceOnUse" x1="0" y1="250" x2="0" y2="360"><stop offset="0" stop-color="#042a23"/><stop offset="1" stop-color="#010d0b"/></linearGradient>' +
'<radialGradient id="skOrb" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fff2c4"/><stop offset=".55" stop-color="#e2bd66"/><stop offset="1" stop-color="#9b7728"/></radialGradient>' +
'<radialGradient id="skGlow"><stop offset="0" stop-color="#f0d99a" stop-opacity=".6"/><stop offset="1" stop-color="#f0d99a" stop-opacity="0"/></radialGradient>' +
'<symbol id="palm" viewBox="-60 -120 120 120" overflow="visible"><g fill="none" stroke="#010d0b" stroke-linecap="round"><path d="M0 0C3 -30 6 -60 2 -92" stroke-width="4.5"/><g stroke-width="3.6">' +
'<path d="M2 -92Q-22 -112 -50 -86"/><path d="M2 -92Q-18 -118 -38 -108"/><path d="M2 -92Q-6 -116 -14 -118"/><path d="M2 -92Q2 -112 4 -118"/><path d="M2 -92Q10 -116 20 -116"/><path d="M2 -92Q22 -118 42 -106"/><path d="M2 -92Q26 -112 52 -84"/></g></g></symbol>' +
'</defs>' +
'<g class="lyr lyr-far"><path fill="url(#skFar)" d="M0 360V250H40V225H78V262H120V200H150V236H210V180H236V215H300V245H350V205H382V240H460V190H488V230H540V258H600V220H640V170H664V210H720V245H790V215H830V185H860V228H920V250H980V200H1010V238H1070V262H1140V215H1180V175H1205V225H1260V248H1330V210H1366V240H1420V195H1450V232H1510V255H1560V235H1600V360Z"/></g>' +
'<g class="lyr lyr-mid"><path fill="url(#skMid)" d="M0 360V298H48V268H96V292H150V258H196V286H250V300H330V284H362V300H478V280H520V246H548V282H600V300H700V272H738V300H800V262H836V290H900V300H1020V276H1050V300H1170V282H1210V250H1240V286H1290V300H1380V270H1416V240H1444V280H1500V298H1600V360Z"/>' +
'<g fill="url(#skMid)"><path d="M214 360V196H244V360Z"/><path d="M588 360V212H626V192H640V360Z"/><path d="M760 360V150L774 92L788 150V360Z"/><path d="M938 360V178L982 156V360Z"/><path d="M1318 360V168H1344V360Z"/><path d="M398 360L411 142H429L442 360Z"/>' +
'<path d="M1085 360V82Q1085 70 1097 70H1100Q1108 128 1120 128Q1132 128 1140 70H1143Q1155 70 1155 82V360Z"/></g>' +
'<rect x="1099" y="112" width="42" height="4" fill="#1f8a74" opacity=".6"/><path d="M420 105V60M1331 168V138" stroke="#15735f" stroke-width="2"/>' +
'<circle cx="420" cy="122" r="46" fill="url(#skGlow)"/><circle cx="420" cy="122" r="17" fill="url(#skOrb)"/><circle cx="420" cy="58" r="2.4" fill="#f0d99a"/><circle cx="1331" cy="136" r="2" fill="#f0d99a"/><circle cx="774" cy="90" r="2.2" fill="#f0d99a"/>' +
'<g class="win" fill="#f0d99a"><rect x="1091" y="150" width="3" height="3"/><rect x="1091" y="176" width="3" height="3"/><rect x="1146" y="160" width="3" height="3"/><rect x="1146" y="190" width="3" height="3"/><rect x="1120" y="148" width="3" height="3"/><rect x="1120" y="180" width="3" height="3"/><rect x="418" y="200" width="3" height="3"/><rect x="418" y="238" width="3" height="3"/><rect x="772" y="170" width="3" height="3"/><rect x="772" y="210" width="3" height="3"/><rect x="960" y="198" width="3" height="3"/><rect x="1329" y="190" width="3" height="3"/><rect x="226" y="214" width="3" height="3"/><rect x="606" y="230" width="3" height="3"/></g></g>' +
'<g class="lyr lyr-near"><path fill="url(#skNear)" d="M0 360V322C140 304 280 334 440 326S720 300 920 322S1260 336 1420 316S1560 320 1600 326V360Z"/>' +
'<g fill="url(#skNear)"><rect x="70" y="304" width="120" height="56"/><rect x="150" y="278" width="78" height="82"/><rect x="206" y="296" width="118" height="64"/><rect x="112" y="262" width="34" height="98"/><rect x="1300" y="306" width="90" height="54"/><rect x="1360" y="284" width="70" height="76"/><rect x="1420" y="300" width="100" height="60"/><rect x="1390" y="262" width="30" height="98"/></g>' +
'<g fill="none" stroke="#021a16" stroke-width="9" stroke-dasharray="12 8"><path d="M70 299.5H190M150 273.5H228M206 291.5H324M1300 301.5H1390M1360 279.5H1430M1420 295.5H1520"/><path d="M112 257.5H146M1390 257.5H1420" stroke-dasharray="8 6"/></g>' +
'<g fill="#f0d99a" opacity=".5"><path d="M92 336l5-12l5 12z"/><path d="M170 330l5-14l5 14z"/><path d="M250 338l5-12l5 12z"/><path d="M127 300l4-12l4 12z"/><path d="M1322 338l5-12l5 12z"/><path d="M1382 330l5-14l5 14z"/><path d="M1452 338l5-12l5 12z"/></g>' +
'<use href="#palm" x="492" y="244" width="96" height="96"/><use href="#palm" x="548" y="250" width="84" height="84"/><use href="#palm" x="940" y="238" width="104" height="104"/><use href="#palm" x="1188" y="244" width="92" height="92"/><use href="#palm" x="1530" y="226" width="108" height="108"/><use href="#palm" x="720" y="262" width="76" height="76"/><use href="#palm" x="-10" y="240" width="100" height="100"/></g>' +
'</svg><div class="grain"></div>';
  }

  /* Destination tiles — stylised, original, deliberately abstract. */
  var dest = {
    makkah:
'<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' +
'<defs><linearGradient id="dMk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e3b0"/><stop offset=".55" stop-color="#dc9f5c"/><stop offset="1" stop-color="#8d5b34"/></linearGradient></defs>' +
'<rect width="400" height="240" fill="url(#dMk)"/><circle cx="318" cy="64" r="24" fill="#fff6d8" opacity=".9"/>' +
'<path d="M0 240V172Q60 128 122 166T244 150T400 176V240Z" fill="#7a5130" opacity=".6"/><path d="M0 240V198Q80 160 160 192T320 182T400 202V240Z" fill="#4a2f1c"/>' +
'<g fill="#26170d"><rect x="194" y="78" width="14" height="132"/><rect x="183" y="108" width="36" height="34" rx="2"/><rect x="190" y="68" width="22" height="12" rx="2"/><path d="M201 68V44" stroke="#26170d" stroke-width="2.5"/></g>' +
'<circle cx="201" cy="125" r="11" fill="#f0d99a"/><path d="M201 118v7l5 3" stroke="#26170d" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
'<path d="M201 30a7 7 0 1 0 5 12a5.5 5.5 0 1 1-5-12z" fill="#f0d99a"/></svg>',

    madinah:
'<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' +
'<defs><linearGradient id="dMd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4f1e6"/><stop offset=".5" stop-color="#4fb094"/><stop offset="1" stop-color="#0d4b3f"/></linearGradient></defs>' +
'<rect width="400" height="240" fill="url(#dMd)"/><circle cx="82" cy="58" r="20" fill="#fffbe8" opacity=".85"/>' +
'<g fill="#07332b"><rect x="140" y="84" width="11" height="130"/><rect x="134" y="104" width="23" height="7"/><rect x="134" y="142" width="23" height="7"/><path d="M137 84h17L145.500 56Z"/><rect x="249" y="84" width="11" height="130"/><rect x="243" y="104" width="23" height="7"/><rect x="243" y="142" width="23" height="7"/><path d="M246 84h17L254.500 56Z"/></g>' +
'<g fill="#f0d99a"><circle cx="145.500" cy="52" r="3.500"/><circle cx="254.500" cy="52" r="3.500"/></g>' +
'<path d="M0 240V206H400V240Z" fill="#04251f"/><path d="M0 206h400" stroke="#0d6b58" stroke-width="2"/>' +
'<g fill="none" stroke="#04251f" stroke-linecap="round"><path d="M44 206C46 184 48 168 46 148" stroke-width="4"/><path d="M46 148Q30 138 14 152M46 148Q34 130 22 130M46 148Q46 132 48 126M46 148Q58 132 70 134M46 148Q62 138 78 152" stroke-width="3"/></g></svg>',

    jeddah:
'<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' +
'<defs><linearGradient id="dJd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7f4f8"/><stop offset=".5" stop-color="#6cbfd3"/><stop offset="1" stop-color="#1c6f8c"/></linearGradient></defs>' +
'<rect width="400" height="240" fill="url(#dJd)"/><circle cx="92" cy="60" r="22" fill="#fffbe8" opacity=".9"/>' +
'<path d="M200 38L214 176H186Z" fill="#0f4a5e"/><path d="M200 38L207 176H200Z" fill="#fff" opacity=".12"/>' +
'<path d="M0 240V178H400V240Z" fill="#1c6f8c"/><path d="M0 188Q25 178 50 188T100 188T150 188T200 188T250 188T300 188T350 188T400 188V240H0Z" fill="#14566d"/>' +
'<path d="M0 206Q25 196 50 206T100 206T150 206T200 206T250 206T300 206T350 206T400 206V240H0Z" fill="#0d4054"/>' +
'<path d="M286 168h38l-7 11h-24Z" fill="#fffbe8"/><path d="M305 112v56M305 114l22 50h-22Z" fill="#fffbe8" stroke="#fffbe8" stroke-width="1.5"/></svg>',

    riyadh:
'<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' +
'<defs><linearGradient id="dRy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26356a"/><stop offset=".55" stop-color="#9a5a6a"/><stop offset="1" stop-color="#eaa75c"/></linearGradient><radialGradient id="dRyO" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fff2c4"/><stop offset=".6" stop-color="#e2bd66"/><stop offset="1" stop-color="#9b7728"/></radialGradient></defs>' +
'<rect width="400" height="240" fill="url(#dRy)"/><g fill="#fff" opacity=".8"><circle cx="40" cy="30" r="1.2"/><circle cx="110" cy="52" r="1"/><circle cx="330" cy="26" r="1.2"/><circle cx="364" cy="66" r="1"/></g>' +
'<g fill="#1b1330"><path d="M232 214V62Q232 54 241 54H244Q250 102 258 102Q266 102 272 54H275Q284 54 284 62V214Z"/><path d="M106 214L116 100H128L138 214Z"/><rect x="170" y="130" width="22" height="84"/><rect x="296" y="150" width="26" height="64"/><rect x="62" y="156" width="26" height="58"/></g>' +
'<rect x="243" y="86" width="30" height="3" fill="#eaa75c" opacity=".7"/><circle cx="122" cy="88" r="13" fill="url(#dRyO)"/><path d="M122 75V52" stroke="#1b1330" stroke-width="2"/>' +
'<path d="M0 240V214Q70 200 140 214T290 208T400 216V240Z" fill="#0e0a1c"/></svg>'
  };

  B2B.art = { heroBg: heroBg, dest: dest };
})();
