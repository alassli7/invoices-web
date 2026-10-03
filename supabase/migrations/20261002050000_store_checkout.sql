-- Pending store bills are separate from immutable issued tax invoices.
CREATE TABLE IF NOT EXISTS public.store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_token uuid NOT NULL UNIQUE,
  business_id text NOT NULL,
  number text NOT NULL UNIQUE DEFAULT ('ORD-' || upper(replace(gen_random_uuid()::text, '-', ''))),
  client_name text NOT NULL,
  client_phone text NOT NULL,
  items jsonb NOT NULL,
  total numeric(14,2) NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL DEFAULT (clock_timestamp() + interval '30 minutes'),
  paid_at timestamptz,
  cancelled_at timestamptz
);
CREATE INDEX IF NOT EXISTS store_orders_pending_expiry ON public.store_orders (expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS store_orders_business_created ON public.store_orders (business_id, created_at DESC);
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_orders FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.expire_store_orders()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.store_orders SET status = 'cancelled', cancelled_at = expires_at
  WHERE status = 'pending' AND expires_at <= clock_timestamp();
$$;
REVOKE ALL ON FUNCTION public.expire_store_orders() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_store_order(p_business_id text, p_key uuid, p_name text, p_phone text, p_items jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  shop jsonb; product jsonb; entry jsonb; lines jsonb := '[]';
  result public.store_orders; quantity integer; amount numeric := 0; price numeric;
BEGIN
  SELECT to_jsonb(b) INTO shop FROM public.businesses b WHERE b.id::text = p_business_id;
  IF shop IS NULL OR shop->>'status' IS DISTINCT FROM 'active' THEN RAISE EXCEPTION 'المتجر غير متاح'; END IF;
  IF p_key IS NULL THEN RAISE EXCEPTION 'معرف الطلب مطلوب'; END IF;
  SELECT * INTO result FROM public.store_orders WHERE receipt_token = p_key;
  IF FOUND THEN
    IF result.business_id <> p_business_id THEN RAISE EXCEPTION 'معرف طلب غير صالح'; END IF;
    RETURN jsonb_build_object('token', result.receipt_token);
  END IF;
  IF length(trim(coalesce(p_name,''))) NOT BETWEEN 2 AND 150 OR length(trim(coalesce(p_phone,''))) NOT BETWEEN 7 AND 30 THEN
    RAISE EXCEPTION 'أدخل اسم العميل ورقم الهاتف الصحيح';
  END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'السلة غير صالحة'; END IF;
  IF jsonb_array_length(p_items) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'السلة غير صالحة'; END IF;
  FOR entry IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    IF coalesce(entry->>'qty','') !~ '^[1-9][0-9]{0,2}$' THEN RAISE EXCEPTION 'الكمية غير صالحة'; END IF;
    quantity := (entry->>'qty')::integer;
    SELECT to_jsonb(c) INTO product FROM public.catalog c
      WHERE c.business_id::text = p_business_id AND c.id::text = entry->>'id';
    IF product IS NULL THEN RAISE EXCEPTION 'أحد الأصناف لم يعد متاحاً'; END IF;
    price := round((product->>'price')::numeric, 2);
    IF price IS NULL OR price < 0 THEN RAISE EXCEPTION 'سعر الصنف غير صالح'; END IF;
    amount := amount + price * quantity;
    lines := lines || jsonb_build_array(jsonb_build_object('id', product->>'id', 'desc', product->>'desc', 'qty', quantity, 'price', price, 'type', product->>'type', 'unit', product->>'unit'));
  END LOOP;
  INSERT INTO public.store_orders(receipt_token, business_id, client_name, client_phone, items, total)
    VALUES (p_key, p_business_id, trim(p_name), trim(p_phone), lines, amount)
    ON CONFLICT (receipt_token) DO NOTHING;
  RETURN jsonb_build_object('token', p_key);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_store_order(p_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.store_orders; shop jsonb;
BEGIN
  UPDATE public.store_orders SET status = 'cancelled', cancelled_at = expires_at
    WHERE receipt_token = p_token AND status = 'pending' AND expires_at <= clock_timestamp();
  SELECT * INTO result FROM public.store_orders WHERE receipt_token = p_token;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT to_jsonb(b) INTO shop FROM public.businesses b WHERE b.id::text = result.business_id;
  RETURN (to_jsonb(result) - 'receipt_token') || jsonb_build_object('server_now', clock_timestamp(), 'business',
    jsonb_build_object('id', result.business_id, 'businessName', shop->>'businessName', 'phone', shop->>'phone',
      'bankName', shop->>'bankName', 'iban', shop->>'iban', 'accountName', shop->>'accountName',
      'bankEnabled', coalesce((shop->'payMethods'->>'bank')::boolean, false)));
END;
$$;

-- The existing app uses custom account passwords, not Supabase Auth.
-- Verify the password on the server before listing orders or accepting payment.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE OR REPLACE FUNCTION public.manage_store_orders(p_business_id text, p_password text, p_id uuid DEFAULT NULL, p_action text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE owner jsonb; result public.store_orders;
BEGIN
  SELECT to_jsonb(b) INTO owner FROM public.businesses b WHERE b.id::text = p_business_id;
  IF owner IS NULL OR owner->>'status' IS DISTINCT FROM 'active' OR owner->>'role' IS DISTINCT FROM 'owner'
    OR coalesce(owner->>'password_hash','') <> encode(extensions.digest(coalesce(p_password,''), 'sha256'), 'hex') THEN
    RAISE EXCEPTION 'كلمة مرور صاحب المتجر غير صحيحة';
  END IF;
  PERFORM public.expire_store_orders();
  IF p_action IS NOT NULL THEN
    IF p_action NOT IN ('paid','cancelled') OR p_id IS NULL THEN RAISE EXCEPTION 'إجراء غير صالح'; END IF;
    SELECT * INTO result FROM public.store_orders WHERE id = p_id AND business_id = p_business_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'الطلب غير موجود'; END IF;
    -- Check the deadline again after obtaining the row lock.
    IF result.status = 'pending' AND result.expires_at <= clock_timestamp() THEN
      UPDATE public.store_orders SET status = 'cancelled', cancelled_at = expires_at WHERE id = p_id;
    ELSIF result.status = 'pending' THEN
      UPDATE public.store_orders SET status = p_action,
        paid_at = CASE WHEN p_action = 'paid' THEN clock_timestamp() END,
        cancelled_at = CASE WHEN p_action = 'cancelled' THEN clock_timestamp() END WHERE id = p_id;
    ELSIF result.status <> p_action THEN RAISE EXCEPTION 'لا يمكن تغيير حالة الطلب بعد انتهائه';
    END IF;
  END IF;
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(o) - 'receipt_token' ORDER BY created_at DESC)
    FROM public.store_orders o WHERE business_id = p_business_id), '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.create_store_order(text,uuid,text,text,jsonb), public.get_store_order(uuid), public.manage_store_orders(text,text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_store_order(text,uuid,text,text,jsonb), public.get_store_order(uuid), public.manage_store_orders(text,text,uuid,text) TO anon, authenticated;

-- Runs even when all browser tabs are closed. Reads/payment also enforce the exact deadline.
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-store-orders') THEN
    PERFORM cron.unschedule('expire-store-orders');
  END IF;
  PERFORM cron.schedule('expire-store-orders', '* * * * *', 'SELECT public.expire_store_orders()');
END;
$$;
NOTIFY pgrst, 'reload schema';
