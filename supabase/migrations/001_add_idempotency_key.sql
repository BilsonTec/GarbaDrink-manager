-- Migration: Add idempotency_key to ventes table
-- Purpose: Enable offline-first sale tracking with client-side deduplication

ALTER TABLE ventes ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- Create index for faster lookups on idempotency_key
CREATE INDEX IF NOT EXISTS idx_ventes_idempotency_key ON ventes(idempotency_key);

-- Add comment for documentation
COMMENT ON COLUMN ventes.idempotency_key IS 'Client-generated UUID for deduplicating offline synced sales';
