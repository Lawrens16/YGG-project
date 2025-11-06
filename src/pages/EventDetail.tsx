import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent, registerForEvent, getEventRegistrations, verifyAttendance, issueEventBadges } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Event, EventRegistration } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { CameraVerification } from '@/components/CameraVerification';
import { MapPin, Calendar, Users, Code, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [registration, setRegistration] = useState<EventRegistration | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id, user]);

  const loadEvent = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const eventData = await getEvent(id);
      setEvent(eventData);
      
      if (eventData && user) {
        setIsOrganizer(eventData.organizer_id === user.id);
        
        // Check if user is registered
        const regs = await getEventRegistrations(id);
        setRegistrations(regs);
        const userReg = regs.find(r => r.user_id === user.id);
        setRegistration(userReg || null);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!event || !user) return;
    try {
      const reg = await registerForEvent(event.id, user.id);
      setRegistration(reg);
      await loadEvent();
    } catch (error) {
      console.error('Error registering:', error);
      alert('Error registering for event');
    }
  };

  const handleVerify = async (photo: File, gpsData: { latitude: number; longitude: number }, timestamp: Date) => {
    if (!registration || !event) return;
    
    try {
      // Upload photo to Supabase Storage
      const fileExt = photo.name.split('.').pop();
      const fileName = `${registration.id}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('verification-photos')
        .upload(fileName, photo);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('verification-photos')
        .getPublicUrl(fileName);

      // Verify attendance
      await verifyAttendance(registration.id, publicUrl, gpsData.latitude, gpsData.longitude, timestamp);
      setShowCamera(false);
      await loadEvent();
    } catch (error) {
      console.error('Error verifying:', error);
      alert('Error verifying attendance');
    }
  };

  const handleIssueBadges = async () => {
    if (!event) return;
    try {
      await issueEventBadges(event.id);
      await loadEvent();
      alert('Badges issued successfully!');
    } catch (error) {
      console.error('Error issuing badges:', error);
      alert('Error issuing badges');
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading event...</div>;
  }

  if (!event) {
    return <div className="p-4 text-center">Event not found</div>;
  }

  const canVerify = registration && 
    new Date(event.end_date) <= new Date() &&
    new Date(event.end_date).getTime() - Date.now() <= 30 * 60 * 1000; // 30 minutes before end

  const eventEnded = new Date(event.end_date) < new Date();

  return (
    <div className="p-4 space-y-4">
      {event.banner_url && (
        <img
          src={event.banner_url}
          alt={event.name}
          className="w-full h-64 object-cover rounded-lg"
        />
      )}

      <div>
        <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
        {event.description && (
          <p className="text-gray-600 mb-4">{event.description}</p>
        )}
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <div>
            <div className="font-semibold">Date & Time</div>
            <div className="text-sm text-gray-600">
              {format(new Date(event.start_date), 'MMM d, yyyy h:mm a')} -{' '}
              {format(new Date(event.end_date), 'h:mm a')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-gray-500" />
          <div>
            <div className="font-semibold">Venue</div>
            <div className="text-sm text-gray-600">{event.venue_address}</div>
          </div>
        </div>
        {event.capacity && (
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <div>
              <div className="font-semibold">Capacity</div>
              <div className="text-sm text-gray-600">
                {registrations.length} / {event.capacity}
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-gray-500" />
          <div>
            <div className="font-semibold">Event Code</div>
            <div className="text-sm font-mono">{event.event_code}</div>
          </div>
        </div>
      </Card>

      {isOrganizer && (
        <Card className="p-4">
          <h2 className="text-xl font-bold mb-4">Organizer Tools</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">QR Code</h3>
              <QRCodeGenerator value={event.event_code} />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Registrations ({registrations.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {registrations.map((reg) => (
                  <div key={reg.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{reg.user_profiles?.display_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">
                        {reg.verification_status === 'verified' ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" /> Verified
                          </span>
                        ) : (
                          <span className="text-gray-500 flex items-center gap-1">
                            <XCircle className="h-4 w-4" /> {reg.verification_status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {eventEnded && (
              <Button onClick={handleIssueBadges} className="w-full">
                Issue Badges to Verified Attendees
              </Button>
            )}
          </div>
        </Card>
      )}

      {!isOrganizer && user && (
        <Card className="p-4">
          {!registration ? (
            <Button onClick={handleRegister} className="w-full">
              Register for Event
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 text-green-800 rounded">
                <div className="font-semibold">Registered</div>
                <div className="text-sm">Status: {registration.verification_status}</div>
              </div>
              {registration.verification_status === 'registered' && canVerify && (
                <Button onClick={() => setShowCamera(true)} className="w-full">
                  Verify Attendance
                </Button>
              )}
              {registration.verification_status === 'verified' && (
                <div className="p-3 bg-blue-50 text-blue-800 rounded">
                  <div className="font-semibold">Attendance Verified!</div>
                  <div className="text-sm">You will receive your badge after the event ends.</div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {showCamera && event && (
        <CameraVerification
          event={event}
          onVerify={handleVerify}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}

