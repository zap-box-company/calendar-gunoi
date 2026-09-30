/**
 * Widgetul există doar în APK. Biblioteca lui încarcă modulul nativ la import, așa că
 * în Expo Go (unde modulul lipsește) nu o importăm deloc.
 */
import { Platform, TurboModuleRegistry } from 'react-native';
import type { WidgetState } from './state';

export const widgetAvailable = Platform.OS === 'android' && TurboModuleRegistry.get('AndroidWidget') != null;

export function registerWidget() {
  if (!widgetAvailable) return;
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./handler');
  registerWidgetTaskHandler(widgetTaskHandler);
}

export function updateWidget(state: WidgetState) {
  if (!widgetAvailable) return;
  const { refreshWidget } = require('./handler');
  (refreshWidget(state) as Promise<void>).catch(() => undefined);
}
