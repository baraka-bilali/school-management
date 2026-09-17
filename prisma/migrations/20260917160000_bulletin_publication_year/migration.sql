-- Lier les publications de bulletins à l'année scolaire (évite les fuites inter-années)

ALTER TABLE "BulletinPublication" ADD COLUMN IF NOT EXISTS "yearId" INTEGER;

-- Backfill via school_settings.current_year_id, sinon année globale current
UPDATE "BulletinPublication" bp
SET "yearId" = COALESCE(
  (
    SELECT ss.current_year_id
    FROM school_settings ss
    WHERE ss.school_id = bp."schoolId"
      AND ss.current_year_id IS NOT NULL
    LIMIT 1
  ),
  (
    SELECT ay."id"
    FROM "AcademicYear" ay
    WHERE ay."current" = true
    ORDER BY ay."id" DESC
    LIMIT 1
  ),
  (
    SELECT ay."id"
    FROM "AcademicYear" ay
    ORDER BY ay."id" DESC
    LIMIT 1
  )
)
WHERE bp."yearId" IS NULL;

DELETE FROM "BulletinPublication" WHERE "yearId" IS NULL;

ALTER TABLE "BulletinPublication" ALTER COLUMN "yearId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BulletinPublication_yearId_fkey'
  ) THEN
    ALTER TABLE "BulletinPublication"
      ADD CONSTRAINT "BulletinPublication_yearId_fkey"
      FOREIGN KEY ("yearId") REFERENCES "AcademicYear"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DROP INDEX IF EXISTS "BulletinPublication_classId_eventKey_key";
CREATE UNIQUE INDEX IF NOT EXISTS "BulletinPublication_classId_yearId_eventKey_key"
  ON "BulletinPublication"("classId", "yearId", "eventKey");

CREATE INDEX IF NOT EXISTS "BulletinPublication_schoolId_classId_yearId_idx"
  ON "BulletinPublication"("schoolId", "classId", "yearId");

CREATE INDEX IF NOT EXISTS "BulletinPublication_yearId_idx"
  ON "BulletinPublication"("yearId");
