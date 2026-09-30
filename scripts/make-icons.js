// Generează iconițele aplicației din SVG. Rulare: node scripts/make-icons.js
// Necesită `sharp` (npm i -D sharp) sau o cale către un sharp existent în SHARP_PATH.
const path = require('path');
const sharp = require(process.env.SHARP_PATH || 'sharp');

const GREEN = '#2E7D32';
const out = (f) => path.join(__dirname, '..', 'assets', f);

// Pubelă stilizată pe un canvas 1024×1024, cu conținutul în zona sigură (~66%).
const bin = (fill, ribs) => `
  <path fill="${fill}" d="M436 300h152a20 20 0 0 1 20 20v18h94a20 20 0 0 1 0 40H322a20 20 0 0 1 0-40h94v-18a20 20 0 0 1 20-20z"/>
  <path fill="${fill}" d="M350 416h324l-28 290a38 38 0 0 1-38 34H416a38 38 0 0 1-38-34z"/>
  ${ribs ? `<path fill="${ribs}" d="M436 474h28v200h-28zM498 474h28v200h-28zM560 474h28v200h-28z"/>` : ''}`;

const svg = (body, bg) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
     ${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''}${body}</svg>`);

(async () => {
  await sharp(svg(bin('#FFFFFF', GREEN), GREEN)).png().toFile(out('icon.png'));
  await sharp(svg(bin('#FFFFFF', GREEN), GREEN)).resize(1024).png().toFile(out('splash-icon.png'));
  await sharp(svg(bin('#FFFFFF', GREEN), GREEN)).resize(48).png().toFile(out('favicon.png'));
  await sharp(svg('', GREEN)).png().toFile(out('android-icon-background.png'));
  await sharp(svg(bin('#FFFFFF', GREEN))).png().toFile(out('android-icon-foreground.png'));
  await sharp(svg(bin('#FFFFFF', '#00000000'))).png().toFile(out('android-icon-monochrome.png'));
  await sharp(svg(bin('#FFFFFF', '#00000000'))).resize(96).png().toFile(out('notification-icon.png'));
  console.log('Iconițe generate în assets/');
})();

// Previzualizarea widgetului din lista de widgeturi a telefonului.
(async () => {
  const preview = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="540" height="330" viewBox="0 0 540 330">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2B2F33"/><stop offset="1" stop-color="#6D4C41"/></linearGradient></defs>
    <rect width="540" height="330" rx="48" fill="url(#g)"/>
    <text x="40" y="62" font-family="Arial, sans-serif" font-size="26" fill="#FFFFFF" opacity="0.85" letter-spacing="3">URMĂTOAREA RIDICARE</text>
    <text x="40" y="132" font-family="Arial, sans-serif" font-size="68" font-weight="bold" fill="#FFFFFF">Mâine</text>
    <text x="40" y="176" font-family="Arial, sans-serif" font-size="32" fill="#FFFFFF">Joi, 1 octombrie</text>
    <rect x="28" y="206" width="484" height="96" rx="24" fill="#FFFFFF" opacity="0.9"/>
    <text x="52" y="248" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="#1B1B1B">Pubelă neagră + Pubelă maro</text>
    <text x="52" y="284" font-family="Arial, sans-serif" font-size="24" fill="#555555">Str. Magnoliei</text>
  </svg>`);
  await sharp(preview).png().toFile(out('widget-preview.png'));
  console.log('Previzualizare widget generată');
})();
