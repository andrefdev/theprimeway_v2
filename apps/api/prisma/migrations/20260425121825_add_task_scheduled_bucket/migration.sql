-- CreateEnum
CREATE TYPE "TaskBucket" AS ENUM ('TODAY', 'TOMORROW', 'NEXT_WEEK', 'NEXT_MONTH', 'NEXT_QUARTER', 'NEXT_YEAR', 'SOMEDAY', 'NEVER');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "scheduled_bucket" "TaskBucket";

-- CreateIndex
CREATE INDEX "tasks_user_id_scheduled_bucket_idx" ON "tasks"("user_id", "scheduled_bucket");
