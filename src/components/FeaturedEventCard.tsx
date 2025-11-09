import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowRight, Star } from 'lucide-react';
import { format } from 'date-fns';
import type { Event } from '@/types';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface FeaturedEventCardProps {
  event: Event;
  className?: string;
}

export function FeaturedEventCard({ event, className = '' }: FeaturedEventCardProps) {
  const navigate = useNavigate();
  
  // Ensure backward compatibility with events that might not have featured fields
  const isFeatured = event.is_featured ?? false;

  return (
    <motion.div
      className={`relative group h-full ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Animated gradient border */}
      <div className="relative p-[3px] rounded-xl bg-gradient-to-br from-[#ff3800] via-[#ff6b35] to-[#ffa500] animate-gradient-shift h-full">
        <Card className="relative bg-white dark:bg-card rounded-lg overflow-hidden h-full flex flex-col min-h-[500px]">
          {/* Animated background gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff3800]/10 via-[#ff6b35]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {/* Featured Badge */}
          {isFeatured && (
            <div className="absolute top-2 right-2 z-10">
              <div className="bg-gradient-to-r from-[#ff3800] to-[#ff6b35] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                <Star className="h-3 w-3 fill-current" />
                FEATURED
              </div>
            </div>
          )}

          {/* Banner Image */}
          {event.banner_url ? (
            <div className="relative w-full h-56 overflow-hidden">
              <img
                src={event.banner_url}
                alt={event.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>
          ) : (
            <div className="w-full h-56 bg-gradient-to-br from-[#ff3800] via-[#ff6b35] to-[#ffa500] flex items-center justify-center">
              <Calendar className="h-16 w-16 text-white/50" />
            </div>
          )}

          {/* Content */}
          <div className="p-6 flex-1 flex flex-col min-h-[200px]">
            <h3 className="text-2xl font-bold mb-2 text-foreground line-clamp-2 min-h-[3.5rem]">
              {event.name}
            </h3>
            
            <div className="mb-4 min-h-[2.5rem]">
              {event.description ? (
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {event.description}
                </p>
              ) : (
                <div className="h-10" />
              )}
            </div>

            <div className="space-y-2 text-sm text-muted-foreground mb-4 flex-1 min-h-[80px]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#ff3800]" />
                <span className="font-medium">
                  {format(new Date(event.start_date), 'MMM d, yyyy')}
                </span>
                <span className="text-muted-foreground/60">•</span>
                <span>
                  {format(new Date(event.start_date), 'h:mm a')} -{' '}
                  {format(new Date(event.end_date), 'h:mm a')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#ff3800]" />
                <span className="line-clamp-1">{event.venue_address}</span>
              </div>
              {event.capacity && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#ff3800]" />
                  <span>Capacity: {event.capacity}</span>
                </div>
              )}
            </div>

            <Button
              className="w-full bg-gradient-to-r from-[#ff3800] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#ff3800] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/events/${event.id}`);
              }}
            >
              View Event Details
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Enhanced glow effect overlay */}
          <div className="absolute inset-0 pointer-events-none rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#ff3800]/20 via-[#ff6b35]/10 to-transparent blur-xl" />
          </div>
        </Card>
      </div>

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
    </motion.div>
  );
}

