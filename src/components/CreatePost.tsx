import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar } from './ui/avatar';
import { Image, X } from 'lucide-react';

interface CreatePostProps {
  onSubmit: (content: string, image?: File) => void;
}

export function CreatePost({ onSubmit }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() || imageFile) {
      onSubmit(content, imageFile || undefined);
      setContent('');
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex gap-3">
        <Avatar src={user?.avatar_url || undefined} alt={user?.display_name || 'You'} />
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-600"
              >
                <Image className="h-4 w-4 mr-2" />
                Photo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="submit"
                disabled={!content.trim() && !imageFile}
                className="bg-[#ff3800] hover:bg-[#ff5500]"
              >
                Post
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

