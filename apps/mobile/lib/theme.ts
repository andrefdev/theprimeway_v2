import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export const THEME = {
  light: {
    background: 'hsl(250, 55%, 98%)',
    foreground: 'hsl(224, 28%, 12%)',
    card: 'hsl(0, 0%, 100%)',
    cardForeground: 'hsl(224, 28%, 12%)',
    popover: 'hsl(0, 0%, 100%)',
    popoverForeground: 'hsl(224, 28%, 12%)',
    primary: 'hsl(238, 91%, 60%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(257, 85%, 64%)',
    secondaryForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(245, 38%, 94%)',
    mutedForeground: 'hsl(230, 12%, 48%)',
    accent: 'hsl(257, 85%, 64%)',
    accentForeground: 'hsl(0, 0%, 100%)',
    destructive: 'hsl(0, 75%, 55%)',
    border: 'hsl(240, 30%, 90%)',
    input: 'hsl(240, 30%, 90%)',
    ring: 'hsl(238, 91%, 60%)',
  },
  dark: {
    background: 'hsl(232, 28%, 8%)',
    foreground: 'hsl(240, 20%, 97%)',
    card: 'hsl(232, 22%, 12%)',
    cardForeground: 'hsl(0, 0%, 96%)',
    popover: 'hsl(232, 22%, 13%)',
    popoverForeground: 'hsl(0, 0%, 96%)',
    primary: 'hsl(238, 92%, 70%)',
    primaryForeground: 'hsl(232, 28%, 8%)',
    secondary: 'hsl(258, 84%, 70%)',
    secondaryForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(233, 16%, 18%)',
    mutedForeground: 'hsl(232, 12%, 65%)',
    accent: 'hsl(258, 84%, 70%)',
    accentForeground: 'hsl(0, 0%, 100%)',
    destructive: 'hsl(0, 65%, 58%)',
    border: 'hsl(233, 16%, 22%)',
    input: 'hsl(233, 16%, 22%)',
    ring: 'hsl(238, 92%, 70%)',
  },
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
