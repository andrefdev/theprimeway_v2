#!/usr/bin/env node
/**
 * rename-to-pascal.mjs
 *
 * Migration script: renames component files from kebab-case to PascalCase
 * and updates all import paths accordingly.
 *
 * Usage:
 *   node scripts/rename-to-pascal.mjs --dry-run    # Preview changes
 *   node scripts/rename-to-pascal.mjs               # Execute migration
 */

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const DRY_RUN = process.argv.includes('--dry-run')
const WEB_SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

console.log(`\n📁 Web source directory: ${WEB_SRC}`)
console.log(`${DRY_RUN ? '🔍 DRY RUN MODE' : '⚡ EXECUTION MODE'}\n`)

// ─────────────────────────────────────────────────────────────────────────────
// RENAME MAPPING
// ─────────────────────────────────────────────────────────────────────────────

const RENAMES = {
  'features/ai/components/briefing-card.tsx': 'BriefingCard.tsx',
  'features/ai/components/chat-input.tsx': 'ChatInput.tsx',
  'features/ai/components/chat-message.tsx': 'ChatMessage.tsx',
  'features/auth/components/oauth-buttons.tsx': 'OAuthButtons.tsx',
  'features/calendar/components/day-detail.tsx': 'DayDetail.tsx',
  'features/calendar/components/month-view.tsx': 'MonthView.tsx',
  'features/calendar/components/week-view.tsx': 'WeekView.tsx',
  'features/dashboard/components/dashboard-quick-actions.tsx': 'DashboardQuickActions.tsx',
  'features/dashboard/components/dashboard-stats.tsx': 'DashboardStats.tsx',
  'features/dashboard/components/overdue-tasks-banner.tsx': 'OverdueTasksBanner.tsx',
  'features/dashboard/components/today-tasks-list.tsx': 'TodayTasksList.tsx',
  'features/finances/components/finances-nav.tsx': 'FinancesNav.tsx',
  'features/finances/components/overview/budget-performance.tsx': 'BudgetPerformance.tsx',
  'features/finances/components/overview/cash-flow-analysis.tsx': 'CashFlowAnalysis.tsx',
  'features/finances/components/overview/expenses-category-chart.tsx': 'ExpensesCategoryChart.tsx',
  'features/finances/components/overview/financial-summary-cards.tsx': 'FinancialSummaryCards.tsx',
  'features/finances/components/overview/monthly-trends-chart.tsx': 'MonthlyTrendsChart.tsx',
  'features/finances/components/overview/savings-goals-progress.tsx': 'SavingsGoalsProgress.tsx',
  'features/gamification/components/achievements-list.tsx': 'AchievementsList.tsx',
  'features/gamification/components/daily-challenges.tsx': 'DailyChallenges.tsx',
  'features/gamification/components/gamification-widget.tsx': 'GamificationWidget.tsx',
  'features/gamification/components/player-hud.tsx': 'PlayerHud.tsx',
  'features/gamification/components/streak-calendar.tsx': 'StreakCalendar.tsx',
  'features/goals/components/journey-view.tsx': 'JourneyView.tsx',
  'features/goals/components/quarterly-goals.tsx': 'QuarterlyGoals.tsx',
  'features/goals/components/weekly-goals.tsx': 'WeeklyGoals.tsx',
  'features/habits/components/habit-ai-insights.tsx': 'HabitAIInsights.tsx',
  'features/habits/components/habit-tracker.tsx': 'HabitTracker.tsx',
  'features/habits/components/habits-filters.tsx': 'HabitsFilters.tsx',
  'features/habits/components/habits-stats.tsx': 'HabitsStats.tsx',
  'features/notes/components/note-card.tsx': 'NoteCard.tsx',
  'features/notes/components/notes-nav.tsx': 'NotesNav.tsx',
  'features/notes/components/tags-filter.tsx': 'TagsFilter.tsx',
  'features/notifications/components/notif-toggle.tsx': 'NotifToggle.tsx',
  'features/notifications/components/notifications-preferences.tsx': 'NotificationsPreferences.tsx',
  'features/onboarding/components/onboarding-wizard.tsx': 'OnboardingWizard.tsx',
  'features/personalization/components/cover-gallery.tsx': 'CoverGallery.tsx',
  'features/personalization/components/icon-picker.tsx': 'IconPicker.tsx',
  'features/pomodoro/components/pomodoro-controls.tsx': 'PomodoroControls.tsx',
  'features/pomodoro/components/pomodoro-mode-selector.tsx': 'PomodoroModeSelector.tsx',
  'features/pomodoro/components/pomodoro-session-list.tsx': 'PomodoroSessionList.tsx',
  'features/pomodoro/components/pomodoro-stats.tsx': 'PomodoroStats.tsx',
  'features/pomodoro/components/pomodoro-timer.tsx': 'PomodoroTimer.tsx',
  'features/profile/components/profile-card.tsx': 'ProfileCard.tsx',
  'features/profile/components/profile-gamification-stats.tsx': 'ProfileGamificationStats.tsx',
  'features/reading/components/book-card.tsx': 'BookCard.tsx',
  'features/reading/components/book-detail-dialog.tsx': 'BookDetailDialog.tsx',
  'features/reading/components/reading-nav.tsx': 'ReadingNav.tsx',
  'features/reading/components/reading-stats.tsx': 'ReadingStats.tsx',
  'features/settings/components/change-password-form.tsx': 'ChangePasswordForm.tsx',
  'features/settings/components/danger-zone.tsx': 'DangerZone.tsx',
  'features/settings/components/preferences-form.tsx': 'PreferencesForm.tsx',
  'features/subscriptions/components/plan-card.tsx': 'PlanCard.tsx',
  'features/subscriptions/components/premium-guard.tsx': 'PremiumGuard.tsx',
  'features/subscriptions/components/upgrade-prompt.tsx': 'UpgradePrompt.tsx',
  'features/tasks/components/archive-panel.tsx': 'ArchivePanel.tsx',
  'features/tasks/components/day-planner.tsx': 'DayPlanner.tsx',
  'features/tasks/components/task-dialog.tsx': 'TaskDialog.tsx',
  'features/tasks/components/task-group.tsx': 'TaskGroup.tsx',
  'features/tasks/components/tasks-nav.tsx': 'TasksNav.tsx',
  'features/tasks/components/week-planner.tsx': 'WeekPlanner.tsx',
  'components/action-buttons.tsx': 'ActionButtons.tsx',
  'components/completion-toggle.tsx': 'CompletionToggle.tsx',
  'components/create-modal.tsx': 'CreateModal.tsx',
  'components/currency-amount.tsx': 'CurrencyAmount.tsx',
  'components/currency-config-panel.tsx': 'CurrencyConfigPanel.tsx',
  'components/currency-input.tsx': 'CurrencyInput.tsx',
  'components/currency-selector.tsx': 'CurrencySelector.tsx',
  'components/error-boundary.tsx': 'ErrorBoundary.tsx',
  'components/filter-bar.tsx': 'FilterBar.tsx',
  'components/icon-selector.tsx': 'IconSelector.tsx',
  'components/icons.tsx': 'Icons.tsx',
  'components/query-error.tsx': 'QueryError.tsx',
  'components/section-header.tsx': 'SectionHeader.tsx',
  'components/section-tabs.tsx': 'SectionTabs.tsx',
  'components/stat-card.tsx': 'StatCard.tsx',
  'components/task-item.tsx': 'TaskItem.tsx',
  'components/data-grid/data-grid.tsx': 'DataGrid.tsx',
  'components/data-grid/data-grid-cell.tsx': 'DataGridCell.tsx',
  'components/data-grid/data-grid-cell-variants.tsx': 'DataGridCellVariants.tsx',
  'components/data-grid/data-grid-cell-wrapper.tsx': 'DataGridCellWrapper.tsx',
  'components/data-grid/data-grid-column-header.tsx': 'DataGridColumnHeader.tsx',
  'components/data-grid/data-grid-context-menu.tsx': 'DataGridContextMenu.tsx',
  'components/data-grid/data-grid-keyboard-shortcuts.tsx': 'DataGridKeyboardShortcuts.tsx',
  'components/data-grid/data-grid-paste-dialog.tsx': 'DataGridPasteDialog.tsx',
  'components/data-grid/data-grid-row-height-menu.tsx': 'DataGridRowHeightMenu.tsx',
  'components/data-grid/data-grid-row.tsx': 'DataGridRow.tsx',
  'components/data-grid/data-grid-search.tsx': 'DataGridSearch.tsx',
  'components/data-grid/data-grid-sort-menu.tsx': 'DataGridSortMenu.tsx',
  'components/data-grid/data-grid-view-menu.tsx': 'DataGridViewMenu.tsx',
  'components/editor/tiptap-editor.tsx': 'TiptapEditor.tsx',
  'components/editor/toolbar.tsx': 'Toolbar.tsx',
  'components/error/feature-error-boundary.tsx': 'FeatureErrorBoundary.tsx',
  'components/error/unhandled-error-listener.tsx': 'UnhandledErrorListener.tsx',
  'components/layout/mobile-bottom-nav.tsx': 'MobileBottomNav.tsx',
  'components/layout/sidebar.tsx': 'Sidebar.tsx',
  'components/layout/topbar.tsx': 'Topbar.tsx',
}

// Build reverse lookup: old stem (no .tsx) → new stem (no .tsx)
const STEM_MAP = {}
for (const [oldRel, newBase] of Object.entries(RENAMES)) {
  const oldStem = basename(oldRel, '.tsx')
  const newStem = basename(newBase, '.tsx')
  STEM_MAP[oldStem] = newStem
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1: FILE RENAMING
// ─────────────────────────────────────────────────────────────────────────────

console.log('📦 PHASE 1: Renaming files...\n')

let renamedCount = 0
for (const [oldRel, newBase] of Object.entries(RENAMES)) {
  const dir = dirname(oldRel)
  const oldBase = basename(oldRel)
  const srcFull = join(WEB_SRC, oldRel)
  const tempFull = join(WEB_SRC, dir, oldBase + '.TEMP')
  const finalFull = join(WEB_SRC, dir, newBase)

  console.log(`  ${oldBase} → ${newBase}`)

  if (!DRY_RUN) {
    try {
      // Two-step rename required on Windows (case-insensitive FS)
      execSync(`git mv "${srcFull}" "${tempFull}"`, { cwd: REPO_ROOT })
      execSync(`git mv "${tempFull}" "${finalFull}"`, { cwd: REPO_ROOT })
      renamedCount++
    } catch (e) {
      console.error(`    ❌ Failed: ${e.message}`)
    }
  } else {
    renamedCount++
  }
}

console.log(`\n✅ Renamed ${renamedCount} files\n`)

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2: UPDATE IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

console.log('🔗 PHASE 2: Updating import paths...\n')

function walkTs(dir, cb) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      // Skip: node_modules, ui (shadcn), routes (keep kebab-case)
      if (['node_modules', 'ui', 'routes'].includes(entry.name)) continue
      walkTs(full, cb)
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      cb(full)
    }
  }
}

let updatedFiles = 0
walkTs(WEB_SRC, (filePath) => {
  let content = readFileSync(filePath, 'utf8')
  let changed = false

  for (const [oldStem, newStem] of Object.entries(STEM_MAP)) {
    // Match: from 'path/oldStem' or from "path/oldStem" or from `path/oldStem`
    // The old stem must be at the end of the import path (after last /)
    const regex = new RegExp(`(from\\s+['"` + '`' + `][^'"` + '`' + `]*)/${oldStem}(['"` + '`' + `])`, 'g')
    if (regex.test(content)) {
      changed = true
      content = content.replace(regex, `$1/${newStem}$2`)
    }
  }

  if (changed) {
    const relativePath = filePath.replace(WEB_SRC, 'src')
    console.log(`  ✏️  ${relativePath}`)
    if (!DRY_RUN) {
      writeFileSync(filePath, content, 'utf8')
    }
    updatedFiles++
  }
})

console.log(`\n✅ Updated ${updatedFiles} files with new import paths\n`)

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

if (DRY_RUN) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔍 DRY RUN COMPLETE — No changes were made')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\nTo execute the migration, run:')
  console.log('  node scripts/rename-to-pascal.mjs\n')
} else {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✨ MIGRATION COMPLETE')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\nNext steps:')
  console.log('  1. npm run typecheck    (verify TypeScript)')
  console.log('  2. npm run lint         (verify code style)')
  console.log('  3. git status           (review all changes)')
  console.log('  4. npm run dev          (test the app)\n')
}
