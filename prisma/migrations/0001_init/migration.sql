-- FormO PostgreSQL 18 Industrial-Grade Initial Migration
-- Features:
--   * Extensions: citext, pg_trgm
--   * Time-ordered UUIDv7 primary keys (PG 18 native uuidv7())
--   * Declarative monthly RANGE partitioning on form_submissions, email_deliveries, email_events, audit_logs
--   * Automatic updated_at triggers, active-only partial unique slug index, permanent endpoint uniqueness
--   * GIN (jsonb_path_ops), BRIN (created_at), partial worker queue index, HOT fillfactor tuning

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Enums
CREATE TYPE "org_role" AS ENUM ('member', 'admin', 'owner');
CREATE TYPE "user_interest" AS ENUM ('developer', 'non_developer');
CREATE TYPE "project_status" AS ENUM ('active', 'archived');
CREATE TYPE "recipient_type" AS ENUM ('to', 'cc', 'bcc');
CREATE TYPE "submission_status" AS ENUM ('pending', 'sent', 'failed', 'spam');
CREATE TYPE "delivery_status" AS ENUM ('pending', 'processing', 'sent', 'retrying', 'failed', 'dead_letter');
CREATE TYPE "email_event_type" AS ENUM ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained');

-- 3. Trigger Helper for Mutable Tables
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END;
$$;

-- 4. Partition Provisioning Function (Monthly UTC Partitions)
CREATE OR REPLACE FUNCTION ensure_monthly_partitions(months_ahead integer DEFAULT 6)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  base_month timestamptz := (date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC');
  i integer;
  range_start timestamptz;
  range_end timestamptz;
  suffix text;
  created_count integer := 0;
  parent_tables text[] := ARRAY['form_submissions', 'email_deliveries', 'email_events', 'audit_logs'];
  tbl text;
  part_name text;
BEGIN
  IF months_ahead < 0 THEN
    RAISE EXCEPTION 'months_ahead must be non-negative';
  END IF;

  FOR i IN -1..months_ahead LOOP
    range_start := base_month + make_interval(months => i);
    range_end := base_month + make_interval(months => i + 1);
    suffix := to_char(range_start AT TIME ZONE 'UTC', 'YYYY_MM');

    FOREACH tbl IN ARRAY parent_tables LOOP
      part_name := format('%s_%s', tbl, suffix);
      IF to_regclass(format('public.%I', part_name)) IS NULL THEN
        IF tbl = 'email_deliveries' THEN
          EXECUTE format(
            'CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L) WITH (fillfactor = 80)',
            part_name,
            tbl,
            range_start,
            range_end
          );
        ELSE
          EXECUTE format(
            'CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
            part_name,
            tbl,
            range_start,
            range_end
          );
        END IF;
        created_count := created_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN created_count;
END;
$$;

-- 5. Identity, Workspaces & Onboarding Tables (Better Auth + Organizations)
CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "email_verified" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT,
  "interest" "user_interest" NOT NULL DEFAULT 'developer',
  "role" TEXT NOT NULL DEFAULT 'user',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_email_format_chk" CHECK ("email" ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");
CREATE UNIQUE INDEX "users_email_lower_uq" ON "users" (LOWER("email"));

CREATE TRIGGER "trg_users_updated_at"
  BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE "sessions" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "token" TEXT NOT NULL,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "user_id" UUID NOT NULL,
  "active_organization_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "sessions_token_key" ON "sessions" ("token");
CREATE INDEX "sessions_user_expires_idx" ON "sessions" ("user_id", "expires_at");

CREATE TRIGGER "trg_sessions_updated_at"
  BEFORE UPDATE ON "sessions"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE "accounts" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "account_id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "user_id" UUID NOT NULL,
  "access_token" TEXT,
  "refresh_token" TEXT,
  "id_token" TEXT,
  "access_token_expires_at" TIMESTAMPTZ(6),
  "refresh_token_expires_at" TIMESTAMPTZ(6),
  "scope" TEXT,
  "password" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "accounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "accounts_provider_account_uq" ON "accounts" ("provider_id", "account_id");
CREATE INDEX "accounts_user_idx" ON "accounts" ("user_id");

CREATE TRIGGER "trg_accounts_updated_at"
  BEFORE UPDATE ON "accounts"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE "verifications" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "verifications_identifier_idx" ON "verifications" ("identifier");

CREATE TRIGGER "trg_verifications_updated_at"
  BEFORE UPDATE ON "verifications"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE "organizations" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "logo" TEXT,
  "metadata" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations" ("slug");

CREATE TRIGGER "trg_organizations_updated_at"
  BEFORE UPDATE ON "organizations"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE "members" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "organization_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'member',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "members_org_user_uq" ON "members" ("organization_id", "user_id");
CREATE INDEX "members_user_idx" ON "members" ("user_id");

CREATE TABLE "invitations" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "organization_id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "inviter_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "invitations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "invitations_org_email_idx" ON "invitations" ("organization_id", "email");

-- 6. Domain Tables: Projects, Encrypted SMTP, Email Templates, Forms & Recipients
CREATE TABLE "projects" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "organization_id" UUID NOT NULL,
  "created_by_id" UUID,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "status" "project_status" NOT NULL DEFAULT 'active',
  "deleted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "projects_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "projects_org_slug_idx" ON "projects" ("organization_id", "slug");
CREATE INDEX "projects_org_active_idx" ON "projects" ("organization_id", "deleted_at");
CREATE UNIQUE INDEX "projects_org_slug_active_uq" ON "projects" ("organization_id", "slug") WHERE "deleted_at" IS NULL;

CREATE TRIGGER "trg_projects_updated_at"
  BEFORE UPDATE ON "projects"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE "smtp_configs" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "organization_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "host" TEXT NOT NULL,
  "port" INTEGER NOT NULL DEFAULT 587,
  "secure" BOOLEAN NOT NULL DEFAULT false,
  "username" TEXT NOT NULL,
  "encrypted_password" BYTEA NOT NULL,
  "iv" BYTEA NOT NULL,
  "auth_tag" BYTEA NOT NULL,
  "key_version" INTEGER NOT NULL DEFAULT 1,
  "from_email" TEXT NOT NULL,
  "is_verified" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "smtp_configs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "smtp_configs_port_chk" CHECK ("port" BETWEEN 1 AND 65535),
  CONSTRAINT "smtp_configs_from_email_chk" CHECK ("from_email" ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT "smtp_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "smtp_configs_org_idx" ON "smtp_configs" ("organization_id");

CREATE TRIGGER "trg_smtp_configs_updated_at"
  BEFORE UPDATE ON "smtp_configs"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE "email_templates" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "organization_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "subject_template" TEXT NOT NULL,
  "html_template" TEXT NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "email_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "email_templates_org_idx" ON "email_templates" ("organization_id");

CREATE TRIGGER "trg_email_templates_updated_at"
  BEFORE UPDATE ON "email_templates"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE "project_forms" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "project_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "endpoint" TEXT NOT NULL,
  "email_to" TEXT NOT NULL,
  "reply_to_field" TEXT,
  "custom_subject" TEXT,
  "allowed_origins" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "honeypot_field" TEXT DEFAULT '_gotcha',
  "require_turnstile" BOOLEAN NOT NULL DEFAULT false,
  "max_payload_bytes" INTEGER NOT NULL DEFAULT 65536,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "smtp_config_id" UUID,
  "email_template_id" UUID,
  "deleted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "project_forms_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "project_forms_endpoint_chk" CHECK ("endpoint" ~ '^[A-Za-z0-9_-]{6,64}$'),
  CONSTRAINT "project_forms_payload_cap_chk" CHECK ("max_payload_bytes" BETWEEN 1024 AND 524288),
  CONSTRAINT "project_forms_email_to_chk" CHECK ("email_to" ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT "project_forms_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "project_forms_smtp_config_id_fkey" FOREIGN KEY ("smtp_config_id") REFERENCES "smtp_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "project_forms_email_template_id_fkey" FOREIGN KEY ("email_template_id") REFERENCES "email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Permanent unique index even on soft-deleted rows to prevent retired embed hijacking
CREATE UNIQUE INDEX "project_forms_endpoint_key" ON "project_forms" ("endpoint");
CREATE INDEX "project_forms_project_active_idx" ON "project_forms" ("project_id", "deleted_at");

CREATE TRIGGER "trg_project_forms_updated_at"
  BEFORE UPDATE ON "project_forms"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE "form_recipients" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "form_id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "type" "recipient_type" NOT NULL DEFAULT 'to',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "form_recipients_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "form_recipients_email_chk" CHECK ("email" ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT "form_recipients_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "project_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "form_recipients_form_email_type_uq" ON "form_recipients" ("form_id", "email", "type");
CREATE INDEX "form_recipients_form_active_idx" ON "form_recipients" ("form_id", "is_active");

-- 7. Partitioned Append-Only Tables (Submissions, Deliveries, Events, Audit Logs)
CREATE TABLE "form_submissions" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "form_id" UUID NOT NULL,
  "status" "submission_status" NOT NULL DEFAULT 'pending',
  "data" JSONB NOT NULL,
  "origin" TEXT,
  "ip_hash" BYTEA,
  "user_agent" TEXT,
  "sent_at" TIMESTAMPTZ(6),
  "error_message" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id", "created_at"),
  CONSTRAINT "form_submissions_payload_max_chk" CHECK (pg_column_size("data") <= 524288),
  CONSTRAINT "form_submissions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "project_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE
) PARTITION BY RANGE ("created_at");

CREATE INDEX "form_submissions_form_created_idx" ON "form_submissions" ("form_id", "created_at" DESC);
CREATE INDEX "form_submissions_form_status_idx" ON "form_submissions" ("form_id", "status", "created_at" DESC);
CREATE INDEX "form_submissions_data_gin_idx" ON "form_submissions" USING GIN ("data" jsonb_path_ops);
CREATE INDEX "form_submissions_created_brin_idx" ON "form_submissions" USING BRIN ("created_at");

CREATE TABLE "email_deliveries" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "submission_id" UUID NOT NULL,
  "submission_created_at" TIMESTAMPTZ(6) NOT NULL,
  "recipient_email" TEXT NOT NULL,
  "status" "delivery_status" NOT NULL DEFAULT 'pending',
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "next_retry_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "provider_message_id" TEXT,
  "smtp_response" TEXT,
  "error_message" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "email_deliveries_pkey" PRIMARY KEY ("id", "created_at"),
  CONSTRAINT "email_deliveries_submission_fkey" FOREIGN KEY ("submission_id", "submission_created_at") REFERENCES "form_submissions"("id", "created_at") ON DELETE CASCADE ON UPDATE CASCADE
) PARTITION BY RANGE ("created_at");

CREATE INDEX "email_deliveries_submission_idx" ON "email_deliveries" ("submission_id", "submission_created_at");
CREATE INDEX "email_deliveries_queue_idx" ON "email_deliveries" ("next_retry_at") WHERE "status" IN ('pending', 'retrying');
CREATE INDEX "email_deliveries_created_brin_idx" ON "email_deliveries" USING BRIN ("created_at");

CREATE TRIGGER "trg_email_deliveries_updated_at"
  BEFORE UPDATE ON "email_deliveries"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE "email_events" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "delivery_id" UUID NOT NULL,
  "delivery_created_at" TIMESTAMPTZ(6) NOT NULL,
  "event_type" "email_event_type" NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "email_events_pkey" PRIMARY KEY ("id", "created_at"),
  CONSTRAINT "email_events_delivery_fkey" FOREIGN KEY ("delivery_id", "delivery_created_at") REFERENCES "email_deliveries"("id", "created_at") ON DELETE CASCADE ON UPDATE CASCADE
) PARTITION BY RANGE ("created_at");

CREATE INDEX "email_events_delivery_idx" ON "email_events" ("delivery_id", "delivery_created_at");
CREATE INDEX "email_events_created_brin_idx" ON "email_events" USING BRIN ("created_at");

CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "organization_id" UUID NOT NULL,
  "actor_user_id" UUID,
  "action" TEXT NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" TEXT,
  "ip_hash" BYTEA,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id", "created_at"),
  CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
) PARTITION BY RANGE ("created_at");

CREATE INDEX "audit_logs_org_created_idx" ON "audit_logs" ("organization_id", "created_at" DESC);
CREATE INDEX "audit_logs_created_brin_idx" ON "audit_logs" USING BRIN ("created_at");

-- 8. API Keys, Operational Telemetry, Rate Limiting & Cross-Month Idempotency
CREATE TABLE "api_keys" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "organization_id" UUID NOT NULL,
  "created_by_id" UUID,
  "name" TEXT NOT NULL,
  "key_prefix" VARCHAR(16) NOT NULL,
  "key_hash" BYTEA NOT NULL,
  "scopes" TEXT[] NOT NULL DEFAULT ARRAY['forms:write', 'emails:send']::TEXT[],
  "last_used_at" TIMESTAMPTZ(6),
  "expires_at" TIMESTAMPTZ(6),
  "revoked_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "api_keys_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "api_keys_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys" ("key_hash");
CREATE INDEX "api_keys_org_idx" ON "api_keys" ("organization_id");
CREATE INDEX "api_keys_prefix_idx" ON "api_keys" ("key_prefix");

CREATE TRIGGER "trg_api_keys_updated_at"
  BEFORE UPDATE ON "api_keys"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE "form_daily_stats" (
  "form_id" UUID NOT NULL,
  "stat_date" DATE NOT NULL,
  "accepted_count" INTEGER NOT NULL DEFAULT 0,
  "sent_count" INTEGER NOT NULL DEFAULT 0,
  "failed_count" INTEGER NOT NULL DEFAULT 0,
  "spam_count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "form_daily_stats_pkey" PRIMARY KEY ("form_id", "stat_date"),
  CONSTRAINT "form_daily_stats_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "project_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE
) WITH (fillfactor = 80);

CREATE INDEX "form_daily_stats_date_idx" ON "form_daily_stats" ("stat_date");

CREATE TABLE "rate_limit_buckets" (
  "bucket_key" VARCHAR(160) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "window_start" TIMESTAMPTZ(6) NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("bucket_key")
);

CREATE INDEX "rate_limit_buckets_expires_idx" ON "rate_limit_buckets" ("expires_at");

CREATE TABLE "submission_idempotency_keys" (
  "form_id" UUID NOT NULL,
  "idempotency_key" VARCHAR(128) NOT NULL,
  "submission_id" UUID NOT NULL,
  "submission_created_at" TIMESTAMPTZ(6) NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "submission_idempotency_keys_pkey" PRIMARY KEY ("form_id", "idempotency_key"),
  CONSTRAINT "submission_idempotency_keys_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "project_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "submission_idempotency_keys_expires_idx" ON "submission_idempotency_keys" ("expires_at");

-- 9. Provision Initial Monthly Partitions (-1 month to +12 months)
SELECT ensure_monthly_partitions(12);
