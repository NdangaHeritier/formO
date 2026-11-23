-- Non-developer audience, lists and user-initiated broadcasts.
--
-- Deliveries stay in the single email_deliveries queue: every row has exactly
-- one parent, either a form submission (developer forms) or an outbound
-- message (non-developer broadcasts). There is no second SMTP path or worker.

CREATE TYPE "message_status" AS ENUM ('draft', 'queued', 'sending', 'sent', 'failed', 'canceled');

-- 1. Reusable recipients -----------------------------------------------------
CREATE TABLE "contacts" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "organization_id" UUID NOT NULL,
  "email" CITEXT NOT NULL,
  "name" TEXT,
  "metadata" JSONB,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "contacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- citext makes uniqueness case-insensitive, which is what email addresses need.
CREATE UNIQUE INDEX "contacts_org_email_key" ON "contacts" ("organization_id", "email");
CREATE INDEX "contacts_org_active_created_idx" ON "contacts" ("organization_id", "is_active", "created_at" DESC);

CREATE TRIGGER "trg_contacts_updated_at"
  BEFORE UPDATE ON "contacts"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. Named audiences ---------------------------------------------------------
CREATE TABLE "contact_lists" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "organization_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "contact_lists_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "contact_lists_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "contact_lists_org_name_key" ON "contact_lists" ("organization_id", "name");
CREATE INDEX "contact_lists_org_idx" ON "contact_lists" ("organization_id");

CREATE TRIGGER "trg_contact_lists_updated_at"
  BEFORE UPDATE ON "contact_lists"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE "contact_list_members" (
  "list_id" UUID NOT NULL,
  "contact_id" UUID NOT NULL,
  "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "contact_list_members_pkey" PRIMARY KEY ("list_id", "contact_id"),
  CONSTRAINT "contact_list_members_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "contact_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "contact_list_members_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "contact_list_members_contact_idx" ON "contact_list_members" ("contact_id");

-- 3. Broadcast root ----------------------------------------------------------
CREATE TABLE "outbound_messages" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "organization_id" UUID NOT NULL,
  "created_by_id" UUID,
  "template_id" UUID,
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "html_body" TEXT NOT NULL,
  "text_body" TEXT,
  "status" "message_status" NOT NULL DEFAULT 'queued',
  "scheduled_at" TIMESTAMPTZ(6),
  "sent_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "outbound_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "outbound_messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "outbound_messages_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "outbound_messages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "outbound_messages_org_created_idx" ON "outbound_messages" ("organization_id", "created_at" DESC);
CREATE INDEX "outbound_messages_status_scheduled_idx" ON "outbound_messages" ("status", "scheduled_at");

CREATE TRIGGER "trg_outbound_messages_updated_at"
  BEFORE UPDATE ON "outbound_messages"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. Make email_deliveries polymorphic ---------------------------------------
-- email_deliveries is partitioned by created_at. PostgreSQL supports FKs from
-- a partitioned table to regular tables, and ALTER ... DROP NOT NULL / CHECK
-- constraints propagate to every existing and future partition.
ALTER TABLE "email_deliveries" DROP CONSTRAINT "email_deliveries_submission_fkey";
ALTER TABLE "email_deliveries" ALTER COLUMN "submission_id" DROP NOT NULL;
ALTER TABLE "email_deliveries" ALTER COLUMN "submission_created_at" DROP NOT NULL;

ALTER TABLE "email_deliveries" ADD COLUMN "message_id" UUID;
ALTER TABLE "email_deliveries" ADD COLUMN "contact_id" UUID;

ALTER TABLE "email_deliveries"
  ADD CONSTRAINT "email_deliveries_submission_fkey"
  FOREIGN KEY ("submission_id", "submission_created_at")
  REFERENCES "form_submissions"("id", "created_at") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_deliveries"
  ADD CONSTRAINT "email_deliveries_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "outbound_messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "email_deliveries"
  ADD CONSTRAINT "email_deliveries_contact_id_fkey"
  FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- XOR: form deliveries and broadcasts can never share a row.
ALTER TABLE "email_deliveries"
  ADD CONSTRAINT "email_deliveries_parent_chk"
  CHECK (("submission_id" IS NOT NULL) <> ("message_id" IS NOT NULL));

CREATE INDEX "email_deliveries_message_status_idx" ON "email_deliveries" ("message_id", "status");
CREATE INDEX "email_deliveries_contact_idx" ON "email_deliveries" ("contact_id");
