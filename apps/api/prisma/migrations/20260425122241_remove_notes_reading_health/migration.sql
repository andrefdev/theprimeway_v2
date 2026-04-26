/*
  Warnings:

  - You are about to drop the `book_masters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `health_metrics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `note_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reading_goals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_books` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "health_metrics" DROP CONSTRAINT "health_metrics_user_id_fkey";

-- DropForeignKey
ALTER TABLE "note_categories" DROP CONSTRAINT "note_categories_user_id_fkey";

-- DropForeignKey
ALTER TABLE "notes" DROP CONSTRAINT "notes_category_id_fkey";

-- DropForeignKey
ALTER TABLE "notes" DROP CONSTRAINT "notes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "reading_goals" DROP CONSTRAINT "reading_goals_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_books" DROP CONSTRAINT "user_books_book_id_fkey";

-- DropForeignKey
ALTER TABLE "user_books" DROP CONSTRAINT "user_books_user_id_fkey";

-- DropTable
DROP TABLE "book_masters";

-- DropTable
DROP TABLE "health_metrics";

-- DropTable
DROP TABLE "note_categories";

-- DropTable
DROP TABLE "notes";

-- DropTable
DROP TABLE "reading_goals";

-- DropTable
DROP TABLE "user_books";
