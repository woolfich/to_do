import { create } from 'zustand';
import type { Settings } from '../types';
import { SettingsRepository } from '../db';

interface SettingsState extends Settings {
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (changes: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  id: 'app-settings',
  theme: 'system',
  firstDayOfWeek: 1,
  notificationsEnabled: false,
  showCompleted: true,
  isLoading: true,

  loadSettings: async () => {
    try {
      const settings = await SettingsRepository.get();
      set({ ...settings, isLoading: false });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  updateSettings: async (changes) => {
    try {
      await SettingsRepository.update(changes);
      set(changes);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  },
}));
