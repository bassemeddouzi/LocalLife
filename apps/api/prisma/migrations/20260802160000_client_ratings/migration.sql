-- CreateEnum
CREATE TYPE "RatingTargetType" AS ENUM ('PLACE', 'CITY', 'DISTRICT', 'ZONE', 'TRANSPORT_SYSTEM');

-- CreateTable
CREATE TABLE "ClientRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" "RatingTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ClientRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientRating_targetType_targetId_status_idx" ON "ClientRating"("targetType", "targetId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ClientRating_userId_targetType_targetId_key" ON "ClientRating"("userId", "targetType", "targetId");

-- AddForeignKey
ALTER TABLE "ClientRating" ADD CONSTRAINT "ClientRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
