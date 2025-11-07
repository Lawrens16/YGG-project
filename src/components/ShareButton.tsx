import { useState, useRef, useEffect } from 'react';
import { Share2, Check, Copy, Link as LinkIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  type: 'achievement' | 'event';
}

export function ShareButton({ title, text, url, type }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const shareUrl = url || window.location.href;
  const shareData = {
    title,
    text,
    url: shareUrl,
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShowMenu(false);
      } catch (err) {
        // User cancelled or error
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      await handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowMenu(false);
    } catch (err) {
      console.error('Error copying:', err);
    }
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
    setShowMenu(false);
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setShowMenu(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>

      {showMenu && (
        <Card className="absolute right-0 top-full mt-2 w-48 z-50 p-2 shadow-lg">
          <div className="space-y-1">
            {navigator.share && (
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share...
              </button>
            )}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </button>
            <button
              onClick={handleShareFacebook}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
            >
              <span className="h-4 w-4">f</span>
              Facebook
            </button>
            <button
              onClick={handleShareTwitter}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
            >
              <span className="h-4 w-4">𝕏</span>
              Twitter
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

