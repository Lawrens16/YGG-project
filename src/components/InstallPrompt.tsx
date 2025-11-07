import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, X } from 'lucide-react';
import { Card } from './ui/card';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <Card className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 p-4 shadow-lg border-2 border-[#ff3800]">
      <button
        onClick={() => setShowPrompt(false)}
        className="absolute top-2 right-2"
      >
        <X className="h-4 w-4 text-gray-500" />
      </button>
      
      <div className="flex items-start gap-3">
        <img src="/spotme.svg" alt="SpotMe" className="w-12 h-12 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">Install SpotMe</h3>
          <p className="text-sm text-gray-600 mb-3">
            Get quick access and work offline
          </p>
          <Button onClick={handleInstall} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Install App
          </Button>
        </div>
      </div>
    </Card>
  );
}

