-- AlterEnum DecisionPassage: add RENVOI
ALTER TYPE "DecisionPassage" ADD VALUE IF NOT EXISTS 'RENVOI';

-- EnrollmentDecisionHistory
CREATE TABLE IF NOT EXISTS "EnrollmentDecisionHistory" (
  "id" SERIAL PRIMARY KEY,
  "enrollmentId" INTEGER NOT NULL,
  "oldDecision" "DecisionPassage",
  "newDecision" "DecisionPassage",
  "oldComment" TEXT,
  "newComment" TEXT,
  "changedByUserId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EnrollmentDecisionHistory_enrollmentId_fkey"
    FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EnrollmentDecisionHistory_changedByUserId_fkey"
    FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "EnrollmentDecisionHistory_enrollmentId_idx"
  ON "EnrollmentDecisionHistory"("enrollmentId");
CREATE INDEX IF NOT EXISTS "EnrollmentDecisionHistory_changedByUserId_idx"
  ON "EnrollmentDecisionHistory"("changedByUserId");
CREATE INDEX IF NOT EXISTS "EnrollmentDecisionHistory_createdAt_idx"
  ON "EnrollmentDecisionHistory"("createdAt");
