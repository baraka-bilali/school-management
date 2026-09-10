-- Maxima officiels : distinguer la filière (stream) pour les Humanités

ALTER TABLE "SubjectPeriodMax" ADD COLUMN IF NOT EXISTS "stream" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SubjectExamMax" ADD COLUMN IF NOT EXISTS "stream" TEXT NOT NULL DEFAULT '';

DROP INDEX IF EXISTS "SubjectPeriodMax_subjectId_section_level_periodId_key";
DROP INDEX IF EXISTS "SubjectExamMax_subjectId_section_level_periodGroupId_key";
DROP INDEX IF EXISTS "SubjectPeriodMax_section_level_idx";
DROP INDEX IF EXISTS "SubjectExamMax_section_level_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "SubjectPeriodMax_subjectId_section_level_stream_periodId_key"
  ON "SubjectPeriodMax"("subjectId", "section", "level", "stream", "periodId");
CREATE INDEX IF NOT EXISTS "SubjectPeriodMax_section_level_stream_idx"
  ON "SubjectPeriodMax"("section", "level", "stream");

CREATE UNIQUE INDEX IF NOT EXISTS "SubjectExamMax_subjectId_section_level_stream_periodGroupId_key"
  ON "SubjectExamMax"("subjectId", "section", "level", "stream", "periodGroupId");
CREATE INDEX IF NOT EXISTS "SubjectExamMax_section_level_stream_idx"
  ON "SubjectExamMax"("section", "level", "stream");
