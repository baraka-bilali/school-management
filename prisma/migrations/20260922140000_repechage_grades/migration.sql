-- Examen de repêchage (Éducation de Base / CTEB)
CREATE TABLE IF NOT EXISTS "RepechageGrade" (
    "id" SERIAL NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "courseAssignmentId" INTEGER NOT NULL,
    "yearId" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepechageGrade_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RepechageGrade_enrollmentId_subjectId_yearId_key"
  ON "RepechageGrade"("enrollmentId", "subjectId", "yearId");

CREATE INDEX IF NOT EXISTS "RepechageGrade_yearId_idx" ON "RepechageGrade"("yearId");
CREATE INDEX IF NOT EXISTS "RepechageGrade_subjectId_idx" ON "RepechageGrade"("subjectId");
CREATE INDEX IF NOT EXISTS "RepechageGrade_courseAssignmentId_idx" ON "RepechageGrade"("courseAssignmentId");

DO $$ BEGIN
  ALTER TABLE "RepechageGrade" ADD CONSTRAINT "RepechageGrade_enrollmentId_fkey"
    FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "RepechageGrade" ADD CONSTRAINT "RepechageGrade_subjectId_fkey"
    FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "RepechageGrade" ADD CONSTRAINT "RepechageGrade_courseAssignmentId_fkey"
    FOREIGN KEY ("courseAssignmentId") REFERENCES "CourseAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "RepechageGrade" ADD CONSTRAINT "RepechageGrade_yearId_fkey"
    FOREIGN KEY ("yearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
