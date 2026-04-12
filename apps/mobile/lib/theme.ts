import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export const THEME = {
  light: {
    background: 'hsl(0, 0%, 100%)',
    foreground: 'hsl(220, 20%, 10%)',
    card: 'hsl(0, 0%, 100%)',
    cardForeground: 'hsl(220, 20%, 10%)',
    popover: 'hsl(0, 0%, 100%)',
    popoverForeground: 'hsl(220, 20%, 10%)',
    primary: 'hsl(230, 80%, 50%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(230, 70%, 58%)',
    secondaryForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(220, 14%, 96%)',
    mutedForeground: 'hsl(220, 10%, 46%)',
    accent: 'hsl(230, 70%, 58%)',
    accentForeground: 'hsl(0, 0%, 100%)',
    destructive: 'hsl(0, 75%, 55%)',
    border: 'hsl(220, 13%, 91%)',
    input: 'hsl(220, 13%, 91%)',
    ring: 'hsl(230, 80%, 50%)',
  },
  dark: {
    background: 'hsl(220, 20%, 7%)',
    foreground: 'hsl(0, 0%, 96%)',
    card: 'hsl(220, 16%, 10%)',
    cardForeground: 'hsl(0, 0%, 96%)',
    popover: 'hsl(220, 16%, 12%)',
    popoverForeground: 'hsl(0, 0%, 96%)',
    primary: 'hsl(225, 70%, 70%)',
    primaryForeground: 'hsl(220, 20%, 7%)',
    secondary: 'hsl(225, 55%, 62%)',
    secondaryForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(220, 12%, 14%)',
    mutedForeground: 'hsl(220, 8%, 55%)',
    accent: 'hsl(225, 55%, 62%)',
    accentForeground: 'hsl(0, 0%, 100%)',
    destructive: 'hsl(0, 65%, 58%)',
    border: 'hsl(220, 12%, 18%)',
    input: 'hsl(220, 12%, 18%)',
    ring: 'hsl(225, 70%, 70%)',
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
