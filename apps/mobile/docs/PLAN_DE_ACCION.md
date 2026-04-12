# Plan de Acción — The Prime Way App (React Native)

> **Objetivo:** Migrar toda la funcionalidad de la PWA (`theprimeway_pwa`) a una app nativa en React Native con Expo, usando el backend existente de Next.js como API REST.
>
> **Backend:** `theprimeway_pwa` (Next.js 16). La app mobile consume sus endpoints `/api/*` directamente. No se duplica lógica de servidor — todo el procesamiento de datos ocurre en el backend Next.js.
>
> **Fecha del plan:** 2026-02-28

---

## Tabla de Contenidos

1. [Stack Tecnológico](#1-stack-tecnológico)
2. [Dependencias a Instalar](#2-dependencias-a-instalar)
3. [Arquitectura y Estructura de Carpetas](#3-arquitectura-y-estructura-de-carpetas)
4. [Configuración Inicial](#4-configuración-inicial)
5. [Sistema de Autenticación Mobile](#5-sistema-de-autenticación-mobile)
6. [Cliente API](#6-cliente-api)
7. [Sistema de Diseño y Componentes](#7-sistema-de-diseño-y-componentes)
8. [Navegación](#8-navegación)
9. [Estado Global](#9-estado-global)
10. [Módulos / Features](#10-módulos--features)
    - [10.1 Onboarding](#101-onboarding)
    - [10.2 Autenticación](#102-autenticación)
    - [10.3 Dashboard](#103-dashboard)
    - [10.4 Tareas](#104-tareas)
    - [10.5 Hábitos](#105-hábitos)
    - [10.6 Metas (Prime Roadmap)](#106-metas-prime-roadmap)
    - [10.7 Finanzas](#107-finanzas)
    - [10.8 Notas](#108-notas)
    - [10.9 Calendario](#109-calendario)
    - [10.10 AI Chat](#1010-ai-chat)
    - [10.11 Pomodoro](#1011-pomodoro)
    - [10.12 Perfil](#1012-perfil)
    - [10.13 Ajustes](#1013-ajustes)
    - [10.14 Suscripción](#1014-suscripción)
    - [10.15 Notificaciones Push](#1015-notificaciones-push)
    - [10.16 KYC](#1016-kyc)
11. [Internacionalización (i18n)](#11-internacionalización-i18n)
12. [Variables de Entorno](#12-variables-de-entorno)
13. [Scripts del Proyecto](#13-scripts-del-proyecto)
14. [Modelos de Tipos TypeScript](#14-modelos-de-tipos-typescript)
15. [Orden de Implementación](#15-orden-de-implementación)

---

## 1. Stack Tecnológico

| Categoría | Tecnología | Versión | Notas |
|-----------|-----------|---------|-------|
| Framework | Expo + React Native | SDK 54 / RN 0.81 | New Architecture activada |
| Router | Expo Router | ~6.x | File-based routing, similar a Next.js |
| Estilo | NativeWind + Tailwind CSS | ^4.x | Tailwind v3 con preset nativewind |
| Componentes | react-native-reusables | latest | Análogo a shadcn/ui para RN |
| Data fetching | TanStack Query | ^5.x | Mismo que la PWA |
| Estado local | Zustand | ^5.x | Ligero, reemplaza Context API |
| Formularios | React Hook Form + Zod | latest | Mismas validaciones que la PWA |
| HTTP client | Axios | ^1.x | Mismo que la PWA |
| Auth | expo-auth-session + JWT | latest | OAuth nativo para Google/Apple |
| Almacenamiento seguro | expo-secure-store | latest | Tokens JWT |
| Almacenamiento local | MMKV (expo) | latest | Reemplaza localStorage/AsyncStorage |
| Animaciones | react-native-reanimated | ~4.x | Ya instalado |
| Iconos | lucide-react-native | ^0.5x | Ya instalado |
| Notificaciones push | expo-notifications | latest | Notificaciones nativas |
| Imágenes | expo-image | latest | Caché y performance |
| Cámara/picker | expo-image-picker | latest | Foto de perfil, recibos |
| Deep linking | expo-linking | ~8.x | Ya instalado |
| Internacionalización | i18n-js + expo-localization | latest | Traducciones en/es |
| Gráficas | victory-native | latest | Charts para finanzas |
| Fecha/hora | date-fns | ^4.x | Mismo que la PWA |
| Splash screen | expo-splash-screen | ~31.x | Ya instalado |
| Haptics | expo-haptics | latest | Feedback táctil |
| Clipboard | expo-clipboard | latest | Copiar datos |
| Calendario nativo | expo-calendar | latest | Integración Google Calendar |
| Web browser | expo-web-browser | latest | OAuth flows |
| Crypto | expo-crypto | latest | Generación de tokens PKCE |
| Device info | expo-device | latest | Nombre del dispositivo |

---

## 2. Dependencias a Instalar

### Instalar con `pnpm`:

```bash
# Data fetching y estado
pnpm add @tanstack/react-query zustand axios

# Formularios y validación
pnpm add react-hook-form @hookform/resolvers zod

# Autenticación mobile
pnpm add expo-auth-session expo-secure-store expo-web-browser expo-crypto

# Almacenamiento local
pnpm add expo-modules-core

# Notificaciones
pnpm add expo-notifications expo-device

# UI / UX
pnpm add expo-image expo-image-picker expo-haptics expo-clipboard

# Fechas
pnpm add date-fns date-fns-tz

# Internacionalización
pnpm add i18n-js expo-localization

# Gráficas (finanzas)
pnpm add victory-native

# Calendario
pnpm add expo-calendar

# Texto enriquecido (notas)
pnpm add react-native-pell-rich-editor
# O alternativa más ligera:
pnpm add @10play/tentap-editor

# Animaciones adicionales
pnpm add react-native-gesture-handler

# Sheets / Modales
pnpm add @gorhom/bottom-sheet

# Drag & Drop (tareas)
pnpm add react-native-draggable-flatlist

# Markdown
pnpm add react-native-markdown-display

# PDF (finanzas export)
pnpm add react-native-pdf-lib

# Storage rápido (MMKV)
pnpm add react-native-mmkv

# Skeleton loading
pnpm add moti

# react-native-reusables primitivos adicionales
pnpm add @rn-primitives/accordion @rn-primitives/alert-dialog \
  @rn-primitives/avatar @rn-primitives/checkbox @rn-primitives/collapsible \
  @rn-primitives/context-menu @rn-primitives/dialog @rn-primitives/dropdown-menu \
  @rn-primitives/hover-card @rn-primitives/label @rn-primitives/menubar \
  @rn-primitives/popover @rn-primitives/progress @rn-primitives/radio-group \
  @rn-primitives/select @rn-primitives/separator @rn-primitives/switch \
  @rn-primitives/tabs @rn-primitives/toggle @rn-primitives/toggle-group \
  @rn-primitives/tooltip @rn-primitives/types

# Flash list (listas performantes)
pnpm add @shopify/flash-list
```

### Dependencias de Expo (con `expo install`):

```bash
pnpm exec expo install expo-auth-session expo-secure-store expo-web-browser \
  expo-crypto expo-notifications expo-device expo-image expo-image-picker \
  expo-haptics expo-clipboard expo-calendar expo-localization \
  expo-linear-gradient expo-constants
```

---

## 3. Arquitectura y Estructura de Carpetas

```
theprimeway_app/
│
├── app/                          # Expo Router — Pages/routes
│   ├── _layout.tsx               # Root layout (providers, theme, auth guard)
│   ├── index.tsx                 # Redirect: auth check → dashboard or login
│   ├── +not-found.tsx
│   │
│   ├── (auth)/                   # Public routes (no auth required)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── verify-otp.tsx
│   │   └── forgot-password.tsx
│   │
│   ├── (onboarding)/             # Onboarding flow
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── goals.tsx
│   │   ├── habits.tsx
│   │   ├── tasks.tsx
│   │   ├── finances.tsx
│   │   └── notes.tsx
│   │
│   └── (app)/                    # Protected routes (auth required)
│       ├── _layout.tsx            # Tab navigator + auth guard
│       │
│       ├── (tabs)/                # Main tab bar
│       │   ├── _layout.tsx        # Bottom tab navigator
│       │   ├── index.tsx          # Dashboard / Home
│       │   ├── tasks/
│       │   │   ├── _layout.tsx
│       │   │   ├── index.tsx      # Redirect → today
│       │   │   ├── today.tsx
│       │   │   ├── all.tsx
│       │   │   ├── focus.tsx
│       │   │   └── weekly.tsx
│       │   ├── habits.tsx
│       │   ├── goals/
│       │   │   ├── _layout.tsx
│       │   │   ├── index.tsx      # Prime Roadmap overview
│       │   │   ├── vision.tsx
│       │   │   ├── pillar/[id].tsx
│       │   │   ├── outcome/[id].tsx
│       │   │   └── focus/[id].tsx
│       │   └── finances/
│       │       ├── _layout.tsx
│       │       ├── index.tsx      # Finance dashboard
│       │       ├── accounts.tsx
│       │       ├── transactions.tsx
│       │       ├── budgets.tsx
│       │       ├── debts.tsx
│       │       └── savings.tsx
│       │
│       ├── notes/
│       │   ├── index.tsx
│       │   └── [id].tsx
│       │
│       ├── calendar.tsx
│       ├── ai.tsx
│       ├── pomodoro.tsx
│       ├── profile.tsx
│       ├── settings.tsx
│       ├── subscription.tsx
│       └── kyc.tsx
│
├── src/                           # Main source code
│   │
│   ├── features/                  # Feature modules
│   │   ├── auth/
│   │   │   ├── components/        # LoginForm, RegisterForm, OTPInput
│   │   │   ├── hooks/             # useAuth, useAuthSession
│   │   │   ├── services/          # authService (API calls)
│   │   │   └── types.ts
│   │   ├── tasks/
│   │   │   ├── components/        # TaskCard, TaskList, TaskForm, ScheduleView
│   │   │   ├── hooks/             # useTasks, useTaskMutations, usePomodoro
│   │   │   ├── services/          # tasksService
│   │   │   └── types.ts
│   │   ├── habits/
│   │   ├── goals/
│   │   ├── finances/
│   │   ├── notes/
│   │   ├── calendar/
│   │   ├── ai/
│   │   ├── pomodoro/
│   │   ├── profile/
│   │   ├── settings/
│   │   ├── subscription/
│   │   ├── notifications/
│   │   ├── onboarding/
│   │   └── kyc/
│   │
│   ├── shared/                    # Shared code
│   │   ├── components/            # Reusable UI components
│   │   │   ├── ui/               # react-native-reusables (added via CLI)
│   │   │   ├── layout/           # Screen, Header, SafeArea
│   │   │   ├── feedback/         # LoadingSpinner, EmptyState, ErrorBoundary
│   │   │   └── data-display/     # StatsCard, Chart, Badge, Avatar
│   │   ├── hooks/                 # Global hooks
│   │   │   ├── useColorScheme.ts
│   │   │   ├── useDebounce.ts
│   │   │   └── useBottomSheet.ts
│   │   ├── providers/             # Context providers
│   │   │   ├── QueryProvider.tsx
│   │   │   ├── AuthProvider.tsx
│   │   │   └── ThemeProvider.tsx
│   │   ├── stores/                # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── settingsStore.ts
│   │   │   └── uiStore.ts
│   │   ├── api/                   # Centralized API client
│   │   │   ├── client.ts          # Axios instance + interceptors
│   │   │   ├── endpoints.ts       # URL constants
│   │   │   └── queryKeys.ts       # TanStack Query keys
│   │   ├── types/                 # Global TypeScript types
│   │   │   ├── models.ts          # Domain models
│   │   │   └── api.ts             # API response types
│   │   ├── utils/                 # Utilities
│   │   │   ├── date.ts
│   │   │   ├── currency.ts
│   │   │   └── format.ts
│   │   └── constants/             # Global constants
│   │       ├── pillars.ts         # PILLAR_AREAS, colors
│   │       └── subscription.ts    # Plans, limits
│   │
│   └── i18n/                      # Internationalization
│       ├── index.ts
│       ├── en.json
│       └── es.json
│
├── assets/
│   └── images/
│
├── docs/                          # This directory
│   ├── PLAN_DE_ACCION.md
│   └── AI_RULES.md
│
├── app.json
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
├── global.css
├── tsconfig.json
├── package.json
└── .env                           # Local environment variables
```

---

## 4. Configuración Inicial

### 4.1 `tsconfig.json` — Path aliases

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@ui/*": ["src/shared/components/ui/*"],
      "@features/*": ["src/features/*"],
      "@shared/*": ["src/shared/*"],
      "@assets/*": ["assets/*"]
    }
  }
}
```

### 4.2 `babel.config.js` — Babel (NO modificar la estructura actual)

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // Para react-native-reanimated — DEBE SER EL ÚLTIMO
      'react-native-reanimated/plugin',
    ],
  };
};
```

### 4.3 `metro.config.js` — Metro bundler (NO modificar)

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: './global.css',
  inlineRem: 16,
});
```

### 4.4 `app.json` — Configuración Expo (agregar plugins necesarios)

```json
{
  "expo": {
    "name": "The Prime Way",
    "slug": "theprimeway",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "theprimeway",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#09090b"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.theprimeway.app",
      "infoPlist": {
        "NSCalendarsUsageDescription": "Para sincronizar tus tareas con tu calendario",
        "NSCameraUsageDescription": "Para agregar fotos a tus recibos",
        "NSPhotoLibraryUsageDescription": "Para subir imágenes de perfil y recibos"
      }
    },
    "android": {
      "edgeToEdgeEnabled": true,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#09090b"
      },
      "package": "com.theprimeway.app",
      "permissions": [
        "NOTIFICATIONS",
        "READ_CALENDAR",
        "WRITE_CALENDAR",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/icon.png",
          "color": "#09090b",
          "defaultChannel": "default"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "La app necesita acceso a tus fotos."
        }
      ],
      "expo-calendar",
      "expo-localization"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

---

## 5. Sistema de Autenticación Mobile

### Estrategia

El backend usa NextAuth v5 (Auth.js) con sesiones JWT y cookies HTTP-only. Para la app mobile se necesita un enfoque basado en tokens Bearer:

1. **Email/Password:** Se añade un endpoint `/api/auth/mobile/login` en la PWA que valida credenciales y devuelve un JWT de larga duración.
2. **Google OAuth:** `expo-auth-session` maneja el flujo OAuth nativo, luego se intercambia el token con `/api/auth/mobile/oauth`.
3. **Apple OAuth:** Similar a Google con `expo-apple-authentication`.
4. El JWT se almacena en `expo-secure-store` (encriptado en el dispositivo).
5. Cada request a la API incluye `Authorization: Bearer <token>` via interceptor de Axios.

### Endpoints nuevos requeridos en la PWA

Añadir a `theprimeway_pwa/src/app/api/auth/mobile/`:

```
POST /api/auth/mobile/login          → { email, password } → { token, user }
POST /api/auth/mobile/register       → { email, password, name } → { token, user }
POST /api/auth/mobile/oauth          → { provider, accessToken } → { token, user }
POST /api/auth/mobile/refresh        → { refreshToken } → { token }
DELETE /api/auth/mobile/logout       → invalida el token
GET  /api/auth/mobile/me             → { user } (con token válido)
```

### Zustand Auth Store (`src/shared/stores/authStore.ts`)

```typescript
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}
```

### Flujo de autenticación

```
App start
  → loadStoredAuth() (SecureStore)
    → token válido → fetch /api/auth/mobile/me → setUser()
    → token expirado → refreshToken() o logout
    → sin token → mostrar pantalla de login
```

---

## 6. Cliente API

### `src/shared/api/client.ts`

```typescript
import axios from 'axios';
import { useAuthStore } from '@shared/stores/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL; // URL del backend PWA

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — añade JWT
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — maneja 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
```

### `src/shared/api/queryKeys.ts`

```typescript
export const queryKeys = {
  auth: { me: ['auth', 'me'] },
  tasks: {
    all: ['tasks'],
    today: ['tasks', 'today'],
    weekly: ['tasks', 'weekly'],
    grouped: ['tasks', 'grouped'],
    byId: (id: string) => ['tasks', id],
  },
  habits: {
    all: ['habits'],
    stats: ['habits', 'stats'],
    logs: (id: string) => ['habits', id, 'logs'],
  },
  goals: {
    visions: ['goals', 'visions'],
    pillars: ['goals', 'pillars'],
    outcomes: ['goals', 'outcomes'],
    focuses: ['goals', 'focuses'],
    weekly: ['goals', 'weekly'],
  },
  finances: {
    accounts: ['finances', 'accounts'],
    transactions: ['finances', 'transactions'],
    budgets: ['finances', 'budgets'],
    debts: ['finances', 'debts'],
    savings: ['finances', 'savings-goals'],
    income: ['finances', 'income-sources'],
    stats: ['finances', 'stats'],
  },
  notes: {
    all: ['notes'],
    categories: ['notes', 'categories'],
    byId: (id: string) => ['notes', id],
  },
  pomodoro: {
    sessions: ['pomodoro', 'sessions'],
    stats: ['pomodoro', 'stats'],
  },
  calendar: {
    accounts: ['calendar', 'accounts'],
    events: ['calendar', 'events'],
  },
  ai: {
    threads: ['ai', 'threads'],
  },
  profile: ['profile'],
  settings: ['settings'],
  subscription: {
    status: ['subscription', 'status'],
    plans: ['subscription', 'plans'],
  },
};
```

---

## 7. Sistema de Diseño y Componentes

### Paleta de colores (`global.css` y `lib/theme.ts`)

Se mantiene la misma paleta de la PWA (dark theme por defecto). Los colores se mapean a variables CSS:

```css
/* Dark (por defecto en mobile) */
:root {
  --background: 0 0% 3.9%;        /* #09090b */
  --foreground: 0 0% 98%;         /* #fafafa */
  --primary: 0 0% 98%;
  --secondary: 0 0% 14.9%;
  --muted: 0 0% 14.9%;
  --accent: 0 0% 14.9%;
  --destructive: 0 70.9% 59.4%;
  --border: 0 0% 14.9%;
  --ring: 300 0% 45%;
  --radius: 0.625rem;
  /* Chart colors */
  --chart-1: 220 70% 50%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
}
```

### Componentes a agregar vía react-native-reusables CLI

```bash
# Ejecutar desde theprimeway_app/
pnpm exec rnr add accordion
pnpm exec rnr add alert-dialog
pnpm exec rnr add avatar
pnpm exec rnr add badge
pnpm exec rnr add card
pnpm exec rnr add checkbox
pnpm exec rnr add collapsible
pnpm exec rnr add dialog
pnpm exec rnr add dropdown-menu
pnpm exec rnr add input
pnpm exec rnr add label
pnpm exec rnr add popover
pnpm exec rnr add progress
pnpm exec rnr add radio-group
pnpm exec rnr add select
pnpm exec rnr add separator
pnpm exec rnr add skeleton  # (via moti)
pnpm exec rnr add switch
pnpm exec rnr add tabs
pnpm exec rnr add textarea
pnpm exec rnr add toast
pnpm exec rnr add toggle
pnpm exec rnr add tooltip
```

### Componentes personalizados a crear

| Component | Location | Description |
|-----------|----------|-------------|
| `Screen` | `shared/components/layout/` | Wrapper with SafeAreaView, KeyboardAvoid |
| `Header` | `shared/components/layout/` | Native header with title and actions |
| `EmptyState` | `shared/components/feedback/` | Empty screen with icon and CTA |
| `ErrorState` | `shared/components/feedback/` | Error state with retry |
| `LoadingOverlay` | `shared/components/feedback/` | Loading spinner with blur |
| `StatsCard` | `shared/components/data-display/` | Statistics card |
| `PillarBadge` | `shared/components/data-display/` | Area badge (finances, career...) |
| `ProgressBar` | `shared/components/data-display/` | Progress bar |
| `ColorPicker` | `shared/components/` | Color picker for habits/notes |
| `DatePicker` | `shared/components/` | Native date picker |
| `CurrencyInput` | `shared/components/` | Input with currency formatting |
| `BottomSheetWrapper` | `shared/components/` | Wrapper over @gorhom/bottom-sheet |

---

## 8. Navegación

### Estructura de navegación

```
Root Stack
├── (auth)/          ← Stack (sin tab bar)
│   ├── login
│   ├── register
│   └── verify-otp
│
├── (onboarding)/    ← Stack (sin tab bar)
│   ├── welcome
│   ├── goals
│   ├── habits
│   ├── tasks
│   ├── finances
│   └── notes
│
└── (app)/           ← Stack (con auth guard)
    ├── (tabs)/      ← Bottom Tab Navigator
    │   ├── index    → Dashboard
    │   ├── tasks/   → Stack de tareas
    │   ├── habits   → Hábitos
    │   ├── goals/   → Stack de metas
    │   └── finances/→ Stack de finanzas
    │
    ├── notes/[id]   → Modal fullscreen
    ├── calendar     → Stack
    ├── ai           → Stack (chat)
    ├── pomodoro     → Modal/Stack
    ├── profile      → Stack
    ├── settings     → Stack
    ├── subscription → Stack
    └── kyc          → Stack
```

### Tab bar icons

| Tab | Icon (lucide) | Label |
|-----|--------------|-------|
| Dashboard | `LayoutDashboard` | Home |
| Tasks | `CheckSquare` | Tasks |
| Habits | `Repeat2` | Habits |
| Goals | `Target` | Goals |
| Finances | `Wallet` | Finances |

### Additional navigation (menu/drawer or header icons)

- Notes → icon in dashboard header
- AI Chat → icon in global header (floating button)
- Pomodoro → from TaskCard (play button)
- Calendar → from Settings or secondary tab
- Profile → top right menu
- Settings → top right menu

---

## 9. Estado Global

### Zustand Stores

#### `authStore.ts`
- `token`, `user`, `isAuthenticated`
- `login()`, `logout()`, `refreshToken()`, `loadStoredAuth()`

#### `settingsStore.ts`
- `locale` ('en' | 'es')
- `theme` ('light' | 'dark' | 'system')
- `timezone`
- `baseCurrency`
- `workPreferences`
- Persistencia via MMKV

#### `uiStore.ts`
- `activeTab`
- `pomodoroState` (running/paused/idle + timer)
- Notificaciones badge counts

### TanStack Query — Configuración

```typescript
// src/shared/providers/QueryProvider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,     // 5 minutos
      gcTime: 1000 * 60 * 30,        // 30 minutos
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      onError: (error) => { /* toast de error global */ },
    },
  },
});
```

---

## 10. Módulos / Features

### 10.1 Onboarding

**Pantallas:**
- `welcome.tsx` — Animación de bienvenida, logo, CTA
- `goals.tsx` — ¿Cuáles son tus metas principales? (selector visual)
- `habits.tsx` — Crea tu primer hábito
- `tasks.tsx` — Crea tu primera tarea
- `finances.tsx` — Configura tu moneda y primera cuenta
- `notes.tsx` — Crea tu primera nota

**API:** `PATCH /api/user/onboarding` — Actualiza paso actual y completados

**Experiencia nativa:** Uso de `react-native-reanimated` para transiciones entre pasos. Swipe gestures con `PanGestureHandler`.

---

### 10.2 Autenticación

**Pantallas:**
- `login.tsx` — Email/password + botones Google/Apple
- `register.tsx` — Nombre, email, password
- `verify-otp.tsx` — Input OTP de 6 dígitos
- `forgot-password.tsx` — Reset por email

**Componentes:**
- `LoginForm` — react-hook-form + zod
- `SocialButton` — Google/Apple con iconos nativos
- `OTPInput` — 6 cajas separadas con autofocus

**Servicios (`src/features/auth/services/`):**
```typescript
authService.login(email, password)         // → POST /api/auth/mobile/login
authService.register(data)                 // → POST /api/auth/mobile/register
authService.loginWithGoogle(token)         // → POST /api/auth/mobile/oauth
authService.loginWithApple(identityToken)  // → POST /api/auth/mobile/oauth
authService.requestOtp(email)             // → POST /api/auth/register/request-otp
authService.logout()                       // → DELETE /api/auth/mobile/logout
authService.me()                          // → GET /api/auth/mobile/me
```

**Notas de implementación:**
- Google OAuth: `expo-auth-session` con `GoogleAuthRequest`
- Apple OAuth: `expo-apple-authentication` (solo iOS nativo)
- Tokens almacenados en `expo-secure-store` con keys `auth_token` y `refresh_token`

---

### 10.3 Dashboard

**Pantalla:** `(tabs)/index.tsx`

**Secciones:**
1. **Header** — Saludo personalizado con nombre, fecha de hoy
2. **Resumen de hoy** — Tareas pendientes, hábitos del día, sesiones pomodoro
3. **Tareas de hoy** — Lista horizontal scrollable de las 3 tareas más próximas
4. **Hábitos de hoy** — Chips con checkboxes inline
5. **Motivación diaria** — Card inspiracional (puede venir de AI o hardcodeado)
6. **Quick actions** — Botones: + Tarea, + Hábito, + Gasto, Iniciar Pomodoro

**API calls:**
```
GET /api/tasks?grouped=today
GET /api/habits + /api/habits/stats
GET /api/pomodoro/stats
```

---

### 10.4 Tareas

**Pantallas:**
- `tasks/today.tsx` — Tareas de hoy con timeline
- `tasks/all.tsx` — Todas las tareas con filtros
- `tasks/focus.tsx` — Modo focus (prioritarias)
- `tasks/weekly.tsx` — Vista semanal

**Componentes clave:**
- `TaskCard` — Checkbox, título, prioridad, badge de tiempo
- `TaskForm` — Bottom sheet con formulario completo
- `TimelineView` — Vista de línea de tiempo para tareas programadas
- `WeeklyView` — Grid 7 días con tareas asignadas
- `PriorityBadge` — high/medium/low con colores
- `DurationBadge` — Tiempo estimado/actual
- `TagChip` — Etiquetas de tareas

**Funcionalidades:**
- Swipe to complete (react-native-gesture-handler)
- Long press para menú contextual
- Drag & drop para reordenar (react-native-draggable-flatlist)
- Pull to refresh
- Filtros por prioridad, estado, fecha
- Búsqueda de tareas
- Auto-scheduling (POST /api/tasks/[id]/schedule)
- Timer de inicio/fin real (actualStart, actualEnd)
- Integración con Pomodoro

**API calls:**
```
GET  /api/tasks/grouped         → Vista agrupada por día
GET  /api/tasks                 → Todas las tareas
POST /api/tasks                 → Crear tarea
PUT  /api/tasks/[id]            → Editar tarea
DELETE /api/tasks/[id]          → Eliminar
POST /api/tasks/[id]/schedule   → Auto-programar
POST /api/tasks/auto-archive    → Archivar completadas
```

---

### 10.5 Hábitos

**Pantallas:**
- `habits.tsx` — Lista de hábitos con tracking diario

**Componentes:**
- `HabitCard` — Con color del hábito, nombre, progreso semanal, botón completar
- `HabitForm` — Bottom sheet para crear/editar
- `HabitCalendar` — Mini calendario de racha
- `CompletionRing` — Círculo de progreso animado
- `WeeklyHeatmap` — Mapa de calor de actividad

**Funcionalidades:**
- Tap para completar (con haptic feedback)
- Swipe para editar/eliminar
- Vista por categoría
- Racha (streak) calculation
- Estadísticas de completado

**API calls:**
```
GET  /api/habits                → Lista
POST /api/habits                → Crear
PUT  /api/habits/[id]           → Editar
DELETE /api/habits/[id]         → Eliminar
POST /api/habits/[id]/logs      → Registrar log
GET  /api/habits/stats          → Estadísticas
```

---

### 10.6 Metas (Prime Roadmap)

**Pantallas:**
- `goals/index.tsx` — Vista de las 6 áreas (Pillars) con progress
- `goals/vision.tsx` — Mi visión principal
- `goals/pillar/[id].tsx` — Detalle de un área con outcomes
- `goals/outcome/[id].tsx` — Resultados y quarter focuses
- `goals/focus/[id].tsx` — Focus trimestral con tareas/hábitos vinculados

**Componentes:**
- `PillarCard` — Tarjeta de área (icono, nombre, progreso, color)
- `VisionCard` — Card de visión con narrativa
- `OutcomeItem` — Item de resultado con fecha y progreso
- `QuarterFocusCard` — Focus trimestral (Q1-Q4, año)
- `WeeklyGoalItem` — Goal semanal con estado
- `HealthMeter` — Indicador de momentum (0-100)
- `LinkedItemsList` — Lista de tareas/hábitos/finanzas vinculados

**6 Pilares:**
```typescript
const PILLARS = [
  { area: 'finances',      icon: 'Wallet',     color: '#10b981', label: 'Finanzas' },
  { area: 'career',        icon: 'Briefcase',  color: '#3b82f6', label: 'Carrera' },
  { area: 'health',        icon: 'Heart',      color: '#ef4444', label: 'Salud' },
  { area: 'relationships', icon: 'Users',      color: '#f59e0b', label: 'Relaciones' },
  { area: 'mindset',       icon: 'Brain',      color: '#8b5cf6', label: 'Mentalidad' },
  { area: 'lifestyle',     icon: 'Sparkles',   color: '#ec4899', label: 'Lifestyle' },
];
```

**API calls:**
```
GET/POST/PUT/DELETE /api/goals/visions
GET/POST/PUT/DELETE /api/goals/pillars
GET/POST/PUT/DELETE /api/goals/outcomes
GET/POST/PUT/DELETE /api/goals/focuses
GET/POST/PUT/DELETE /api/goals/weekly
POST /api/goals/focus-links/tasks       → Vincular tareas al focus
POST /api/goals/focus-links/habits      → Vincular hábitos
POST /api/goals/focus-links/finances    → Vincular finanzas
GET/POST /api/goals/health-snapshots    → Momentum semanal
```

---

### 10.7 Finanzas

**Pantallas:**
- `finances/index.tsx` — Dashboard: balance total, gastos mes, gráficas
- `finances/accounts.tsx` — Lista de cuentas con balances
- `finances/transactions.tsx` — Historial de transacciones con filtros
- `finances/budgets.tsx` — Presupuestos del mes
- `finances/debts.tsx` — Deudas con progreso
- `finances/savings.tsx` — Metas de ahorro

**Componentes:**
- `AccountCard` — Cuenta con balance, tipo, banco
- `TransactionItem` — Transacción con tipo, monto, descripción, fecha
- `TransactionForm` — Bottom sheet formulario completo
- `BudgetCard` — Presupuesto con barra de progreso
- `DebtCard` — Deuda con monto pagado/total
- `SavingsGoalCard` — Meta con progress ring
- `IncomeSourceItem` — Fuente de ingreso
- `BalanceSummary` — Resumen de ingresos/gastos
- `SpendingChart` — Gráfica de gastos por categoría (victory-native)
- `MonthSelector` — Selector de mes/año
- `CurrencyBadge` — Badge con código de moneda

**Funcionalidades:**
- Multi-moneda (USD, PEN, etc.)
- Filtros por cuenta, tipo, rango de fechas
- Importación de transacciones (CSV)
- Transacciones recurrentes
- Cálculo de cuotas de deuda
- Conversión de moneda automática
- Exportar a PDF

**API calls:**
```
GET/POST /api/finances/accounts
GET/POST /api/finances/transactions
GET/POST /api/finances/budgets
GET/POST /api/finances/debts
GET/POST /api/finances/savings-goals
GET/POST /api/finances/income-sources
GET      /api/finances/stats
GET      /api/finances/exchange-rates
POST     /api/finances/debts/calculate-installment
POST     /api/finances/transactions/import
```

---

### 10.8 Notas

**Pantallas:**
- `notes/index.tsx` — Lista de notas con búsqueda y categorías
- `notes/[id].tsx` — Editor de nota (fullscreen)

**Componentes:**
- `NoteCard` — Tarjeta con título, preview, color de categoría, pin badge
- `NoteEditor` — Editor de texto enriquecido (@10play/tentap-editor o react-native-pell-rich-editor)
- `CategoryFilter` — Chips de categorías horizontales
- `CategoryForm` — Crear/editar categoría con color e icono
- `NoteSearch` — Búsqueda con highlight

**Funcionalidades:**
- Editor rich text (bold, italic, lists, headings, code)
- Categorías con color e icono
- Pin/unpin de notas
- Archivar notas
- Búsqueda por título y contenido
- Ordenar por creación/actualización
- Swipe para archivar/eliminar

**API calls:**
```
GET/POST   /api/notes
GET/PUT/DELETE /api/notes/[id]
GET/POST   /api/notes/categories
GET/PUT/DELETE /api/notes/categories/[id]
```

---

### 10.9 Calendario

**Pantalla:** `calendar.tsx`

**Componentes:**
- `CalendarView` — Vista mensual/semanal con eventos
- `EventItem` — Evento del calendario con colores
- `ConnectGoogleButton` — Botón para conectar Google Calendar
- `CalendarSelector` — Seleccionar qué calendarios mostrar
- `TaskEventCard` — Tarea con bloque de tiempo en calendar

**Funcionalidades:**
- Visualizar eventos de Google Calendar
- Ver tareas programadas en el calendario
- Sincronizar tareas con Google Calendar
- Conectar/desconectar cuenta Google Calendar
- Vista día/semana/mes

**Implementación nativa:**
- Usar `expo-calendar` para acceso al calendario nativo del dispositivo
- OAuth via `expo-auth-session` para Google Calendar API

**API calls:**
```
GET/POST   /api/calendar/accounts
GET/POST   /api/calendar/google/events
POST       /api/calendar/google/connect
POST       /api/calendar/sync
GET        /api/calendar/calendars
```

---

### 10.10 AI Chat

**Pantalla:** `ai.tsx`

**Componentes:**
- `ChatThread` — Lista de mensajes con auto-scroll
- `ChatBubble` — Burbuja de mensaje (user/assistant)
- `ChatInput` — Input con botón enviar
- `StreamingText` — Texto con efecto de streaming
- `ThreadList` — Lista de conversaciones previas
- `ToolCallCard` — Visualización de tool calls del AI

**Funcionalidades:**
- Chat con streaming (Server-Sent Events o websocket)
- Historial de conversaciones
- Múltiples threads
- Context-aware (el AI accede a datos del usuario)
- Markdown rendering en respuestas

**API calls:**
```
POST /api/chat   → Enviar mensaje (streaming)
GET  /api/ai/* (threads, mensajes)
```

**Nota de implementación:** El endpoint `/api/chat` usa Vercel AI SDK con streaming. En React Native usar `EventSource` nativo o la librería `react-native-sse` para SSE.

---

### 10.11 Pomodoro

**Pantalla/Modal:** `pomodoro.tsx`

**Componentes:**
- `PomodoroTimer` — Círculo animado con countdown
- `SessionControls` — Play/Pause/Reset/Skip
- `SessionTypeSelector` — Focus / Short Break / Long Break
- `PomodoroStats` — Sessions del día, tiempo total

**Funcionalidades:**
- Timer configurable (25/5/15 min por defecto)
- Vinculación con tarea activa
- Notificación local al terminar la sesión
- Haptic feedback en cambios
- Background timer (cuando app va a background)
- Estadísticas diarias

**Estado:** Gestionado en `uiStore.ts` (Zustand) para persistencia cross-screens

**API calls:**
```
POST /api/pomodoro/sessions        → Crear sesión
PUT  /api/pomodoro/sessions/[id]   → Actualizar (completar)
GET  /api/pomodoro/stats           → Estadísticas
```

---

### 10.12 Perfil

**Pantalla:** `profile.tsx`

**Componentes:**
- `ProfileHeader` — Avatar, nombre, email
- `AvatarPicker` — Cambiar foto con expo-image-picker + Cloudinary upload
- `ProfileForm` — Nombre, bio, objetivo principal
- `UsageStats` — Límites del plan actual

**API calls:**
```
GET/PUT /api/profile
POST    (Cloudinary direct upload para avatar)
```

---

### 10.13 Ajustes

**Pantalla:** `settings.tsx`

**Secciones:**
1. **Cuenta** — Email, cambiar contraseña, proveedores vinculados
2. **Apariencia** — Tema (claro/oscuro/sistema)
3. **Idioma** — Español/Inglés
4. **Zona horaria** — Selector de timezone
5. **Monedas** — Moneda base y monedas preferidas
6. **Horario de trabajo** — Horas inicio/fin, días laborales
7. **Notificaciones** — Toggle por tipo de notificación
8. **AI** — Compartir datos con IA
9. **Suscripción** → Link a pantalla de suscripción
10. **Cuenta** — Cerrar sesión, eliminar cuenta

**API calls:**
```
GET/PUT /api/user/settings
GET/PUT /api/user/currency-settings
GET/PUT /api/user/work-preferences
GET/PUT /api/notifications/preferences
DELETE  /api/user/delete
```

---

### 10.14 Suscripción

**Pantalla:** `subscription.tsx`

**Componentes:**
- `PlanCard` — Tarjeta de plan con features
- `PlanComparison` — Tabla de comparación de planes
- `SubscriptionStatus` — Estado actual (trial, activo, cancelado)
- `BillingInfo` — Próximo cobro, método de pago

**Funcionalidades:**
- Ver planes disponibles
- Iniciar checkout (abre Lemon Squeezy en WebBrowser)
- Ver estado de suscripción actual
- Gestión del método de pago

**API calls:**
```
GET  /api/subscriptions/plans
GET  /api/subscriptions/status
POST /api/subscriptions/checkout  → devuelve URL de checkout
```

**Nota:** El checkout se abre con `expo-web-browser` (Lemon Squeezy hosted checkout).

---

### 10.15 Notificaciones Push

**Implementación con `expo-notifications`:**

```typescript
// src/features/notifications/
├── pushNotifications.ts     // Registro y manejo
├── notificationHandler.ts   // Handlers de respuesta
└── useNotifications.ts      // Hook principal
```

**Flujo:**
1. Al login → solicitar permisos de notificaciones
2. Obtener `ExpoPushToken`
3. Registrar token en `/api/notifications/register` (con el token del usuario)
4. El backend envía notificaciones vía FCM/APNs usando el token de Expo
5. Handler local para notificaciones en foreground

**Tipos de notificaciones:**
- Recordatorios de hábitos
- Alertas de Pomodoro (sesión terminada)
- Recordatorios de tareas
- Motivación diaria
- Mensajes de marketing

---

### 10.16 KYC

**Pantalla:** `kyc.tsx`

**Componentes:**
- `KYCForm` — Formulario de información personal/legal
- `KYCStatus` — Estado de verificación

**API calls:**
```
GET/POST /api/kyc
```

---

## 11. Internacionalización (i18n)

### Setup con `i18n-js` + `expo-localization`

```typescript
// src/i18n/index.ts
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from './en.json';
import es from './es.json';

export const i18n = new I18n({ en, es });

i18n.locale = Localization.getLocales()[0]?.languageCode ?? 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';
```

### Archivos de traducción

Los archivos `src/i18n/en.json` y `src/i18n/es.json` deben ser copias (adaptadas para mobile) de los archivos `messages/en.json` y `messages/es.json` de la PWA.

### Hook de uso

```typescript
// src/shared/hooks/useTranslation.ts
import { i18n } from '@/src/i18n';

export const useTranslation = (namespace?: string) => ({
  t: (key: string, params?: object) =>
    i18n.t(namespace ? `${namespace}.${key}` : key, params),
  locale: i18n.locale,
});
```

### Cambio de idioma

El idioma se guarda en `settingsStore` (MMKV) y se actualiza en el store + `i18n.locale` en tiempo real.

---

## 12. Variables de Entorno

Archivo `.env` (en la raíz de `theprimeway_app/`):

```bash
# URL base del backend PWA
EXPO_PUBLIC_API_URL=http://localhost:3000

# Para producción:
# EXPO_PUBLIC_API_URL=https://app.theprimeway.com

# Google OAuth (desde Google Cloud Console)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

# PostHog Analytics (opcional)
EXPO_PUBLIC_POSTHOG_KEY=phx_xxx
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Cloudinary (para uploads de imágenes)
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=xxx

# Expo Push Notifications
EXPO_PUBLIC_PROJECT_ID=xxx   # EAS Project ID para push tokens
```

**Importante:** Las variables de entorno en Expo que empiezan con `EXPO_PUBLIC_` son accesibles en el cliente. Las demás solo en build time.

---

## 13. Scripts del Proyecto

Actualizar `package.json`:

```json
{
  "scripts": {
    "dev": "expo start -c",
    "android": "expo start -c --android",
    "ios": "expo start -c --ios",
    "web": "expo start -c --web",
    "build:android": "eas build --platform android",
    "build:ios": "eas build --platform ios",
    "build:preview": "eas build --profile preview --platform all",
    "submit:android": "eas submit --platform android",
    "submit:ios": "eas submit --platform ios",
    "lint": "eslint src/ app/ --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf .expo node_modules && pnpm install",
    "clean:cache": "expo start -c --clear",
    "test": "jest"
  }
}
```

### EAS (Expo Application Services)

Crear `eas.json` en la raíz:

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "tu@email.com",
        "ascAppId": "APP_STORE_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-services.json"
      }
    }
  }
}
```

---

## 14. Modelos de Tipos TypeScript

Archivo `src/shared/types/models.ts`:

```typescript
// ============================================================
// USUARIO Y AUTH
// ============================================================

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  profilePicture?: string;
  bio?: string;
  primaryGoal?: string;
}

export interface UserSettings {
  locale: 'en' | 'es';
  theme: 'light' | 'dark';
  timezone: string;
  aiDataSharing: boolean;
}

export interface UserWorkPreferences {
  timeZone: string;
  workStartHour: number;
  workEndHour: number;
  workDays?: number[];
  defaultTaskDurationMinutes?: number;
  maxTasksPerDay?: number;
  overflowStrategy?: string;
}

// ============================================================
// TAREAS
// ============================================================

export type TaskStatus = 'open' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskSource = 'manual' | 'autoschedule' | 'dragged' | 'recovered';

export interface Task {
  id: string;
  userId?: string;
  weeklyGoalId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  tags: string[];
  estimatedDurationMinutes?: number;
  actualDurationMinutes?: number;
  scheduledDate?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  isAllDay?: boolean;
  source?: TaskSource;
  backlogState?: string;
  lockedTime?: boolean;
  orderInDay?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// HÁBITOS
// ============================================================

export type FrequencyType = 'daily' | 'weekly';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category?: string;
  color: string;
  targetFrequency: number;
  frequencyType?: FrequencyType;
  weekDays?: number[];
  isActive: boolean;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string;
  completedCount: number;
  notes?: string;
}

// ============================================================
// METAS (PRIME ROADMAP)
// ============================================================

export type PillarArea = 'finances' | 'career' | 'health' | 'relationships' | 'mindset' | 'lifestyle';

export interface PrimeVision {
  id: string;
  title: string;
  narrative?: string;
  status: string;
  pillars: PrimePillar[];
}

export interface PrimePillar {
  id: string;
  visionId?: string;
  area: PillarArea;
  title: string;
  description?: string;
  outcomes: PrimeOutcome[];
}

export interface PrimeOutcome {
  id: string;
  pillarId?: string;
  title: string;
  description?: string;
  targetDate?: string;
  progress: number;
  focuses: PrimeQuarterFocus[];
}

export interface PrimeQuarterFocus {
  id: string;
  outcomeId?: string;
  year: number;
  quarter: number;
  title: string;
  objectives?: Record<string, unknown>;
  startDate?: string;
  endDate?: string;
  progress: number;
}

export interface WeeklyGoal {
  id: string;
  quarterFocusId?: string;
  weekStartDate: string;
  title: string;
  description?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'canceled';
  order: number;
}

// ============================================================
// FINANZAS
// ============================================================

export type TransactionType = 'income' | 'expense' | 'transfer';
export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'other';

export interface FinanceAccount {
  id: string;
  name: string;
  type: AccountType;
  bankName?: string;
  accountNumber?: string;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  creditLimit?: number;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  budgetId?: string;
  debtId?: string;
  incomeSourceId?: string;
  type: TransactionType;
  amount: number;
  description: string;
  notes?: string;
  date: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  transferAccountId?: string;
  tags: string[];
  receiptUrl?: string;
  status: 'pending' | 'reviewed' | 'excluded';
  currency: string;
  exchangeRate?: number;
  baseCurrencyAmount?: number;
}

export interface Budget {
  id: string;
  name: string;
  description?: string;
  periodType: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  currency: string;
  categoryType: 'income' | 'expense';
  isActive: boolean;
}

export interface Debt {
  id: string;
  name: string;
  description?: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  creditor?: string;
  dueDate?: string;
  interestRate?: number;
  paymentDay?: number;
  installmentAmount?: number;
  installmentCount?: number;
  isRecurring?: boolean;
}

export interface SavingsGoal {
  id: string;
  accountId?: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate?: string;
  monthlyContribution?: number;
  status: 'active' | 'completed' | 'paused';
}

// ============================================================
// NOTAS
// ============================================================

export interface Note {
  id: string;
  categoryId?: string;
  title: string;
  content?: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  category?: NoteCategory;
}

export interface NoteCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

// ============================================================
// POMODORO
// ============================================================

export type SessionType = 'focus' | 'short_break' | 'long_break';

export interface PomodoroSession {
  id: string;
  taskId?: string;
  sessionType: SessionType;
  plannedDuration: number;
  actualDuration?: number;
  startedAt: string;
  completedAt?: string;
  isCompleted: boolean;
}

// ============================================================
// SUSCRIPCIÓN
// ============================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  price: number;
  currency: string;
  billingInterval: 'monthly' | 'yearly';
  maxHabits?: number;
  maxGoals?: number;
  maxNotes?: number;
  maxTasks?: number;
  hasAiAssistant?: boolean;
  hasAdvancedAnalytics?: boolean;
}

export interface UserSubscription {
  id: string;
  planId?: string;
  status?: 'pending' | 'active' | 'paused' | 'cancelled' | 'expired';
  trialEndsAt?: string;
  endsAt?: string;
  nextBillingDate?: string;
  plan?: SubscriptionPlan;
}

// ============================================================
// NOTIFICACIONES
// ============================================================

export interface NotificationPreferences {
  habitReminders: boolean;
  pomodoroAlerts: boolean;
  taskReminders: boolean;
  dailyMotivation: boolean;
  marketingMessages: boolean;
}
```

---

## 15. Orden de Implementación

### Fase 1 — Fundamentos (Semana 1-2)

1. [ ] Instalar todas las dependencias listadas en §2
2. [ ] Configurar paths aliases en `tsconfig.json`
3. [ ] Crear estructura de carpetas completa
4. [ ] Configurar `babel.config.js` con reanimated plugin
5. [ ] Configurar `app.json` con todos los plugins
6. [ ] Copiar y adaptar traducciones (en.json, es.json) de la PWA
7. [ ] Crear cliente API (`src/shared/api/client.ts`)
8. [ ] Crear tipos TypeScript (`src/shared/types/models.ts`)
9. [ ] Configurar TanStack Query provider
10. [ ] Configurar Zustand stores (auth, settings, ui)
11. [ ] Agregar endpoints mobile auth en la PWA (`/api/auth/mobile/*`)
12. [ ] Configurar `global.css` y `lib/theme.ts` con paleta final

### Fase 2 — Auth y Navegación (Semana 2-3)

13. [ ] Implementar flujo de autenticación (login/register/OTP)
14. [ ] Implementar Google OAuth con expo-auth-session
15. [ ] Implementar Apple OAuth (iOS)
16. [ ] Crear layout raíz con auth guard
17. [ ] Crear navigación de tabs principal
18. [ ] Crear pantallas vacías para cada sección (placeholder)
19. [ ] Agregar componentes base de react-native-reusables

### Fase 3 — Features Principales (Semana 3-6)

20. [ ] Dashboard con resumen del día
21. [ ] Módulo de Tareas (today, all, focus, weekly)
22. [ ] Módulo de Hábitos con tracking
23. [ ] Módulo de Metas (Prime Roadmap completo)
24. [ ] Módulo de Finanzas (cuentas, transacciones, budgets)

### Fase 4 — Features Secundarios (Semana 6-8)

25. [ ] Módulo de Notas con editor rich text
26. [ ] AI Chat con streaming
27. [ ] Pomodoro timer
28. [ ] Integración Calendario (Google Calendar)
29. [ ] Notificaciones push

### Fase 5 — Onboarding, Perfil y Ajustes (Semana 8-9)

30. [ ] Flujo de onboarding completo
31. [ ] Perfil de usuario con avatar
32. [ ] Pantalla de ajustes completa
33. [ ] Suscripción y planes
34. [ ] KYC

### Fase 6 — Pulido y Release (Semana 9-10)

35. [ ] Performance optimization (FlashList, memo, lazy loading)
36. [ ] Animaciones y micro-interacciones
37. [ ] Haptic feedback en acciones importantes
38. [ ] Deep linking
39. [ ] Splash screen animado
40. [ ] Testing (E2E con Detox o unit tests con Jest)
41. [ ] Build de producción (EAS Build)
42. [ ] Submit a App Store / Play Store

---

*Plan generado: 2026-02-28 | Versión 1.0*
