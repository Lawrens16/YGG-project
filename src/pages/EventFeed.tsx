import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEvents, getNearbyEvents } from '@/lib/api';
import type { Event } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Users, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export function EventFeed() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [nearbyMode, setNearbyMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      if (nearbyMode) {
        // Get user's location
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const nearby = await getNearbyEvents(
              position.coords.latitude,
              position.coords.longitude,
              10
            );
            setEvents(nearby);
            setLoading(false);
          },
          () => {
            // Fallback to all events if location denied
            getAllEvents({ status: 'upcoming', limit: 20 }).then(setEvents).finally(() => setLoading(false));
          }
        );
      } else {
        const all = await getAllEvents({ status: 'upcoming', limit: 20 });
        setEvents(all);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [nearbyMode]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Discover Events</h1>
        <Button
          variant={nearbyMode ? 'default' : 'outline'}
          onClick={() => setNearbyMode(!nearbyMode)}
        >
          {nearbyMode ? 'Show All' : 'Nearby'}
        </Button>
      </div>

      {events.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No events found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card
              key={event.id}
              className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              {event.banner_url && (
                <img
                  src={event.banner_url}
                  alt={event.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h2 className="text-xl font-bold mb-2">{event.name}</h2>
              {event.description && (
                <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
              )}
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(event.start_date), 'MMM d, yyyy h:mm a')} -{' '}
                    {format(new Date(event.end_date), 'h:mm a')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{event.venue_address}</span>
                </div>
                {event.capacity && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Capacity: {event.capacity}</span>
                  </div>
                )}
              </div>
              <Button className="w-full mt-4" onClick={(e) => {
                e.stopPropagation();
                navigate(`/events/${event.id}`);
              }}>
                View Details <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

