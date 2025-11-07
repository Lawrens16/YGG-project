# Storage Buckets Setup Guide

## Problem
The application requires Supabase storage buckets to store images. If you see errors like:
- `Bucket not found`
- `400 Bad Request` when loading images
- `Failed to upload photo: Bucket not found`

This means the storage buckets haven't been created yet.

## Solution

### Option 1: Run the Migration (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/20240303000000_create_storage_buckets.sql`
4. Copy and paste the entire SQL into the SQL Editor
5. Click **Run** to execute

This will create all necessary buckets and set up the proper RLS policies.

### Option 2: Create Buckets Manually

1. Go to your Supabase Dashboard
2. Navigate to **Storage**
3. Click **New bucket** and create the following buckets (all should be **PUBLIC**):

   - **achievement-photos** (Public, 50MB limit)
   - **verification-photos** (Public, 50MB limit)
   - **avatars** (Public, 2MB limit)
   - **banners** (Public, 5MB limit)

4. For each bucket, set up RLS policies:
   - **SELECT**: Allow public read access
   - **INSERT**: Allow authenticated users to upload
   - **UPDATE**: Allow authenticated users to update
   - **DELETE**: Allow authenticated users to delete

### Option 3: Use Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

This will run all migrations including the storage bucket creation.

## Verification

After creating the buckets, the application will automatically:
- Try the primary bucket first
- Fall back to alternative buckets if needed
- Provide clear error messages if buckets are still missing

## Bucket Details

| Bucket Name | Purpose | Size Limit | Public |
|------------|---------|------------|--------|
| achievement-photos | Achievement and post images | 50MB | Yes |
| verification-photos | Attendance and verification photos | 50MB | Yes |
| avatars | User profile pictures | 2MB | Yes |
| banners | User and event banners | 5MB | Yes |

## Troubleshooting

If you still see errors after creating buckets:

1. **Check bucket names**: Ensure they match exactly (case-sensitive)
2. **Check RLS policies**: Make sure policies allow public read and authenticated write
3. **Check bucket visibility**: All buckets should be marked as PUBLIC
4. **Clear browser cache**: Sometimes cached errors persist

## Code Changes

The code has been updated to:
- Use a centralized `uploadFile` helper function
- Automatically try fallback buckets
- Provide better error messages
- Handle missing buckets gracefully

All upload code now uses `src/lib/storage.ts` which handles bucket fallbacks automatically.

