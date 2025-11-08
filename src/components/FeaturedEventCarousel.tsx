import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Event } from '@/types';
import { FeaturedEventCard } from './FeaturedEventCard';
import { Button } from './ui/button';

interface FeaturedEventCarouselProps {
  events: Event[];
  autoScrollInterval?: number; // in milliseconds, default 4000
  className?: string;
}

export function FeaturedEventCarousel({
  events,
  autoScrollInterval = 4000,
  className = '',
}: FeaturedEventCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Calculate how many slides to show based on screen size
  const getSlidesToShow = () => {
    if (typeof window === 'undefined') return 1;
    const width = window.innerWidth;
    if (width >= 1024) return 3; // lg: 3 slides
    if (width >= 768) return 2; // md: 2 slides
    return 1; // mobile: 1 slide
  };

  const [slidesToShow, setSlidesToShow] = useState(getSlidesToShow());

  useEffect(() => {
    const handleResize = () => {
      setSlidesToShow(getSlidesToShow());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalSlides = Math.ceil(events.length / slidesToShow);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto-scroll logic
  useEffect(() => {
    if (events.length === 0 || totalSlides <= 1) return;

    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, autoScrollInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, autoScrollInterval, nextSlide, totalSlides, events.length]);

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // Swipe gesture handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsPaused(false);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }

    setIsPaused(false);
  };

  if (events.length === 0) {
    return null;
  }

  // Get events for current slide
  const getCurrentEvents = () => {
    const start = currentIndex * slidesToShow;
    return events.slice(start, start + slidesToShow);
  };

  const currentEvents = getCurrentEvents();

  return (
    <div
      className={`relative w-full ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      ref={containerRef}
      role="region"
      aria-label="Featured Events Carousel"
    >
      {/* Carousel Container */}
      <div className="relative overflow-hidden rounded-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid gap-4 items-stretch"
            style={{
              gridTemplateColumns: `repeat(${slidesToShow}, 1fr)`,
            }}
          >
            {currentEvents.map((event) => (
              <FeaturedEventCard key={event.id} event={event} className="h-full" />
            ))}
            {/* Fill empty slots if needed */}
            {Array.from({ length: slidesToShow - currentEvents.length }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
          </motion.div>
        </AnimatePresence>
        
        {/* Progress Bar */}
        {totalSlides > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10">
            <motion.div
              key={currentIndex}
              className="h-full bg-gradient-to-r from-[#ff3800] to-[#ff6b35]"
              initial={{ width: "0%" }}
              animate={{ width: isPaused ? "0%" : "100%" }}
              transition={{
                duration: autoScrollInterval / 1000,
                ease: "linear"
              }}
            />
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      {totalSlides > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 bg-background/40 hover:bg-background/70 backdrop-blur-sm border-0 shadow-md rounded-full h-9 w-9 opacity-60 hover:opacity-100 transition-opacity"
            onClick={prevSlide}
            aria-label="Previous slide"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                prevSlide();
              }
            }}
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 bg-background/40 hover:bg-background/70 backdrop-blur-sm border-0 shadow-md rounded-full h-9 w-9 opacity-60 hover:opacity-100 transition-opacity"
            onClick={nextSlide}
            aria-label="Next slide"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                nextSlide();
              }
            }}
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </Button>
        </>
      )}

      {/* Navigation Dots */}
      {totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-4" role="tablist" aria-label="Carousel navigation">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-[#ff3800]'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={index === currentIndex}
              role="tab"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  goToSlide(index);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Pause indicator (optional, for accessibility) */}
      {isPaused && (
        <div className="sr-only" aria-live="polite">
          Carousel paused
        </div>
      )}
    </div>
  );
}

