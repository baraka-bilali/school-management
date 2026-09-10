-- Regroupement optionnel des matières + maxima officiels (période / examen)

ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "groupLabel" TEXT;
ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "parentSubjectId" INTEGER;

CREATE INDEX IF NOT EXISTS "Subject_parentSubjectId_idx" ON "Subject"("parentSubjectId");
CREATE INDEX IF NOT EXISTS "Subject_groupLabel_idx" ON "Subject"("groupLabel");

DO $$ BEGIN
  ALTER TABLE "Subject"
    ADD CONSTRAINT "Subject_parentSubjectId_fkey"
    FOREIGN KEY ("parentSubjectId") REFERENCES "Subject"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "SubjectPeriodMax" (
  "id" SERIAL PRIMARY KEY,
  "subjectId" INTEGER NOT NULL,
  "classId" INTEGER NOT NULL,
  "periodId" INTEGER NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "maxPoints" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "SubjectPeriodMax_subjectId_classId_periodId_key"
  ON "SubjectPeriodMax"("subjectId", "classId", "periodId");
CREATE INDEX IF NOT EXISTS "SubjectPeriodMax_schoolId_idx" ON "SubjectPeriodMax"("schoolId");
CREATE INDEX IF NOT EXISTS "SubjectPeriodMax_classId_idx" ON "SubjectPeriodMax"("classId");
CREATE INDEX IF NOT EXISTS "SubjectPeriodMax_periodId_idx" ON "SubjectPeriodMax"("periodId");

DO $$ BEGIN
  ALTER TABLE "SubjectPeriodMax"
    ADD CONSTRAINT "SubjectPeriodMax_subjectId_fkey"
    FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "SubjectPeriodMax"
    ADD CONSTRAINT "SubjectPeriodMax_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "SubjectPeriodMax"
    ADD CONSTRAINT "SubjectPeriodMax_periodId_fkey"
    FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "SubjectExamMax" (
  "id" SERIAL PRIMARY KEY,
  "subjectId" INTEGER NOT NULL,
  "classId" INTEGER NOT NULL,
  "periodGroupId" INTEGER NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "maxPoints" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "SubjectExamMax_subjectId_classId_periodGroupId_key"
  ON "SubjectExamMax"("subjectId", "classId", "periodGroupId");
CREATE INDEX IF NOT EXISTS "SubjectExamMax_schoolId_idx" ON "SubjectExamMax"("schoolId");
CREATE INDEX IF NOT EXISTS "SubjectExamMax_classId_idx" ON "SubjectExamMax"("classId");
CREATE INDEX IF NOT EXISTS "SubjectExamMax_periodGroupId_idx" ON "SubjectExamMax"("periodGroupId");

DO $$ BEGIN
  ALTER TABLE "SubjectExamMax"
    ADD CONSTRAINT "SubjectExamMax_subjectId_fkey"
    FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "SubjectExamMax"
    ADD CONSTRAINT "SubjectExamMax_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "SubjectExamMax"
    ADD CONSTRAINT "SubjectExamMax_periodGroupId_fkey"
    FOREIGN KEY ("periodGroupId") REFERENCES "PeriodGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
