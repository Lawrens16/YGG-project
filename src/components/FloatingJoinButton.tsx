import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { QRScanner } from './QRScanner';
import { Input } from './ui/input';
import { getEventByCode, registerForEvent } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function FloatingJoinButton() {
  const [showModal, setShowModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [eventCode, setEventCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleQRScan = async (result: string) => {
    setShowQRScanner(false);
    // Extract event ID or code from QR result
    // Assuming QR contains event code or URL with event code
    const code = result.split('/').pop() || result;
    await joinEvent(code);
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventCode.trim()) return;
    await joinEvent(eventCode.trim().toUpperCase());
  };

  const joinEvent = async (code: string) => {
    if (!user) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const event = await getEventByCode(code);
      if (!event) {
        alert('Event not found. Please check the code.');
        setLoading(false);
        return;
      }

      // Register for event
      await registerForEvent(event.id, user.id);
      setShowModal(false);
      setEventCode('');
      navigate(`/events/${event.id}`);
    } catch (error) {
      console.error('Error joining event:', error);
      alert('Error joining event: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg z-40 sm:bottom-6"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Join Event</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => setShowQRScanner(true)}
                className="w-full"
                variant="outline"
              >
                Scan QR Code
              </Button>

              <div className="text-center text-sm text-gray-500">or</div>

              <form onSubmit={handleCodeSubmit} className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter 6-character event code"
                  value={eventCode}
                  onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-lg font-mono"
                />
                <Button type="submit" className="w-full" disabled={loading || !eventCode.trim()}>
                  {loading ? 'Joining...' : 'Join Event'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </>
  );
}

