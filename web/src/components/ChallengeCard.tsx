import React from 'react';
import { motion } from 'framer-motion';
import { TodayChallenge } from '../lib/api';

interface ChallengeCardProps {
  challenge: TodayChallenge;
  onComplete: (note?: string) => void;
  isCompleting: boolean;
}

export default function ChallengeCard({ challenge, onComplete, isCompleting }: ChallengeCardProps) {
  const isCompleted = challenge.completed_at !== null;

  const difficultyColors = [
    'bg-green-100 text-green-700',
    'bg-blue-100 text-blue-700',
    'bg-yellow-100 text-yellow-700',
    'bg-orange-100 text-orange-700',
    'bg-red-100 text-red-700',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-2xl mx-auto mt-8"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">{challenge.assigned_date}</span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              difficultyColors[challenge.challenge.difficulty - 1] || difficultyColors[0]
            } dark:opacity-80`}
          >
            Level {challenge.challenge.difficulty}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">{challenge.challenge.category}</span>
        </div>

        <h2 className="text-2xl font-serif text-gray-900 dark:text-gray-100 mb-6 leading-relaxed">
          {challenge.challenge.text}
        </h2>

        {isCompleted ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">Completed</span>
            </div>
            {challenge.note && (
              <div className="bg-calm dark:bg-gray-700/50 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium mb-1">Your note:</p>
                <p>{challenge.note}</p>
              </div>
            )}
          </div>
        ) : (
          <CompleteButton onComplete={onComplete} isCompleting={isCompleting} />
        )}
      </div>
    </motion.div>
  );
}

function CompleteButton({
  onComplete,
  isCompleting,
}: {
  onComplete: (note?: string) => void;
  isCompleting: boolean;
}) {
  const [showNote, setShowNote] = React.useState(false);
  const [note, setNote] = React.useState('');

  const handleComplete = () => {
    if (showNote) {
      onComplete(note.trim() || undefined);
    } else {
      setShowNote(true);
    }
  };

  return (
    <div className="space-y-4">
      {!showNote && (
        <div className="bg-calm dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            <span className="font-medium">Ready to complete?</span> Click the button below to add your thoughts (optional).
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>You'll be able to write a reflection note</span>
          </div>
        </div>
      )}
      {showNote && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden space-y-2"
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Your reflection (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="How did this feel? What did you notice?"
            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            rows={4}
            maxLength={2000}
            autoFocus
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 text-right">{note.length}/2000</p>
        </motion.div>
      )}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleComplete}
        disabled={isCompleting}
        className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCompleting ? 'Completing...' : showNote ? 'Complete Challenge' : 'Mark Complete'}
      </motion.button>
    </div>
  );
}

