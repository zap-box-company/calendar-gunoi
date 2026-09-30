import { useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { checkForUpdate, loadCachedDataset } from './data/remote';
import { useData } from './data/sectors';
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
    reschedule({ enabled: notificationsEnabled, lang, street, times, doneDates }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, permission, notificationsEnabled, lang, street?.id, times.eve, times.morning, doneKey, data]);

  useEffect(() => {
    if (loaded) updateWidget(computeWidgetState(lang, street?.id ?? null));
  }, [loaded, lang, street?.id, data]);

  // Butonul „Am scos-o” din notificare.
  const setDoneRef = useRef(settings.setDone);
  setDoneRef.current = settings.setDone;
  useEffect(() => listenForDone((date) => setDoneRef.current(date, true)), []);

  /** Cere permisiunea; dacă a fost refuzată definitiv, deschide setările aplicației. */
  const askPermission = async () => {
    const granted = await requestPermission();
    setPermission(granted);
    if (!granted) Linking.openSettings();
    return granted;
  };

  return { permission, askPermission };
}

export type Reminders = ReturnType<typeof useReminders>;
