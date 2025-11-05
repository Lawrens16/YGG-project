import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createAchievement, verifyAchievement } from '@/lib/api';
import { getDailyTasks, isTaskMatch } from '@/lib/tasks';
import { mintCertificate } from '@/lib/sui';
import exifr from 'exifr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload as UploadIcon, MapPin } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

const categories = [
  { value: 'academic', label: 'Academic' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'technology', label: 'Technology' },
  { value: 'community', label: 'Community Involvement' },
  { value: 'sports', label: 'Sports' },
  { value: 'arts', label: 'Arts' },
];

export function Upload() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'academic' as const,
    image: null as File | null,
  });
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const dailyTasks = getDailyTasks();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFormData({ ...formData, image: acceptedFiles[0] });
      }
    },
    maxFiles: 1,
  });

  useEffect(() => {
    // Get GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGps({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      // Basic upload stub - replace with Supabase Storage later
      const imageUrl = formData.image ? URL.createObjectURL(formData.image) : null;

      // Extract EXIF from image if present
      let exifDate: Date | null = null;
      let exifLat: number | null = null;
      let exifLng: number | null = null;
      if (formData.image) {
        try {
          const exif = await exifr.parse(formData.image as any);
          if (exif?.DateTimeOriginal) exifDate = new Date(exif.DateTimeOriginal);
          if (typeof exif?.latitude === 'number') exifLat = exif.latitude;
          if (typeof exif?.longitude === 'number') exifLng = exif.longitude;
        } catch {}
      }

      // Verify against daily tasks and date
      const match = isTaskMatch(formData.title + ' ' + formData.description, dailyTasks);
      const isToday = (d: Date | null) => {
        if (!d) return false;
        const a = new Date();
        return d.getUTCFullYear() === a.getUTCFullYear() && d.getUTCMonth() === a.getUTCMonth() && d.getUTCDate() === a.getUTCDate();
      };
      const geoOk = (() => {
        if (exifLat != null && exifLng != null && gps) {
          const dl = exifLat - gps.lat;
          const dln = exifLng - gps.lng;
          const distKm = Math.sqrt(dl * dl + dln * dln) * 111; // rough
          return distKm < 5; // within ~5km
        }
        return true; // if no GPS, don't block
      })();

      // Compute simple proof hash from file bytes + exif
      let proofHash = new Uint8Array();
      if (formData.image) {
        const buf = await formData.image.arrayBuffer();
        const encoder = new TextEncoder();
        const meta = encoder.encode(`${exifDate?.toISOString() || ''}|${exifLat ?? ''},${exifLng ?? ''}`);
        const concat = new Uint8Array(meta.byteLength + buf.byteLength);
        concat.set(new Uint8Array(meta.buffer));
        concat.set(new Uint8Array(buf), meta.byteLength);
        const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', concat));
        proofHash = digest;
      }

      // Helper to encode bytes as hex string (browser-safe)
      const toHex = (bytes: Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

      // Create DB record first as pending
      const created = await createAchievement({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        category: match?.category || formData.category,
        image_url: imageUrl,
        proof_hash: proofHash.length ? toHex(proofHash) : null,
        gps_latitude: gps?.lat || exifLat || null,
        gps_longitude: gps?.lng || exifLng || null,
        timestamp: new Date().toISOString(),
        status: 'pending',
      });

      // If verification succeeds, mint on Sui and mark verified
      if (match && (isToday(exifDate) || exifDate === null) && geoOk) {
        const { digest, created: objectId } = await mintCertificate({
          owner: user.wallet_address,
          category: match.category,
          title: match.title,
          description: formData.description || '',
          proofHash,
          gpsData: `${(gps?.lat ?? exifLat) ?? ''},${(gps?.lng ?? exifLng) ?? ''}`,
        });
        await verifyAchievement(created.id, user.wallet_address, digest, objectId);
        // Optionally store object id separately (not in API helper yet)
      }

      navigate('/feed');
    } catch (error) {
      console.error('Error creating achievement:', error);
      alert('Failed to create achievement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Checking wallet connection...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Please connect your wallet to upload achievements.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Upload Achievement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Achievement Proof (Image or Certificate)
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                {formData.image ? (
                  <div className="space-y-2">
                    <img
                      src={URL.createObjectURL(formData.image)}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-gray-600">{formData.image.name}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UploadIcon className="w-12 h-12 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {isDragActive ? 'Drop the file here' : 'Drag & drop or click to upload'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Won Hackathon 2024"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Describe your achievement..."
              />
            </div>

            {/* GPS Location */}
            {gps && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>
                  Location: {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
                </span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Uploading...' : 'Submit Achievement'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

