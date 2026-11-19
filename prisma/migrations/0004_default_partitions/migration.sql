-- Catch-all DEFAULT partitions for the four monthly RANGE-partitioned tables.
-- DECISION: the brief names this 0002, but the owner's uncommitted tree already
-- has 0002_api_key_prefix and 0003_email_template_design. 0004 avoids a
-- collision without deleting or renaming any of their work.
--
-- A DEFAULT partition must stay empty: PostgreSQL refuses to attach a new
-- range partition when rows in the default would belong to that range. Daily
-- maintenance (6+ months ahead) keeps it empty. See docs/operations.md.

CREATE TABLE IF NOT EXISTS form_submissions_default PARTITION OF form_submissions DEFAULT;
CREATE TABLE IF NOT EXISTS email_deliveries_default PARTITION OF email_deliveries DEFAULT;
CREATE TABLE IF NOT EXISTS email_events_default PARTITION OF email_events DEFAULT;
CREATE TABLE IF NOT EXISTS audit_logs_default PARTITION OF audit_logs DEFAULT;
