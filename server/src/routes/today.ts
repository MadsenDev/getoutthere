import { Router, Response } from 'express';
import { ChallengeService } from '../services/ChallengeService.js';
import { authenticateAnon, AuthRequest } from '../middleware/auth.js';

const router: Router = Router();

router.get('/', authenticateAnon, async (req: AuthRequest, res: Response) => {
  try {
    const userChallenge = await ChallengeService.getTodayChallenge(req.userId!);

    if (!userChallenge) {
      return res.status(500).json({ error: 'Failed to assign challenge' });
    }

    const challenge = (userChallenge as any).challenge;
    if (!challenge) {
      return res.status(500).json({ error: 'Failed to load challenge details' });
    }

    res.json({
      assigned_date: userChallenge.assigned_date,
      challenge: {
        id: challenge.id,
        slug: challenge.slug,
        category: challenge.category,
        difficulty: challenge.difficulty,
        text: challenge.text,
      },
      completed_at: userChallenge.completed_at,
      note: userChallenge.note,
    });
  } catch (error: any) {
    console.error('Error fetching today challenge:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;

