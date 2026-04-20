import dayjs from 'dayjs';
import { storage, STORAGE_KEYS } from './storage';

const todayKey = () => dayjs().format('YYYY-MM-DD');

export const highScoreManager = {
  getAllTimeHighScore(): number {
    return storage.getNumber(STORAGE_KEYS.allTimeHighScore, 0);
  },
  getDailyHighScore(): number {
    const storedDate = storage.getString(STORAGE_KEYS.lastScoreSaveDate);
    if (storedDate !== todayKey()) {
      storage.setNumber(STORAGE_KEYS.dailyHighScore, 0);
      storage.setString(STORAGE_KEYS.lastScoreSaveDate, todayKey());
      return 0;
    }
    return storage.getNumber(STORAGE_KEYS.dailyHighScore, 0);
  },
  saveScore(score: number) {
    const currentAllTime = this.getAllTimeHighScore();
    if (score > currentAllTime) {
      storage.setNumber(STORAGE_KEYS.allTimeHighScore, score);
    }

    const currentDaily = this.getDailyHighScore();
    if (score > currentDaily) {
      storage.setNumber(STORAGE_KEYS.dailyHighScore, score);
    }

    storage.setString(STORAGE_KEYS.lastScoreSaveDate, todayKey());
  },
};
