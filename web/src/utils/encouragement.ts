import encouragements from '../data/encouragements.json';

/**
 * Get a daily encouragement message that rotates based on the day of the year
 * This ensures the same message appears all day, but changes each day
 */
export function getDailyEncouragement(): string {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  
  return encouragements[dayOfYear % encouragements.length];
}

