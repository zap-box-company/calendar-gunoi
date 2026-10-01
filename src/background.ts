/**
 * Sarcina din fundal: Android o rulează cam o dată la 12 ore, chiar dacă aplicația e închisă,
 * ca un program schimbat sau o versiune nouă să ajungă la toți fără să deschidă aplicația.
 * `defineTask` trebuie apelat la încărcarea modulului – fișierul e importat din `index.ts`.
 */
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { backgroundUpdateCheck } from './updateCheck';

const TASK = 'calendar-gunoi-update-check';
const INTERVAL_MINUTES = 12 * 60;

TaskManager.defineTask(TASK, async () => {
  try {
    await backgroundUpdateCheck();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/** Se apelează la pornirea aplicației; înregistrarea rămâne valabilă și după repornirea telefonului. */
export async function registerBackgroundCheck() {
  try {
    if ((await BackgroundTask.getStatusAsync()) !== BackgroundTask.BackgroundTaskStatus.Available) return;
    if (await TaskManager.isTaskRegisteredAsync(TASK)) return;
    await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: INTERVAL_MINUTES });
  } catch {
    // Indisponibil (ex. Expo Go) – aplicația verifică oricum la fiecare deschidere.
  }
}
