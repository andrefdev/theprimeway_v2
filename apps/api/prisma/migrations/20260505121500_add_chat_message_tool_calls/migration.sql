-- Persist AI tool calls per assistant message and optimize history fetch by chronological order.

-- DropIndex
DROP INDEX "chat_messages_thread_id_idx";

-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN "tool_calls" JSONB;

-- CreateIndex
CREATE INDEX "chat_messages_thread_id_created_at_idx" ON "chat_messages"("thread_id", "created_at");
