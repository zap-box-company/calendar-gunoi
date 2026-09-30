/**
 * Statistici anonime (Aptabase): câte instalări, câți utilizatori activi, ce versiuni.
 * Fără ID de dispozitiv, fără stradă sau alte date personale – doar sectorul și evenimente simple.
 * Utilizatorul le poate opri din Setări; fără cheie configurată nu se trimite nimic.
 */
import Aptabase from '@aptabase/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { APTABASE_APP_KEY } from './config';
import { getData } from './data/sectors';

type Props = Record<string, string | number | boolean>;

const KEY_FIRST_OPEN = 'analyticsFirstOpenSent';

let started = false;
let enabled = false;

const appKey = () => getData().dataset.analyticsKey || APTABASE_APP_KEY;

/** Pornește sau oprește statisticile (la pornire și când se schimbă setarea). */
export function setAnalyticsEnabled(on: boolean) {
  enabled = on;
  const key = appKey();
  if (on && !started && key) {
    Aptabase.init(key, {
      appVersion: Application.nativeApplicationVersion ?? undefined,
      enableCrashReporting: true,
    });
    started = true;
  } else if (!on && started) {
    Aptabase.dispose();
    started = false;
  }
}

export function track(event: string, props?: Props) {
  if (!enabled || !started) return;
  Aptabase.trackEvent(event, props);
}

/** O singură dată pe instalare – așa se numără instalările. */
export async function trackFirstOpen() {
  if (!enabled || !started) return;
  if (await AsyncStorage.getItem(KEY_FIRST_OPEN)) return;
  track('first_open');
  await AsyncStorage.setItem(KEY_FIRST_OPEN, '1');
}
