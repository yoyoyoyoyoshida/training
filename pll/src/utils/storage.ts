const STORAGE_PREFIX = 'pll-web';

const withPrefix = (key: string) => `${STORAGE_PREFIX}:${key}`;

export const storage = {
  getNumber(key: string, fallback = 0): number {
    const raw = localStorage.getItem(withPrefix(key));
    if (raw == null) return fallback;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? fallback : parsed;
  },
  setNumber(key: string, value: number) {
    localStorage.setItem(withPrefix(key), value.toString());
  },
  getString(key: string, fallback = ''): string {
    const raw = localStorage.getItem(withPrefix(key));
    return raw ?? fallback;
  },
  setString(key: string, value: string) {
    localStorage.setItem(withPrefix(key), value);
  },
  getStringArray(key: string, fallback: string[] = []): string[] {
    const raw = localStorage.getItem(withPrefix(key));
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as string[]) : fallback;
    } catch (error) {
      console.warn('Failed to parse storage array', error);
      return fallback;
    }
  },
  setStringArray(key: string, values: string[]) {
    localStorage.setItem(withPrefix(key), JSON.stringify(values));
  },
  getJSON<T>(key: string, fallback: T): T {
    const raw = localStorage.getItem(withPrefix(key));
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn('Failed to parse storage JSON', error);
      return fallback;
    }
  },
  setJSON(key: string, value: unknown) {
    localStorage.setItem(withPrefix(key), JSON.stringify(value));
  },
  remove(key: string) {
    localStorage.removeItem(withPrefix(key));
  },
};

export const STORAGE_KEYS = {
  correctPlls: 'correct_plls',
  wrongPlls: 'wrong_plls',
  allTimeHighScore: 'all_time_high_score',
  dailyHighScore: 'daily_high_score',
  lastScoreSaveDate: 'last_save_date',
  colorMode: 'color_mode',
  selectedColors: 'selected_colors',
  userName: 'user_name',
  deviceId: 'device_id',
  lastReadAnnouncement: 'last_read_announcement',
  timeAttackCount: 'time_attack_count',
  timeAttackReview: 'time_attack_review',
} as const;
