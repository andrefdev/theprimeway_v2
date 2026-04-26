/*
  Warnings:

  - You are about to drop the column `has_notes_module` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `has_reading_module` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `max_notes` on the `subscription_plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "subscription_plans" DROP COLUMN "has_notes_module",
DROP COLUMN "has_reading_module",
DROP COLUMN "max_notes",
ADD COLUMN     "has_brain_module" BOOLEAN DEFAULT false,
ADD COLUMN     "max_brain_entries" INTEGER DEFAULT 20;
