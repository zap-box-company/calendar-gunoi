import { useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { setAnalyticsEnabled, track, trackFirstOpen } from './analytics';
import { checkForUpdate, loadCachedDataset } from './data/remote';
import { sectorNumber, useData } from './data/sectors';
import { hasPermission, listenForDone, requestPermission, reschedule } from './notifications';
import { Settings } from './settings';
import { updateWidget } from './widget';
import { computeWidgetState } from './widget/state';

/** Programul salvat se aplică înainte de primul ecran, apoi se caută în fundal unul mai nou. */
export function useScheduleData() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    loadCachedDataset().finally(() => {
      setReady(true);
      checkForUpdate().catch(() => undefined);
    });
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkForUpdate().catch(() => undefined);
    });
    return () => sub.remove();
  }, []);
  return ready;
}

/**
 * Ține mementourile și widgetul la zi: la schimbarea străzii, limbii, orelor,
 * permisiunii, programului sau a unui „Am scos-o”.
 */
export function useReminders(settings: Settings) {
  const data = useData();
  const { loaded, lang, notificationsEnabled, street, times, doneDates } = settings;
  const [permission, setPermission] = useState<boolean | null>(null);
  /** Câte mementouri sunt programate (null = încă nu s-a programat nimic). */
  const [scheduledCount, setScheduledCount] = useState<number | null>(null);

  // Permisiunea se cere după ce utilizatorul și-a ales strada (nu peste ecranul de bun venit).
  const hasStreet = !!street;
  useEffect(() => {
    if (!loaded || !hasStreet) return;
    (notificationsEnabled ? requestPermission() : hasPermission()).then(setPermission).catch(() => setPermission(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, hasStreet]);

  // La revenirea în aplicație, permisiunea poate fi schimbată din setările telefonului.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') hasPermission().then(setPermission).catch(() => undefined);
    });
    return () => sub.remove();
  }, []);

  const doneKey = doneDates.join(',');
  useEffect(() => {
    if (!loaded || permission === null) return;
    reschedule({ enabled: notificationsEnabled, lang, street, times, doneDates })
      .then(setScheduledCount)
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, permission, notificationsEnabled, lang, street?.id, times.eve, times.morning, doneKey, data]);

  useEffect(() => {
    if (loaded) updateWidget(computeWidgetState(lang, street?.id ?? null));
  }, [loaded, lang, street?.id, data]);

  // Butonul „Am scos-o” din notificare.
  const setDoneRef = useRef(settings.setDone);
  setDoneRef.current = settings.setDone;
  useEffect(
    () =>
      listenForDone((date) => {
        setDoneRef.current(date, true);
        track('done_pressed', { source: 'notification' });
      }),
    [],
  );

  // Statistici anonime: pornire, instalare nouă, deschideri (fără stradă – doar sectorul).
  const analyticsOn = settings.analyticsEnabled;
  useEffect(() => {
    if (!loaded) return;
    setAnalyticsEnabled(analyticsOn);
    // Numără instalarea imediat, chiar dacă utilizatorul nu alege încă strada.
    trackFirstOpen().catch(() => undefined);
  }, [loaded, analyticsOn, data]);

  const sector = street ? sectorNumber(street, data) : 0;
  const statsRef = useRef({ sector, lang, permission });
  statsRef.current = { sector, lang, permission };
  useEffect(() => {
    if (!loaded || permission === null) return;
    const open = () => {
      const { sector: sec, lang: l, permission: perm } = statsRef.current;
      track('app_open', { sector: sec, lang: l, notifications: !!perm });
    };
    open();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && open());
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, permission === null]);

  /** Cere permisiunea; dacă a fost refuzată definitiv, deschide setările aplicației. */
  const askPermission = async () => {
    const granted = await requestPermission();
    setPermission(granted);
    if (!granted) Linking.openSettings();
    return granted;
  };

  return { permission, askPermission, scheduledCount };
}

export type Reminders = ReturnType<typeof useReminders>;
