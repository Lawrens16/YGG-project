-- Add Featured Events Support
-- This migration adds is_featured and featured_priority columns to the events table

-- Add is_featured column (default: false)
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add featured_priority column (default: 0, higher = shown first)
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS featured_priority INTEGER DEFAULT 0;

-- Create indexes for efficient querying of featured events
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_events_featured_priority ON events(featured_priority DESC) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_events_featured_composite ON events(is_featured, featured_priority DESC) WHERE is_featured = true;

-- Add comment for documentation
COMMENT ON COLUMN events.is_featured IS 'Whether this event is featured in the carousel';
COMMENT ON COLUMN events.featured_priority IS 'Priority for carousel ordering (higher = shown first)';

