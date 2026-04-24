/*
  Warnings:

  - You are about to drop the column `weekly_goal_id` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the `quarterly_goals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `weekly_goals` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "quarterly_goals" DROP CONSTRAINT "quarterly_goals_user_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_weekly_goal_id_fkey";

-- DropForeignKey
ALTER TABLE "weekly_goals" DROP CONSTRAINT "weekly_goals_quarterly_goal_id_fkey";

-- DropForeignKey
ALTER TABLE "weekly_goals" DROP CONSTRAINT "weekly_goals_user_id_fkey";

-- DropIndex
DROP INDEX "tasks_weekly_goal_id_idx";

-- AlterTable
ALTER TABLE "goals" ADD COLUMN     "objectives" JSONB;

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "weekly_goal_id";

-- DropTable
DROP TABLE "quarterly_goals";

-- DropTable
DROP TABLE "weekly_goals";
