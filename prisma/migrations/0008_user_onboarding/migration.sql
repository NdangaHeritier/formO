-- Optional per-user onboarding answers. Kept separate from User.interest so the
-- routing enum stays a two-value switch while richer answers are available for
-- future personalisation.
ALTER TABLE "users"
ADD COLUMN "onboarding" JSONB;
