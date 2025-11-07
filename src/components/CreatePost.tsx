import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar } from './ui/avatar';
import { Input } from './ui/input';
import { Image, X, Calendar } from 'lucide-react';
import { getAllEvents } from '@/lib/api';
import type { Event } from '@/types';

interface CreatePostProps {
  onSubmit: (content: string, image?: File, eventId?: string) => void;
}

export function CreatePost({ onSubmit }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const eventsData = await getAllEvents({ status: 'upcoming', limit: 20 });
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

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
      onSubmit(content, imageFile || undefined, selectedEventId || undefined);
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      setSelectedEventId('');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative">
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
            {selectedEventId && (
              <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-800">
                  Tagged: {events.find(e => e.id === selectedEventId)?.name || 'Event'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEventId('')}
                  className="h-6 w-6 p-0 ml-auto"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex gap-2">
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEventSelector(!showEventSelector)}
                  className="text-gray-600"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Tag Event
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              {showEventSelector && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {events.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No upcoming events</div>
                  ) : (
                    events.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => {
                          setSelectedEventId(event.id);
                          setShowEventSelector(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                      >
                        {event.name}
                      </button>
                    ))
                  )}
                </div>
              )}
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

