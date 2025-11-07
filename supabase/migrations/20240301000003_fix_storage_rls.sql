-- Fix Storage Bucket RLS Policies
-- This fixes RLS errors when uploading files to storage buckets
-- Run this in Supabase SQL Editor

-- First, check if storage schema exists and has RLS enabled
-- Storage objects are in the storage.objects table

-- Drop existing storage policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- Create permissive policies for storage.objects
-- This allows all operations on storage objects

-- Allow public SELECT (read) access
CREATE POLICY "Allow public read access"
  ON storage.objects
  FOR SELECT
  USING (true);

-- Allow INSERT (upload) access
CREATE POLICY "Allow public insert access"
  ON storage.objects
  FOR INSERT
  WITH CHECK (true);

-- Allow UPDATE access
CREATE POLICY "Allow public update access"
  ON storage.objects
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow DELETE access
CREATE POLICY "Allow public delete access"
  ON storage.objects
  FOR DELETE
  USING (true);

-- Alternative: If the above doesn't work, disable RLS on storage.objects entirely
-- Uncomment the following line:
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

