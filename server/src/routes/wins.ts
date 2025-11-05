import { Router, Response } from 'express';
import { WinsService } from '../services/WinsService.js';
import { authenticateAnon, AuthRequest } from '../middleware/auth.js';

const router: Router = Router();

router.get('/', async (req, res: Response) => {
  try {
    const wins = await WinsService.getRecentWins(50);
    res.json(wins);
  } catch (error: any) {
    console.error('Error fetching wins:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.post('/', authenticateAnon, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 280) {
      return res.status(400).json({ error: 'Text must be 280 characters or less' });
    }

    const win = await WinsService.createWin(req.userId!, text);

    // Broadcast to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('win:new', {
        id: win.id,
        text: win.text,
        likes: win.likes,
        created_at: win.createdAt.toISOString(),
      });
    }

    res.json({ id: win.id });
  } catch (error: any) {
    if (error.message.includes('Rate limit')) {
      return res.status(403).json({ error: error.message });
    }
    console.error('Error creating win:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.post('/:id/like', authenticateAnon, async (req: AuthRequest, res: Response) => {
  try {
    await WinsService.likeWin(req.params.id, req.userId!);

    // Broadcast like event
    const io = req.app.get('io');
    if (io) {
      io.emit('win:like', { id: req.params.id });
    }

    res.json({ ok: true });
  } catch (error: any) {
    if (error.message.includes('Rate limit')) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message === 'Win not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error liking win:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;

