-- Keep invoice sequence rows inaccessible through the public Data API.
-- The application obtains numbers through its RPC and has a local fallback.
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;
