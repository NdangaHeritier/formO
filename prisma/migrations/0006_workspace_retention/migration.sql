-- Workspace-level submission retention. NULL means keep forever / use the
-- environment default; deletion only runs when a value is configured.
ALTER TABLE "organizations"
ADD COLUMN "retention_days" INTEGER;

ALTER TABLE "organizations"
ADD CONSTRAINT "organizations_retention_days_check"
CHECK ("retention_days" IS NULL OR ("retention_days" >= 1 AND "retention_days" <= 3650));
