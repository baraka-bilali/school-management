-- CreateTable
CREATE TABLE "CommuniqueUserRead" (
    "id" SERIAL NOT NULL,
    "communiqueId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommuniqueUserRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommuniqueUserRead_communiqueId_userId_key" ON "CommuniqueUserRead"("communiqueId", "userId");

-- CreateIndex
CREATE INDEX "CommuniqueUserRead_userId_idx" ON "CommuniqueUserRead"("userId");

-- CreateIndex
CREATE INDEX "CommuniqueUserRead_communiqueId_idx" ON "CommuniqueUserRead"("communiqueId");

-- AddForeignKey
ALTER TABLE "CommuniqueUserRead" ADD CONSTRAINT "CommuniqueUserRead_communiqueId_fkey" FOREIGN KEY ("communiqueId") REFERENCES "Communique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommuniqueUserRead" ADD CONSTRAINT "CommuniqueUserRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
