-- Colonnes d'évaluation enseignant, notes de période, notes d'examen

CREATE TABLE IF NOT EXISTS "EvaluationColumn" (
  "id" SERIAL PRIMARY KEY,
  "courseAssignmentId" INTEGER NOT NULL,
  "periodId" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "maxPoints" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "EvaluationColumn_courseAssignmentId_periodId_idx"
  ON "EvaluationColumn"("courseAssignmentId", "periodId");
CREATE INDEX IF NOT EXISTS "EvaluationColumn_periodId_idx"
  ON "EvaluationColumn"("periodId");

DO $$ BEGIN
  ALTER TABLE "EvaluationColumn"
    ADD CONSTRAINT "EvaluationColumn_courseAssignmentId_fkey"
    FOREIGN KEY ("courseAssignmentId") REFERENCES "CourseAssignment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "EvaluationColumn"
    ADD CONSTRAINT "EvaluationColumn_periodId_fkey"
    FOREIGN KEY ("periodId") REFERENCES "Period"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Grade" (
  "id" SERIAL PRIMARY KEY,
  "evaluationColumnId" INTEGER NOT NULL,
  "enrollmentId" INTEGER NOT NULL,
  "pointsObtained" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Grade_evaluationColumnId_enrollmentId_key"
  ON "Grade"("evaluationColumnId", "enrollmentId");
CREATE INDEX IF NOT EXISTS "Grade_enrollmentId_idx" ON "Grade"("enrollmentId");

DO $$ BEGIN
  ALTER TABLE "Grade"
    ADD CONSTRAINT "Grade_evaluationColumnId_fkey"
    FOREIGN KEY ("evaluationColumnId") REFERENCES "EvaluationColumn"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Grade"
    ADD CONSTRAINT "Grade_enrollmentId_fkey"
    FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ExamGrade" (
  "id" SERIAL PRIMARY KEY,
  "enrollmentId" INTEGER NOT NULL,
  "subjectId" INTEGER NOT NULL,
  "periodGroupId" INTEGER NOT NULL,
  "courseAssignmentId" INTEGER NOT NULL,
  "pointsObtained" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExamGrade_enrollmentId_subjectId_periodGroupId_key"
  ON "ExamGrade"("enrollmentId", "subjectId", "periodGroupId");
CREATE INDEX IF NOT EXISTS "ExamGrade_periodGroupId_idx" ON "ExamGrade"("periodGroupId");
CREATE INDEX IF NOT EXISTS "ExamGrade_subjectId_idx" ON "ExamGrade"("subjectId");
CREATE INDEX IF NOT EXISTS "ExamGrade_courseAssignmentId_idx" ON "ExamGrade"("courseAssignmentId");

DO $$ BEGIN
  ALTER TABLE "ExamGrade"
    ADD CONSTRAINT "ExamGrade_enrollmentId_fkey"
    FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ExamGrade"
    ADD CONSTRAINT "ExamGrade_subjectId_fkey"
    FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ExamGrade"
    ADD CONSTRAINT "ExamGrade_periodGroupId_fkey"
    FOREIGN KEY ("periodGroupId") REFERENCES "PeriodGroup"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ExamGrade"
    ADD CONSTRAINT "ExamGrade_courseAssignmentId_fkey"
    FOREIGN KEY ("courseAssignmentId") REFERENCES "CourseAssignment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
