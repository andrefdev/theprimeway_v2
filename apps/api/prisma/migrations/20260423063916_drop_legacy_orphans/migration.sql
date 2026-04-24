/*
  Warnings:

  - You are about to drop the column `annual_goal_id` on the `quarterly_goals` table. All the data in the column will be lost.
  - You are about to drop the `annual_goals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `focus_finance_links` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `focus_habit_links` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `focus_task_links` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `goal_health_snapshots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `prime_visions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `three_year_goals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_work_preferences` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "annual_goals" DROP CONSTRAINT "annual_goals_three_year_goal_id_fkey";

-- DropForeignKey
ALTER TABLE "focus_finance_links" DROP CONSTRAINT "focus_finance_links_budget_id_fkey";

-- DropForeignKey
ALTER TABLE "focus_finance_links" DROP CONSTRAINT "focus_finance_links_quarterly_goal_id_fkey";

-- DropForeignKey
ALTER TABLE "focus_finance_links" DROP CONSTRAINT "focus_finance_links_savings_goal_id_fkey";

-- DropForeignKey
ALTER TABLE "focus_habit_links" DROP CONSTRAINT "focus_habit_links_habit_id_fkey";

-- DropForeignKey
ALTER TABLE "focus_habit_links" DROP CONSTRAINT "focus_habit_links_quarterly_goal_id_fkey";

-- DropForeignKey
ALTER TABLE "focus_task_links" DROP CONSTRAINT "focus_task_links_quarterly_goal_id_fkey";

-- DropForeignKey
ALTER TABLE "focus_task_links" DROP CONSTRAINT "focus_task_links_task_id_fkey";

-- DropForeignKey
ALTER TABLE "goal_health_snapshots" DROP CONSTRAINT "goal_health_snapshots_quarterly_goal_id_fkey";

-- DropForeignKey
ALTER TABLE "goal_health_snapshots" DROP CONSTRAINT "goal_health_snapshots_user_id_fkey";

-- DropForeignKey
ALTER TABLE "prime_visions" DROP CONSTRAINT "prime_visions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "quarterly_goals" DROP CONSTRAINT "quarterly_goals_annual_goal_id_fkey";

-- DropForeignKey
ALTER TABLE "three_year_goals" DROP CONSTRAINT "three_year_goals_vision_id_fkey";

-- DropForeignKey
ALTER TABLE "user_work_preferences" DROP CONSTRAINT "user_work_preferences_user_id_fkey";

-- DropIndex
DROP INDEX "quarterly_goals_annual_goal_id_idx";

-- AlterTable
ALTER TABLE "quarterly_goals" DROP COLUMN "annual_goal_id";

-- DropTable
DROP TABLE "annual_goals";

-- DropTable
DROP TABLE "focus_finance_links";

-- DropTable
DROP TABLE "focus_habit_links";

-- DropTable
DROP TABLE "focus_task_links";

-- DropTable
DROP TABLE "goal_health_snapshots";

-- DropTable
DROP TABLE "prime_visions";

-- DropTable
DROP TABLE "three_year_goals";

-- DropTable
DROP TABLE "user_work_preferences";

-- DropEnum
DROP TYPE "PillarArea";
