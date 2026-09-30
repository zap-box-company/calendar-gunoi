/**
 * Actualizarea programului fără o versiune nouă a aplicației: se descarcă `program.json`,
 * se validează și, dacă e mai nou decât cel existent, se salvează pe telefon.
 * Fără internet, aplicația folosește ultima versiune salvată sau pe cea inclusă.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SCHEDULE_URL } from '../config';
import { BUNDLED_DATASET, Dataset, getData, setDataset, validateDataset } from './sectors';

const KEY_DATASET = 'dataset';
const KEY_CHECKED = 'datasetCheckedAt';
const CHECK_INTERVAL_MS = 12 * 60 * 60 * 1000;
const TIMEOUT_MS = 10_000;

export type UpdateResult = 'updated' | 'current' | 'error';

/** La pornire: aplică programul salvat anterior, dacă e mai nou decât cel inclus. */
export async function loadCachedDataset(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY_DATASET);
    if (!raw) return;
    const cached = validateDataset(JSON.parse(raw));
    if (cached.version > BUNDLED_DATASET.version) setDataset(cached);
  } catch {
    await AsyncStorage.removeItem(KEY_DATASET).catch(() => undefined);
  }
}

/** Verifică dacă există un program mai nou. Fără `force`, cel mult o dată la 12 ore. */
export async function checkForUpdate(force = false): Promise<UpdateResult> {
  if (!force) {
    const last = Number((await AsyncStorage.getItem(KEY_CHECKED)) ?? 0);
    if (Date.now() - last < CHECK_INTERVAL_MS) return 'current';
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${SCHEDULE_URL}?t=${Date.now()}`, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const remote: Dataset = validateDataset(await res.json());
    await AsyncStorage.setItem(KEY_CHECKED, String(Date.now()));

    if (remote.version <= getData().dataset.version) return 'current';
    await AsyncStorage.setItem(KEY_DATASET, JSON.stringify(remote));
    setDataset(remote);
    return 'updated';
  } catch {
    return 'error';
  } finally {
    clearTimeout(timer);
  }
}
