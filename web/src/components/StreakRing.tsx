import { motion } from 'framer-motion';

interface StreakRingProps {
  currentStreak: number;
  longestStreak: number;
}

export default function StreakRing({ currentStreak, longestStreak }: StreakRingProps) {
  // Calculate progress toward next milestone (7, 14, 30, 60, 100)
  const milestones = [7, 14, 30, 60, 100];
  const nextMilestone = milestones.find(m => m > currentStreak) || milestones[milestones.length - 1];
  const progress = Math.min(100, (currentStreak / nextMilestone) * 100);
  
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  // Color based on streak length
  const getStreakColor = () => {
    if (currentStreak >= 30) return '#10b981'; // green
    if (currentStreak >= 14) return '#3b82f6'; // blue
    if (currentStreak >= 7) return '#8b5cf6'; // purple
    return '#5f6f65'; // default
  };

  const getStreakMessage = () => {
    if (currentStreak === 0) return "Start your streak";
    if (currentStreak === 1) return "Great start!";
    if (currentStreak < 7) return "Keep going!";
    if (currentStreak < 14) return "You're on fire!";
    if (currentStreak < 30) return "Incredible!";
    return "Amazing!";
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40 mb-4">
        <svg className="transform -rotate-90" width="160" height="160">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="#e5e7eb"
            className="dark:stroke-gray-700"
            strokeWidth="10"
            fill="none"
          />
          <motion.circle
            cx="80"
            cy="80"
            r="70"
            stroke={getStreakColor()}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={currentStreak}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-5xl font-bold"
            style={{ color: getStreakColor() }}
          >
            {currentStreak}
          </motion.span>
          <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {currentStreak === 1 ? 'day' : 'days'}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {getStreakMessage()}
        </p>
        {currentStreak > 0 && currentStreak < nextMilestone && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {nextMilestone - currentStreak} more to {nextMilestone} days
          </p>
        )}
        {longestStreak > currentStreak && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Best: {longestStreak} days
          </p>
        )}
      </div>
    </div>
  );
}

