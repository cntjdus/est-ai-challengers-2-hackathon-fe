-- Existing profiles/user_preferences tables and their owner RLS policies are required.
-- These two fields are also part of the earlier UI migration; rerunning is safe.
BEGIN;
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS cooking_frequency text
    CONSTRAINT hk_ui_cooking_frequency_check
    CHECK (cooking_frequency IN ('0', '1-2', '3-4', '5+')),
  ADD COLUMN IF NOT EXISTS recipe_suggestion_enabled boolean NOT NULL DEFAULT false;
COMMIT;
