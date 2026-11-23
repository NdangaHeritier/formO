-- Manual rollback for 0007_non_dev_audience. Prisma does not apply this file.
-- ONLY run this before any outbound_messages rows exist, and only while no
-- application instance is writing message deliveries.
--
-- psql "$DATABASE_URL" -f prisma/migrations/0007_non_dev_audience/rollback.sql

DROP INDEX IF EXISTS "email_deliveries_contact_idx";
DROP INDEX IF EXISTS "email_deliveries_message_status_idx";

ALTER TABLE "email_deliveries" DROP CONSTRAINT IF EXISTS "email_deliveries_parent_chk";
ALTER TABLE "email_deliveries" DROP CONSTRAINT IF EXISTS "email_deliveries_contact_id_fkey";
ALTER TABLE "email_deliveries" DROP CONSTRAINT IF EXISTS "email_deliveries_message_id_fkey";
ALTER TABLE "email_deliveries" DROP CONSTRAINT IF EXISTS "email_deliveries_submission_fkey";

ALTER TABLE "email_deliveries" DROP COLUMN IF EXISTS "contact_id";
ALTER TABLE "email_deliveries" DROP COLUMN IF EXISTS "message_id";

-- Restore the original not-null parent. Fails if any broadcast delivery exists.
ALTER TABLE "email_deliveries" ALTER COLUMN "submission_created_at" SET NOT NULL;
ALTER TABLE "email_deliveries" ALTER COLUMN "submission_id" SET NOT NULL;

ALTER TABLE "email_deliveries"
  ADD CONSTRAINT "email_deliveries_submission_fkey"
  FOREIGN KEY ("submission_id", "submission_created_at")
  REFERENCES "form_submissions"("id", "created_at") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE IF EXISTS "outbound_messages";
DROP TABLE IF EXISTS "contact_list_members";
DROP TABLE IF EXISTS "contact_lists";
DROP TABLE IF EXISTS "contacts";
DROP TYPE IF EXISTS "message_status";
