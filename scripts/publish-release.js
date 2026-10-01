// Publică versiunea curentă pe GitHub și anunță toate aplicațiile instalate:
//   1. creează release-ul v<versiune> cu APK-urile din release/github/
//   2. pune versiunea în docs/program.json (latestApp) și mărește „version”,
//      ca aplicațiile să descarce anunțul și să afișeze „Versiune nouă disponibilă”
//   3. commit + push (GitHub Pages publică programul în 1–2 minute)
// Rulare, după `npm run build:apk:win`:  npm run publish:github
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const GH = process.env.GH || 'C:\\Program Files\\GitHub CLI\\gh.exe';
const REPO = 'zap-box-company/calendar-gunoi';

const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit' });
const out = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8' }).trim();

const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
const version = app.version;
const versionCode = app.android.versionCode;
const tag = `v${version}`;
const apks = ['CalendarGunoi.apk', 'CalendarGunoi-universal.apk'].map((f) => path.join(root, 'release', 'github', f));

for (const f of apks) {
  if (!fs.existsSync(f)) throw new Error(`Lipsește ${f} – rulează întâi npm run build:apk:win`);
}
if (out('git', ['status', '--porcelain'])) {
  throw new Error('Există modificări necomise – fă commit înainte de publicare.');
}

console.log(`> Release ${tag} (versionCode ${versionCode})`);
run(GH, [
  'release', 'create', tag, ...apks,
  '--repo', REPO, '--target', 'main', '--latest',
  '--title', `Program Gunoi Sâncraiu de Mureș & Nazna ${tag}`,
  '--notes', [
    `Versiunea ${version} a aplicației Calendar Gunoi.`,
    '',
    '**Descărcare:** `CalendarGunoi.apk` (majoritatea telefoanelor) sau `CalendarGunoi-universal.apk` (telefoane mai vechi).',
    'Se instalează peste versiunea veche – strada și setările rămân.',
    '',
    'Pagina cu instrucțiuni: https://zap-box-company.github.io/calendar-gunoi/',
  ].join('\n'),
]);

console.log('> Anunț în docs/program.json');
const programPath = path.join(root, 'docs', 'program.json');
const program = JSON.parse(fs.readFileSync(programPath, 'utf8'));
program.version += 1;
program.updated = new Date().toISOString().slice(0, 10);
program.latestApp = { versionCode, version };
// Păstrează câmpurile de sus în ordinea obișnuită.
const { sectors, ...head } = program;
fs.writeFileSync(programPath, JSON.stringify({ ...head, sectors }, null, 2) + '\n');

run('git', ['add', 'docs/program.json']);
run('git', ['commit', '-q', '-m', `Anunță versiunea ${version} în program.json`]);
run('git', ['-c', 'credential.helper=', '-c', `credential.helper=!"${GH}" auth git-credential`, 'push', '-q', 'origin', 'main']);

console.log(`\nGata. Aplicațiile cu versiunea 1.3.1 sau mai nouă vor afișa „Versiune nouă disponibilă: ${version}”`);
console.log(`(la următoarea verificare a programului, în cel mult 12 ore). Program.json: versiunea ${program.version}.`);
