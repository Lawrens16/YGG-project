import { supabase } from './supabase';

/**
 * Storage bucket names used in the application
 */
export const STORAGE_BUCKETS = {
  ACHIEVEMENT_PHOTOS: 'achievement-photos',
  VERIFICATION_PHOTOS: 'verification-photos',
  AVATARS: 'avatars',
  BANNERS: 'banners',
} as const;

/**
 * Upload a file to Supabase storage with automatic bucket fallback
 * Tries the primary bucket first, then falls back to alternative buckets
 */
export async function uploadFile(
  file: File,
  fileName: string,
  primaryBucket: string = STORAGE_BUCKETS.ACHIEVEMENT_PHOTOS,
  fallbackBuckets: string[] = [STORAGE_BUCKETS.VERIFICATION_PHOTOS]
): Promise<{ url: string; bucket: string }> {
  // Try primary bucket first
  let { data, error } = await supabase.storage
    .from(primaryBucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (!error && data) {
    const { data: { publicUrl } } = supabase.storage
      .from(primaryBucket)
      .getPublicUrl(fileName);
    return { url: publicUrl, bucket: primaryBucket };
  }

  // Try fallback buckets
  for (const bucket of fallbackBuckets) {
    const result = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (!result.error && result.data) {
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);
      return { url: publicUrl, bucket };
    }
  }

  // If all buckets fail, try to create the primary bucket and retry
  if (error?.message?.includes('Bucket not found') || error?.message?.includes('not found')) {
    console.warn(`Bucket ${primaryBucket} not found. Please create it in Supabase Dashboard or run the migration.`);
    
    // Try to use a generic bucket name that might exist
    const genericBuckets = ['public', 'uploads', 'files', 'images'];
    for (const bucket of genericBuckets) {
      const result = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (!result.error && result.data) {
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);
        console.warn(`Using fallback bucket: ${bucket}. Please create proper buckets.`);
        return { url: publicUrl, bucket };
      }
    }
  }

  throw new Error(
    `Failed to upload file: ${error?.message || 'Unknown error'}. ` +
    `Please ensure storage buckets are created. Run the migration: 20240303000000_create_storage_buckets.sql`
  );
}

/**
 * Get public URL for a file in storage
 */
export function getPublicUrl(bucket: string, fileName: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Check if a bucket exists (by trying to list it)
 */
export async function bucketExists(bucketName: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 });
    return !error;
  } catch {
    return false;
  }
}

