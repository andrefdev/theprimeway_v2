# ThePrimeWay — Propuesta Única de Valor

> **Versión comercial · Abril 2026**
> Documento para pitch de producto, landing, sales decks y conversaciones con inversores.

---

## 1. Tagline

**El sistema operativo de ejecución para personas de alto rendimiento.**

Conecta tu visión a 10 años con el bloque de 25 minutos que trabajas esta tarde — sin perder la línea que los une.

---

## 2. El problema

Las personas de alto rendimiento viven rotas entre herramientas:

- **Notion / Docs** → guardan la visión, pero no ejecutan.
- **Sunsama / Motion / Akiflow** → agendan el día, pero no saben a qué vida sirves.
- **Habitica / Streaks** → motivan hábitos, pero viven en una pestaña aparte.
- **Google Calendar** → muestra tiempo, pero no prioridad.

Resultado: el lunes no recuerdas para qué haces lo que haces. Los hábitos se saltan porque no compiten por tiempo real. Los objetivos anuales mueren en enero.

**Nadie une visión → objetivo → semana → tarea → bloque de foco → hábito.** Ese es el hueco.

---

## 3. La PUV en una frase

> **ThePrimeWay es la única app donde la conexión entre "lo que estoy haciendo a las 3 PM" y "quién quiero ser en 10 años" está a un clic y es visualmente obvia.**

---

## 4. Las tres apuestas estratégicas

### 4.1. Vertical coherente
Un solo grafo: **Visión 10 años → Objetivos 3 años → 1 año → Trimestre → Semana → Tarea → Sesión de trabajo → Hábito**. Los competidores fragmentan esto en apps distintas sin diálogo entre capas.

### 4.2. Loop de ejecución calidad Sunsama
Motor de scheduling determinista y conservador. El usuario confía porque el sistema no re-optimiza el día a sus espaldas. Nada se mueve sin que lo sepas.

### 4.3. Rituales como columna vertebral
El tiempo se estructura con **rituales** (Daily Plan, Daily Shutdown, Weekly Plan, Weekly Review, Quarterly Reflection), no con pantallas. Los rituales son el puente entre visión y ejecución.

---

## 5. Público objetivo

**Founders, operadores, creators, ejecutivos, atletas y estudiantes de élite** — personas que ya saben que la productividad genérica no les alcanza:

- Leen a Andy Grove, Cal Newport, James Clear, Tim Ferriss.
- Tienen objetivos a 3+ años y les duele no avanzarlos.
- Ya usan calendario, tareas y tal vez hábitos — pero en apps separadas.
- Pagan por Sunsama, Motion, Notion Pro, o los usan sin satisfacción.
- Valoran **predictibilidad** sobre optimización mágica, **profundidad** sobre features.

No es para quien quiere gamificación infantil, ni para equipos colaborativos (v1 es single-player).

---

## 6. Producto — cuatro capas

### 6.1. Visión (la brújula)
Declaración a 10 años + valores + afirmaciones de identidad. **Singleton.** Una sola visión, una sola vida.

### 6.2. Objetivos (la arquitectura)
Jerarquía en grafo: 3 años → 1 año → trimestre → semana. Toda tarea muestra su cadena hasta la visión con un chip tipográfico ("→ Become a CTO → Lead architecture → Ship platform v2").

### 6.3. Ejecución (el motor)
- **Tareas** con `kind: TASK | HABIT`.
- **Working Sessions** — el "cuándo" de cada tarea en el calendario.
- **Motor de scheduling** con cinco algoritmos: Auto-Schedule, Splitting, Deconflict, Early-Completion Reflow, Late-Timer Detector.
- **Sincronización Google Calendar** bidireccional (ya operativa).
- **Focus Mode** pantalla completa, single-window, sin notificaciones.

### 6.4. Hábitos (la identidad)
No son checklist aparte — son tareas con `identityStatement` ("soy alguien que..."), vinculadas a la visión que sirven, y **compiten por tiempo real en el calendario**. Por eso se hacen.

### 6.5. Rituales (la disciplina)
Slide-overs programados que no te llevan a otra pantalla:
- **Daily Plan** (mañana) · **Daily Shutdown** (18:00)
- **Weekly Plan** (domingo) · **Weekly Review** (viernes)
- **Quarterly & Annual Review**

Cada ritual produce artefactos persistentes (reflexiones, snapshots), que alimentan el review siguiente y la IA.

---

## 7. Diferenciadores vs. competencia

| Capacidad | Sunsama | Motion | Notion | Habitica | **ThePrimeWay** |
|---|---|---|---|---|---|
| Visión 10 años → tarea hoy | ❌ | ❌ | parcial | ❌ | ✅ |
| Scheduling conservador con undo | ✅ | ❌ | ❌ | ❌ | ✅ |
| Hábitos en el calendario real | ❌ | ❌ | ❌ | ❌ | ✅ |
| Rituales estructurados | parcial | ❌ | ❌ | ❌ | ✅ |
| Chip visión-tarea en cada bloque | ❌ | ❌ | ❌ | ❌ | ✅ |
| Focus Mode single-window | ❌ | ❌ | ❌ | ❌ | ✅ |
| Captura cmd-K natural-language | ❌ | ✅ | ❌ | ❌ | ✅ |
| Precio entrada | $20 | $34 | $10 | $5 | **$14** |

**Lectura:** Sunsama domina el ritual diario. Motion domina la optimización. Notion domina la estructura. Habitica domina los hábitos. **Nadie une las cuatro capas.** Esa es nuestra posición.

---

## 8. Qué NO somos

- No somos herramienta de equipos (sin asignaciones, comentarios, workspaces compartidos).
- No somos auto-planner IA tipo Motion. La IA se invoca — nunca actúa sola.
- No somos Notion. Las notas van adjuntas a tareas/objetivos/sesiones, no son el producto.
- No somos gamificación infantil. La motivación viene de la identidad, no de puntos.
- **Ya no somos** gestor de finanzas, notas, lectura ni libros — fueron pivots abandonados. Foco total en hábitos, objetivos, tareas y calendario.

---

## 9. El día de un usuario

**Domingo 20:00** — Weekly Plan: revisas objetivos anuales, eliges 3–5 objetivos semanales, arrastras tareas a días.

**Lunes 08:00** — Daily Plan: fijas el *highlight* del día, presionas `X` en cada tarea, el motor las encaja en huecos reales del calendario respetando eventos y horario laboral.

**Día** — Presionas `F` en una tarea → Focus Mode pantalla completa → timer → completas → las tareas contiguas se desplazan automáticamente hacia adelante (Early-Completion Reflow).

**18:00** — Daily Shutdown: revisas wins, eliges highlight de mañana, refleccionas una línea. Separación limpia trabajo/descanso.

**Viernes 17:00** — Weekly Review: puntúas objetivos, alignment % sale automático, carry-over a la próxima semana.

**Cada trimestre** — Vision Review: retiras objetivos, avanzas la brújula, actualizas el grafo de tres años si la realidad cambió.

---

## 10. Mensajes clave para el pitch

### 10.1. Mensaje de apertura (founder-to-founder)
> "Tienes una visión a 10 años en un doc de Notion que abres tres veces al año. Tienes tareas en Sunsama que haces cada día. **No existe nada que conecte las dos.** Eso es lo que construimos."

### 10.2. Mensaje de producto (usuario potencial)
> "Cada bloque de tiempo en tu calendario muestra a qué objetivo de vida sirve. Cada hábito compite por tiempo real. Cada semana cierras un loop con un review estructurado. Y el scheduling es conservador — nada se mueve sin tu permiso."

### 10.3. Mensaje de inversión
> "La categoría *Vision-to-Execution OS* aún no existe. Sunsama ($95M ARR) domina ejecución. Notion ($10B valuation) domina estructura. Nadie une las dos. Nosotros sí. Precio agresivo ($14 vs $20 de Sunsama), vertical defensible, moat en los rituales y la data longitudinal que generan."

### 10.4. Mensaje one-liner
> "Sunsama + visión de vida + hábitos que sí se hacen."

---

## 11. Modelo de precios

| Plan | Precio | Incluye |
|---|---|---|
| **Free** | $0 | Visión + objetivos + tareas + hábitos. Sin sync calendario, sin motor de scheduling, sin Focus Mode. |
| **Pro** | **$14/mes** | Motor completo, Google Calendar sync, rituales, Focus Mode, sugerencias ML. |
| **Lifestyle** | **$24/mes** | Multi-dispositivo, prompts de reflexión avanzados, integraciones (Slack/Linear/Notion read-only), API. |

**Lógica:** el free tier entrega lo que Sunsama *no puede dar* (visión + estructura). El pago se justifica por el tiempo (motor + calendario + focus). Lifestyle para power users.

---

## 12. Moat defensivo

1. **Data longitudinal** — reviews semanales/trimestrales acumulan histórico que ningún competidor puede replicar copiando features.
2. **Grafo visión-tarea** — muy caro de retrofit en Sunsama o Motion sin romper su core.
3. **Rituales con artefactos** — no es un feature, es una forma de uso. Una vez el usuario cierra loops semanales, cambiar de app significa perder la narrativa de su propia vida.
4. **Identidad sobre gamificación** — el usuario asocia hábitos a quién quiere ser. Motivación duradera.

---

## 13. North Star y validación

**North Star:** usuarios activos semanales que completan ≥ 1 ritual/semana y tienen ≥ 60% de tiempo ejecutado alineado a objetivos.

No optimizamos:
- Tareas creadas (vanity).
- Tiempo en la app (queremos que termines y cierres).
- Integraciones activadas (profundidad > amplitud).

---

## 14. Llamada a acción

**Para usuarios:** "Configura tu visión a 10 años en 5 minutos. Mañana por la mañana tu día estará agendado contra ella."

**Para inversores:** "Sunsama-grade execution + vertical único de alineación de vida. Categoría nueva, timing correcto, precio agresivo."

**Para partners / integraciones:** "Somos el layer de intención sobre el calendario. Cualquier fuente de captura (Slack, Gmail, Linear) puede alimentarnos; cualquier calendario puede sincronizar."

---

*Documento vivo. Actualizar cuando cambien capas de producto, precio o posicionamiento. Fuente técnica: `NEW_FEATURES_GUIDE.md`. Fuente algorítmica: `Motor de Scheduling Inteligente — theprimeway`.*
