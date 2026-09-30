// Câte descărcări au APK-urile din GitHub Releases. Rulare: npm run downloads
// (Repository-ul trebuie să fie public; fără autentificare, GitHub permite 60 de cereri pe oră.)
const REPO = 'zap-box-company/calendar-gunoi';

(async () => {
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'calendar-gunoi-downloads' },
  });
  if (!res.ok) {
    console.error(`GitHub a răspuns ${res.status}. Există repository-ul public și măcar un release?`);
    process.exitCode = 1;
    return;
  }
  const releases = await res.json();
  if (releases.length === 0) return console.log('Niciun release publicat încă.');

  let total = 0;
  for (const r of releases) {
    const count = r.assets.reduce((sum, a) => sum + a.download_count, 0);
    total += count;
    console.log(`\n${r.tag_name}  (${r.published_at?.slice(0, 10) ?? 'draft'})  – ${count} descărcări`);
    for (const a of r.assets) console.log(`   ${String(a.download_count).padStart(5)}  ${a.name}`);
  }
  console.log(`\nTotal: ${total} descărcări`);
})();
