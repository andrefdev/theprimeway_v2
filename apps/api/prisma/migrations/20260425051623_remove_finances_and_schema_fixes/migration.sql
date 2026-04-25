/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `has_finances_module` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `budgets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `debts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `exchange_rates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `import_batches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `income_sources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `investment_holdings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recurring_expenses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `savings_goals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_currency_settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "budgets" DROP CONSTRAINT "budgets_user_id_fkey";

-- DropForeignKey
ALTER TABLE "debts" DROP CONSTRAINT "debts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "import_batches" DROP CONSTRAINT "import_batches_user_id_fkey";

-- DropForeignKey
ALTER TABLE "income_sources" DROP CONSTRAINT "income_sources_user_id_fkey";

-- DropForeignKey
ALTER TABLE "investment_holdings" DROP CONSTRAINT "investment_holdings_account_id_fkey";

-- DropForeignKey
ALTER TABLE "investment_holdings" DROP CONSTRAINT "investment_holdings_user_id_fkey";

-- DropForeignKey
ALTER TABLE "recurring_expenses" DROP CONSTRAINT "recurring_expenses_account_id_fkey";

-- DropForeignKey
ALTER TABLE "recurring_expenses" DROP CONSTRAINT "recurring_expenses_budget_id_fkey";

-- DropForeignKey
ALTER TABLE "recurring_expenses" DROP CONSTRAINT "recurring_expenses_user_id_fkey";

-- DropForeignKey
ALTER TABLE "savings_goals" DROP CONSTRAINT "savings_goals_account_id_fkey";

-- DropForeignKey
ALTER TABLE "savings_goals" DROP CONSTRAINT "savings_goals_user_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_account_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_budget_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_debt_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_import_batch_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_income_source_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_recurring_expense_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_transfer_account_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_currency_settings" DROP CONSTRAINT "user_currency_settings_user_id_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "calendar_accounts" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "calendars" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "chat_threads" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "health_metrics" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "note_categories" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notes" ALTER COLUMN "tags" SET DEFAULT '[]',
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "push_subscriptions" ALTER COLUMN "keys" SET DEFAULT '{}',
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "section_customizations" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "subscription_plans" DROP COLUMN "has_finances_module",
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "task_calendar_bindings" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "tags" SET DEFAULT '[]',
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_profiles" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_settings" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_subscriptions" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_usage_stats" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "webhooks" ALTER COLUMN "updated_at" DROP DEFAULT;

-- DropTable
DROP TABLE "accounts";

-- DropTable
DROP TABLE "budgets";

-- DropTable
DROP TABLE "debts";

-- DropTable
DROP TABLE "exchange_rates";

-- DropTable
DROP TABLE "import_batches";

-- DropTable
DROP TABLE "income_sources";

-- DropTable
DROP TABLE "investment_holdings";

-- DropTable
DROP TABLE "recurring_expenses";

-- DropTable
DROP TABLE "savings_goals";

-- DropTable
DROP TABLE "transactions";

-- DropTable
DROP TABLE "user_currency_settings";

-- AddForeignKey
ALTER TABLE "brain_cross_links" ADD CONSTRAINT "brain_cross_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
