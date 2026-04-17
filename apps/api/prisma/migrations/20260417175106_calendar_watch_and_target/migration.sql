-- AlterTable
ALTER TABLE "calendar_accounts" ADD COLUMN "default_target_calendar_id" TEXT;

-- CreateTable
CREATE TABLE "calendar_watch_channels" (
    "id" TEXT NOT NULL,
    "calendar_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "token" TEXT,
    "sync_token" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_watch_channels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calendar_watch_channels_channel_id_key" ON "calendar_watch_channels"("channel_id");

-- CreateIndex
CREATE INDEX "calendar_watch_channels_calendar_id_idx" ON "calendar_watch_channels"("calendar_id");

-- CreateIndex
CREATE INDEX "calendar_watch_channels_expires_at_idx" ON "calendar_watch_channels"("expires_at");

-- AddForeignKey
ALTER TABLE "calendar_watch_channels" ADD CONSTRAINT "calendar_watch_channels_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
