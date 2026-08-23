-- ==============================================================================
-- Migration: 00003_subscriptions_and_billing.sql
-- Description: Subscription Plans, User Subscriptions & Bakong KHQR Transactions
-- ==============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    price_khr NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    billing_interval VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'annual'
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_summary_limit INT NOT NULL DEFAULT 5, -- -1 for unlimited
    alert_rules_limit INT NOT NULL DEFAULT 1,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed standard plans
INSERT INTO subscription_plans (slug, name, description, price_usd, price_khr, billing_interval, features, ai_summary_limit, alert_rules_limit, is_popular)
VALUES
    ('free', 'Free Starter', 'Essential access for small contractors exploring public tenders.', 0.00, 0.00, 'monthly', 
     '["Browse all 6 Cambodian procurement sources", "5 AI Tender Summaries / month", "1 Active Telegram Alert Rule", "Basic Search & Sector Filters"]'::jsonb, 
     5, 1, false),
    ('pro', 'Pro Supplier', 'Designed for growing Cambodian suppliers & contractors actively bidding.', 29.00, 118000.00, 'monthly', 
     '["Unlimited AI Tender Summaries & BoQ Extraction", "AI Bid / No-Bid Decision Matrix & Win Probability", "Instant Telegram & Email Notification Alerts", "Full Saved Bids Pipeline Management", "Supplier Qualification Match & Gap Analysis", "Priority Email Support"]'::jsonb, 
     -1, 10, true),
    ('enterprise', 'Enterprise GovTech', 'For enterprise contractors, engineering firms & multi-person bid teams.', 99.00, 400000.00, 'monthly', 
     '["Everything in Pro Supplier", "Unlimited Telegram Alert Channels", "AI Proposal & Technical Spec Drafter", "Multi-Seat Team Collaboration (Up to 5 seats)", "Export Custom Decision Memos & Word Proposals", "Dedicated Account Manager & Phone Support"]'::jsonb, 
     -1, 100, false)
ON CONFLICT (slug) DO NOTHING;

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'bakong_khqr',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_slug VARCHAR(50) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'bakong_khqr',
    transaction_reference VARCHAR(100) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    khqr_string TEXT,
    khqr_md5 VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read subscription plans" ON subscription_plans FOR SELECT USING (true);
CREATE POLICY "Users can view own subscription" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own subscription" ON user_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own transactions" ON payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON payment_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
