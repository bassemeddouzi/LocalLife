-- CreateEnum
CREATE TYPE "AiDigestTargetType" AS ENUM ('PLACE', 'ZONE', 'TRANSPORT_SYSTEM');

-- CreateEnum
CREATE TYPE "AiIssueSignalType" AS ENUM ('PLACE_CLOSED_REPORT', 'INACCURATE_INFO_REPORT', 'SAFETY_CONCERN_REPORT', 'TRANSPORT_PROBLEM_REPORT', 'GENERAL_ISSUE');

-- CreateEnum
CREATE TYPE "AiIssueSignalStatus" AS ENUM ('OPEN', 'NOTIFIED', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- AlterTable
ALTER TABLE "Message"
ADD COLUMN "compressedAt" TIMESTAMP(3),
ADD COLUMN "compressionVersion" INTEGER,
ADD COLUMN "issueSignalScannedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserPreference"
ADD COLUMN "aiProfileHash" TEXT,
ADD COLUMN "aiProfileJson" JSONB,
ADD COLUMN "aiProfileUpdatedAt" TIMESTAMP(3),
ADD COLUMN "aiProfileVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "AiDigest" (
    "id" TEXT NOT NULL,
    "targetType" "AiDigestTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "cityId" TEXT,
    "sourceHash" TEXT NOT NULL,
    "digestVersion" INTEGER NOT NULL DEFAULT 1,
    "digestJson" JSONB NOT NULL,
    "summaryText" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDigest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSessionContext" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT,
    "planId" TEXT,
    "cityId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "contextVersion" INTEGER NOT NULL DEFAULT 1,
    "groupType" TEXT,
    "mood" TEXT,
    "budgetNow" "BudgetBand",
    "conservatismNow" "ConservatismLevel",
    "hasPrivateTransport" BOOLEAN,
    "walksOkNow" BOOLEAN,
    "maxEndTimeIso" TEXT,
    "mustAvoidJson" JSONB,
    "contextJson" JSONB,
    "sourceMessageId" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSessionContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTokenUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "conversationId" TEXT,
    "messageId" TEXT,
    "provider" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "intentType" TEXT,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostUsd" DECIMAL(10,6),
    "latencyMs" INTEGER,
    "cachedHit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiTokenUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiIssueSignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "conversationId" TEXT,
    "messageId" TEXT,
    "signalType" "AiIssueSignalType" NOT NULL,
    "severity" "RuleSeverity" NOT NULL DEFAULT 'INFO',
    "status" "AiIssueSignalStatus" NOT NULL DEFAULT 'OPEN',
    "cityId" TEXT,
    "placeId" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "assignedGuideUserId" TEXT,
    "reason" TEXT NOT NULL,
    "evidenceJson" JSONB,
    "notifiedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiIssueSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiDigest_targetType_targetId_key" ON "AiDigest"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AiDigest_cityId_targetType_idx" ON "AiDigest"("cityId", "targetType");

-- CreateIndex
CREATE INDEX "AiDigest_generatedAt_idx" ON "AiDigest"("generatedAt");

-- CreateIndex
CREATE INDEX "ClientSessionContext_userId_isActive_updatedAt_idx" ON "ClientSessionContext"("userId", "isActive", "updatedAt");

-- CreateIndex
CREATE INDEX "ClientSessionContext_conversationId_idx" ON "ClientSessionContext"("conversationId");

-- CreateIndex
CREATE INDEX "ClientSessionContext_planId_idx" ON "ClientSessionContext"("planId");

-- CreateIndex
CREATE INDEX "AiTokenUsage_userId_createdAt_idx" ON "AiTokenUsage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiTokenUsage_conversationId_createdAt_idx" ON "AiTokenUsage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AiTokenUsage_provider_modelId_createdAt_idx" ON "AiTokenUsage"("provider", "modelId", "createdAt");

-- CreateIndex
CREATE INDEX "AiIssueSignal_status_createdAt_idx" ON "AiIssueSignal"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AiIssueSignal_userId_createdAt_idx" ON "AiIssueSignal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiIssueSignal_assignedGuideUserId_status_idx" ON "AiIssueSignal"("assignedGuideUserId", "status");

-- CreateIndex
CREATE INDEX "AiIssueSignal_placeId_status_idx" ON "AiIssueSignal"("placeId", "status");

-- AddForeignKey
ALTER TABLE "ClientSessionContext" ADD CONSTRAINT "ClientSessionContext_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

