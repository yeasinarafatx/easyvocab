-- Create resources table for PDF/Ebook management
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_url text NOT NULL,
  is_free boolean DEFAULT false,
  visible boolean DEFAULT true,
  "order" integer DEFAULT 0,
  size_bytes integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index for queries
CREATE INDEX IF NOT EXISTS idx_resources_is_free_visible ON resources(is_free, visible);
CREATE INDEX IF NOT EXISTS idx_resources_order ON resources("order");

-- Enable RLS (Row-Level Security)
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read visible resources
CREATE POLICY "Anyone can read visible resources" ON resources
  FOR SELECT
  USING (visible = true);

-- Policy: Only authenticated users who are admins can insert/update/delete
CREATE POLICY "Only admins can manage resources" ON resources
  FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ));

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS resources_updated_at ON resources;
CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_resources_updated_at();
