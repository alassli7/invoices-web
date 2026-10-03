BEGIN;
-- Infer the creation time of tokens issued under the previous 30-day default.
ALTER TABLE public.store_customer_sessions ADD COLUMN IF NOT EXISTS created_at timestamptz;
UPDATE public.store_customer_sessions SET created_at = expires_at - interval '30 days' WHERE created_at IS NULL;
ALTER TABLE public.store_customer_sessions
  ALTER COLUMN created_at SET DEFAULT clock_timestamp(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN expires_at SET DEFAULT (clock_timestamp() + interval '30 minutes');
UPDATE public.store_customer_sessions SET expires_at = LEAST(expires_at, created_at + interval '30 minutes');

CREATE OR REPLACE FUNCTION public.customer_session(p_business_id text, p_token text)
RETURNS public.store_customers LANGUAGE sql SECURITY DEFINER SET search_path = public, extensions AS $$
  SELECT c FROM public.store_customers c JOIN public.store_customer_sessions s ON s.customer_id = c.id
    WHERE c.business_id = p_business_id AND s.expires_at > clock_timestamp()
      AND s.created_at + interval '30 minutes' > clock_timestamp()
      AND s.token_hash = encode(extensions.digest(coalesce(p_token,''), 'sha256'), 'hex');
$$;
NOTIFY pgrst, 'reload schema';
COMMIT;
