-- DropForeignKey
ALTER TABLE "habit_logs" DROP CONSTRAINT "habit_logs_habit_id_fkey";

-- DropForeignKey
ALTER TABLE "habits" DROP CONSTRAINT "habits_user_id_fkey";

-- DropIndex
DROP INDEX "habit_logs_habit_id_date_key";

-- AlterTable
ALTER TABLE "habit_logs" DROP COLUMN "habit_id",
ADD COLUMN     "task_id" TEXT NOT NULL,
ALTER COLUMN "user_id" SET NOT NULL,
ALTER COLUMN "completed_count" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- DropTable
DROP TABLE "habits";

-- CreateIndex
CREATE UNIQUE INDEX "habit_logs_task_id_date_key" ON "habit_logs"("task_id", "date");

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

