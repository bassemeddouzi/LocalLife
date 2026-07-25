-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'GUIDE', 'BUSINESS', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "PersonaType" AS ENUM ('TOURIST', 'STUDENT', 'EXPAT', 'BUSINESS', 'LOCAL');

-- CreateEnum
CREATE TYPE "BudgetBand" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('UNCLAIMED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "GuideApplicationStatus" AS ENUM ('APPLIED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PriceLevel" AS ENUM ('FREE', 'BUDGET', 'MODERATE', 'EXPENSIVE', 'LUXURY');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('BUS', 'METRO', 'TRAM', 'TRAIN', 'TAXI', 'RIDE_HAILING', 'SHARED_TAXI', 'FERRY', 'BOAT', 'BIKE', 'SCOOTER', 'WALK', 'CAR_RENTAL', 'AIRPORT_SHUTTLE', 'OTHER');

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('FIXED', 'METERED', 'ZONE', 'SUBSCRIPTION', 'NEGOTIABLE', 'FREE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'CONTACTLESS', 'BANK_TRANSFER', 'MOBILE_MONEY', 'APP_PAY', 'TRANSPORT_CARD', 'QR_PAY', 'OTHER');

-- CreateEnum
CREATE TYPE "RuleScope" AS ENUM ('COUNTRY', 'REGION', 'CITY', 'DISTRICT', 'PLACE');

-- CreateEnum
CREATE TYPE "RuleSeverity" AS ENUM ('INFO', 'IMPORTANT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RuleCategory" AS ENUM ('ENTRY_VISA', 'SAFETY', 'TRANSPORT', 'MONEY', 'DRESS_CULTURE', 'RELIGION_CUSTOMS', 'ALCOHOL', 'PHOTOGRAPHY', 'HEALTH', 'INTERNET_COMMS', 'HOUSING', 'WORK_STUDY', 'EMERGENCY', 'SCAM_WARNING', 'OTHER');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('OFFICIAL', 'ADMIN', 'GUIDE_VERIFIED', 'BUSINESS', 'COMMUNITY', 'IMPORTED');

-- CreateEnum
CREATE TYPE "GuideActionType" AS ENUM ('CLEAR_IMMIGRATION', 'BUY_SIM', 'EXCHANGE_MONEY', 'WITHDRAW_ATM', 'TAKE_TAXI', 'TAKE_SHARED_TAXI', 'TAKE_BUS', 'TAKE_FERRY', 'BOOK_TRANSFER', 'GO_TO_PLACE', 'BUY_TICKET', 'INSTALL_APP', 'REGISTER_ACCOUNT', 'CHECK_SAFETY', 'OTHER');

-- CreateEnum
CREATE TYPE "GuideParentType" AS ENUM ('ARRIVAL_GUIDE', 'HOW_TO_GUIDE');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');

-- CreateEnum
CREATE TYPE "FavoriteTargetType" AS ENUM ('PLACE', 'EVENT', 'EXPERIENCE');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('PLACE', 'REVIEW', 'EVENT', 'USER', 'MESSAGE', 'GUIDE_CONTENT');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "GeoStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DISABLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "phone" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "preferredCurrency" TEXT NOT NULL DEFAULT 'TND',
    "personaType" "PersonaType",
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "userId" TEXT NOT NULL,
    "budgetBand" "BudgetBand" NOT NULL DEFAULT 'MEDIUM',
    "homeCityId" TEXT,
    "dietaryNotes" TEXT,
    "accessibilityNotes" TEXT,
    "notifyRecommendations" BOOLEAN NOT NULL DEFAULT true,
    "notifyEvents" BOOLEAN NOT NULL DEFAULT true,
    "notifyMarketing" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursJson" JSONB,
    "consentAnalytics" BOOLEAN NOT NULL DEFAULT false,
    "consentPersonalization" BOOLEAN NOT NULL DEFAULT false,
    "consentPush" BOOLEAN NOT NULL DEFAULT false,
    "consentMarketing" BOOLEAN NOT NULL DEFAULT false,
    "consentUpdatedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "iso2" CHAR(2) NOT NULL,
    "iso3" CHAR(3) NOT NULL,
    "name" TEXT NOT NULL,
    "defaultLocale" TEXT NOT NULL DEFAULT 'en',
    "defaultCurrency" CHAR(3) NOT NULL,
    "timezoneDefault" TEXT,
    "emergencyNumbersJson" JSONB,
    "status" "GeoStatus" NOT NULL DEFAULT 'DRAFT',
    "packVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "status" "GeoStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "regionId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "status" "GeoStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "contentPackVersion" TEXT,
    "defaultLocale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "addressText" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "priceLevel" "PriceLevel",
    "primaryCategoryId" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceType" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "sponsoredUntil" TIMESTAMP(3),
    "trustScore" DECIMAL(5,2),
    "popularityScore" DECIMAL(5,2),
    "createdByUserId" TEXT,
    "ownedByBusinessId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacePhoto" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "uploadedByUserId" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceHour" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "opensAt" TEXT,
    "closesAt" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlaceHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "languages" TEXT[],
    "status" "GuideApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "trustScore" DECIMAL(5,2),
    "portfolioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legalName" TEXT,
    "displayName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "billingInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessPlaceClaim" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "evidenceUrl" TEXT,
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessPlaceClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" "FavoriteTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedByAdminId" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportSystem" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "cityId" TEXT,
    "name" TEXT NOT NULL,
    "mode" "TransportMode" NOT NULL,
    "summary" TEXT NOT NULL,
    "howItWorks" TEXT,
    "accessInstructions" TEXT,
    "pricingType" "PricingType" NOT NULL DEFAULT 'UNKNOWN',
    "priceMin" DECIMAL(12,2),
    "priceMax" DECIMAL(12,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "paymentMethods" "PaymentMethod"[],
    "operatingHoursText" TEXT,
    "coverageNotes" TEXT,
    "warnings" TEXT[],
    "appsJson" JSONB,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceType" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportHub" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "transportSystemId" TEXT NOT NULL,
    "hubType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportHub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportRoute" (
    "id" TEXT NOT NULL,
    "transportSystemId" TEXT NOT NULL,
    "fromHubId" TEXT NOT NULL,
    "toHubId" TEXT NOT NULL,
    "approxDurationMin" INTEGER,
    "priceMin" DECIMAL(12,2),
    "priceMax" DECIMAL(12,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "frequencyNotes" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalRule" (
    "id" TEXT NOT NULL,
    "scope" "RuleScope" NOT NULL,
    "countryId" TEXT,
    "cityId" TEXT,
    "category" "RuleCategory" NOT NULL,
    "severity" "RuleSeverity" NOT NULL DEFAULT 'INFO',
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "sourceType" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "sourceUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArrivalGuide" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "airportPlaceId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "estimatedTotalTimeMin" INTEGER,
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArrivalGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HowToGuide" (
    "id" TEXT NOT NULL,
    "cityId" TEXT,
    "countryId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "categoryKey" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HowToGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideStep" (
    "id" TEXT NOT NULL,
    "parentType" "GuideParentType" NOT NULL,
    "arrivalGuideId" TEXT,
    "howToGuideId" TEXT,
    "stepOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "actionType" "GuideActionType" NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedTimeMin" INTEGER,
    "estimatedCostMin" DECIMAL(12,2),
    "estimatedCostMax" DECIMAL(12,2),
    "currency" CHAR(3),
    "paymentMethods" "PaymentMethod"[],
    "relatedTransportSystemId" TEXT,
    "relatedPlaceId" TEXT,
    "warnings" TEXT[],
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "placeId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "categoryId" TEXT,
    "priceLevel" "PriceLevel",
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "durationMin" INTEGER,
    "priceLevel" "PriceLevel",
    "audience" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceStep" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "placeId" TEXT,
    "estimatedTimeMin" INTEGER,

    CONSTRAINT "ExperienceStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cityId" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "toolName" TEXT,
    "toolPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageCitation" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MessageCitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "contextJson" JSONB,
    "resultEntityIds" TEXT[],
    "algorithmVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiActionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "actionType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModelConfig" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'openrouter',
    "modelId" TEXT NOT NULL,
    "fallbackModelId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiModelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "key" TEXT NOT NULL,
    "description" TEXT,
    "enabledGlobal" BOOLEAN NOT NULL DEFAULT false,
    "rulesJson" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "requestId" TEXT,
    "cityId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "appVersion" TEXT,
    "platform" TEXT,
    "locale" TEXT,
    "properties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "partySize" INTEGER,
    "priceAmount" DECIMAL(12,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodEnd" TIMESTAMP(3),
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Country_iso2_key" ON "Country"("iso2");

-- CreateIndex
CREATE UNIQUE INDEX "Country_iso3_key" ON "Country"("iso3");

-- CreateIndex
CREATE INDEX "City_status_idx" ON "City"("status");

-- CreateIndex
CREATE UNIQUE INDEX "City_countryId_slug_key" ON "City"("countryId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_key_key" ON "Category"("key");

-- CreateIndex
CREATE INDEX "Place_cityId_verificationStatus_idx" ON "Place"("cityId", "verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Place_cityId_slug_key" ON "Place"("cityId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "GuideProfile_userId_key" ON "GuideProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_userId_key" ON "BusinessProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessPlaceClaim_businessId_placeId_key" ON "BusinessPlaceClaim"("businessId", "placeId");

-- CreateIndex
CREATE INDEX "Review_placeId_status_idx" ON "Review"("placeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Review_placeId_userId_key" ON "Review"("placeId", "userId");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_targetType_targetId_key" ON "Favorite"("userId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "TransportSystem_cityId_mode_idx" ON "TransportSystem"("cityId", "mode");

-- CreateIndex
CREATE INDEX "LocalRule_cityId_category_severity_idx" ON "LocalRule"("cityId", "category", "severity");

-- CreateIndex
CREATE INDEX "Event_cityId_startsAt_idx" ON "Event"("cityId", "startsAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventName_createdAt_idx" ON "AnalyticsEvent"("eventName", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_createdAt_idx" ON "AnalyticsEvent"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_primaryCategoryId_fkey" FOREIGN KEY ("primaryCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_ownedByBusinessId_fkey" FOREIGN KEY ("ownedByBusinessId") REFERENCES "BusinessProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacePhoto" ADD CONSTRAINT "PlacePhoto_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceHour" ADD CONSTRAINT "PlaceHour_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideProfile" ADD CONSTRAINT "GuideProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPlaceClaim" ADD CONSTRAINT "BusinessPlaceClaim_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPlaceClaim" ADD CONSTRAINT "BusinessPlaceClaim_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportSystem" ADD CONSTRAINT "TransportSystem_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportSystem" ADD CONSTRAINT "TransportSystem_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportHub" ADD CONSTRAINT "TransportHub_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportHub" ADD CONSTRAINT "TransportHub_transportSystemId_fkey" FOREIGN KEY ("transportSystemId") REFERENCES "TransportSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRoute" ADD CONSTRAINT "TransportRoute_transportSystemId_fkey" FOREIGN KEY ("transportSystemId") REFERENCES "TransportSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRoute" ADD CONSTRAINT "TransportRoute_fromHubId_fkey" FOREIGN KEY ("fromHubId") REFERENCES "TransportHub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRoute" ADD CONSTRAINT "TransportRoute_toHubId_fkey" FOREIGN KEY ("toHubId") REFERENCES "TransportHub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalRule" ADD CONSTRAINT "LocalRule_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalRule" ADD CONSTRAINT "LocalRule_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArrivalGuide" ADD CONSTRAINT "ArrivalGuide_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HowToGuide" ADD CONSTRAINT "HowToGuide_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideStep" ADD CONSTRAINT "GuideStep_arrivalGuideId_fkey" FOREIGN KEY ("arrivalGuideId") REFERENCES "ArrivalGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideStep" ADD CONSTRAINT "GuideStep_howToGuideId_fkey" FOREIGN KEY ("howToGuideId") REFERENCES "HowToGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceStep" ADD CONSTRAINT "ExperienceStep_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageCitation" ADD CONSTRAINT "MessageCitation_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
