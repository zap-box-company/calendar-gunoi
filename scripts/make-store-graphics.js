// Grafica pentru Google Play: store/graphics/feature-graphic.png (1024×500) și icon-512.png.
// Rulare: node scripts/make-store-graphics.js  (necesită sharp; SHARP_PATH poate indica alt proiect)
const fs = require('fs');
const path = require('path');
const sharp = require(process.env.SHARP_PATH || 'sharp');

const outDir = path.join(__dirname, '..', 'store', 'graphics');
fs.mkdirSync(outDir, { recursive: true });

// Pubela din iconița aplicației, la scara dată, cu colțul stânga-sus în (x, y).
const bin = (x, y, scale, fill, ribs) => `
  <g transform="translate(${x} ${y}) scale(${scale}) translate(-302 -300)">
    <path fill="${fill}" d="M436 300h152a20 20 0 0 1 20 20v18h94a20 20 0 0 1 0 40H322a20 20 0 0 1 0-40h94v-18a20 20 0 0 1 20-20z"/>
    <path fill="${fill}" d="M350 416h324l-28 290a38 38 0 0 1-38 34H416a38 38 0 0 1-38-34z"/>
    <path fill="${ribs}" d="M436 474h28v200h-28zM498 474h28v200h-28zM560 474h28v200h-28z"/>
  </g>`;

// Etichetele colorate ale fracțiilor (aceleași culori ca în aplicație).
const chips = [
  ['Pubelă neagră + maro', '#2B2F33', '#6D4C41', '#FFFFFF', 196],
  ['Sac galben / verde', '#FDD835', '#43A047', '#1B1B1B', 172],
  ['Sac albastru', '#1E88E5', '#0D47A1', '#FFFFFF', 128],
  ['Sac transparent', '#B0BEC5', '#ECEFF1', '#1B1B1B', 150],
];
let cx = 420;
const chipSvg = chips
  .map(([label, a, b, text, w], i) => {
    const x = i < 2 ? cx + (i === 1 ? 210 : 0) : 420 + (i === 3 ? 142 : 0);
    const y = i < 2 ? 318 : 372;
    return `
    <defs><linearGradient id="c${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect x="${x}" y="${y}" width="${w}" height="40" rx="20" fill="url(#c${i})"/>
    <text x="${x + w / 2}" y="${y + 26}" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="${text}">${label}</text>`;
  })
  .join('');

const feature = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1B5E20"/><stop offset="1" stop-color="#43A047"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>
  <circle cx="200" cy="250" r="150" fill="#FFFFFF" opacity="0.12"/>
  <rect x="90" y="140" width="220" height="220" rx="52" fill="#2E7D32"/>
  ${bin(122, 172, 0.36, '#FFFFFF', '#2E7D32')}
  <text x="420" y="172" font-family="Arial, sans-serif" font-size="58" font-weight="bold" fill="#FFFFFF">Program Gunoi</text>
  <text x="420" y="222" font-family="Arial, sans-serif" font-size="32" fill="#E8F5E9">Sâncraiu de Mureș &amp; Nazna</text>
  <text x="420" y="282" font-family="Arial, sans-serif" font-size="24" fill="#FFFFFF" opacity="0.92">Mementouri pentru fiecare ridicare, pe strada ta</text>
  ${chipSvg}
</svg>`);

(async () => {
  await sharp(feature).png().toFile(path.join(outDir, 'feature-graphic.png'));
  await sharp(path.join(__dirname, '..', 'assets', 'icon.png')).resize(512, 512).png().toFile(path.join(outDir, 'icon-512.png'));
  console.log('Grafica generată în store/graphics/');
})();
