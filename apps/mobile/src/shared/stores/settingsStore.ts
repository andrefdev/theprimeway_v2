import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Locale = 'en' | 'es';
type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  locale: Locale;
  theme: ThemeMode;
  timezone: string;
  baseCurrency: string;
  workStartHour: number;
  workEndHour: number;
  workDays: number[];
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemeMode) => void;
  setTimezone: (timezone: string) => void;
  setBaseCurrency: (currency: string) => void;
  setWorkPreferences: (prefs: {
    workStartHour?: number;
    workEndHour?: number;
    workDays?: number[];
  }) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: 'en',
      theme: 'system',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      baseCurrency: 'USD',
      workStartHour: 9,
      workEndHour: 17,
      workDays: [1, 2, 3, 4, 5],

      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
      setTimezone: (timezone) => set({ timezone }),
      setBaseCurrency: (currency) => set({ baseCurrency: currency }),
      setWorkPreferences: (prefs) =>
        set((state) => ({
          workStartHour: prefs.workStartHour ?? state.workStartHour,
          workEndHour: prefs.workEndHour ?? state.workEndHour,
          workDays: prefs.workDays ?? state.workDays,
        })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        locale: state.locale,
        theme: state.theme,
        timezone: state.timezone,
        baseCurrency: state.baseCurrency,
        workStartHour: state.workStartHour,
        workEndHour: state.workEndHour,
        workDays: state.workDays,
      }),
    }
  )
);
