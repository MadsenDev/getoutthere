import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getProgress, ProgressData } from '../lib/api';
import StreakRing from '../components/StreakRing';
import ComfortBar from '../components/ComfortBar';
import { socket } from '../lib/socket';

export default function Progress() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    // Listen for progress updates
    const handleProgressUpdate = (update: { current_streak: number; comfort_score: number }) => {
      setData((prevData) => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          stats: {
            ...prevData.stats,
            ...update,
          },
        };
      });
    };

    socket.on('progress:update', handleProgressUpdate);

    return () => {
      socket.off('progress:update', handleProgressUpdate);
    };
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const progressData = await getProgress();
      setData(progressData);
    } catch (err: any) {
      setError(err.message || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadProgress}
            className="mt-4 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-serif text-gray-900 dark:text-gray-100 mb-2">Your Progress</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Progress happens quietly.</p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-700 transition-colors">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6 text-center">Current Streak</h2>
            <StreakRing
              currentStreak={data.stats.current_streak}
              longestStreak={data.stats.longest_streak}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Comfort Level</h2>
            <ComfortBar comfortScore={data.stats.comfort_score} />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Based on your completion rate
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Recent History</h2>
          {data.history.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No history yet. Complete your first challenge!</p>
          ) : (
            <div className="space-y-4">
              {data.history
                .filter((day) => day.completed)
                .map((day, idx) => (
                  <motion.div
                    key={`${day.date}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                          {day.challenge?.category || 'unknown'}
                        </span>
                        {day.challenge && (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            Level {day.challenge.difficulty}
                          </span>
                        )}
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    {day.challenge && (
                      <p className="text-gray-700 dark:text-gray-300 mb-3 font-serif">{day.challenge.text}</p>
                    )}
                    {day.note && (
                      <div className="bg-calm dark:bg-gray-700/50 rounded-lg p-3 mt-3">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Your reflection:</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{day.note}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              {data.history.filter((day) => day.completed).length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Complete challenges to see them here
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

