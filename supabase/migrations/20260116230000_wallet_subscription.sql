-- Wallet System Tables

CREATE TABLE IF NOT EXISTS public.wallets (
    company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ENUMs if they don't exist
DO $$ BEGIN
    CREATE TYPE wallet_transaction_type AS ENUM ('credit_recharge', 'credit_gift_card', 'debit_license_purchase', 'debit_auto_renewal', 'debit_manual_adjustment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE wallet_transaction_status AS ENUM ('pending', 'success', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(company_id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    type wallet_transaction_type NOT NULL,
    description TEXT,
    reference_id TEXT, -- e.g. Razorpay Order ID
    status wallet_transaction_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.gift_cards (
    code TEXT PRIMARY KEY,
    amount NUMERIC(12, 2) NOT NULL,
    is_redeemed BOOLEAN DEFAULT FALSE,
    redeemed_by UUID REFERENCES public.companies(id),
    redeemed_at TIMESTAMPTZ,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.discount_codes (
    code TEXT PRIMARY KEY,
    discount_percentage NUMERIC(5, 2) NOT NULL, -- e.g. 10.00 for 10%
    total_uses INTEGER DEFAULT 1,
    uses_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ
);

-- Update Companies Table for Subscriptions
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS subscription_valid_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing')),
ADD COLUMN IF NOT EXISTS billing_cycle_anchor TIMESTAMPTZ;

-- RLS Policies

-- Wallets: View own wallet
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View own wallet" ON public.wallets;
CREATE POLICY "View own wallet" ON public.wallets
FOR SELECT USING (
    company_id IN (
        SELECT company_id FROM public.profiles 
        WHERE id = auth.uid()
    )
);

-- Wallet Transactions: View own transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View own transactions" ON public.wallet_transactions;
CREATE POLICY "View own transactions" ON public.wallet_transactions
FOR SELECT USING (
    wallet_id IN (
        SELECT company_id FROM public.profiles 
        WHERE id = auth.uid()
    )
);

-- Gift Cards: No public access to view all codes. Only via functions.
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- Discount Codes: No public access.
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Function to handle new company wallet creation (optional, but good practice)
CREATE OR REPLACE FUNCTION public.handle_new_company_wallet() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (company_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet when company is created
DROP TRIGGER IF EXISTS on_company_created_wallet ON public.companies;
CREATE TRIGGER on_company_created_wallet
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_company_wallet();

-- Backfill wallets for existing companies
INSERT INTO public.wallets (company_id)
SELECT id FROM public.companies
WHERE id NOT IN (SELECT company_id FROM public.wallets);
