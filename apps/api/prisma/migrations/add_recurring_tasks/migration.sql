-- AlterTable: Add recurring task fields
ALTER TABLE "tasks" ADD COLUMN "is_recurring" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tasks" ADD COLUMN "recurrence_rule" TEXT;
ALTER TABLE "tasks" ADD COLUMN "recurring_parent_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN "recurrence_end_date" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "tasks_recurring_parent_id_idx" ON "tasks"("recurring_parent_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_recurring_parent_id_fkey" FOREIGN KEY ("recurring_parent_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
