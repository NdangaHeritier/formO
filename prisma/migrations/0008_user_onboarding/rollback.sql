-- Manual rollback for 0008_user_onboarding. Prisma does not apply this file.
ALTER TABLE "users" DROP COLUMN IF EXISTS "onboarding";
