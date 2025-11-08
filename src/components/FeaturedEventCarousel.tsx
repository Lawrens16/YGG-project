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
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${slidesToShow}, 1fr)`,
            }}
          >
            {currentEvents.map((event) => (
              <FeaturedEventCard key={event.id} event={event} />
            ))}
            {/* Fill empty slots if needed */}
            {Array.from({ length: slidesToShow - currentEvents.length }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {totalSlides > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full h-10 w-10"
            onClick={prevSlide}
            aria-label="Previous slide"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                prevSlide();
              }
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full h-10 w-10"
            onClick={nextSlide}
            aria-label="Next slide"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                nextSlide();
              }
            }}
          >
            <ChevronRight className="h-5 w-5" />
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

