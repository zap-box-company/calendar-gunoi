/**
 * Programul pe sectoare și străzi. Datele vin din `docs/program.json` (inclus în aplicație)
 * sau dintr-o versiune mai nouă descărcată de pe internet (vezi `remote.ts`).
 */
import { useSyncExternalStore } from 'react';
import bundled from '../../docs/program.json';
import { type NoteInput, type Schedule, type YearInput, WASTE_TYPES, buildSchedule } from './schedule';

export type SectorId = string;

export interface Street {
  id: string;
  name: string;
  sector: SectorId;
}

export interface Sector {
  id: SectorId;
  number: number;
  schedule: Schedule;
}

/** Formatul fișierului `program.json`. */
export interface Dataset {
  version: number;
  updated: string;
  /** Cheia Aptabase pentru statistici anonime (opțională). */
  analyticsKey?: string;
  sectors: {
    id: string;
    number: number;
    streets: string[];
    years: Record<string, YearInput>;
    notes?: NoteInput[];
  }[];
}

export interface Data {
  dataset: Dataset;
  sectors: Record<SectorId, Sector>;
  streets: Street[];
}

// ---------------------------------------------------------------------------------------------
// Validare – un fișier descărcat greșit nu trebuie să strice aplicația.
// ---------------------------------------------------------------------------------------------

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function checkMonthMap(v: unknown, year: number, where: string) {
  if (v === undefined) return;
  if (!isObj(v)) throw new Error(`${where}: nu e obiect`);
  for (const [m, days] of Object.entries(v)) {
    const month = Number(m);
    if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error(`${where}: luna ${m}`);
    if (!Array.isArray(days)) throw new Error(`${where}.${m}: nu e listă`);
    const max = new Date(year, month, 0).getDate();
    for (const d of days) {
      if (!Number.isInteger(d) || d < 1 || d > max) throw new Error(`${where}.${m}: ziua ${d}`);
    }
  }
}

export function validateDataset(json: unknown): Dataset {
  if (!isObj(json)) throw new Error('fișierul nu e obiect');
  if (!Number.isInteger(json.version)) throw new Error('version lipsește');
  if (!Array.isArray(json.sectors) || json.sectors.length === 0) throw new Error('sectors lipsește');
  if (json.analyticsKey !== undefined && (typeof json.analyticsKey !== 'string' || !/^A-(EU|US)-\d+$/.test(json.analyticsKey))) {
    throw new Error('analyticsKey invalid');
  }
  const ids = new Set<string>();
  for (const s of json.sectors) {
    if (!isObj(s) || typeof s.id !== 'string' || !Number.isInteger(s.number)) throw new Error('sector invalid');
    if (ids.has(s.id)) throw new Error(`sector duplicat ${s.id}`);
    ids.add(s.id);
    if (!Array.isArray(s.streets) || !s.streets.every((x) => typeof x === 'string' && x.trim())) {
      throw new Error(`${s.id}: streets`);
    }
    if (!isObj(s.years)) throw new Error(`${s.id}: years`);
    for (const [y, input] of Object.entries(s.years)) {
      const year = Number(y);
      if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error(`${s.id}: anul ${y}`);
      if (!isObj(input)) throw new Error(`${s.id}.${y}`);
      const wd = input.residualWeekday;
      if (wd !== undefined && (!Number.isInteger(wd) || (wd as number) < 0 || (wd as number) > 6)) {
        throw new Error(`${s.id}.${y}: residualWeekday`);
      }
      for (const k of [...WASTE_TYPES, 'exceptions'] as const) checkMonthMap(input[k], year, `${s.id}.${y}.${k}`);
    }
    if (s.notes !== undefined) {
      if (!Array.isArray(s.notes)) throw new Error(`${s.id}: notes`);
      for (const n of s.notes) {
        if (
          !isObj(n) ||
          typeof n.date !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(n.date) ||
          !WASTE_TYPES.includes(n.type as never) ||
          typeof n.ro !== 'string' ||
          typeof n.en !== 'string'
        ) {
          throw new Error(`${s.id}: notă invalidă`);
        }
      }
    }
  }
  return json as unknown as Dataset;
}

// ---------------------------------------------------------------------------------------------
// Construirea datelor
// ---------------------------------------------------------------------------------------------

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function buildData(dataset: Dataset): Data {
  const sectors: Record<SectorId, Sector> = {};
  const streets: Street[] = [];
  for (const s of dataset.sectors) {
    sectors[s.id] = { id: s.id, number: s.number, schedule: buildSchedule(s.years, s.notes) };
    for (const name of s.streets) streets.push({ id: `s${s.number}-${slug(name)}`, name, sector: s.id });
  }
  return { dataset, sectors, streets };
}

// ---------------------------------------------------------------------------------------------
// Datele curente (la nivel de aplicație) – se pot înlocui cu o versiune mai nouă.
// ---------------------------------------------------------------------------------------------

export const BUNDLED_DATASET: Dataset = validateDataset(bundled);

let current: Data = buildData(BUNDLED_DATASET);
const listeners = new Set<() => void>();

export const getData = () => current;

export function setDataset(dataset: Dataset) {
  current = buildData(dataset);
  listeners.forEach((l) => l());
}

export function useData(): Data {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getData,
  );
}

export const findStreet = (id: string | null | undefined, data: Data = current) =>
  data.streets.find((s) => s.id === id);

export const scheduleFor = (street: Street, data: Data = current): Schedule =>
  data.sectors[street.sector]?.schedule ?? buildSchedule({});

export const sectorNumber = (street: Street, data: Data = current) => data.sectors[street.sector]?.number ?? 0;

/** Căutare fără diacritice: „fanatelor” găsește „Fânațelor”. */
export const matchesStreet = (street: Street, query: string) => slug(street.name).includes(slug(query));
