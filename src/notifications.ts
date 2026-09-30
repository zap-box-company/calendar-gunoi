import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DateKey, Schedule, addDays, fromKey } from './data/schedule';
import { Street, scheduleFor } from './data/sectors';
import { Lang, longDate, strings } from './i18n';
import { ReminderTimes } from './settings';
import { WASTE_PALETTE } from './theme';

export const CHANNEL_ID = 'ridicari';
/** Categoria mementoului de seară, cu butonul „Am scos-o”. */
const EVE_CATEGORY = 'pickup-eve';
export const ACTION_DONE = 'done';

export type ReminderKind = 'eve' | 'morning';

export interface Reminder {
  at: Date;
  date: DateKey;
  kind: ReminderKind;
}

/** Android permite max. ~500 alarme/aplicație, iOS 64 notificări programate. */
const MAX_SCHEDULED = 60;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const reminderId = (date: DateKey, kind: ReminderKind) => `${date}-${kind}`;

async function setup(lang: Lang) {
  const s = strings(lang);
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: s.channelName,
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  // Butonul deschide aplicația, care anulează mementoul de dimineață – funcționează
  // și când aplicația era închisă.
  await Notifications.setNotificationCategoryAsync(EVE_CATEGORY, [
    { identifier: ACTION_DONE, buttonTitle: s.doneAction, options: { opensAppToForeground: true } },
  ]).catch(() => undefined);
}

/**
 * Pentru fiecare zi de ridicare: mementoul de seară (implicit 18:00, cu o zi înainte)
 * și cel de dimineață (implicit 06:00). Un memento cu ora `null` e oprit.
 */
export function allReminders(schedule: Schedule, times: ReminderTimes): Reminder[] {
  return schedule.byDate
    .flatMap(([date]) => {
      const out: Reminder[] = [];
      if (times.eve !== null) {
        const eve = fromKey(addDays(date, -1));
        eve.setHours(times.eve, 0, 0, 0);
        out.push({ at: eve, date, kind: 'eve' });
      }
      if (times.morning !== null) {
        const morning = fromKey(date);
        morning.setHours(times.morning, 0, 0, 0);
        out.push({ at: morning, date, kind: 'morning' });
      }
      return out;
    })
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

const isSkipped = (r: Reminder, doneDates: DateKey[]) => r.kind === 'morning' && doneDates.includes(r.date);

export const nextReminder = (schedule: Schedule, times: ReminderTimes, doneDates: DateKey[], now: Date) =>
  allReminders(schedule, times).find((r) => r.at > now && !isSkipped(r, doneDates));

export function reminderContent(lang: Lang, street: Street, date: DateKey, kind: ReminderKind) {
  const s = strings(lang);
  const pickups = scheduleFor(street).pickupsOn(date);
  const labels = pickups.map((p) => s.waste[p.type].short).join(' + ');
  const lines = pickups.map((p) => {
    const w = s.waste[p.type];
    const note = p.note ? `\n   ${p.note[lang]}` : '';
    return `${WASTE_PALETTE[p.type].emoji} ${w.container} – ${w.title}${note}`;
  });
  return {
    title: kind === 'eve' ? s.eveTitle(labels) : s.morningTitle(labels),
    body: [
      ...lines,
      kind === 'eve' ? `${s.eveFooter} (${longDate(lang, date)})` : s.morningFooter,
      `📍 ${s.street(street.name)}`,
    ].join('\n'),
    data: { date, street: street.id, kind },
    ...(kind === 'eve' ? { categoryIdentifier: EVE_CATEGORY } : {}),
  };
}

export async function hasPermission() {
  return (await Notifications.getPermissionsAsync()).granted;
}

export async function requestPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export interface RescheduleInput {
  enabled: boolean;
  lang: Lang;
  street: Street | undefined;
  times: ReminderTimes;
  doneDates: DateKey[];
}

// Programările sunt serializate ca două apeluri rapide (ex. schimbarea străzii) să nu se amestece.
let queue: Promise<unknown> = Promise.resolve();

/**
 * Șterge toate mementourile și le programează din nou pe cele viitoare pentru strada aleasă.
 * Returnează câte mementouri au fost programate.
 */
export function reschedule({ enabled, lang, street, times, doneDates }: RescheduleInput): Promise<number> {
  const run = queue
    .catch(() => undefined)
    .then(async () => {
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (!enabled || !street || !(await hasPermission())) return 0;
      await setup(lang);

      const now = new Date();
      const upcoming = allReminders(scheduleFor(street), times)
        .filter((r) => r.at > now && !isSkipped(r, doneDates))
        .slice(0, MAX_SCHEDULED);
      for (const r of upcoming) {
        await Notifications.scheduleNotificationAsync({
          identifier: reminderId(r.date, r.kind),
          content: reminderContent(lang, street, r.date, r.kind),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: r.at,
            channelId: CHANNEL_ID,
          },
        });
      }
      return upcoming.length;
    });
  queue = run;
  return run;
}

export async function sendTest(lang: Lang, street: Street, date: DateKey) {
  await setup(lang);
  await Notifications.scheduleNotificationAsync({
    content: reminderContent(lang, street, date, 'eve'),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      channelId: CHANNEL_ID,
    },
  });
}

/**
 * Ascultă apăsarea butonului „Am scos-o” (inclusiv când aplicația a fost pornită de el).
 * Returnează funcția de dezabonare.
 */
export function listenForDone(onDone: (date: DateKey) => void): () => void {
  const handle = (response: Notifications.NotificationResponse | null) => {
    if (response?.actionIdentifier !== ACTION_DONE) return;
    const date = response.notification.request.content.data?.date;
    if (typeof date === 'string') onDone(date);
    Notifications.dismissNotificationAsync(response.notification.request.identifier).catch(() => undefined);
    Notifications.clearLastNotificationResponseAsync?.().catch(() => undefined);
  };
  Notifications.getLastNotificationResponseAsync().then(handle).catch(() => undefined);
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}
