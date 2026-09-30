/**
 * Motorul de program: tipuri, utilitare pentru date și construirea programului unui sector.
 * Datele sunt păstrate ca șiruri „YYYY-MM-DD” (fără fus orar) ca să nu apară decalaje.
 */

export type WasteType = 'residual' | 'plastic' | 'paper' | 'glass';

export const WASTE_TYPES: WasteType[] = ['residual', 'plastic', 'paper', 'glass'];

export const LOCATION = 'Sâncraiu de Mureș & Nazna';

export type DateKey = string; // „2026-10-01”

/** Text afișat în ambele limbi. */
export interface LocalizedText {
  ro: string;
  en: string;
}

export interface Pickup {
  date: DateKey;
  type: WasteType;
  /** Observație (ex. ridicare mutată din cauza unei sărbători). */
  note?: LocalizedText;
}

/** Luna („1” … „12”) → zilele din lună. */
export type MonthMap = Record<string, number[]>;

/** Programul unui sector pentru un an. */
export interface YearInput {
  /** Pubela neagră + maro în fiecare zi de acest fel (0 = duminică … 6 = sâmbătă). */
  residualWeekday?: number;
  residual?: MonthMap;
  plastic?: MonthMap;
  paper?: MonthMap;
  glass?: MonthMap;
  /** Zile în care NU se ridică deșeuri din ambalaje. */
  exceptions?: MonthMap;
}

export interface NoteInput extends LocalizedText {
  date: DateKey;
  type: WasteType;
}

export interface Schedule {
  pickups: Pickup[];
  exceptions: DateKey[];
  /** Ridicările grupate pe zile, în ordine cronologică. */
  byDate: [DateKey, Pickup[]][];
  /** Ultima zi pentru care există program. */
  lastDate: DateKey | undefined;
  typesOn(date: DateKey): WasteType[];
  pickupsOn(date: DateKey): Pickup[];
  /** Prima zi de ridicare >= azi (ziua curentă contează încă drept „următoarea”). */
  nextPickupDay(today: DateKey): [DateKey, Pickup[]] | undefined;
  nextFor(type: WasteType, today: DateKey): DateKey | undefined;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const toKey = (d: Date): DateKey =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Miezul nopții (ora locală) pentru o dată. */
export const fromKey = (key: DateKey): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (key: DateKey, days: number): DateKey => {
  const d = fromKey(key);
  d.setDate(d.getDate() + days);
  return toKey(d);
};

/** Diferența în zile calendaristice (b − a). */
export const daysBetween = (a: DateKey, b: DateKey): number =>
  Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86_400_000);

export const dateKeys = (year: number, months: MonthMap = {}): DateKey[] =>
  Object.entries(months).flatMap(([m, days]) =>
    days.map((d) => `${year}-${pad(Number(m))}-${pad(d)}`),
  );

/** Toate zilele de un anumit fel (0 = duminică … 6 = sâmbătă) dintr-un an. */
export const everyWeekday = (year: number, weekday: number): DateKey[] => {
  const out: DateKey[] = [];
  const d = new Date(year, 0, 1);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  while (d.getFullYear() === year) {
    out.push(toKey(d));
    d.setDate(d.getDate() + 7);
  }
  return out;
};

export function buildSchedule(years: Record<string, YearInput>, notes: NoteInput[] = []): Schedule {
  const perType: Record<WasteType, DateKey[]> = { residual: [], plastic: [], paper: [], glass: [] };
  const exceptions: DateKey[] = [];

  for (const [yearStr, y] of Object.entries(years)) {
    const year = Number(yearStr);
    perType.residual.push(
      ...(y.residualWeekday !== undefined ? everyWeekday(year, y.residualWeekday) : []),
      ...dateKeys(year, y.residual),
    );
    perType.plastic.push(...dateKeys(year, y.plastic));
    perType.paper.push(...dateKeys(year, y.paper));
    perType.glass.push(...dateKeys(year, y.glass));
    exceptions.push(...dateKeys(year, y.exceptions));
  }
  exceptions.sort();

  const noteFor = (date: DateKey, type: WasteType): LocalizedText | undefined => {
    const n = notes.find((x) => x.date === date && x.type === type);
    return n ? { ro: n.ro, en: n.en } : undefined;
  };

  const pickups: Pickup[] = WASTE_TYPES.flatMap((type) =>
    [...new Set(perType[type])].map((date) => ({ date, type, note: noteFor(date, type) })),
  )
    .filter((p) => p.type === 'residual' || !exceptions.includes(p.date))
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || WASTE_TYPES.indexOf(a.type) - WASTE_TYPES.indexOf(b.type),
    );

  const map = new Map<DateKey, Pickup[]>();
  for (const p of pickups) map.set(p.date, [...(map.get(p.date) ?? []), p]);
  const byDate = [...map.entries()];

  const pickupsOn = (date: DateKey) => map.get(date) ?? [];

  return {
    pickups,
    exceptions,
    byDate,
    lastDate: byDate.at(-1)?.[0],
    pickupsOn,
    typesOn: (date) => pickupsOn(date).map((p) => p.type),
    nextPickupDay: (today) => byDate.find(([d]) => d >= today),
    nextFor: (type, today) => pickups.find((p) => p.type === type && p.date >= today)?.date,
  };
}
