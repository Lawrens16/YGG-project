-- Create Storage Buckets for SpotMe
-- This migration creates the necessary storage buckets for the application
-- Note: Bucket creation via SQL is limited, so this provides the SQL to run manually
-- or you can use the Supabase Management API

-- Create achievement-photos bucket (if it doesn't exist)
-- This bucket stores achievement and post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'achievement-photos',
  'achievement-photos',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create verification-photos bucket (if it doesn't exist)
-- This bucket stores verification and attendance photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-photos',
  'verification-photos',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create banners bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for achievement-photos bucket
CREATE POLICY "Allow public read access for achievement-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'achievement-photos');

CREATE POLICY "Allow authenticated upload for achievement-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'achievement-photos');

CREATE POLICY "Allow authenticated update for achievement-photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'achievement-photos')
  WITH CHECK (bucket_id = 'achievement-photos');

CREATE POLICY "Allow authenticated delete for achievement-photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'achievement-photos');

-- Set up RLS policies for verification-photos bucket
CREATE POLICY "Allow public read access for verification-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'verification-photos');

CREATE POLICY "Allow authenticated upload for verification-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'verification-photos');

CREATE POLICY "Allow authenticated update for verification-photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'verification-photos')
  WITH CHECK (bucket_id = 'verification-photos');

CREATE POLICY "Allow authenticated delete for verification-photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'verification-photos');

-- Set up RLS policies for avatars bucket
CREATE POLICY "Allow public read access for avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated upload for avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated update for avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated delete for avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars');

-- Set up RLS policies for banners bucket
CREATE POLICY "Allow public read access for banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

CREATE POLICY "Allow authenticated upload for banners"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Allow authenticated update for banners"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'banners')
  WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Allow authenticated delete for banners"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'banners');

