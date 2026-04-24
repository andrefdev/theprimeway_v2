# ThePrimeWay — Lean Canvas

## Problema

- Tools fragmentados: visión en Notion, tareas en Todoist, hábitos en Habitica, calendario en Google. Nadie conecta las capas.
- Los objetivos anuales mueren. Se escriben en enero, se olvidan en marzo.
- Los hábitos se saltan: viven en checklists que no compiten por tiempo real.
- La mayoría de personas no trackean ni saben cuáles son sus objetivos.
- Hay muchas tareas que se quedan sin completar o no se terminan a tiempo.
- No existe una forma de medir tus logros y progreso mensual no solo de productividad sino también de hábitos y objetivos.
- Las personas se frustran al no saber cómo llevar los objetivos a acciones concretas.
- Existe mucha fricción entre la planificación y la acción.

**Alternativas actuales:** stack de 3-4 apps · Motion (IA agresiva) · papel.

## Segmentos de clientes

**Early adopter (beachhead):**
- Founders solopreneurs 25-40, ya pagan Sunsama o Notion Pro, leen Cal Newport / Clear / Grove.

**Expansión:**
- Operadores y ejecutivos mid-senior en startups.
- Creators y knowledge workers con proyectos long-horizon.
- Atletas y estudiantes de élite (medicina, derecho, oposiciones).

**NO target v1:** equipos colaborativos, enterprise, casuales.

## Propuesta única de valor (UVP)

> La única app donde la conexión entre "lo que estoy haciendo a las 3 PM" y "quién quiero ser en 10 años" está a un clic y es visualmente clara.

## Solución

- Grafo único: Visión 10y → 3y → 1y → Q → Semana → Tarea → Sesión → Hábito.
- Motor de scheduling para tareas.
- Hábitos como tareas con `identityStatement` que ocupan tiempo en el calendario.
- Rituales estructurados: Daily Plan, Weekly Review, Quarterly Review.
- Focus Mode single-window, sin notificaciones.
- AI que te guía y te ayuda a ver qué hábitos, tareas y rutinas son de valor para ti.
- Gamificación que te motiva a cumplir lo que te propones.

## Canales

**Orgánico (febrero – agosto 2026):**
- Blog founder-led (deep work, identidad).
- Instagram founder-led.
- Embajadores de marca.
- Instagram.
- TikTok.
- LinkedIn.
- Product Hunt launch.
- Startup Fame.
- 12 Tools.
- Dang.ai.
- Invitaciones a podcasts.
- Comunidades: IndieHackers, r/productivity, Discord founders.
- Twitter/X build-in-public.

**Pago (launch agosto – diciembre):**
- Meta Ads.
- Páginas de noticias (ejemplo: Startups LATAM).
- Google Ads.

## Fuentes de ingreso

- **Free — $0** — Visión + objetivos + tareas + hábitos + Google Calendar + Focus Mode + motor completo.
- **Pro — $9/mes** — Rituales + ML suggestions + Fenrir AI.
- **Anual con 20% de descuento** → Pro $96/año.

**Futuro:** API + webhooks de pago · Zapier/Make · posible tier "Coach" con humanos (no v1).

## Estructura de costos

**Fijos (bajos):**
- Infra: VPS + Postgres + Google Calendar API → ~$10-120/mes hasta 5k usuarios.
- Stripe fees ~3% del revenue.
- Dominios, email transaccional, monitoring → $5.

**Variables:**
- Desarrollo: founder-led + agentes IA (Claude Code) → coste marginal bajo.
- Adquisición: orgánico primero. Paid solo con CAC validado.
- Pauta → ~$1.500.

**No gastamos en:** oficinas, equipos grandes, conferencias, publicidad pre-PMF.

## Métricas clave

**North Star:** WAU con ≥1 ritual/sem y ≥60% del tiempo alineado a objetivos.

- Activación: % nuevos completando primer Daily Plan en sem. 1 → 50%
- Engagement: % WAU con ≥4 Daily Plans/sem → 35%
- Profundidad: % usuarios con ≥1 objetivo anual activo → 60%
- Loop closure: % usuarios completando Weekly Review → 25%
- Retención W4 → 45%

**Anti-métricas:** total tareas creadas · tiempo en app.

## Ventaja injusta

- Data longitudinal de rituales: histórico que se vuelve moat emocional.
- Grafo visión-tarea integrado en el data model (imposible de retrofit en Sunsama).
- Rituales como forma de uso, no feature.
- Identidad > gamificación. Habitica engancha niños; nosotros anclamos adultos.
- Founder-operator es target user.
- Timing: Sunsama plafonando, Motion con churn por exceso de IA.
- Modelo de IA destilado para productividad.

## Hipótesis a validar

- **H1** · Target paga $14/mes por este producto → 20+ entrevistas + pre-ventas · Pendiente.
- **H2** · Rituales se usan ≥4 veces/semana post-onboarding → cohort analysis Phase 3 · Pendiente.
- **H3** · La capa de visión 10y no asusta (progressive disclosure funciona) → A/B en onboarding · Pendiente.
- **H4** · Desktop-first antes que mobile es correcto → retención por plataforma · Pendiente.
- **H5** · Orgánico founder-led genera CAC < $50 → 6 meses de content · Pendiente.
- **H6** · Usuarios Sunsama migran por la capa de visión → conversión desde landing "alternative to Sunsama" · Pendiente.
- **H7** · Tagline: *Get to know the way with theprimeway*.
  - Posible tagline: *Estás acá, quieres llegar allá y theprimeway es el puente.*
  - Posible tagline: *El sistema operativo de ejecución para personas de alto rendimiento.*

## Riesgos

- **Visión 10y se siente burocrática → bounce.** Mitigación: progressive disclosure. Onboarding pide solo la visión; 3y/1y/Q aparecen cuando el usuario los pide.
- **Motor de scheduling con bugs → pérdida de confianza.** Mitigación: undo granular desde día 1, doc público "cómo piensa", defaults conservadores.
- **Sunsama / Motion copian el vertical.** Mitigación: speed + data longitudinal + profundidad del grafo. Ventana 18-24 meses.
- **Calendar sync edge cases (timezones, recurrencias).** Mitigación: Google-only v1. Outlook Phase 2. iCloud Phase 4. 30% del sprint en fixtures.
- **Founder burnout (single operator).** Mitigación: agentes IA para dev. Discord para soporte. Scope cerrado por fases.
- **Precio alto para estudiantes/atletas.** Mitigación: tier educativo futuro. Free tier genuinamente útil.