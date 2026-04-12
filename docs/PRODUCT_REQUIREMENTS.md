# ThePrimeWay — Documento de Requisitos del Sistema

> **Versión:** 2.0  
> **Fecha:** 11 de abril de 2026  
> **Stack:** Monorepo (Hono API + React Web + Expo Mobile + Tauri Desktop + Admin)  
> **Base de datos:** PostgreSQL 17 + Prisma 7  

---

## 1. Visión del Sistema

### 1.1 Declaración de Visión

ThePrimeWay es una plataforma AI-first de productividad y desarrollo personal que conecta la visión de vida del usuario con su ejecución diaria. A través de tres módulos core — **Objetivos, Tareas y Hábitos** — potenciados por inteligencia artificial transversal, ThePrimeWay transforma metas abstractas en acciones concretas, medibles y gamificadas.

### 1.2 Propuesta de Valor Diferenciada

> *"ThePrimeWay — IA que transforma tus metas en hábitos, tus hábitos en resultados."*

Ningún competidor combina nativamente:

- Planificación jerárquica de objetivos (10 años → 3 años → 1 año → 3 meses → semanal)
- Gestión inteligente de tareas con IA que agenda, sugiere y adapta
- Gamificación profunda vinculada a progreso real de objetivos
- Presencia nativa persistente en desktop (tray + overlay + shortcuts) y mobile (widgets)
- IA como sistema nervioso del producto, no como módulo aislado

### 1.3 Principios de Diseño

1. **AI-first:** Cada interacción es potenciada por IA sin que el usuario tenga que "ir al módulo de IA"
2. **Purpose-driven:** Todo (tarea, hábito, XP) se conecta a un objetivo de vida
3. **Persistent presence:** La app vive con el usuario durante su trabajo (tray, overlay, widgets)
4. **Simplicity over breadth:** 3 módulos profundos > 22 módulos superficiales
5. **Offline-capable:** La plataforma funciona sin conexión y sincroniza al reconectarse

### 1.4 Usuarios Objetivo

- **Primario:** Profesionales y emprendedores (25-40 años) que quieren alinear su día a día con objetivos de largo plazo
- **Secundario:** Estudiantes y personas en transición de carrera buscando estructura y dirección
- **Terciario:** Developers y knowledge workers que viven en su desktop y valoran shortcuts y automatización

---

## 2. Arquitectura del Monorepo Actual

### 2.1 Estructura

```
monorepo/
├── apps/
│   ├── api/           → Hono 4.7 + Prisma 7 + PostgreSQL 17 (puerto 3001)
│   ├── web/           → React 19 + Vite 8 + TanStack Router/Query + Zustand
│   ├── mobile/        → Expo 54 + React Native 0.81 + NativeWind
│   ├── desktop/       → Tauri 2.5 + React 19 + Vite 8
│   └── admin/         → React 19 + Vite 8 + TanStack Table
├── packages/
│   ├── shared/        → Types, validators (Zod), constants, utils
│   ├── ui/            → shadcn/Radix component library
│   ├── config-ts/     → TypeScript presets
│   └── config-biome/  → Linter config
├── docs/              → Documentación del sistema
└── docker-compose.yml → PostgreSQL 17-alpine local
```

### 2.2 Stack Técnico

| Capa | Tecnología |
|------|-----------|
| API | Hono 4.7, Node 22, OpenAPI/Swagger |
| ORM | Prisma 7 + Neon serverless adapter |
| Auth | JWT (jose), bcryptjs, OAuth (Google, Apple) |
| Web | React 19, Vite 8, TanStack Router/Query, Zustand, Tailwind 4 |
| Mobile | Expo 54, React Native 0.81, NativeWind, Expo Router |
| Desktop | Tauri 2.5 (Rust), dual-window (main + overlay) |
| IA | Vercel AI SDK, OpenAI |
| Pagos | Lemon Squeezy |
| Notificaciones | Firebase FCM, Web Push VAPID |
| i18n | i18next (web), i18n-js (mobile) — en, es |
| Testing | Vitest 4, Testing Library |
| Linting | Biome |
| Build | Turborepo 2.9, pnpm 9.12 |

### 2.3 Base de Datos Actual

62 modelos Prisma cubriendo: User/Auth, Tasks, Habits, Goals, Finances (8 sub-modelos), Notes, Reading, Gamification, Pomodoro, Subscriptions, Notifications, Calendar, Feature Flags.

---

## 3. Módulos Core — Requisitos Funcionales

### 3.1 MÓDULO: OBJETIVOS (Vision-to-Execution Engine)

#### 3.1.1 Estructura Jerárquica

El sistema debe soportar una jerarquía de 5 niveles donde cada nivel inferior alimenta el progreso del superior:

| ID | Nivel | Horizonte | Revisión | Cantidad Máx |
|----|-------|-----------|----------|--------------|
| OBJ-01 | Visión | 10 años | Anual | 1 por usuario |
| OBJ-02 | Objetivos Estratégicos | 3 años | Semestral | Hasta 6 (uno por pilar) |
| OBJ-03 | Objetivos Anuales | 1 año | Trimestral | Hasta 3 por objetivo estratégico |
| OBJ-04 | Focos Trimestrales | 3 meses | Semanal | Hasta 3 por objetivo anual |
| OBJ-05 | Metas Semanales | 1 semana | Diaria | Hasta 5 por foco trimestral |

#### 3.1.2 Requisitos Funcionales — Objetivos

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| OBJ-F01 | El usuario puede crear, editar y eliminar elementos en cada nivel de la jerarquía | P0 |
| OBJ-F02 | Cada elemento se vincula a su padre en la jerarquía (visión → estratégico → anual → trimestral → semanal) | P0 |
| OBJ-F03 | El sistema calcula automáticamente el % de progreso de cada objetivo basado en sus hijos (tareas completadas, hábitos mantenidos, metas semanales logradas) | P0 |
| OBJ-F04 | Vista de árbol interactiva que muestra toda la cascada desde visión 10a hasta tareas diarias | P0 |
| OBJ-F05 | Indicador de salud visual por objetivo: verde (on track), amarillo (en riesgo), rojo (rezagado) — calculado por IA basándose en progreso vs tiempo restante | P0 |
| OBJ-F06 | La IA sugiere objetivos hijos al crear un nivel superior (ej: al crear visión, propone objetivos 3a coherentes) | P1 |
| OBJ-F07 | La IA detecta conflictos entre objetivos (ej: demasiados objetivos para un trimestre dado el calendar del usuario) | P1 |
| OBJ-F08 | Quarterly Review asistido por IA: genera reporte de progreso, identifica estancamientos, propone nuevos focos | P1 |
| OBJ-F09 | Templates de objetivos pre-construidos por categoría: Fitness, Carrera, Finanzas, Aprendizaje, Relaciones, Side Project | P1 |
| OBJ-F10 | Los 6 pilares de vida (Prime Pillars) se mantienen como categorización de objetivos estratégicos: Finanzas, Carrera, Salud, Relaciones, Mentalidad, Estilo de Vida | P0 |
| OBJ-F11 | Dashboard de objetivos con vista resumen: progreso global, pilares con más/menos avance, próximos deadlines | P0 |
| OBJ-F12 | El usuario puede vincular tareas existentes a cualquier nivel de objetivo | P0 |
| OBJ-F13 | El usuario puede vincular hábitos existentes a cualquier nivel de objetivo | P0 |
| OBJ-F14 | Historial de snapshots semanales para tracking de momentum por objetivo (GoalHealthSnapshot existente) | P1 |
| OBJ-F15 | La IA genera weekly planning: "Esta semana enfócate en X porque tu objetivo Y tiene deadline en 3 semanas" | P1 |
| OBJ-F16 | Notificación de inactividad: si un objetivo no tiene actividad (tareas/hábitos) en 14 días, la IA alerta | P1 |
| OBJ-F17 | Exportar roadmap de objetivos como imagen o PDF compartible | P2 |

#### 3.1.3 Modelos de Datos — Objetivos

Reutilizar y extender los modelos existentes:

- `PrimeVision` → Visión 10 años (ya existe)
- `PrimePillar` → 6 pilares de vida (ya existe)
- `PrimeOutcome` → Objetivos estratégicos 3 años (ya existe, renombrar concepto)
- `PrimeQuarterFocus` → Focos trimestrales (ya existe)
- `WeeklyGoal` → Metas semanales (ya existe)
- `FocusTaskLink` → Vínculo foco ↔ tarea (ya existe)
- `FocusHabitLink` → Vínculo foco ↔ hábito (ya existe)
- `GoalHealthSnapshot` → Snapshots semanales (ya existe)
- **NUEVO:** `AnnualGoal` → Objetivos anuales (nivel intermedio entre Outcome 3a y QuarterFocus 3m)
- **NUEVO:** `GoalTemplate` → Templates pre-construidos de objetivos

---

### 3.2 MÓDULO: TAREAS (AI-Powered Execution Engine)

#### 3.2.1 Requisitos Funcionales — Tareas

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| TSK-F01 | CRUD completo de tareas con: título, descripción, prioridad (low/medium/high), tags, fecha programada, estado (open/completed/archived) | P0 |
| TSK-F02 | Subtareas: cada tarea puede tener subtareas con checkbox independiente | P0 |
| TSK-F03 | Scheduling con hora de inicio y fin programada (scheduledStart, scheduledEnd) | P0 |
| TSK-F04 | Tracking de tiempo real: hora de inicio real y fin real (actualStart, actualEnd) para comparar estimado vs real | P0 |
| TSK-F05 | Recurring tasks: patrones de recurrencia flexibles (diario, semanal por día, mensual, custom) | P0 |
| TSK-F06 | Vinculación a objetivos: cada tarea puede asociarse a un objetivo de cualquier nivel de la jerarquía | P0 |
| TSK-F07 | Google Calendar sync bidireccional: tareas con horario se reflejan como eventos en Calendar y viceversa | P0 |
| TSK-F08 | **Smart Scheduling (IA):** Al crear una tarea con duración estimada, la IA analiza Google Calendar y sugiere los mejores slots disponibles considerando: bloques libres, horarios de trabajo del usuario (UserWorkPreferences), tipo de tarea, patrones de energía | P0 |
| TSK-F09 | **Timebox por tarea:** La IA sugiere duración estimada basada en tareas similares previas y complejidad. El usuario puede ajustar | P0 |
| TSK-F10 | **Insights IA por tarea:** Panel contextual que muestra: context brief ("para esta tarea necesitas: repo X, doc Y"), subtareas auto-generadas, post-completion insight (tiempo real vs estimado, impacto en objetivo padre) | P1 |
| TSK-F11 | Pomodoro integrado: iniciar sesión Pomodoro vinculada a la tarea activa | P0 |
| TSK-F12 | Vistas: Lista, Kanban, Calendar, Timeline | P0 |
| TSK-F13 | Filtros: por estado, prioridad, tag, objetivo vinculado, fecha | P0 |
| TSK-F14 | Auto-archive: tareas completadas hace más de N días se archivan automáticamente | P1 |
| TSK-F15 | Quick capture: crear tarea rápida desde overlay desktop, widget mobile, o shortcut global | P0 |
| TSK-F16 | Drag & drop para reordenar prioridad y mover entre estados (Kanban) | P0 |
| TSK-F17 | **Auto-reschedule (IA):** Si se cancela o modifica un evento en Calendar, la IA sugiere mover tareas afectadas a nuevos slots | P1 |
| TSK-F18 | Backlog: vista de tareas sin fecha asignada para planificación | P0 |
| TSK-F19 | La IA sugiere "siguiente tarea" al completar una, basada en prioridad, deadline y objetivo activo | P1 |
| TSK-F20 | Estadísticas: tareas completadas/día, tiempo promedio por tipo, adherencia a estimados | P1 |
| TSK-F21 | All-day tasks (tareas sin hora específica, solo fecha) | P0 |

#### 3.2.2 Modelos de Datos — Tareas

Reutilizar modelos existentes:

- `Task` → Modelo principal (ya existe con campos de scheduling, priority, recurring, calendar sync)
- `PomodoroSession` → Sesiones vinculadas a tarea (ya existe)
- `PomodoroDailyStat` → Stats diarios (ya existe)
- `TaskCalendarBinding` → Vínculo tarea ↔ evento Calendar (ya existe)
- `FocusTaskLink` → Vínculo tarea ↔ foco trimestral (ya existe)
- **EXTENDER:** `Task` con campo `aiTimebox` (duración sugerida por IA) y `aiInsight` (JSON con context brief)

---

### 3.3 MÓDULO: HÁBITOS (AI Behavioral Engine)

#### 3.3.1 Requisitos Funcionales — Hábitos

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| HAB-F01 | CRUD de hábitos con: nombre, frecuencia objetivo (veces/semana), días específicos, color, icono | P0 |
| HAB-F02 | Logging diario: marcar hábito como completado con conteo (ej: 3 vasos de agua de 8 objetivo) | P0 |
| HAB-F03 | Streak tracking: días consecutivos, streak más largo, streak actual | P0 |
| HAB-F04 | **Habit-Goal Linking:** Cada hábito se vincula a un objetivo. El progreso del hábito alimenta automáticamente el % del objetivo padre | P0 |
| HAB-F05 | **Smart Reminders (IA):** Los recordatorios consideran: densidad del calendario, streaks en riesgo, energía estimada del día. Ajusta el momento ideal | P0 |
| HAB-F06 | **Streak Protection (IA):** Antes de perder un streak, escalada: recordatorio suave → urgente → sugiere "versión mínima" (ej: "5min de lectura en vez de 30") | P1 |
| HAB-F07 | **Habit Stacking (IA):** Sugiere agrupar hábitos basándose en patrones: "Después de meditar (90% adherencia), agrega 10min de journaling" | P1 |
| HAB-F08 | **Habit Suggestions (IA):** Basado en los objetivos del usuario, sugiere hábitos específicos que contribuyen al logro | P1 |
| HAB-F09 | Analytics: correlaciones entre hábitos y productividad ("Los días que meditas, completas 40% más tareas"), trends semanales/mensuales | P1 |
| HAB-F10 | Active/Inactive toggle: pausar hábito sin perder historial | P0 |
| HAB-F11 | Frecuencia flexible: diario, X veces/semana, días específicos, X veces/mes | P0 |
| HAB-F12 | Visualización de progreso: calendario heat map (estilo GitHub contributions) | P1 |
| HAB-F13 | Categorías de hábitos alineadas con los 6 pilares de vida | P1 |
| HAB-F14 | Quick check-in desde: overlay desktop, widget mobile, notificación push interactiva | P0 |
| HAB-F15 | Estadísticas por hábito: adherencia %, mejor streak, promedio semanal, tendencia | P0 |

#### 3.3.2 Modelos de Datos — Hábitos

Reutilizar modelos existentes:

- `Habit` → Definición del hábito (ya existe)
- `HabitLog` → Registro diario de completitud (ya existe)
- `FocusHabitLink` → Vínculo hábito ↔ foco trimestral (ya existe)
- **EXTENDER:** `Habit` con `goalId` (vínculo directo a objetivo de cualquier nivel)
- **NUEVO:** `HabitInsight` → Insights IA generados periódicamente (correlaciones, sugerencias)

---

## 4. IA como Capa Transversal — Requisitos Funcionales

La IA no es un módulo, es una capa que permea los 3 módulos core y el sistema de notificaciones.

### 4.1 Manifestaciones de IA

| ID | Contexto | Acción de IA | Trigger | Prioridad |
|----|----------|-------------|---------|-----------|
| AI-F01 | Morning Briefing | Resumen personalizado: tareas del día, meetings, hábitos clave, progreso de objetivos activos | Auto: al abrir app o push 7am | P0 |
| AI-F02 | Crear objetivo | Sugiere sub-objetivos, tareas y hábitos coherentes con el objetivo creado | Al guardar nuevo objetivo | P1 |
| AI-F03 | Crear tarea | Sugiere timebox, mejor horario en calendar, subtareas automáticas | Al crear/editar tarea con duración | P0 |
| AI-F04 | Completar tarea | Muestra impacto en objetivo padre, sugiere siguiente tarea recomendada | Al marcar completada | P1 |
| AI-F05 | Quarterly Review | Genera reporte de progreso, identifica estancamientos, propone focos para próximo trimestre | Cron: día 1 de cada Q | P1 |
| AI-F06 | Streak en riesgo | Escalada: recordatorio suave → urgente → versión mínima del hábito | 2h antes de cierre del día | P0 |
| AI-F07 | Calendar change | Re-sugiere scheduling de tareas afectadas por cambios en calendario | Webhook Google Calendar | P1 |
| AI-F08 | Weekly Planning | Propone plan semanal basado en focos trimestrales + disponibilidad en calendar | Domingo 7pm o Lunes 7am | P1 |
| AI-F09 | Idle detection (desktop) | Sugiere focus task o break basado en contexto y tarea activa | 5min sin actividad detectada | P2 |
| AI-F10 | App detection (desktop) | Contextualiza: "Abriste VS Code, ¿continuar tarea: API Integration?" | Cambio de app detectado por Tauri | P2 |
| AI-F11 | Chat contextual | Asistente que conoce objetivos, tareas, hábitos. Responde: "¿Qué debo hacer ahora?", "Planifícame la semana", "¿Cómo voy con mis objetivos?" | Comando del usuario | P0 |
| AI-F12 | Task insight | Context brief por tarea: qué necesitas, subtareas sugeridas, tips | Al abrir detalle de tarea | P1 |
| AI-F13 | Habit correlation | Detecta patrones: "Los días que haces ejercicio, completas 2 tareas más" | Análisis periódico (semanal) | P2 |
| AI-F14 | Goal conflict detection | Alerta si el usuario tiene más objetivos de los que puede ejecutar dado su tiempo disponible | Al crear/editar objetivos | P1 |
| AI-F15 | Inactivity alert | Notifica si un objetivo no tiene actividad (tareas/hábitos) en 14 días | Cron: chequeo diario | P1 |

### 4.2 Stack de IA

- **Proveedor:** OpenAI vía Vercel AI SDK (ya configurado en monorepo)
- **Endpoints existentes:** `/api/chat` (streaming), `/api/chat/briefing`, `/api/chat/finance-insight`
- **Evolución:** Agregar tool-calling para que la IA pueda: crear tareas, programar en calendar, generar reportes, modificar hábitos
- **Contexto:** Cada llamada de IA incluye: objetivos activos del usuario, tareas pendientes, hábitos y streaks, eventos del calendar del día, preferencias de trabajo

---

## 5. Gamificación — Requisitos Funcionales

El sistema de gamificación existente (XP, achievements, challenges, streaks, ranks E→S) se extiende para vincularse con objetivos de vida.

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| GAM-F01 | XP ponderado por impacto: tarea vinculada a objetivo trimestral da 3x XP vs tarea huérfana | P0 |
| GAM-F02 | Achievement trees por objetivo: logros organizados por categoría de objetivo (ej: "Corredor: 10 sesiones Bronce → 50 Plata → 200 Oro") | P1 |
| GAM-F03 | Quarterly milestones: achievements especiales por alcanzar X% de focos trimestrales | P1 |
| GAM-F04 | Streak multiplier: x1.5 (7d), x2 (14d), x3 (30d), x5 (90d) de XP bonus | P0 |
| GAM-F05 | Anti-fatiga IA: detecta si el usuario solo hace tareas fáciles por XP y sugiere desafíos reales | P2 |
| GAM-F06 | Daily challenges personalizados por IA basados en objetivos activos y hábitos del usuario | P1 |
| GAM-F07 | Celebración visual: confetti + detalle del logro al desbloquear achievement (ya existe CelebrationOverlay) | P0 |
| GAM-F08 | Rank progression visual: E → D → C → B → A → S con badges y títulos | P0 |
| GAM-F09 | Level-up notifications en todas las plataformas (web, mobile push, desktop toast) | P0 |
| GAM-F10 | Social layer (fase 2): retos compartidos, accountability partners, leaderboards opt-in | P2 |
| GAM-F11 | Weekly XP summary con breakdown por fuente (tasks, habits, challenges, streaks) | P1 |

### 5.1 Modelos de Datos — Gamificación

Todo existe en el schema actual:

- `GamificationProfile` → totalXp, level, rank, streaks
- `XpEvent` → Eventos individuales de XP (source: task|habit|pomodoro|challenge|streak_bonus|achievement)
- `DailyXpSnapshot` → Agregación diaria
- `Achievement` / `UserAchievement` → Logros
- `DailyChallenge` → Retos diarios
- **EXTENDER:** `XpEvent` con campo `multiplier` para streak bonus
- **EXTENDER:** `Achievement` con campo `goalCategory` para vincular a pilares de vida

---

## 6. Notificaciones Inteligentes — Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| NOT-F01 | Morning Briefing push a la hora configurada por el usuario (default 7am timezone local) | P0 |
| NOT-F02 | Smart Task Reminder: 30min antes (configurable) con contexto IA ("Tienes X en 30min. Prep: abrir repo Y") | P0 |
| NOT-F03 | Streak Alert escalado: recordatorio suave → urgente → versión mínima | P0 |
| NOT-F04 | Calendar Change: notificación inmediata si se cancela/modifica evento con tarea vinculada | P1 |
| NOT-F05 | Weekly Review: push domingo 7pm invitando a revisar la semana | P1 |
| NOT-F06 | Quarterly Nudge: email + push día 1 del trimestre con propuesta de focos | P1 |
| NOT-F07 | Achievement unlock: in-app celebration + push + desktop toast | P0 |
| NOT-F08 | Idle Suggestion (desktop): overlay sugiere tarea o break tras 5min inactivo | P2 |
| NOT-F09 | Anti-fatigue: máximo 5 notificaciones/día (configurable), priorización por deadline e impacto | P0 |
| NOT-F10 | Batching inteligente: agrupa múltiples recordatorios de hábitos en 1 notificación | P1 |
| NOT-F11 | Respeta Do Not Disturb / Focus Mode del OS | P0 |
| NOT-F12 | El usuario puede configurar por tipo: habilitar/deshabilitar, horario, canal preferido | P0 |

### 6.1 Canales de Notificación

| Canal | Plataforma | Tecnología |
|-------|-----------|-----------|
| Push móvil | iOS / Android | Firebase FCM (ya configurado) |
| Push web | Navegadores | Web Push VAPID (ya configurado) |
| Desktop toast | Windows / macOS / Linux | Tauri native notifications |
| In-app toast | Todas | Sonner (ya configurado) |
| Overlay | Desktop | Tauri overlay window |
| Email | Todas | SMTP Zeptomail (ya configurado) |

---

## 7. Plataforma Desktop (Tauri) — Requisitos Funcionales

### 7.1 Main Window

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| DSK-F01 | Shell Tauri que renderiza la web app existente (React + Vite) | P0 |
| DSK-F02 | Login persistente: token almacenado de forma segura (Tauri secure storage) | P0 |
| DSK-F03 | Offline cache: SQLite local para tareas, hábitos y objetivos activos | P1 |
| DSK-F04 | Auto-updates: descarga e instala actualizaciones silenciosamente | P1 |
| DSK-F05 | Deep links: protocolo `theprimeway://` para abrir secciones específicas (ya configurado) | P1 |
| DSK-F06 | Window state persistence: recuerda posición, tamaño y estado de ventana | P0 |
| DSK-F07 | Autostart opcional: la app puede iniciarse con el sistema | P1 |
| DSK-F08 | Drag & drop nativo para archivos (adjuntar a tareas/notas) | P2 |

### 7.2 System Tray

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| DSK-F09 | Close → minimize to tray (NO cierra la app). Comportamiento tipo Discord | P0 |
| DSK-F10 | Tray icon dinámico: indica si hay timer activo, tareas pendientes, o estado normal | P0 |
| DSK-F11 | Menú contextual del tray: Start/Stop Timer, Ver Tareas, Abrir Overlay, Abrir Dashboard, Salir completamente | P0 |
| DSK-F12 | La app sigue corriendo en tray: timers activos, WebSocket conectado, overlay disponible | P0 |
| DSK-F13 | Re-abrir ventana principal desde tray con click o shortcut | P0 |

### 7.3 Overlay Inteligente

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| DSK-F14 | Ventana flotante always-on-top, transparente, esquina inferior derecha | P0 |
| DSK-F15 | **Estado colapsado:** Tarea activa + tiempo corriendo + % progreso + indicador focus mode | P0 |
| DSK-F16 | **Estado expandido (hover):** Lista de tareas pendientes, checklist interactivo, timer, botones rápidos: completar, posponer, pausar, agregar nota, siguiente tarea | P0 |
| DSK-F17 | Draggable: el usuario puede mover el overlay a cualquier posición de pantalla | P0 |
| DSK-F18 | Opacity configurable: de 30% a 100% | P1 |
| DSK-F19 | Interacciones: hover (expand), click (action), drag (move), shortcut (toggle) | P0 |
| DSK-F20 | Quick task creation desde overlay | P0 |
| DSK-F21 | Quick habit check-in desde overlay | P1 |
| DSK-F22 | Posición del overlay persistida entre sesiones | P0 |

### 7.4 Global Shortcuts

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| DSK-F23 | `Ctrl+Shift+O` → Toggle overlay (mostrar/ocultar) | P0 |
| DSK-F24 | `Ctrl+Shift+T` → Iniciar/reanudar timer Pomodoro | P0 |
| DSK-F25 | `Ctrl+Shift+P` → Pausar timer | P0 |
| DSK-F26 | `Ctrl+Shift+N` → Nueva tarea (quick capture) | P0 |
| DSK-F27 | `Ctrl+Shift+D` → Completar tarea activa | P0 |
| DSK-F28 | `Ctrl+Shift+M` → Mostrar/restaurar dashboard principal | P0 |
| DSK-F29 | Shortcuts customizables por el usuario | P1 |
| DSK-F30 | Shortcuts persistidos en configuración local | P0 |

### 7.5 Smart Productivity Layer (Desktop)

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| DSK-F31 | Detectar app activa del usuario (ej: VS Code, Figma, Chrome) | P2 |
| DSK-F32 | Sugerir tarea relevante basada en app activa ("Abriste VS Code, ¿continuar Integración API Tauri?") | P2 |
| DSK-F33 | Detectar idle time (5min sin actividad) y sugerir focus task o break | P2 |
| DSK-F34 | Auto-start timer al detectar actividad en app vinculada a tarea | P2 |

### 7.6 Sincronización Desktop ↔ Web ↔ Mobile

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| DSK-F35 | WebSocket para sincronización en tiempo real de: timers, tareas, estados | P0 |
| DSK-F36 | REST fallback cuando WebSocket no está disponible | P0 |
| DSK-F37 | SQLite local como cache para modo offline | P1 |
| DSK-F38 | Optimistic updates: cambios locales se aplican inmediatamente y se confirman con el servidor | P0 |
| DSK-F39 | Conflict resolution: last-write-wins con timestamp + notificación al usuario en caso de conflicto | P1 |

---

## 8. Plataforma Mobile — Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| MOB-F01 | Widget nativo (iOS WidgetKit + Android Widgets): tareas del día, streak counter, próximo hábito | P0 |
| MOB-F02 | Quick habit check-in desde widget sin abrir la app | P0 |
| MOB-F03 | Morning Briefing push interactivo con resumen del día | P0 |
| MOB-F04 | Swipe-to-complete: gesto rápido para completar tareas desde la lista | P0 |
| MOB-F05 | Focus Timer con integración Do Not Disturb del OS | P1 |
| MOB-F06 | Offline-first: SQLite local con sync al reconectar | P1 |
| MOB-F07 | Weekly Review UI optimizada para pantalla pequeña | P1 |
| MOB-F08 | Bottom tab navigation: Dashboard, Tareas, Hábitos, Objetivos, IA | P0 |
| MOB-F09 | Push notifications nativas vía Firebase FCM | P0 |
| MOB-F10 | Google Calendar sync desde mobile | P1 |
| MOB-F11 | Biometric auth (FaceID/TouchID) para acceso rápido | P1 |
| MOB-F12 | Deep linking para abrir secciones específicas desde notificaciones | P1 |

---

## 9. Plataforma Web — Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| WEB-F01 | Experiencia completa de planificación estratégica (crear/editar jerarquía de objetivos, quarterly review) | P0 |
| WEB-F02 | Dashboard unificado: progreso de objetivos, tareas del día, hábitos, próximos eventos calendar | P0 |
| WEB-F03 | Vistas de tareas: Lista, Kanban, Calendar, Timeline | P0 |
| WEB-F04 | AI Chat contextual accesible desde cualquier sección | P0 |
| WEB-F05 | Configuración completa: perfil, preferencias de trabajo, notificaciones, IA, suscripción | P0 |
| WEB-F06 | Navegación simplificada a 3 módulos core + dashboard + settings (remover módulos archivados) | P0 |
| WEB-F07 | Responsive: funcional en tablet y mobile browser como fallback | P1 |
| WEB-F08 | Pomodoro timer visible mientras se navega por la app | P0 |

---

## 10. Google Calendar Integration — Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| CAL-F01 | OAuth con Google Calendar (ya implementado, scopes calendar.events) | P0 |
| CAL-F02 | Sync bidireccional: tareas con horario → eventos Calendar, eventos Calendar → visibles en ThePrimeWay | P0 |
| CAL-F03 | **Smart Slot Finding (IA):** Dado una tarea con duración estimada, encontrar el mejor bloque libre considerando: horario de trabajo del usuario, tipo de tarea (deep work = bloque largo, admin = hueco corto), reuniones adyacentes, patrones de energía | P0 |
| CAL-F04 | Time-blocking: la IA puede crear bloques de tiempo en Calendar para tareas y hábitos | P1 |
| CAL-F05 | Free time analysis: mostrar disponibilidad real del usuario descontando meetings y hábitos | P1 |
| CAL-F06 | Auto-reschedule: si se cancela/modifica un evento, sugerir mover tareas afectadas | P1 |
| CAL-F07 | Multi-calendar support: el usuario puede seleccionar qué calendarios sincronizar | P0 |
| CAL-F08 | Habit scheduling: bloquear tiempo en Calendar para hábitos recurrentes (ej: "Deep Work 10-11am") | P2 |
| CAL-F09 | Considerar densidad de calendario para smart reminders (no recordar hábito si tiene 3 reuniones seguidas) | P1 |

---

## 11. Módulos a Archivar

Los siguientes módulos se remueven de la navegación principal. El código y los datos se mantienen; los endpoints API siguen activos pero no se exponen en la UI principal.

| Módulo | Razón | Plan Futuro |
|--------|-------|-------------|
| Finanzas (8 sub-módulos) | Producto en sí mismo. Distrae del core. | V2: Reintroducir como "Financial Goals" vinculado a objetivos |
| Notes | Duplica Notion/Obsidian. No diferencia. | Merge: Notas inline dentro de tareas y objetivos |
| Reading/Books | Nicho. No contribuye a retención diaria. | V2: "Learning Goals" con tracking de libros/cursos |
| Health Metrics | Scaffold incompleto. | V2: Integrar con wearables como fuente de datos para hábitos |
| KYC | No es core del producto. | Mantener solo si regulación lo requiere |
| Docs | Scaffold sin implementar. | Eliminar |

**Lo que se MANTIENE como infraestructura transversal:** Auth, Subscriptions, Notifications, Calendar Sync, Gamification, AI, Pomodoro (dentro de Tareas), Feature Flags, Admin.

---

## 12. Requisitos No Funcionales

### 12.1 Performance

| ID | Requisito | Valor Objetivo |
|----|-----------|---------------|
| NFR-P01 | Tiempo de inicio de app desktop (Tauri) | < 2 segundos |
| NFR-P02 | Respuesta del overlay al hover | < 100ms |
| NFR-P03 | Sincronización de timer entre plataformas | < 200ms |
| NFR-P04 | Consumo de memoria del proceso tray | < 150MB |
| NFR-P05 | Time to interactive (web) en primera carga | < 3 segundos |
| NFR-P06 | Respuesta de API (p95) | < 300ms |
| NFR-P07 | Respuesta de IA (time to first token) | < 1 segundo |
| NFR-P08 | Sync offline → online (reconciliación) | < 5 segundos |
| NFR-P09 | Consumo de CPU del overlay cuando idle | < 1% |
| NFR-P10 | Tamaño de bundle web (gzipped) | < 500KB initial |

### 12.2 Seguridad

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| NFR-S01 | Tokens JWT almacenados en secure storage (Tauri Keychain / Expo SecureStore) | P0 |
| NFR-S02 | Cache local SQLite encriptado | P1 |
| NFR-S03 | HTTPS obligatorio en todas las conexiones | P0 |
| NFR-S04 | Reconexión segura de WebSocket con re-autenticación | P0 |
| NFR-S05 | OAuth tokens (Google Calendar) encriptados en DB | P0 |
| NFR-S06 | Rate limiting en endpoints API (ya en Hono middleware) | P0 |
| NFR-S07 | CORS configurado solo para dominios autorizados (ya implementado) | P0 |
| NFR-S08 | Passwords hasheados con bcrypt (ya implementado) | P0 |
| NFR-S09 | Revoked token blacklist (ya existe modelo RevokedToken) | P0 |
| NFR-S10 | Cascade delete de todos los datos al eliminar usuario (ya configurado en Prisma) | P0 |

### 12.3 Disponibilidad y Confiabilidad

| ID | Requisito | Valor Objetivo |
|----|-----------|---------------|
| NFR-A01 | Uptime de API | 99.9% |
| NFR-A02 | Recovery time de caída | < 5 minutos |
| NFR-A03 | Backups de base de datos | Diarios automáticos (Neon) |
| NFR-A04 | Graceful degradation sin conexión | App funcional con cache local |
| NFR-A05 | WebSocket reconnect automático con backoff exponencial | Sí |

### 12.4 Escalabilidad

| ID | Requisito | Valor Objetivo |
|----|-----------|---------------|
| NFR-E01 | Usuarios concurrentes soportados | 10,000+ |
| NFR-E02 | Latencia con 10K usuarios | Misma que con 100 |
| NFR-E03 | Database connection pooling | Neon serverless (auto-scaling) |
| NFR-E04 | API stateless | Sí (JWT, sin sessions server-side) |

### 12.5 Usabilidad

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| NFR-U01 | Onboarding guiado: el usuario configura visión y primer objetivo en < 5 minutos | P0 |
| NFR-U02 | El overlay no interrumpe el workflow del usuario | P0 |
| NFR-U03 | Restore instantáneo de ventana desde tray (< 200ms) | P0 |
| NFR-U04 | Native feel: animaciones suaves, respuesta táctil en mobile | P0 |
| NFR-U05 | Dark theme por defecto, light theme disponible | P0 |
| NFR-U06 | Soporte i18n: inglés y español (ya implementado) | P0 |
| NFR-U07 | Accesibilidad: WCAG 2.1 AA para contraste y navegación por teclado | P1 |

### 12.6 Mantenibilidad

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| NFR-M01 | Monorepo con packages compartidos (ya implementado) | P0 |
| NFR-M02 | Feature-Sliced Design en frontend (ya implementado en PWA, migrar patrón) | P0 |
| NFR-M03 | Validación compartida (Zod en @repo/shared) entre API y clientes | P0 |
| NFR-M04 | OpenAPI auto-generado para documentación de endpoints | P0 |
| NFR-M05 | Cobertura de tests unitarios > 70% para servicios core | P1 |
| NFR-M06 | CI/CD con Turborepo caching | P0 |
| NFR-M07 | Biome linting uniforme en todo el monorepo | P0 |

---

## 13. Sistema de Suscripción

### 13.1 Planes y Límites

| Feature | Free | Trial (14d) | Premium |
|---------|------|-------------|---------|
| Objetivos (niveles) | Visión + 1 pilar + 1 trimestral | Todos | Todos |
| Tareas | 5 activas | Ilimitadas | Ilimitadas |
| Hábitos | 3 activos | Ilimitados | Ilimitados |
| Smart Scheduling IA | 1/día | Ilimitado | Ilimitado |
| AI Chat | 5 mensajes/día | Ilimitado | Ilimitado |
| Morning Briefing IA | No | Sí | Sí |
| Quarterly Review IA | No | Sí | Sí |
| Desktop overlay | No | Sí | Sí |
| Global shortcuts | Básicos (3) | Todos | Todos + custom |
| Widgets mobile | Básico (1) | Todos | Todos |
| Gamificación | XP + streaks | Todo | Todo + social |
| Google Calendar sync | 1 calendario | Multi-calendar | Multi-calendar |
| Notificaciones inteligentes | Básicas | Todas | Todas + batching IA |
| Themes | Dark only | Dark + Light | Dark + Light + custom |

### 13.2 Infraestructura de Pagos

- **Proveedor:** Lemon Squeezy (ya integrado)
- **Modelos:** `SubscriptionPlan`, `UserSubscription`, `UserUsageStat` (ya existen)
- **Feature gating:** Sistema de 3 capas: Plan defaults → Version gates → User overrides (ya implementado)
- **Admin:** Dashboard con override manual de features por usuario (ya implementado)

---

## 14. API Endpoints — Resumen

### 14.1 Endpoints Existentes (monorepo)

| Grupo | Ruta Base | Endpoints | Estado |
|-------|-----------|-----------|--------|
| Health | `/api/health` | 1 | ✅ Implementado |
| Auth | `/api/auth` | 4 (login, register, refresh, OAuth) | ✅ Implementado |
| User | `/api/user` | Profile, settings, preferences, subscription | ✅ Implementado |
| Tasks | `/api/tasks` | CRUD + scheduling + stats | ✅ Implementado |
| Habits | `/api/habits` | CRUD + logs + completions + stats | ✅ Implementado |
| Goals | `/api/goals` | Visions, pillars, OKRs, quarterly, weekly | ✅ Implementado |
| Finances | `/api/finances` | Accounts, transactions, budgets, debts, investments | ✅ Implementado |
| Pomodoro | `/api/pomodoro` | Sessions + daily stats | ✅ Implementado |
| Calendar | `/api/calendar` | Events + scheduling | ✅ Parcial |
| Chat/AI | `/api/chat` | Streaming, briefing, insights | ✅ Implementado |
| Gamification | `/api/gamification` | Profile, XP, achievements, challenges | ✅ Implementado |
| Reading | `/api/reading` | Books, goals | ✅ Implementado |
| Subscriptions | `/api/subscriptions` | Plans, checkout, webhook | ✅ Implementado |
| Notifications | `/api/notifications` | Register, preferences, send | ✅ Implementado |
| Cron | `/api/cron` | Scheduled jobs | ✅ Parcial |
| Dashboard | `/api/dashboard` | Aggregated insights | ✅ Parcial |
| Features | `/api/features` | Feature flag resolution | ✅ Implementado |
| Admin | `/api/admin` | User management, feature overrides | ✅ Implementado |

### 14.2 Endpoints Nuevos Requeridos

| Grupo | Endpoint | Descripción | Prioridad |
|-------|----------|-------------|-----------|
| Goals | `POST /api/goals/annual` | CRUD de objetivos anuales (nuevo nivel) | P0 |
| Goals | `GET /api/goals/tree` | Árbol completo de objetivos con progreso calculado | P0 |
| Goals | `POST /api/goals/ai/suggest` | IA sugiere sub-objetivos para un objetivo dado | P1 |
| Goals | `GET /api/goals/ai/quarterly-review` | IA genera quarterly review | P1 |
| Tasks | `POST /api/tasks/ai/schedule` | IA encuentra mejor slot en calendar para una tarea | P0 |
| Tasks | `POST /api/tasks/ai/timebox` | IA sugiere duración para una tarea | P0 |
| Tasks | `GET /api/tasks/ai/insight/:id` | IA genera context brief para una tarea | P1 |
| Tasks | `GET /api/tasks/ai/next` | IA recomienda siguiente tarea | P1 |
| Habits | `GET /api/habits/ai/suggestions` | IA sugiere hábitos basados en objetivos | P1 |
| Habits | `GET /api/habits/ai/stacking` | IA sugiere habit stacking basado en patrones | P1 |
| Habits | `GET /api/habits/ai/correlations` | IA analiza correlaciones hábitos ↔ productividad | P2 |
| AI | `POST /api/chat/weekly-plan` | IA genera plan semanal | P1 |
| AI | `POST /api/chat/tools` | Chat con tool-calling (crear tarea, programar, etc.) | P1 |
| Calendar | `GET /api/calendar/free-slots` | Devuelve bloques libres del usuario | P0 |
| Calendar | `POST /api/calendar/time-block` | Crear bloque de tiempo para tarea/hábito | P1 |
| Sync | `WS /api/sync` | WebSocket para sync en tiempo real | P0 |

---

## 15. Roadmap de Implementación

### Fase 1: Core Simplification (Semanas 1-4)

**Objetivo:** Reestructurar el producto en 3 módulos core con jerarquía de objetivos completa.

- [ ] Reestructurar navegación web a: Dashboard, Objetivos, Tareas, Hábitos, Settings
- [ ] Archivar módulos secundarios de la UI (finanzas, notes, reading quedan accesibles vía API)
- [ ] Crear modelo `AnnualGoal` y endpoint CRUD
- [ ] Implementar endpoint `GET /api/goals/tree` con cálculo de progreso en cascada
- [ ] Vincular hábitos directamente a objetivos (campo `goalId` en Habit)
- [ ] Implementar vista de árbol interactiva de objetivos (web)
- [ ] Implementar indicador de salud por objetivo (verde/amarillo/rojo)
- [ ] Nuevo onboarding: crear visión + primer objetivo + primer hábito

### Fase 2: AI Integration (Semanas 5-8)

**Objetivo:** La IA permea los 3 módulos core como capa inteligente.

- [ ] Implementar `POST /api/tasks/ai/schedule` — Smart Scheduling con Calendar
- [ ] Implementar `GET /api/calendar/free-slots` — Análisis de disponibilidad
- [ ] Implementar timebox IA por tarea
- [ ] Implementar task insights IA (context brief, subtareas auto-generadas)
- [ ] Evolucionar Morning Briefing con objetivos + tareas + hábitos + calendar
- [ ] Implementar Weekly Planning IA
- [ ] Implementar sugerencias IA al crear objetivo (sub-objetivos, tareas, hábitos)
- [ ] Implementar Quarterly Review auto-generado
- [ ] Agregar tool-calling al chat para crear tareas y programar en calendar

### Fase 3: Desktop Client (Semanas 9-12)

**Objetivo:** Cliente desktop nativo con presencia persistente tipo Discord.

- [ ] Completar Tauri shell con web app embebida
- [ ] Auth persistente con secure storage
- [ ] System tray: close → minimize, icono dinámico, menú contextual
- [ ] Overlay: vista colapsada (tarea + timer + %) y expandida (checklist + acciones)
- [ ] Global shortcuts (6 defaults + customizables)
- [ ] WebSocket sync en tiempo real
- [ ] SQLite cache local
- [ ] Autostart opcional

### Fase 4: Mobile Excellence (Semanas 13-15)

**Objetivo:** Mobile como plataforma de ejecución diaria con widgets nativos.

- [ ] Widgets nativos iOS (WidgetKit) + Android: tareas del día, streak counter
- [ ] Quick habit check-in desde widget
- [ ] Swipe-to-complete en lista de tareas
- [ ] Focus Timer con DND integration
- [ ] Offline-first con SQLite local
- [ ] Weekly Review UI optimizada

### Fase 5: Gamification Evolution (Semanas 16-17)

**Objetivo:** Gamificación vinculada a objetivos de vida.

- [ ] XP ponderado por impacto en objetivo
- [ ] Achievement trees por categoría de objetivo
- [ ] Streak multipliers (7d/14d/30d/90d)
- [ ] Daily challenges personalizados por IA
- [ ] Quarterly milestone achievements

### Fase 6: Polish & Launch (Semanas 18-19)

**Objetivo:** Performance, testing y lanzamiento.

- [ ] Performance optimization (targets del NFR-P)
- [ ] Beta testing con 50 usuarios
- [ ] Bug fixes y edge cases
- [ ] Marketing assets y landing page
- [ ] Launch

---

## 16. KPIs de Éxito

| Métrica | Actual (estimado) | Meta 3 meses | Meta 6 meses |
|---------|-------------------|-------------|-------------|
| DAU | Baseline | +50% | +150% |
| Tasks completed/day/user | ~3 | 5 | 8 |
| Avg focus session | ~20min | 30min | 45min |
| Habit streak promedio | ~5 días | 12 días | 21 días |
| Desktop overlay interactions/day | 0 | 5 | 15 |
| Shortcut usage/day | 0 | 3 | 10 |
| Weekly review completion | ~10% | 40% | 65% |
| App reopen frequency/day | 1 | 3 | 5+ |
| 7-day retention | Baseline | +30% | +60% |
| Quarterly goal completion rate | N/A | 40% | 60% |
| AI scheduling acceptance rate | N/A | 60% | 80% |
| NPS | Baseline | 40+ | 60+ |

---

## 17. Foso Competitivo

1. **Data flywheel de IA:** Cuanto más usa el usuario, mejor lo conoce la IA. Scheduling más preciso, sugerencias más relevantes, insights más profundos.
2. **Habit lock-in:** Los streaks crean switching cost emocional. Nadie quiere perder un streak de 90 días.
3. **Vision ecosystem:** Una vez mapeada la visión 10a→3a→1a→3m, la estructura es demasiado valiosa para abandonar.
4. **Desktop presence:** Tray + overlay + shortcuts crean hábito de uso. La app "vive" con el usuario como Discord/Slack.

---

## Apéndice A: Posicionamiento vs Competencia

| Competidor | Argumento ThePrimeWay |
|-----------|----------------------|
| Notion | "No necesitas construir tu sistema. ThePrimeWay ya tiene la estructura, la IA la personaliza para ti." |
| Habitica | "Gamificación con propósito. Cada XP que ganas contribuye a tus objetivos reales de vida." |
| MyGoodWeek | "Más que planificar: ejecutar. IA que agenda, recuerda y adapta tu día." |
| Blitzit | "Focus con dirección. No solo ejecutas rápido: sabes por qué cada tarea importa." |

## Apéndice B: Módulos Archivados — API Backward Compatibility

Los endpoints de módulos archivados (finanzas, notes, reading) siguen disponibles en la API para:

- Usuarios existentes que tienen datos en estos módulos
- Posible reintroducción futura como features premium
- Mobile/web pueden acceder vía deep link directo si el usuario los necesita

La navegación principal no los muestra, pero un enlace "Más herramientas" en settings permite acceder a ellos.

## Apéndice C: Modelos de Datos Nuevos

```prisma
model AnnualGoal {
  id          String   @id @default(uuid())
  userId      String
  outcomeId   String   // Vínculo a PrimeOutcome (3 años)
  title       String
  description String?
  year        Int
  progress    Float    @default(0)  // 0-100, calculado automáticamente
  status      String   @default("active") // active, completed, paused
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user    User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  outcome PrimeOutcome @relation(fields: [outcomeId], references: [id], onDelete: Cascade)
  quarterFocuses PrimeQuarterFocus[]

  @@index([userId])
  @@index([outcomeId])
}

model GoalTemplate {
  id          String   @id @default(uuid())
  category    String   // fitness, career, finance, learning, relationships, side_project
  title       String
  description String?
  structure   Json     // JSON con jerarquía pre-construida
  locale      String   @default("en")
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@index([category])
}

model HabitInsight {
  id        String   @id @default(uuid())
  userId    String
  habitId   String
  type      String   // correlation, suggestion, pattern
  content   Json     // Insight generado por IA
  createdAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  habit Habit @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([habitId])
}
```

### Extensiones a Modelos Existentes

```prisma
// Agregar a Habit
model Habit {
  // ... campos existentes ...
  goalId String? // Vínculo directo a objetivo de cualquier nivel
}

// Agregar a Task
model Task {
  // ... campos existentes ...
  aiTimebox    Int?   // Duración sugerida por IA en minutos
  aiInsightJson Json? // Context brief generado por IA
}

// Agregar a XpEvent
model XpEvent {
  // ... campos existentes ...
  multiplier Float @default(1.0) // Streak multiplier
}

// Agregar a Achievement
model Achievement {
  // ... campos existentes ...
  goalCategory String? // Vincular a pilar de vida
}
```
