-- Already applied to brhsnjiwmadnniuecoof on 2026-09-17.
-- Idempotent setup copy for another environment with the existing login schema.
BEGIN;
DO $check$
BEGIN
  IF to_regclass('public.profiles') IS NULL OR to_regclass('public.user_preferences') IS NULL THEN
    RAISE EXCEPTION 'Apply the existing Supabase login/database setup first.';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE oid IN ('public.profiles'::regclass, 'public.user_preferences'::regclass) AND NOT relrowsecurity) THEN
    RAISE EXCEPTION 'Owner-only RLS must be enabled before applying MyPage setup.';
  END IF;
END
$check$;
CREATE OR REPLACE FUNCTION public.hk_save_my_profile(p_draft jsonb, p_complete_onboarding boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_name text;
  v_prefs jsonb;
  v_key text;
  v_item jsonb;
  v_tag text;
  v_tags jsonb;
  v_profile public.profiles%ROWTYPE;
  v_preferences public.user_preferences%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Authentication required.'; END IF;
  IF jsonb_typeof(p_draft) IS DISTINCT FROM 'object' OR jsonb_typeof(p_draft -> 'preferences') IS DISTINCT FROM 'object' OR jsonb_typeof(p_draft -> 'display_name') IS DISTINCT FROM 'string' OR p_complete_onboarding IS NULL THEN RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid profile payload.'; END IF;
  IF (p_draft ->> 'user_id') IS DISTINCT FROM v_uid::text THEN RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Session changed'; END IF;
  v_name := btrim(p_draft ->> 'display_name');
  IF v_name !~ '^[가-힣A-Za-z0-9]{2,12}$' THEN RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid nickname.'; END IF;
  v_prefs := p_draft -> 'preferences';
  IF coalesce(v_prefs ->> 'cooking_frequency', '') NOT IN ('0','1-2','3-4','5+') OR jsonb_typeof(v_prefs -> 'expiry_alert_enabled') IS DISTINCT FROM 'boolean' OR jsonb_typeof(v_prefs -> 'recipe_suggestion_enabled') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid cooking frequency or alert settings.'; END IF;
  FOREACH v_key IN ARRAY ARRAY['preferred_tastes','excluded_ingredients','allergies'] LOOP
    IF v_key = 'allergies' AND NOT (v_prefs ? v_key) THEN CONTINUE; END IF;
    IF jsonb_typeof(v_prefs -> v_key) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Tags must be arrays of strings.'; END IF;
    IF jsonb_array_length(v_prefs -> v_key) > 50 THEN RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'At most 50 tags are allowed.'; END IF;
    v_tags := '[]'::jsonb;
    FOR v_item IN SELECT value FROM jsonb_array_elements(v_prefs -> v_key) LOOP
      IF jsonb_typeof(v_item) IS DISTINCT FROM 'string' THEN RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Tags must be strings.'; END IF;
      v_tag := btrim(v_item #>> '{}');
      IF char_length(v_tag) > 50 THEN RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Tags must not exceed 50 characters.'; END IF;
      IF v_tag <> '' AND NOT (v_tags @> jsonb_build_array(v_tag)) THEN v_tags := v_tags || jsonb_build_array(v_tag); END IF;
    END LOOP;
    v_prefs := jsonb_set(v_prefs, ARRAY[v_key], v_tags);
  END LOOP;
  INSERT INTO public.profiles (id, display_name) VALUES (v_uid, '') ON CONFLICT (id) DO NOTHING;
  SELECT * INTO STRICT v_profile FROM public.profiles WHERE id = v_uid FOR UPDATE;
  INSERT INTO public.user_preferences AS existing (user_id, cooking_frequency, preferred_tastes, excluded_ingredients, allergies, expiry_alert_enabled, recipe_suggestion_enabled)
  VALUES (v_uid, v_prefs ->> 'cooking_frequency', ARRAY(SELECT jsonb_array_elements_text(v_prefs -> 'preferred_tastes')), ARRAY(SELECT jsonb_array_elements_text(v_prefs -> 'excluded_ingredients')), ARRAY(SELECT jsonb_array_elements_text(coalesce(v_prefs -> 'allergies', '[]'::jsonb))), (v_prefs ->> 'expiry_alert_enabled')::boolean, (v_prefs ->> 'recipe_suggestion_enabled')::boolean)
  ON CONFLICT (user_id) DO UPDATE SET cooking_frequency = EXCLUDED.cooking_frequency, preferred_tastes = EXCLUDED.preferred_tastes, excluded_ingredients = EXCLUDED.excluded_ingredients, allergies = CASE WHEN v_prefs ? 'allergies' THEN EXCLUDED.allergies ELSE existing.allergies END, expiry_alert_enabled = EXCLUDED.expiry_alert_enabled, recipe_suggestion_enabled = EXCLUDED.recipe_suggestion_enabled
  RETURNING * INTO v_preferences;
  UPDATE public.profiles SET display_name = v_name, onboarding_completed_at = CASE WHEN p_complete_onboarding THEN coalesce(onboarding_completed_at, transaction_timestamp()) ELSE onboarding_completed_at END WHERE id = v_uid RETURNING * INTO STRICT v_profile;
  RETURN jsonb_build_object('profile', to_jsonb(v_profile), 'preferences', to_jsonb(v_preferences));
END
$function$;
GRANT SELECT ON public.profiles, public.user_preferences TO authenticated;
GRANT INSERT (id, display_name), UPDATE (display_name, onboarding_completed_at) ON public.profiles TO authenticated;
GRANT INSERT (user_id, cooking_frequency, preferred_tastes, excluded_ingredients, allergies, expiry_alert_enabled, recipe_suggestion_enabled), UPDATE (cooking_frequency, preferred_tastes, excluded_ingredients, allergies, expiry_alert_enabled, recipe_suggestion_enabled) ON public.user_preferences TO authenticated;
REVOKE ALL ON FUNCTION public.hk_save_my_profile(jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hk_save_my_profile(jsonb, boolean) TO authenticated;
COMMENT ON FUNCTION public.hk_save_my_profile(jsonb, boolean) IS 'Atomic owner-only profile/preferences save. Preserves exact cooking count, alert lead days, avatar and original onboarding timestamp.';
NOTIFY pgrst, 'reload schema';
COMMIT;
