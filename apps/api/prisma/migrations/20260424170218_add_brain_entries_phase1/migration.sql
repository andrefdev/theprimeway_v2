-- CreateTable
CREATE TABLE "brain_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL DEFAULT 'text',
    "source_device" TEXT,
    "audio_url" TEXT,
    "audio_duration" INTEGER,
    "audio_size" INTEGER,
    "raw_transcript" TEXT,
    "language" TEXT DEFAULT 'en',
    "title" TEXT,
    "summary" TEXT,
    "structured_content" TEXT,
    "topics" JSONB NOT NULL DEFAULT '[]',
    "sentiment" TEXT,
    "action_items" JSONB NOT NULL DEFAULT '[]',
    "ai_metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "processed_at" TIMESTAMP(3),
    "user_title" TEXT,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brain_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brain_cross_links" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "link_type" TEXT NOT NULL DEFAULT 'related',
    "ai_generated" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brain_cross_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brain_entries_user_id_idx" ON "brain_entries"("user_id");

-- CreateIndex
CREATE INDEX "brain_entries_user_id_status_idx" ON "brain_entries"("user_id", "status");

-- CreateIndex
CREATE INDEX "brain_entries_user_id_deleted_at_idx" ON "brain_entries"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "brain_entries_user_id_created_at_idx" ON "brain_entries"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "brain_cross_links_user_id_idx" ON "brain_cross_links"("user_id");

-- CreateIndex
CREATE INDEX "brain_cross_links_entry_id_idx" ON "brain_cross_links"("entry_id");

-- CreateIndex
CREATE INDEX "brain_cross_links_target_type_target_id_idx" ON "brain_cross_links"("target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "brain_cross_links_entry_id_target_type_target_id_key" ON "brain_cross_links"("entry_id", "target_type", "target_id");

-- AddForeignKey
ALTER TABLE "brain_entries" ADD CONSTRAINT "brain_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brain_cross_links" ADD CONSTRAINT "brain_cross_links_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "brain_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
