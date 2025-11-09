import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { Event } from '@/types';
import { Card } from './ui/card';

interface EventQuickCardProps {
  event: Event;
}

export function EventQuickCard({ event }: EventQuickCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="flex-shrink-0 w-64 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <div className="relative h-32">
        {event.banner_url ? (
          <>
            <img
              src={event.banner_url}
              alt={event.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#ff3800] via-[#ff6b35] to-[#ffa500]" />
        )}
        <div className="absolute bottom-2 left-2 right-2">
          <h3 className="text-white font-bold text-sm line-clamp-2">
            {event.name}
          </h3>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{format(new Date(event.start_date), 'MMM d, h:mm a')}</span>
        </div>
      </div>
    </Card>
  );
}

