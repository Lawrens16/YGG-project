import type { Event } from '@/types';

/**
 * Calculate event status based on current time and event dates
 */
export function calculateEventStatus(event: Event): 'upcoming' | 'ongoing' | 'finished' | 'cancelled' {
  // If event is explicitly cancelled, return cancelled
  if (event.status === 'cancelled') {
    return 'cancelled';
  }

  const now = new Date();
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);

  // Event is finished if end_date has passed
  if (endDate < now) {
    return 'finished';
  }

  // Event is ongoing if start_date has passed but end_date hasn't
  if (startDate <= now && endDate >= now) {
    return 'ongoing';
  }

  // Event is upcoming if start_date is in the future
  return 'upcoming';
}

/**
 * Sort events by different criteria
 */
export type SortOption = 'closest' | 'furthest' | 'newest' | 'oldest' | 'name-asc' | 'name-desc';

export function sortEvents(events: Event[], sortBy: SortOption): Event[] {
  const sorted = [...events];

  switch (sortBy) {
    case 'closest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.start_date).getTime();
        const dateB = new Date(b.start_date).getTime();
        return dateA - dateB;
      });

    case 'furthest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.start_date).getTime();
        const dateB = new Date(b.start_date).getTime();
        return dateB - dateA;
      });

    case 'newest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });

    case 'oldest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateA - dateB;
      });

    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));

    default:
      return sorted;
  }
}

/**
 * Filter events by status
 */
export function filterEventsByStatus(
  events: Event[],
  statusFilter: 'all' | 'upcoming' | 'ongoing' | 'finished'
): Event[] {
  if (statusFilter === 'all') {
    return events;
  }

  return events.filter((event) => {
    const calculatedStatus = calculateEventStatus(event);
    return calculatedStatus === statusFilter;
  });
}

