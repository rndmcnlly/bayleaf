-- Cache the Daytona sandbox ID to avoid a control-plane lookup per request.
-- Nullable: NULL means no sandbox has been provisioned yet.
-- Mirrors the pattern of or_key_hash/or_key_secret for OpenRouter.
ALTER TABLE user_keys ADD COLUMN daytona_sandbox_id TEXT DEFAULT NULL;
