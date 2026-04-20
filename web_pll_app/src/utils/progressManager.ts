import { storage, STORAGE_KEYS } from './storage';
import type { PllId } from '../data/pllData';

export type PllStatus = 'correct' | 'wrong' | 'untested';

const toUnique = (values: string[]): string[] => Array.from(new Set(values));

export const progressManager = {
  async getCorrectPlls(): Promise<PllId[]> {
    return storage.getStringArray(STORAGE_KEYS.correctPlls) as PllId[];
  },
  async getWrongPlls(): Promise<PllId[]> {
    return storage.getStringArray(STORAGE_KEYS.wrongPlls) as PllId[];
  },
  async markPllAsCorrect(pll: PllId): Promise<void> {
    const correct = toUnique([...(await this.getCorrectPlls()), pll]);
    storage.setStringArray(STORAGE_KEYS.correctPlls, correct);

    const wrong = (await this.getWrongPlls()).filter((item) => item !== pll);
    storage.setStringArray(STORAGE_KEYS.wrongPlls, wrong);
  },
  async markPllAsWrong(pll: PllId): Promise<void> {
    const wrong = toUnique([...(await this.getWrongPlls()), pll]);
    storage.setStringArray(STORAGE_KEYS.wrongPlls, wrong);
  },
  async reset(): Promise<void> {
    storage.remove(STORAGE_KEYS.correctPlls);
    storage.remove(STORAGE_KEYS.wrongPlls);
  },
  async getStatus(pll: PllId): Promise<PllStatus> {
    const [correct, wrong] = await Promise.all([
      this.getCorrectPlls(),
      this.getWrongPlls(),
    ]);
    if (correct.includes(pll)) return 'correct';
    if (wrong.includes(pll)) return 'wrong';
    return 'untested';
  },
  async getLearnedCount(): Promise<number> {
    const correct = await this.getCorrectPlls();
    return correct.length;
  },
};
