-- Add credentials column to performance_marketing_integrations to store OAuth tokens
ALTER TABLE "public"."performance_marketing_integrations" 
ADD COLUMN IF NOT EXISTS "credentials" jsonb DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN "public"."performance_marketing_integrations"."credentials" IS 'Stores OAuth tokens (access_token, refresh_token) and other sensitive data for the integration';
