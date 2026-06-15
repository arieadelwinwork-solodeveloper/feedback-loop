-- Feedback Loop: profiles + feedbacks with RLS

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  aspects TEXT[] NOT NULL DEFAULT ARRAY[
    'Kualitas layanan',
    'Ketepatan waktu',
    'Keramahan staf',
    'Kebersihan toko',
    'Transparansi harga'
  ],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_unique UNIQUE (username),
  CONSTRAINT profiles_email_unique UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  consumer_name TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 4),
  text TEXT NOT NULL DEFAULT '',
  aspects TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_business_name_lower
  ON public.profiles (lower(business_name));

CREATE INDEX IF NOT EXISTS idx_feedbacks_owner_id
  ON public.feedbacks (owner_id);

CREATE INDEX IF NOT EXISTS idx_feedbacks_business_name_lower
  ON public.feedbacks (lower(business_name));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Profiles: owners manage their own row
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Public read for form config (business name + aspects only via API; RLS allows row read)
CREATE POLICY "profiles_select_public_form_config"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Feedbacks: anyone can submit
CREATE POLICY "feedbacks_insert_public"
  ON public.feedbacks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Owners read feedback for their business
CREATE POLICY "feedbacks_select_own"
  ON public.feedbacks FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR lower(business_name) = (
      SELECT lower(p.business_name)
      FROM public.profiles p
      WHERE p.id = auth.uid()
    )
  );

-- Auto-create profile when auth user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
BEGIN
  v_username := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'username'), ''),
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, username, email, business_name)
  VALUES (NEW.id, v_username, NEW.email, v_username);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
