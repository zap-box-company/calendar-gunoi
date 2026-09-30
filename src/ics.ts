import { Directory, File, Paths } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { LOCATION, addDays, toKey } from './data/schedule';
import { Street, scheduleFor } from './data/sectors';
import { Lang, strings } from './i18n';
import { ReminderTimes } from './settings';
import { WASTE_PALETTE } from './theme';

// Numele fișierului rămâne fix; conținutul depinde de stradă și de orele mementourilor.
export const ICS_FILE_NAME = 'calendar_gunoi.ics';
const MIME = 'text/calendar';
const FLAG_GRANT_READ_URI_PERMISSION = 1;

const compact = (key: string) => key.replace(/-/g, '');

const escape = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

const utf8Length = (cp: number) => (cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4);

/** Împarte liniile la maximum 75 de octeți UTF-8 (RFC 5545 §3.1). */
function fold(line: string): string {
  let out = '';
  let bytes = 0;
  let limit = 75; // liniile de continuare încep cu un spațiu, deci au loc pentru 74
  for (const ch of line) {
    const len = utf8Length(ch.codePointAt(0)!);
    if (bytes + len > limit) {
      out += '\r\n ';
      bytes = 0;
      limit = 74;
    }
    out += ch;
    bytes += len;
  }
  return out;
}

/**
 * Fișier iCalendar cu ridicările rămase pentru strada aleasă: evenimente pe toată ziua,
 * cu alarmele la aceleași ore ca notificările (implicit 18:00 cu o zi înainte și 06:00).
 */
export function buildIcs(lang: Lang, street: Street, times: ReminderTimes): string {
  const s = strings(lang);
  const schedule = scheduleFor(street);
  const today = toKey(new Date());
  const streetName = s.street(street.name);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Calendar Gunoi//Sancraiu de Mures//${lang.toUpperCase()}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escape(s.calendarName(streetName))}`,
    'X-WR-TIMEZONE:Europe/Bucharest',
  ];

  const event = (uid: string, date: string, summary: string, description: string, alarms: boolean) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}@calendargunoi.sancraiu.ro`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(date)}`,
      `DTEND;VALUE=DATE:${compact(addDays(date, 1))}`,
      `SUMMARY:${escape(summary)}`,
      `DESCRIPTION:${escape(description)}`,
      `LOCATION:${escape(`${streetName}, ${LOCATION}`)}`,
      'TRANSP:TRANSPARENT',
    );
    if (alarms) {
      // Evenimentul începe la 00:00: ora H cu o zi înainte = -(24 − H) ore, ora H în ziua respectivă = +H ore.
      const alarms: [string, string][] = [];
      if (times.eve !== null) alarms.push([`-PT${24 - times.eve}H`, s.icsAlarmEve]);
      if (times.morning !== null) alarms.push([`PT${times.morning}H`, s.icsAlarmMorning]);
      for (const [trigger, prefix] of alarms) {
        lines.push(
          'BEGIN:VALARM',
          'ACTION:DISPLAY',
          `TRIGGER;RELATED=START:${trigger}`,
          `DESCRIPTION:${escape(`${prefix}: ${summary}`)}`,
          'END:VALARM',
        );
      }
    }
    lines.push('END:VEVENT');
  };

  for (const p of schedule.pickups.filter((p) => p.date >= today)) {
    const w = s.waste[p.type];
    const note = p.note ? `\n${p.note[lang]}` : '';
    event(
      `${compact(p.date)}-${p.type}-${street.sector}`,
      p.date,
      `${WASTE_PALETTE[p.type].emoji} ${w.container} – ${w.title}`,
      `${s.icsDescription(w.title, w.container)}${note}`,
      true,
    );
  }
  for (const date of schedule.exceptions.filter((d) => d >= today)) {
    event(`${compact(date)}-exception-${street.sector}`, date, s.icsException, s.icsExceptionDesc, false);
  }

  lines.push('END:VCALENDAR');
  return lines.map((l) => fold(l) + '\r\n').join('');
}

export interface IcsInput {
  lang: Lang;
  street: Street;
  times: ReminderTimes;
}

function writeToCache({ lang, street, times }: IcsInput): File {
  const file = new File(Paths.cache, ICS_FILE_NAME);
  if (file.exists) file.delete();
  file.create();
  file.write(buildIcs(lang, street, times));
  return file;
}

export async function shareIcs(input: IcsInput) {
  const file = writeToCache(input);
  await Sharing.shareAsync(file.uri, {
    mimeType: MIME,
    UTI: 'public.calendar-event',
    dialogTitle: strings(input.lang).shareIcs,
  });
}

/**
 * Deschide fișierul .ics direct cu o aplicație de calendar (ex. Google Calendar).
 * Pe iOS, sau dacă nicio aplicație nu-l poate deschide, se folosește meniul de partajare.
 */
export async function openIcs(input: IcsInput) {
  if (Platform.OS !== 'android') return shareIcs(input);
  const file = writeToCache(input);
  try {
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: file.contentUri,
      type: MIME,
      flags: FLAG_GRANT_READ_URI_PERMISSION,
    });
  } catch {
    await shareIcs(input);
  }
}

/** Android: utilizatorul alege un folder (ex. Descărcări) și fișierul se salvează acolo. */
export async function saveIcs(input: IcsInput): Promise<boolean> {
  if (Platform.OS !== 'android') {
    await shareIcs(input);
    return false;
  }
  let dir: Directory;
  try {
    dir = await Directory.pickDirectoryAsync();
  } catch {
    return false; // utilizatorul a anulat
  }
  const file = dir.createFile(ICS_FILE_NAME, MIME);
  file.write(buildIcs(input.lang, input.street, input.times));
  return true;
}
