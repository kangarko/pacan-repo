CREATE TYPE event_type AS ENUM (
  'view',
  'sign_up',
  'buy_click',
  'buy',
  'buy_decline',
  'experiment_conversion'
);

CREATE TABLE tracking (
  id SERIAL PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  type event_type NOT NULL,
  user_id INT,
  email TEXT,
  ip TEXT NOT NULL,
  referer TEXT,
  source_type TEXT,
  source TEXT,
  campaign_id TEXT,
  adset_id TEXT,
  ad_id TEXT,
  user_agent TEXT NOT NULL,
  url TEXT NOT NULL,
  metadata JSONB,
  UNIQUE (type, date)
);

CREATE TABLE webinars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  video_url TEXT,
  duration_seconds INTEGER,
  offer JSONB,
  schedules JSONB,
  url TEXT NOT NULL,
  background_image_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE webinar_messages (
  id BIGSERIAL PRIMARY KEY,
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL, 
  user_name TEXT NOT NULL, 
  message TEXT NOT NULL,
  time_seconds INTEGER NOT NULL
);

CREATE TABLE webinar_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  schedule_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  watchtime_seconds INTEGER
);

CREATE TABLE webinar_feedback (
  id SERIAL PRIMARY KEY,
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE userdata (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  experiment_data JSONB
);

--- Temporary pending tables

CREATE TABLE paypal_purchases (
  id SERIAL PRIMARY KEY,
  created_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_id INT,
  name TEXT,
  email TEXT,
  region TEXT,
  amount FLOAT,
  currency TEXT,
  primary_offer_slug TEXT,
  secondary_offer_slug TEXT,
  payment_id TEXT,
  order_id TEXT,
  payer_id TEXT,
  paypal_name TEXT,
  paypal_email TEXT,
  UNIQUE (payment_id, order_id, created_on)
);

CREATE TABLE pending_emails (
  id SERIAL PRIMARY KEY,
  template TEXT NOT NULL,
  recipient TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--- Caches

CREATE TABLE cache (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  currencies JSONB,
  facebook JSONB,
  UNIQUE(year, month, day)
);

CREATE TABLE fb_name_cache (
  id SERIAL PRIMARY KEY,
  object_type VARCHAR(50) NOT NULL,
  object_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  parent_id VARCHAR(255),
  UNIQUE(object_type, object_id)
);

CREATE TABLE translate_cache (
  id SERIAL PRIMARY KEY,
  message_id TEXT,
  translation TEXT,
  UNIQUE(message_id)
);

--- Logged in user data

CREATE TABLE form_responses (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  form_slug TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE generated_images (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  flux_task_id TEXT NOT NULL,
  image_url TEXT,
  aspect_ratio TEXT NOT NULL DEFAULT '16:9',
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Experiments

CREATE TABLE experiments (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT true,
  variants JSONB NOT NULL, -- Array of variant names
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--- Offers table

CREATE TABLE offers (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  thumbnail_url TEXT,
  price FLOAT NOT NULL,
  currency TEXT NOT NULL,
  price_eur FLOAT NOT NULL,
  region_prices JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--- Error email rate limiting

CREATE TABLE error_email_rate_limit (
  id SERIAL PRIMARY KEY,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_hash TEXT NOT NULL,
  error_type TEXT NOT NULL CHECK (error_type IN ('client', 'server'))
);

CREATE INDEX idx_error_email_sent_at ON error_email_rate_limit(sent_at);

ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_name_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE paypal_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE userdata ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_email_rate_limit ENABLE ROW LEVEL SECURITY;