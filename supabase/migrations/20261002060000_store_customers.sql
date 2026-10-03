BEGIN;
CREATE TABLE IF NOT EXISTS public.store_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  latitude numeric(10,7) CHECK (latitude BETWEEN -90 AND 90),
  longitude numeric(10,7) CHECK (longitude BETWEEN -180 AND 180),
  address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (phone <> '' OR email <> ''),
  CHECK ((latitude IS NULL) = (longitude IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS store_customer_phone ON public.store_customers(business_id, phone) WHERE phone <> '';
CREATE UNIQUE INDEX IF NOT EXISTS store_customer_email ON public.store_customers(business_id, email) WHERE email <> '';
CREATE TABLE IF NOT EXISTS public.store_customer_sessions (
  token_hash text PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.store_customers(id),
  expires_at timestamptz NOT NULL DEFAULT (clock_timestamp() + interval '30 days')
);
CREATE TABLE IF NOT EXISTS public.store_customer_login_limits (
  login_key text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE public.store_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_customer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_customer_login_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_customers, public.store_customer_sessions, public.store_customer_login_limits FROM anon, authenticated;
ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.store_customers(id),
  ADD COLUMN IF NOT EXISTS client_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS fulfillment text NOT NULL DEFAULT 'pickup' CHECK (fulfillment IN ('delivery','pickup')),
  ADD COLUMN IF NOT EXISTS delivery_latitude numeric(10,7) CHECK (delivery_latitude BETWEEN -90 AND 90),
  ADD COLUMN IF NOT EXISTS delivery_longitude numeric(10,7) CHECK (delivery_longitude BETWEEN -180 AND 180),
  ADD COLUMN IF NOT EXISTS delivery_address text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS store_orders_customer ON public.store_orders(customer_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.normalize_customer_phone(p_phone text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE result text := translate(trim(coalesce(p_phone,'')), '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789');
BEGIN
  IF result = '' THEN RETURN ''; END IF;
  IF result !~ '^[0-9+() -]+$' THEN RAISE EXCEPTION 'رقم الجوال غير صالح'; END IF;
  result := regexp_replace(result, '[^0-9]', '', 'g');
  IF left(result,2) = '00' THEN result := substr(result,3); END IF;
  IF result ~ '^05[0-9]{8}$' THEN result := '966' || substr(result,2); END IF;
  IF result !~ '^[1-9][0-9]{7,14}$' THEN RAISE EXCEPTION 'رقم الجوال غير صالح'; END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.customer_session(p_business_id text, p_token text)
RETURNS public.store_customers LANGUAGE sql SECURITY DEFINER SET search_path = public, extensions AS $$
  SELECT c FROM public.store_customers c JOIN public.store_customer_sessions s ON s.customer_id = c.id
    WHERE c.business_id = p_business_id AND s.expires_at > clock_timestamp()
      AND s.token_hash = encode(extensions.digest(coalesce(p_token,''), 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.customer_dashboard(p_customer public.store_customers)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('profile', to_jsonb(p_customer) - 'password_hash', 'server_now', clock_timestamp(), 'orders', coalesce((
    SELECT jsonb_agg(to_jsonb(o) - 'customer_id' ORDER BY created_at DESC)
    FROM public.store_orders o WHERE customer_id = (p_customer).id AND business_id = (p_customer).business_id
  ), '[]'::jsonb));
$$;

CREATE OR REPLACE FUNCTION public.customer_account(p_action text, p_business_id text, p_token text DEFAULT NULL,
  p_identity text DEFAULT NULL, p_password text DEFAULT NULL, p_profile jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE customer public.store_customers; phone_value text; email_value text; name_value text;
  lat numeric; lng numeric; session_token text; identity_value text; login_key_value text;
  limits public.store_customer_login_limits; result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id::text = p_business_id) THEN RAISE EXCEPTION 'المتجر غير موجود'; END IF;
  IF p_action IN ('register','update') THEN
    name_value := trim(coalesce(p_profile->>'name',''));
    phone_value := public.normalize_customer_phone(p_profile->>'phone');
    email_value := lower(trim(coalesce(p_profile->>'email','')));
    IF length(name_value) NOT BETWEEN 2 AND 150 OR (phone_value = '' AND email_value = '') THEN RAISE EXCEPTION 'أدخل الاسم والجوال أو البريد الإلكتروني'; END IF;
    IF length(email_value) > 254 OR (email_value <> '' AND email_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') THEN RAISE EXCEPTION 'البريد الإلكتروني غير صالح'; END IF;
    lat := nullif(p_profile->>'latitude','')::numeric; lng := nullif(p_profile->>'longitude','')::numeric;
    IF (lat IS NULL) <> (lng IS NULL) OR lat NOT BETWEEN -90 AND 90 OR lng NOT BETWEEN -180 AND 180 THEN RAISE EXCEPTION 'إحداثيات الموقع غير صالحة'; END IF;
    IF length(coalesce(p_profile->>'address','')) > 500 THEN RAISE EXCEPTION 'عنوان التوصيل طويل جداً'; END IF;
  END IF;
  IF p_action = 'register' THEN
    IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id::text = p_business_id AND status = 'active') THEN RAISE EXCEPTION 'المتجر غير متاح للتسجيل'; END IF;
    IF length(coalesce(p_password,'')) < 8 OR octet_length(coalesce(p_password,'')) > 72 THEN RAISE EXCEPTION 'كلمة المرور يجب أن تكون ٨ أحرف على الأقل وبحد أقصى ٧٢ بايت'; END IF;
    BEGIN
      INSERT INTO public.store_customers(business_id,name,phone,email,password_hash,latitude,longitude,address)
        VALUES(p_business_id,name_value,phone_value,email_value,extensions.crypt(p_password,extensions.gen_salt('bf',10)),lat,lng,trim(coalesce(p_profile->>'address','')))
        RETURNING * INTO customer;
    EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'الجوال أو البريد مسجل في المتجر. استخدم تسجيل الدخول'; END;
  ELSIF p_action = 'login' THEN
    IF trim(coalesce(p_identity,'')) = '' OR length(coalesce(p_identity,'')) > 254 OR octet_length(coalesce(p_password,'')) > 72 THEN RETURN jsonb_build_object('error','بيانات الدخول غير صحيحة'); END IF;
    identity_value := lower(trim(coalesce(p_identity,'')));
    IF position('@' IN identity_value) = 0 THEN identity_value := public.normalize_customer_phone(identity_value); END IF;
    login_key_value := encode(extensions.digest(p_business_id || ':' || identity_value, 'sha256'),'hex');
    PERFORM pg_advisory_xact_lock(hashtextextended(login_key_value, 0));
    SELECT * INTO limits FROM public.store_customer_login_limits WHERE login_key = login_key_value;
    IF limits.window_start > clock_timestamp() - interval '15 minutes' AND limits.attempts >= 5 THEN RETURN jsonb_build_object('error','محاولات كثيرة. انتظر ١٥ دقيقة ثم أعد المحاولة'); END IF;
    SELECT * INTO customer FROM public.store_customers WHERE business_id = p_business_id AND (phone = identity_value OR email = identity_value);
    IF customer.id IS NULL OR customer.password_hash IS DISTINCT FROM extensions.crypt(coalesce(p_password,''),customer.password_hash) THEN
      INSERT INTO public.store_customer_login_limits(login_key, attempts) VALUES(login_key_value,1)
        ON CONFLICT(login_key) DO UPDATE SET attempts = CASE WHEN store_customer_login_limits.window_start < clock_timestamp() - interval '15 minutes' THEN 1 ELSE store_customer_login_limits.attempts + 1 END,
          window_start = CASE WHEN store_customer_login_limits.window_start < clock_timestamp() - interval '15 minutes' THEN clock_timestamp() ELSE store_customer_login_limits.window_start END;
      RETURN jsonb_build_object('error','الجوال أو البريد وكلمة المرور غير صحيحة');
    END IF;
    DELETE FROM public.store_customer_login_limits WHERE login_key = login_key_value;
  ELSE
    SELECT * INTO customer FROM public.customer_session(p_business_id,p_token);
    IF customer.id IS NULL THEN RETURN jsonb_build_object('error','سجّل الدخول إلى حساب العميل', 'code','CUSTOMER_SESSION_EXPIRED'); END IF;
    IF p_action = 'logout' THEN
      DELETE FROM public.store_customer_sessions WHERE token_hash = encode(extensions.digest(p_token,'sha256'),'hex');
      RETURN jsonb_build_object('ok',true);
    ELSIF p_action = 'update' THEN
      BEGIN
        UPDATE public.store_customers SET name=name_value,phone=phone_value,email=email_value,latitude=lat,longitude=lng,address=trim(coalesce(p_profile->>'address','')) WHERE id = customer.id RETURNING * INTO customer;
      EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'الجوال أو البريد مسجل لحساب آخر'; END;
    ELSIF p_action IS DISTINCT FROM 'get' THEN RAISE EXCEPTION 'إجراء غير صالح'; END IF;
  END IF;
  PERFORM public.expire_store_orders();
  result := public.customer_dashboard(customer);
  IF p_action IN ('register','login') THEN
    session_token := encode(extensions.gen_random_bytes(32),'hex');
    INSERT INTO public.store_customer_sessions(token_hash,customer_id) VALUES(encode(extensions.digest(session_token,'sha256'),'hex'),customer.id);
    result := result || jsonb_build_object('token',session_token);
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_customer_store_order(p_business_id text, p_token text, p_key uuid, p_items jsonb, p_fulfillment text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE customer public.store_customers; result public.store_orders; product jsonb; entry jsonb;
  lines jsonb := '[]'; quantity integer; amount numeric := 0; price numeric;
BEGIN
  SELECT * INTO customer FROM public.customer_session(p_business_id,p_token);
  IF customer.id IS NULL THEN RAISE EXCEPTION 'سجّل الدخول قبل تأكيد الطلب'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id::text = p_business_id AND status = 'active') THEN RAISE EXCEPTION 'المتجر غير متاح'; END IF;
  IF p_key IS NULL THEN RAISE EXCEPTION 'معرف الطلب مطلوب'; END IF;
  SELECT * INTO result FROM public.store_orders WHERE receipt_token = p_key;
  IF FOUND THEN
    IF result.customer_id IS DISTINCT FROM customer.id OR result.business_id <> p_business_id THEN RAISE EXCEPTION 'معرف طلب غير صالح'; END IF;
    RETURN jsonb_build_object('token',result.receipt_token);
  END IF;
  IF p_fulfillment IS NULL OR p_fulfillment NOT IN ('delivery','pickup') THEN RAISE EXCEPTION 'اختر طريقة استلام الطلب'; END IF;
  IF p_fulfillment = 'delivery' AND (customer.latitude IS NULL OR customer.longitude IS NULL OR customer.phone = '') THEN RAISE EXCEPTION 'أضف رقم الجوال وإحداثيات التوصيل إلى ملفك'; END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'السلة غير صالحة'; END IF;
  IF jsonb_array_length(p_items) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'السلة غير صالحة'; END IF;
  FOR entry IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    IF coalesce(entry->>'qty','') !~ '^[1-9][0-9]{0,2}$' THEN RAISE EXCEPTION 'الكمية غير صالحة'; END IF;
    quantity := (entry->>'qty')::integer;
    SELECT to_jsonb(c) INTO product FROM public.catalog c WHERE c.business_id::text = p_business_id AND c.id::text = entry->>'id';
    IF product IS NULL THEN RAISE EXCEPTION 'أحد الأصناف لم يعد متاحاً'; END IF;
    price := round((product->>'price')::numeric,2);
    IF price IS NULL OR price < 0 THEN RAISE EXCEPTION 'سعر الصنف غير صالح'; END IF;
    amount := amount + price * quantity;
    lines := lines || jsonb_build_array(jsonb_build_object('id',product->>'id','desc',product->>'desc','qty',quantity,'price',price,'type',product->>'type','unit',product->>'unit'));
  END LOOP;
  INSERT INTO public.store_orders(receipt_token,business_id,customer_id,client_name,client_phone,client_email,items,total,fulfillment,delivery_latitude,delivery_longitude,delivery_address)
    VALUES(p_key,p_business_id,customer.id,customer.name,customer.phone,customer.email,lines,amount,p_fulfillment,
      CASE WHEN p_fulfillment='delivery' THEN customer.latitude END,CASE WHEN p_fulfillment='delivery' THEN customer.longitude END,CASE WHEN p_fulfillment='delivery' THEN customer.address ELSE '' END)
    ON CONFLICT(receipt_token) DO NOTHING;
  SELECT * INTO result FROM public.store_orders WHERE receipt_token = p_key;
  IF result.customer_id IS DISTINCT FROM customer.id THEN RAISE EXCEPTION 'معرف طلب غير صالح'; END IF;
  RETURN jsonb_build_object('token',result.receipt_token);
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_store_customers(p_business_id text,p_password text,p_search text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE owner jsonb; query_phone text;
BEGIN
  SELECT to_jsonb(b) INTO owner FROM public.businesses b WHERE id::text = p_business_id;
  IF owner IS NULL OR owner->>'status' IS DISTINCT FROM 'active' OR owner->>'role' IS DISTINCT FROM 'owner'
    OR coalesce(owner->>'password_hash','') <> encode(extensions.digest(coalesce(p_password,''),'sha256'),'hex') THEN RAISE EXCEPTION 'كلمة مرور صاحب المتجر غير صحيحة'; END IF;
  query_phone := regexp_replace(translate(coalesce(p_search,''),'٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹','01234567890123456789'),'[^0-9]','','g');
  IF left(query_phone,2)='00' THEN query_phone := substr(query_phone,3); END IF;
  IF left(query_phone,2)='05' THEN query_phone := '966' || substr(query_phone,2); END IF;
  PERFORM public.expire_store_orders();
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(c)-'password_hash' || jsonb_build_object('orders',coalesce((
    SELECT jsonb_agg(to_jsonb(o)-'receipt_token' ORDER BY created_at DESC) FROM public.store_orders o WHERE customer_id=c.id AND business_id=p_business_id
  ),'[]'::jsonb))) FROM (SELECT * FROM public.store_customers WHERE business_id=p_business_id AND
    (trim(coalesce(p_search,''))='' OR name ILIKE '%'||p_search||'%' OR email ILIKE '%'||p_search||'%' OR (query_phone<>'' AND phone LIKE '%'||query_phone||'%'))
    ORDER BY created_at DESC LIMIT 50) c),'[]'::jsonb);
END;
$$;

-- Delivery coordinates and email are available in authenticated account/owner views.
CREATE OR REPLACE FUNCTION public.get_store_order(p_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.store_orders; shop jsonb;
BEGIN
  UPDATE public.store_orders SET status='cancelled',cancelled_at=expires_at WHERE receipt_token=p_token AND status='pending' AND expires_at<=clock_timestamp();
  SELECT * INTO result FROM public.store_orders WHERE receipt_token=p_token;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT to_jsonb(b) INTO shop FROM public.businesses b WHERE id::text=result.business_id;
  RETURN (to_jsonb(result)-ARRAY['receipt_token','customer_id','client_email','delivery_latitude','delivery_longitude','delivery_address']) || jsonb_build_object('server_now',clock_timestamp(),'business',
    jsonb_build_object('id',result.business_id,'businessName',shop->>'businessName','phone',shop->>'phone','bankName',shop->>'bankName','iban',shop->>'iban','accountName',shop->>'accountName','bankEnabled',coalesce((shop->'payMethods'->>'bank')::boolean,false)));
END;
$$;
REVOKE ALL ON FUNCTION public.normalize_customer_phone(text),public.customer_session(text,text),public.customer_dashboard(public.store_customers) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.customer_account(text,text,text,text,text,jsonb),public.create_customer_store_order(text,text,uuid,jsonb,text),public.manage_store_customers(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.customer_account(text,text,text,text,text,jsonb),public.create_customer_store_order(text,text,uuid,jsonb,text),public.manage_store_customers(text,text,text) TO anon,authenticated;
REVOKE ALL ON FUNCTION public.create_store_order(text,uuid,text,text,jsonb) FROM anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
