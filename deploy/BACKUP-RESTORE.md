# Backup / restore rehearsal (Phase 06)

## Railway Postgres backup
1. Railway → Postgres service → **Backups** (enable automatic if available).
2. Manual: use `pg_dump` from a machine with `DATABASE_URL`:

```bash
pg_dump "$DATABASE_URL" -Fc -f locallife-staging-$(date +%Y%m%d).dump
```

## Restore drill
1. Create a **temporary** Postgres (or empty DB).
2. Restore:

```bash
pg_restore -d "$TEMP_DATABASE_URL" --clean --if-exists locallife-staging-YYYYMMDD.dump
```

3. Point a throwaway API instance at temp DB (or run counts via `psql`):

```sql
SELECT count(*) FROM "Place" WHERE "verificationStatus" = 'APPROVED';
SELECT count(*) FROM "ArrivalGuide";
SELECT count(*) FROM "TransportSystem";
```

4. Compare to staging seed expectations (~35 approved places in fake pack).

## Record
| Field | Value |
| --- | --- |
| Backup time | |
| Restore time | |
| RPO note | |
| RTO note | |
| Verified by | |

## Prod note (Phase 08)
Repeat with production credentials; keep Admin-only access to secrets.
