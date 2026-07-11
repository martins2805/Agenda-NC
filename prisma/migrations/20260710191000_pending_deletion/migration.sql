-- CreateTable
CREATE TABLE "PendingDeletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "requestedInMessageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingDeletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingDeletion_userId_idx" ON "PendingDeletion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PendingDeletion_userId_entityType_entityId_key" ON "PendingDeletion"("userId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "PendingDeletion" ADD CONSTRAINT "PendingDeletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
