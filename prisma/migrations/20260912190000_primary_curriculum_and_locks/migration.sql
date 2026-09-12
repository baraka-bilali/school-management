-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PrimaryDegreeCode" AS ENUM ('ELEMENTAIRE', 'MOYEN', 'TERMINAL_5', 'TERMINAL_6');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "GradeLockKind" AS ENUM ('PERIOD', 'EXAM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable Class
ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "titulaireTeacherId" INTEGER;

CREATE INDEX IF NOT EXISTS "Class_titulaireTeacherId_idx" ON "Class"("titulaireTeacherId");

DO $$ BEGIN
  ALTER TABLE "Class" ADD CONSTRAINT "Class_titulaireTeacherId_fkey"
    FOREIGN KEY ("titulaireTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable PrimaryDegree
CREATE TABLE IF NOT EXISTS "PrimaryDegree" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "code" "PrimaryDegreeCode" NOT NULL,
    "name" TEXT NOT NULL,
    "levelsJson" TEXT NOT NULL,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrimaryDegree_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PrimaryDomain" (
    "id" SERIAL NOT NULL,
    "degreeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrimaryDomain_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PrimaryGroup" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrimaryGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PrimaryBranch" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER NOT NULL,
    "groupId" INTEGER,
    "name" TEXT NOT NULL,
    "maxPeriode" DOUBLE PRECISION NOT NULL,
    "maxExamenOverride" DOUBLE PRECISION,
    "maxTrimestreOverride" DOUBLE PRECISION,
    "maxAnnuelOverride" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "subjectId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrimaryBranch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GradeEntryLock" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "kind" "GradeLockKind" NOT NULL,
    "periodId" INTEGER,
    "periodGroupId" INTEGER,
    "courseAssignmentId" INTEGER,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedByUserId" INTEGER NOT NULL,
    "unlockedAt" TIMESTAMP(3),
    "unlockedByUserId" INTEGER,
    "unlockReason" TEXT,

    CONSTRAINT "GradeEntryLock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PrimaryDegree_schoolId_code_key" ON "PrimaryDegree"("schoolId", "code");
CREATE INDEX IF NOT EXISTS "PrimaryDegree_schoolId_idx" ON "PrimaryDegree"("schoolId");
CREATE INDEX IF NOT EXISTS "PrimaryDomain_degreeId_sortOrder_idx" ON "PrimaryDomain"("degreeId", "sortOrder");
CREATE INDEX IF NOT EXISTS "PrimaryGroup_domainId_sortOrder_idx" ON "PrimaryGroup"("domainId", "sortOrder");
CREATE UNIQUE INDEX IF NOT EXISTS "PrimaryBranch_subjectId_key" ON "PrimaryBranch"("subjectId");
CREATE INDEX IF NOT EXISTS "PrimaryBranch_domainId_sortOrder_idx" ON "PrimaryBranch"("domainId", "sortOrder");
CREATE INDEX IF NOT EXISTS "PrimaryBranch_groupId_idx" ON "PrimaryBranch"("groupId");
CREATE INDEX IF NOT EXISTS "GradeEntryLock_schoolId_classId_subjectId_idx" ON "GradeEntryLock"("schoolId", "classId", "subjectId");
CREATE INDEX IF NOT EXISTS "GradeEntryLock_periodId_idx" ON "GradeEntryLock"("periodId");
CREATE INDEX IF NOT EXISTS "GradeEntryLock_periodGroupId_idx" ON "GradeEntryLock"("periodGroupId");
CREATE INDEX IF NOT EXISTS "GradeEntryLock_lockedByUserId_idx" ON "GradeEntryLock"("lockedByUserId");

DO $$ BEGIN
  ALTER TABLE "PrimaryDegree" ADD CONSTRAINT "PrimaryDegree_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PrimaryDomain" ADD CONSTRAINT "PrimaryDomain_degreeId_fkey" FOREIGN KEY ("degreeId") REFERENCES "PrimaryDegree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PrimaryGroup" ADD CONSTRAINT "PrimaryGroup_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "PrimaryDomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PrimaryBranch" ADD CONSTRAINT "PrimaryBranch_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "PrimaryDomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PrimaryBranch" ADD CONSTRAINT "PrimaryBranch_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PrimaryGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PrimaryBranch" ADD CONSTRAINT "PrimaryBranch_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "GradeEntryLock" ADD CONSTRAINT "GradeEntryLock_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "GradeEntryLock" ADD CONSTRAINT "GradeEntryLock_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "GradeEntryLock" ADD CONSTRAINT "GradeEntryLock_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "GradeEntryLock" ADD CONSTRAINT "GradeEntryLock_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "GradeEntryLock" ADD CONSTRAINT "GradeEntryLock_periodGroupId_fkey" FOREIGN KEY ("periodGroupId") REFERENCES "PeriodGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
