-- Keep issued invoice contents immutable while allowing payment status updates.
CREATE OR REPLACE FUNCTION public.protect_issued_invoice()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Issued invoices cannot be deleted';
  END IF;

  IF (to_jsonb(NEW) - 'status') IS DISTINCT FROM (to_jsonb(OLD) - 'status') THEN
    RAISE EXCEPTION 'Issued invoice contents cannot be modified';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoices_immutable_after_issue ON public.invoices;
CREATE TRIGGER invoices_immutable_after_issue
  BEFORE UPDATE OR DELETE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_issued_invoice();
