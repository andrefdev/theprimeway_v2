-- Add idempotency_key to commands so retried scheduling requests resolve to
-- the same Command row instead of creating duplicate sessions / Google events.
-- Nullable + unique: existing rows stay valid; new requests opt in by sending
-- the `Idempotency-Key` header.

ALTER TABLE "commands"
  ADD COLUMN "idempotency_key" TEXT;

CREATE UNIQUE INDEX "commands_idempotency_key_key"
  ON "commands"("idempotency_key");
