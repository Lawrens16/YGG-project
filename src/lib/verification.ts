import exifr from 'exifr';

export interface VerificationResult {
  isValid: boolean;
  reasons: string[];
  confidence: number; // 0-100
  gpsData?: {
    latitude: number;
    longitude: number;
  };
  timestamp?: Date;
}

export interface EventDetails {
  venueLatitude: number;
  venueLongitude: number;
  startDate: Date;
  endDate: Date;
}

const GPS_TOLERANCE_METERS = 100; // 100 meters radius
const VERIFICATION_WINDOW_MINUTES = 30; // 30 minutes before event end

/**
 * Verify event attendance based on photo EXIF data
 */
export async function verifyEventAttendance(
  photo: File,
  eventDetails: EventDetails
): Promise<VerificationResult> {
  const reasons: string[] = [];
  let confidence = 0;

  try {
    // Extract EXIF data
    const exif = await exifr.parse(photo, {
      gps: true,
      exif: true,
      ifd0: true,
    });

    const photoLat = exif?.latitude;
    const photoLng = exif?.longitude;
    const photoTimestamp = exif?.DateTimeOriginal 
      ? new Date(exif.DateTimeOriginal)
      : exif?.CreateDate 
      ? new Date(exif.CreateDate)
      : null;

    // Check 1: GPS proximity (within tolerance radius)
    let gpsValid = false;
    if (photoLat && photoLng) {
      gpsValid = checkGPSProximity(
        photoLat,
        photoLng,
        eventDetails.venueLatitude,
        eventDetails.venueLongitude
      );
      if (gpsValid) {
        confidence += 50;
      } else {
        reasons.push('Location mismatch - photo taken outside event venue');
      }
    } else {
      reasons.push('No GPS data found in photo');
    }

    // Check 2: Timestamp validity (30 min before end to event end)
    let timeValid = false;
    if (photoTimestamp) {
      timeValid = checkTimestamp(
        photoTimestamp,
        eventDetails.startDate,
        eventDetails.endDate
      );
      if (timeValid) {
        confidence += 40;
      } else {
        reasons.push('Invalid timestamp - photo not taken during event window');
      }
    } else {
      reasons.push('No timestamp found in photo');
    }

    // Check 3: Photo is not reused (check hash against existing)
    // Note: This would require checking against a database of photo hashes
    // For now, we'll skip this check or implement it separately
    const photoHash = await hashImage(photo);
    const uniqueValid = true; // Placeholder - implement photo uniqueness check
    if (uniqueValid) {
      confidence += 10;
    } else {
      reasons.push('Photo already used for verification');
    }

    return {
      isValid: gpsValid && timeValid && uniqueValid,
      reasons: reasons.length > 0 ? reasons : ['All checks passed'],
      confidence: Math.min(confidence, 100),
      gpsData: photoLat && photoLng ? { latitude: photoLat, longitude: photoLng } : undefined,
      timestamp: photoTimestamp || undefined,
    };
  } catch (error) {
    console.error('Error verifying attendance:', error);
    return {
      isValid: false,
      reasons: ['Error processing photo: ' + (error instanceof Error ? error.message : 'Unknown error')],
      confidence: 0,
    };
  }
}

/**
 * Check if GPS coordinates are within tolerance radius
 */
function checkGPSProximity(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): boolean {
  const distance = calculateHaversineDistance(lat1, lng1, lat2, lng2);
  return distance <= GPS_TOLERANCE_METERS / 1000; // Convert meters to km
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if timestamp is within valid event window
 * Valid window: 30 minutes before event end to event end
 */
function checkTimestamp(
  photoTimestamp: Date,
  eventStartDate: Date,
  eventEndDate: Date
): boolean {
  const verificationStart = new Date(eventEndDate);
  verificationStart.setMinutes(verificationStart.getMinutes() - VERIFICATION_WINDOW_MINUTES);

  return (
    photoTimestamp >= verificationStart &&
    photoTimestamp <= eventEndDate
  );
}

/**
 * Generate hash of image file for uniqueness checking
 */
async function hashImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Extract GPS coordinates from photo
 */
export async function extractGPSFromPhoto(photo: File): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const exif = await exifr.parse(photo, { gps: true });
    if (exif?.latitude && exif?.longitude) {
      return {
        latitude: exif.latitude,
        longitude: exif.longitude,
      };
    }
    return null;
  } catch (error) {
    console.error('Error extracting GPS:', error);
    return null;
  }
}

/**
 * Extract timestamp from photo
 */
export async function extractTimestampFromPhoto(photo: File): Promise<Date | null> {
  try {
    const exif = await exifr.parse(photo, { exif: true, ifd0: true });
    if (exif?.DateTimeOriginal) {
      return new Date(exif.DateTimeOriginal);
    }
    if (exif?.CreateDate) {
      return new Date(exif.CreateDate);
    }
    return null;
  } catch (error) {
    console.error('Error extracting timestamp:', error);
    return null;
  }
}

