import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const ENABLED_KEY = 'biometric_enabled';

interface BiometricState {
  enabled: boolean;
  locked: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setEnabled: (v: boolean) => Promise<void>;
  lock: () => void;
  unlock: () => void;
}

export const useBiometricStore = create<BiometricState>((set, get) => ({
  enabled: false,
  locked: false,
  hydrated: false,

  hydrate: async () => {
    const stored = await SecureStore.getItemAsync(ENABLED_KEY);
    const enabled = stored === '1';
    set({ enabled, locked: enabled, hydrated: true });
  },

  setEnabled: async (v) => {
    await SecureStore.setItemAsync(ENABLED_KEY, v ? '1' : '0');
    set({ enabled: v, locked: false });
  },

  lock: () => {
    if (get().enabled) set({ locked: true });
  },

  unlock: () => set({ locked: false }),
}));
