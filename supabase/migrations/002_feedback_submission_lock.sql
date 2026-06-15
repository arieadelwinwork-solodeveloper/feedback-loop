-- Satu pengisian form per perangkat (client) per nama usaha

CREATE TABLE IF NOT EXISTS public.feedback_submission_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  client_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT feedback_submission_locks_unique UNIQUE (business_name, client_key)
);

CREATE INDEX IF NOT EXISTS idx_feedback_submission_locks_business_client
  ON public.feedback_submission_locks (business_name, client_key);

ALTER TABLE public.feedback_submission_locks ENABLE ROW LEVEL SECURITY;
