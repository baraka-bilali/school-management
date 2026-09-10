-- Cycles d'évaluation configurables (primaire / secondaire) et périodes

DO $$ BEGIN
  CREATE TYPE "EvaluationCycleKind" AS ENUM ('PRIMARY', 'SECONDARY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "EvaluationCycle" (
  "id" SERIAL PRIMARY KEY,
  "schoolId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "EvaluationCycleKind" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "EvaluationCycle_schoolId_kind_key"
  ON "EvaluationCycle"("schoolId", "kind");
CREATE INDEX IF NOT EXISTS "EvaluationCycle_schoolId_idx"
  ON "EvaluationCycle"("schoolId");

DO $$ BEGIN
  ALTER TABLE "EvaluationCycle"
    ADD CONSTRAINT "EvaluationCycle_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "EvaluationCycleSection" (
  "id" SERIAL PRIMARY KEY,
  "cycleId" INTEGER NOT NULL,
  "section" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "EvaluationCycleSection_cycleId_section_key"
  ON "EvaluationCycleSection"("cycleId", "section");
CREATE INDEX IF NOT EXISTS "EvaluationCycleSection_section_idx"
  ON "EvaluationCycleSection"("section");

DO $$ BEGIN
  ALTER TABLE "EvaluationCycleSection"
    ADD CONSTRAINT "EvaluationCycleSection_cycleId_fkey"
    FOREIGN KEY ("cycleId") REFERENCES "EvaluationCycle"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "PeriodGroup" (
  "id" SERIAL PRIMARY KEY,
  "cycleId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "hasExam" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "PeriodGroup_cycleId_sortOrder_key"
  ON "PeriodGroup"("cycleId", "sortOrder");
CREATE INDEX IF NOT EXISTS "PeriodGroup_cycleId_idx"
  ON "PeriodGroup"("cycleId");

DO $$ BEGIN
  ALTER TABLE "PeriodGroup"
    ADD CONSTRAINT "PeriodGroup_cycleId_fkey"
    FOREIGN KEY ("cycleId") REFERENCES "EvaluationCycle"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Period" (
  "id" SERIAL PRIMARY KEY,
  "periodGroupId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Period_periodGroupId_sortOrder_key"
  ON "Period"("periodGroupId", "sortOrder");
CREATE INDEX IF NOT EXISTS "Period_periodGroupId_idx"
  ON "Period"("periodGroupId");

DO $$ BEGIN
  ALTER TABLE "Period"
    ADD CONSTRAINT "Period_periodGroupId_fkey"
    FOREIGN KEY ("periodGroupId") REFERENCES "PeriodGroup"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
