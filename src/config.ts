/** Adresele publice ale proiectului (GitHub Pages / Releases). */
const GITHUB_USER = 'zap-box-company';
const REPO = 'calendar-gunoi';

export const SITE_URL = `https://${GITHUB_USER}.github.io/${REPO}`;

/** Programul actualizat; aplicația îl verifică periodic și funcționează și fără el. */
export const SCHEDULE_URL = `${SITE_URL}/program.json`;

export const PRIVACY_URL = `${SITE_URL}/privacy.html`;

/** Pagina de descărcare, trimisă vecinilor. */
export const DOWNLOAD_URL = `${SITE_URL}/`;

/**
 * Cheia Aptabase (statistici anonime, https://aptabase.com, regiunea EU: „A-EU-…”).
 * Poate veni și din `program.json` (câmpul `analyticsKey`), ca să se activeze fără APK nou.
 * Goală = statisticile sunt oprite.
 */
export const APTABASE_APP_KEY = 'A-EU-8924435110';

/** Release-urile GitHub, pentru numărul de descărcări (vezi `scripts/downloads.js`). */
export const GITHUB_REPO = `${GITHUB_USER}/${REPO}`;
