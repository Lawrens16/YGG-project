import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar } from './ui/avatar';
import { Share2, MoreHorizontal, MapPin, Calendar, Award, Trash2, Check, Link as LinkIcon, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Achievement, Event } from '@/types';
import { AchievementActions } from './AchievementActions';
import { deleteAchievement } from '@/lib/api';

interface FeedPostProps {
  achievement?: Achievement;
  event?: Event;
  onUpdate?: () => void;
}

export function FeedPost({ achievement, event, onUpdate }: FeedPostProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const postUser = achievement?.user_profiles || event?.user_profiles;
  const isOwner = achievement && user && achievement.user_id === user.id;

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

  const handleDelete = async () => {
    if (!achievement || !user || !isOwner) return;
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    setIsDeleting(true);
    setShowMenu(false);
    try {
      await deleteAchievement(achievement.id, user.id);
      if (onUpdate) onUpdate();
    } catch (error: any) {
      alert(error.message || 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = achievement 
      ? `${window.location.origin}/feed#post-${achievement.id}`
      : `${window.location.origin}/events/${event?.id}`;
    const shareText = achievement
      ? `Check out this post: ${achievement.title}`
      : `Join me at ${event?.name}`;
    const shareTitle = achievement?.title || event?.name || '';

    const shareData = {
      title: shareTitle,
      text: shareText,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShowMenu(false);
      } catch (err) {
        // User cancelled or error - fallback to copy
        await handleCopyLink(shareUrl);
      }
    } else {
      await handleCopyLink(shareUrl);
    }
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowMenu(false);
    } catch (err) {
      console.error('Error copying:', err);
      alert('Failed to copy link. Please try again.');
    }
  };

  const handleShareFacebook = () => {
    const shareUrl = achievement 
      ? `${window.location.origin}/feed#post-${achievement.id}`
      : `${window.location.origin}/events/${event?.id}`;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
    setShowMenu(false);
  };

  const handleShareTwitter = () => {
    const shareUrl = achievement 
      ? `${window.location.origin}/feed#post-${achievement.id}`
      : `${window.location.origin}/events/${event?.id}`;
    const shareText = achievement
      ? `Check out this post: ${achievement.title}`
      : `Join me at ${event?.name}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setShowMenu(false);
  };

  if (event) {
    // Ensure backward compatibility with events that might not have featured fields
    const isFeatured = event.is_featured ?? false;
    
    return (
      <Card className={`overflow-hidden ${
        isFeatured 
          ? 'border-2 border-transparent bg-gradient-to-br from-[#ff3800]/10 via-transparent to-transparent relative' 
          : ''
      }`}>
        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute top-2 right-2 z-10">
            <div className="flex items-center gap-1 bg-gradient-to-r from-[#ff3800] to-[#ff6b35] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              <Star className="h-3 w-3 fill-current" />
              <span>FEATURED EVENT</span>
            </div>
          </div>
        )}
        
        {/* Animated gradient border for featured events */}
        {isFeatured && (
          <div className="absolute inset-0 rounded-lg p-[2px] bg-gradient-to-br from-[#ff3800] via-[#ff6b35] to-[#ffa500] opacity-50 animate-pulse pointer-events-none" />
        )}
        
        {isFeatured ? (
          <div className="relative bg-background rounded-lg">
            {event.banner_url && (
              <div className="relative">
                <img
                  src={event.banner_url}
                  alt={event.name}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => navigate(`/events/${event.id}`)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#ff3800]/20 to-transparent" />
              </div>
            )}
            <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar src={postUser?.avatar_url || undefined} alt={postUser?.display_name || 'Organizer'} />
                <div>
                  <div className="font-semibold text-foreground">{postUser?.display_name || 'Organizer'}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            <div className="relative" ref={menuRef}>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
              
              {showMenu && (
                <Card className="absolute right-0 top-full mt-1 w-48 z-[100] p-2 shadow-lg">
                  <div className="space-y-1">
                    {typeof navigator.share !== 'undefined' && (
                      <button
                        onClick={handleShare}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded transition-colors text-left text-foreground"
                      >
                        <Share2 className="h-4 w-4" />
                        Share...
                      </button>
                    )}
                    <button
                      onClick={() => handleCopyLink(
                        `${window.location.origin}/events/${event.id}`
                      )}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded transition-colors text-left text-foreground"
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
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded transition-colors text-left text-foreground"
                    >
                      <span className="h-4 w-4 font-bold">f</span>
                      Facebook
                    </button>
                    <button
                      onClick={handleShareTwitter}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded transition-colors text-left text-foreground"
                    >
                      <span className="h-4 w-4">𝕏</span>
                      Twitter
                    </button>
                  </div>
                </Card>
              )}
            </div>
          </div>

          <h3 className={`font-bold text-lg mb-2 cursor-pointer ${isFeatured ? 'text-[#ff3800]' : 'text-foreground'}`} onClick={() => navigate(`/events/${event.id}`)}>
            {event.name}
          </h3>
          {event.description && (
            <p className="text-muted-foreground mb-3">{event.description}</p>
          )}

          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(event.start_date).toLocaleDateString()} at{' '}
                {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{event.venue_address}</span>
            </div>
          </div>

          <div className="flex gap-4 pt-3 border-t border-border">
            <Button
              variant={isFeatured ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate(`/events/${event.id}`)}
              className={`flex-1 ${isFeatured ? 'bg-gradient-to-r from-[#ff3800] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#ff3800] text-white' : ''}`}
            >
              View Event
            </Button>
          </div>
            </div>
          </div>
        ) : (
          <>
            {event.banner_url && (
              <img
                src={event.banner_url}
                alt={event.name}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => navigate(`/events/${event.id}`)}
              />
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar src={postUser?.avatar_url || undefined} alt={postUser?.display_name || 'Organizer'} />
                  <div>
                    <div className="font-semibold text-foreground">{postUser?.display_name || 'Organizer'}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="relative" ref={menuRef}>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                  
                  {showMenu && (
                    <Card className="absolute right-0 top-full mt-1 w-48 z-[100] p-2 shadow-lg">
                      <div className="space-y-1">
                        {typeof navigator.share !== 'undefined' && (
                          <button
                            onClick={handleShare}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded transition-colors text-left text-foreground"
                          >
                            <Share2 className="h-4 w-4" />
                            Share...
                          </button>
                        )}
                        <button
                          onClick={() => handleCopyLink(
                            `${window.location.origin}/events/${event.id}`
                          )}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded transition-colors text-left text-foreground"
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
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded transition-colors text-left text-foreground"
                        >
                          <span className="h-4 w-4 font-bold">f</span>
                          Facebook
                        </button>
                        <button
                          onClick={handleShareTwitter}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded transition-colors text-left text-foreground"
                        >
                          <span className="h-4 w-4">𝕏</span>
                          Twitter
                        </button>
                      </div>
                    </Card>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-lg mb-2 cursor-pointer text-foreground" onClick={() => navigate(`/events/${event.id}`)}>
                {event.name}
              </h3>
              {event.description && (
                <p className="text-muted-foreground mb-3">{event.description}</p>
              )}

              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(event.start_date).toLocaleDateString()} at{' '}
                    {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{event.venue_address}</span>
                </div>
              </div>

              <div className="flex gap-4 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="flex-1"
                >
                  View Event
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    );
  }

  if (!achievement) return null;

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar src={postUser?.avatar_url || undefined} alt={postUser?.display_name || 'User'} />
            <div>
              <div className="font-semibold text-foreground">{postUser?.display_name || 'User'}</div>
              <div className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(achievement.created_at), { addSuffix: true })}
                {achievement.events && (
                  <span className="ml-2">
                    · <Award className="h-3 w-3 inline mr-1" />
                    {achievement.events.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="relative" ref={menuRef}>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
            
            {showMenu && (
              <Card className="absolute right-0 top-full mt-1 w-48 z-[100] p-2 shadow-lg">
                <div className="space-y-1">
                  {typeof navigator.share !== 'undefined' && (
                    <button
                      onClick={handleShare}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded transition-colors text-left text-foreground"
                    >
                      <Share2 className="h-4 w-4" />
                      Share...
                    </button>
                  )}
                  <button
                    onClick={() => handleCopyLink(
                      `${window.location.origin}/feed#post-${achievement.id}`
                    )}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded transition-colors text-left text-foreground"
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
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded transition-colors text-left text-foreground"
                  >
                    <span className="h-4 w-4 font-bold">f</span>
                    Facebook
                  </button>
                  <button
                    onClick={handleShareTwitter}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded transition-colors text-left text-foreground"
                  >
                    <span className="h-4 w-4">𝕏</span>
                    Twitter
                  </button>
                  {isOwner && (
                    <>
                      <div className="border-t border-border my-1"></div>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 dark:hover:bg-destructive/20 rounded transition-colors text-left text-destructive disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {isDeleting ? 'Deleting...' : 'Delete Post'}
                      </button>
                    </>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="mb-3">
          <h3 className="font-semibold text-lg mb-2 text-foreground">{achievement.title}</h3>
          {achievement.description && (
            <p className="text-muted-foreground mb-3">{achievement.description}</p>
          )}
          {achievement.image_url && (
            <img
              src={achievement.image_url}
              alt={achievement.title}
              className="w-full rounded-lg mb-3"
            />
          )}
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary text-xs rounded-full">
              {achievement.category}
            </span>
            {achievement.status === 'verified' && (
              <span className="px-2 py-1 bg-green-500/10 dark:bg-green-600/20 text-green-600 dark:text-green-400 text-xs rounded-full">
                ✓ Verified
              </span>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          {achievement && <AchievementActions achievement={achievement} />}
        </div>
      </div>
    </Card>
  );
}

