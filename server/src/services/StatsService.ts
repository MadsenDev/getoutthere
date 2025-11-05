import { UserStats, UserChallenge } from '../models/index.js';
import { Op } from 'sequelize';

export class StatsService {
  static async getOrCreateStats(userId: string) {
    let stats = await UserStats.findByPk(userId);
    if (!stats) {
      stats = await UserStats.create({
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        comfort_score: 0,
      });
    }
    return stats;
  }

  static async updateStreak(userId: string) {
    const stats = await this.getOrCreateStats(userId);

    // Get the most recent completed challenge
    const lastCompleted = await UserChallenge.findOne({
      where: {
        user_id: userId,
        completed_at: { [Op.ne]: null },
      },
      order: [['completed_at', 'DESC']],
    });

    if (!lastCompleted || !lastCompleted.completed_at) {
      stats.current_streak = 1;
    } else {
      const lastCompletedDate = new Date(lastCompleted.completed_at);
      const now = new Date();
      const hoursSince = (now.getTime() - lastCompletedDate.getTime()) / (1000 * 60 * 60);

      if (hoursSince <= 24) {
        stats.current_streak += 1;
      } else {
        stats.current_streak = 1;
      }
    }

    if (stats.current_streak > stats.longest_streak) {
      stats.longest_streak = stats.current_streak;
    }

    await stats.save();
    return stats;
  }

  static async updateComfortScore(userId: string) {
    const stats = await this.getOrCreateStats(userId);

    const totalCompleted = await UserChallenge.count({
      where: {
        user_id: userId,
        completed_at: { [Op.ne]: null },
      },
    });

    // Comfort score based on cumulative completions, not percentage
    // Scales gradually: 0-10 completions = 0-20%, 10-30 = 20-50%, 30-60 = 50-80%, 60+ = 80-100%
    // This ensures gradual progression rather than jumping to 100% after one completion
    
    if (totalCompleted === 0) {
      stats.comfort_score = 0;
    } else if (totalCompleted <= 10) {
      // 0-10 completions: 0-20% (2 points per completion)
      stats.comfort_score = Math.min(20, totalCompleted * 2);
    } else if (totalCompleted <= 30) {
      // 10-30 completions: 20-50% (1.5 points per completion after 10)
      stats.comfort_score = Math.min(50, 20 + (totalCompleted - 10) * 1.5);
    } else if (totalCompleted <= 60) {
      // 30-60 completions: 50-80% (1 point per completion after 30)
      stats.comfort_score = Math.min(80, 50 + (totalCompleted - 30) * 1);
    } else {
      // 60+ completions: 80-100% (0.5 points per completion after 60)
      stats.comfort_score = Math.min(100, 80 + (totalCompleted - 60) * 0.5);
    }

    await stats.save();
    return stats;
  }

  static async updateAllStats(userId: string) {
    await this.updateComfortScore(userId);
    return await this.updateStreak(userId);
  }
}

