-- Portail parent + cibles / pièces jointes communiqués

ALTER TYPE "User_role" ADD VALUE IF NOT EXISTS 'PARENT';

CREATE TABLE IF NOT EXISTS "Parent" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "lastName" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "middleName" TEXT,
  "phone" TEXT,
  CONSTRAINT "Parent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Parent_userId_key" ON "Parent"("userId");
CREATE INDEX IF NOT EXISTS "Parent_lastName_idx" ON "Parent"("lastName");
CREATE INDEX IF NOT EXISTS "Parent_lastName_firstName_idx" ON "Parent"("lastName", "firstName");

CREATE TABLE IF NOT EXISTS "ParentStudent" (
  "id" SERIAL PRIMARY KEY,
  "parentId" INTEGER NOT NULL,
  "studentId" INTEGER NOT NULL,
  "relationship" TEXT,
  CONSTRAINT "ParentStudent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ParentStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ParentStudent_parentId_studentId_key" ON "ParentStudent"("parentId", "studentId");
CREATE INDEX IF NOT EXISTS "ParentStudent_parentId_idx" ON "ParentStudent"("parentId");
CREATE INDEX IF NOT EXISTS "ParentStudent_studentId_idx" ON "ParentStudent"("studentId");

ALTER TABLE "Communique" ADD COLUMN IF NOT EXISTS "targetStudents" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Communique" ADD COLUMN IF NOT EXISTS "targetParents" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Communique" ADD COLUMN IF NOT EXISTS "targetTeachers" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Communique" ADD COLUMN IF NOT EXISTS "targetStaff" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Communique" ADD COLUMN IF NOT EXISTS "attachmentUrl" TEXT;
ALTER TABLE "Communique" ADD COLUMN IF NOT EXISTS "attachmentName" TEXT;
ALTER TABLE "Communique" ADD COLUMN IF NOT EXISTS "attachmentMime" TEXT;
