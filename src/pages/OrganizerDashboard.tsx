import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getEventsByOrganizer, createEvent } from '@/lib/api';
import type { Event } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { VenuePicker } from '@/components/VenuePicker';
import { Plus, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export function OrganizerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    venue_address: '',
    venue_latitude: '',
    venue_longitude: '',
    start_date: '',
    end_date: '',
    contact_info: '',
    email: '',
    capacity: '',
  });
  const [validationErrors, setValidationErrors] = useState<{
    start_date?: string;
    end_date?: string;
  }>({});

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getEventsByOrganizer(user.id);
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate dates
    const errors: { start_date?: string; end_date?: string } = {};
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (startDate < now) {
      errors.start_date = 'Start date cannot be in the past';
    }

    if (endDate < startDate) {
      errors.end_date = 'End date must be on or after start date';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    try {
      await createEvent({
        ...formData,
        organizer_id: user.id,
        venue_latitude: formData.venue_latitude ? parseFloat(formData.venue_latitude) : null,
        venue_longitude: formData.venue_longitude ? parseFloat(formData.venue_longitude) : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        status: 'upcoming',
      });
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        venue_address: '',
        venue_latitude: '',
        venue_longitude: '',
        start_date: '',
        end_date: '',
        contact_info: '',
        email: '',
        capacity: '',
      });
      setValidationErrors({});
      await loadEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error creating event');
    }
  };

  if (!user) {
    return <div className="p-4">Please connect your wallet</div>;
  }

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Events</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {showCreateForm && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Create New Event</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Event Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div>
              <label className="text-sm font-medium mb-2 block">Venue Location</label>
              <VenuePicker
                onSelect={(address, lat, lng) => {
                  setFormData({
                    ...formData,
                    venue_address: address,
                    venue_latitude: lat.toString(),
                    venue_longitude: lng.toString(),
                  });
                }}
                initialAddress={formData.venue_address}
                initialLat={formData.venue_latitude ? parseFloat(formData.venue_latitude) : undefined}
                initialLng={formData.venue_longitude ? parseFloat(formData.venue_longitude) : undefined}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  type="datetime-local"
                  placeholder="Start Date"
                  value={formData.start_date}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    setFormData({ ...formData, start_date: newStartDate });
                    // Clear validation errors when user types
                    setValidationErrors({});
                  }}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
                {validationErrors.start_date && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.start_date}</p>
                )}
              </div>
              <div>
                <Input
                  type="datetime-local"
                  placeholder="End Date"
                  value={formData.end_date}
                  onChange={(e) => {
                    const newEndDate = e.target.value;
                    setFormData({ ...formData, end_date: newEndDate });
                    // Clear validation errors when user types
                    setValidationErrors({});
                  }}
                  min={formData.start_date || new Date().toISOString().slice(0, 16)}
                  required
                />
                {validationErrors.end_date && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.end_date}</p>
                )}
              </div>
            </div>
            <Input
              placeholder="Contact Info"
              value={formData.contact_info}
              onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
            />
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Capacity (optional)"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            />
            <div className="flex gap-2">

              <Button 
                type="submit"
                disabled={!formData.name.trim() || !formData.start_date || !formData.end_date || Object.keys(validationErrors).length > 0}
                className="bg-[#ff3800] hover:bg-[#ff5500]"
              >
                Create Event
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowCreateForm(false);
                  setValidationErrors({});
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {events.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No events yet. Create your first event!</p>
          </Card>
        ) : (
          events.map((event) => (
            <Card
              key={event.id}
              className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <h2 className="text-xl font-bold mb-2">{event.name}</h2>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(event.start_date), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{event.venue_address}</span>
                </div>
                <div className="text-sm">
                  Status: <span className="font-semibold">{event.status}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

