-- Add profile fields used by the application but missing from older businesses tables.
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS "bankId" text,
  ADD COLUMN IF NOT EXISTS "isTaxRegistered" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "taxRegistrationDate" text,
  ADD COLUMN IF NOT EXISTS "isTaxCompliant" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "retentionPeriodYears" integer NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS "retentionExpiry" text;

-- Preserve the selected bank identifier from the legacy lowercase column.
UPDATE public.businesses
SET "bankId" = NULLIF(bankid, '')
WHERE "bankId" IS NULL
  AND bankid IS NOT NULL;
