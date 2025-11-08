import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { batchMintClearances, calculateTotalFee, calculateDeveloperFee, type BatchMintClearancesArgs } from '@/lib/sui';
import { useAuth } from '@/contexts/AuthContext';
import { uploadFile, STORAGE_BUCKETS } from '@/lib/storage';
import { X, CheckCircle, Loader2, Gift, Image as ImageIcon } from 'lucide-react';
import type { EventRegistration } from '@/types';

interface BatchMintClearancesProps {
  eventId: string;
  eventName: string;
  registrations: EventRegistration[];
  organizerCapObjectId: string;
  treasuryObjectId: string;
  onSuccess?: () => void;
  onClose: () => void;
}

export function BatchMintClearances({
  eventId,
  eventName,
  registrations,
  organizerCapObjectId,
  treasuryObjectId,
  onSuccess,
  onClose,
}: BatchMintClearancesProps) {
  const { walletAddress } = useAuth();
  const [selectedRegistrations, setSelectedRegistrations] = useState<Set<string>>(new Set());
  const [clearanceType, setClearanceType] = useState('Event Clearance');
  const [title, setTitle] = useState(`${eventName} Clearance`);
  const [description, setDescription] = useState(`Clearance for attending ${eventName}`);
  const [metadata, setMetadata] = useState('{}');
  const [baseFeePerClearance, setBaseFeePerClearance] = useState(100_000_000); // 0.1 SUI in MIST
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Filter registrations to only verified attendees
  const verifiedRegistrations = registrations.filter(
    (reg) => reg.verification_status === 'verified' && reg.user_profiles?.wallet_address
  );

  // Select all by default when verified registrations are loaded
  useEffect(() => {
    if (verifiedRegistrations.length > 0 && selectedRegistrations.size === 0) {
      setSelectedRegistrations(new Set(verifiedRegistrations.map((r) => r.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifiedRegistrations.length, registrations.length]);

  const toggleSelection = (regId: string) => {
    const newSelection = new Set(selectedRegistrations);
    if (newSelection.has(regId)) {
      newSelection.delete(regId);
    } else {
      newSelection.add(regId);
    }
    setSelectedRegistrations(newSelection);
  };

  const selectAll = () => {
    setSelectedRegistrations(new Set(verifiedRegistrations.map((r) => r.id)));
  };

  const deselectAll = () => {
    setSelectedRegistrations(new Set());
  };

  const selectedCount = selectedRegistrations.size;
  const totalFee = selectedCount > 0 ? calculateTotalFee(baseFeePerClearance, selectedCount) : 0;
  const developerFee = selectedCount > 0 ? calculateDeveloperFee(baseFeePerClearance, selectedCount) : 0;
  const totalFeeInSui = totalFee / 1_000_000_000;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleMint = async () => {
    if (selectedCount === 0) {
      setError('Please select at least one attendee');
      return;
    }

    if (!walletAddress) {
      setError('Please connect your wallet');
      return;
    }

    if (!organizerCapObjectId || organizerCapObjectId === '0x0') {
      setError('Organizer Cap Object ID is not found. This usually means:\n\n1. You have not been registered as an organizer on-chain yet.\n2. Please contact an administrator to register you using the Admin Panel.\n3. After registration, refresh this page.');
      return;
    }

    if (!treasuryObjectId || treasuryObjectId === '0x0') {
      setError('Developer Treasury Object ID is not configured. Please contact the administrator to set VITE_DEVELOPER_TREASURY_OBJECT_ID in the environment variables.');
      return;
    }

    // Get wallet addresses of selected attendees
    const selectedAttendees = verifiedRegistrations
      .filter((reg) => selectedRegistrations.has(reg.id))
      .map((reg) => reg.user_profiles?.wallet_address)
      .filter((addr): addr is string => !!addr);

    if (selectedAttendees.length === 0) {
      setError('No valid wallet addresses found for selected attendees');
      return;
    }

    setMinting(true);
    setError(null);

    try {
      let imageUrl: string | null = null;

      // Upload image if provided
      if (imageFile) {
        setUploadingImage(true);
        try {
          const fileExt = imageFile.name.split('.').pop() || 'jpg';
          const fileName = `clearances/${eventId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { url } = await uploadFile(
            imageFile,
            fileName,
            STORAGE_BUCKETS.ACHIEVEMENT_PHOTOS,
            [STORAGE_BUCKETS.BANNERS, STORAGE_BUCKETS.VERIFICATION_PHOTOS]
          );
          imageUrl = url;
        } catch (uploadError: any) {
          setError(`Failed to upload image: ${uploadError.message}`);
          setMinting(false);
          setUploadingImage(false);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      // Validate and merge metadata JSON
      let parsedMetadata: any = {};
      try {
        if (metadata.trim()) {
          parsedMetadata = JSON.parse(metadata);
        }
      } catch (e) {
        setError('Invalid JSON in metadata field');
        setMinting(false);
        return;
      }

      // Add image URL to metadata if provided
      if (imageUrl) {
        parsedMetadata.image_url = imageUrl;
      }

      const args: BatchMintClearancesArgs = {
        organizerCapObjectId,
        treasuryObjectId,
        attendees: selectedAttendees,
        eventId,
        eventName,
        clearanceType,
        title,
        description,
        metadata: JSON.stringify(parsedMetadata),
        baseFeePerClearance,
      };

      const result = await batchMintClearances(args);
      console.log('Batch mint successful:', result);
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('Error minting clearances:', err);
      setError(err.message || 'Failed to mint clearances. Please try again.');
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#ff3800]" />
              <h2 className="text-2xl font-bold">Batch Mint Clearances</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={minting}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Clearance Type</label>
              <Input
                value={clearanceType}
                onChange={(e) => setClearanceType(e.target.value)}
                placeholder="e.g., VIP, Standard, Premium"
                disabled={minting}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Clearance title"
                disabled={minting}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Clearance description"
                rows={3}
                disabled={minting}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                NFT Image (optional)
              </label>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Clearance preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                    disabled={minting || uploadingImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload or drag and drop
                    </span>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={minting || uploadingImage}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG, WEBP up to 5MB
                  </p>
                </div>
              )}
              {uploadingImage && (
                <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading image...
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Additional Metadata (JSON, optional)
              </label>
              <Textarea
                value={metadata}
                onChange={(e) => setMetadata(e.target.value)}
                placeholder='{"tier": "VIP", "benefits": ["all-access"]}'
                rows={3}
                disabled={minting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Image URL will be automatically added to metadata if an image is uploaded.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Base Fee per Clearance (in SUI)
              </label>
              <Input
                type="number"
                step="0.001"
                value={baseFeePerClearance / 1_000_000_000}
                onChange={(e) => {
                  const suiValue = parseFloat(e.target.value) || 0;
                  setBaseFeePerClearance(Math.floor(suiValue * 1_000_000_000));
                }}
                placeholder="0.1"
                disabled={minting}
              />
              <p className="text-xs text-gray-500 mt-1">
                This is the base fee. A 2% developer fee will be added automatically.
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Select Attendees ({selectedCount} selected)</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                    disabled={minting || verifiedRegistrations.length === 0}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAll}
                    disabled={minting || selectedCount === 0}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              {verifiedRegistrations.length === 0 ? (
                <div className="p-4 text-center bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded">
                  <p className="text-yellow-800 dark:text-yellow-300 font-medium mb-2">
                    No eligible attendees found
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    To mint clearances, attendees must:
                  </p>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-400 mt-2 text-left list-disc list-inside">
                    <li>Be registered for this event</li>
                    <li>Have their attendance verified</li>
                    <li>Have a wallet address linked to their profile</li>
                  </ul>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-3">
                    Total registrations: {registrations.length} | 
                    Verified: {registrations.filter(r => r.verification_status === 'verified').length} | 
                    With wallet: {registrations.filter(r => r.user_profiles?.wallet_address).length}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-2">
                  {verifiedRegistrations.map((reg) => (
                    <div
                      key={reg.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        selectedRegistrations.has(reg.id)
                          ? 'bg-[#ff3800]/10 border border-[#ff3800]'
                          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => !minting && toggleSelection(reg.id)}
                    >
                      <div className="flex items-center gap-2">
                        {selectedRegistrations.has(reg.id) ? (
                          <CheckCircle className="h-5 w-5 text-[#ff3800]" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                        )}
                        <div>
                          <div className="font-medium">
                            {reg.user_profiles?.display_name || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {reg.user_profiles?.wallet_address?.slice(0, 8)}...
                            {reg.user_profiles?.wallet_address?.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedCount > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-2">Fee Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Clearances to mint:</span>
                    <span className="font-medium">{selectedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base fee per clearance:</span>
                    <span className="font-medium">{baseFeePerClearance / 1_000_000_000} SUI</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Developer fee (2%):</span>
                    <span className="font-medium">{developerFee / 1_000_000_000} SUI</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-300 dark:border-blue-700">
                    <span className="font-semibold">Total fee:</span>
                    <span className="font-bold text-lg">{totalFeeInSui.toFixed(6)} SUI</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleMint}
                disabled={minting || uploadingImage || selectedCount === 0 || !walletAddress}
                className="flex-1 bg-[#ff3800] hover:bg-[#ff5500]"
              >
                {minting || uploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploadingImage ? 'Uploading image...' : 'Minting...'}
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Mint {selectedCount} Clearance{selectedCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onClose} disabled={minting}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

