-- CreateEnum
CREATE TYPE "StartOfWeek" AS ENUM ('SUNDAY', 'MONDAY');

-- CreateEnum
CREATE TYPE "TimeFormat" AS ENUM ('H12', 'H24');

-- CreateEnum
CREATE TYPE "RolloverPosition" AS ENUM ('TOP', 'BOTTOM');

-- CreateEnum
CREATE TYPE "LateTimerMode" AS ENUM ('OFF', 'PROMPT', 'AUTO');

-- CreateEnum
CREATE TYPE "GoalHorizon" AS ENUM ('THREE_YEAR', 'ONE_YEAR', 'QUARTER', 'WEEK');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'ACHIEVED', 'RETIRED');

-- CreateEnum
CREATE TYPE "SessionKind" AS ENUM ('WORK', 'POMODORO', 'BREAK', 'HABIT_LOG');

-- CreateEnum
CREATE TYPE "CreationSource" AS ENUM ('USER', 'AUTO_SCHEDULE', 'AUTO_RESCHEDULE', 'SPLIT', 'IMPORT');

-- CreateEnum
CREATE TYPE "RecurrencePattern" AS ENUM ('DAILY', 'WEEKDAYS', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "RitualKind" AS ENUM ('DAILY_PLAN', 'DAILY_SHUTDOWN', 'WEEKLY_PLAN', 'WEEKLY_REVIEW', 'QUARTERLY_REVIEW', 'ANNUAL_REVIEW', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RitualCadence" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ON_DEMAND');

-- CreateEnum
CREATE TYPE "RitualStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "CommandSource" AS ENUM ('USER_ACTION', 'AUTO_RESCHEDULER', 'ROLLOVER_JOB', 'SYNC_JOB');

-- CreateEnum
CREATE TYPE "TimerEventType" AS ENUM ('START', 'PAUSE', 'RESUME', 'STOP', 'COMPLETE');

-- CreateEnum
CREATE TYPE "TaskKind" AS ENUM ('TASK', 'HABIT');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "actual_time_minutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "channel_id" TEXT,
ADD COLUMN     "day" DATE,
ADD COLUMN     "identity_statement" TEXT,
ADD COLUMN     "kind" "TaskKind" NOT NULL DEFAULT 'TASK',
ADD COLUMN     "original_day" DATE,
ADD COLUMN     "planned_time_minutes" INTEGER,
ADD COLUMN     "position_in_day" DOUBLE PRECISION,
ADD COLUMN     "recurring_series_id" TEXT,
ADD COLUMN     "rollover_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN     "auto_reschedule_on_conflict" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "auto_reschedule_on_early_completion" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "auto_rollover_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "auto_scheduling_gap_minutes" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "channel_recommendations_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "contiguity_threshold_minutes" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "count_planned_as_actual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "custom_day_thresholds" JSONB,
ADD COLUMN     "default_task_duration_minutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "detect_late_timer_start" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "end_day_at_time" TEXT DEFAULT '18:00',
ADD COLUMN     "late_timer_mode" "LateTimerMode" NOT NULL DEFAULT 'PROMPT',
ADD COLUMN     "late_timer_threshold_minutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "plan_day_at_time" TEXT DEFAULT '08:00',
ADD COLUMN     "planned_time_recommendations_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "start_of_week" "StartOfWeek" NOT NULL DEFAULT 'MONDAY',
ADD COLUMN     "task_rollover_position" "RolloverPosition" NOT NULL DEFAULT 'TOP',
ADD COLUMN     "time_format" "TimeFormat" NOT NULL DEFAULT 'H24',
ADD COLUMN     "workload_threshold_minutes" INTEGER NOT NULL DEFAULT 420;

-- CreateTable
CREATE TABLE "visions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "core_values" TEXT[],
    "identity_statements" TEXT[],
    "last_reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "horizon" "GoalHorizon" NOT NULL,
    "parent_goal_id" TEXT,
    "channel_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_metric" TEXT,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "starts_on" DATE,
    "ends_on" DATE,
    "period_key" TEXT,
    "vision_contribution" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_goals" (
    "task_id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_goals_pkey" PRIMARY KEY ("task_id","goal_id")
);

-- CreateTable
CREATE TABLE "contexts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "is_personal" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "context_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "import_from_calendar_id" TEXT,
    "timebox_to_calendar_id" TEXT,
    "slack_channel_id" TEXT,
    "asana_project_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtasks" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "planned_time_minutes" INTEGER,
    "actual_time_minutes" INTEGER NOT NULL DEFAULT 0,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subtasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "working_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "task_id" TEXT,
    "kind" "SessionKind" NOT NULL DEFAULT 'WORK',
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "external_calendar_id" TEXT,
    "external_event_id" TEXT,
    "created_by" "CreationSource" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "working_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "working_hours" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "channel_id" TEXT,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "working_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_series" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "template_task_json" JSONB NOT NULL,
    "pattern" "RecurrencePattern" NOT NULL,
    "days_of_week" INTEGER[],
    "at_roughly_time" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "calendar_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "is_busy" BOOLEAN NOT NULL DEFAULT true,
    "is_declined" BOOLEAN NOT NULL DEFAULT false,
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rituals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "kind" "RitualKind" NOT NULL,
    "name" TEXT NOT NULL,
    "cadence" "RitualCadence" NOT NULL,
    "scheduled_time" TEXT,
    "steps" JSONB NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rituals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ritual_instances" (
    "id" TEXT NOT NULL,
    "ritual_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "status" "RitualStatus" NOT NULL DEFAULT 'PENDING',
    "snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ritual_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reflection_entries" (
    "id" TEXT NOT NULL,
    "ritual_instance_id" TEXT NOT NULL,
    "prompt_key" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attached_goal_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reflection_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commands" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "is_undone" BOOLEAN NOT NULL DEFAULT false,
    "triggered_by" "CommandSource" NOT NULL,
    "parent_command_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timer_events" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "type" "TimerEventType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "timer_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "visions_user_id_key" ON "visions"("user_id");

-- CreateIndex
CREATE INDEX "goals_user_id_horizon_idx" ON "goals"("user_id", "horizon");

-- CreateIndex
CREATE INDEX "goals_user_id_status_idx" ON "goals"("user_id", "status");

-- CreateIndex
CREATE INDEX "goals_period_key_idx" ON "goals"("period_key");

-- CreateIndex
CREATE INDEX "goals_parent_goal_id_idx" ON "goals"("parent_goal_id");

-- CreateIndex
CREATE INDEX "task_goals_goal_id_idx" ON "task_goals"("goal_id");

-- CreateIndex
CREATE INDEX "contexts_user_id_idx" ON "contexts"("user_id");

-- CreateIndex
CREATE INDEX "channels_user_id_idx" ON "channels"("user_id");

-- CreateIndex
CREATE INDEX "channels_context_id_idx" ON "channels"("context_id");

-- CreateIndex
CREATE INDEX "subtasks_task_id_idx" ON "subtasks"("task_id");

-- CreateIndex
CREATE INDEX "working_sessions_user_id_start_idx" ON "working_sessions"("user_id", "start");

-- CreateIndex
CREATE INDEX "working_sessions_task_id_idx" ON "working_sessions"("task_id");

-- CreateIndex
CREATE INDEX "working_hours_user_id_idx" ON "working_hours"("user_id");

-- CreateIndex
CREATE INDEX "working_hours_channel_id_idx" ON "working_hours"("channel_id");

-- CreateIndex
CREATE INDEX "recurring_series_user_id_idx" ON "recurring_series"("user_id");

-- CreateIndex
CREATE INDEX "calendar_events_calendar_id_start_idx" ON "calendar_events"("calendar_id", "start");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_calendar_id_external_id_key" ON "calendar_events"("calendar_id", "external_id");

-- CreateIndex
CREATE INDEX "rituals_user_id_kind_idx" ON "rituals"("user_id", "kind");

-- CreateIndex
CREATE INDEX "ritual_instances_user_id_scheduled_for_idx" ON "ritual_instances"("user_id", "scheduled_for");

-- CreateIndex
CREATE INDEX "ritual_instances_ritual_id_idx" ON "ritual_instances"("ritual_id");

-- CreateIndex
CREATE INDEX "reflection_entries_ritual_instance_id_idx" ON "reflection_entries"("ritual_instance_id");

-- CreateIndex
CREATE INDEX "commands_user_id_created_at_idx" ON "commands"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "timer_events_task_id_timestamp_idx" ON "timer_events"("task_id", "timestamp");

-- CreateIndex
CREATE INDEX "tasks_user_id_day_idx" ON "tasks"("user_id", "day");

-- CreateIndex
CREATE INDEX "tasks_user_id_kind_idx" ON "tasks"("user_id", "kind");

-- CreateIndex
CREATE INDEX "tasks_channel_id_idx" ON "tasks"("channel_id");

-- CreateIndex
CREATE INDEX "tasks_recurring_series_id_idx" ON "tasks"("recurring_series_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_recurring_series_id_fkey" FOREIGN KEY ("recurring_series_id") REFERENCES "recurring_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visions" ADD CONSTRAINT "visions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_parent_goal_id_fkey" FOREIGN KEY ("parent_goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_goals" ADD CONSTRAINT "task_goals_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_goals" ADD CONSTRAINT "task_goals_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contexts" ADD CONSTRAINT "contexts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "contexts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtasks" ADD CONSTRAINT "subtasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_sessions" ADD CONSTRAINT "working_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_sessions" ADD CONSTRAINT "working_sessions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rituals" ADD CONSTRAINT "rituals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ritual_instances" ADD CONSTRAINT "ritual_instances_ritual_id_fkey" FOREIGN KEY ("ritual_id") REFERENCES "rituals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ritual_instances" ADD CONSTRAINT "ritual_instances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflection_entries" ADD CONSTRAINT "reflection_entries_ritual_instance_id_fkey" FOREIGN KEY ("ritual_instance_id") REFERENCES "ritual_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflection_entries" ADD CONSTRAINT "reflection_entries_attached_goal_id_fkey" FOREIGN KEY ("attached_goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commands" ADD CONSTRAINT "commands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commands" ADD CONSTRAINT "commands_parent_command_id_fkey" FOREIGN KEY ("parent_command_id") REFERENCES "commands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timer_events" ADD CONSTRAINT "timer_events_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
