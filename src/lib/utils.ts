import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getLevelFromPoints(points: number): { level: number; title: string } {
  if (points < 50) return { level: 1, title: 'Initiate' };
  if (points < 200) return { level: 5, title: 'Skill Pioneer' };
  if (points < 500) return { level: 10, title: 'Excellence Rank' };
  return { level: Math.floor(points / 50), title: 'Master' };
}

