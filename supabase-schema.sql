-- GeoCheck NL - Supabase Schema

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Businesses table
CREATE TABLE IF NOT EXISTS gc_businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  website TEXT,
  plan TEXT NOT NULL DEFAULT 'gratis',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  email_reports BOOLEAN DEFAULT true,
  report_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scans table
CREATE TABLE IF NOT EXISTS gc_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES gc_businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  geo_score INTEGER, -- 0-100
  mention_rate DECIMAL, -- 0.0 - 1.0
  sentiment_score DECIMAL, -- -1.0 to 1.0
  questions_asked INTEGER DEFAULT 0,
  questions_mentioned INTEGER DEFAULT 0,
  platforms JSONB DEFAULT '{}', -- {chatgpt: {...}, perplexity: {...}, gemini: {...}}
  raw_results JSONB DEFAULT '[]',
  suggestions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Competitors table  
CREATE TABLE IF NOT EXISTS gc_competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES gc_businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  city TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor scans
CREATE TABLE IF NOT EXISTS gc_competitor_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID REFERENCES gc_scans(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES gc_competitors(id) ON DELETE CASCADE,
  geo_score INTEGER,
  mention_rate DECIMAL,
  sentiment_score DECIMAL,
  platforms JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email reports
CREATE TABLE IF NOT EXISTS gc_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES gc_businesses(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES gc_scans(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT NOT NULL,
  status TEXT DEFAULT 'sent'
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS gc_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES gc_businesses(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE gc_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE gc_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE gc_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gc_competitor_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE gc_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE gc_subscriptions ENABLE ROW LEVEL SECURITY;

-- Businesses policies
CREATE POLICY "Users can manage own businesses" ON gc_businesses
  FOR ALL USING (auth.uid() = user_id);

-- Scans policies
CREATE POLICY "Users can view own scans" ON gc_scans
  FOR ALL USING (
    business_id IN (SELECT id FROM gc_businesses WHERE user_id = auth.uid())
  );

-- Competitors policies
CREATE POLICY "Users can manage own competitors" ON gc_competitors
  FOR ALL USING (
    business_id IN (SELECT id FROM gc_businesses WHERE user_id = auth.uid())
  );

-- Competitor scans policies
CREATE POLICY "Users can view competitor scans" ON gc_competitor_scans
  FOR ALL USING (
    scan_id IN (
      SELECT s.id FROM gc_scans s
      JOIN gc_businesses b ON s.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Reports policies
CREATE POLICY "Users can view own reports" ON gc_reports
  FOR ALL USING (
    business_id IN (SELECT id FROM gc_businesses WHERE user_id = auth.uid())
  );

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON gc_subscriptions
  FOR ALL USING (
    business_id IN (SELECT id FROM gc_businesses WHERE user_id = auth.uid())
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gc_businesses_updated_at
  BEFORE UPDATE ON gc_businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
