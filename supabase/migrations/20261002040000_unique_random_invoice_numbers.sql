-- Enforce uniqueness for randomly generated invoice numbers within each business.
CREATE UNIQUE INDEX IF NOT EXISTS invoices_business_random_number_unique
  ON public.invoices (business_id, number)
  WHERE number LIKE 'INV-R-%';
