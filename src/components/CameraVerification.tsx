import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Camera, X, Check } from 'lucide-react';
import { verifyEventAttendance, extractGPSFromPhoto, extractTimestampFromPhoto } from '@/lib/verification';
import type { Event } from '@/types';

interface CameraVerificationProps {
  event: Event;
  onVerify: (photo: File, gpsData: { latitude: number; longitude: number }, timestamp: Date) => void;
  onClose: () => void;
}

export function CameraVerification({ event, onVerify, onClose }: CameraVerificationProps) {
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    reasons: string[];
    confidence: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'verification-photo.jpg', { type: 'image/jpeg' });
      setCapturedPhoto(file);
      setPreview(URL.createObjectURL(file));
      stopCamera();
    }, 'image/jpeg');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const verifyPhoto = async () => {
    if (!capturedPhoto) return;

    setVerifying(true);
    try {
      const eventDetails = {
        venueLatitude: event.venue_latitude!,
        venueLongitude: event.venue_longitude!,
        startDate: new Date(event.start_date),
        endDate: new Date(event.end_date),
      };

      const result = await verifyEventAttendance(capturedPhoto, eventDetails);
      setVerificationResult(result);

      if (result.isValid) {
        const gpsData = await extractGPSFromPhoto(capturedPhoto);
        const timestamp = await extractTimestampFromPhoto(capturedPhoto);
        
        // Use extracted data or fallback to event location/current time
        const finalGpsData = gpsData || result.gpsData || {
          latitude: eventDetails.venueLatitude,
          longitude: eventDetails.venueLongitude,
        };
        const finalTimestamp = timestamp || result.timestamp || new Date();
        
        onVerify(capturedPhoto, finalGpsData, finalTimestamp);
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Error verifying photo: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setVerifying(false);
    }
  };

  const reset = () => {
    setCapturedPhoto(null);
    setPreview(null);
    setVerificationResult(null);
    stopCamera();
  };

  const goBackToCamera = () => {
    setCapturedPhoto(null);
    setPreview(null);
    setVerificationResult(null);
    // Don't stop camera - let user start it again if needed
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Verify Attendance</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {!preview ? (
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={startCamera} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
              <Button onClick={capturePhoto} className="flex-1" disabled={!streamRef.current}>
                Capture Photo
              </Button>
            </div>
            <div className="text-center text-sm text-gray-500">or</div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              Select Photo from Gallery
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img src={preview} alt="Captured" className="w-full h-full object-cover" />
            </div>

            {verificationResult && (
              <div
                className={`p-4 rounded-lg ${
                  verificationResult.isValid
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {verificationResult.isValid ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <X className="h-5 w-5" />
                  )}
                  <span className="font-semibold">
                    {verificationResult.isValid ? 'Verification Passed' : 'Verification Failed'}
                  </span>
                </div>
                <div className="text-sm">
                  <div>Confidence: {verificationResult.confidence}%</div>
                  <ul className="list-disc list-inside mt-2">
                    {verificationResult.reasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {!verificationResult && (
                <>
                  <Button
                    onClick={verifyPhoto}
                    disabled={verifying}
                    className="flex-1"
                  >
                    {verifying ? 'Verifying...' : 'Verify Photo'}
                  </Button>
                  <Button variant="outline" onClick={goBackToCamera} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                    Choose Different
                  </Button>
                </>
              )}
              {verificationResult && (
                <>
                  <Button variant="outline" onClick={goBackToCamera} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Take New Photo
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                    Choose Different
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Single file input used throughout */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button variant="outline" onClick={onClose} className="w-full mt-4">
          Cancel
        </Button>
      </div>
    </div>
  );
}

