import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChallengeCard from '../components/ChallengeCard';
import WelcomeCard from '../components/WelcomeCard';
import { getToday, completeChallenge, TodayChallenge } from '../lib/api';
import { socket } from '../lib/socket';
import { useLoading } from '../contexts/LoadingContext';

export default function Today() {
  const [challenge, setChallenge] = useState<TodayChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const { setInitialLoadComplete } = useLoading();

  useEffect(() => {
    loadChallenge();

    // Listen for progress updates
    socket.on('progress:update', (data) => {
      console.log('Progress updated:', data);
    });

    return () => {
      socket.off('progress:update');
    };
  }, []);

  const loadChallenge = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure anonymous ID is available before making API call
      // This is a safeguard in case of race conditions
      if (!localStorage.getItem('anonId') && !localStorage.getItem('authToken')) {
        // Wait a bit for ID to be initialized, then retry
        if (retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 200));
          return loadChallenge(retryCount + 1);
        }
        throw new Error('Unable to initialize. Please refresh the page.');
      }
      
      const data = await getToday();
      setChallenge(data);
      // Signal that initial load is complete
      setInitialLoadComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to load challenge');
      // Even on error, signal load complete so we don't stay in loading forever
      setInitialLoadComplete();
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (note?: string) => {
    try {
      setIsCompleting(true);
      await completeChallenge(note);
      
      // Update local challenge state
      if (challenge) {
        setChallenge({
          ...challenge,
          completed_at: new Date().toISOString(),
          note: note || null,
        });
      }

      // Show celebration overlay
      setShowCelebration(true);
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to complete challenge');
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => loadChallenge()}
            className="mt-4 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-serif text-gray-900 dark:text-gray-100 mb-2">Today's Challenge</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Small step. Nicely done.</p>
        
        {/* Welcome Card for first-time users */}
        <WelcomeCard />
        
        <ChallengeCard
          challenge={challenge}
          onComplete={handleComplete}
          isCompleting={isCompleting}
        />
      </motion.div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm"
          onClick={() => setShowCelebration(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 sm:p-12 max-w-md mx-4 text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-primary to-green-400"></div>
            
            {/* Animated checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="mb-6 flex justify-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </div>
            </motion.div>

            {/* Celebration text */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl sm:text-3xl font-serif text-gray-900 dark:text-gray-100 mb-3"
            >
              Well done!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-gray-600 dark:text-gray-400 mb-6 text-base sm:text-lg"
            >
              You've completed today's challenge. Keep it up!
            </motion.p>

            {/* Confetti-like decorative elements */}
            <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full opacity-75"></div>
            <div className="absolute top-8 right-8 w-2 h-2 bg-blue-400 rounded-full opacity-75"></div>
            <div className="absolute bottom-6 left-6 w-2 h-2 bg-pink-400 rounded-full opacity-75"></div>
            <div className="absolute bottom-8 right-6 w-2 h-2 bg-purple-400 rounded-full opacity-75"></div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

