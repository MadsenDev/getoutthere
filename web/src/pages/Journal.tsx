import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProgress, ProgressData, updateNote, createJournalEntry, updateJournalEntry, deleteJournalEntry } from '../lib/api';

export default function Journal() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [creatingEntry, setCreatingEntry] = useState(false);
  const [editingJournalEntry, setEditingJournalEntry] = useState<string | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const progressData = await getProgress();
      setData(progressData);
    } catch (err: any) {
      setError(err.message || 'Failed to load journal');
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = (date: string, currentNote: string | null) => {
    setEditingNote(date);
    setEditText(currentNote || '');
  };

  const handleSaveNote = async (date: string) => {
    if (editText.trim().length > 2000) {
      setError('Note must be 2000 characters or less');
      return;
    }

    try {
      setError(null);
      const result = await updateNote(date, editText.trim() || null);
      
      // Update local state
      if (data) {
        setData({
          ...data,
          history: data.history.map((day) =>
            day.date === date && day.type === 'challenge' ? { ...day, note: result.note } : day
          ),
        });
      }
      setEditingNote(null);
      setEditText('');
    } catch (err: any) {
      setError(err.message || 'Failed to save note');
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditText('');
  };

  const handleCreateEntry = async () => {
    if (!newEntryContent.trim()) {
      setError('Entry content is required');
      return;
    }

    if (newEntryContent.trim().length > 5000) {
      setError('Entry must be 5000 characters or less');
      return;
    }

    try {
      setCreatingEntry(true);
      setError(null);
      // Always use today's date
      const today = new Date().toISOString().split('T')[0];
      await createJournalEntry(today, newEntryContent.trim());
      
      // Reload to get updated timeline
      await loadProgress();
      
      setShowNewEntry(false);
      setNewEntryContent('');
    } catch (err: any) {
      setError(err.message || 'Failed to create entry');
    } finally {
      setCreatingEntry(false);
    }
  };

  const handleEditJournalEntry = (entryId: string, currentContent: string) => {
    setEditingJournalEntry(entryId);
    setEditText(currentContent);
  };

  const handleSaveJournalEntry = async (entryId: string) => {
    if (editText.trim().length > 5000) {
      setError('Entry must be 5000 characters or less');
      return;
    }

    try {
      setError(null);
      await updateJournalEntry(entryId, editText.trim());
      
      // Reload to get updated data
      await loadProgress();
      
      setEditingJournalEntry(null);
      setEditText('');
    } catch (err: any) {
      setError(err.message || 'Failed to update entry');
    }
  };

  const handleDeleteJournalEntry = (entryId: string) => {
    setDeletingEntryId(entryId);
  };

  const confirmDelete = async () => {
    if (!deletingEntryId) return;

    try {
      setError(null);
      await deleteJournalEntry(deletingEntryId);
      
      // Reload to get updated data
      await loadProgress();
      setDeletingEntryId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete entry');
      setDeletingEntryId(null);
    }
  };

  const cancelDelete = () => {
    setDeletingEntryId(null);
  };

  const canEditNote = (completedAt: string | null) => {
    if (!completedAt) return false;
    const completedDate = new Date(completedAt);
    const now = new Date();
    const hoursSinceCompletion = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceCompletion < 24;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={loadProgress}
            className="mt-4 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
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

  const allEntries = data.history.filter((day) => day.completed);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-gray-900 dark:text-gray-100 mb-2">Your Journal</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Your reflections and progress, one day at a time.</p>
          </div>
          <button
            onClick={() => setShowNewEntry(!showNewEntry)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            {showNewEntry ? 'Cancel' : '+ New Entry'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <AnimatePresence>
          {showNewEntry && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700 mb-6 transition-colors overflow-hidden"
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">New Journal Entry</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your thoughts
                  </label>
                  <textarea
                    value={newEntryContent}
                    onChange={(e) => setNewEntryContent(e.target.value)}
                    placeholder="What's on your mind today?"
                    className="w-full p-3 text-sm sm:text-base border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    rows={6}
                    maxLength={5000}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">{newEntryContent.length}/5000</p>
                </div>
                <button
                  onClick={handleCreateEntry}
                  disabled={creatingEntry || !newEntryContent.trim()}
                  className="w-full sm:w-auto bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingEntry ? 'Creating...' : 'Create Entry'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deletingEntryId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4"
              onClick={cancelDelete}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Delete Journal Entry?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  This will permanently delete this journal entry. This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {allEntries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 sm:p-12 border border-gray-100 dark:border-gray-700 text-center transition-colors">
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm sm:text-base">No journal entries yet.</p>
            <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
              Complete a challenge or create a new entry to start your journal.
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {allEntries.map((day, idx) => {
              const isEditing = editingNote === day.date && day.type === 'challenge';
              const isEditingJournal = editingJournalEntry === day.journal_entry?.id;
              const canEdit = canEditNote(day.completed_at);

              // Manual journal entry
              if (day.type === 'journal' && day.journal_entry) {
                return (
                  <motion.div
                    key={`journal-${day.journal_entry.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-primary dark:border-accent transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Journal Entry</span>
                      </div>
                      <button
                        onClick={() => handleDeleteJournalEntry(day.journal_entry!.id)}
                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                        aria-label="Delete entry"
                      >
                        Delete
                      </button>
                    </div>

                    {isEditingJournal ? (
                      <div className="space-y-3">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          placeholder="What's on your mind?"
                          className="w-full p-3 text-sm sm:text-base border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          rows={6}
                          maxLength={5000}
                          autoFocus
                        />
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{editText.length}/5000</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingJournalEntry(null);
                                setEditText('');
                              }}
                              className="flex-1 sm:flex-none text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveJournalEntry(day.journal_entry!.id)}
                              className="flex-1 sm:flex-none text-sm bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {day.journal_entry.content}
                        </p>
                        <button
                          onClick={() => handleEditJournalEntry(day.journal_entry!.id, day.journal_entry!.content)}
                          className="mt-3 text-xs text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-accent transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              }

              // Challenge entry
              return (
                <motion.div
                  key={`challenge-${day.date}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                          {day.challenge?.category || 'unknown'}
                        </span>
                        {day.challenge && (
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            Level {day.challenge.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {day.challenge && (
                    <div className="mb-4">
                      <p className="text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300 font-serif leading-relaxed">
                        {day.challenge.text}
                      </p>
                    </div>
                  )}

                  {isEditing ? (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Your reflection
                      </label>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder="How did this feel? What did you notice?"
                        className="w-full p-3 text-sm sm:text-base border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        rows={4}
                        maxLength={2000}
                        autoFocus
                      />
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{editText.length}/2000</p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 sm:flex-none text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNote(day.date)}
                            className="flex-1 sm:flex-none text-sm bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {day.note ? (
                        <div className="bg-calm dark:bg-gray-700/50 rounded-lg p-3 sm:p-4">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Your reflection:</p>
                            {canEdit && (
                              <button
                                onClick={() => handleEditNote(day.date, day.note)}
                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-accent transition-colors whitespace-nowrap ml-2"
                                aria-label="Edit reflection"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{day.note}</p>
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 sm:p-4 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No reflection added yet.</p>
                          {canEdit && (
                            <button
                              onClick={() => handleEditNote(day.date, null)}
                              className="text-sm text-primary dark:text-accent hover:underline"
                            >
                              Add a reflection
                            </button>
                          )}
                          {!canEdit && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Editing is only available within 24 hours of completion.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
