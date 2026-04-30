import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  durationMs: number;
}

interface ToastState {
  items: ToastItem[];
  show: (item: Omit<ToastItem, 'id' | 'durationMs'> & { durationMs?: number }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const DEFAULT_DURATION = 3500;

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  show: (item) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const next: ToastItem = {
      id,
      variant: item.variant,
      title: item.title,
      message: item.message,
      durationMs: item.durationMs ?? DEFAULT_DURATION,
    };
    set((s) => ({ items: [...s.items, next] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
  clear: () => set({ items: [] }),
}));

function showHelper(variant: ToastVariant) {
  return (message: string, opts?: { title?: string; durationMs?: number }) =>
    useToastStore.getState().show({ variant, message, ...opts });
}

export const toast = {
  success: showHelper('success'),
  error: showHelper('error'),
  info: showHelper('info'),
  warning: showHelper('warning'),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
  clear: () => useToastStore.getState().clear(),
};
