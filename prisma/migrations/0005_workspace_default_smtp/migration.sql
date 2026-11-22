-- One workspace sender can be the default fallback for forms without an
-- explicit sender. Forms with no workspace default continue to use system SMTP.
ALTER TABLE "smtp_configs"
ADD COLUMN "is_system_default" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "smtp_configs_one_default_per_org"
ON "smtp_configs" ("organization_id")
WHERE "is_system_default" = true;
