import { WasteType } from './data/schedule';

export interface Palette {
  /** Culorile gradientului (pubelă / sac). */
  colors: [string, string];
  /** Culoarea textului pe gradient. */
  on: string;
  emoji: string;
}

/** Culorile reprezentative ale fiecărei fracții. */
export const WASTE_PALETTE: Record<WasteType, Palette> = {
  residual: { colors: ['#2B2F33', '#6D4C41'], on: '#FFFFFF', emoji: '🗑️' }, // antracit / negru & maro
  plastic: { colors: ['#FDD835', '#43A047'], on: '#1B1B1B', emoji: '♻️' }, // galben / verde
  paper: { colors: ['#1E88E5', '#0D47A1'], on: '#FFFFFF', emoji: '📦' }, // albastru
  glass: { colors: ['#B0BEC5', '#ECEFF1'], on: '#1B1B1B', emoji: '🍾' }, // gri / transparent
};

export interface Theme {
  dark: boolean;
  background: string;
  surface: string;
  surfaceHigh: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  outline: string;
  errorContainer: string;
  onErrorContainer: string;
}

export const LIGHT: Theme = {
  dark: false,
  background: '#F6FBF4',
  surface: '#FFFFFF',
  surfaceHigh: '#E5EAE3',
  text: '#181D18',
  textMuted: '#5C6359',
  primary: '#2E7D32',
  onPrimary: '#FFFFFF',
  primaryContainer: '#C8EDC4',
  onPrimaryContainer: '#002204',
  outline: '#D5DBD2',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
};

export const DARK: Theme = {
  dark: true,
  background: '#101510',
  surface: '#1C211C',
  surfaceHigh: '#2A302A',
  text: '#E0E4DC',
  textMuted: '#A3AB9F',
  primary: '#9CD49A',
  onPrimary: '#00390A',
  primaryContainer: '#1B5E20',
  onPrimaryContainer: '#C8EDC4',
  outline: '#343B33',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
};
