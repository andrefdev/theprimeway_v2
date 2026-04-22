/**
 * Achievement catalog — source of truth.
 *
 * Adding a new achievement:
 *   1. Append an entry here.
 *   2. Ensure the `condition.type` is registered in
 *      `services/gamification/condition-registry.ts` (or register a new type there).
 *   3. Restart API (or call `POST /gamification/achievements/seed`).
 *
 * Fields:
 *   - `key`         stable unique id used for upsert (never change once released)
 *   - `category`    streaks | tasks | habits | pomodoro | milestones | ranks | ...
 *   - `condition`   { type, value }  — type must match a registered evaluator
 *   - `rarity`      common | rare | epic | legendary
 *   - `sortOrder`   display order within category
 */

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface AchievementDefinition {
  key: string
  category: string
  titleEn: string
  titleEs: string
  descEn: string
  descEs: string
  condition: { type: string; value: number | string }
  xpReward: number
  rarity: AchievementRarity
  sortOrder: number
  icon?: string
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // ---------- Streaks ----------
  { key: 'streak_3',  category: 'streaks', titleEn: '3-Day Streak',        titleEs: 'Racha de 3 días',       descEn: 'Maintain a 3-day streak',   descEs: 'Mantén una racha de 3 días',  condition: { type: 'streak_days', value: 3 },  xpReward: 25,  rarity: 'common',    sortOrder: 1 },
  { key: 'streak_7',  category: 'streaks', titleEn: '7-Day Streak',        titleEs: 'Racha de 7 días',       descEn: 'Maintain a 7-day streak',   descEs: 'Mantén una racha de 7 días',  condition: { type: 'streak_days', value: 7 },  xpReward: 75,  rarity: 'common',    sortOrder: 2 },
  { key: 'streak_14', category: 'streaks', titleEn: 'Fortnight Warrior',   titleEs: 'Guerrero de 2 Semanas', descEn: 'Maintain a 14-day streak',  descEs: 'Mantén una racha de 14 días', condition: { type: 'streak_days', value: 14 }, xpReward: 150, rarity: 'rare',      sortOrder: 3 },
  { key: 'streak_30', category: 'streaks', titleEn: 'Monthly Master',      titleEs: 'Maestro del Mes',       descEn: 'Maintain a 30-day streak',  descEs: 'Mantén una racha de 30 días', condition: { type: 'streak_days', value: 30 }, xpReward: 300, rarity: 'epic',      sortOrder: 4 },
  { key: 'streak_90', category: 'streaks', titleEn: 'Legendary Dedication',titleEs: 'Dedicación Legendaria', descEn: 'Maintain a 90-day streak',  descEs: 'Mantén una racha de 90 días', condition: { type: 'streak_days', value: 90 }, xpReward: 750, rarity: 'legendary', sortOrder: 5 },

  // ---------- Tasks ----------
  { key: 'first_task',  category: 'tasks', titleEn: 'Task Starter', titleEs: 'Iniciador de Tareas', descEn: 'Complete your first task', descEs: 'Completa tu primera tarea', condition: { type: 'tasks_completed', value: 1 },   xpReward: 10,   rarity: 'common',    sortOrder: 6 },
  { key: 'task_master', category: 'tasks', titleEn: 'Task Master',  titleEs: 'Maestro de Tareas',   descEn: 'Complete 10 tasks',        descEs: 'Completa 10 tareas',        condition: { type: 'tasks_completed', value: 10 },  xpReward: 50,   rarity: 'common',    sortOrder: 7 },
  { key: 'century',     category: 'tasks', titleEn: 'Century Club', titleEs: 'Club del Siglo',      descEn: 'Complete 100 tasks',       descEs: 'Completa 100 tareas',       condition: { type: 'tasks_completed', value: 100 }, xpReward: 250,  rarity: 'rare',      sortOrder: 8 },
  { key: 'task_legend', category: 'tasks', titleEn: 'Task Legend',  titleEs: 'Leyenda de Tareas',   descEn: 'Complete 500 tasks',       descEs: 'Completa 500 tareas',       condition: { type: 'tasks_completed', value: 500 }, xpReward: 1000, rarity: 'legendary', sortOrder: 9 },

  // ---------- Habits ----------
  { key: 'first_habit',   category: 'habits', titleEn: 'Habit Starter',      titleEs: 'Iniciador de Hábitos', descEn: 'Log your first habit',         descEs: 'Registra tu primer hábito',          condition: { type: 'habit_logs', value: 1 },   xpReward: 10,  rarity: 'common', sortOrder: 10 },
  { key: 'habit_week',    category: 'habits', titleEn: 'Weekly Warrior',     titleEs: 'Guerrero Semanal',     descEn: 'Log 7 habit entries',          descEs: 'Registra 7 entradas de hábitos',     condition: { type: 'habit_logs', value: 7 },   xpReward: 50,  rarity: 'common', sortOrder: 11 },
  { key: 'habit_century', category: 'habits', titleEn: 'Habit Centurion',    titleEs: 'Centurión de Hábitos', descEn: 'Log 100 habit entries',        descEs: 'Registra 100 entradas de hábitos',   condition: { type: 'habit_logs', value: 100 }, xpReward: 300, rarity: 'epic',   sortOrder: 12 },

  // ---------- Pomodoro ----------
  { key: 'first_pomodoro', category: 'pomodoro', titleEn: 'Focus Starter', titleEs: 'Iniciador de Enfoque', descEn: 'Complete your first Pomodoro', descEs: 'Completa tu primer Pomodoro',    condition: { type: 'pomodoro_sessions', value: 1 },  xpReward: 10, rarity: 'common', sortOrder: 13 },
  { key: 'flow_state',     category: 'pomodoro', titleEn: 'Flow State',    titleEs: 'Estado de Flujo',      descEn: 'Complete 10 Pomodoro sessions', descEs: 'Completa 10 sesiones Pomodoro', condition: { type: 'pomodoro_sessions', value: 10 }, xpReward: 75, rarity: 'rare',   sortOrder: 14 },

  // ---------- Milestones ----------
  { key: 'goal_setter',     category: 'milestones', titleEn: 'Goal Setter',        titleEs: 'Establecedor de Objetivos', descEn: 'Create your first goal',     descEs: 'Crea tu primer objetivo',        condition: { type: 'goals_created', value: 1 },         xpReward: 25,  rarity: 'common', sortOrder: 15 },
  { key: 'quarterly_done',  category: 'milestones', titleEn: 'Quarterly Champion', titleEs: 'Campeón del Trimestre',     descEn: 'Complete a quarterly goal',  descEs: 'Completa un objetivo trimestral', condition: { type: 'quarterly_progress', value: 100 }, xpReward: 500, rarity: 'epic',   sortOrder: 16 },
  { key: 'first_1000_xp',   category: 'milestones', titleEn: 'Thousand Ascender',  titleEs: 'Ascendente de Mil',         descEn: 'Earn 1,000 XP',              descEs: 'Gana 1,000 XP',                   condition: { type: 'total_xp', value: 1000 },          xpReward: 100, rarity: 'common', sortOrder: 17 },
  { key: 'ten_k_xp',        category: 'milestones', titleEn: 'XP Titan',           titleEs: 'Titán XP',                  descEn: 'Earn 10,000 XP',             descEs: 'Gana 10,000 XP',                  condition: { type: 'total_xp', value: 10000 },         xpReward: 500, rarity: 'rare',   sortOrder: 18 },

  // ---------- Ranks ----------
  { key: 'rank_d', category: 'ranks', titleEn: 'Rank D Achieved', titleEs: 'Rango D Alcanzado',   descEn: 'Reach Rank D', descEs: 'Alcanza el Rango D', condition: { type: 'reach_rank', value: 'D' }, xpReward: 50,   rarity: 'common',    sortOrder: 19 },
  { key: 'rank_s', category: 'ranks', titleEn: 'S-Rank Legend',   titleEs: 'Leyenda de Rango S',  descEn: 'Reach Rank S', descEs: 'Alcanza el Rango S', condition: { type: 'reach_rank', value: 'S' }, xpReward: 2000, rarity: 'legendary', sortOrder: 20 },
]
