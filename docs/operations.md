# Operations: monthly partitions

Four tables are RANGE-partitioned by `created_at`:

- `form_submissions`
- `email_deliveries`
- `email_events`
- `audit_logs`

`ensure_monthly_partitions(n)` creates `n` months of future partitions. The maintenance job
calls it daily with `PARTITION_MONTHS_AHEAD` (default 6, allowed 2–24). Keep the job running:
without it, every insert into those tables eventually fails, including audit-log writes, so
almost every mutating API call begins returning 500.

Each table also has a `DEFAULT` partition (`<table>_default`) as a safety net. It should stay
**empty**. `POST /api/cron/maintenance` and `GET /api/health?ready=1` both report its row count.
A non-empty default is a warning: future range partitions cannot be created until it is emptied.

## Fixing a non-empty DEFAULT partition

Do this inside one transaction so nothing is lost:

```sql
BEGIN;

-- 1. Inspect what landed in the default partition.
SELECT count(*), min(created_at), max(created_at) FROM audit_logs_default;

-- 2. Give those rows a real monthly partition. Example for November 2026:
CREATE TABLE audit_logs_2026_11 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');

-- 3. Attach that partition to the parent (the create above already does this).
--    PostgreSQL moves matching rows out of the default automatically.

-- 4. Confirm the default is empty again.
SELECT count(*) FROM audit_logs_default;

COMMIT;
```

If the default already holds rows spanning several months, create one partition per month
before committing. If a row has a `created_at` far outside your retention window, archive or
delete it deliberately — do not just widen the partition range without understanding it.

Afterwards re-run maintenance and the readiness check:

```sh
curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://formo.example.com/api/cron/maintenance
curl -fsS "https://formo.example.com/api/health?ready=1"
```

The readiness check requires at least 30 days of headroom on every table. If it reports less,
run maintenance (or raise `PARTITION_MONTHS_AHEAD` within 2–24) before assuming an outage.
