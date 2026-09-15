-- CreateTable
CREATE TABLE IF NOT EXISTS "BulletinPublication" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "kind" "GradeLockKind" NOT NULL,
    "periodId" INTEGER,
    "periodGroupId" INTEGER,
    "eventKey" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedByUserId" INTEGER NOT NULL,

    CONSTRAINT "BulletinPublication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BulletinPublication_classId_eventKey_key"
  ON "BulletinPublication"("classId", "eventKey");

CREATE INDEX IF NOT EXISTS "BulletinPublication_schoolId_classId_idx"
  ON "BulletinPublication"("schoolId", "classId");

CREATE INDEX IF NOT EXISTS "BulletinPublication_periodId_idx"
  ON "BulletinPublication"("periodId");

CREATE INDEX IF NOT EXISTS "BulletinPublication_periodGroupId_idx"
  ON "BulletinPublication"("periodGroupId");

CREATE INDEX IF NOT EXISTS "BulletinPublication_publishedByUserId_idx"
  ON "BulletinPublication"("publishedByUserId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "BulletinPublication"
    ADD CONSTRAINT "BulletinPublication_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "BulletinPublication"
    ADD CONSTRAINT "BulletinPublication_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "BulletinPublication"
    ADD CONSTRAINT "BulletinPublication_periodId_fkey"
    FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "BulletinPublication"
    ADD CONSTRAINT "BulletinPublication_periodGroupId_fkey"
    FOREIGN KEY ("periodGroupId") REFERENCES "PeriodGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "BulletinPublication"
    ADD CONSTRAINT "BulletinPublication_publishedByUserId_fkey"
    FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
