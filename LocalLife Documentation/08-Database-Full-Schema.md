# 08 — Database Full Schema

**Document type:** Data architecture  
**Version:** 1.1  
**Language:** English  
**Database:** PostgreSQL  
**ORM target:** Prisma  
**Design goals:** MVP usable now; Tunisia/international/booking/agent-ready without redesign; NFR + recommendation history ready

---

## 1. Database philosophy

1. Relational, normalized core + selective JSON for extensibility
2. Geographic hierarchy first-class
3. Soft deletes where user content matters (`deletedAt`)
4. Verification workflow on public knowledge
5. Multi-currency / multi-locale fields from day one
6. Future modules present as tables/enums even if UI is off
7. AI retrieval-friendly summaries and stable IDs
8. Traceability tables for analytics/recommendations (`RecommendationLog`, events, citations)
9. Volatile local knowledge tracks `lastReviewedAt`
10. Consent fields and feature flags first-class

---

## 2. Conventions

| Convention | Rule |
| --- | --- |
| Primary keys | UUID (`uuid`) |
| Timestamps | `createdAt`, `updatedAt` timestamptz |
| Soft delete | `deletedAt` nullable |
| Enums | Postgres enums or Prisma enums |
| Money | integer minor units **or** `Decimal` + `currency` ISO code — pick one project-wide (recommend `Decimal(12,2)` + `currency`) |
| Geo | `latitude`/`longitude` decimal; later PostGIS `geography` optional |
| Slugs | unique per parent scope where needed |
| Status | explicit enum, never boolean soup |

---

## 3. Entity map (v1)

### Identity & access
User, UserAuthProvider, UserPreference, UserInterest, Role (or enum), RefreshToken, DeviceToken

### Geography
Country, Region, City, District, Neighborhood, GeoBoundary (optional)

### Catalog
Category, Tag, Place, PlaceCategory, PlaceTag, PlacePhoto, PlaceHour, PlaceAttribute, PlaceTranslation

### People & orgs
GuideProfile, BusinessProfile, BusinessPlaceClaim

### Social proof
Review, ReviewPhoto, Favorite, Report

### Local knowledge
TransportMode (enum), TransportSystem, TransportHub, TransportRoute, PaymentMethod (enum), LocalRule, HowToGuide, ArrivalGuide, GuideStep

### Events & experiences
Event, Experience, ExperienceStep

### AI
Conversation, Message, MessageCitation, RecommendationLog, AiActionLog (future agent)

### Commerce (future-ready)
SponsorshipCampaign, Booking, Payment, Subscription, Entitlement

### System
Notification, FeatureFlag, AuditLog, ContentReview, AnalyticsEvent, EntityEmbedding, ContentSuggestion

### Community Q&A (future-ready)
LocalQuestion, LocalAnswer, GuideFollow

Approximate MVP active entities: **25–40**.  
Future-ready extras included below.

---

## 4. Core enums

```text
UserRole: CLIENT | GUIDE | BUSINESS | ADMIN
AdminScope: CITY | COUNTRY | GLOBAL

PersonaType: TOURIST | STUDENT | EXPAT | BUSINESS | LOCAL

VerificationStatus: DRAFT | PENDING | APPROVED | REJECTED | ARCHIVED
ClaimStatus: UNCLAIMED | PENDING | VERIFIED | REJECTED
ReportStatus: OPEN | IN_REVIEW | RESOLVED | DISMISSED
ReportTargetType: PLACE | REVIEW | EVENT | USER | MESSAGE | GUIDE_CONTENT

BudgetBand: LOW | MEDIUM | HIGH
PriceLevel: FREE | BUDGET | MODERATE | EXPENSIVE | LUXURY

TransportMode: BUS | METRO | TRAM | TRAIN | TAXI | RIDE_HAILING | SHARED_TAXI | FERRY | BOAT | BIKE | SCOOTER | WALK | CAR_RENTAL | AIRPORT_SHUTTLE | OTHER

PricingType: FIXED | METERED | ZONE | SUBSCRIPTION | NEGOTIABLE | FREE | UNKNOWN

PaymentMethod: CASH | CARD | CONTACTLESS | BANK_TRANSFER | MOBILE_MONEY | APP_PAY | TRANSPORT_CARD | QR_PAY | OTHER

RuleScope: COUNTRY | REGION | CITY | DISTRICT | PLACE
RuleSeverity: INFO | IMPORTANT | CRITICAL
RuleCategory: ENTRY_VISA | SAFETY | TRANSPORT | MONEY | DRESS_CULTURE | RELIGION_CUSTOMS | ALCOHOL | PHOTOGRAPHY | HEALTH | INTERNET_COMMS | HOUSING | WORK_STUDY | EMERGENCY | SCAM_WARNING | OTHER

SourceType: OFFICIAL | ADMIN | GUIDE_VERIFIED | BUSINESS | COMMUNITY | IMPORTED

GuideActionType: CLEAR_IMMIGRATION | BUY_SIM | EXCHANGE_MONEY | WITHDRAW_ATM | TAKE_TAXI | TAKE_SHARED_TAXI | TAKE_BUS | TAKE_FERRY | BOOK_TRANSFER | GO_TO_PLACE | BUY_TICKET | INSTALL_APP | REGISTER_ACCOUNT | CHECK_SAFETY | OTHER

BookingStatus: DRAFT | PENDING | CONFIRMED | CANCELLED | COMPLETED | REFUNDED
PaymentStatus: PENDING | AUTHORIZED | CAPTURED | FAILED | REFUNDED
SubscriptionStatus: ACTIVE | PAST_DUE | CANCELLED | EXPIRED

MessageRole: USER | ASSISTANT | SYSTEM | TOOL
```

---

## 5. Identity & users

### 5.1 User

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| email | citext unique | |
| passwordHash | text nullable | null if OAuth-only later |
| role | UserRole | default CLIENT |
| displayName | text | |
| avatarUrl | text nullable | |
| phone | text nullable | |
| locale | text | e.g. en, fr, ar |
| preferredCurrency | char(3) | e.g. TND, EUR, USD |
| personaType | PersonaType nullable | |
| isEmailVerified | boolean | |
| status | ACTIVE/SUSPENDED/DELETED | |
| lastLoginAt | timestamptz nullable | |
| createdAt, updatedAt, deletedAt | | |

### 5.2 UserPreference

| Column | Type | Notes |
| --- | --- | --- |
| userId | uuid PK/FK | 1:1 |
| budgetBand | BudgetBand | |
| homeCityId | uuid nullable | |
| dietaryNotes | text nullable | |
| accessibilityNotes | text nullable | |
| interests | via UserInterest | |
| notifyRecommendations | boolean | |
| notifyEvents | boolean | |
| notifyMarketing | boolean | |
| quietHoursJson | jsonb nullable | |
| consentAnalytics | boolean | default false until accepted |
| consentPersonalization | boolean | |
| consentPush | boolean | |
| consentMarketing | boolean | |
| consentUpdatedAt | timestamptz nullable | |

### 5.3 UserInterest

| Column | Type |
| --- | --- |
| userId | uuid FK |
| tagId | uuid FK |
| PK | (userId, tagId) |

### 5.4 RefreshToken

| Column | Type |
| --- | --- |
| id | uuid |
| userId | uuid |
| tokenHash | text |
| expiresAt | timestamptz |
| revokedAt | timestamptz nullable |
| userAgent | text nullable |
| ip | text nullable |

### 5.5 DeviceToken (notifications future)

| Column | Type |
| --- | --- |
| id | uuid |
| userId | uuid |
| platform | IOS/ANDROID/WEB |
| token | text |
| lastSeenAt | timestamptz |

---

## 6. Geography

### 6.1 Country

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| iso2 | char(2) unique | TN, FI, CN |
| iso3 | char(3) unique | |
| name | text | |
| defaultLocale | text | |
| defaultCurrency | char(3) | |
| timezoneDefault | text nullable | |
| emergencyNumbersJson | jsonb | police/ambulance/etc |
| status | DRAFT/ACTIVE/DISABLED | |
| packVersion | text | country pack version |

### 6.2 Region

id, countryId, name, code nullable, status

### 6.3 City

id, regionId nullable, countryId, name, slug, latitude, longitude, status, isFeatured, contentPackVersion, defaultLocale

### 6.4 District / Neighborhood

**District** (MVP — implemented):

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| cityId | uuid | FK City |
| name | text | e.g. Midoun |
| slug | text | unique per city |
| latitude, longitude | decimal | centroid for maps |
| createdAt, updatedAt | timestamptz | |

**Neighborhood** / **GeoBoundary**: later (optional polygons).

### 6.5 Hierarchy example

```text
Tunisia
 └── Medenine (region)
      └── Djerba (city)
           └── Midoun (district)
                └── Place: Café XYZ
```

**Indexes:** city(status), place(cityId), district(cityId), geo lookups on lat/lng.

---

## 7. Categories & tags

### Category

id, parentId nullable, key, name, icon, sortOrder, appliesTo (PLACE/EVENT/BOTH)

### Tag

id, key, name, tagType (INTEREST/AUDIENCE/AMENITY/CUISINE/...) 

---

## 8. Places module

### 8.1 Place

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| cityId | uuid | required |
| districtId | uuid nullable | |
| neighborhoodId | uuid nullable | |
| slug | text | unique per city |
| name | text | |
| summary | text | AI-ready short |
| description | text | |
| latitude, longitude | decimal | |
| addressText | text nullable | |
| phone, website | nullable | |
| priceLevel | PriceLevel nullable | |
| primaryCategoryId | uuid | |
| verificationStatus | enum | |
| sourceType | enum | |
| isSponsored | boolean | default false |
| sponsoredUntil | timestamptz nullable | |
| trustScore | decimal nullable | computed |
| popularityScore | decimal nullable | |
| createdByUserId | uuid nullable | |
| ownedByBusinessId | uuid nullable | |
| publishedAt | timestamptz nullable | |
| metadata | jsonb | flexible attrs |
| createdAt, updatedAt, deletedAt | | |

### 8.2 PlaceHour

placeId, dayOfWeek (0–6), opensAt time, closesAt time, isClosed boolean

### 8.3 PlacePhoto

id, placeId, url, caption, sortOrder, uploadedByUserId, status

### 8.4 PlaceAttribute

key/value for structured tips: `bestTimeOfDay=sunset`, `noiseLevel=quiet`, `studentFriendly=true`

Prefer key enum-ish strings + value jsonb/text.

### 8.5 PlaceTranslation

placeId, locale, name, summary, description — unique(placeId, locale)

---

## 9. Guide & business profiles

### GuideProfile

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| userId | uuid unique | |
| bio | text nullable | |
| languages | text[] | |
| status | GuideApplicationStatus | APPLIED… |
| portfolioUrl | text nullable | |
| trustScore | decimal nullable | |
| baseCityId | uuid nullable | FK City — where the Guide operates |
| primaryDistrictId | uuid nullable | FK District — zone inside city (Admin map pin = district centroid) |
| createdAt, updatedAt | | |

**Later:** `citiesExpertise` M2M (multi-city Guides). Admin map shows one pin per Guide from `primaryDistrict` centroid until device GPS exists.

### BusinessProfile

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| userId | uuid unique | |
| legalName | text nullable | |
| displayName | text | |
| contactEmail, contactPhone | text nullable | |
| verificationStatus | VerificationStatus | |
| billingInfo | jsonb nullable | |
| baseCityId | uuid nullable | FK City — where the Business operates |
| primaryDistrictId | uuid nullable | FK District — Admin map pin = district centroid |
| createdAt, updatedAt | | |

### BusinessPlaceClaim

id, businessId, placeId, status, evidenceUrl, reviewedByAdminId, reviewedAt

---

## 10. Reviews & favorites

### Review

id, placeId, userId, rating int 1–5, title nullable, body, status, createdAt…  
unique(placeId, userId) where deletedAt is null

### Favorite

id, userId, targetType (PLACE/EVENT/EXPERIENCE), targetId, createdAt  
unique(userId, targetType, targetId)

### Report

id, reporterUserId, targetType, targetId, reason, details, status, resolvedBy, resolutionNotes

---

## 11. Transport & payments

### TransportSystem

| Column | Type |
| --- | --- |
| id | uuid |
| countryId | uuid |
| cityId | uuid nullable |
| name | text |
| mode | TransportMode |
| summary | text |
| howItWorks | text |
| accessInstructions | text nullable |
| pricingType | PricingType |
| priceMin, priceMax | decimal nullable |
| currency | char(3) |
| paymentMethods | PaymentMethod[] or join table |
| operatingHoursText | text nullable |
| coverageNotes | text nullable |
| warnings | text[] or jsonb |
| appsJson | jsonb nullable |
| verificationStatus | enum |
| sourceType | enum |
| lastReviewedAt | timestamptz nullable |

### TransportHub

id, placeId (geo place), transportSystemId, hubType (STATION/STOP/RANK/PORT), name, notes

### TransportRoute

id, transportSystemId, fromHubId, toHubId, approxDurationMin, priceMin, priceMax, currency, frequencyNotes, verificationStatus

### Recommended join

`TransportSystemPaymentMethod(systemId, method)`

---

## 12. Local rules & guides

### LocalRule

| Column | Type |
| --- | --- |
| id | uuid |
| scope | RuleScope |
| countryId/regionId/cityId/districtId/placeId | nullable FKs matching scope |
| category | RuleCategory |
| severity | RuleSeverity |
| audience | PersonaType or ALL |
| title | text |
| summary | text |
| details | text |
| sourceType | enum |
| sourceUrl | text nullable |
| verificationStatus | enum |
| lastReviewedAt | timestamptz |
| locale default + translations table optional |

### ArrivalGuide

id, cityId, airportPlaceId nullable, title, summary, estimatedTotalTimeMin, audience, verificationStatus

### HowToGuide

id, cityId nullable, countryId nullable, title, summary, category key, verificationStatus

### GuideStep

| Column | Type |
| --- | --- |
| id | uuid |
| parentType | ARRIVAL_GUIDE / HOW_TO_GUIDE |
| parentId | uuid |
| stepOrder | int |
| title | text |
| actionType | GuideActionType |
| description | text |
| estimatedTimeMin | int nullable |
| estimatedCostMin/Max | decimal nullable |
| currency | char(3) nullable |
| paymentMethods | array/join |
| relatedTransportSystemId | nullable |
| relatedPlaceId | nullable |
| warnings | jsonb/text |
| isOptional | boolean |

---

## 13. Events & experiences

### Event

id, cityId, placeId nullable, title, summary, description, startsAt, endsAt, categoryId, priceLevel, verificationStatus, isSponsored, metadata

### Experience

id, cityId, title, summary, description, durationMin, priceLevel, audience, verificationStatus

### ExperienceStep

id, experienceId, stepOrder, title, description, placeId nullable, estimatedTimeMin

---

## 14. AI module

### Conversation

id, userId, cityId nullable, title nullable, createdAt, updatedAt, deletedAt

### Message

id, conversationId, role, content, toolName nullable, toolPayload jsonb nullable, createdAt

### MessageCitation

id, messageId, entityType (PLACE/EVENT/TRANSPORT_SYSTEM/LOCAL_RULE/ARRIVAL_GUIDE/...), entityId, rank

### RecommendationLog

id, userId, contextJson, resultEntityIds[], algorithmVersion, createdAt

### AiActionLog (agent future)

id, userId, actionType, status (PROPOSED/APPROVED/EXECUTED/CANCELLED/FAILED), payload jsonb, createdAt

---

## 15. Commerce (future-ready)

### SponsorshipCampaign

id, businessId, targetType, targetId, startsAt, endsAt, budget, status, disclosureLabel

### Booking

id, userId, businessId nullable, targetType, targetId, status, scheduledAt, partySize, priceAmount, currency, notes

### Payment

id, bookingId nullable, userId, provider, providerRef, amount, currency, status

### Subscription

id, userId, planCode, status, currentPeriodEnd, providerRef

---

## 16. System tables

### Notification

id, userId, type, title, body, data jsonb, readAt nullable, createdAt

### FeatureFlag

key, description, enabledGlobal, rulesJson (per country/city/user %)

### AuditLog

id, actorUserId, action, entityType, entityId, beforeJson, afterJson, requestId nullable, createdAt

### AnalyticsEvent

id, eventName, userId nullable, sessionId, requestId nullable, cityId nullable, entityType nullable, entityId nullable, appVersion, platform, locale, properties jsonb, createdAt

Indexes: (eventName, createdAt), (userId, createdAt), (cityId, eventName)

### EntityEmbedding (semantic search ready)

id, entityType, entityId, modelVersion, embedding vector (pgvector) or external ref, updatedAt  
unique(entityType, entityId, modelVersion)

### ContentSuggestion (user corrections)

id, userId, targetType, targetId, fieldName nullable, proposedValue jsonb/text, status PENDING/APPROVED/REJECTED, reviewedByAdminId nullable, createdAt

### LocalQuestion / LocalAnswer (Ask a Local — future)

LocalQuestion: id, userId, cityId, body, status, assignedGuideId nullable  
LocalAnswer: id, questionId, guideId, body, status, createdAt

### GuideFollow (future)

guideProfileId, userId, createdAt — unique pair

### AbuseSignal (optional MVP+)

userId, score, reasons jsonb, updatedAt

---

## 17. Relationship diagram (simplified)

```text
User ──< Conversation ──< Message ──< MessageCitation
User ──< Review >── Place
User ──< Favorite
User ──< AnalyticsEvent
User ── UserPreference (consents)
Place >── City >── Country
Place ──< PlacePhoto / PlaceHour / PlaceAttribute
TransportSystem >── City/Country
TransportHub >── Place
ArrivalGuide >── City
ArrivalGuide ──< GuideStep
LocalRule >── scoped geo
Event >── City / Place
Experience ──< ExperienceStep >── Place
BusinessProfile ──< BusinessPlaceClaim >── Place
GuideProfile >── User
Booking >── User (future)
EntityEmbedding >── polymorphic entity
ContentSuggestion >── polymorphic entity
```

---

## 18. Indexing strategy (minimum)

- User(email)
- Place(cityId, verificationStatus)
- Place(latitude, longitude) or later geo index
- Event(cityId, startsAt)
- Message(conversationId, createdAt)
- LocalRule(cityId, category, severity)
- TransportSystem(cityId, mode)
- Review(placeId, status)
- Favorite(userId)
- AnalyticsEvent(eventName, createdAt)
- AnalyticsEvent(userId, createdAt)

---

## 19. What is active in MVP vs dormant

| Module | MVP writes/reads | Notes |
| --- | --- | --- |
| Users/prefs + consents | Active | |
| Geography | Active (TN + Djerba) | |
| Places/reviews/favorites | Active | |
| Events/experiences | Active | |
| Transport/rules/arrival | Active (seeded) | Differentiator + lastReviewedAt |
| AI conversations + citations | Active | |
| Reports + AuditLog | Active | |
| AnalyticsEvent | Active | recommendation fuel |
| FeatureFlag | Active | |
| Guide/Business profiles | Partial | schema yes, portals later |
| EntityEmbedding | Optional empty | retrieve path ready |
| ContentSuggestion | MVP+ | corrections |
| Booking/Payment/Subscription | Dormant UI | tables exist |
| AiActionLog / Ask a Local | Dormant | future |
| DeviceToken/Notifications | Optional | |

---

## 20. Migration policy

1. Additive migrations preferred
2. Never remove future-ready tables casually
3. Enum extensions via Prisma migrations carefully
4. Content translations additive
5. Seed scripts separated from schema migrations

---

## 21. AI data contract

For every retrievable entity, ensure:

- stable `id`
- `summary` short text
- `verificationStatus`
- geographic scope ids
- updated/reviewed timestamps
- recommendation `reasons[]` produced at ranking time (API layer; may be ephemeral)

Embeddings (`EntityEmbedding`) store vector + entityType + entityId without changing core relational model.

---

## 22. Seed expectation

Schema without seed is empty product.  
See `17-Content-Seed-Djerba.md` for required launch content.

---

## 23. Related NFR / recommendation docs

- [20 — Non-Functional Requirements](./20-Non-Functional-Requirements.md)
- [21 — Engineering Recommendations](./21-Engineering-Recommendations.md)
- [22 — Extended Feature Backlog](./22-Extended-Feature-Backlog.md)

---

*Next: [09 — API Architecture](./09-API-Architecture.md)*
