import { Router, Response } from 'express';
import { UserStats, UserChallenge, Challenge, JournalEntry } from '../models/index.js';
import { authenticateAnon, AuthRequest } from '../middleware/auth.js';
import { StatsService } from '../services/StatsService.js';
import { Op } from 'sequelize';

const router: Router = Router();

router.get('/', authenticateAnon, async (req: AuthRequest, res: Response) => {
  try {
    // Recalculate streak to ensure it's current (handles cases where user hasn't completed in days)
    const stats = await StatsService.updateStreak(req.userId!);
    // Check and award badges
    const badgeResult = await StatsService.checkAndAwardBadges(req.userId!);
    const statsData = stats || {
      current_streak: 0,
      longest_streak: 0,
      comfort_score: 0,
      badges: [],
    };

    // Get last 365 days of history for heatmap and insights
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const challenges = await UserChallenge.findAll({
      where: {
        user_id: req.userId!,
        assigned_date: { [Op.gte]: oneYearAgo.toISOString().split('T')[0] },
      },
      include: [{ model: Challenge, as: 'challenge' }],
      order: [['assigned_date', 'DESC']],
    });

    // Get journal entries for the same period
    const journalEntries = await JournalEntry.findAll({
      where: {
        user_id: req.userId!,
        entry_date: { [Op.gte]: oneYearAgo.toISOString().split('T')[0] },
      },
      order: [['entry_date', 'DESC']],
    });

    const history = challenges.map((uc: any) => ({
      date: uc.assigned_date,
      type: 'challenge',
      completed: uc.completed_at !== null,
      completed_at: uc.completed_at ? new Date(uc.completed_at).toISOString() : null,
      challenge: uc.challenge ? {
        text: uc.challenge.text,
        category: uc.challenge.category,
        difficulty: uc.challenge.difficulty,
      } : null,
      note: uc.note || null,
    }));

    // Add journal entries to history
    const journalHistory = journalEntries.map((entry) => ({
      date: entry.entry_date,
      type: 'journal',
      completed: true, // Journal entries are always "completed"
      completed_at: entry.createdAt.toISOString(),
      challenge: null,
      note: null,
      journal_entry: {
        id: entry.id,
        content: entry.content,
        created_at: entry.createdAt.toISOString(),
        updated_at: entry.updatedAt.toISOString(),
      },
    }));

    // Combine and sort by date (most recent first)
    const allHistory = [...history, ...journalHistory].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    res.json({
      stats: {
        current_streak: statsData.current_streak,
        longest_streak: statsData.longest_streak,
        comfort_score: statsData.comfort_score,
        badges: badgeResult.allBadges,
        new_badges: badgeResult.newBadges,
      },
      history: allHistory,
    });
  } catch (error: any) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Update note for a specific date's challenge
router.patch('/:date/note', authenticateAnon, async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.params;
    const { note } = req.body;

    if (typeof note !== 'string' && note !== null) {
      return res.status(400).json({ error: 'Note must be a string or null' });
    }

    // Find the user challenge for this date
    const userChallenge = await UserChallenge.findOne({
      where: {
        user_id: req.userId!,
        assigned_date: date,
      },
    });

    if (!userChallenge) {
      return res.status(404).json({ error: 'Challenge not found for this date' });
    }

    // Check if challenge was completed
    if (!userChallenge.completed_at) {
      return res.status(400).json({ error: 'Challenge must be completed before adding a note' });
    }

    // Check if within 24 hours of completion
    const completedAt = new Date(userChallenge.completed_at);
    const now = new Date();
    const hoursSinceCompletion = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCompletion > 24) {
      return res.status(400).json({ error: 'Note can only be edited within 24 hours of completion' });
    }

    // Update the note
    userChallenge.note = note || null;
    await userChallenge.save();

    res.json({ ok: true, note: userChallenge.note });
  } catch (error: any) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;

