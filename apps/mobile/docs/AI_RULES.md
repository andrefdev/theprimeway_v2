# Reglas para IA — The Prime Way App

> Este documento define las reglas, convenciones y restricciones que toda IA asistente (Claude, Cursor, Copilot, etc.) debe seguir al trabajar en este proyecto. Su objetivo es evitar errores comunes, mantener consistencia y garantizar que el código generado sea compatible con el stack tecnológico elegido.

---

## 1. Gestor de Paquetes

**SIEMPRE usar `pnpm`.** Nunca usar `npm` ni `yarn`.

```bash
# ✅ Correcto
pnpm add <paquete>
pnpm install
pnpm run dev

# ❌ Nunca
npm install
yarn add
```

Para paquetes de Expo que requieren configuración nativa, usar:
```bash
pnpm exec expo install <paquete>
```

---

## 2. Bundler y Transpilador

- **Metro** es el bundler. Nunca usar Webpack, Vite, ni esbuild.
- **Babel** es el transpilador. La configuración está en `babel.config.js`.
- **NativeWind** requiere que su plugin de Babel esté configurado ANTES de `react-native-reanimated/plugin`.

```js
// babel.config.js — Orden correcto
presets: [
  ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
  'nativewind/babel',
],
plugins: [
  // react-native-reanimated/plugin SIEMPRE al final
  'react-native-reanimated/plugin',
],
```

---

## 3. Estilos y UI

### NativeWind (Tailwind CSS para React Native)

- **SIEMPRE** usar clases de Tailwind con NativeWind. Nunca `StyleSheet.create()` salvo casos excepcionales.
- Usar `className` prop como en web.
- Tailwind versión **3.x** (no v4 — NativeWind no soporta v4 aún).
- Dark mode: `className="bg-white dark:bg-zinc-950"`.

```tsx
// ✅ Correcto
<View className="flex-1 bg-background px-4 py-6">
  <Text className="text-foreground text-lg font-semibold">Título</Text>
</View>

// ❌ Nunca mezclar StyleSheet con NativeWind en el mismo componente
const styles = StyleSheet.create({ container: { flex: 1 } });
```

### react-native-reusables

- Es el sistema de componentes principal (análogo a shadcn/ui).
- Usar el CLI para agregar componentes: `pnpm exec rnr add <componente>`.
- Los componentes se copian en `src/shared/components/ui/`.
- **No modificar** los archivos de primitivos `@rn-primitives/*` directamente.
- Los componentes usan `@rn-primitives/slot` para composición — respetar el patrón `asChild`.

### Colores y Tema

- Usar siempre las variables CSS del design system: `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, etc.
- **No hardcodear colores** como `bg-gray-900` o `text-white`. Usar las variables semánticas.
- Las variables están definidas en `global.css` y mapeadas en `tailwind.config.js`.

### Función `cn()`

Siempre usar `cn()` de `lib/utils.ts` para combinar clases condicionales:

```tsx
import { cn } from '@/lib/utils';

<View className={cn('p-4', isActive && 'bg-primary', className)} />
```

---

## 4. Framework de Navegación

- **Expo Router** (file-based routing). Nunca usar React Navigation directamente para crear navegadores — siempre via Expo Router.
- Rutas en la carpeta `app/`.
- Para navegar: `router.push('/ruta')`, `router.replace()`, `Link` component.
- Grupos de rutas con paréntesis: `(auth)`, `(app)`, `(tabs)`.
- **Typed routes** habilitado — usar los tipos generados.

```tsx
// ✅ Correcto
import { router } from 'expo-router';
router.push('/(app)/(tabs)/tasks/today');

// ❌ Nunca usar navigate() de @react-navigation directamente
```

---

## 5. Estado y Data Fetching

### TanStack Query (React Query)

- **SIEMPRE** usar TanStack Query para llamadas a la API.
- Usar los `queryKeys` definidos en `src/shared/api/queryKeys.ts`.
- Invalidar queries después de mutaciones.

```typescript
// ✅ Correcto
const { data: tasks } = useQuery({
  queryKey: queryKeys.tasks.today,
  queryFn: () => tasksService.getToday(),
});

const mutation = useMutation({
  mutationFn: tasksService.create,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
});
```

### Zustand

- Para estado local/UI que no viene de la API usar Zustand.
- Stores en `src/shared/stores/`.
- **No usar** Context API para estado global salvo el `ThemeProvider` y `QueryProvider`.

### Almacenamiento Local

- **`expo-secure-store`** para datos sensibles (tokens JWT, credenciales).
- **`react-native-mmkv`** para preferencias del usuario (settings, locale, etc.).
- **Nunca** usar `AsyncStorage` directamente — es más lento.

---

## 6. Cliente HTTP

- Usar el cliente Axios configurado en `src/shared/api/client.ts`.
- **Nunca** usar `fetch()` directamente para llamadas a la API.
- Las llamadas a la API van al backend Next.js (`theprimeway_pwa`).
- La URL base viene de `process.env.EXPO_PUBLIC_API_URL`.

```typescript
// ✅ Correcto
import { apiClient } from '@shared/api/client';
const response = await apiClient.get('/api/tasks');

// ❌ Nunca
const response = await fetch('http://localhost:3000/api/tasks');
```

---

## 7. Formularios

- **React Hook Form** para todos los formularios.
- **Zod** para validación de schemas (el mismo que usa la PWA).
- Usar `@hookform/resolvers/zod` para integrar ambos.

```typescript
// ✅ Correcto
const schema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  priority: z.enum(['low', 'medium', 'high']),
});

const { control, handleSubmit } = useForm({
  resolver: zodResolver(schema),
  defaultValues: { title: '', priority: 'medium' },
});
```

---

## 8. Iconos

- Usar **`lucide-react-native`** (ya instalado). No instalar otras librerías de iconos.
- Usar el componente `Icon` wrapper de `components/ui/icon.tsx`:

```tsx
// ✅ Correcto
import { Icon } from '@/components/ui/icon';
import { CheckCircle } from 'lucide-react-native';
<Icon as={CheckCircle} className="text-primary" size={20} />

// ❌ No usar directamente sin el wrapper (pierde el soporte de className)
import { CheckCircle } from 'lucide-react-native';
<CheckCircle size={20} color="white" />
```

---

## 9. Animaciones

- Usar **`react-native-reanimated`** para animaciones complejas y de performance.
- Para animaciones de entrada/salida simples: `moti` (basado en Reanimated).
- **No** usar la API `Animated` de React Native base.
- Para gestures: `react-native-gesture-handler`.

```typescript
// ✅ Para animaciones
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import { MotiView } from 'moti';
```

---

## 10. TypeScript

- **Strict mode** activado. No usar `any`.
- Todos los tipos del dominio en `src/shared/types/models.ts`.
- Tipos de respuestas API en `src/shared/types/api.ts`.
- No usar `as <Type>` para castear — preferir type guards.
- Interfaces para objetos de dominio, types para unions/intersections.

```typescript
// ✅ Correcto
const tasks: Task[] = data ?? [];

// ❌ No
const tasks = data as any[];
```

---

## 11. Arquitectura de Archivos

### Organización por Feature

```
src/features/<feature>/
├── components/     # Componentes específicos del feature
├── hooks/          # Hooks del feature (useFeature, useFeatureMutation)
├── services/       # Llamadas a la API del feature
└── types.ts        # Tipos específicos del feature (extienden models.ts)
```

### Reglas de importación

- Usar path aliases: `@/*` para `src/*`, `@ui/*` para componentes UI
- **Nunca** imports relativos que suban más de 2 niveles (`../../..`)
- Imports ordenados: React → React Native → librerías externas → internos

```typescript
// ✅ Orden correcto
import React from 'react';
import { View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { TaskCard } from '@features/tasks/components/TaskCard';
import { queryKeys } from '@shared/api/queryKeys';
```

---

## 12. Rendimiento

- Usar **`@shopify/flash-list`** en lugar de `FlatList` para listas largas.
- Envolver componentes pesados con `React.memo()`.
- Usar `useCallback` para funciones pasadas a componentes hijo.
- Imágenes: usar `expo-image` (con caché) en lugar de `Image` de React Native.

```tsx
// ✅ Para listas performantes
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={tasks}
  renderItem={({ item }) => <TaskCard task={item} />}
  estimatedItemSize={72}
/>
```

---

## 13. Plataforma — Diferencias iOS / Android

- Usar `Platform.OS` solo cuando sea absolutamente necesario.
- Preferir soluciones cross-platform de Expo.
- Para sombras: usar `shadow-*` de Tailwind (NativeWind maneja las diferencias).
- El `borderRadius` se aplica diferente — usar siempre las variables `rounded-*`.

---

## 14. Backend (PWA Next.js)

- El backend es `theprimeway_pwa` con Next.js 16.
- **Nunca** duplicar lógica de negocio en la app mobile — toda la lógica está en el backend.
- Los endpoints siguen el patrón REST definido en `docs/PLAN_DE_ACCION.md`.
- Para auth mobile se usa `/api/auth/mobile/*` (no los endpoints de NextAuth directamente).
- Usar los mismos schemas Zod de validación que el backend cuando sea posible.

---

## 15. Variables de Entorno

- Variables públicas (accesibles en el cliente): prefijo `EXPO_PUBLIC_`.
- Variables privadas (build time): sin prefijo.
- Acceder con `process.env.EXPO_PUBLIC_XXX` — nunca hardcodear URLs o keys.

```typescript
// ✅ Correcto
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

// ❌ Nunca
const apiUrl = 'http://localhost:3000';
```

---

## 16. Expo Router — Convenciones de Rutas

```
app/
├── _layout.tsx              # Layout raíz (OBLIGATORIO)
├── index.tsx                # Ruta "/"
├── +not-found.tsx           # 404
├── (group)/                 # Grupo sin URL prefix
│   ├── _layout.tsx          # Layout del grupo
│   └── screen.tsx           # Ruta "/(group)/screen"
└── [param].tsx              # Ruta dinámica "/:param"
```

- `_layout.tsx` en cada carpeta de grupo es OBLIGATORIO.
- Los modales se abren con `router.push()` y se define `<Stack.Screen presentation="modal" />` en el layout padre.

---

## 17. Convenciones de Código

### Nombres de archivos

- Componentes: `PascalCase.tsx` → `TaskCard.tsx`
- Hooks: `camelCase.ts` → `useTasks.ts`
- Servicios: `camelCase.ts` → `tasksService.ts`
- Tipos: `camelCase.ts` → `models.ts`
- Screens (Expo Router): `kebab-case.tsx` → `task-detail.tsx`

### Componentes

```tsx
// ✅ Estructura estándar de componente
interface Props {
  task: Task;
  onPress?: () => void;
  className?: string;
}

export function TaskCard({ task, onPress, className }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={cn('bg-card rounded-lg p-4', className)}
    >
      <Text className="text-foreground font-medium">{task.title}</Text>
    </Pressable>
  );
}
```

### Hooks de feature

```typescript
// ✅ Estructura estándar de hook
export function useTasks(filter?: TaskFilter) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.tasks.all,
    queryFn: () => tasksService.getAll(filter),
  });

  const createMutation = useMutation({
    mutationFn: tasksService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createTask: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
```

---

## 18. Lo que NUNCA hacer

- ❌ `npm` o `yarn` — siempre `pnpm`
- ❌ `StyleSheet.create()` — siempre NativeWind
- ❌ `AsyncStorage` — usar MMKV o SecureStore
- ❌ `fetch()` directo — usar el cliente Axios
- ❌ `any` en TypeScript
- ❌ Hardcodear URLs, colores o strings mágicos
- ❌ Context API para estado global (usar Zustand)
- ❌ `FlatList` para listas largas (usar FlashList)
- ❌ `Image` de React Native (usar expo-image)
- ❌ Instalar Webpack, Vite ni ningún bundler alternativo
- ❌ Modificar `node_modules` directamente
- ❌ Crear lógica de negocio en el frontend que debería estar en el backend
- ❌ Usar `expo-av` deprecado — usar `expo-audio` o `expo-video`
- ❌ Poner secretos en `EXPO_PUBLIC_*` (son visibles en el cliente)

---

*Versión 1.0 — 2026-02-28*
