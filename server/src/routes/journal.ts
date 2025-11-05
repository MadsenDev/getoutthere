import { Router, Response } from 'express';
import { JournalEntry } from '../models/index.js';
import { authenticateAnon, AuthRequest } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router: Router = Router();

// Get all journal entries (manual entries only)
router.get('/', authenticateAnon, async (req: AuthRequest, res: Response) => {
  try {
    const entries = await JournalEntry.findAll({
      where: {
        user_id: req.userId!,
      },
      order: [['entry_date', 'DESC']],
      limit: 100, // Reasonable limit
    });

    res.json(entries.map((entry) => ({
      id: entry.id,
      entry_date: entry.entry_date,
      content: entry.content,
      created_at: entry.createdAt.toISOString(),
      updated_at: entry.updatedAt.toISOString(),
    })));
  } catch (error: any) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Create a new journal entry
router.post('/', authenticateAnon, async (req: AuthRequest, res: Response) => {
  try {
    const { entry_date, content } = req.body;

    if (!entry_date || !content) {
      return res.status(400).json({ error: 'entry_date and content are required' });
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'content must be a non-empty string' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: 'content must be 5000 characters or less' });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(entry_date)) {
      return res.status(400).json({ error: 'entry_date must be in YYYY-MM-DD format' });
    }

    const entry = await JournalEntry.create({
      user_id: req.userId!,
      entry_date,
      content: content.trim(),
    });

    res.status(201).json({
      id: entry.id,
      entry_date: entry.entry_date,
      content: entry.content,
      created_at: entry.createdAt.toISOString(),
      updated_at: entry.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Update a journal entry
router.patch('/:id', authenticateAnon, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (content !== undefined) {
      if (typeof content !== 'string') {
        return res.status(400).json({ error: 'content must be a string' });
      }

      if (content.trim().length === 0) {
        return res.status(400).json({ error: 'content cannot be empty' });
      }

      if (content.length > 5000) {
        return res.status(400).json({ error: 'content must be 5000 characters or less' });
      }
    }

    const entry = await JournalEntry.findOne({
      where: {
        id,
        user_id: req.userId!,
      },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    if (content !== undefined) {
      entry.content = content.trim();
      await entry.save();
    }

    res.json({
      id: entry.id,
      entry_date: entry.entry_date,
      content: entry.content,
      created_at: entry.createdAt.toISOString(),
      updated_at: entry.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating journal entry:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Delete a journal entry
router.delete('/:id', authenticateAnon, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const entry = await JournalEntry.findOne({
      where: {
        id,
        user_id: req.userId!,
      },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    await entry.destroy();

    res.json({ ok: true });
  } catch (error: any) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;

