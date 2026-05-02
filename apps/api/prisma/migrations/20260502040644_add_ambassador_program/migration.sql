-- CreateEnum
CREATE TYPE "AmbassadorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AmbassadorPlatform" AS ENUM ('YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'TWITTER', 'NEWSLETTER', 'BLOG', 'PODCAST', 'LINKEDIN', 'OTHER');

-- CreateEnum
CREATE TYPE "ReferralSource" AS ENUM ('SIGNUP_CODE', 'LATE_ENTRY', 'LINK');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('SIGNED_UP', 'TRIAL', 'ACTIVE', 'CHURNED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CLAWED_BACK');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referral_entered_at" TIMESTAMP(3),
ADD COLUMN     "referred_by_ambassador_id" TEXT;

-- CreateTable
CREATE TABLE "ambassadors" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "AmbassadorStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "full_name" TEXT NOT NULL,
    "contact_phone" TEXT,
    "country" TEXT NOT NULL,
    "primary_platform" "AmbassadorPlatform" NOT NULL,
    "primary_handle" TEXT NOT NULL,
    "audience_size" INTEGER,
    "niche" TEXT,
    "motivation" TEXT NOT NULL,
    "promo_channels" TEXT[],
    "sample_urls" TEXT[],
    "social_links" JSONB,
    "payout_method" TEXT,
    "payout_details" JSONB,
    "agreed_to_terms" BOOLEAN NOT NULL DEFAULT false,
    "referral_code" TEXT,
    "tier_id" TEXT,
    "custom_commission_pct" DECIMAL(5,2),
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambassadors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambassador_tiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "min_active_referrals" INTEGER NOT NULL,
    "commission_pct" DECIMAL(5,2) NOT NULL,
    "perks" TEXT[],
    "badge_color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambassador_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "ambassador_id" TEXT NOT NULL,
    "referred_user_id" TEXT NOT NULL,
    "source" "ReferralSource" NOT NULL DEFAULT 'SIGNUP_CODE',
    "status" "ReferralStatus" NOT NULL DEFAULT 'SIGNED_UP',
    "first_paid_at" TIMESTAMP(3),
    "churned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "ambassador_id" TEXT NOT NULL,
    "referral_id" TEXT NOT NULL,
    "period_month" TEXT NOT NULL,
    "subscription_id" TEXT,
    "gross_amount_cents" INTEGER NOT NULL,
    "commission_pct" DECIMAL(5,2) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "payout_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambassador_payouts" (
    "id" TEXT NOT NULL,
    "ambassador_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "external_ref" TEXT,
    "notes" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "paid_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ambassador_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ambassadors_user_id_key" ON "ambassadors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ambassadors_referral_code_key" ON "ambassadors"("referral_code");

-- CreateIndex
CREATE INDEX "ambassadors_status_idx" ON "ambassadors"("status");

-- CreateIndex
CREATE INDEX "ambassadors_referral_code_idx" ON "ambassadors"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "ambassador_tiers_name_key" ON "ambassador_tiers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ambassador_tiers_order_key" ON "ambassador_tiers"("order");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referred_user_id_key" ON "referrals"("referred_user_id");

-- CreateIndex
CREATE INDEX "referrals_ambassador_id_status_idx" ON "referrals"("ambassador_id", "status");

-- CreateIndex
CREATE INDEX "commissions_ambassador_id_status_idx" ON "commissions"("ambassador_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_referral_id_period_month_key" ON "commissions"("referral_id", "period_month");

-- CreateIndex
CREATE INDEX "ambassador_payouts_ambassador_id_idx" ON "ambassador_payouts"("ambassador_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referred_by_ambassador_id_fkey" FOREIGN KEY ("referred_by_ambassador_id") REFERENCES "ambassadors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassadors" ADD CONSTRAINT "ambassadors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassadors" ADD CONSTRAINT "ambassadors_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "ambassador_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_ambassador_id_fkey" FOREIGN KEY ("ambassador_id") REFERENCES "ambassadors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_ambassador_id_fkey" FOREIGN KEY ("ambassador_id") REFERENCES "ambassadors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "ambassador_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassador_payouts" ADD CONSTRAINT "ambassador_payouts_ambassador_id_fkey" FOREIGN KEY ("ambassador_id") REFERENCES "ambassadors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
