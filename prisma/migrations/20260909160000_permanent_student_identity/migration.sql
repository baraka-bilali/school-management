-- Enums
ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'PROPOSEE';
ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'CONFIRMEE';

DO $$ BEGIN
  CREATE TYPE "EnrollmentOrigine" AS ENUM ('NOUVEL_ENTRANT', 'PASSAGE', 'REDOUBLEMENT', 'TRANSFERT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DecisionPassage" AS ENUM ('PASSAGE', 'REDOUBLEMENT', 'ORIENTATION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Class.nextClassId
ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "nextClassId" INTEGER;
DO $$ BEGIN
  ALTER TABLE "Class" ADD CONSTRAINT "Class_nextClassId_fkey"
    FOREIGN KEY ("nextClassId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "Class_nextClassId_idx" ON "Class"("nextClassId");

-- ParentStudent.isPrimaryContact
ALTER TABLE "ParentStudent" ADD COLUMN IF NOT EXISTS "isPrimaryContact" BOOLEAN NOT NULL DEFAULT false;

-- Enrollment: new columns
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "origine" "EnrollmentOrigine" NOT NULL DEFAULT 'NOUVEL_ENTRANT';
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "decisionPassage" "DecisionPassage";
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "dateDecision" TIMESTAMP(3);
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "commentaireConseil" TEXT;

-- Move Student.code -> Enrollment.code (best-effort from existing enrollments)
UPDATE "Enrollment" e
SET "code" = COALESCE(
  NULLIF(split_part(s."code", ':', 3), ''),
  NULLIF(split_part(s."code", ':', 2), ''),
  s."code"
)
FROM "Student" s
WHERE e."studentId" = s.id
  AND e."code" IS NULL
  AND s."code" IS NOT NULL;

-- Student.permanentCode
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "permanentCode" TEXT;
UPDATE "Student" s
SET "permanentCode" = 'ELV-' || s.id
WHERE s."permanentCode" IS NULL OR s."permanentCode" = '';
ALTER TABLE "Student" ALTER COLUMN "permanentCode" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Student_permanentCode_key" ON "Student"("permanentCode");

-- Drop old Student.code
DROP INDEX IF EXISTS "Student_code_idx";
ALTER TABLE "Student" DROP COLUMN IF EXISTS "code";

-- Replace Enrollment unique (studentId, classId, yearId) with (studentId, yearId)
ALTER TABLE "Enrollment" DROP CONSTRAINT IF EXISTS "Enrollment_studentId_classId_yearId_key";
DROP INDEX IF EXISTS "Enrollment_studentId_classId_yearId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Enrollment_studentId_yearId_key" ON "Enrollment"("studentId", "yearId");
CREATE INDEX IF NOT EXISTS "Enrollment_classId_yearId_code_idx" ON "Enrollment"("classId", "yearId", "code");
