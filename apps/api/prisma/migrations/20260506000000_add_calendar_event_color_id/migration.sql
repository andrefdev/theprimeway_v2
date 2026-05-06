-- Add colorId to CalendarEvent to store Google's event color (1-11)
ALTER TABLE "calendar_events" ADD COLUMN "color_id" TEXT;
