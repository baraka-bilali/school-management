-- Migration: StudentTask table for homework/tasks module
CREATE TABLE IF NOT EXISTS "StudentTask" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "question" TEXT,
    "description" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "classId" INTEGER NOT NULL,
    "subjectId" INTEGER,
    "teacherId" INTEGER NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StudentTask_classId_dueAt_idx" ON "StudentTask"("classId", "dueAt");
CREATE INDEX IF NOT EXISTS "StudentTask_schoolId_isActive_idx" ON "StudentTask"("schoolId", "isActive");

ALTER TABLE "StudentTask" ADD CONSTRAINT "StudentTask_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentTask" ADD CONSTRAINT "StudentTask_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentTask" ADD CONSTRAINT "StudentTask_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
