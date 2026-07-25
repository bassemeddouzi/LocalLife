# 09 — API Architecture

**Document type:** Backend API design  
**Version:** 1.0  
**Language:** English  
**Style:** REST JSON over HTTPS  
**Framework:** NestJS

---

## 1. Goals

- Clear resource-oriented endpoints for mobile clients
- Strict authz by role and ownership
- AI endpoints as first-class but rate-limited
- Versionable API (`/v1`)
- City/country scoped reads for expansion

---

## 2. Base conventions

| Topic | Convention |
| --- | --- |
| Base path | `/v1` |
| Format | JSON |
| Auth | `Authorization: Bearer <accessToken>` |
| IDs | UUID strings |
| Errors | RFC7807-ish `{ statusCode, error, message, details? }` |
| Pagination | `page`, `pageSize`, return `{ items, total, page, pageSize }` |
| Filtering | query params |
| Idempotency | for payments/bookings later |

---

## 3. Module endpoint map

### Auth
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `POST /v1/auth/forgot-password` (recommended)
- `POST /v1/auth/reset-password`

### Users & preferences
- `GET /v1/me`
- `PATCH /v1/me`
- `GET/PUT /v1/me/preferences`
- `PUT /v1/me/interests`

### Geography
- `GET /v1/countries`
- `GET /v1/countries/:id/cities`
- `GET /v1/cities/:id`
- `GET /v1/cities/:id/categories`

### Places
- `GET /v1/places?cityId=&categoryId=&lat=&lng=&radiusMeters=&q=`
- `GET /v1/places/:id`
- `GET /v1/places/:id/reviews`
- `POST /v1/places` (guide/admin)
- `PATCH /v1/places/:id` (owner/admin)
- `POST /v1/places/:id/photos`

### Events & experiences
- `GET /v1/events`
- `GET /v1/events/:id`
- `GET /v1/experiences`
- `GET /v1/experiences/:id`

### Reviews & favorites
- `POST /v1/places/:id/reviews`
- `PATCH /v1/reviews/:id`
- `DELETE /v1/reviews/:id`
- `GET /v1/me/favorites`
- `POST /v1/favorites`
- `DELETE /v1/favorites/:id`

### Local knowledge
- `GET /v1/transport-systems?cityId=`
- `GET /v1/transport-systems/:id`
- `GET /v1/local-rules?cityId=&category=`
- `GET /v1/arrival-guides?cityId=` / `?airportPlaceId=`
- `GET /v1/arrival-guides/:id`
- `GET /v1/how-to-guides/:id`

### AI
- `POST /v1/ai/conversations`
- `GET /v1/ai/conversations`
- `GET /v1/ai/conversations/:id`
- `POST /v1/ai/conversations/:id/messages`
- `POST /v1/ai/feedback` (answer quality)

### Reports
- `POST /v1/reports`

### Admin
- `GET /v1/admin/moderation/queue`
- `POST /v1/admin/content/:type/:id/approve`
- `POST /v1/admin/content/:type/:id/reject`
- `GET /v1/admin/analytics/overview`

### Future
- booking, payments, subscriptions, sponsorships under `/v1/...` behind feature flags

---

## 4. AI message request example

```json
{
  "content": "How do I get from the airport to Midoun?",
  "clientContext": {
    "latitude": 33.875,
    "longitude": 10.775,
    "cityId": "...",
    "locale": "en"
  }
}
```

Response includes assistant text + citations array of entity references + optional UI cards.

---

## 5. Cross-cutting middleware

1. Request ID / logging
2. Auth guard
3. Role guard
4. Validation pipes (DTO)
5. Rate limiting (especially AI)
6. City access checks for inactive cities

---

## 6. Error model examples

| Status | When |
| --- | --- |
| 400 | validation failed |
| 401 | missing/invalid token |
| 403 | role/ownership denied |
| 404 | entity missing or not visible |
| 409 | unique conflict (review exists) |
| 429 | rate limited |
| 500 | unexpected |

---

## 7. API versioning & compatibility

- Additive fields preferred
- Breaking changes → `/v2`
- Mobile should ignore unknown fields

---

## 8. Observability

Log:

- route, status, latency
- userId (if any)
- cityId context
- AI tool calls count / grounding success

Never log raw passwords or full payment secrets.

---

*Next: [10 — AI Architecture](./10-AI-Architecture-RAG-Agent.md)*
