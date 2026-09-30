// Codul QR al paginii de descărcare (docs/qr.svg + qr.png pentru tipărit).
// Rulare: node scripts/make-qr.js
const path = require('path');
const QRCode = require('qrcode');

const URL = 'https://zap-box-company.github.io/calendar-gunoi/';
const docs = (f) => path.join(__dirname, '..', 'docs', f);
const opts = { margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1B5E20', light: '#FFFFFF' } };

(async () => {
  await QRCode.toFile(docs('qr.svg'), URL, { ...opts, type: 'svg' });
  await QRCode.toFile(docs('qr.png'), URL, { ...opts, width: 1024 });
  console.log('QR generat pentru', URL);
})();
