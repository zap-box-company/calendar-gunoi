import { DateKey, WasteType, daysBetween, fromKey } from './data/schedule';

export type Lang = 'ro' | 'en';

interface WasteText {
  title: string;
  container: string;
  /** Eticheta scurtă din titlul notificării. */
  short: string;
}

interface Strings {
  locale: string;
  months: string[];
  monthsShort: string[];
  weekdays: string[];
  weekdaysShort: string[];
  waste: Record<WasteType, WasteText>;
  nextPickup: string;
  today: string;
  tomorrow: string;
  yesterday: string;
  inDays: (n: number) => string;
  daysAgo: (n: number) => string;
  unitDays: string;
  unitHours: string;
  unitMin: string;
  untilPickup: string;
  pickupToday: string;
  noMorePickups: string;
  noDateLeft: string;
  notifications: string;
  eveAt: (time: string) => string;
  morningAt: (time: string) => string;
  remindersOff: string;
  notificationsBlocked: string;
  allow: string;
  nextReminder: (when: string) => string;
  noReminders: string;
  test: string;
  upcomingPickups: string;
  untilDate: (date: string) => string;
  all: string;
  empty: string;
  exception: string;
  exportButton: string;
  openInCalendar: string;
  saveIcs: string;
  shareIcs: string;
  savedIcs: string;
  exportFailed: string;
  channelName: string;
  eveTitle: (labels: string) => string;
  morningTitle: (labels: string) => string;
  eveFooter: string;
  morningFooter: string;
  calendarName: (street: string) => string;
  icsDescription: (title: string, container: string) => string;
  icsException: string;
  icsExceptionDesc: string;
  icsAlarmEve: string;
  icsAlarmMorning: string;
  moreOptions: string;
  cancel: string;
  welcomeTitle: string;
  welcomeText: string;
  chooseStreet: string;
  searchStreet: string;
  noStreetFound: string;
  sector: (n: number) => string;
  sectorHint: (weekday: string) => string;
  continue: string;
  save: string;
  changeStreet: string;
  street: (name: string) => string;
  note: string;
  doneAction: string;
  markDone: string;
  doneLabel: string;
  undo: string;
  settings: string;
  sectionStreet: string;
  sectionLanguage: string;
  sectionReminders: string;
  eveReminder: string;
  morningReminder: string;
  off: string;
  sendTest: string;
  reliabilityTitle: string;
  reliabilityText: string;
  phoneTips: string;
  batterySettings: string;
  exactAlarms: string;
  later: string;
  check: string;
  sectionSchedule: string;
  scheduleVersion: (version: number, updated: string) => string;
  checkUpdates: string;
  checking: string;
  updateUpdated: string;
  updateCurrent: string;
  updateError: string;
  sectionAbout: string;
  appVersion: (v: string) => string;
  privacy: string;
  shareApp: string;
  shareAppMessage: (url: string) => string;
  close: string;
  widgetNoStreet: string;
  widgetNone: string;
}

/** Numeralele românești: „5 zile”, dar „20 de zile”, „101 zile”. */
const roCount = (n: number, word: string) => {
  const rest = n % 100;
  return n >= 20 && (rest === 0 || rest >= 20) ? `${n} de ${word}` : `${n} ${word}`;
};

const ro: Strings = {
  locale: 'ro-RO',
  months: ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'],
  monthsShort: ['ian.', 'feb.', 'mar.', 'apr.', 'mai', 'iun.', 'iul.', 'aug.', 'sept.', 'oct.', 'nov.', 'dec.'],
  weekdays: ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'],
  weekdaysShort: ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'],
  waste: {
    residual: { title: 'Rezidual + Biodeșeu', container: 'Pubelă neagră + Pubelă maro', short: 'Pubelă neagră/maro' },
    plastic: { title: 'Plastic și Metal', container: 'Sac galben / Sac verde', short: 'Sac galben/verde' },
    paper: { title: 'Hârtie și Carton', container: 'Sac albastru', short: 'Sac albastru' },
    glass: { title: 'Sticlă', container: 'Sac transparent', short: 'Sac transparent' },
  },
  nextPickup: 'URMĂTOAREA RIDICARE',
  today: 'Astăzi',
  tomorrow: 'Mâine',
  yesterday: 'Ieri',
  inDays: (n) => `în ${roCount(n, 'zile')}`,
  daysAgo: (n) => `acum ${roCount(n, 'zile')}`,
  unitDays: 'zile',
  unitHours: 'ore',
  unitMin: 'min',
  untilPickup: 'până la 06:00 în ziua ridicării',
  pickupToday: 'Ridicarea este astăzi – scoate pubelele/sacii la poartă!',
  noMorePickups: 'Nu mai sunt ridicări programate. Programul pentru perioada următoare apare aici după actualizare.',
  noDateLeft: 'Nicio dată rămasă',
  notifications: 'Notificări',
  eveAt: (t) => `${t} cu o zi înainte`,
  morningAt: (t) => `${t} în ziua ridicării`,
  remindersOff: 'Mementourile sunt oprite',
  notificationsBlocked: 'Notificările sunt blocate pentru aplicație.',
  allow: 'Permite',
  nextReminder: (when) => `Următorul memento: ${when}`,
  noReminders: 'Nu mai sunt mementouri programate.',
  test: 'Test',
  upcomingPickups: 'Ridicări programate',
  untilDate: (d) => `până la ${d}`,
  all: 'Toate',
  empty: 'Nu există ridicări de afișat pentru această selecție.',
  exception: 'NU se ridică deșeuri din ambalaje',
  exportButton: 'Export Google Calendar',
  openInCalendar: 'Deschide în calendar',
  saveIcs: 'Salvează fișierul .ics',
  shareIcs: 'Trimite fișierul .ics',
  savedIcs: 'Fișierul .ics a fost salvat',
  exportFailed: 'Exportul nu a reușit',
  channelName: 'Ridicări deșeuri',
  eveTitle: (l) => `Mâine se ridică: ${l}`,
  morningTitle: (l) => `Astăzi se ridică: ${l}`,
  eveFooter: 'Pregătește-le în seara aceasta.',
  morningFooter: 'Scoate-le la poartă în această dimineață.',
  calendarName: (street) => `Gunoi – ${street}`,
  icsDescription: (title, container) => `Ridicare ${title} (${container}).`,
  icsException: '⚠️ NU se ridică deșeuri din ambalaje',
  icsExceptionDesc: 'Excepție de la programul de ridicare.',
  icsAlarmEve: 'Mâine',
  icsAlarmMorning: 'Astăzi',
  moreOptions: 'Mai multe opțiuni',
  cancel: 'Anulează',
  welcomeTitle: 'Bun venit!',
  welcomeText: 'Alege strada ta ca să vezi programul de ridicare a gunoiului și să primești mementouri.',
  chooseStreet: 'Alege strada',
  searchStreet: 'Caută strada…',
  noStreetFound: 'Nicio stradă găsită.',
  sector: (n) => `Sectorul ${n}`,
  sectorHint: (w) => `Pubela neagră/maro: ${w.toLowerCase()}`,
  continue: 'Continuă',
  save: 'Salvează',
  changeStreet: 'Schimbă strada',
  street: (name) => `Str. ${name}`,
  note: 'Observație',
  doneAction: 'Am scos-o',
  markDone: '✓ Am scos-o la poartă',
  doneLabel: '✓ Scoasă la poartă – fără memento dimineața',
  undo: 'Anulează',
  settings: 'Setări',
  sectionStreet: 'Strada',
  sectionLanguage: 'Limba',
  sectionReminders: 'Mementouri',
  eveReminder: 'Cu o zi înainte',
  morningReminder: 'În ziua ridicării',
  off: 'Oprit',
  sendTest: 'Trimite o notificare de test',
  reliabilityTitle: 'Primești notificările la timp?',
  reliabilityText:
    'Pe unele telefoane (Samsung, Xiaomi, Huawei, Oppo) economisirea bateriei poate bloca sau întârzia notificările. Setează aplicația „Calendar Gunoi” la „Fără restricții”.',
  phoneTips:
    'Samsung: Setări → Aplicații → Calendar Gunoi → Baterie → Fără restricții\nXiaomi: Setări → Aplicații → Calendar Gunoi → Economisire baterie → Fără restricții; activează și „Pornire automată”\nHuawei: Setări → Baterie → Lansare aplicații → Calendar Gunoi → Gestionare manuală (toate activate)',
  batterySettings: 'Setări baterie',
  exactAlarms: 'Alarme exacte',
  later: 'Mai târziu',
  check: 'Verifică',
  sectionSchedule: 'Programul de colectare',
  scheduleVersion: (v, u) => `Versiunea ${v} · actualizat ${u}`,
  checkUpdates: 'Verifică actualizări',
  checking: 'Se verifică…',
  updateUpdated: 'Programul a fost actualizat.',
  updateCurrent: 'Ai deja cel mai nou program.',
  updateError: 'Nu s-a putut verifica (fără internet?).',
  sectionAbout: 'Despre',
  appVersion: (v) => `Versiunea aplicației ${v}`,
  privacy: 'Politica de confidențialitate',
  shareApp: 'Trimite aplicația unui vecin',
  shareAppMessage: (url) => `Calendarul gunoiului pentru Sâncraiu de Mureș și Nazna, cu mementouri: ${url}`,
  close: 'Închide',
  widgetNoStreet: 'Deschide aplicația și alege strada',
  widgetNone: 'Nicio ridicare programată',
};

const en: Strings = {
  locale: 'en-GB',
  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  waste: {
    residual: { title: 'Residual + Bio-waste', container: 'Black bin + Brown bin', short: 'Black/brown bin' },
    plastic: { title: 'Plastic & Metal', container: 'Yellow bag / Green bag', short: 'Yellow/green bag' },
    paper: { title: 'Paper & Cardboard', container: 'Blue bag', short: 'Blue bag' },
    glass: { title: 'Glass', container: 'Clear bag', short: 'Clear bag' },
  },
  nextPickup: 'NEXT PICKUP',
  today: 'Today',
  tomorrow: 'Tomorrow',
  yesterday: 'Yesterday',
  inDays: (n) => `in ${n} days`,
  daysAgo: (n) => `${n} days ago`,
  unitDays: 'days',
  unitHours: 'hours',
  unitMin: 'min',
  untilPickup: 'until 06:00 on pickup day',
  pickupToday: 'Pickup is today – put the bins/bags out!',
  noMorePickups: 'No more pickups scheduled. The next schedule will appear here after an update.',
  noDateLeft: 'No dates left',
  notifications: 'Notifications',
  eveAt: (t) => `${t} the day before`,
  morningAt: (t) => `${t} on pickup day`,
  remindersOff: 'Reminders are off',
  notificationsBlocked: 'Notifications are blocked for this app.',
  allow: 'Allow',
  nextReminder: (when) => `Next reminder: ${when}`,
  noReminders: 'No more reminders scheduled.',
  test: 'Test',
  upcomingPickups: 'Scheduled pickups',
  untilDate: (d) => `until ${d}`,
  all: 'All',
  empty: 'No pickups to show for this selection.',
  exception: 'NO packaging waste collection',
  exportButton: 'Export Google Calendar',
  openInCalendar: 'Open in calendar',
  saveIcs: 'Save .ics file',
  shareIcs: 'Share .ics file',
  savedIcs: 'The .ics file was saved',
  exportFailed: 'Export failed',
  channelName: 'Waste pickups',
  eveTitle: (l) => `Tomorrow's pickup: ${l}`,
  morningTitle: (l) => `Today's pickup: ${l}`,
  eveFooter: 'Get them ready this evening.',
  morningFooter: 'Put them out this morning.',
  calendarName: (street) => `Waste pickup – ${street}`,
  icsDescription: (title, container) => `${title} pickup (${container}).`,
  icsException: '⚠️ NO packaging waste collection',
  icsExceptionDesc: 'Exception to the pickup schedule.',
  icsAlarmEve: 'Tomorrow',
  icsAlarmMorning: 'Today',
  moreOptions: 'More options',
  cancel: 'Cancel',
  welcomeTitle: 'Welcome!',
  welcomeText: 'Choose your street to see your waste pickup schedule and get reminders.',
  chooseStreet: 'Choose your street',
  searchStreet: 'Search street…',
  noStreetFound: 'No street found.',
  sector: (n) => `Sector ${n}`,
  sectorHint: (w) => `Black/brown bin: ${w}`,
  continue: 'Continue',
  save: 'Save',
  changeStreet: 'Change street',
  street: (name) => `Str. ${name}`,
  note: 'Note',
  doneAction: "It's out",
  markDone: "✓ I've put it out",
  doneLabel: '✓ Put out – no morning reminder',
  undo: 'Undo',
  settings: 'Settings',
  sectionStreet: 'Street',
  sectionLanguage: 'Language',
  sectionReminders: 'Reminders',
  eveReminder: 'The day before',
  morningReminder: 'On pickup day',
  off: 'Off',
  sendTest: 'Send a test notification',
  reliabilityTitle: 'Getting your reminders on time?',
  reliabilityText:
    'On some phones (Samsung, Xiaomi, Huawei, Oppo) battery saving can block or delay notifications. Set the “Calendar Gunoi” app to “Unrestricted”.',
  phoneTips:
    'Samsung: Settings → Apps → Calendar Gunoi → Battery → Unrestricted\nXiaomi: Settings → Apps → Calendar Gunoi → Battery saver → No restrictions; also enable “Autostart”\nHuawei: Settings → Battery → App launch → Calendar Gunoi → Manage manually (all on)',
  batterySettings: 'Battery settings',
  exactAlarms: 'Exact alarms',
  later: 'Later',
  check: 'Check',
  sectionSchedule: 'Collection schedule',
  scheduleVersion: (v, u) => `Version ${v} · updated ${u}`,
  checkUpdates: 'Check for updates',
  checking: 'Checking…',
  updateUpdated: 'The schedule was updated.',
  updateCurrent: 'You already have the latest schedule.',
  updateError: "Couldn't check (no internet?).",
  sectionAbout: 'About',
  appVersion: (v) => `App version ${v}`,
  privacy: 'Privacy policy',
  shareApp: 'Share the app with a neighbour',
  shareAppMessage: (url) => `Waste pickup calendar for Sâncraiu de Mureș and Nazna, with reminders: ${url}`,
  close: 'Close',
  widgetNoStreet: 'Open the app and choose your street',
  widgetNone: 'No pickups scheduled',
};

export const STRINGS: Record<Lang, Strings> = { ro, en };

export const strings = (lang: Lang) => STRINGS[lang];

/** „Joi, 1 octombrie” / „Thursday, 1 October”. */
export const longDate = (lang: Lang, key: DateKey) => {
  const s = STRINGS[lang];
  const d = fromKey(key);
  return `${s.weekdays[d.getDay()]}, ${d.getDate()} ${s.months[d.getMonth()]}`;
};

/** „Joi, 1 oct.” / „Thu, 1 Oct”. */
export const shortDate = (lang: Lang, key: DateKey) => {
  const s = STRINGS[lang];
  const d = fromKey(key);
  return `${s.weekdaysShort[d.getDay()]}, ${d.getDate()} ${s.monthsShort[d.getMonth()]}`;
};

/** „Octombrie 2026” / „October 2026”. */
export const monthTitle = (lang: Lang, key: DateKey) => {
  const d = fromKey(key);
  const m = STRINGS[lang].months[d.getMonth()];
  return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${d.getFullYear()}`;
};

export const relativeDay = (lang: Lang, date: DateKey, today: DateKey) => {
  const s = STRINGS[lang];
  const days = daysBetween(today, date);
  if (days === 0) return s.today;
  if (days === 1) return s.tomorrow;
  if (days === -1) return s.yesterday;
  return days > 1 ? s.inDays(days) : s.daysAgo(-days);
};

/** „31 decembrie 2026” / „31 December 2026”. */
export const fullDate = (lang: Lang, key: DateKey) => {
  const d = fromKey(key);
  return `${d.getDate()} ${STRINGS[lang].months[d.getMonth()]} ${d.getFullYear()}`;
};

export const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;

/** „18:00 cu o zi înainte · 06:00 în ziua ridicării”, fără mementourile oprite. */
export const reminderSummary = (lang: Lang, times: { eve: number | null; morning: number | null }) => {
  const s = STRINGS[lang];
  const parts = [
    times.eve !== null ? s.eveAt(hourLabel(times.eve)) : null,
    times.morning !== null ? s.morningAt(hourLabel(times.morning)) : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : s.remindersOff;
};
