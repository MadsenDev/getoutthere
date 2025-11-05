import { Win, WinEvent } from '../models/index.js';
import { Op } from 'sequelize';
import { createHash } from 'crypto';
import { filterProfanity } from '../util/profanity.js';

export class WinsService {
  static hashUserId(userId: string): string {
    return createHash('sha256').update(userId).digest('hex');
  }

  static async checkRateLimit(userHash: string, type: 'WIN_POSTED' | 'LIKE'): Promise<boolean> {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    
    const count = await WinEvent.count({
      where: {
        user_hash: userHash,
        type,
        createdAt: { [Op.gte]: oneMinuteAgo },
      },
    });

    const limit = type === 'WIN_POSTED' ? 1 : 10;
    return count < limit;
  }

  static async createWin(userId: string | null, text: string): Promise<Win> {
    const userHash = userId ? this.hashUserId(userId) : 'anonymous';
    
    // Rate limiting
    const canPost = await this.checkRateLimit(userHash, 'WIN_POSTED');
    if (!canPost) {
      throw new Error('Rate limit exceeded. Please wait a minute.');
    }

    // Filter profanity
    const filteredText = filterProfanity(text);

    // Create win
    const win = await Win.create({
      user_id: userId,
      text: filteredText,
      likes: 0,
    });

    // Record event
    await WinEvent.create({
      user_hash: userHash,
      type: 'WIN_POSTED',
    });

    return win;
  }

  static async likeWin(winId: string, userId: string | null): Promise<void> {
    const win = await Win.findByPk(winId);
    if (!win) {
      throw new Error('Win not found');
    }

    const userHash = userId ? this.hashUserId(userId) : 'anonymous';
    
    // Rate limiting
    const canLike = await this.checkRateLimit(userHash, 'LIKE');
    if (!canLike) {
      throw new Error('Rate limit exceeded. Please wait a minute.');
    }

    win.likes += 1;
    await win.save();

    // Record event
    await WinEvent.create({
      user_hash: userHash,
      type: 'LIKE',
    });
  }

  static async getRecentWins(limit: number = 50): Promise<Win[]> {
    return await Win.findAll({
      order: [['createdAt', 'DESC']],
      limit,
    });
  }
}

