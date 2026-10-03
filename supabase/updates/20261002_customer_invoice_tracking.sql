-- Run this complete file in Supabase SQL Editor after the store customers migration.

-- 20261002030000_add_invoice_issuance_fields.sql
-- Add fields used by the invoice issuer to databases created from the legacy schema.
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS "clientAddress" text,
  ADD COLUMN IF NOT EXISTS "clientTaxNumber" text,
  ADD COLUMN IF NOT EXISTS uuid text,
  ADD COLUMN IF NOT EXISTS hash text,
  ADD COLUMN IF NOT EXISTS stamp text,
  ADD COLUMN IF NOT EXISTS "isTaxInvoice" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "taxInvoiceId" text,
  ADD COLUMN IF NOT EXISTS "taxInvoiceNumber" text,
  ADD COLUMN IF NOT EXISTS "vatRate" numeric,
  ADD COLUMN IF NOT EXISTS "selectiveTaxRate" numeric,
  ADD COLUMN IF NOT EXISTS "selectiveTaxAmount" numeric,
  ADD COLUMN IF NOT EXISTS total numeric,
  ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS editable boolean,
  ADD COLUMN IF NOT EXISTS deletable boolean,
  ADD COLUMN IF NOT EXISTS hideable boolean,
  ADD COLUMN IF NOT EXISTS "retentionExpiry" text,
  ADD COLUMN IF NOT EXISTS "retentionLocked" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "auditTrail" jsonb NOT NULL DEFAULT '[]'::jsonb;


-- 20261002070000_thirty_minute_sessions.sql
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


-- 20261002080000_store_invoice_tracking.sql
BEGIN;
ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS subtotal numeric(14,2),
  ADD COLUMN IF NOT EXISTS vat_rate numeric,
  ADD COLUMN IF NOT EXISTS invoice_id text,
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS invoiced_at timestamptz,
  ADD COLUMN IF NOT EXISTS preparing_at timestamptz,
  ADD COLUMN IF NOT EXISTS ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispatched_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS "storeOrderId" uuid REFERENCES public.store_orders(id);
CREATE UNIQUE INDEX IF NOT EXISTS store_order_one_invoice ON public.store_orders(invoice_id) WHERE invoice_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS invoices_one_per_store_order ON public.invoices ("storeOrderId") WHERE "storeOrderId" IS NOT NULL;

-- Linked invoices can only be created inside the password-verified, atomic RPC.
CREATE OR REPLACE FUNCTION public.guard_store_invoice_link()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW."storeOrderId" IS NOT NULL AND coalesce(current_setting('app.issuing_store_order',true),'')<>NEW."storeOrderId"::text THEN
    RAISE EXCEPTION 'أصدر فاتورة الطلب من لوحة طلبات المتجر';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_store_invoice_link() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS guard_store_invoice_link ON public.invoices;
CREATE TRIGGER guard_store_invoice_link BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.guard_store_invoice_link();

CREATE OR REPLACE FUNCTION public.finalize_store_order(p_business_id text,p_password text,p_id uuid,p_invoice jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE owner jsonb; result public.store_orders; cols text; fields text; actual_total numeric; rate numeric;
BEGIN
  SELECT to_jsonb(b) INTO owner FROM public.businesses b WHERE b.id::text=p_business_id;
  IF owner IS NULL OR owner->>'status' IS DISTINCT FROM 'active' OR owner->>'role' IS DISTINCT FROM 'owner'
    OR coalesce(owner->>'password_hash','')<>encode(extensions.digest(coalesce(p_password,''),'sha256'),'hex') THEN RAISE EXCEPTION 'كلمة مرور صاحب المتجر غير صحيحة'; END IF;
  SELECT * INTO result FROM public.store_orders WHERE id=p_id AND business_id=p_business_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'الطلب غير موجود'; END IF;
  -- Repeated clicks/retries return the existing invoice, including simultaneous tabs.
  IF result.invoice_id IS NOT NULL THEN RETURN jsonb_build_object('invoice_id',result.invoice_id); END IF;
  IF result.status='cancelled' OR (result.status='pending' AND result.expires_at<=clock_timestamp()) THEN RAISE EXCEPTION 'انتهت مهلة الطلب أو تم إلغاؤه'; END IF;
  rate := CASE WHEN coalesce((owner->>'isTaxRegistered')::boolean,(owner->'payMethods'->'_profileExtras'->>'isTaxRegistered')::boolean,false) THEN 15 ELSE 0 END;
  IF result.vat_rate IS NULL AND rate<>0 THEN RAISE EXCEPTION 'الطلب قديم ولا يتضمن الضريبة. راجع المبلغ مع العميل قبل إصدار فاتورته'; END IF;
  IF coalesce(result.vat_rate,0)<>rate THEN RAISE EXCEPTION 'تغيرت إعدادات الضريبة بعد الطلب. راجع المبلغ مع العميل'; END IF;
  actual_total := coalesce(result.subtotal,result.total) + round(coalesce(result.subtotal,result.total)*rate/100,2);
  IF actual_total<>result.total OR jsonb_typeof(p_invoice) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'مبلغ الفاتورة غير مطابق للطلب'; END IF;
  IF coalesce(p_invoice->>'id','')='' OR coalesce(p_invoice->>'number','')='' OR
    (p_invoice->>'storeOrderId')::uuid IS DISTINCT FROM p_id OR p_invoice->>'business_id' IS DISTINCT FROM p_business_id OR
    p_invoice->'items' IS DISTINCT FROM result.items OR p_invoice->>'clientName' IS DISTINCT FROM result.client_name OR
    p_invoice->>'clientPhone' IS DISTINCT FROM result.client_phone OR p_invoice->>'clientEmail' IS DISTINCT FROM result.client_email OR
    p_invoice->>'status' IS DISTINCT FROM 'paid' OR coalesce((p_invoice->>'locked')::boolean,false) IS NOT TRUE OR
    (p_invoice->>'total')::numeric IS DISTINCT FROM actual_total OR coalesce((p_invoice->>'selectiveTaxAmount')::numeric,0)<>0 OR
    coalesce((p_invoice->>'isTaxInvoice')::boolean,false) IS DISTINCT FROM (rate>0) OR coalesce((p_invoice->>'vatRate')::numeric,0)<>rate THEN
    RAISE EXCEPTION 'بيانات الفاتورة غير مطابقة للطلب';
  END IF;
  -- Insert only supplied columns, keeping defaults of the existing invoice schema.
  SELECT string_agg(format('%I',k),',' ORDER BY k),string_agg(format('r.%I',k),',' ORDER BY k) INTO cols,fields
    FROM jsonb_object_keys(p_invoice) k WHERE EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.invoices'::regclass AND attname=k AND attnum>0 AND NOT attisdropped);
  IF (SELECT count(*) FROM jsonb_object_keys(p_invoice))<>(SELECT count(*) FROM jsonb_object_keys(p_invoice) k WHERE EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.invoices'::regclass AND attname=k AND attnum>0 AND NOT attisdropped)) THEN
    RAISE EXCEPTION 'طبّق أعمدة إصدار الفواتير المطلوبة أولاً';
  END IF;
  PERFORM set_config('app.issuing_store_order',p_id::text,true);
  EXECUTE format('INSERT INTO public.invoices (%s) SELECT %s FROM jsonb_populate_record(NULL::public.invoices,$1) r',cols,fields) USING p_invoice;
  PERFORM set_config('app.issuing_store_order','',true);
  UPDATE public.store_orders SET status='paid',paid_at=coalesce(paid_at,clock_timestamp()),invoice_id=p_invoice->>'id',invoice_number=p_invoice->>'number',invoiced_at=clock_timestamp() WHERE id=p_id;
  RETURN jsonb_build_object('invoice_id',p_invoice->>'id');
END;
$$;
REVOKE ALL ON FUNCTION public.finalize_store_order(text,text,uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_store_order(text,text,uuid,jsonb) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.create_customer_store_order(p_business_id text, p_token text, p_key uuid, p_items jsonb, p_fulfillment text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE customer public.store_customers; result public.store_orders; product jsonb; entry jsonb;
  lines jsonb := '[]'; quantity integer; amount numeric := 0; price numeric; shop jsonb; rate numeric := 0;
BEGIN
  SELECT * INTO customer FROM public.customer_session(p_business_id,p_token);
  IF customer.id IS NULL THEN RAISE EXCEPTION 'سجّل الدخول قبل تأكيد الطلب'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id::text = p_business_id AND status = 'active') THEN RAISE EXCEPTION 'المتجر غير متاح'; END IF;
  SELECT to_jsonb(b) INTO shop FROM public.businesses b WHERE b.id::text=p_business_id;
  IF coalesce((shop->>'isTaxRegistered')::boolean,(shop->'payMethods'->'_profileExtras'->>'isTaxRegistered')::boolean,false) THEN
    IF regexp_replace(coalesce(shop->'payMethods'->>'taxNumber',''),'\s','','g') !~ '^3[0-9]{13}3$' OR coalesce((shop->'payMethods'->>'vatRate')::numeric,0) NOT IN (0,15) OR coalesce((shop->'payMethods'->>'selectiveTaxRate')::numeric,0)<>0 THEN RAISE EXCEPTION 'راجع إعدادات ضريبة المتجر قبل الطلب'; END IF;
    rate := 15;
  END IF;
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
  INSERT INTO public.store_orders(receipt_token,business_id,customer_id,client_name,client_phone,client_email,items,total,subtotal,vat_rate,fulfillment,delivery_latitude,delivery_longitude,delivery_address)
    VALUES(p_key,p_business_id,customer.id,customer.name,customer.phone,customer.email,lines,amount+round(amount*rate/100,2),amount,rate,p_fulfillment,
      CASE WHEN p_fulfillment='delivery' THEN customer.latitude END,CASE WHEN p_fulfillment='delivery' THEN customer.longitude END,CASE WHEN p_fulfillment='delivery' THEN customer.address ELSE '' END)
    ON CONFLICT(receipt_token) DO NOTHING;
  SELECT * INTO result FROM public.store_orders WHERE receipt_token = p_key;
  IF result.customer_id IS DISTINCT FROM customer.id THEN RAISE EXCEPTION 'معرف طلب غير صالح'; END IF;
  RETURN jsonb_build_object('token',result.receipt_token);
END;
$$;


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
    IF p_action NOT IN ('paid','cancelled','preparing','ready','dispatched','completed') OR p_id IS NULL THEN RAISE EXCEPTION 'إجراء غير صالح'; END IF;
    SELECT * INTO result FROM public.store_orders WHERE id = p_id AND business_id = p_business_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'الطلب غير موجود'; END IF;
    IF p_action IN ('preparing','ready','dispatched','completed') THEN
      IF result.status<>'paid' OR result.invoice_id IS NULL THEN RAISE EXCEPTION 'يجب تأكيد الدفع وإصدار الفاتورة أولاً'; END IF;
      IF p_action='preparing' THEN
        UPDATE public.store_orders SET preparing_at=coalesce(preparing_at,clock_timestamp()) WHERE id=p_id;
      ELSIF p_action='ready' THEN
        IF result.preparing_at IS NULL THEN RAISE EXCEPTION 'ابدأ تجهيز الطلب أولاً'; END IF;
        UPDATE public.store_orders SET ready_at=coalesce(ready_at,clock_timestamp()) WHERE id=p_id;
      ELSIF p_action='dispatched' THEN
        IF result.fulfillment<>'delivery' OR result.ready_at IS NULL THEN RAISE EXCEPTION 'الطلب غير جاهز للتوصيل'; END IF;
        UPDATE public.store_orders SET dispatched_at=coalesce(dispatched_at,clock_timestamp()) WHERE id=p_id;
      ELSE
        IF result.ready_at IS NULL OR (result.fulfillment='delivery' AND result.dispatched_at IS NULL) THEN RAISE EXCEPTION 'أكمل مراحل تجهيز وإرسال الطلب أولاً'; END IF;
        UPDATE public.store_orders SET completed_at=coalesce(completed_at,clock_timestamp()) WHERE id=p_id;
      END IF;
      RETURN coalesce((SELECT jsonb_agg(to_jsonb(o)-'receipt_token' ORDER BY created_at DESC) FROM public.store_orders o WHERE business_id=p_business_id),'[]'::jsonb);
    END IF;
    IF p_action='paid' AND result.invoice_id IS NULL THEN RAISE EXCEPTION 'استخدم تأكيد الدفع وإصدار الفاتورة معاً'; END IF;
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


-- Reuse a paid invoice already issued by this merchant; never modify its contents.
CREATE OR REPLACE FUNCTION public.link_store_order_invoice(p_business_id text,p_password text,p_id uuid,p_invoice_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE owner jsonb; result public.store_orders; inv jsonb; invoice_lines jsonb; order_lines jsonb; amount numeric; rate numeric;
BEGIN
  SELECT to_jsonb(b) INTO owner FROM public.businesses b WHERE b.id::text=p_business_id;
  IF owner IS NULL OR owner->>'status' IS DISTINCT FROM 'active' OR owner->>'role' IS DISTINCT FROM 'owner'
    OR coalesce(owner->>'password_hash','')<>encode(extensions.digest(coalesce(p_password,''),'sha256'),'hex') THEN RAISE EXCEPTION 'كلمة مرور صاحب المتجر غير صحيحة'; END IF;
  SELECT * INTO result FROM public.store_orders WHERE id=p_id AND business_id=p_business_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'الطلب غير موجود'; END IF;
  IF result.invoice_id IS NOT NULL THEN
    IF result.invoice_id<>p_invoice_id THEN RAISE EXCEPTION 'تم ربط الطلب بفاتورة بالفعل'; END IF;
    RETURN jsonb_build_object('invoice_id',result.invoice_id);
  END IF;
  IF result.status='cancelled' OR (result.status='pending' AND result.expires_at<=clock_timestamp()) THEN RAISE EXCEPTION 'انتهت مهلة الطلب أو تم إلغاؤه'; END IF;
  SELECT to_jsonb(i) INTO inv FROM public.invoices i WHERE i.id::text=p_invoice_id AND i.business_id::text=p_business_id FOR UPDATE;
  IF inv IS NULL OR inv->>'status' IS DISTINCT FROM 'paid' OR inv->>'clientName' IS DISTINCT FROM result.client_name OR
    coalesce(inv->>'clientPhone','')<>result.client_phone OR coalesce(inv->>'clientEmail','')<>result.client_email OR
    (inv->>'storeOrderId' IS NOT NULL AND inv->>'storeOrderId'<>p_id::text) THEN RAISE EXCEPTION 'اختر فاتورة مدفوعة صادرة لنفس العميل من هذا المتجر'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(inv->'items') e WHERE coalesce((e->>'cancelled')::boolean,false) OR coalesce(jsonb_array_length(e->'extras'),0)>0) THEN RAISE EXCEPTION 'بنود الفاتورة مختلفة عن الطلب'; END IF;
  SELECT jsonb_agg(jsonb_build_object('desc',e->>'desc','qty',(e->>'qty')::numeric,'price',(e->>'price')::numeric) ORDER BY n),sum((e->>'qty')::numeric*(e->>'price')::numeric)
    INTO invoice_lines,amount FROM jsonb_array_elements(inv->'items') WITH ORDINALITY AS a(e,n);
  SELECT jsonb_agg(jsonb_build_object('desc',e->>'desc','qty',(e->>'qty')::numeric,'price',(e->>'price')::numeric) ORDER BY n)
    INTO order_lines FROM jsonb_array_elements(result.items) WITH ORDINALITY AS a(e,n);
  rate := CASE WHEN coalesce((inv->>'isTaxInvoice')::boolean,false) THEN coalesce((inv->>'vatRate')::numeric,0) ELSE 0 END;
  IF invoice_lines IS DISTINCT FROM order_lines OR amount+round(amount*rate/100,2) IS DISTINCT FROM result.total OR
    coalesce((inv->>'selectiveTaxAmount')::numeric,0)<>0 OR (inv->>'total' IS NOT NULL AND (inv->>'total')::numeric<>result.total) THEN RAISE EXCEPTION 'بنود الفاتورة أو مبلغها غير مطابقين للطلب'; END IF;
  UPDATE public.store_orders SET status='paid',paid_at=coalesce(paid_at,clock_timestamp()),invoice_id=p_invoice_id,invoice_number=inv->>'number',invoiced_at=coalesce(nullif(inv->>'createdAt','')::timestamptz,clock_timestamp()) WHERE id=p_id;
  RETURN jsonb_build_object('invoice_id',p_invoice_id);
END;
$$;
REVOKE ALL ON FUNCTION public.link_store_order_invoice(text,text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_store_order_invoice(text,text,uuid,text) TO anon,authenticated;

NOTIFY pgrst,'reload schema';
COMMIT;
