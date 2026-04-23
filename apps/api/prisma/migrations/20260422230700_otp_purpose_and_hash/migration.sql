/*
  Warnings:

  - You are about to drop the column `code` on the `email_otp` table. All the data in the column will be lost.
  - Added the required column `code_hash` to the `email_otp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purpose` to the `email_otp` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "email_otp_email_idx";

-- AlterTable
ALTER TABLE "email_otp" DROP COLUMN "code",
ADD COLUMN     "code_hash" TEXT NOT NULL,
ADD COLUMN     "purpose" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "email_otp_email_purpose_idx" ON "email_otp"("email", "purpose");
