/**
 * Ce afișează widgetul. Se calculează fără componente native, ca să poată rula
 * și în fundal (când Android cere actualizarea widgetului, cu aplicația închisă).
 */
import { toKey } from '../data/schedule';
import { findStreet, scheduleFor } from '../data/sectors';
import { loadCachedDataset } from '../data/remote';
import { Lang, longDate, relativeDay, strings } from '../i18n';
import { readStoredSettings } from '../settings';
import { WASTE_PALETTE } from '../theme';

export type WidgetState =
  | { kind: 'noStreet'; message: string }
  | { kind: 'none'; message: string; street: string }
  | {
      kind: 'next';
      label: string;
      when: string;
      date: string;
      lines: string[];
      street: string;
      colors: [string, string];
      on: string;
    };

export function computeWidgetState(lang: Lang, streetId: string | null, now = new Date()): WidgetState {
  const s = strings(lang);
  const street = findStreet(streetId);
  if (!street) return { kind: 'noStreet', message: s.widgetNoStreet };

  const today = toKey(now);
  const next = scheduleFor(street).nextPickupDay(today);
  const streetName = `📍 ${s.street(street.name)}`;
  if (!next) return { kind: 'none', message: s.widgetNone, street: streetName };

  const [date, pickups] = next;
  const first = WASTE_PALETTE[pickups[0].type];
  const last = WASTE_PALETTE[pickups[pickups.length - 1].type];
  return {
    kind: 'next',
    label: s.nextPickup,
    when: relativeDay(lang, date, today),
    date: longDate(lang, date),
    lines: pickups.map((p) => `${WASTE_PALETTE[p.type].emoji} ${s.waste[p.type].container}`),
    street: streetName,
    colors: [first.colors[0], last.colors[1]],
    on: first.on,
  };
}

/** Citește strada, limba și programul salvat, direct din memoria telefonului. */
export async function loadWidgetState(): Promise<WidgetState> {
  await loadCachedDataset();
  const settings = await readStoredSettings();
  return computeWidgetState(settings.lang, settings.streetId);
}
