-- Add yearId to Communique for per-school-year separation
ALTER TABLE "Communique" ADD COLUMN IF NOT EXISTS "yearId" INTEGER;

-- Backfill from school_settings.current_year_id
UPDATE "Communique" c
SET "yearId" = ss.current_year_id
FROM school_settings ss
WHERE ss.school_id = c."schoolId"
  AND c."yearId" IS NULL
  AND ss.current_year_id IS NOT NULL;

-- Fallback: global current academic year
UPDATE "Communique" c
SET "yearId" = (SELECT id FROM "AcademicYear" WHERE current = true LIMIT 1)
WHERE c."yearId" IS NULL;

-- Fallback: latest academic year by name
UPDATE "Communique" c
SET "yearId" = (SELECT id FROM "AcademicYear" ORDER BY name DESC LIMIT 1)
WHERE c."yearId" IS NULL;

-- Foreign key and indexes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Communique_yearId_fkey'
  ) THEN
    ALTER TABLE "Communique"
      ADD CONSTRAINT "Communique_yearId_fkey"
      FOREIGN KEY ("yearId") REFERENCES "AcademicYear"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Communique_yearId_idx" ON "Communique"("yearId");
CREATE INDEX IF NOT EXISTS "Communique_schoolId_yearId_idx" ON "Communique"("schoolId", "yearId");
