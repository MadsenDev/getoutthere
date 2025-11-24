import { motion } from 'framer-motion';

interface BadgesProps {
  badges: string[];
  newBadges?: string[];
}

const badgeInfo: Record<string, { name: string; emoji: string; description: string }> = {
  first_completion: { name: 'First Step', emoji: '🎯', description: 'Completed your first challenge' },
  first_week: { name: 'First Week', emoji: '📅', description: 'Completed 7 challenges' },
  ten_completions: { name: 'Ten Completions', emoji: '🔟', description: 'Completed 10 challenges' },
  thirty_completions: { name: 'Thirty Completions', emoji: '🌟', description: 'Completed 30 challenges' },
  fifty_completions: { name: 'Fifty Completions', emoji: '💎', description: 'Completed 50 challenges' },
  hundred_completions: { name: 'Century', emoji: '🏆', description: 'Completed 100 challenges' },
  seven_day_streak: { name: 'Week Warrior', emoji: '⚡', description: '7-day streak' },
  thirty_day_streak: { name: 'Month Master', emoji: '🔥', description: '30-day streak' },
  longest_streak_10: { name: 'Streak Starter', emoji: '✨', description: 'Longest streak of 10 days' },
  longest_streak_30: { name: 'Streak Champion', emoji: '👑', description: 'Longest streak of 30 days' },
};

export default function Badges({ badges, newBadges = [] }: BadgesProps) {
  if (badges.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Complete challenges to earn badges!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {badges.map((badgeId) => {
        const info = badgeInfo[badgeId] || { name: badgeId, emoji: '🏅', description: '' };
        const isNew = newBadges.includes(badgeId);

        return (
          <motion.div
            key={badgeId}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: isNew ? 0.2 : 0 }}
            className={`relative bg-white dark:bg-gray-700 rounded-lg p-4 border-2 transition-all ${
              isNew
                ? 'border-primary dark:border-accent shadow-lg ring-2 ring-primary/20 dark:ring-accent/20'
                : 'border-gray-200 dark:border-gray-600'
            }`}
          >
            {isNew && (
              <span className="absolute -top-2 -right-2 bg-primary dark:bg-accent text-white text-xs px-2 py-0.5 rounded-full font-medium">
                New!
              </span>
            )}
            <div className="text-center">
              <div className="text-3xl mb-2">{info.emoji}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                {info.name}
              </div>
              {info.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {info.description}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

