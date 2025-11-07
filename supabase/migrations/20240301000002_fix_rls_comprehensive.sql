-- Comprehensive RLS Fix
-- This will ensure all tables have proper RLS policies
-- Run this in Supabase SQL Editor

-- First, let's ensure we drop ALL existing policies to start fresh
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    -- Drop all policies on this table
    EXECUTE format('DROP POLICY IF EXISTS "Enable all for %I" ON %I', r.tablename, r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all operations on %I" ON %I', r.tablename, r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "%I_all_policy" ON %I', r.tablename, r.tablename);
  END LOOP;
END $$;

-- Now create policies for all tables that have RLS enabled
DO $$
DECLARE
  r RECORD;
  policy_name TEXT;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND EXISTS (
      SELECT 1 
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = tablename
      AND n.nspname = 'public'
      AND c.relrowsecurity = true
    )
  LOOP
    policy_name := r.tablename || '_allow_all';
    
    -- Create a single policy that allows all operations
    BEGIN
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR ALL USING (true) WITH CHECK (true)',
        policy_name,
        r.tablename
      );
      RAISE NOTICE 'Created policy for table: %', r.tablename;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating policy for %: %', r.tablename, SQLERRM;
    END;
  END LOOP;
END $$;

-- Alternative: If you want to disable RLS entirely for development (less secure)
-- Uncomment the following block:
/*
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;
*/

