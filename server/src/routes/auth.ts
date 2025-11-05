import { Router, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { authenticateAnon, AuthRequest } from '../middleware/auth.js';
import { User } from '../models/index.js';

const router: Router = Router();

/**
 * Register a new account or link email/password to existing anonymous account
 */
router.post('/register', authenticateAnon, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUserId = req.userId || undefined;
    const { user, token } = await AuthService.register(email, password, existingUserId);

    res.json({
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

/**
 * Login with email and password
 */
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { user, token } = await AuthService.login(email, password);

    res.json({
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message || 'Invalid credentials' });
  }
});

/**
 * Get current user info (requires authentication)
 */
router.get('/me', authenticateAnon, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.userId!);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      hasPassword: !!user.password_hash,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message || 'Failed to get user info' });
  }
});

export default router;

