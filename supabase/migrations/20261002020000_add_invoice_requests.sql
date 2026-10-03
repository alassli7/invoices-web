CREATE TABLE IF NOT EXISTS public.invoice_requests (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  client_phone text,
  client_email text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS invoice_requests_business_created_idx
  ON public.invoice_requests (business_id, created_at DESC);

ALTER TABLE public.invoice_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public submit invoice requests"
  ON public.invoice_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending' AND jsonb_typeof(items) = 'array');

CREATE POLICY "public read invoice requests"
  ON public.invoice_requests FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public update invoice request status"
  ON public.invoice_requests FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (status IN ('pending', 'converted', 'rejected'));
