/**
 * „Versiune nouă disponibilă”: APK-urile instalate din GitHub nu se actualizează singure,
 * așa că `program.json` anunță ultima versiune, iar aplicațiile mai vechi o afișează.
 */
import * as Application from 'expo-application';
import { DOWNLOAD_URL } from './config';
import { Data } from './data/sectors';

export interface AppUpdate {
  version: string;
  url: string;
}

/** `versionCode`-ul acestei instalări; în Expo Go nu are sens (e versiunea Expo Go). */
function installedVersionCode(): number | null {
  if (Application.applicationId === 'host.exp.exponent') return null;
  const code = Number(Application.nativeBuildVersion);
  return Number.isInteger(code) && code > 0 ? code : null;
}

export function availableUpdate(data: Data): AppUpdate | null {
  const latest = data.dataset.latestApp;
  const installed = installedVersionCode();
  if (!latest || installed === null || latest.versionCode <= installed) return null;
  return { version: latest.version, url: latest.url ?? DOWNLOAD_URL };
}
