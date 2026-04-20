import { storage, STORAGE_KEYS } from './storage';

export const profileManager = {
  getName(): string {
    return storage.getString(STORAGE_KEYS.userName);
  },
  saveName(name: string) {
    storage.setString(STORAGE_KEYS.userName, name);
  },
};
