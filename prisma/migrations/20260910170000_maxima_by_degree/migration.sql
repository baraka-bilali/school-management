-- Maxima officiels au niveau degré (section + level), pas par classe parallèle

DROP TABLE IF EXISTS "SubjectPeriodMax";
DROP TABLE IF EXISTS "SubjectExamMax";

CREATE TABLE "SubjectPeriodMax" (
  "id" SERIAL PRIMARY KEY,
  "subjectId" INTEGER NOT NULL,
  "section" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "periodId" INTEGER NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "maxPoints" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "SubjectPeriodMax_subjectId_section_level_periodId_key"
  ON "SubjectPeriodMax"("subjectId", "section", "level", "periodId");
CREATE INDEX "SubjectPeriodMax_schoolId_idx" ON "SubjectPeriodMax"("schoolId");
CREATE INDEX "SubjectPeriodMax_section_level_idx" ON "SubjectPeriodMax"("section", "level");
CREATE INDEX "SubjectPeriodMax_periodId_idx" ON "SubjectPeriodMax"("periodId");

ALTER TABLE "SubjectPeriodMax"
  ADD CONSTRAINT "SubjectPeriodMax_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubjectPeriodMax"
  ADD CONSTRAINT "SubjectPeriodMax_periodId_fkey"
  FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SubjectExamMax" (
  "id" SERIAL PRIMARY KEY,
  "subjectId" INTEGER NOT NULL,
  "section" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "periodGroupId" INTEGER NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "maxPoints" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "SubjectExamMax_subjectId_section_level_periodGroupId_key"
  ON "SubjectExamMax"("subjectId", "section", "level", "periodGroupId");
CREATE INDEX "SubjectExamMax_schoolId_idx" ON "SubjectExamMax"("schoolId");
CREATE INDEX "SubjectExamMax_section_level_idx" ON "SubjectExamMax"("section", "level");
CREATE INDEX "SubjectExamMax_periodGroupId_idx" ON "SubjectExamMax"("periodGroupId");

ALTER TABLE "SubjectExamMax"
  ADD CONSTRAINT "SubjectExamMax_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubjectExamMax"
  ADD CONSTRAINT "SubjectExamMax_periodGroupId_fkey"
  FOREIGN KEY ("periodGroupId") REFERENCES "PeriodGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
