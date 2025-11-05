import { Router, Response } from 'express';
import { Challenge } from '../models/index.js';
import { Op } from 'sequelize';

const router: Router = Router();

router.get('/', async (req, res: Response) => {
  try {
    const { active, category } = req.query;

    const whereClause: any = {};
    if (active === 'true') {
      whereClause.is_active = true;
    }
    if (category) {
      whereClause.category = category;
    }

    const challenges = await Challenge.findAll({
      where: whereClause,
      attributes: ['slug', 'category', 'difficulty', 'text'],
      order: [['difficulty', 'ASC']],
    });

    res.json(challenges);
  } catch (error: any) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;

