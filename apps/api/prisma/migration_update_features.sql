-- Migration: Update subscription plan features
-- Purpose: Replace HEALTH_MODULE with module-specific gates and update theme feature
-- Date: 2026-04-12

BEGIN;

-- 1. Drop old column and add new columns for module-specific gates
ALTER TABLE subscription_plans
  DROP COLUMN IF EXISTS has_health_module,
  ADD COLUMN has_reading_module BOOLEAN DEFAULT false,
  ADD COLUMN has_finances_module BOOLEAN DEFAULT false,
  ADD COLUMN has_notes_module BOOLEAN DEFAULT false;

-- 2. Rename custom themes column to custom theme creation
ALTER TABLE subscription_plans
  RENAME COLUMN has_custom_themes TO has_custom_theme_creation;

-- 3. Set premium plan features (assuming plans named 'premium' and 'trial')
UPDATE subscription_plans
SET
  has_reading_module = true,
  has_finances_module = true,
  has_notes_module = true,
  has_custom_theme_creation = true
WHERE name IN ('premium', 'trial');

COMMIT;
