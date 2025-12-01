import { Router, Response } from 'express';
import { ChallengeService } from '../services/ChallengeService.js';
import { StatsService } from '../services/StatsService.js';
import { authenticateAnon, AuthRequest } from '../middleware/auth.js';
import { UserChallenge } from '../models/index.js';
import { Op } from 'sequelize';

const router: Router = Router();

router.post('/', authenticateAnon, async (req: AuthRequest, res: Response) => {
  try {
    const { note } = req.body;

    await ChallengeService.completeChallenge(req.userId!, note);
    const stats = await StatsService.updateAllStats(req.userId!);

    // Emit progress update via socket (will be handled in main server)
    const io = req.app.get('io');
    if (io) {
      io.to(req.userId!).emit('progress:update', {
        current_streak: stats.current_streak,
        comfort_score: stats.comfort_score,
      });
    }

    res.json({
      ok: true,
      current_streak: stats.current_streak,
      longest_streak: stats.longest_streak,
      comfort_score: stats.comfort_score,
    });
  } catch (error: any) {
    if (error.message === 'No active challenge assigned.') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Challenge already completed.') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error completing challenge:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.post('/skip', authenticateAnon, async (req: AuthRequest, res: Response) => {
  try {
    // Use local date, not UTC, to avoid timezone issues
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    console.log('Skip request:', { userId: req.userId, todayStr });

    // Find today's challenge
    const userChallenge = await UserChallenge.findOne({
      where: {
        user_id: req.userId!,
        assigned_date: todayStr,
      },
    });

    console.log('Found challenge:', { 
      exists: !!userChallenge, 
      id: userChallenge?.id,
      completed_at: userChallenge?.completed_at,
      skipped_at: userChallenge?.skipped_at,
      assigned_date: userChallenge?.assigned_date
    });

    if (!userChallenge) {
      console.log('No challenge found for today');
      return res.status(400).json({ error: 'No challenge assigned for today.' });
    }

    if (userChallenge.completed_at) {
      console.log('Challenge already completed');
      return res.status(400).json({ error: 'Challenge already completed.' });
    }

    if (userChallenge.skipped_at) {
      console.log('Challenge already skipped');
      return res.status(400).json({ error: 'Challenge already skipped.' });
    }

    // Mark as skipped
    const skipTime = new Date();
    userChallenge.skipped_at = skipTime;
    await userChallenge.save();
    
    // Verify the save worked
    const saved = await UserChallenge.findByPk(userChallenge.id);
    if (!saved || !saved.skipped_at) {
      console.error('Failed to save skipped_at:', { id: userChallenge.id, skipped_at: saved?.skipped_at });
      throw new Error('Failed to save skip status');
    }
    console.log('Challenge skipped successfully:', { id: userChallenge.id, skipped_at: saved.skipped_at });

    // Update streak (skipped days don't break streak)
    const stats = await StatsService.updateStreak(req.userId!);

    // Emit progress update
    const io = req.app.get('io');
    if (io) {
      io.to(req.userId!).emit('progress:update', {
        current_streak: stats.current_streak,
        comfort_score: stats.comfort_score,
      });
    }

    res.json({
      ok: true,
      current_streak: stats.current_streak,
      message: 'Day skipped. Your streak continues!',
    });
  } catch (error: any) {
    console.error('Error skipping challenge:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;

