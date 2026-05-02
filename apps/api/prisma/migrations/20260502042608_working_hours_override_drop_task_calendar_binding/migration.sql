/*
  Warnings:

  - You are about to drop the `task_calendar_bindings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "task_calendar_bindings" DROP CONSTRAINT "task_calendar_bindings_calendar_id_fkey";

-- DropForeignKey
ALTER TABLE "task_calendar_bindings" DROP CONSTRAINT "task_calendar_bindings_task_id_fkey";

-- DropTable
DROP TABLE "task_calendar_bindings";

-- CreateTable
CREATE TABLE "working_hours_overrides" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "working_hours_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "working_hours_overrides_user_id_idx" ON "working_hours_overrides"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "working_hours_overrides_user_id_date_key" ON "working_hours_overrides"("user_id", "date");

-- AddForeignKey
ALTER TABLE "working_hours_overrides" ADD CONSTRAINT "working_hours_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
