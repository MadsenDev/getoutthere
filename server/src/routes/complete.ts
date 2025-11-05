import { Router, Response } from 'express';
import { ChallengeService } from '../services/ChallengeService.js';
import { StatsService } from '../services/StatsService.js';
import { authenticateAnon, AuthRequest } from '../middleware/auth.js';

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

export default router;

