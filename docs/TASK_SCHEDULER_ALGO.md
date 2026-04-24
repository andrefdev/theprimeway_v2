# Motor de Scheduling Inteligente — theprimeway

> **Propósito de este documento:** Especificación técnica completa para implementar un motor de planificación y reagendado de tareas tipo Sunsama (con extensiones que van más allá), pensada para ser leída por un agente de IA (Claude Code, Cursor, etc.) que asistirá al desarrollo.
>
> **Stack del proyecto:** Backend con **Hono + Prisma + PostgreSQL**. Frontend con **React + Vite**.
>
> **Nivel de ambición:** MVP completo + features avanzadas (Niveles 0–5, donde el Nivel 5 incluye comportamientos que Sunsama no tiene, como el detector de timer tardío).

---

## Tabla de contenidos

1. [Filosofía del sistema](#1-filosofía-del-sistema)
2. [Glosario y conceptos clave](#2-glosario-y-conceptos-clave)
3. [Modelo de datos (Prisma schema conceptual)](#3-modelo-de-datos-prisma-schema-conceptual)
4. [Algoritmo: Auto-Scheduling (encontrar hueco)](#4-algoritmo-auto-scheduling)
5. [Algoritmo: Splitting alrededor de eventos](#5-algoritmo-splitting-alrededor-de-eventos)
6. [Algoritmo: Auto-Rescheduling por conflicto](#6-algoritmo-auto-rescheduling-por-conflicto)
7. [Algoritmo: Auto-Rescheduling por completion temprano](#7-algoritmo-auto-rescheduling-por-completion-temprano)
8. [Algoritmo: Detector de timer tardío (extensión propia)](#8-algoritmo-detector-de-timer-tardío)
9. [Sistema de Channels y Contexts](#9-sistema-de-channels-y-contexts)
10. [Backlog y rollover](#10-backlog-y-rollover)
11. [Weekly Objectives y alineación de tareas](#11-weekly-objectives)
12. [ML ligero: estimador de tiempo y sugeridor de canal](#12-ml-ligero)
13. [Workload threshold y warnings](#13-workload-threshold)
14. [Sincronización con calendario externo](#14-sincronización-con-calendario-externo)
15. [Sistema de Undo (Command Pattern)](#15-sistema-de-undo)
16. [Hoja de ruta por sprints](#16-hoja-de-ruta-por-sprints)
17. [Edge cases y gotchas](#17-edge-cases-y-gotchas)

---

## 1. Filosofía del sistema

Antes de tocar código, las IAs y desarrolladores que lean esto deben internalizar tres principios que gobiernan TODAS las decisiones del motor:

### 1.1. El usuario tiene control, el sistema asiste

Sunsama hace una elección filosófica deliberada: no decide solo cuando hay ambigüedad. Cuando una tarea no cabe, **pregunta**. Cuando hay conflicto al mover, **resuelve solo el conflicto inmediato** sin tocar el resto. Esto es lo opuesto a Motion, que re-optimiza agresivamente. theprimeway sigue la filosofía Sunsama: el algoritmo es **reactivo y conservador**, no proactivo.

**Regla de oro:** si el algoritmo no está 100% seguro de qué hacer, no actúa o pregunta. Nunca hace cambios masivos no solicitados.

### 1.2. Separación estricta entre "qué" y "cuándo"

Una **Task** es el "qué" (título, notas, duración estimada, canal, objetivo). Una **WorkingSession** es el "cuándo" (slot de calendario con start/end). Esta separación es la columna vertebral de todo. Una tarea puede tener 0, 1 o N working sessions. Sin esta separación, el sistema se vuelve un infierno de edge cases.

### 1.3. El calendario externo es inmutable

Los `CalendarEvent` (reuniones de Google Calendar/Outlook) son **hard constraints**. El motor JAMÁS los mueve, modifica o borra. Solo los lee como restricciones inamovibles. Solo modifica las `WorkingSession` que él mismo creó.

---

## 2. Glosario y conceptos clave

| Término | Definición |
|---|---|
| **Task** | Unidad de trabajo. Tiene título, `plannedTime` (estimación), `actualTime` (tracked), canal, etc. NO tiene hora fija. |
| **WorkingSession** | Bloque de calendario que apunta a una Task. Tiene `start`, `end`, `day`. Una task puede tener varias. |
| **CalendarEvent** | Evento externo (reunión). INMUTABLE para el motor. Solo se lee como constraint. |
| **Channel** | Categoría/proyecto. Tiene color, integración con calendario, working hours opcionales. |
| **Context** | Agrupación de channels. Tiene flag `isPersonal` que decide si cuenta para workload. |
| **Objective** | Meta semanal. Las tasks se "alinean" a un objective. |
| **Backlog** | Estado de una task donde `day = null`. Limbo voluntario. |
| **Working Hours** | Ventana horaria configurable (por usuario o por channel) donde el motor puede agendar. |
| **Workload Threshold** | Capacidad diaria en horas. Excederla genera warning visual, no error. |
| **Auto-Scheduling Gap** | Buffer en minutos entre eventos del calendario y working sessions auto-agendadas. |
| **Contiguity Threshold** | Distancia máxima entre dos sessions para considerarlas "pegadas" en el auto-reschedule. |
| **Planned Time** | Estimación del usuario (o ML) de cuánto tomará la task. Suma al workload. |
| **Actual Time** | Tiempo real consumido (vía timer o manual). No suma al workload. |

---

## 3. Modelo de datos (Prisma schema conceptual)

Este es el modelo que sostiene todo. NO inventes campos fuera de esto sin justificación.

```prisma
// ============================================================
// USUARIO Y CONFIGURACIÓN
// ============================================================

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  timezone      String   @default("America/Lima")  // crítico para TODOS los cálculos de día/hora
  createdAt     DateTime @default(now())

  settings      UserSettings?
  workingHours  WorkingHours[]    // schedule por defecto (puede haber overrides por channel)
  contexts      Context[]
  channels      Channel[]
  tasks         Task[]
  objectives    Objective[]
  calendarAccounts CalendarAccount[]
}

model UserSettings {
  id     String @id @default(cuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])

  // GENERAL
  startOfWeek           StartOfWeek @default(MONDAY)
  timeFormat            TimeFormat  @default(H24)
  taskRolloverPosition  Position    @default(TOP)  // a dónde van las tasks que rolean
  countPlannedAsActual  Boolean     @default(false)

  // WORKLOAD
  workloadThresholdMinutes Int @default(420)  // 7h por defecto
  customDayThresholds      Json?  // { monday: 480, tuesday: 360, ... } opcional

  // TIMEBOXING
  autoSchedulingGapMinutes Int     @default(5)
  defaultTaskDurationMinutes Int   @default(30)
  autoRescheduleOnConflict  Boolean @default(true)
  autoRescheduleOnEarlyCompletion Boolean @default(true)
  contiguityThresholdMinutes Int   @default(10)  // edge: distancia "pegado"

  // EXTENSIÓN: detector de timer tardío
  detectLateTimerStart   Boolean @default(true)
  lateTimerThresholdMinutes Int  @default(15)  // si arrancas N min después del slot, mueve

  // RITUALS (cron-driven)
  planDayAtTime          String? @default("08:00")  // HH:mm
  endDayAtTime           String? @default("18:00")
  autoRolloverEnabled    Boolean @default(true)

  // AI
  channelRecommendationsEnabled Boolean @default(true)
  plannedTimeRecommendationsEnabled Boolean @default(true)
}

enum StartOfWeek { SUNDAY MONDAY }
enum TimeFormat { H12 H24 }
enum Position { TOP BOTTOM }

// ============================================================
// HORARIOS DE TRABAJO (per-user default + per-channel override)
// ============================================================

model WorkingHours {
  id        String  @id @default(cuid())
  userId    String
  user      User    @relation(fields: [userId], references: [id])
  channelId String? // null = horario default del usuario; con valor = override de canal
  channel   Channel? @relation(fields: [channelId], references: [id])

  dayOfWeek Int     // 0=Sunday, 1=Monday, ... 6=Saturday
  startTime String  // "09:00"
  endTime   String  // "17:00"
  // Si un día no tiene fila, NO es día laboral para ese scope.
}

// ============================================================
// ORGANIZACIÓN: CONTEXTS Y CHANNELS
// ============================================================

model Context {
  id         String  @id @default(cuid())
  userId     String
  user       User    @relation(fields: [userId], references: [id])
  name       String  // "Work", "Personal", "Side Project"
  color      String  // hex
  isPersonal Boolean @default(false)  // CRÍTICO: excluye del workload
  position   Int     // orden visual
  channels   Channel[]
}

model Channel {
  id            String  @id @default(cuid())
  userId        String
  user          User    @relation(fields: [userId], references: [id])
  contextId     String
  context       Context @relation(fields: [contextId], references: [id])
  name          String  // "#cliente-x", "#hiring", "#deepwork"
  color         String
  isDefault     Boolean @default(false)  // todas las tasks nuevas van aquí
  isEnabled     Boolean @default(true)

  // Calendar linking (bidireccional)
  importFromCalendarId String?  // eventos de este calendario → tasks en este channel
  timeboxToCalendarId  String?  // working sessions de este channel → este calendario

  // Integraciones externas (futuras)
  slackChannelId String?
  asanaProjectId String?

  workingHoursOverrides WorkingHours[]
  tasks                 Task[]
  objectives            Objective[]
}

// ============================================================
// CORE: TASKS Y WORKING SESSIONS
// ============================================================

model Task {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  channelId   String?
  channel     Channel? @relation(fields: [channelId], references: [id])
  objectiveId String?
  objective   Objective? @relation(fields: [objectiveId], references: [id])

  title       String
  notes       String?  // markdown
  isCompleted Boolean  @default(false)
  completedAt DateTime?

  // Estimación y tracking
  plannedTimeMinutes Int?
  actualTimeMinutes  Int  @default(0)

  // POSICIONAMIENTO TEMPORAL
  // day = null → backlog
  // day = fecha → asignada a ese día (puede o no tener working sessions)
  day         DateTime? @db.Date

  // Para recurring tasks
  recurringSeriesId String?
  recurringSeries   RecurringSeries? @relation(fields: [recurringSeriesId], references: [id])

  // Para rollover tracking
  rolloverCount Int @default(0)
  originalDay   DateTime? @db.Date  // la primera vez que apareció

  // Posición en la lista del día (orden manual del usuario)
  positionInDay Float?  // usar fractional indexing para reorder eficiente

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  workingSessions WorkingSession[]
  subtasks        Subtask[]
  timerEvents     TimerEvent[]   // para el detector de timer tardío
}

model Subtask {
  id        String  @id @default(cuid())
  taskId    String
  task      Task    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  title     String
  isCompleted Boolean @default(false)
  plannedTimeMinutes Int?
  actualTimeMinutes Int @default(0)
  position  Float
}

model WorkingSession {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  start     DateTime  // timestamp completo (con timezone)
  end       DateTime

  // Sync con calendario externo
  externalCalendarId String?  // a qué calendar fue empujado
  externalEventId    String?  // ID del evento creado allá

  // Para auditoría / undo
  createdBy CreationSource @default(USER)  // USER, AUTO_SCHEDULE, AUTO_RESCHEDULE, SPLIT
  createdAt DateTime @default(now())
}

enum CreationSource { USER AUTO_SCHEDULE AUTO_RESCHEDULE SPLIT IMPORT }

// ============================================================
// CALENDARIO EXTERNO (READ-ONLY para el motor)
// ============================================================

model CalendarAccount {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  provider    Provider // GOOGLE, OUTLOOK, ICLOUD
  email       String
  accessToken String   // encriptado
  refreshToken String  // encriptado
  isActive    Boolean  @default(true)
  calendars   ExternalCalendar[]
}

enum Provider { GOOGLE OUTLOOK ICLOUD }

model ExternalCalendar {
  id          String   @id @default(cuid())
  accountId   String
  account     CalendarAccount @relation(fields: [accountId], references: [id])
  externalId  String   // ID en Google/Outlook
  name        String
  color       String?
  isVisible   Boolean  @default(true)  // si está oculto, el motor lo ignora
  events      CalendarEvent[]
}

model CalendarEvent {
  id          String   @id @default(cuid())
  calendarId  String
  calendar    ExternalCalendar @relation(fields: [calendarId], references: [id])
  externalId  String   // ID en el provider
  title       String
  start       DateTime
  end         DateTime
  isBusy      Boolean  @default(true)  // free/available eventos NO bloquean
  isDeclined  Boolean  @default(false) // declinados NO bloquean
  isAllDay    Boolean  @default(false)
  syncedAt    DateTime @default(now())

  @@unique([calendarId, externalId])
}

// ============================================================
// OBJETIVOS SEMANALES
// ============================================================

model Objective {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  channelId   String?
  channel     Channel? @relation(fields: [channelId], references: [id])

  title       String
  weekKey     String   // "2026-W17" formato ISO
  isCompleted Boolean  @default(false)

  // Para extensiones (one-week-at-a-time)
  extendedToWeeks String[]  // ["2026-W18", "2026-W19"]

  createdAt   DateTime @default(now())
  tasks       Task[]
}

// ============================================================
// RECURRING TASKS (series + instancias)
// ============================================================

model RecurringSeries {
  id          String   @id @default(cuid())
  userId      String
  templateTaskJson Json  // snapshot del task para crear instancias
  pattern     RecurrencePattern
  daysOfWeek  Int[]    // para WEEKLY
  atRoughlyTime String?  // "09:00" - hora aproximada para auto-schedule
  startDate   DateTime
  endDate     DateTime?
  tasks       Task[]
}

enum RecurrencePattern { DAILY WEEKDAYS WEEKLY MONTHLY }

// ============================================================
// EVENTS para el TIMER (extensión: detector de timer tardío)
// ============================================================

model TimerEvent {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  type      TimerEventType
  timestamp DateTime @default(now())
  metadata  Json?    // { previousSessionStart: ..., movedTo: ... } etc.
}

enum TimerEventType { START PAUSE RESUME STOP COMPLETE }

// ============================================================
// COMMAND HISTORY para UNDO
// ============================================================

model Command {
  id          String   @id @default(cuid())
  userId      String
  type        String   // "AUTO_RESCHEDULE", "MOVE_SESSION", etc.
  payload     Json     // changes: [{entity, id, before, after}, ...]
  isUndone    Boolean  @default(false)
  triggeredBy CommandSource  // USER_ACTION, AUTO_RESCHEDULER, etc.
  parentCommandId String?  // si es un cascading command
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
}

enum CommandSource { USER_ACTION AUTO_RESCHEDULER ROLLOVER_JOB SYNC_JOB }
```

**Notas críticas sobre el schema:**

- **`day` en Task es nullable** → cuando es `null`, la task está en el backlog. NO crees una tabla `Backlog` separada.
- **`positionInDay` usa fractional indexing** (Float) para reordenar tasks sin updates masivos. Cuando insertas entre A (pos=1.0) y B (pos=2.0), la nueva va con pos=1.5.
- **`WorkingSession.taskId` es required**: una session sin task no tiene sentido. Si borras la task, las sessions caen en cascada.
- **`CalendarEvent` NUNCA se modifica desde el motor**, solo se sincroniza desde el provider externo.
- **`Command` registra TODO cambio del auto-rescheduler** para permitir undo granular.

---

## 4. Algoritmo: Auto-Scheduling

**Propósito:** Encontrar el primer hueco disponible en el día y crear una WorkingSession ahí.

**Trigger:** Usuario presiona `X` sobre una task, o llama explícitamente.

**Inputs:**
- `task: Task` (con `plannedTimeMinutes` o usar `defaultTaskDurationMinutes`)
- `day: Date` (qué día se está agendando)
- `now: DateTime` (timestamp actual)

**Outputs:**
- `Success(sessions: WorkingSession[])` — una o varias sessions creadas
- `Overcommitted(options: ['SCHEDULE_ANYWAY', 'ANOTHER_DAY', 'DEFER'])` — pregunta al usuario

### Pseudocódigo

```typescript
function autoSchedule(task: Task, day: Date, now: DateTime): SchedulingResult {
  const settings = getUserSettings(task.userId);
  const duration = task.plannedTimeMinutes ?? settings.defaultTaskDurationMinutes;

  // 1. Determinar working hours efectivas (channel override > user default)
  const workingHours = getEffectiveWorkingHours(task.userId, task.channelId, day);
  if (!workingHours) {
    // Día no laboral para este scope
    return Overcommitted(['SCHEDULE_ANYWAY', 'ANOTHER_DAY', 'DEFER']);
  }

  // 2. Construir ventana disponible del día
  const dayStart = combineDateTime(day, workingHours.startTime, settings.timezone);
  const dayEnd   = combineDateTime(day, workingHours.endTime,   settings.timezone);

  // Si es hoy, no agendar en el pasado
  const windowStart = isSameDay(day, now) ? maxDateTime(dayStart, now) : dayStart;
  if (windowStart >= dayEnd) {
    return Overcommitted([...]);
  }

  // 3. Recolectar bloques ocupados (busy events + working sessions existentes)
  const busyBlocks = collectBusyBlocks(task.userId, day, settings.autoSchedulingGapMinutes);
  // Cada blockq tiene: { start, end, source: 'EVENT' | 'SESSION' }
  // IMPORTANTE: aplicar el `gap` como expansión del bloque (start - gap, end + gap)
  // EXCEPTO si el bloque es la propia task (no auto-conflict)

  // 4. Calcular huecos disponibles dentro de la ventana
  const gaps = computeGaps(busyBlocks, windowStart, dayEnd);
  // gaps = [{ start, end, durationMinutes }, ...] en orden cronológico

  // 5. INTENTO 1: ¿cabe entera en algún hueco?
  for (const gap of gaps) {
    if (gap.durationMinutes >= duration) {
      const session = createWorkingSession({
        taskId: task.id,
        start: gap.start,
        end:   addMinutes(gap.start, duration),
        createdBy: 'AUTO_SCHEDULE'
      });
      return Success([session]);
    }
  }

  // 6. INTENTO 2: ¿podemos splittear? (ver sección 5 para detalle)
  const totalAvailable = sum(gaps.map(g => g.durationMinutes));
  const allowSplit =
    !task.preventSplit &&  // user puede haber holdeado Shift+X
    (duration > 60 || (totalAvailable >= duration && allGapsSmallerThanDuration(gaps, duration)));

  if (allowSplit && totalAvailable >= duration) {
    return splitAcrossGaps(task, gaps, duration);
  }

  // 7. No cupo: presentar opciones al usuario
  return Overcommitted(['SCHEDULE_ANYWAY', 'ANOTHER_DAY', 'DEFER']);
}


function collectBusyBlocks(userId: string, day: Date, gapMinutes: number): Block[] {
  const blocks: Block[] = [];

  // Calendar events (solo busy, no declined, calendars visibles)
  const events = db.calendarEvent.findMany({
    where: {
      calendar: { account: { userId }, isVisible: true },
      isBusy: true,
      isDeclined: false,
      start: { lt: endOfDay(day) },
      end:   { gt: startOfDay(day) },
    }
  });
  for (const e of events) {
    blocks.push({
      start: subMinutes(e.start, gapMinutes),
      end:   addMinutes(e.end,   gapMinutes),
      source: 'EVENT',
      ref: e.id,
    });
  }

  // Working sessions ya existentes (todas las del usuario en ese día)
  const sessions = db.workingSession.findMany({
    where: { task: { userId }, start: { gte: startOfDay(day) }, end: { lte: endOfDay(day) } }
  });
  for (const s of sessions) {
    blocks.push({
      start: subMinutes(s.start, gapMinutes),
      end:   addMinutes(s.end,   gapMinutes),
      source: 'SESSION',
      ref: s.id,
    });
  }

  // Mergear bloques solapados para el cálculo de gaps
  return mergeOverlapping(blocks.sort(byStart));
}


function computeGaps(blocks: Block[], windowStart: DateTime, windowEnd: DateTime): Gap[] {
  const gaps: Gap[] = [];
  let cursor = windowStart;
  for (const b of blocks) {
    if (b.start > cursor) {
      gaps.push({ start: cursor, end: b.start, durationMinutes: diffMinutes(cursor, b.start) });
    }
    cursor = maxDateTime(cursor, b.end);
  }
  if (cursor < windowEnd) {
    gaps.push({ start: cursor, end: windowEnd, durationMinutes: diffMinutes(cursor, windowEnd) });
  }
  return gaps.filter(g => g.durationMinutes > 0);
}
```

### Decisiones de diseño que la IA debe respetar

1. **El `gap` se aplica a EVENTS y SESSIONS por igual.** No es un "buffer entre meetings" solamente. Es respiro entre cualquier bloque ocupado.
2. **Eventos `free`/`available` NO bloquean.** Son anotaciones, no compromisos.
3. **Eventos declinados NO bloquean.** El usuario ya dijo que no va.
4. **Calendars con `isVisible: false` se ignoran.** El usuario puede ocultarlos.
5. **El `windowStart` se ajusta a `now` si el día es hoy.** Nunca agendar en el pasado.
6. **Si el día no tiene working hours definidas, NO es día laboral.** Devolver Overcommitted.

---

## 5. Algoritmo: Splitting alrededor de eventos

**Propósito:** Cuando una tarea no cabe entera en ningún hueco, dividirla en múltiples WorkingSessions que sumen la duración total.

**Reglas oficiales (heredadas de Sunsama):**
- Tareas ≤ 60 min: solo splittear si es estrictamente necesario.
- Tareas > 60 min: splittear libremente para llenar huecos.
- Shift+X previene splitting (flag `preventSplit` en la llamada).

### Pseudocódigo

```typescript
function splitAcrossGaps(task: Task, gaps: Gap[], totalDuration: number): SchedulingResult {
  const sessions: WorkingSession[] = [];
  let remaining = totalDuration;
  const MIN_CHUNK = 15;  // minutos: no crear sessions más cortas que esto

  for (const gap of gaps) {
    if (remaining <= 0) break;

    let chunkSize = Math.min(gap.durationMinutes, remaining);

    // Edge: si el último chunk sería menor a MIN_CHUNK,
    // intentar redistribuir o omitir
    if (chunkSize < MIN_CHUNK) continue;

    // Edge: si quedaría un remaining < MIN_CHUNK, agrandar este chunk
    if (remaining - chunkSize > 0 && remaining - chunkSize < MIN_CHUNK) {
      chunkSize = remaining;  // toma todo (siempre que quepa)
      if (chunkSize > gap.durationMinutes) chunkSize = gap.durationMinutes;
    }

    sessions.push(createWorkingSession({
      taskId: task.id,
      start: gap.start,
      end:   addMinutes(gap.start, chunkSize),
      createdBy: 'SPLIT'
    }));

    remaining -= chunkSize;
  }

  if (remaining > 0) {
    // No cupo todo; rollback de sessions creadas y volver al usuario
    for (const s of sessions) deleteWorkingSession(s.id);
    return Overcommitted(['SCHEDULE_ANYWAY', 'ANOTHER_DAY', 'DEFER']);
  }

  return Success(sessions);
}
```

### Ejemplo concreto del usuario

Son 3:30 PM. Task de 1 hora. Hay evento 4:00–5:00 PM. Working hours hasta 7:00 PM.

- Bloques ocupados: `[4:00–5:00]` (más gap de 5 min → `[3:55–5:05]`)
- Gaps en ventana `[3:30–7:00]`:
  - `3:30–3:55` (25 min)
  - `5:05–7:00` (115 min)
- ¿Cabe entera (60 min)? Sí, en el segundo gap → la tarea iría entera 5:05–6:05.

**Pero si el usuario arrastra explícitamente al primer slot,** el deconflict (sección 6) debería detectar que no cabe ahí entera y ofrecer split.

**Si el usuario preset `preventSplit=true`,** y solo cabe en el segundo gap, va ahí. Si no cabe en ningún gap único, Overcommitted.

---

## 6. Algoritmo: Auto-Rescheduling por conflicto

**Propósito:** Cuando el usuario coloca/arrastra una WorkingSession a un slot que choca con otras, mover las desplazadas a sus nuevos slots.

**Trigger:** `onSessionMoved` o `onSessionCreated` cuando hay overlap con otras sessions del mismo usuario.

**Reglas:**
- La session que el usuario movió/creó es **fija**, no se toca.
- Las sessions desplazadas se reagendan **una por una**, en orden cronológico original.
- **Eventos del calendario externo nunca se tocan** (son inmutables).
- Si una session desplazada no cabe en ningún hueco, **se desagenda** (queda en task list sin session).
- Toda la operación se registra como un solo `Command` para undo.

### Pseudocódigo

```typescript
function deconflict(movedSession: WorkingSession, userId: string): Command {
  const command = beginCommand({ type: 'AUTO_RESCHEDULE_DECONFLICT', userId });
  const day = dateOf(movedSession.start);

  // 1. Encontrar sessions que ahora chocan con la movida
  const conflicting = db.workingSession.findMany({
    where: {
      task: { userId },
      id: { not: movedSession.id },
      // overlap test: A.start < B.end AND A.end > B.start
      AND: [
        { start: { lt: movedSession.end } },
        { end:   { gt: movedSession.start } },
      ]
    },
    orderBy: { start: 'asc' }
  });

  if (conflicting.length === 0) {
    return command.commit();  // no-op
  }

  // 2. Para cada session conflictiva, removerla y reagendarla
  for (const session of conflicting) {
    const task = await getTask(session.taskId);
    const originalState = snapshot(session);

    // Remover session conflictiva temporalmente
    deleteWorkingSession(session.id);
    command.recordChange({
      entity: 'WorkingSession', id: session.id,
      before: originalState, after: null
    });

    // Re-encontrarle hueco en el MISMO día, empezando AFTER el movedSession
    const result = autoScheduleAfter(task, day, movedSession.end, /*now=*/Date.now());

    if (result.type === 'Success') {
      for (const newSession of result.sessions) {
        command.recordChange({
          entity: 'WorkingSession', id: newSession.id,
          before: null, after: snapshot(newSession),
        });
      }
    } else {
      // No cupo: la task queda en la lista sin session.
      // NO presentar diálogo "Overcommitted" aquí (es auto, no debe interrumpir).
      // El usuario verá la task sin slot y podrá actuar.
    }
  }

  return command.commit();
}


function autoScheduleAfter(task: Task, day: Date, after: DateTime, now: DateTime): SchedulingResult {
  // Variante de autoSchedule que solo considera huecos AFTER cierto instante
  const settings = getUserSettings(task.userId);
  const wh = getEffectiveWorkingHours(task.userId, task.channelId, day);
  const dayEnd = combineDateTime(day, wh.endTime, settings.timezone);
  const windowStart = maxDateTime(after, now);

  const blocks = collectBusyBlocks(task.userId, day, settings.autoSchedulingGapMinutes);
  const gaps = computeGaps(blocks, windowStart, dayEnd);

  // ... mismo flujo que autoSchedule (intento entera, intento split)
}
```

### Configuración del usuario que respeta este algoritmo

- `settings.autoRescheduleOnConflict` — si false, NO se ejecuta deconflict; las sessions se quedan solapadas.
- `event.modifiers.shift === true` cuando el usuario arrastra → temporalmente desactiva el deconflict para esa operación. (No persiste en settings, es ad-hoc.)

---

## 7. Algoritmo: Auto-Rescheduling por completion temprano

**Propósito:** Cuando una task se completa antes de que termine su WorkingSession, truncar la session y mover hacia adelante las sessions contiguas para llenar el tiempo liberado.

**Regla clave (la que hace que se sienta "no invasivo"):** **Solo se mueven las sessions contiguas.** Si hay un hueco "real" (definido por `contiguityThresholdMinutes`) entre la session completada y la siguiente, NO se toca lo que viene después.

### Pseudocódigo

```typescript
function onTaskCompleted(taskId: string, completedAt: DateTime): Command {
  const command = beginCommand({ type: 'AUTO_RESCHEDULE_EARLY_COMPLETION' });
  const settings = getUserSettings(/*from task*/);

  if (!settings.autoRescheduleOnEarlyCompletion) return command.commit();

  // 1. Encontrar la session activa (la que está corriendo o la más reciente del día)
  const session = findActiveSession(taskId, completedAt);
  if (!session || completedAt >= session.end) return command.commit();
  // Si completaste DESPUÉS del end programado, no liberas tiempo (fuiste tarde).

  const freedMinutes = diffMinutes(completedAt, session.end);
  if (freedMinutes < 1) return command.commit();

  // 2. Truncar la session: end = completedAt
  const before = snapshot(session);
  session.end = completedAt;
  saveSession(session);
  command.recordChange({ entity: 'WorkingSession', id: session.id, before, after: snapshot(session) });

  // 3. Encontrar el GRUPO CONTIGUO de sessions posteriores (mismo día, mismo usuario)
  const day = dateOf(session.start);
  const allLater = db.workingSession.findMany({
    where: {
      task: { userId: session.task.userId },
      start: { gte: session.end },
      end:   { lte: endOfDay(day) },
      id:    { not: session.id }
    },
    orderBy: { start: 'asc' }
  });

  const contiguousGroup: WorkingSession[] = [];
  let cursor = session.end;
  for (const s of allLater) {
    const gap = diffMinutes(cursor, s.start);
    if (gap <= settings.contiguityThresholdMinutes) {
      contiguousGroup.push(s);
      cursor = s.end;
    } else {
      break;  // hay un hueco real → no tocar más allá
    }
  }

  if (contiguousGroup.length === 0) return command.commit();

  // 4. Shift hacia adelante el grupo contiguo, RESPETANDO eventos del calendario
  shiftGroupBackward(contiguousGroup, freedMinutes, command);

  return command.commit();
}


function shiftGroupBackward(group: WorkingSession[], freedMinutes: number, command: Command) {
  // "Backward" en el sentido temporal = más temprano. Empujamos las sessions hacia el inicio.
  // Pero hay que respetar que no choquen con calendar events fijos en el medio.

  let proposedStart = subMinutes(group[0].start, freedMinutes);

  for (const session of group) {
    const sessionDuration = diffMinutes(session.start, session.end);
    const proposedEnd = addMinutes(proposedStart, sessionDuration);

    // ¿Hay un calendar event que choque con [proposedStart, proposedEnd]?
    const conflictingEvent = findCalendarEventOverlapping(
      session.task.userId,
      proposedStart, proposedEnd
    );

    if (conflictingEvent) {
      // No podemos mover esta session a `proposedStart`.
      // La dejamos en su lugar original; ajustamos cursor para que las siguientes intenten
      // alinearse a partir del end original de esta.
      proposedStart = session.end;
      continue;  // dejar esta session intacta
    }

    // Mover la session
    const before = snapshot(session);
    session.start = proposedStart;
    session.end   = proposedEnd;
    saveSession(session);
    command.recordChange({
      entity: 'WorkingSession', id: session.id,
      before, after: snapshot(session)
    });

    proposedStart = proposedEnd;  // siguiente arranca pegada
  }
}
```

### Ejemplo

Sessions del día:
- 9:00–10:00 Task A (en curso)
- 10:00–10:30 Task B
- 10:30–11:00 Task C
- 12:00–13:00 Task D (después de un gap de 1h)

Usuario completa Task A a las 9:40. `freedMinutes = 20`.

Grupo contiguo: [B, C] (gap entre A y B = 0, gap entre B y C = 0, gap entre C y D = 60 min > threshold)

Resultado:
- A: 9:00–9:40 (truncada)
- B: 9:40–10:10 (movida 20 min antes)
- C: 10:10–10:40 (movida 20 min antes)
- D: 12:00–13:00 (intacta — está después de un gap real)

---

## 8. Algoritmo: Detector de timer tardío

> **Esta es una extensión propia de theprimeway** que va más allá de Sunsama.

**Propósito:** Cuando el usuario arranca el timer de una task significativamente después del inicio programado de su WorkingSession, ofrecer (o hacer automáticamente) mover la session al "ahora" para que el calendario refleje la realidad.

**Por qué Sunsama NO hace esto:** Sunsama solo registra `actualTime` como número. La session se queda en su slot original (visualmente desconectada de cuándo realmente trabajaste). theprimeway puede mejorarlo.

**Comportamiento propuesto (3 modos, configurables):**

| Modo | Comportamiento |
|---|---|
| `OFF` | Como Sunsama: session se queda donde estaba. |
| `PROMPT` | Si la diferencia > threshold, mostrar toast: "¿Mover esta session al ahora?" |
| `AUTO` | Mover automáticamente la session al ahora (con undo disponible). |

### Pseudocódigo

```typescript
function onTimerStart(taskId: string, startedAt: DateTime): TimerStartResult {
  const settings = getUserSettings(/*from task*/);

  // Registrar el evento de timer (siempre)
  db.timerEvent.create({
    taskId, type: 'START', timestamp: startedAt
  });

  if (!settings.detectLateTimerStart) {
    return { action: 'NONE' };
  }

  // 1. Encontrar la session "esperada" para esta task hoy
  const today = dateOf(startedAt);
  const expectedSession = findScheduledSessionForTaskOn(taskId, today, startedAt);

  if (!expectedSession) {
    // No había session agendada → posiblemente arrancando una task del backlog o ad-hoc
    // Crear una session "live" que arranca ahora
    return offerCreateLiveSession(taskId, startedAt);
  }

  // 2. Calcular delay
  const delayMinutes = diffMinutes(expectedSession.start, startedAt);

  // Si el delay es negativo (arrancaste antes), no hacer nada
  if (delayMinutes <= 0) return { action: 'NONE' };

  // Si el delay es menor al threshold, ignorar (ruido)
  if (delayMinutes < settings.lateTimerThresholdMinutes) return { action: 'NONE' };

  // 3. Decidir según el modo
  switch (settings.lateTimerBehavior) {
    case 'PROMPT':
      return {
        action: 'PROMPT_USER',
        message: `Tu session estaba programada a las ${formatTime(expectedSession.start)}.
                  ¿Mover al ahora (${formatTime(startedAt)})?`,
        onAccept: () => moveSessionToNow(expectedSession, startedAt),
      };

    case 'AUTO':
      const command = moveSessionToNow(expectedSession, startedAt);
      return {
        action: 'AUTO_MOVED',
        notification: `Session movida a ${formatTime(startedAt)}. Cmd+Z para deshacer.`,
        commandId: command.id,
      };

    default:
      return { action: 'NONE' };
  }
}


function moveSessionToNow(session: WorkingSession, now: DateTime): Command {
  const command = beginCommand({ type: 'MOVE_SESSION_TO_TIMER_START' });
  const sessionDuration = diffMinutes(session.start, session.end);

  const before = snapshot(session);
  session.start = now;
  session.end   = addMinutes(now, sessionDuration);
  saveSession(session);
  command.recordChange({ entity: 'WorkingSession', id: session.id, before, after: snapshot(session) });

  // ¡IMPORTANTE! Mover esta session puede generar conflictos con otras.
  // Dispara el deconflict normal (sección 6).
  const deconflictCmd = deconflict(session, session.task.userId);
  command.linkChild(deconflictCmd);

  return command.commit();
}


function findScheduledSessionForTaskOn(taskId: string, day: Date, around: DateTime): WorkingSession | null {
  // Busca la session de esa task ese día más cercana al `around`.
  // Si hay varias, prefiere la que aún no ha empezado o está en curso.
  const sessions = db.workingSession.findMany({
    where: { taskId, start: { gte: startOfDay(day) }, end: { lte: endOfDay(day) } },
    orderBy: { start: 'asc' }
  });

  // Preferir: la que contiene `around`, luego la próxima, luego la más reciente
  const containing = sessions.find(s => s.start <= around && s.end > around);
  if (containing) return containing;

  const upcoming = sessions.find(s => s.start > around);
  if (upcoming) return upcoming;

  return sessions[sessions.length - 1] ?? null;
}
```

### Edge cases del detector de timer

1. **Arrancas timer 5 min después del slot**: bajo threshold (default 15) → no hacer nada.
2. **Arrancas timer 1h después del slot, pero el slot ya terminó**: probablemente quieres una nueva session "live" desde ahora. El comportamiento: crear una session `[now, now + remainingPlannedTime]`.
3. **Arrancas timer en una task sin slot agendado** (ej: del backlog): crear session "live" desde ahora con duración = `plannedTimeMinutes`. La task migra del backlog al día actual.
4. **Pausas y resume**: tracked en `TimerEvent` para calcular `actualTime` correctamente, pero NO disparan re-schedule.
5. **Stop sin complete**: registra el actualTime acumulado, no toca scheduling.


---

## 9. Sistema de Channels y Contexts

**Propósito:** Categorización transversal que conecta tasks, calendarios externos, integraciones y configuración de horarios.

### Jerarquía

```
User
└── Context (ej: "Work", "Personal")
    ├── isPersonal: bool  ← excluye del workload
    └── Channel (ej: "#cliente-x", "#hiring")
        ├── importFromCalendarId  ← eventos de este calendario crean tasks aquí
        ├── timeboxToCalendarId   ← working sessions van a este calendario
        ├── workingHoursOverrides ← schedule específico
        └── isDefault             ← tasks nuevas se asignan aquí si no hay override
```

### Reglas críticas

1. **Asignación de canal a una task nueva** sigue esta cascada de prioridad (la primera que matchee gana):
   ```
   1. Canal explícito en el create payload
   2. Canal del filtro activo (si user está filtrando por canal, las nuevas tasks se asignan ahí)
   3. Canal del objetivo (si la task se crea desde un objective)
   4. Canal del calendario fuente (si la task se importó de un evento de calendario)
   5. ML suggestion (channelRecommendation, sección 12)
   6. Channel marcado como isDefault del usuario
   7. null (#unassigned)
   ```

2. **Working hours efectivas** para una task se resuelven así:
   ```typescript
   function getEffectiveWorkingHours(userId, channelId, day): WorkingHours | null {
     if (channelId) {
       const override = db.workingHours.findFirst({
         where: { userId, channelId, dayOfWeek: getDayOfWeek(day) }
       });
       if (override) return override;
     }
     return db.workingHours.findFirst({
       where: { userId, channelId: null, dayOfWeek: getDayOfWeek(day) }
     });
   }
   ```

3. **Workload counter** suma `plannedTime` de todas las tasks del día EXCEPTO las cuyos canales pertenecen a contexts con `isPersonal = true`.

4. **Calendar privacy**: tasks en channels privados o contexts personales se marcan como `private` en el calendario externo, sin importar el setting global.

### Filtrado por context/channel en queries

Casi todas las queries del frontend usan filtros por context/channel. Implementar como middleware en Hono:

```typescript
// Hono middleware
app.use('*', async (c, next) => {
  const filterChannelId = c.req.query('channelId');
  const filterContextId = c.req.query('contextId');
  c.set('scopeFilter', { filterChannelId, filterContextId });
  await next();
});

// En el handler
function buildTaskWhere(userId, scopeFilter) {
  const where: any = { userId };
  if (scopeFilter.filterChannelId) {
    where.channelId = scopeFilter.filterChannelId;
  } else if (scopeFilter.filterContextId) {
    where.channel = { contextId: scopeFilter.filterContextId };
  }
  return where;
}
```

---

## 10. Backlog y rollover

### Backlog: qué es y qué NO es

**El backlog NO es** el destino automático para tasks que no caben en el día. Es un **limbo voluntario** donde el usuario guarda tasks sin compromiso temporal.

**Implementación:** una task está en backlog cuando `task.day === null`. No hay tabla aparte.

### Comportamiento "mágico" del backlog → today

Cuando el usuario inicia un timer o crea una WorkingSession sobre una task del backlog, **automáticamente migra a hoy**.

```typescript
function ensureTaskOnDay(taskId: string, day: Date): void {
  const task = db.task.findUnique({ where: { id: taskId } });
  if (task.day === null) {
    // Task estaba en backlog → migrar al día actual
    db.task.update({
      where: { id: taskId },
      data: { day, originalDay: day }
    });
  }
}

// Llamar en:
// - onTimerStart
// - createWorkingSession (cualquier source)
// - autoSchedule (cuando el usuario fuerza schedule de algo del backlog)
```

### Rollover: tasks incompletas que pasan al día siguiente

**Trigger:** Cron job a medianoche (timezone del usuario) Y/O al ejecutar el "evening planning ritual".

```typescript
// Cron job: ejecutar cada hora, procesar usuarios cuya medianoche local acaba de pasar
async function rolloverIncompleteTasks(userId: string): Promise<void> {
  const settings = getUserSettings(userId);
  const tz = getUser(userId).timezone;
  const yesterday = subDays(nowInTimezone(tz), 1);
  const today = nowInTimezone(tz);

  // Encontrar tasks incompletas de ayer
  const incompleteTasks = db.task.findMany({
    where: {
      userId,
      day: yesterday,
      isCompleted: false,
      // Excepción: tasks recurrentes manejan rollover diferente (ver más abajo)
      recurringSeriesId: null,
    }
  });

  for (const task of incompleteTasks) {
    const command = beginCommand({ type: 'ROLLOVER', triggeredBy: 'ROLLOVER_JOB' });
    const before = snapshot(task);

    // Mover al día siguiente
    db.task.update({
      where: { id: task.id },
      data: {
        day: today,
        rolloverCount: task.rolloverCount + 1,
        // CRÍTICO: las working sessions NO se mueven (cada día tiene su propio horario)
        // Se BORRAN. El usuario debe re-timeboxearla.
      }
    });

    // Borrar working sessions de ayer (no rolean)
    db.workingSession.deleteMany({
      where: { taskId: task.id, start: { gte: startOfDay(yesterday), lt: startOfDay(today) } }
    });

    // Asignar position según user setting
    if (settings.taskRolloverPosition === 'TOP') {
      // dar el menor positionInDay del día
      const minPos = await getMinPositionForDay(userId, today);
      db.task.update({ where: { id: task.id }, data: { positionInDay: minPos - 1 } });
    } else {
      const maxPos = await getMaxPositionForDay(userId, today);
      db.task.update({ where: { id: task.id }, data: { positionInDay: maxPos + 1 } });
    }

    command.recordChange({ entity: 'Task', id: task.id, before, after: snapshot(task) });
    command.commit();
  }
}
```

### Recurring tasks: rollover especial

Las recurring tasks NO se duplican al rolear. La regla:

> Una recurring task rolea hasta que colisione con otra instancia de la misma serie.

```typescript
// En lugar del rollover normal, recurring tasks siguen esta lógica:
async function rolloverRecurringTask(task: Task, today: Date): Promise<void> {
  const tomorrowInstance = db.task.findFirst({
    where: {
      recurringSeriesId: task.recurringSeriesId,
      day: today,  // ¿hay ya una instancia para hoy?
    }
  });

  if (tomorrowInstance) {
    // Hay instancia de hoy → la de ayer se "absorbe"
    // Si la de ayer tiene cambios significativos (notes, subtasks editadas), preservar AMBAS
    const hasSignificantEdits = checkSignificantEdits(task);
    if (!hasSignificantEdits) {
      // Borrar la rolada (la nueva es la que se mantiene)
      db.task.delete({ where: { id: task.id } });
    } else {
      // Mantener ambas, el usuario verá dos
      db.task.update({ where: { id: task.id }, data: { day: today } });
    }
  } else {
    // No hay instancia → rolea normal
    db.task.update({ where: { id: task.id }, data: { day: today } });
  }
}
```

---

## 11. Weekly Objectives

**Propósito:** Capa estratégica sobre las tareas. NO afecta directamente el algoritmo de scheduling. Es organización + métricas.

### Modelo

Ya definido en sección 3. Lo importante:

- Un Objective tiene `weekKey` (ej: "2026-W17") que indica a qué semana pertenece.
- Un Objective puede tener `extendedToWeeks` (array) para extensiones one-week-at-a-time.
- Las tasks tienen `objectiveId` opcional que las "alinea".

### Reglas de propagación de canal

```typescript
function alignTaskToObjective(taskId: string, objectiveId: string): void {
  const task = getTask(taskId);
  const objective = getObjective(objectiveId);

  const updates: any = { objectiveId };

  // Si la task NO tiene canal, hereda el del objetivo
  if (!task.channelId && objective.channelId) {
    updates.channelId = objective.channelId;
  }
  // Si la task YA tiene canal, lo preserva (el override más específico gana)

  db.task.update({ where: { id: taskId }, data: updates });
}


function changeObjectiveChannel(objectiveId: string, newChannelId: string): void {
  const objective = getObjective(objectiveId);
  const oldChannelId = objective.channelId;

  db.objective.update({ where: { id: objectiveId }, data: { channelId: newChannelId } });

  // Propagar a tasks alineadas QUE TENÍAN el canal del objetivo (heredado)
  // Las tasks que tenían un canal explícito distinto se mantienen
  db.task.updateMany({
    where: { objectiveId, channelId: oldChannelId },
    data: { channelId: newChannelId }
  });
}
```

### Crear task desde objective (atajo de UX)

```typescript
function createTaskFromObjective(objectiveId: string, day: Date): Task {
  const objective = getObjective(objectiveId);
  return db.task.create({
    data: {
      userId: objective.userId,
      title: objective.title,
      channelId: objective.channelId,
      objectiveId: objective.id,
      day,  // si es null, va al backlog
    }
  });
}
```

### Métrica útil habilitada

```typescript
// % de tiempo trabajado en tasks alineadas a objetivos esta semana
async function objectiveAlignmentMetric(userId: string, weekKey: string) {
  const weekStart = startOfWeek(weekKey);
  const weekEnd = endOfWeek(weekKey);

  const allActualMinutes = await db.task.aggregate({
    where: { userId, day: { gte: weekStart, lte: weekEnd }, isCompleted: true },
    _sum: { actualTimeMinutes: true }
  });

  const alignedActualMinutes = await db.task.aggregate({
    where: { userId, day: { gte: weekStart, lte: weekEnd }, isCompleted: true, objectiveId: { not: null } },
    _sum: { actualTimeMinutes: true }
  });

  return {
    total: allActualMinutes._sum.actualTimeMinutes ?? 0,
    aligned: alignedActualMinutes._sum.actualTimeMinutes ?? 0,
    percentage: allActualMinutes._sum.actualTimeMinutes
      ? (alignedActualMinutes._sum.actualTimeMinutes ?? 0) / allActualMinutes._sum.actualTimeMinutes * 100
      : 0
  };
}
```

---

## 12. ML ligero

**Propósito:** Sugerir automáticamente `channel` y `plannedTime` a tasks nuevas, basándose en el historial **per-usuario**.

**Restricción:** NO usar LLM para esto en producción (latencia + costo). Usar modelos ligeros locales o en backend.

### 12.1. Sugeridor de canal (Naive Bayes)

```typescript
// Cuando el usuario crea una task sin canal, se llama a esta función.
// Si retorna un channelId con confianza alta, se asigna automáticamente.

function suggestChannel(task: { title: string; notes?: string }, userId: string): { channelId: string; confidence: number } | null {
  const settings = getUserSettings(userId);
  if (!settings.channelRecommendationsEnabled) return null;

  // 1. Obtener historial de tasks completadas con canal asignado
  const history = db.task.findMany({
    where: { userId, channelId: { not: null }, isCompleted: true },
    select: { title: true, notes: true, channelId: true },
    take: 5000  // ventana razonable
  });

  if (history.length < 20) return null;  // muy poco data → no sugerir

  // 2. Tokenizar (lowercase, sin stopwords, stem opcional)
  const queryTokens = tokenize(task.title + ' ' + (task.notes ?? ''));

  // 3. Calcular P(channel | tokens) con Naive Bayes
  const channels = unique(history.map(t => t.channelId));
  const scores: Record<string, number> = {};

  // P(channel) = #tasks_in_channel / #total
  // P(token | channel) = (#token_in_channel + 1) / (#total_tokens_in_channel + V)  [Laplace smoothing]

  const tokensByChannel: Record<string, Map<string, number>> = {};
  const totalTokensByChannel: Record<string, number> = {};
  const tasksByChannel: Record<string, number> = {};

  for (const t of history) {
    tasksByChannel[t.channelId] = (tasksByChannel[t.channelId] ?? 0) + 1;
    const tokens = tokenize(t.title + ' ' + (t.notes ?? ''));
    if (!tokensByChannel[t.channelId]) tokensByChannel[t.channelId] = new Map();
    for (const tok of tokens) {
      tokensByChannel[t.channelId].set(tok, (tokensByChannel[t.channelId].get(tok) ?? 0) + 1);
      totalTokensByChannel[t.channelId] = (totalTokensByChannel[t.channelId] ?? 0) + 1;
    }
  }

  const vocabSize = unique(history.flatMap(t => tokenize(t.title))).length;

  for (const channelId of channels) {
    let logScore = Math.log(tasksByChannel[channelId] / history.length);  // log P(channel)
    for (const tok of queryTokens) {
      const count = tokensByChannel[channelId].get(tok) ?? 0;
      const prob = (count + 1) / (totalTokensByChannel[channelId] + vocabSize);
      logScore += Math.log(prob);
    }
    scores[channelId] = logScore;
  }

  // 4. Tomar el mejor y normalizar a "confidence" 0-1
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const best = sorted[0];
  const second = sorted[1];

  // Confidence = qué tan separado está el primero del segundo (en log scale)
  const margin = best[1] - (second?.[1] ?? best[1] - 10);
  const confidence = Math.min(1, margin / 5);  // heurística simple

  if (confidence < 0.3) return null;  // muy ambiguo

  return { channelId: best[0], confidence };
}


function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\sáéíóúñ]/g, ' ')  // quitar puntuación
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOPWORDS_ES_EN.has(t));
}
```

### 12.2. Estimador de tiempo (regresión por similitud)

```typescript
function estimatePlannedTime(task: { title: string; notes?: string; channelId?: string }, userId: string): number | null {
  const settings = getUserSettings(userId);
  if (!settings.plannedTimeRecommendationsEnabled) return null;

  // ESTRATEGIA 1: match exacto/casi-exacto en historial
  // Tasks completadas con título muy similar
  const allCompleted = db.task.findMany({
    where: { userId, isCompleted: true, actualTimeMinutes: { gt: 0 } },
    select: { title: true, channelId: true, actualTimeMinutes: true, plannedTimeMinutes: true },
    take: 5000
  });

  const similar = allCompleted
    .map(t => ({ ...t, similarity: jaroWinkler(t.title.toLowerCase(), task.title.toLowerCase()) }))
    .filter(t => t.similarity >= 0.85);

  if (similar.length >= 3) {
    // Usar mediana de actualTime (más robusta que promedio ante outliers)
    const times = similar.map(t => t.actualTimeMinutes).sort((a, b) => a - b);
    return times[Math.floor(times.length / 2)];
  }

  // ESTRATEGIA 2: por canal + tokens compartidos
  if (task.channelId) {
    const channelTasks = allCompleted.filter(t => t.channelId === task.channelId);
    if (channelTasks.length >= 5) {
      // Weighted median: dar más peso a tasks recientes y con tokens similares
      const queryTokens = new Set(tokenize(task.title));
      const scored = channelTasks.map(t => {
        const tokens = new Set(tokenize(t.title));
        const overlap = [...queryTokens].filter(x => tokens.has(x)).length;
        const recencyWeight = 1;  // simplificado
        const tokenWeight = 1 + overlap * 0.5;
        return { time: t.actualTimeMinutes, weight: recencyWeight * tokenWeight };
      });
      return weightedMedian(scored);
    }
  }

  // ESTRATEGIA 3: fallback al default global del usuario
  return settings.defaultTaskDurationMinutes;
}


function weightedMedian(items: { time: number; weight: number }[]): number {
  const sorted = items.sort((a, b) => a.time - b.time);
  const totalWeight = sorted.reduce((s, x) => s + x.weight, 0);
  let cumulative = 0;
  for (const item of sorted) {
    cumulative += item.weight;
    if (cumulative >= totalWeight / 2) return item.time;
  }
  return sorted[sorted.length - 1].time;
}
```

### 12.3. Cuándo entrenar / actualizar

**No hay "entrenamiento" formal.** Las funciones leen del historial en tiempo real. Para optimizar:

- **Cache invalidation**: cuando una task se completa, invalidar el cache de sugerencias de ese usuario.
- **Ventana móvil**: los últimos 5000 tasks completadas son suficientes para usuarios power.
- **Async on create**: en lugar de bloquear el create, sugerir async y actualizar el UI.

```typescript
// En el endpoint de create task (Hono)
app.post('/tasks', async (c) => {
  const body = await c.req.json();
  const userId = c.get('userId');

  // Crear la task inmediatamente sin sugerencias (UI receptivo)
  const task = await db.task.create({ data: { ...body, userId } });

  // Disparar sugerencias en background
  if (!task.channelId) {
    runAsync(async () => {
      const suggestion = suggestChannel(task, userId);
      if (suggestion && suggestion.confidence > 0.5) {
        await db.task.update({ where: { id: task.id }, data: { channelId: suggestion.channelId } });
        // Notificar al frontend vía SSE/WebSocket
        notifyUser(userId, { type: 'TASK_UPDATED', taskId: task.id });
      }
    });
  }
  if (!task.plannedTimeMinutes) {
    runAsync(async () => {
      const estimate = estimatePlannedTime(task, userId);
      if (estimate) {
        await db.task.update({ where: { id: task.id }, data: { plannedTimeMinutes: estimate } });
        notifyUser(userId, { type: 'TASK_UPDATED', taskId: task.id });
      }
    });
  }

  return c.json(task);
});
```

---

## 13. Workload threshold

**Propósito:** Mostrar al usuario un warning visual cuando el día tiene demasiado planificado. NO bloquea nada.

### Cálculo

```typescript
function computeWorkload(userId: string, day: Date): WorkloadInfo {
  const settings = getUserSettings(userId);

  // Sumar plannedTime de tasks del día EXCLUYENDO contexts personales
  const result = db.task.aggregate({
    where: {
      userId,
      day,
      channel: { context: { isPersonal: false } }
    },
    _sum: { plannedTimeMinutes: true }
  });

  const plannedMinutes = result._sum.plannedTimeMinutes ?? 0;

  // Threshold puede ser custom-by-day o el default
  const dayOfWeek = getDayOfWeek(day);
  const customThreshold = settings.customDayThresholds?.[dayOfWeek];
  const threshold = customThreshold ?? settings.workloadThresholdMinutes;

  // Determinar el "color" del warning
  let level: 'OK' | 'CAUTION' | 'OVER';
  if (plannedMinutes < threshold * 0.85) level = 'OK';        // verde
  else if (plannedMinutes <= threshold)   level = 'CAUTION';  // amarillo
  else                                    level = 'OVER';     // rojo

  return { plannedMinutes, threshold, level };
}
```

### Counter visual del usuario (en el header del día)

Tres modos cyclables (como Sunsama):

```typescript
type WorkloadDisplay =
  | { mode: 'TOTAL_PLANNED'; value: number; threshold: number }      // "5h 30m / 7h"
  | { mode: 'ACTUAL_VS_PLANNED'; actual: number; planned: number }   // "2h done / 5h 30m"
  | { mode: 'REMAINING'; minutes: number };                          // "3h 30m left"
```


---

## 14. Sincronización con calendario externo

**Propósito:** Mantener bidireccional el estado entre theprimeway y los calendarios del usuario (Google Calendar primero).

### Direcciones del sync

```
┌─────────────────────────┐         ┌──────────────────────────┐
│   Calendar externo      │         │   theprimeway            │
│   (Google/Outlook)      │         │                          │
├─────────────────────────┤         ├──────────────────────────┤
│ Events (reuniones)      │  ───►   │ CalendarEvent (read-only)│
│                         │         │                          │
│ Working Sessions        │  ◄───   │ WorkingSession           │
│ (creadas por nosotros)  │         │ (push como events)       │
└─────────────────────────┘         └──────────────────────────┘
```

### Pull: importar eventos del calendario

```typescript
// Cron: cada 5 minutos por usuario activo, o webhook si el provider lo soporta
async function pullCalendarEvents(accountId: string): Promise<void> {
  const account = getCalendarAccount(accountId);
  const calendars = db.externalCalendar.findMany({ where: { accountId, isVisible: true } });

  for (const cal of calendars) {
    const events = await provider(account.provider).listEvents({
      calendarId: cal.externalId,
      timeMin: subDays(new Date(), 1),
      timeMax: addDays(new Date(), 14),
      syncToken: cal.lastSyncToken,  // incremental sync
    });

    for (const evt of events.items) {
      // Skip eventos creados por nosotros (los identificamos por extendedProperties)
      if (evt.extendedProperties?.private?.theprimeway_session_id) continue;

      await db.calendarEvent.upsert({
        where: { calendarId_externalId: { calendarId: cal.id, externalId: evt.id } },
        create: {
          calendarId: cal.id,
          externalId: evt.id,
          title: evt.summary,
          start: evt.start.dateTime ?? evt.start.date,
          end: evt.end.dateTime ?? evt.end.date,
          isBusy: evt.transparency !== 'transparent',  // transparent = "free"
          isDeclined: isDeclinedByUser(evt, account.email),
          isAllDay: !evt.start.dateTime,
        },
        update: { /* mismos campos */ }
      });
    }

    // Si hubo cambios en eventos que afectaban gaps de hoy/mañana,
    // considerar disparar un "soft re-evaluation" (ver edge cases)
    await db.externalCalendar.update({ where: { id: cal.id }, data: { lastSyncToken: events.nextSyncToken } });
  }
}
```

### Push: crear/actualizar/borrar working sessions en el calendario

```typescript
async function pushWorkingSessionToCalendar(session: WorkingSession): Promise<void> {
  const task = await getTask(session.taskId);
  const channel = task.channelId ? await getChannel(task.channelId) : null;

  // Determinar a qué calendario push
  const targetCalendarId = channel?.timeboxToCalendarId ?? getDefaultTimeboxCalendar(task.userId);
  if (!targetCalendarId) return;  // user no configuró calendar destino

  const targetCalendar = await getExternalCalendar(targetCalendarId);
  const account = await getCalendarAccount(targetCalendar.accountId);
  const settings = getUserSettings(task.userId);

  const eventPayload = {
    summary: task.title,
    start: { dateTime: session.start.toISOString() },
    end:   { dateTime: session.end.toISOString() },
    transparency: settings.calendarAvailability === 'BUSY' ? 'opaque' : 'transparent',
    visibility: resolveVisibility(task, channel, settings),  // private/public/default
    extendedProperties: {
      private: {
        theprimeway_session_id: session.id,  // marker para no re-importar
        theprimeway_task_id: task.id,
      }
    },
    reminders: settings.calendarReminders
      ? { useDefault: false, overrides: [{ method: 'popup', minutes: 5 }] }
      : { useDefault: true }
  };

  if (session.externalEventId) {
    // Update
    await provider(account.provider).updateEvent({
      calendarId: targetCalendar.externalId,
      eventId: session.externalEventId,
      payload: eventPayload,
    });
  } else {
    // Create
    const created = await provider(account.provider).createEvent({
      calendarId: targetCalendar.externalId,
      payload: eventPayload,
    });
    await db.workingSession.update({
      where: { id: session.id },
      data: { externalCalendarId: targetCalendar.id, externalEventId: created.id }
    });
  }
}


async function deleteWorkingSessionFromCalendar(session: WorkingSession): Promise<void> {
  if (!session.externalEventId || !session.externalCalendarId) return;
  const targetCalendar = await getExternalCalendar(session.externalCalendarId);
  const account = await getCalendarAccount(targetCalendar.accountId);
  await provider(account.provider).deleteEvent({
    calendarId: targetCalendar.externalId,
    eventId: session.externalEventId,
  });
}
```

### Hooks: cuándo disparar sync

| Evento | Acción |
|---|---|
| `WorkingSession.create` | push (create) |
| `WorkingSession.update` (start/end cambia) | push (update) |
| `WorkingSession.delete` | delete |
| `Task.update` (title cambia) | push (update) en todas sus sessions |
| `Task.delete` | delete en todas sus sessions |

**Implementar como queue jobs.** No bloquear el request HTTP esperando al provider externo.

### Conflicto: evento que aparece donde había una working session

Si llega un evento nuevo del calendario externo que solapa con una WorkingSession existente:

**Política recomendada:** NO mover automáticamente la session (sería invasivo). En su lugar:
1. Marcar la session con un flag `hasExternalConflict: bool`.
2. Mostrar visualmente el conflicto al usuario.
3. El usuario decide: dejar el solape, mover la session, o cancelar la task.

(Opcional avanzado: ofrecer "reagendar automáticamente" como botón rápido en el conflict UI.)

---

## 15. Sistema de Undo (Command Pattern)

**Propósito:** Permitir Cmd+Z granular que solo deshace los cambios automáticos del sistema, preservando los cambios manuales del usuario.

### Por qué importa

Si el usuario arrastra una session y el auto-rescheduler mueve otras 3 como reacción, presionar Cmd+Z debería **deshacer las 3 movidas automáticas, pero NO la movida manual del usuario**. Esto es lo que hace que el sistema se sienta "seguro" — el usuario puede experimentar sin miedo.

### Estructura

```typescript
type Change = {
  entity: 'Task' | 'WorkingSession' | 'Subtask';
  id: string;
  before: any | null;  // null = creación
  after:  any | null;  // null = borrado
};

type Command = {
  id: string;
  userId: string;
  type: string;
  triggeredBy: 'USER_ACTION' | 'AUTO_RESCHEDULER' | 'ROLLOVER_JOB' | 'SYNC_JOB';
  parentCommandId?: string;  // si es child de otro
  changes: Change[];
  createdAt: DateTime;
  isUndone: boolean;
};
```

### API del sistema de comandos

```typescript
class CommandManager {
  beginCommand(meta: { type: string; triggeredBy: CommandSource; parentId?: string }): CommandBuilder {
    return new CommandBuilder(meta);
  }

  async undoLast(userId: string): Promise<UndoResult> {
    // Encontrar el último command del USER_ACTION que NO esté undone
    // Y todos sus children del AUTO_RESCHEDULER
    const lastUserCommand = await db.command.findFirst({
      where: { userId, isUndone: false, triggeredBy: 'USER_ACTION' },
      orderBy: { createdAt: 'desc' }
    });

    if (!lastUserCommand) return { success: false, reason: 'NOTHING_TO_UNDO' };

    const childCommands = await db.command.findMany({
      where: { parentCommandId: lastUserCommand.id, isUndone: false }
    });

    // CLAVE: revertir SOLO los children (auto), NO el parent (user)
    // Esto matchea el comportamiento de Sunsama
    for (const child of childCommands) {
      await revertChanges(child.changes);
      await db.command.update({ where: { id: child.id }, data: { isUndone: true } });
    }

    return { success: true, undoneCount: childCommands.length };
  }

  // Variante: undo completo (incluye el cambio del usuario)
  async undoFull(userId: string): Promise<UndoResult> {
    const last = await db.command.findFirst({
      where: { userId, isUndone: false, parentCommandId: null },
      orderBy: { createdAt: 'desc' }
    });
    if (!last) return { success: false, reason: 'NOTHING_TO_UNDO' };

    const allRelated = [last, ...await db.command.findMany({
      where: { parentCommandId: last.id, isUndone: false }
    })];

    for (const cmd of allRelated.reverse()) {
      await revertChanges(cmd.changes);
      await db.command.update({ where: { id: cmd.id }, data: { isUndone: true } });
    }

    return { success: true, undoneCount: allRelated.length };
  }
}


async function revertChanges(changes: Change[]): Promise<void> {
  // Aplicar en orden inverso
  for (const change of [...changes].reverse()) {
    if (change.before === null) {
      // Era una creación → borrar
      await db[change.entity.toLowerCase()].delete({ where: { id: change.id } });
    } else if (change.after === null) {
      // Era un borrado → recrear
      await db[change.entity.toLowerCase()].create({ data: change.before });
    } else {
      // Era una update → restaurar before
      await db[change.entity.toLowerCase()].update({
        where: { id: change.id },
        data: change.before
      });
    }
  }
}
```

### Política de retención

- Mantener commands de los últimos **30 días**.
- Limpiar con un cron diario.
- Los `Change` viven dentro del JSON del command, no como tabla separada (evita N+1 en undo).

---

## 16. Hoja de ruta por sprints

> Cada sprint asume ~2 semanas de trabajo de un dev senior, pero ajusta a tu velocidad real.

### Sprint 0: Fundación (1 semana)

**Objetivo:** Tener el proyecto corriendo end-to-end con un "hello world" de tasks.

- [ ] Setup Hono + Prisma + PostgreSQL
- [ ] Schema completo de la sección 3 (sin recurring, sin commands aún)
- [ ] Seeders básicos (1 user demo, 2 contexts, 4 channels)
- [ ] Frontend React + Vite + estilo base
- [ ] Auth básica (puede ser stub, login fake con un token hardcodeado para empezar)
- [ ] Endpoint `GET /me` y `GET /tasks?day=YYYY-MM-DD`
- [ ] Vista Kanban del día con tasks (drag & drop ya, usando `@dnd-kit`)
- [ ] Vista calendario semana (sin working sessions aún, solo grid)

### Sprint 1: Tasks CRUD + Contexts/Channels (2 semanas)

**Objetivo:** Poder crear, editar, completar y organizar tasks por canal.

- [ ] CRUD completo de tasks (Hono routes + UI)
- [ ] CRUD de contexts y channels
- [ ] Asignación de canal a tasks (cascada de prioridad de la sección 9.1)
- [ ] Filtrado por context/channel en el workspace
- [ ] Backlog (UI: panel lateral toggleable, lógica `day = null`)
- [ ] Drag-and-drop tasks entre días (mover `task.day`)
- [ ] Drag tasks al backlog y de regreso
- [ ] Shortcuts básicos (`A` add, `C` complete, `Z` to backlog)
- [ ] **TEST:** Backlog → today auto-migration cuando creas working session

### Sprint 2: Working Sessions + Auto-Schedule básico (2 semanas)

**Objetivo:** El motor central de scheduling sin splitting ni rescheduling todavía.

- [ ] Modelo `WorkingSession` y CRUD
- [ ] Drag tasks desde la lista al calendario (crear session)
- [ ] Resize de sessions en el calendario (UI + backend)
- [ ] Working hours (settings: por usuario)
- [ ] **Algoritmo `autoSchedule` versión simple** (sección 4, sin split)
- [ ] Shortcut `X` para auto-schedule
- [ ] Detección "Overcommitted" → modal con 3 opciones
- [ ] Auto-scheduling gap configurable
- [ ] **TEST:** Auto-schedule respeta working hours, no agenda en el pasado, no choca con sessions existentes

### Sprint 3: Calendar Sync (2 semanas)

**Objetivo:** Integración bidireccional con Google Calendar.

- [ ] OAuth flow Google
- [ ] Tabla `CalendarAccount`, `ExternalCalendar`, `CalendarEvent`
- [ ] Pull job (incremental con syncToken)
- [ ] Mostrar eventos del calendario en el calendar UI
- [ ] Push de WorkingSessions a Google Calendar (con `extendedProperties`)
- [ ] Sync delete/update
- [ ] **Algoritmo `autoSchedule` ahora considera CalendarEvents** como bloques ocupados
- [ ] Channel ↔ calendar linking (timebox channel + import channel)
- [ ] **TEST:** Crear session en theprimeway → aparece en Google. Borrar en Google → desaparece de theprimeway.

### Sprint 4: Splitting + Workload (1 semana)

**Objetivo:** Tareas largas se acomodan inteligentemente y el usuario ve su carga.

- [ ] **Algoritmo `splitAcrossGaps`** (sección 5)
- [ ] Shift+X prevent split
- [ ] Workload counter en header del día (3 modos cyclables)
- [ ] Custom day thresholds (UI en settings)
- [ ] **TEST:** Task de 90 min con evento en medio → se divide correctamente

### Sprint 5: Auto-Rescheduling + Command Pattern (2 semanas)

**Objetivo:** El núcleo "mágico" — el sistema reacciona a cambios sin invadir.

- [ ] **Sistema `Command` + `CommandManager`** (sección 15)
- [ ] **Algoritmo `deconflict`** (sección 6)
- [ ] **Algoritmo `onTaskCompleted` con regla de contigüidad** (sección 7)
- [ ] Cmd+Z granular (undo del auto, preserva acción del usuario)
- [ ] Cmd+Shift+Z para undo full
- [ ] Setting toggles: `autoRescheduleOnConflict`, `autoRescheduleOnEarlyCompletion`
- [ ] Shift al arrastrar = sin auto-reschedule
- [ ] **TEST exhaustivo:** los ejemplos de las secciones 6 y 7 funcionan exactamente como se describen.

### Sprint 6: Timer + Focus Mode (2 semanas)

**Objetivo:** Trackear actual time y entrar en focus.

- [ ] Modelo `TimerEvent`
- [ ] UI de timer (start/pause/resume/stop)
- [ ] Focus Mode (UI fullscreen sobre una task)
- [ ] Cálculo de `actualTimeMinutes` desde TimerEvents
- [ ] Pomodoro opcional
- [ ] **Algoritmo `onTimerStart` con detector tardío** (sección 8) — modos OFF/PROMPT/AUTO
- [ ] Live session (timer arranca en task sin slot → crear session)
- [ ] **TEST:** los 5 edge cases del detector funcionan.

### Sprint 7: ML ligero (1.5 semanas)

**Objetivo:** Sugerencias automáticas de canal y tiempo.

- [ ] **Función `suggestChannel`** (Naive Bayes, sección 12.1)
- [ ] **Función `estimatePlannedTime`** (similitud, sección 12.2)
- [ ] Async invocation desde `POST /tasks` (no bloquea)
- [ ] WebSocket/SSE para notificar al frontend cuando llegue la sugerencia
- [ ] Settings toggles
- [ ] UI: cuando se aplica auto-asignación, indicar visualmente "via AI" con opción de revertir
- [ ] **TEST:** con 100 tasks históricas, sugiere canales con > 70% accuracy en un dataset sintético

### Sprint 8: Recurring Tasks (1.5 semanas)

**Objetivo:** Tasks que se repiten.

- [ ] Modelo `RecurringSeries`
- [ ] UI para crear/editar series
- [ ] Materialización de instancias (cron diario que crea las del día)
- [ ] Lógica de rollover especial para recurrentes
- [ ] "At roughly time" en auto-schedule
- [ ] Edición: "esta instancia" vs "todas las futuras"

### Sprint 9: Weekly Objectives (1 semana)

- [ ] Modelo `Objective`
- [ ] UI panel lateral
- [ ] Crear, editar, completar
- [ ] Alinear task con objective (shortcut `R`)
- [ ] Crear task desde objective (drag)
- [ ] Extensión a próxima semana
- [ ] Métrica de alineación
- [ ] Propagación de canal con respeto a overrides

### Sprint 10: Daily/Weekly Rituals (1 semana)

- [ ] Daily Planning ritual (UI + flow)
- [ ] Daily Shutdown
- [ ] Weekly Planning + Review
- [ ] Crons para los rollovers automáticos
- [ ] Configuración de horarios de los rituals

### Sprint 11+: Pulir, integraciones, mobile

- Slack, Linear, Notion integrations
- Mobile app (React Native, comparte el backend)
- Pricing y billing
- Analytics interno

---

## 17. Edge cases y gotchas

Lista de cosas que parecen obvias pero rompen el sistema si se ignoran. **La IA que asista al desarrollo debe revisar esta lista antes de implementar cada feature.**

### Timezones

- **Todos los timestamps en DB en UTC.** Convertir a tz del usuario solo en presentación o cuando se calculan días.
- **`task.day` es un `Date` (no datetime).** Pero "el día N en mi timezone" puede ser distinto del "día N UTC". Usar siempre `tz` del user al asignar `day`.
- **Cron jobs ejecutados en UTC** deben checkear si para algún user "ya pasó la medianoche local" para disparar rollover.

### Concurrencia

- **Dos requests concurrentes que mueven sessions** pueden generar overlaps si no se serializan. Solución: lock optimista (campo `version` en `WorkingSession`) o lock pesimista por user.
- **El timer corre en el cliente**, pero `actualTime` se persiste cada N segundos. Si se desconecta, perder los últimos N segundos es aceptable.

### Auto-scheduling gap edge case

- Si `autoSchedulingGap = 5min` y hay un evento `9:00–10:00`, el bloque expandido es `8:55–10:05`. Si el siguiente evento empieza `10:03`, los bloques expandidos se solapan: `[8:55–10:05]` y `[9:58–...]`. Hay que **mergear bloques solapados después de aplicar el gap**, no antes.

### Working sessions del mismo task

- Una task puede tener múltiples sessions el mismo día (split). Al completar la task, **todas las sessions futuras se truncan/borran**, no solo la actual.
- Para el detector de timer tardío: si la task tiene 2 sessions hoy, identificar cuál es "la esperada" requiere lógica (ver `findScheduledSessionForTaskOn`).

### Calendar event que aparece en medio de un día ya planificado

- Sync trae un evento nuevo `14:00–15:00` que cae sobre una WorkingSession existente.
- **Política conservadora:** marcar la session con `hasExternalConflict`, NO mover automáticamente. El usuario verá el conflicto visualmente.
- **Política agresiva (opcional):** ofrecer "reagendar afectadas" como CTA.

### Borrado en cascada

- Borrar una **Task** → cascade delete sus `WorkingSession`s, sus `Subtask`s, sus `TimerEvent`s.
- Borrar un **Channel** → ¿qué pasa con tasks asignadas? Opciones: (a) requerir reasignar antes de borrar, (b) setear `channelId = null`. Recomiendo (a) para evitar pérdida de organización.
- Borrar un **Context** con channels dentro → no permitir, primero borrar/mover los channels.
- Borrar un **CalendarAccount** → cascade delete `ExternalCalendar`s y `CalendarEvent`s.

### Recurring task editada solo "esta instancia"

- Cuando el usuario edita una task recurrente con "solo este": clonar el `templateTaskJson` de la serie, aplicar cambios, marcar la instancia como "edited" (no se sobrescribirá en futuros syncs).
- "Editar todas las futuras": actualizar el `templateTaskJson` de la serie, NO modificar instancias ya materializadas (a menos que el usuario lo pida explícitamente).

### Working hours nulas en algún día

- Si el usuario no tiene working hours definidas para sábado, **sábado NO es laboral** para auto-schedule.
- Pero el usuario puede arrastrar manualmente una task a sábado → eso debe permitirse (manual override siempre gana).
- "Schedule anyway" en el modal Overcommitted ignora working hours.

### Inicio de timer fuera de working hours

- Permitir. El usuario decide. No es invasivo bloquearlo.

### Tasks importadas de integraciones

- Tasks que vienen de Linear, Asana, etc. tienen un `externalRef`. Su título y estado pueden cambiar desde el origen.
- Política: el sync NO sobrescribe ediciones locales del usuario en theprimeway (notes, planned time, channel, day).
- El sync SÍ actualiza estado de completion bidireccional.

### Scenario del usuario: "el cronómetro arranca tarde"

Este es el escenario que originó el doc. Repaso completo:

1. Task "Escribir blog" agendada 2:00–2:30 PM.
2. Son las 3:00 PM, el usuario abre theprimeway y arranca el timer.
3. **Detector tardío detecta delay = 60 min > threshold (15 min)**.
4. Modo `AUTO`: la session se mueve a `3:00–3:30`.
5. **Auto-rescheduler dispara deconflict**: ¿hay alguna otra session en `3:00–3:30`? Si sí, se mueve.
6. Usuario trabaja, completa a las 3:15.
7. **`onTaskCompleted` con `freedMinutes = 15`**: la session se trunca a `3:00–3:15`.
8. **Regla de contigüidad**: el grupo contiguo posterior se mueve 15 min hacia adelante.
9. Si había una task a las 4:00 PM (gap de 45 min, mayor al threshold), NO se toca.
10. Toda la operación es UN SOLO command (con children) → Cmd+Z deshace todo.

### Política contra "death by reschedule"

- Si en la última hora se han ejecutado más de 5 auto-reschedules sobre las mismas sessions, **mostrar un warning** al usuario y sugerir desactivar temporalmente. Evita ciclos de hostigamiento.

---

## Apéndice A: Glosario de funciones helper esperadas

Para no repetir, asumir que existen estas funciones utilitarias:

```typescript
// Date/Time
function startOfDay(d: Date, tz?: string): DateTime;
function endOfDay(d: Date, tz?: string): DateTime;
function addMinutes(d: DateTime, m: number): DateTime;
function subMinutes(d: DateTime, m: number): DateTime;
function diffMinutes(a: DateTime, b: DateTime): number;
function isSameDay(a: DateTime, b: DateTime, tz?: string): boolean;
function dateOf(dt: DateTime, tz?: string): Date;  // extrae la parte de fecha
function combineDateTime(date: Date, time: string, tz: string): DateTime;
function getDayOfWeek(d: Date): number;  // 0=Sun, ..., 6=Sat
function nowInTimezone(tz: string): DateTime;
function startOfWeek(weekKey: string): Date;
function endOfWeek(weekKey: string): Date;

// String similarity (para ML)
function jaroWinkler(a: string, b: string): number;  // 0..1

// Otras
function snapshot<T>(entity: T): T;  // deep clone para command pattern
function unique<T>(arr: T[]): T[];
function mergeOverlapping(blocks: Block[]): Block[];
```

Usar librerías: `date-fns-tz` para timezones, `string-similarity` o implementación propia para Jaro-Winkler.

---

## Apéndice B: Cómo debe leer este documento un agente de IA

Cuando vayas a implementar una feature de theprimeway:

1. **Lee primero la sección 1 (filosofía)** — define el "espíritu" de las decisiones.
2. **Lee la sección 3 (modelo de datos)** completa — cualquier query debe respetar esto.
3. **Identifica qué algoritmo o sistema toca tu feature** y lee SU sección entera.
4. **Revisa la sección 17 (edge cases)** — busca menciones de tu feature.
5. **Cuando dudes entre dos comportamientos**, recuerda: theprimeway sigue la filosofía Sunsama (conservador, asistente, no invasivo) en TODO excepto el detector de timer tardío (sección 8) que es nuestra extensión propia.
6. **Si el código existente contradice este documento**, ASUMIR que el documento es la fuente de verdad y proponer el refactor necesario.
7. **Cualquier setting nuevo** que necesites agregar va en `UserSettings` (sección 3) y se documenta en este archivo.