import { AVAILABLE_COLORS, CubeColor, DEFAULT_COLOR_MODE_MAP } from '../data/pllData';
import { storage, STORAGE_KEYS } from './storage';

export type ColorMode = 1 | 2 | 6;

const isCubeColor = (value: string): value is CubeColor =>
  AVAILABLE_COLORS.includes(value as CubeColor);

const sanitizeColors = (colors: string[]): CubeColor[] => {
  const filtered = colors.filter(isCubeColor);
  return filtered.length > 0 ? filtered : DEFAULT_COLOR_MODE_MAP[1];
};

export const colorPreferences = {
  getMode(): ColorMode {
    const raw = storage.getNumber(STORAGE_KEYS.colorMode, 1);
    return [1, 2, 6].includes(raw) ? (raw as ColorMode) : 1;
  },
  setMode(mode: ColorMode) {
    storage.setNumber(STORAGE_KEYS.colorMode, mode);
    storage.setStringArray(
      STORAGE_KEYS.selectedColors,
      DEFAULT_COLOR_MODE_MAP[mode],
    );
  },
  getSelectedColors(): CubeColor[] {
    const mode = this.getMode();
    const raw = storage.getStringArray(
      STORAGE_KEYS.selectedColors,
      DEFAULT_COLOR_MODE_MAP[mode],
    );
    const sanitized = sanitizeColors(raw);
    return sanitized.slice(0, mode === 6 ? sanitized.length : mode);
  },
  setSelectedColors(colors: CubeColor[]) {
    storage.setStringArray(STORAGE_KEYS.selectedColors, colors);
  },
};
