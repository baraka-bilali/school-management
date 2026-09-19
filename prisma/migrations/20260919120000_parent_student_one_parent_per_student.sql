-- Un élève = un seul parent (ParentStudent.studentId unique)
-- Conservé : le lien le plus ancien (id minimal) en cas de doublons.

DELETE FROM "ParentStudent" a
USING "ParentStudent" b
WHERE a."studentId" = b."studentId"
  AND a.id > b.id;

DROP INDEX IF EXISTS "ParentStudent_parentId_studentId_key";
DROP INDEX IF EXISTS "ParentStudent_studentId_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "ParentStudent_studentId_key" ON "ParentStudent"("studentId");
CREATE INDEX IF NOT EXISTS "ParentStudent_parentId_idx" ON "ParentStudent"("parentId");
