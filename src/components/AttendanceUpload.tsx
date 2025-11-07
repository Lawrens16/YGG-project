import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createAchievement } from '@/lib/api';
import { Button } from './ui/button';
import { Camera, Upload, Check, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import { extractGPSFromPhoto, extractTimestampFromPhoto } from '@/lib/verification';
import { uploadFile, STORAGE_BUCKETS } from '@/lib/storage';

interface AttendanceUploadProps {
  eventId: string;
  eventName: string;
  onSuccess: () => void;
}

export function AttendanceUpload({ eventId, eventName, onSuccess }: AttendanceUploadProps) {
  const { user } = useAuth();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!photo || !user) return;

    setUploading(true);
    setError(null);

    try {
      // Extract metadata
      const gpsData = await extractGPSFromPhoto(photo);
      const timestamp = await extractTimestampFromPhoto(photo);
      
      if (!gpsData) {
        setError('Could not extract GPS data. Please ensure location services are enabled.');
        setUploading(false);
        return;
      }

      // Get current date for attendance_day
      const attendanceDay = new Date().toISOString().split('T')[0];

      // Upload photo to Supabase Storage with automatic bucket fallback
      const fileExt = photo.name.split('.').pop();
      const fileName = `${eventId}-${user.id}-${Date.now()}.${fileExt}`;
      
      const { url: imageUrl } = await uploadFile(
        photo,
        fileName,
        STORAGE_BUCKETS.ACHIEVEMENT_PHOTOS,
        [STORAGE_BUCKETS.VERIFICATION_PHOTOS]
      );

      // Create achievement as attendance record
      await createAchievement({
        user_id: user.id,
        event_id: eventId,
        category: 'community',
        title: `Attended ${eventName}`,
        description: `Attendance recorded on ${new Date().toLocaleDateString()}`,
        image_url: imageUrl,
        gps_latitude: gpsData.latitude,
        gps_longitude: gpsData.longitude,
        timestamp: timestamp?.toISOString() || new Date().toISOString(),
        status: 'verified', // Auto-verify attendance
        attendance_day: attendanceDay,
      });

      setPhoto(null);
      setPreview(null);
      onSuccess();
    } catch (err: any) {
      console.error('Error uploading attendance:', err);
      
      if (err.message?.includes('duplicate') || err.message?.includes('unique_daily_attendance')) {
        setError('You have already registered attendance for today');
      } else {
        setError('Failed to upload attendance. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-bold text-lg mb-4">Register Attendance</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      {!preview ? (
        <div className="space-y-3">
          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
              capture="environment"
            />
            <div className="text-center">
              <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <span className="text-sm text-gray-600">Take Photo or Upload</span>
            </div>
          </label>
          <p className="text-xs text-gray-500 text-center">
            Photo must include GPS location data
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <img src={preview} alt="Attendance" className="w-full rounded-lg" />
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? (
                'Uploading...'
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Submit Attendance
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setPhoto(null);
                setPreview(null);
                setError(null);
              }}
              variant="outline"
            >
              Retake
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

