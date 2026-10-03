-- Stable public names; the app also accepts legacy ID-based links.
BEGIN;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS store_slug text;
CREATE UNIQUE INDEX IF NOT EXISTS businesses_store_slug_unique ON public.businesses(store_slug);

CREATE OR REPLACE FUNCTION public.assign_store_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  base text;
  candidate text;
  suffix integer := 2;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.store_slug IS NOT NULL THEN
      NEW.store_slug := OLD.store_slug;
      RETURN NEW;
    END IF;
  END IF;
  base := trim(both '-' from regexp_replace(lower(normalize(coalesce(NEW."businessName", ''), NFC)), '[^a-z0-9ء-غف-ي٠-٩]+', '-', 'g'));
  IF base = '' THEN base := 'store'; END IF;
  PERFORM pg_advisory_xact_lock(730031003);
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.businesses WHERE store_slug = candidate OR id::text = candidate) LOOP
    candidate := base || '-' || suffix;
    suffix := suffix + 1;
  END LOOP;
  NEW.store_slug := candidate;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS businesses_assign_store_slug ON public.businesses;
CREATE TRIGGER businesses_assign_store_slug BEFORE INSERT OR UPDATE ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.assign_store_slug();
UPDATE public.businesses SET store_slug = NULL WHERE store_slug IS NULL;
ALTER TABLE public.businesses ALTER COLUMN store_slug SET NOT NULL;
COMMIT;
