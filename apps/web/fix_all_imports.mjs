#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// Map of kebab-case to PascalCase component names
const KEBAB_TO_PASCAL = {
  'upgrade-prompt': 'UpgradePrompt',
  'query-error': 'QueryError',
  'action-buttons': 'ActionButtons',
  'quarterly-goals': 'QuarterlyGoals',
  'weekly-goals': 'WeeklyGoals',
  'journey-view': 'JourneyView',
  'habit-tracker': 'HabitTracker',
  'habits-stats': 'HabitsStats',
  'habits-filters': 'HabitsFilters',
  'habit-ai-insights': 'HabitAIInsights',
  'chat-message': 'ChatMessage',
  'chat-input': 'ChatInput',
  'briefing-card': 'BriefingCard',
  'month-view': 'MonthView',
  'week-view': 'WeekView',
  'day-detail': 'DayDetail',
  'dashboard-stats': 'DashboardStats',
  'overdue-tasks-banner': 'OverdueTasksBanner',
  'dashboard-quick-actions': 'DashboardQuickActions',
  'today-tasks-list': 'TodayTasksList',
  'finances-nav': 'FinancesNav',
  'financial-summary-cards': 'FinancialSummaryCards',
  'budget-performance': 'BudgetPerformance',
  'cash-flow-analysis': 'CashFlowAnalysis',
  'expenses-category-chart': 'ExpensesCategoryChart',
  'monthly-trends-chart': 'MonthlyTrendsChart',
  'savings-goals-progress': 'SavingsGoalsProgress',
  'gamification-widget': 'GamificationWidget',
  'day-planner': 'DayPlanner',
  'week-planner': 'WeekPlanner',
  'task-group': 'TaskGroup',
  'task-dialog': 'TaskDialog',
  'archive-panel': 'ArchivePanel',
  'tasks-nav': 'TasksNav',
  'note-card': 'NoteCard',
  'notes-nav': 'NotesNav',
  'tags-filter': 'TagsFilter',
  'reading-nav': 'ReadingNav',
  'book-detail-dialog': 'BookDetailDialog',
  'book-card': 'BookCard',
  'reading-stats': 'ReadingStats',
  'pomodoro-timer': 'PomodoroTimer',
  'pomodoro-session-list': 'PomodoroSessionList',
  'notifications-preferences': 'NotificationsPreferences',
}

function walkTs(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      walkTs(full)
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      let content = readFileSync(full, 'utf8')
      let changed = false
      
      // For each kebab-case name, replace all variations in import statements
      for (const [kebab, pascal] of Object.entries(KEBAB_TO_PASCAL)) {
        // Match patterns like: from 'path/kebab-case' or from "path/kebab-case" or from `path/kebab-case`
        const regex = new RegExp(`(from\s+['"\`][^'"\`]*/)${kebab}(['"\`])`, 'g')
        if (regex.test(content)) {
          content = content.replace(regex, `$1${pascal}$2`)
          changed = true
        }
      }
      
      if (changed) {
        console.log(`✏️  ${full.replace(process.cwd(), '.')}`)
        writeFileSync(full, content, 'utf8')
      }
    }
  }
}

walkTs('src/routes')
console.log('✅ Done!')
