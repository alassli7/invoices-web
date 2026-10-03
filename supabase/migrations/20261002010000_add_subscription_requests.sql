CREATE TABLE IF NOT EXISTS public.subscription_requests (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('pro', 'business')),
  cycle text NOT NULL CHECK (cycle IN ('monthly', 'yearly')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS subscription_requests_status_created_idx
  ON public.subscription_requests (status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS subscription_requests_one_pending_per_business
  ON public.subscription_requests (business_id) WHERE status = 'pending';

ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- The web app uses its own account store rather than Supabase Auth. Requests
-- can be submitted by the client, while review and plan changes happen locally
-- through the service-role protected admin tool.
CREATE POLICY "public submit subscription requests"
  ON public.subscription_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending' AND plan IN ('pro', 'business') AND cycle IN ('monthly', 'yearly'));
