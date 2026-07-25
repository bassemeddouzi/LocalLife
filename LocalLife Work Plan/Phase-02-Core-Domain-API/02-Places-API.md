# Phase 02 / Task 02 — Places API

**Priority:** P0  
**Depends on:** Task 01

### Objective
Provide place discovery and detail contracts with verificationStatus enforcement.

### Takes
- Place and related tables (hours, photos, attributes, translations)
- City/category data
- Auth roles for write paths

### Gives
| Operation | Takes | Gives |
| --- | --- | --- |
| Search/list places | cityId, filters (category, q, lat/lng/radius, page) | paginated APPROVED places + basic reasons-ready fields |
| Get place detail | placeId (+ user optional) | full public detail or 404 if not visible |
| Create place | auth role admin/guide + payload | place in PENDING/DRAFT/APPROVED per policy |
| Update place | owner/admin + payload | updated entity |
| Add photo metadata | placeId + media URL/meta | photo row |

### Visibility rule (critical)
Public/Client reads: **APPROVED only** (and not soft-deleted).  
Admin can read pending queue.

### Steps
1. Specify list filters + pagination defaults/max page size.
2. Implement APPROVED-only public read.
3. Include summary fields suitable for AI later.
4. Support distance sort when lat/lng provided (conceptually).
5. Enforce validation on coordinates/categories.
6. Ensure sponsored flags returned but labeled for clients.
7. Document response DTO field list for mobile.

### Tests
| Test | Expected |
| --- | --- |
| Create PENDING place | Not visible on public list |
| Approve place | Becomes visible |
| Pagination | Stable pages, max size capped |
| Unknown place id | 404 |
| Unauthorized create by CLIENT | 403 |

### Done when
- [ ] List/detail/create/update contracts complete for MVP needs
- [ ] Visibility rule proven by tests
