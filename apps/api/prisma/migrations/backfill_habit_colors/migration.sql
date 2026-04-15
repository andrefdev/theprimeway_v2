-- Backfill NULL colors with default blue
UPDATE "Habit" SET color = '#3B82F6' WHERE color IS NULL;
