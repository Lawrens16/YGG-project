import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEvent, registerForEvent, getEventRegistrations, verifyAttendance, issueEventBadges, getAchievements } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Event, EventRegistration, Achievement } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { CameraVerification } from '@/components/CameraVerification';
import { AttendanceUpload } from '@/components/AttendanceUpload';
import { MapPin, Calendar, Users, Code, CheckCircle, XCircle, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { uploadFile, STORAGE_BUCKETS } from '@/lib/storage';

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  // const navigate = useNavigate(); // Unused but kept for potential navigation needs
  const [event, setEvent] = useState<Event | null>(null);
  const [registration, setRegistration] = useState<EventRegistration | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<Achievement[]>([]);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<Achievement[]>([]);
  const [showAttendanceUpload, setShowAttendanceUpload] = useState(false);

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
        
        // Load user's attendance records
        if (userReg) {
          const userAchievements = await getAchievements({ userId: user.id });
          const eventAttendance = userAchievements.filter((a: Achievement) => a.event_id === id);
          setAttendanceRecords(eventAttendance);
        }
        
        // Load all attendance records for organizer
        if (eventData.organizer_id === user.id) {
          const allAchievements = await getAchievements({});
          const eventAttendance = allAchievements.filter((a: Achievement) => a.event_id === id && a.image_url);
          setAllAttendanceRecords(eventAttendance);
        }
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
      // Upload photo to Supabase Storage with automatic bucket fallback
      const fileExt = photo.name.split('.').pop();
      const fileName = `${registration.id}-${Date.now()}.${fileExt}`;
      
      const { url: publicUrl } = await uploadFile(
        photo,
        fileName,
        STORAGE_BUCKETS.VERIFICATION_PHOTOS,
        [STORAGE_BUCKETS.ACHIEVEMENT_PHOTOS]
      );

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
  
  // Check if event is currently active
  const eventIsActive = event && 
    new Date(event.start_date) <= new Date() && 
    new Date(event.end_date) >= new Date();

  // Check if user has already registered attendance today
  const hasAttendanceToday = attendanceRecords.some(record => {
    if (!record.attendance_day) return false;
    const recordDate = new Date(record.attendance_day).toDateString();
    const today = new Date().toDateString();
    return recordDate === today;
  });

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
              <QRCodeGenerator value={event.event_code || ''} />
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
            {allAttendanceRecords.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Attendance Pictures ({allAttendanceRecords.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                  {allAttendanceRecords.map((record) => (
                    <div key={record.id} className="relative">
                      {record.image_url && (
                        <img
                          src={record.image_url}
                          alt={`Attendance by ${record.user_profiles?.display_name || 'User'}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg">
                        {record.user_profiles?.display_name || 'User'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {!isOrganizer && user && (
        <>
          <Card className="p-4">
            {!registration ? (
              <Button onClick={handleRegister} className="w-full">
                Register for Event
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded border border-green-200 dark:border-green-800">
                  <div className="font-semibold">Registered</div>
                  <div className="text-sm">Status: {registration.verification_status}</div>
                </div>
                {registration.verification_status === 'registered' && canVerify && (
                  <Button onClick={() => setShowCamera(true)} className="w-full">
                    Verify Attendance
                  </Button>
                )}
                {registration.verification_status === 'verified' && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                    <div className="font-semibold">Attendance Verified!</div>
                    <div className="text-sm">You will receive your badge after the event ends.</div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {registration && eventIsActive && (
            <Card className="p-4 mt-4">
              <h3 className="font-bold mb-3">Daily Attendance</h3>
              
              {hasAttendanceToday ? (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded flex items-center gap-2 border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span>Attendance registered for today</span>
                </div>
              ) : (
                <>
                  {showAttendanceUpload ? (
                    <AttendanceUpload
                      eventId={event.id}
                      eventName={event.name}
                      onSuccess={() => {
                        setShowAttendanceUpload(false);
                        loadEvent();
                      }}
                    />
                  ) : (
                    <Button 
                      onClick={() => setShowAttendanceUpload(true)}
                      className="w-full"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Register Today's Attendance
                    </Button>
                  )}
                </>
              )}
              
              {/* Show attendance history */}
              {attendanceRecords.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-2">Your Attendance History</h4>
                  <div className="space-y-2">
                    {attendanceRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <span className="text-foreground">
                          {record.attendance_day 
                            ? new Date(record.attendance_day).toLocaleDateString()
                            : new Date(record.created_at).toLocaleDateString()}
                        </span>
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </>
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

