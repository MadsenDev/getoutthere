import { motion } from 'framer-motion';

interface ComfortBarProps {
  comfortScore: number;
}

export default function ComfortBar({ comfortScore }: ComfortBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Comfort Score</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">{comfortScore}%</span>
      </div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${comfortScore}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

