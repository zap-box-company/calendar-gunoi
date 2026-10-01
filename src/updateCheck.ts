/**
 * Verificarea de actualizări care rulează și în fundal, cu aplicația închisă
 * (Android o pornește cam o dată la 12 ore, vezi `background.ts`). Fără server propriu:
 * telefonul citește `program.json` de pe GitHub Pages și, dacă e ceva nou, trimite o
 * notificare locală – efectul unei notificări „push”.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { availableUpdate } from './appUpdate';
import { checkForUpdate, loadCachedDataset } from './data/remote';
import { toKey } from './data/schedule';
import { Street, findStreet, getData, scheduleFor } from './data/sectors';
import { strings } from './i18n';
import { CHANNEL_ID, reschedule } from './notifications';
import { readStoredSettings } from './settings';
import { updateWidget } from './widget';
import { computeWidgetState } from './widget/state';

const KEY_NOTIFIED_APP = 'notifiedAppVersionCode';

/** Ridicările viitoare ale străzii, ca text – ca să știm dacă s-au schimbat pentru ea. */
function upcomingSignature(street: Street): string {
  const today = toKey(new Date());
  return scheduleFor(street)
    .pickups.filter((p) => p.date >= today)
    .map((p) => `${p.date}:${p.type}:${p.note?.ro ?? ''}`)
    .join('|');
}

async function notify(title: string, body: string, data: Record<string, string> = {}) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, channelId: CHANNEL_ID },
  });
}

/** Rulată de sarcina din fundal. Returnează ce s-a întâmplat (pentru jurnal). */
export async function backgroundUpdateCheck(): Promise<string> {
  await loadCachedDataset();
  const settings = await readStoredSettings();
  const street = findStreet(settings.streetId);
  const before = street ? upcomingSignature(street) : '';

  const result = await checkForUpdate(true);
  if (result !== 'updated') return result;

  const s = strings(settings.lang);
  const canNotify = settings.notificationsEnabled && (await Notifications.getPermissionsAsync()).granted;

  if (street) {
    // Aplicația e închisă: mementourile și widgetul trebuie refăcute aici, după noul program.
    await reschedule({
      enabled: settings.notificationsEnabled,
      lang: settings.lang,
      street,
      times: settings.times,
      doneDates: settings.doneDates,
    });
    updateWidget(computeWidgetState(settings.lang, street.id));

    if (canNotify && upcomingSignature(street) !== before) {
      await notify(s.scheduleChangedTitle, s.scheduleChangedText(s.street(street.name)));
    }
  }

  // Versiune nouă a aplicației – o singură notificare pentru fiecare versiune.
  const update = availableUpdate(getData());
  const latestCode = getData().dataset.latestApp?.versionCode;
  if (canNotify && update && latestCode !== undefined) {
    const notified = Number((await AsyncStorage.getItem(KEY_NOTIFIED_APP)) ?? 0);
    if (latestCode > notified) {
      await notify(s.updateTitle(update.version), s.updateNotificationText, { url: update.url });
      await AsyncStorage.setItem(KEY_NOTIFIED_APP, String(latestCode));
    }
  }
  return 'updated';
}
