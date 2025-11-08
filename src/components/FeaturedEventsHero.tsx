import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { format } from 'date-fns';
import type { Event } from '@/types';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { StoryBubble } from './StoryBubble';

interface FeaturedEventsHeroProps {
  events: Event[];
}

export function FeaturedEventsHero({ events }: FeaturedEventsHeroProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapse state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('featuredEventsCollapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapse state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('featuredEventsCollapsed', JSON.stringify(newState));
  };

  if (events.length === 0) return null;

  const currentEvent = events[currentIndex];
  const isFeatured = currentEvent.is_featured ?? false;

  // If collapsed, show only story bubbles
  if (isCollapsed) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Featured Events</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="text-xs"
          >
            {events.length} featured
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {events.map((event, index) => (
            <StoryBubble
              key={event.id}
              event={event}
              isActive={index === currentIndex}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 relative z-0">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-[#ff3800]" />
          <h2 className="text-xl font-bold text-foreground">Featured Events</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="text-xs"
        >
          {events.length} featured
          <ChevronUp className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Hero Card */}
      <Card
        className="relative overflow-hidden cursor-pointer group"
        onClick={() => navigate(`/events/${currentEvent.id}`)}
      >
        <div className="relative h-[300px] md:h-[350px] overflow-hidden rounded-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentEvent.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-0"
            >
              {/* Banner Image */}
              {currentEvent.banner_url ? (
                <img
                  src={currentEvent.banner_url}
                  alt={currentEvent.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#ff3800] via-[#ff6b35] to-[#ffa500]" />
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Content Overlay */}
          <div className="relative h-full flex flex-col justify-end p-6 z-10">
            {/* Priority Badge */}
            {isFeatured && (
              <div className="absolute top-4 right-4 z-20">
                <div className="bg-gradient-to-r from-[#ff3800] to-[#ff6b35] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                  <Star className="h-3 w-3 fill-current" />
                  TOP EVENT
                </div>
              </div>
            )}

            {/* Event Info */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentEvent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <h3 className="text-2xl md:text-3xl font-bold text-white line-clamp-2">
                  {currentEvent.name}
                </h3>

                {currentEvent.description && (
                  <p className="text-white/90 text-sm line-clamp-2">
                    {currentEvent.description}
                  </p>
                )}

              <div className="flex flex-col gap-2 text-sm text-white/90">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(currentEvent.start_date), 'MMM d, yyyy')} •{' '}
                    {format(new Date(currentEvent.start_date), 'h:mm a')} -{' '}
                    {format(new Date(currentEvent.end_date), 'h:mm a')}
                  </span>
                </div>
                {currentEvent.venue_address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{currentEvent.venue_address}</span>
                  </div>
                )}
              </div>

                {/* Register Now Button */}
                <Button
                  className="w-full md:w-auto bg-gradient-to-r from-[#ff3800] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#ff3800] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/events/${currentEvent.id}`);
                  }}
                >
                  Register Now
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Card>

      {/* Story Bubbles */}
      {events.length > 1 && (
        <div className="mt-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            {events.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 bg-[#ff3800]'
                    : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
                aria-label={`Go to featured event ${index + 1}`}
              />
            ))}
          </div>

          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {events.map((event, index) => (
              <StoryBubble
                key={event.id}
                event={event}
                isActive={index === currentIndex}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

