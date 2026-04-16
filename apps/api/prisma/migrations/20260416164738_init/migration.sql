-- CreateEnum
CREATE TYPE "PillarArea" AS ENUM ('finances', 'career', 'health', 'relationships', 'mindset', 'lifestyle');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "bank_name" TEXT,
    "account_number" TEXT,
    "currency" TEXT DEFAULT 'USD',
    "initialBalance" DECIMAL(65,30) DEFAULT 0,
    "currentBalance" DECIMAL(65,30) DEFAULT 0,
    "creditLimit" DECIMAL(65,30),
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "period_type" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT DEFAULT 'USD',
    "category_type" TEXT NOT NULL DEFAULT 'expense',
    "variability" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "is_archived" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_sources" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'fixed',
    "category" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'monthly',
    "base_amount" DECIMAL(65,30),
    "currency" TEXT DEFAULT 'USD',
    "probability" DECIMAL(65,30) DEFAULT 1.0,
    "estimation_strategy" TEXT NOT NULL DEFAULT 'average',
    "historical_window_days" INTEGER DEFAULT 90,
    "is_active" BOOLEAN DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "income_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_holdings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT,
    "name" TEXT NOT NULL,
    "ticker" TEXT,
    "category" TEXT NOT NULL DEFAULT 'stock',
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "avg_cost_price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "current_price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "last_price_update" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_expenses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'fixed',
    "category" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'monthly',
    "base_amount" DECIMAL(65,30),
    "currency" TEXT DEFAULT 'USD',
    "due_day" INTEGER,
    "is_auto_pay" BOOLEAN DEFAULT false,
    "budget_id" TEXT,
    "account_id" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "paid_amount" DECIMAL(65,30) DEFAULT 0,
    "currency" TEXT DEFAULT 'USD',
    "creditor" TEXT,
    "due_date" TIMESTAMP(3),
    "interest_rate" DECIMAL(65,30) DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "payment_day" INTEGER,
    "installment_amount" DECIMAL(65,30),
    "installment_count" INTEGER,
    "is_recurring" BOOLEAN DEFAULT false,
    "next_payment_date" TIMESTAMP(3),
    "debt_type" TEXT DEFAULT 'owed',
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "from_currency" TEXT NOT NULL,
    "to_currency" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'api',
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "account_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target_amount" DECIMAL(65,30) NOT NULL,
    "current_amount" DECIMAL(65,30) DEFAULT 0,
    "currency" TEXT DEFAULT 'USD',
    "target_date" TIMESTAMP(3),
    "monthly_contribution" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "batch_name" TEXT NOT NULL,
    "total_transactions" INTEGER NOT NULL DEFAULT 0,
    "imported_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_currency_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "base_currency" TEXT NOT NULL DEFAULT 'USD',
    "preferred_currencies" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_currency_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "budget_id" TEXT,
    "debt_id" TEXT,
    "income_source_id" TEXT,
    "recurring_expense_id" TEXT,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "is_recurring" BOOLEAN DEFAULT false,
    "recurring_pattern" TEXT,
    "transfer_account_id" TEXT,
    "tags" JSONB NOT NULL,
    "receipt_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "exclusion_reason" TEXT,
    "source_type" TEXT NOT NULL DEFAULT 'manual',
    "import_batch_id" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "exchange_rate" DECIMAL(65,30) DEFAULT 1.0,
    "currency" TEXT DEFAULT 'USD',
    "base_currency_amount" DECIMAL(65,30),
    "exchange_rate_date" TIMESTAMP(3),
    "is_manual_rate" BOOLEAN DEFAULT false,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billing_interval" TEXT NOT NULL DEFAULT 'monthly',
    "lemon_squeezy_product_id" TEXT,
    "lemon_squeezy_variant_id" TEXT,
    "trial_period_days" INTEGER DEFAULT 14,
    "max_habits" INTEGER DEFAULT 5,
    "max_goals" INTEGER DEFAULT 3,
    "max_notes" INTEGER DEFAULT 50,
    "max_tasks" INTEGER DEFAULT 20,
    "max_pomodoro_sessions_daily" INTEGER DEFAULT 10,
    "has_ai_assistant" BOOLEAN DEFAULT false,
    "has_reading_module" BOOLEAN DEFAULT false,
    "has_finances_module" BOOLEAN DEFAULT false,
    "has_notes_module" BOOLEAN DEFAULT false,
    "has_advanced_analytics" BOOLEAN DEFAULT false,
    "has_custom_theme_creation" BOOLEAN DEFAULT false,
    "has_export_data" BOOLEAN DEFAULT false,
    "has_priority_support" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "sort_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "color" TEXT DEFAULT '#3B82F6',
    "target_frequency" INTEGER DEFAULT 1,
    "frequency_type" TEXT,
    "week_days" JSONB,
    "is_active" BOOLEAN DEFAULT true,
    "goal_id" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_logs" (
    "id" TEXT NOT NULL,
    "habit_id" TEXT,
    "user_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "completed_count" INTEGER DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lemon_squeezy_webhooks" (
    "id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "lemon_squeezy_id" TEXT,
    "user_id" TEXT,
    "subscription_id" TEXT,
    "webhook_data" JSONB NOT NULL,
    "processed" BOOLEAN DEFAULT false,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lemon_squeezy_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_categories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#6B7280',
    "icon" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "tags" JSONB NOT NULL,
    "is_pinned" BOOLEAN DEFAULT false,
    "is_archived" BOOLEAN DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pomodoro_daily_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "focus_sessions" INTEGER DEFAULT 0,
    "short_breaks" INTEGER DEFAULT 0,
    "long_breaks" INTEGER DEFAULT 0,
    "total_focus_time" INTEGER DEFAULT 0,
    "total_break_time" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pomodoro_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pomodoro_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "task_id" TEXT,
    "session_type" TEXT NOT NULL DEFAULT 'focus',
    "planned_duration" INTEGER NOT NULL,
    "actual_duration" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "is_completed" BOOLEAN DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pomodoro_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "weekly_goal_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "tags" JSONB NOT NULL,
    "estimated_duration_minutes" INTEGER,
    "actual_duration_minutes" INTEGER DEFAULT 0,
    "actual_duration_seconds" INTEGER DEFAULT 0,
    "scheduled_date" TIMESTAMP(3),
    "scheduled_start" TIMESTAMP(3),
    "scheduled_end" TIMESTAMP(3),
    "actual_start" TIMESTAMP(3),
    "actual_end" TIMESTAMP(3),
    "is_all_day" BOOLEAN DEFAULT false,
    "source" TEXT DEFAULT 'manual',
    "backlog_state" TEXT DEFAULT 'none',
    "archived_at" TIMESTAMP(3),
    "order_in_day" INTEGER,
    "locked_time" BOOLEAN DEFAULT false,
    "sync_to_calendar" BOOLEAN DEFAULT false,
    "last_reminder_sent_at" TIMESTAMP(3),
    "ai_timebox" INTEGER,
    "ai_insight_json" JSONB,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_rule" TEXT,
    "recurring_parent_id" TEXT,
    "recurrence_end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deadline" TIMESTAMP(3),
    "progress" INTEGER DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'short-term',
    "status" TEXT NOT NULL DEFAULT 'in-progress',
    "relatedTasks" JSONB,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "unit" TEXT,
    "numeric_value" DECIMAL(65,30),
    "string_value" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "display_name" TEXT,
    "profile_picture" TEXT,
    "bio" TEXT,
    "primary_goal" TEXT,
    "last_profile_update" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "ai_data_sharing" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "plan_id" TEXT,
    "lemon_squeezy_subscription_id" TEXT,
    "lemon_squeezy_order_id" TEXT,
    "lemon_squeezy_customer_id" TEXT,
    "update_payment_method_url" TEXT,
    "status" TEXT DEFAULT 'pending',
    "currency" TEXT DEFAULT 'USD',
    "amount" DECIMAL(65,30) NOT NULL,
    "billing_interval" TEXT NOT NULL,
    "trial_starts_at" TIMESTAMP(3),
    "trial_ends_at" TIMESTAMP(3),
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "next_billing_date" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_usage_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "current_habits" INTEGER DEFAULT 0,
    "current_goals" INTEGER DEFAULT 0,
    "current_notes" INTEGER DEFAULT 0,
    "current_tasks" INTEGER DEFAULT 0,
    "daily_pomodoro_sessions" INTEGER DEFAULT 0,
    "daily_ai_requests" INTEGER DEFAULT 0,
    "monthly_exports" INTEGER DEFAULT 0,
    "daily_reset_date" TIMESTAMP(3),
    "monthly_reset_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_usage_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_feature_overrides" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "feature_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "reason" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_feature_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "habit_reminders" BOOLEAN NOT NULL DEFAULT true,
    "pomodoro_alerts" BOOLEAN NOT NULL DEFAULT true,
    "task_reminders" BOOLEAN NOT NULL DEFAULT true,
    "daily_motivation" BOOLEAN NOT NULL DEFAULT true,
    "marketing_messages" BOOLEAN NOT NULL DEFAULT true,
    "task_reminder_offset" INTEGER NOT NULL DEFAULT 30,
    "habit_reminder_time" TEXT NOT NULL DEFAULT '20:00',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keys" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_otp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_threads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "tool_name" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prime_visions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "title" TEXT NOT NULL,
    "narrative" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prime_visions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "three_year_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "vision_id" TEXT,
    "area" "PillarArea" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "three_year_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "three_year_goal_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetMetrics" JSONB,
    "targetDate" TIMESTAMP(3),
    "progress" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annual_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quarterly_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "annual_goal_id" TEXT,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "objectives" JSONB,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "progress" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quarterly_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_task_links" (
    "id" TEXT NOT NULL,
    "quarterly_goal_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "weight" DECIMAL(65,30) DEFAULT 1,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "focus_task_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_habit_links" (
    "id" TEXT NOT NULL,
    "quarterly_goal_id" TEXT NOT NULL,
    "habit_id" TEXT NOT NULL,
    "weight" DECIMAL(65,30) DEFAULT 1,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "focus_habit_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_finance_links" (
    "id" TEXT NOT NULL,
    "quarterly_goal_id" TEXT NOT NULL,
    "savings_goal_id" TEXT,
    "budget_id" TEXT,
    "type" TEXT NOT NULL DEFAULT 'saving',
    "targetAmount" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "focus_finance_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_health_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "quarterly_goal_id" TEXT NOT NULL,
    "week_start" TIMESTAMP(3) NOT NULL,
    "momentumScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'neutral',
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_health_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "provider" TEXT NOT NULL,
    "email" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scopes" JSONB,
    "isPrimary" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendars" (
    "id" TEXT NOT NULL,
    "calendar_account_id" TEXT NOT NULL,
    "providerCalendarId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "isPrimary" BOOLEAN DEFAULT false,
    "isSelectedForSync" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_calendar_bindings" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "calendar_id" TEXT NOT NULL,
    "calendarProvider" TEXT NOT NULL,
    "externalEventId" TEXT,
    "externalRecurringEventId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncDirection" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_calendar_bindings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "quarterly_goal_id" TEXT,
    "week_start_date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "order" INTEGER NOT NULL DEFAULT 0,
    "parent_goal_id" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_work_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "timeZone" TEXT NOT NULL,
    "workStartHour" INTEGER NOT NULL,
    "workEndHour" INTEGER NOT NULL,
    "workDays" JSONB,
    "defaultTaskDurationMinutes" INTEGER,
    "maxTasksPerDay" INTEGER,
    "overflowStrategy" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_work_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fcm_token" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "device_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revoked_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revoked_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_onboarding" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "currentStep" TEXT NOT NULL DEFAULT 'goals',
    "skipped_steps" JSONB,
    "completed_steps" JSONB,
    "dismissed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_masters" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'open_library',
    "work_key" TEXT NOT NULL,
    "edition_key" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "authors" JSONB NOT NULL DEFAULT '[]',
    "cover_url" TEXT,
    "pages" INTEGER,
    "publish_year" INTEGER,
    "language" TEXT,
    "subjects" JSONB NOT NULL DEFAULT '[]',
    "isbn_list" JSONB NOT NULL DEFAULT '[]',
    "open_library_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_books" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'to_read',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "planned_quarter" TEXT,
    "planned_start_date" TIMESTAMP(3),
    "target_finish_date" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "current_page" INTEGER,
    "total_pages_snapshot" INTEGER,
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "rating" INTEGER,
    "review" TEXT,
    "notes" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period_type" TEXT NOT NULL,
    "target_books" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_customizations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "cover_image_type" TEXT DEFAULT 'none',
    "cover_position_y" INTEGER DEFAULT 50,
    "icon_type" TEXT DEFAULT 'default',
    "icon_value" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "section_customizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamification_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "rank" TEXT NOT NULL DEFAULT 'E',
    "daily_goal" INTEGER NOT NULL DEFAULT 50,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_active_date" TEXT,
    "achievements_count" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gamification_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "source_id" TEXT,
    "amount" INTEGER NOT NULL,
    "metadata" JSONB,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "earned_date" TEXT NOT NULL,

    CONSTRAINT "xp_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_xp_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "goal_met" BOOLEAN NOT NULL DEFAULT false,
    "task_xp" INTEGER NOT NULL DEFAULT 0,
    "habit_xp" INTEGER NOT NULL DEFAULT 0,
    "pomodoro_xp" INTEGER NOT NULL DEFAULT 0,
    "bonus_xp" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_xp_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_es" TEXT NOT NULL,
    "desc_en" TEXT NOT NULL,
    "desc_es" TEXT NOT NULL,
    "icon_name" TEXT NOT NULL,
    "xp_reward" INTEGER NOT NULL DEFAULT 0,
    "condition" JSONB NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_challenges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_es" TEXT NOT NULL,
    "desc_en" TEXT NOT NULL,
    "desc_es" TEXT NOT NULL,
    "xp_reward" INTEGER NOT NULL,
    "target_value" INTEGER NOT NULL,
    "current_value" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE INDEX "budgets_user_id_idx" ON "budgets"("user_id");

-- CreateIndex
CREATE INDEX "income_sources_user_id_idx" ON "income_sources"("user_id");

-- CreateIndex
CREATE INDEX "investment_holdings_user_id_idx" ON "investment_holdings"("user_id");

-- CreateIndex
CREATE INDEX "investment_holdings_account_id_idx" ON "investment_holdings"("account_id");

-- CreateIndex
CREATE INDEX "recurring_expenses_user_id_idx" ON "recurring_expenses"("user_id");

-- CreateIndex
CREATE INDEX "recurring_expenses_budget_id_idx" ON "recurring_expenses"("budget_id");

-- CreateIndex
CREATE INDEX "recurring_expenses_account_id_idx" ON "recurring_expenses"("account_id");

-- CreateIndex
CREATE INDEX "debts_user_id_idx" ON "debts"("user_id");

-- CreateIndex
CREATE INDEX "exchange_rates_from_currency_to_currency_date_idx" ON "exchange_rates"("from_currency", "to_currency", "date");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_from_currency_to_currency_date_key" ON "exchange_rates"("from_currency", "to_currency", "date");

-- CreateIndex
CREATE INDEX "savings_goals_user_id_idx" ON "savings_goals"("user_id");

-- CreateIndex
CREATE INDEX "import_batches_user_id_idx" ON "import_batches"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_currency_settings_user_id_key" ON "user_currency_settings"("user_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_status_idx" ON "transactions"("user_id", "status");

-- CreateIndex
CREATE INDEX "transactions_user_id_type_idx" ON "transactions"("user_id", "type");

-- CreateIndex
CREATE INDEX "transactions_user_id_date_idx" ON "transactions"("user_id", "date");

-- CreateIndex
CREATE INDEX "transactions_user_id_status_date_idx" ON "transactions"("user_id", "status", "date");

-- CreateIndex
CREATE INDEX "transactions_account_id_idx" ON "transactions"("account_id");

-- CreateIndex
CREATE INDEX "transactions_budget_id_idx" ON "transactions"("budget_id");

-- CreateIndex
CREATE INDEX "transactions_debt_id_idx" ON "transactions"("debt_id");

-- CreateIndex
CREATE INDEX "transactions_income_source_id_idx" ON "transactions"("income_source_id");

-- CreateIndex
CREATE INDEX "transactions_recurring_expense_id_idx" ON "transactions"("recurring_expense_id");

-- CreateIndex
CREATE INDEX "transactions_import_batch_id_idx" ON "transactions"("import_batch_id");

-- CreateIndex
CREATE INDEX "transactions_date_idx" ON "transactions"("date");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_lemon_squeezy_variant_id_key" ON "subscription_plans"("lemon_squeezy_variant_id");

-- CreateIndex
CREATE INDEX "habits_user_id_idx" ON "habits"("user_id");

-- CreateIndex
CREATE INDEX "habits_user_id_is_active_idx" ON "habits"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "habits_goal_id_idx" ON "habits"("goal_id");

-- CreateIndex
CREATE INDEX "habit_logs_user_id_idx" ON "habit_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "habit_logs_habit_id_date_key" ON "habit_logs"("habit_id", "date");

-- CreateIndex
CREATE INDEX "lemon_squeezy_webhooks_user_id_idx" ON "lemon_squeezy_webhooks"("user_id");

-- CreateIndex
CREATE INDEX "note_categories_user_id_idx" ON "note_categories"("user_id");

-- CreateIndex
CREATE INDEX "notes_user_id_idx" ON "notes"("user_id");

-- CreateIndex
CREATE INDEX "notes_category_id_idx" ON "notes"("category_id");

-- CreateIndex
CREATE INDEX "notes_user_id_deleted_at_idx" ON "notes"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "pomodoro_daily_stats_user_id_idx" ON "pomodoro_daily_stats"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "pomodoro_daily_stats_user_id_date_key" ON "pomodoro_daily_stats"("user_id", "date");

-- CreateIndex
CREATE INDEX "pomodoro_sessions_user_id_idx" ON "pomodoro_sessions"("user_id");

-- CreateIndex
CREATE INDEX "pomodoro_sessions_task_id_idx" ON "pomodoro_sessions"("task_id");

-- CreateIndex
CREATE INDEX "tasks_user_id_idx" ON "tasks"("user_id");

-- CreateIndex
CREATE INDEX "tasks_user_id_status_idx" ON "tasks"("user_id", "status");

-- CreateIndex
CREATE INDEX "tasks_user_id_scheduled_date_idx" ON "tasks"("user_id", "scheduled_date");

-- CreateIndex
CREATE INDEX "tasks_weekly_goal_id_idx" ON "tasks"("weekly_goal_id");

-- CreateIndex
CREATE INDEX "tasks_recurring_parent_id_idx" ON "tasks"("recurring_parent_id");

-- CreateIndex
CREATE INDEX "goals_user_id_idx" ON "goals"("user_id");

-- CreateIndex
CREATE INDEX "goals_user_id_status_idx" ON "goals"("user_id", "status");

-- CreateIndex
CREATE INDEX "health_metrics_user_id_type_date_idx" ON "health_metrics"("user_id", "type", "date");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE INDEX "user_subscriptions_user_id_idx" ON "user_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "user_subscriptions_plan_id_idx" ON "user_subscriptions"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_lemon_squeezy_subscription_id_key" ON "user_subscriptions"("lemon_squeezy_subscription_id");

-- CreateIndex
CREATE INDEX "user_usage_stats_user_id_idx" ON "user_usage_stats"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_usage_stats_user_id_key" ON "user_usage_stats"("user_id");

-- CreateIndex
CREATE INDEX "user_feature_overrides_user_id_idx" ON "user_feature_overrides"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_feature_overrides_user_id_feature_key_key" ON "user_feature_overrides"("user_id", "feature_key");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "auth_accounts_userId_idx" ON "auth_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_accounts_provider_providerAccountId_key" ON "auth_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_sessionToken_key" ON "auth_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "auth_sessions_userId_idx" ON "auth_sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_verification_tokens_token_key" ON "auth_verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "auth_verification_tokens_identifier_token_key" ON "auth_verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "email_otp_email_idx" ON "email_otp"("email");

-- CreateIndex
CREATE INDEX "chat_threads_user_id_idx" ON "chat_threads"("user_id");

-- CreateIndex
CREATE INDEX "chat_messages_thread_id_idx" ON "chat_messages"("thread_id");

-- CreateIndex
CREATE INDEX "prime_visions_user_id_idx" ON "prime_visions"("user_id");

-- CreateIndex
CREATE INDEX "three_year_goals_user_id_idx" ON "three_year_goals"("user_id");

-- CreateIndex
CREATE INDEX "three_year_goals_vision_id_idx" ON "three_year_goals"("vision_id");

-- CreateIndex
CREATE INDEX "annual_goals_user_id_idx" ON "annual_goals"("user_id");

-- CreateIndex
CREATE INDEX "annual_goals_three_year_goal_id_idx" ON "annual_goals"("three_year_goal_id");

-- CreateIndex
CREATE INDEX "quarterly_goals_user_id_idx" ON "quarterly_goals"("user_id");

-- CreateIndex
CREATE INDEX "quarterly_goals_annual_goal_id_idx" ON "quarterly_goals"("annual_goal_id");

-- CreateIndex
CREATE INDEX "quarterly_goals_year_quarter_idx" ON "quarterly_goals"("year", "quarter");

-- CreateIndex
CREATE INDEX "focus_task_links_quarterly_goal_id_idx" ON "focus_task_links"("quarterly_goal_id");

-- CreateIndex
CREATE INDEX "focus_task_links_task_id_idx" ON "focus_task_links"("task_id");

-- CreateIndex
CREATE INDEX "focus_habit_links_quarterly_goal_id_idx" ON "focus_habit_links"("quarterly_goal_id");

-- CreateIndex
CREATE INDEX "focus_habit_links_habit_id_idx" ON "focus_habit_links"("habit_id");

-- CreateIndex
CREATE INDEX "focus_finance_links_quarterly_goal_id_idx" ON "focus_finance_links"("quarterly_goal_id");

-- CreateIndex
CREATE INDEX "focus_finance_links_savings_goal_id_idx" ON "focus_finance_links"("savings_goal_id");

-- CreateIndex
CREATE INDEX "focus_finance_links_budget_id_idx" ON "focus_finance_links"("budget_id");

-- CreateIndex
CREATE INDEX "goal_health_snapshots_user_id_idx" ON "goal_health_snapshots"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "goal_health_snapshots_quarterly_goal_id_week_start_key" ON "goal_health_snapshots"("quarterly_goal_id", "week_start");

-- CreateIndex
CREATE INDEX "calendar_accounts_user_id_idx" ON "calendar_accounts"("user_id");

-- CreateIndex
CREATE INDEX "calendars_calendar_account_id_idx" ON "calendars"("calendar_account_id");

-- CreateIndex
CREATE INDEX "task_calendar_bindings_task_id_idx" ON "task_calendar_bindings"("task_id");

-- CreateIndex
CREATE INDEX "task_calendar_bindings_calendar_id_idx" ON "task_calendar_bindings"("calendar_id");

-- CreateIndex
CREATE INDEX "task_calendar_bindings_externalEventId_idx" ON "task_calendar_bindings"("externalEventId");

-- CreateIndex
CREATE INDEX "weekly_goals_user_id_idx" ON "weekly_goals"("user_id");

-- CreateIndex
CREATE INDEX "weekly_goals_quarterly_goal_id_idx" ON "weekly_goals"("quarterly_goal_id");

-- CreateIndex
CREATE INDEX "weekly_goals_week_start_date_idx" ON "weekly_goals"("week_start_date");

-- CreateIndex
CREATE INDEX "weekly_goals_parent_goal_id_idx" ON "weekly_goals"("parent_goal_id");

-- CreateIndex
CREATE INDEX "user_work_preferences_user_id_idx" ON "user_work_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_fcm_token_key" ON "user_devices"("fcm_token");

-- CreateIndex
CREATE INDEX "user_devices_user_id_idx" ON "user_devices"("user_id");

-- CreateIndex
CREATE INDEX "user_devices_fcm_token_idx" ON "user_devices"("fcm_token");

-- CreateIndex
CREATE UNIQUE INDEX "revoked_tokens_token_hash_key" ON "revoked_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "revoked_tokens_token_hash_idx" ON "revoked_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "revoked_tokens_expires_at_idx" ON "revoked_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_onboarding_user_id_key" ON "user_onboarding"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_masters_work_key_key" ON "book_masters"("work_key");

-- CreateIndex
CREATE INDEX "book_masters_work_key_idx" ON "book_masters"("work_key");

-- CreateIndex
CREATE INDEX "user_books_user_id_idx" ON "user_books"("user_id");

-- CreateIndex
CREATE INDEX "user_books_user_id_status_idx" ON "user_books"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_books_user_id_planned_quarter_idx" ON "user_books"("user_id", "planned_quarter");

-- CreateIndex
CREATE UNIQUE INDEX "user_books_user_id_book_id_key" ON "user_books"("user_id", "book_id");

-- CreateIndex
CREATE INDEX "reading_goals_user_id_idx" ON "reading_goals"("user_id");

-- CreateIndex
CREATE INDEX "reading_goals_user_id_period_type_idx" ON "reading_goals"("user_id", "period_type");

-- CreateIndex
CREATE INDEX "section_customizations_user_id_idx" ON "section_customizations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "section_customizations_user_id_section_id_key" ON "section_customizations"("user_id", "section_id");

-- CreateIndex
CREATE UNIQUE INDEX "gamification_profiles_user_id_key" ON "gamification_profiles"("user_id");

-- CreateIndex
CREATE INDEX "gamification_profiles_user_id_idx" ON "gamification_profiles"("user_id");

-- CreateIndex
CREATE INDEX "xp_events_user_id_idx" ON "xp_events"("user_id");

-- CreateIndex
CREATE INDEX "xp_events_user_id_earned_date_idx" ON "xp_events"("user_id", "earned_date");

-- CreateIndex
CREATE INDEX "xp_events_user_id_source_idx" ON "xp_events"("user_id", "source");

-- CreateIndex
CREATE INDEX "daily_xp_snapshots_user_id_idx" ON "daily_xp_snapshots"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_xp_snapshots_user_id_date_key" ON "daily_xp_snapshots"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_key_key" ON "achievements"("key");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_idx" ON "user_achievements"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

-- CreateIndex
CREATE INDEX "daily_challenges_user_id_date_idx" ON "daily_challenges"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_challenges_user_id_date_type_key" ON "daily_challenges"("user_id", "date", "type");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_holdings" ADD CONSTRAINT "investment_holdings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_holdings" ADD CONSTRAINT "investment_holdings_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_currency_settings" ADD CONSTRAINT "user_currency_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_income_source_id_fkey" FOREIGN KEY ("income_source_id") REFERENCES "income_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurring_expense_id_fkey" FOREIGN KEY ("recurring_expense_id") REFERENCES "recurring_expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transfer_account_id_fkey" FOREIGN KEY ("transfer_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lemon_squeezy_webhooks" ADD CONSTRAINT "lemon_squeezy_webhooks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lemon_squeezy_webhooks" ADD CONSTRAINT "lemon_squeezy_webhooks_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_categories" ADD CONSTRAINT "note_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "note_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pomodoro_daily_stats" ADD CONSTRAINT "pomodoro_daily_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pomodoro_sessions" ADD CONSTRAINT "pomodoro_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pomodoro_sessions" ADD CONSTRAINT "pomodoro_sessions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_weekly_goal_id_fkey" FOREIGN KEY ("weekly_goal_id") REFERENCES "weekly_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_recurring_parent_id_fkey" FOREIGN KEY ("recurring_parent_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_metrics" ADD CONSTRAINT "health_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_usage_stats" ADD CONSTRAINT "user_usage_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_feature_overrides" ADD CONSTRAINT "user_feature_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prime_visions" ADD CONSTRAINT "prime_visions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "three_year_goals" ADD CONSTRAINT "three_year_goals_vision_id_fkey" FOREIGN KEY ("vision_id") REFERENCES "prime_visions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annual_goals" ADD CONSTRAINT "annual_goals_three_year_goal_id_fkey" FOREIGN KEY ("three_year_goal_id") REFERENCES "three_year_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarterly_goals" ADD CONSTRAINT "quarterly_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarterly_goals" ADD CONSTRAINT "quarterly_goals_annual_goal_id_fkey" FOREIGN KEY ("annual_goal_id") REFERENCES "annual_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_task_links" ADD CONSTRAINT "focus_task_links_quarterly_goal_id_fkey" FOREIGN KEY ("quarterly_goal_id") REFERENCES "quarterly_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_task_links" ADD CONSTRAINT "focus_task_links_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_habit_links" ADD CONSTRAINT "focus_habit_links_quarterly_goal_id_fkey" FOREIGN KEY ("quarterly_goal_id") REFERENCES "quarterly_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_habit_links" ADD CONSTRAINT "focus_habit_links_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_finance_links" ADD CONSTRAINT "focus_finance_links_quarterly_goal_id_fkey" FOREIGN KEY ("quarterly_goal_id") REFERENCES "quarterly_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_finance_links" ADD CONSTRAINT "focus_finance_links_savings_goal_id_fkey" FOREIGN KEY ("savings_goal_id") REFERENCES "savings_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_finance_links" ADD CONSTRAINT "focus_finance_links_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_health_snapshots" ADD CONSTRAINT "goal_health_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_health_snapshots" ADD CONSTRAINT "goal_health_snapshots_quarterly_goal_id_fkey" FOREIGN KEY ("quarterly_goal_id") REFERENCES "quarterly_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_accounts" ADD CONSTRAINT "calendar_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendars" ADD CONSTRAINT "calendars_calendar_account_id_fkey" FOREIGN KEY ("calendar_account_id") REFERENCES "calendar_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_calendar_bindings" ADD CONSTRAINT "task_calendar_bindings_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_calendar_bindings" ADD CONSTRAINT "task_calendar_bindings_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_goals" ADD CONSTRAINT "weekly_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_goals" ADD CONSTRAINT "weekly_goals_quarterly_goal_id_fkey" FOREIGN KEY ("quarterly_goal_id") REFERENCES "quarterly_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_work_preferences" ADD CONSTRAINT "user_work_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_onboarding" ADD CONSTRAINT "user_onboarding_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "book_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_goals" ADD CONSTRAINT "reading_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_customizations" ADD CONSTRAINT "section_customizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gamification_profiles" ADD CONSTRAINT "gamification_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_xp_snapshots" ADD CONSTRAINT "daily_xp_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_challenges" ADD CONSTRAINT "daily_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
