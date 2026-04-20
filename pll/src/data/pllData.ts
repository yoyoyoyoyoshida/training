export type PllId =
  | 'Aa'
  | 'Ab'
  | 'E'
  | 'F'
  | 'Ga'
  | 'Gb'
  | 'Gc'
  | 'Gd'
  | 'H'
  | 'Ja'
  | 'Jb'
  | 'Na'
  | 'Nb'
  | 'Ra'
  | 'Rb'
  | 'T'
  | 'Ua'
  | 'Ub'
  | 'V'
  | 'Y'
  | 'Z';

export const PLL_OPTIONS: readonly PllId[] = [
  'Aa',
  'Ab',
  'E',
  'F',
  'Ga',
  'Gb',
  'Gc',
  'Gd',
  'H',
  'Ja',
  'Jb',
  'Na',
  'Nb',
  'Ra',
  'Rb',
  'T',
  'Ua',
  'Ub',
  'V',
  'Y',
  'Z',
];

export type CubeColor = 'WHITE' | 'BLUE' | 'RED' | 'YELLOW' | 'GREEN' | 'ORANGE';

export const AVAILABLE_COLORS: readonly CubeColor[] = [
  'WHITE',
  'BLUE',
  'RED',
  'YELLOW',
  'GREEN',
  'ORANGE',
];

export const DEFAULT_COLOR_MODE_MAP = {
  1: ['WHITE'],
  2: ['WHITE', 'YELLOW'],
  6: [...AVAILABLE_COLORS],
} as const satisfies Record<1 | 2 | 6, CubeColor[]>;

const generateImageList = (pll: PllId): string[] => {
  const files: string[] = [];
  for (let i = 1; i <= 4; i += 1) {
    for (let j = 1; j <= 4; j += 1) {
      for (let k = 1; k <= 4; k += 1) {
        files.push(`${pll}_${i}_${j}_${k}.png`);
      }
    }
  }
  return files;
};

export const PLL_IMAGE_MAP: Record<PllId, string[]> = PLL_OPTIONS.reduce(
  (acc, pll) => {
    acc[pll] = generateImageList(pll);
    return acc;
  },
  {} as Record<PllId, string[]>,
);

const toAssetPath = (relativePath: string) => {
  const base = import.meta.env.BASE_URL ?? './';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = relativePath.replace(/^\/+/, '');
  return `${normalizedBase}${normalizedPath}`;
};

export const LEARN_2D_IMAGES: Record<PllId, string[]> = PLL_OPTIONS.reduce(
  (acc, pll) => {
    acc[pll] = [`${pll}.png`, `${pll}_sq.png`];
    return acc;
  },
  {} as Record<PllId, string[]>,
);

export const getPracticeImagePath = (
  pll: PllId,
  imageFile: string,
  color: CubeColor,
) => toAssetPath(`assets/images/pll_images/${color}/${pll}/${imageFile}`);

export const getLearnImagePath = (pll: PllId, imageFile: string) =>
  toAssetPath(`assets/images/2d_pll_images/${pll}/${imageFile}`);

export const getAudioPath = (kind: 'correct' | 'wrong') =>
  toAssetPath(`assets/sounds/${kind}.mp3`);
