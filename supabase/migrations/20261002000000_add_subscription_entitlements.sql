ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS "subscriptionPlan" text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS "subscriptionStatus" text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "subscriptionCycle" text NOT NULL DEFAULT 'yearly',
  ADD COLUMN IF NOT EXISTS "subscriptionEndsAt" text;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_subscription_plan_check
    CHECK ("subscriptionPlan" IN ('free', 'pro', 'business')) NOT VALID,
  ADD CONSTRAINT businesses_subscription_status_check
    CHECK ("subscriptionStatus" IN ('active', 'pending', 'canceled', 'expired')) NOT VALID,
  ADD CONSTRAINT businesses_subscription_cycle_check
    CHECK ("subscriptionCycle" IN ('monthly', 'yearly')) NOT VALID;

-- Staff created before this migration inherited the businesses pending default.
UPDATE public.businesses
SET status = 'active'
WHERE role = 'staff' AND status = 'pending';
