-- Ajout date d'inscription pour graphiques et statistiques
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Rétro-remplissage : date de création du compte élève
UPDATE "Enrollment" e
SET "createdAt" = u."createdAt"
FROM "Student" s
JOIN "User" u ON s."userId" = u."id"
WHERE e."studentId" = s."id";

CREATE INDEX IF NOT EXISTS "Enrollment_yearId_createdAt_idx" ON "Enrollment"("yearId", "createdAt");
