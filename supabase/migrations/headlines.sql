-- Create headlines table for A/B testing different headlines
CREATE TABLE headlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- Internal name for the headline variant
    headline TEXT NOT NULL, -- Main headline text
    subheadline TEXT, -- Subheadline text (optional)
    bullet_points JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of bullet point objects with icon and text
    active BOOLEAN NOT NULL DEFAULT true, -- Whether this headline is active for testing
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for active headlines
CREATE INDEX idx_headlines_active ON headlines(active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_headlines_updated_at BEFORE UPDATE
    ON headlines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE headlines ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read active headlines
CREATE POLICY "Active headlines are viewable by all authenticated users" ON headlines
    FOR SELECT USING (active = true AND auth.role() = 'authenticated');

-- Allow admins and marketers to manage headlines
CREATE POLICY "Admins and marketers can manage headlines" ON headlines
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE (raw_user_meta_data->>'role')::text IN ('admin', 'marketer')
        )
    );

-- Add slug field to headlines table
ALTER TABLE headlines ADD COLUMN slug TEXT;

-- Make slug unique and not null (we'll update existing records first)
UPDATE headlines SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '_', '-')) WHERE slug IS NULL;
ALTER TABLE headlines ALTER COLUMN slug SET NOT NULL;
ALTER TABLE headlines ADD CONSTRAINT headlines_slug_unique UNIQUE (slug);

-- Create index for fast slug lookups
CREATE INDEX idx_headlines_slug ON headlines(slug);

-- Update RLS policies to include slug in selectable columns
DROP POLICY IF EXISTS "Authenticated users can read active headlines" ON headlines;
CREATE POLICY "Authenticated users can read active headlines" ON headlines
    FOR SELECT
    TO authenticated
    USING (active = true); 