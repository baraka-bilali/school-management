-- Allow one Subject to be shared by PrimaryBranch rows across degrees
DROP INDEX IF EXISTS "PrimaryBranch_subjectId_key";
CREATE INDEX IF NOT EXISTS "PrimaryBranch_subjectId_idx" ON "PrimaryBranch"("subjectId");
