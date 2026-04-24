-- DropForeignKey
ALTER TABLE "pomodoro_daily_stats" DROP CONSTRAINT "pomodoro_daily_stats_user_id_fkey";

-- DropForeignKey
ALTER TABLE "pomodoro_sessions" DROP CONSTRAINT "pomodoro_sessions_task_id_fkey";

-- DropForeignKey
ALTER TABLE "pomodoro_sessions" DROP CONSTRAINT "pomodoro_sessions_user_id_fkey";

-- AlterTable
ALTER TABLE "working_sessions" ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT;

-- DropTable
DROP TABLE "pomodoro_daily_stats";

-- DropTable
DROP TABLE "pomodoro_sessions";

