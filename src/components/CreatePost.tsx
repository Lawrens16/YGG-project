import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar } from './ui/avatar';
import { Input } from './ui/input';
import { Image, X, Calendar, Search, MapPin, Clock } from 'lucide-react';
import { getUserRegistrations, getEventsByOrganizer } from '@/lib/api';
import type { Event, EventRegistration } from '@/types';

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
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const eventSelectorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (user) {
      loadUserEvents();
    }
  }, [user]);

  useEffect(() => {
    // Close event selector when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (eventSelectorRef.current && !eventSelectorRef.current.contains(event.target as Node)) {
        setShowEventSelector(false);
      }
    };

    if (showEventSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEventSelector]);

  const loadUserEvents = async () => {
    if (!user) return;
    
    try {
      // Get events user registered for
      const registrations = await getUserRegistrations(user.id);
      const registeredEvents = registrations
        .map((reg: EventRegistration) => reg.events)
        .filter((e: Event | null | undefined): e is Event => e !== null && e !== undefined);

      // Get events user organized
      const organizedEvents = await getEventsByOrganizer(user.id);

      // Combine and remove duplicates
      const allEvents = [...registeredEvents, ...organizedEvents];
      const uniqueEvents = Array.from(
        new Map(allEvents.map(event => [event.id, event])).values()
      );

      // Sort by start date (upcoming first)
      uniqueEvents.sort((a, b) => {
        const dateA = new Date(a.start_date).getTime();
        const dateB = new Date(b.start_date).getTime();
        return dateA - dateB;
      });

      setEvents(uniqueEvents);
    } catch (error) {
      console.error('Error loading user events:', error);
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
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                <Calendar className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-orange-900">
                    {events.find(e => e.id === selectedEventId)?.name || 'Event'}
                  </div>
                  {events.find(e => e.id === selectedEventId)?.start_date && (
                    <div className="text-xs text-orange-700">
                      {new Date(events.find(e => e.id === selectedEventId)!.start_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEventId('')}
                  className="h-6 w-6 p-0 flex-shrink-0 hover:bg-orange-200"
                  title="Remove event tag"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t relative">
              <div className="flex gap-2 relative">
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
                <div className="relative" ref={eventSelectorRef}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowEventSelector(!showEventSelector);
                      setEventSearchQuery('');
                    }}
                    className={`text-gray-600 ${selectedEventId ? 'bg-orange-50 text-orange-700' : ''}`}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {selectedEventId ? 'Change Event' : 'Tag Event'}
                  </Button>
                  {showEventSelector && (
                    <div 
                      className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden z-50 flex flex-col"
                    >
                  {/* Search bar */}
                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search events..."
                        value={eventSearchQuery}
                        onChange={(e) => setEventSearchQuery(e.target.value)}
                        className="pl-9"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Events list */}
                  <div className="overflow-y-auto max-h-64">
                    {events.length === 0 ? (
                      <div className="p-6 text-center">
                        <Calendar className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 mb-1">No events found</p>
                        <p className="text-xs text-gray-400">Register for events or create your own to tag them</p>
                      </div>
                    ) : (
                      (() => {
                        const filteredEvents = events.filter(event =>
                          event.name.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                          event.description?.toLowerCase().includes(eventSearchQuery.toLowerCase())
                        );

                        if (filteredEvents.length === 0) {
                          return (
                            <div className="p-4 text-center text-sm text-gray-500">
                              No events match "{eventSearchQuery}"
                            </div>
                          );
                        }

                        return filteredEvents.map((event) => {
                          const isOrganized = event.organizer_id === user?.id;
                          const eventDate = new Date(event.start_date);
                          const isPast = eventDate < new Date();
                          
                          return (
                            <button
                              key={event.id}
                              type="button"
                              onClick={() => {
                                setSelectedEventId(event.id);
                                setShowEventSelector(false);
                                setEventSearchQuery('');
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                selectedEventId === event.id ? 'bg-orange-50 border-orange-200' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  <Calendar className={`h-4 w-4 ${isPast ? 'text-gray-400' : 'text-orange-600'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm text-gray-900 truncate">
                                      {event.name}
                                    </span>
                                    {isOrganized && (
                                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full flex-shrink-0">
                                        Your Event
                                      </span>
                                    )}
                                  </div>
                                  {event.description && (
                                    <p className="text-xs text-gray-600 line-clamp-1 mb-1">
                                      {event.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        {eventDate.toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric',
                                          year: eventDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                        })}
                                      </span>
                                    </div>
                                    {event.venue_address && (
                                      <div className="flex items-center gap-1 truncate">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{event.venue_address}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {selectedEventId === event.id && (
                                  <div className="flex-shrink-0">
                                    <div className="h-5 w-5 rounded-full bg-orange-600 flex items-center justify-center">
                                      <X className="h-3 w-3 text-white" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        });
                      })()
                    )}
                  </div>
                </div>
                  )}
                </div>
              </div>
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

