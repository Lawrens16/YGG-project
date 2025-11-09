import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import type { Event } from '@/types';

interface StoryBubbleProps {
  event: Event;
  isActive: boolean;
  onClick: () => void;
}

export function StoryBubble({ event, isActive, onClick }: StoryBubbleProps) {
  const isFeatured = event.is_featured ?? false;

  return (
    <motion.button
      onClick={onClick}
      className="relative flex flex-col items-center gap-2 group"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Circular bubble with gradient ring */}
      <div className="relative">
        {/* Gradient ring - thicker when active */}
        <div
          className={`absolute inset-0 rounded-full ${
            isActive
              ? 'bg-gradient-to-r from-[#ff3800] via-[#ff6b35] to-[#ff3800] p-1 animate-gradient-shift'
              : 'bg-gradient-to-r from-[#ff3800]/50 via-[#ff6b35]/50 to-[#ff3800]/50 p-0.5'
          }`}
          style={{
            backgroundSize: isActive ? '200% 200%' : '100% 100%',
          }}
        >
          <div className="w-full h-full rounded-full bg-background" />
        </div>

        {/* Event banner as background */}
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-[#ff3800] via-[#ff6b35] to-[#ffa500]">
          {event.banner_url ? (
            <img
              src={event.banner_url}
              alt={event.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Star className="h-6 w-6 text-white/50" />
            </div>
          )}
          
          {/* Featured badge overlay */}
          {isFeatured && (
            <div className="absolute top-0 right-0 bg-gradient-to-r from-[#ff3800] to-[#ff6b35] text-white text-[8px] font-bold px-1 py-0.5 rounded-bl-full">
              ★
            </div>
          )}
        </div>
      </div>

      {/* Text label underneath */}
      <span className="text-xs font-medium text-foreground line-clamp-1 max-w-[64px] text-center">
        {event.name}
      </span>
    </motion.button>
  );
}

