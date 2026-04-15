-- Backfill NULL colors with default blue
UPDATE "habits" SET color = '#3B82F6' WHERE color IS NULL;
