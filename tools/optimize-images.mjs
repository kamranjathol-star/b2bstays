#!/usr/bin/env node
/* =====================================================================
   Photo optimiser for the B2B Stays site.

   What it does
   - Reads your ORIGINAL photos from  images-src/   (never deployed)
   - Writes AVIF + WebP + JPEG at several widths to  assets/img/photos/
   - Enforces a size budget per file: hero <= 250 KB, everything else <= 140 KB
     (it lowers the quality until the file fits)
   - Strips metadata (GPS, camera info) and applies EXIF rotation
   - Prints the exact lines to paste into assets/js/site-config.js

   Usage (from the tools/ folder, once: npm install sharp)
       node optimize-images.mjs                      # uses ../images-src and ../assets/img/photos
       node optimize-images.mjs <srcDir> <outDir>

   File names decide where a photo is used:
       hero.jpg                     -> hero (full-bleed background)
       svc-hotels.jpg               -> service card photo   (hotels | visa | transfers |
       svc-visa.jpg ...                                      transport | ziyarat | train | corp)
       city-dubai.jpg               -> destination tile     (city-<any-name>, e.g. city-paris)
       hotel-pool.jpg               -> premium-hotel tile   (hotel-<any-name>)

   Only use photos you own or have licensed. Keep the licence / credit text
   to put in the "credit" field.
   ===================================================================== */
import sharp from 'sharp';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.resolve(process.argv[2] || path.join(root, 'images-src'));
const OUT = path.resolve(process.argv[3] || path.join(root, 'assets/img/photos'));
const WEB_BASE = 'assets/img/photos';

const PROFILES = {
  hero: { widths: [640, 1024, 1440, 1920], maxBytes: 250 * 1024 },
  card: { widths: [480, 800, 1200], maxBytes: 140 * 1024 },
};
const FORMATS = [
  { ext: 'avif', start: 62, run: (img, q) => img.avif({ quality: q, effort: 4 }) },
  { ext: 'webp', start: 80, run: (img, q) => img.webp({ quality: q, effort: 5 }) },
  { ext: 'jpg', start: 80, run: (img, q) => img.jpeg({ quality: q, mozjpeg: true, progressive: true }) },
];
const MIN_QUALITY = 30;

const SVC = ['hotels', 'visa', 'transfers', 'transport', 'ziyarat', 'train', 'corp'];

function configPath(name) {
  if (name === 'hero') return 'hero';
  let m = /^svc-(.+)$/.exec(name);
  if (m && SVC.includes(m[1])) return `services.${m[1]}`;
  m = /^city-([a-z0-9-]+)$/.exec(name);
  if (m) return `destinations.${m[1].replace(/-/g, '')}`;
  m = /^hotel-([a-z0-9-]+)$/.exec(name);
  if (m) return `hotels.${m[1].replace(/-/g, '')}`;
  return null;
}
const kb = n => (n / 1024).toFixed(0).padStart(4) + ' KB';

async function main() {
  let files;
  try { files = (await readdir(SRC)).filter(f => /\.(jpe?g|png|webp|tiff?)$/i.test(f)); }
  catch { console.error(`Source folder not found: ${SRC}\nCreate it and put your original photos there.`); process.exit(1); }
  if (!files.length) { console.error(`No images found in ${SRC}`); process.exit(1); }
  await mkdir(OUT, { recursive: true });

  const snippets = [];
  let problems = 0;

  for (const file of files.sort()) {
    const name = path.parse(file).name.toLowerCase();
    const cfgPath = configPath(name);
    const profile = name === 'hero' ? PROFILES.hero : PROFILES.card;
    if (!cfgPath) { console.warn(`! Skipping "${file}": name must be hero, svc-<service>, city-<name> or hotel-<name>.`); problems++; continue; }

    const { data, info } = await sharp(path.join(SRC, file)).rotate().toBuffer({ resolveWithObject: true });
    let widths = profile.widths.filter(w => w <= info.width);
    if (!widths.length) widths = [info.width];
    if (name === 'hero' && info.width < 1600) { console.warn(`! ${file}: only ${info.width}px wide; a hero looks soft below ~1920px.`); }
    if (name === 'hero' && info.height / info.width > 0.75) { console.warn(`! ${file}: not very wide; a landscape photo (about 16:9) crops best.`); }

    console.log(`\n${file}  (${info.width}x${info.height})  budget ${kb(profile.maxBytes).trim()} per file`);
    for (const w of widths) {
      const row = [];
      for (const f of FORMATS) {
        let q = f.start, buf;
        for (;;) {
          buf = await f.run(sharp(data).resize({ width: w, withoutEnlargement: true }), q).toBuffer();
          if (buf.length <= profile.maxBytes || q <= MIN_QUALITY) break;
          q -= 4;
        }
        const over = buf.length > profile.maxBytes;
        if (over) problems++;
        await writeFile(path.join(OUT, `${name}-${w}.${f.ext}`), buf);
        row.push(`${f.ext} ${kb(buf.length)} q${q}${over ? ' OVER BUDGET' : ''}`);
      }
      console.log(`  ${String(w).padStart(4)}w   ${row.join('   ')}`);
    }
    snippets.push({ cfgPath, line: `{ src: '${WEB_BASE}/${name}', widths: [${widths.join(', ')}], alt: { en: '', ar: '' }, credit: '', position: '50% 50%' }` });
  }

  console.log('\n=====  Paste into assets/js/site-config.js  (inside  images: { ... } )  =====');
  for (const s of snippets) console.log(`  ${s.cfgPath}:\n    ${s.line}`);
  console.log('\nThen fill alt.en and alt.ar with a description of what the photo shows (e.g. "Hotel lobby with marble floor").');
  if (problems) { console.log(`\n${problems} warning(s) above - check them before publishing.`); process.exitCode = 2; }
  else console.log('\nAll files are within budget.');
}
main().catch(e => { console.error(e); process.exit(1); });
