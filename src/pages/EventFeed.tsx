import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEvents, getNearbyEvents } from '@/lib/api';
import type { Event } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Users, ArrowRight, Filter, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { calculateEventStatus, sortEvents, filterEventsByStatus, type SortOption } from '@/lib/events';

export function EventFeed() {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'finished'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('closest');
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
            setAllEvents(nearby);
            setLoading(false);
          },
          () => {
            // Fallback to all events if location denied
            getAllEvents({ limit: 100 }).then(setAllEvents).finally(() => setLoading(false));
          }
        );
      } else {
        const all = await getAllEvents({ limit: 100 });
        setAllEvents(all);
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

  // Calculate status for each event and apply filters/sorting
  const processedEvents = useMemo(() => {
    // First, filter by status
    const filtered = filterEventsByStatus(allEvents, statusFilter);
    // Then, sort
    return sortEvents(filtered, sortBy);
  }, [allEvents, statusFilter, sortBy]);

  // Get status badge styling
  const getStatusBadge = (status: 'upcoming' | 'ongoing' | 'finished' | 'cancelled') => {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-semibold shadow-sm';
    switch (status) {
      case 'upcoming':
        return `${baseClasses} bg-blue-50 text-blue-700 border border-blue-200`;
      case 'ongoing':
        return `${baseClasses} bg-green-50 text-green-700 border border-green-200`;
      case 'finished':
        return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-200`;
      case 'cancelled':
        return `${baseClasses} bg-red-50 text-red-700 border border-red-200`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-200`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Discover Events</h1>
          <p className="text-gray-600">Find and join amazing events near you</p>
        </div>
        <Button
          variant={nearbyMode ? 'default' : 'outline'}
          onClick={() => setNearbyMode(!nearbyMode)}
          className="shadow-sm"
        >
          {nearbyMode ? 'Show All' : 'Nearby'}
        </Button>
      </div>

      {/* Filters and Sorting */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Status Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Status:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'upcoming', 'ongoing', 'finished'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="text-xs capitalize font-medium"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-3 flex-wrap lg:ml-auto">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Sort:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 text-sm border-2 border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            >
              <option value="closest">Closest Date</option>
              <option value="furthest">Furthest Date</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </Card>

      {processedEvents.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">No events found</p>
            <p className="text-gray-500">Try adjusting your filters or check back later</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {processedEvents.map((event) => {
            const eventStatus = calculateEventStatus(event);
            return (
              <Card
                key={event.id}
                className="overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                {event.banner_url && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.banner_url}
                      alt={event.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={getStatusBadge(eventStatus)}>
                        {eventStatus}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-5">
                  {!event.banner_url && (
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-xl font-bold text-gray-900 flex-1">{event.name}</h2>
                      <span className={getStatusBadge(eventStatus)}>
                        {eventStatus}
                      </span>
                    </div>
                  )}
                  {event.banner_url && (
                    <h2 className="text-xl font-bold text-gray-900 mb-3">{event.name}</h2>
                  )}
                  {event.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{event.description}</p>
                  )}
                  <div className="space-y-2.5 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        {format(new Date(event.start_date), 'MMM d, yyyy h:mm a')} -{' '}
                        {format(new Date(event.end_date), 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{event.venue_address}</span>
                    </div>
                    {event.capacity && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>Capacity: {event.capacity}</span>
                      </div>
                    )}
                  </div>
                  <Button 
                    className="w-full group-hover:shadow-lg transition-all" 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/events/${event.id}`);
                    }}
                  >
                    View Details <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

