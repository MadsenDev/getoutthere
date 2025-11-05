import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWins, createWin, likeWin, Win } from '../lib/api';
import { socket } from '../lib/socket';

const RATE_LIMIT_STORAGE_KEY = 'win_rate_limit_expires';

export default function Wins() {
  const [wins, setWins] = useState<Win[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [winText, setWinText] = useState('');
  const [rateLimitedWin, setRateLimitedWin] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  // Restore rate limit state from localStorage on mount
  useEffect(() => {
    const storedExpiry = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    const storedWinId = localStorage.getItem(`${RATE_LIMIT_STORAGE_KEY}_win_id`);
    
    if (storedExpiry && storedWinId) {
      const expiryTime = parseInt(storedExpiry, 10);
      const now = Date.now();
      const remaining = Math.ceil((expiryTime - now) / 1000);
      
      if (remaining > 0) {
        setRateLimitedWin(storedWinId);
        setCountdown(remaining);
      } else {
        // Expired, clear storage
        localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
        localStorage.removeItem(`${RATE_LIMIT_STORAGE_KEY}_win_id`);
      }
    }
  }, []);

  useEffect(() => {
    loadWins();

    // Listen for new wins
    socket.on('win:new', (newWin) => {
      setWins((prev) => [newWin, ...prev].slice(0, 50));
    });

    // Listen for likes
    socket.on('win:like', ({ id }) => {
      setWins((prev) =>
        prev.map((w) => (w.id === id ? { ...w, likes: w.likes + 1 } : w))
      );
    });

    return () => {
      socket.off('win:new');
      socket.off('win:like');
    };
  }, []);

  // Countdown timer for rate limit
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && rateLimitedWin) {
      setRateLimitedWin(null);
      localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
      localStorage.removeItem(`${RATE_LIMIT_STORAGE_KEY}_win_id`);
    }
  }, [countdown, rateLimitedWin]);

  const loadWins = async () => {
    try {
      setLoading(true);
      setError(null);
      const winsData = await getWins();
      setWins(winsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load wins');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!winText.trim() || winText.length > 280) return;

    try {
      await createWin(winText);
      setWinText('');
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create win');
    }
  };

  const handleLike = async (winId: string) => {
    try {
      await likeWin(winId);
      // Socket will update the UI automatically via win:like event
      setRateLimitedWin(null);
      setCountdown(0);
      localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
      localStorage.removeItem(`${RATE_LIMIT_STORAGE_KEY}_win_id`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to like win';
      
      // Check if it's a rate limit error (case insensitive)
      if (
        errorMessage.toLowerCase().includes('rate limit') ||
        errorMessage.toLowerCase().includes('exceeded')
      ) {
        // Check if we already have an active rate limit
        const storedExpiry = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
        const storedWinId = localStorage.getItem(`${RATE_LIMIT_STORAGE_KEY}_win_id`);
        
        let expiryTime: number;
        let remainingSeconds: number;
        
        if (storedExpiry && storedWinId) {
          const storedExpiryTime = parseInt(storedExpiry, 10);
          const now = Date.now();
          const remaining = Math.ceil((storedExpiryTime - now) / 1000);
          
          if (remaining > 0) {
            // Use existing countdown
            expiryTime = storedExpiryTime;
            remainingSeconds = remaining;
          } else {
            // Expired, create new one
            expiryTime = Date.now() + 60 * 1000;
            remainingSeconds = 60;
            localStorage.setItem(RATE_LIMIT_STORAGE_KEY, expiryTime.toString());
            localStorage.setItem(`${RATE_LIMIT_STORAGE_KEY}_win_id`, winId);
          }
        } else {
          // No existing rate limit, create new one
          expiryTime = Date.now() + 60 * 1000;
          remainingSeconds = 60;
          localStorage.setItem(RATE_LIMIT_STORAGE_KEY, expiryTime.toString());
          localStorage.setItem(`${RATE_LIMIT_STORAGE_KEY}_win_id`, winId);
        }
        
        setRateLimitedWin(winId);
        setCountdown(remainingSeconds);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">Wins</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Celebrate small victories together.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            {showForm ? 'Cancel' : 'Share a Win'}
          </button>
        </div>

        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700 mb-6 transition-colors"
          >
            <textarea
              value={winText}
              onChange={(e) => setWinText(e.target.value)}
              placeholder="Share a small win..."
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={3}
              maxLength={280}
            />
            <div className="flex items-center justify-between mt-4 gap-3">
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{winText.length}/280</span>
              <button
                type="submit"
                disabled={!winText.trim()}
                className="bg-primary text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
              >
                Share
              </button>
            </div>
          </motion.form>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {wins.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 border border-gray-100 dark:border-gray-700 text-center transition-colors">
              <p className="text-gray-500 dark:text-gray-400">No wins yet. Be the first to share!</p>
            </div>
          ) : (
            wins.map((win) => (
              <motion.div
                key={win.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors"
              >
                <p className="text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">{win.text}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {(() => {
                      try {
                        const date = new Date(win.created_at);
                        if (isNaN(date.getTime())) {
                          return 'Recently';
                        }
                        return date.toLocaleDateString();
                      } catch {
                        return 'Recently';
                      }
                    })()}
                  </span>
                  <button
                    onClick={() => handleLike(win.id)}
                    className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-accent transition-colors p-1 -mr-1"
                    aria-label="Like this win"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span className="text-sm">{win.likes}</span>
                  </button>
                </div>
                
                {/* Friendly overlay when rate limited */}
                <AnimatePresence>
                  {rateLimitedWin === win.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 rounded-xl flex items-center justify-center backdrop-blur-sm px-4 sm:px-6 py-4"
                      style={{ zIndex: 10 }}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 w-full max-w-full">
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200 }}
                          className="flex-shrink-0"
                        >
                          <svg className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">
                            You're awesome for all the likes!
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                            You can like again in <span className="font-semibold text-primary dark:text-accent">{countdown}s</span>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

