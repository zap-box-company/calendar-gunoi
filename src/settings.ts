import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { useEffect, useState } from 'react';
import { DateKey } from './data/schedule';
import { findStreet, useData } from './data/sectors';
import { Lang } from './i18n';

const KEYS = {
  lang: 'lang',
  notif: 'notificationsEnabled',
  street: 'streetId',
  eve: 'eveHour',
  morning: 'morningHour',
  done: 'doneDates',
  batteryTip: 'batteryTipDismissed',
  analytics: 'analyticsEnabled',
  sharePrompt: 'sharePromptShown',
};

/** Ora mementoului; `null` = mementoul e oprit. */
export type ReminderHour = number | null;

export interface ReminderTimes {
  eve: ReminderHour;
  morning: ReminderHour;
}

export const DEFAULT_TIMES: ReminderTimes = { eve: 18, morning: 6 };
export const EVE_OPTIONS = [17, 18, 19, 20, 21];
export const MORNING_OPTIONS = [5, 6, 7, 8];

const deviceLang = (): Lang => (getLocales()[0]?.languageCode === 'ro' ? 'ro' : 'en');

const parseHour = (v: string | null, fallback: ReminderHour): ReminderHour => {
  if (v === null) return fallback;
  if (v === 'off') return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= 23 ? n : fallback;
};

const save = (key: string, value: string) => AsyncStorage.setItem(key, value).catch(() => undefined);

/** Citește setările direct din memorie (folosit și de widget, în afara aplicației). */
export async function readStoredSettings() {
  const entries = Object.fromEntries(await AsyncStorage.multiGet(Object.values(KEYS)));
  const lang = entries[KEYS.lang];
  let done: DateKey[] = [];
  try {
    const parsed = JSON.parse(entries[KEYS.done] ?? '[]');
    if (Array.isArray(parsed)) done = parsed.filter((d) => typeof d === 'string');
  } catch {
    // valoare coruptă – se ignoră
  }
  return {
    lang: (lang === 'ro' || lang === 'en' ? lang : deviceLang()) as Lang,
    notificationsEnabled: entries[KEYS.notif] !== '0',
    streetId: entries[KEYS.street] ?? null,
    times: {
      eve: parseHour(entries[KEYS.eve], DEFAULT_TIMES.eve),
      morning: parseHour(entries[KEYS.morning], DEFAULT_TIMES.morning),
    } as ReminderTimes,
    doneDates: done,
    batteryTipDismissed: entries[KEYS.batteryTip] === '1',
    analyticsEnabled: entries[KEYS.analytics] !== '0',
    sharePromptShown: entries[KEYS.sharePrompt] === '1',
  };
}

/** Setările locale ale aplicației, păstrate pe telefon. */
export function useSettings() {
  const data = useData();
  const [loaded, setLoaded] = useState(false);
  const [lang, setLangState] = useState<Lang>(deviceLang);
  const [notificationsEnabled, setNotifState] = useState(true);
  const [streetId, setStreetId] = useState<string | null>(null);
  const [times, setTimesState] = useState<ReminderTimes>(DEFAULT_TIMES);
  const [doneDates, setDoneDates] = useState<DateKey[]>([]);
  const [batteryTipDismissed, setBatteryTipDismissed] = useState(true);
  const [analyticsEnabled, setAnalyticsState] = useState(true);
  const [sharePromptShown, setSharePromptShown] = useState(true);

  useEffect(() => {
    readStoredSettings()
      .then((s) => {
        setLangState(s.lang);
        setNotifState(s.notificationsEnabled);
        setStreetId(s.streetId);
        setTimesState(s.times);
        setDoneDates(s.doneDates);
        setBatteryTipDismissed(s.batteryTipDismissed);
        setAnalyticsState(s.analyticsEnabled);
        setSharePromptShown(s.sharePromptShown);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  // O stradă salvată care nu mai există în program duce înapoi la alegerea străzii.
  const street = findStreet(streetId, data);

  return {
    loaded,
    lang,
    setLang: (l: Lang) => {
      setLangState(l);
      save(KEYS.lang, l);
    },
    notificationsEnabled,
    setNotificationsEnabled: (v: boolean) => {
      setNotifState(v);
      save(KEYS.notif, v ? '1' : '0');
    },
    street,
    setStreet: (id: string) => {
      setStreetId(id);
      save(KEYS.street, id);
    },
    times,
    setTimes: (t: ReminderTimes) => {
      setTimesState(t);
      save(KEYS.eve, t.eve === null ? 'off' : String(t.eve));
      save(KEYS.morning, t.morning === null ? 'off' : String(t.morning));
    },
    doneDates,
    /** „Am scos-o”: marchează ziua (sau anulează marcajul). Păstrează doar datele recente. */
    setDone: (date: DateKey, done: boolean) => {
      setDoneDates((prev) => {
        const next = done ? [...new Set([...prev, date])] : prev.filter((d) => d !== date);
        const trimmed = next.sort().slice(-20);
        save(KEYS.done, JSON.stringify(trimmed));
        return trimmed;
      });
    },
    batteryTipDismissed,
    dismissBatteryTip: () => {
      setBatteryTipDismissed(true);
      save(KEYS.batteryTip, '1');
    },
    /** Statistici anonime (implicit pornite, se pot opri din Setări). */
    analyticsEnabled,
    setAnalyticsEnabled: (v: boolean) => {
      setAnalyticsState(v);
      save(KEYS.analytics, v ? '1' : '0');
    },
    /** Popup-ul „Trimiți unui vecin?” apare o singură dată. */
    sharePromptShown,
    markSharePromptShown: () => {
      setSharePromptShown(true);
      save(KEYS.sharePrompt, '1');
    },
  };
}

export type Settings = ReturnType<typeof useSettings>;
