-- P0 security: tighten RLS + safe lookup functions (no LIKE wildcards)

DROP POLICY IF EXISTS "profiles_select_public_form_config" ON public.profiles;

CREATE OR REPLACE FUNCTION public.find_profile_by_business_name(p_business_name TEXT)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  aspects TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.business_name, p.aspects
  FROM public.profiles p
  WHERE lower(trim(p.business_name)) = lower(trim(p_business_name))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_profile_by_business_name(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_profile_by_business_name(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.profile_username_taken(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE lower(trim(username)) = lower(trim(p_username))
  );
$$;

REVOKE ALL ON FUNCTION public.profile_username_taken(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profile_username_taken(TEXT) TO service_role;
