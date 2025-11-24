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
        badges: [],
      });
    }
    return stats;
  }

  static async updateStreak(userId: string) {
    const stats = await this.getOrCreateStats(userId);

    // Get all completed challenges, ordered by assigned_date descending
    // Also get skipped challenges to account for them in streak calculation
    const completedChallenges = await UserChallenge.findAll({
      where: {
        user_id: userId,
        completed_at: { [Op.ne]: null },
      },
      order: [['assigned_date', 'DESC']],
      limit: 100, // Check up to 100 days back
    });

    const skippedChallenges = await UserChallenge.findAll({
      where: {
        user_id: userId,
        skipped_at: { [Op.ne]: null },
      },
      order: [['assigned_date', 'DESC']],
      limit: 100,
    });

    if (completedChallenges.length === 0) {
      stats.current_streak = 0;
    } else {
      // Calculate streak by counting consecutive days from most recent completion backwards
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Create Sets of completed and skipped dates for quick lookup
      const completedDates = new Set<string>();
      completedChallenges.forEach((challenge) => {
        const dateStr = new Date(challenge.assigned_date).toISOString().split('T')[0];
        completedDates.add(dateStr);
      });

      const skippedDates = new Set<string>();
      skippedChallenges.forEach((challenge) => {
        const dateStr = new Date(challenge.assigned_date).toISOString().split('T')[0];
        skippedDates.add(dateStr);
      });

      // Find the most recent completed date
      const mostRecentDate = new Date(completedChallenges[0].assigned_date);
      mostRecentDate.setHours(0, 0, 0, 0);
      const mostRecentStr = mostRecentDate.toISOString().split('T')[0];
      
      // Calculate days since most recent completion
      const daysSinceCompletion = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Streak is broken if most recent completion was more than 1 day ago
      // (allowing for today or yesterday to maintain streak)
      if (daysSinceCompletion > 1) {
        // Most recent completion was more than 1 day ago, streak is broken
        stats.current_streak = 0;
      } else {
        // Most recent completion was today or yesterday, count consecutive days backwards
        let streak = 0;
        let currentDate = new Date(today);
        
        // Start from today or yesterday (whichever is most recent completed date)
        // If today is completed, start from today. Otherwise start from yesterday.
        const todayStr = currentDate.toISOString().split('T')[0];
        if (!completedDates.has(todayStr)) {
          // Today not completed, start from yesterday
          currentDate.setDate(currentDate.getDate() - 1);
        }
        
        // Count backwards ensuring consecutive days with no gaps
        // Skipped days don't break the streak but also don't count towards it
        // We'll count up to 100 days back to find the streak
        let consecutiveDays = 0;
        const checkDate = new Date(currentDate);
        
        for (let i = 0; i < 100; i++) {
          const dateStr = checkDate.toISOString().split('T')[0];
          if (completedDates.has(dateStr)) {
            consecutiveDays++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else if (skippedDates.has(dateStr)) {
            // Skipped day - doesn't break streak, but doesn't count either
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            // Found a gap (neither completed nor skipped), streak ends here
            break;
          }
        }
        
        stats.current_streak = consecutiveDays;
      }
    }

    // Update longest streak if current is longer
    if (stats.current_streak > stats.longest_streak) {
      stats.longest_streak = stats.current_streak;
    }

    await stats.save();
    return stats;
  }

  static async updateComfortScore(userId: string) {
    const stats = await this.getOrCreateStats(userId);

    // Get all completed challenges with dates for recent-weighting
    const completedChallenges = await UserChallenge.findAll({
      where: {
        user_id: userId,
        completed_at: { [Op.ne]: null },
      },
      order: [['completed_at', 'DESC']],
      limit: 100, // Consider last 100 completions for recent-weighting
    });

    const totalCompleted = completedChallenges.length;

    if (totalCompleted === 0) {
      stats.comfort_score = 0;
    } else {
      // Base score from total completions (same as before)
      let baseScore: number;
      if (totalCompleted <= 10) {
        baseScore = Math.min(20, totalCompleted * 2);
      } else if (totalCompleted <= 30) {
        baseScore = Math.min(50, 20 + (totalCompleted - 10) * 1.5);
      } else if (totalCompleted <= 60) {
        baseScore = Math.min(80, 50 + (totalCompleted - 30) * 1);
      } else {
        baseScore = Math.min(100, 80 + (totalCompleted - 60) * 0.5);
      }

      // Apply recent-weighting: give more weight to recent completions
      const now = new Date();
      let recentWeight = 0;
      let recentCount = 0;
      
      // Last 7 days get full weight, 8-30 days get 0.7x, 31-90 days get 0.4x
      completedChallenges.forEach((challenge) => {
        const daysAgo = Math.floor((now.getTime() - new Date(challenge.completed_at!).getTime()) / (1000 * 60 * 60 * 24));
        let weight = 1.0;
        if (daysAgo > 7 && daysAgo <= 30) {
          weight = 0.7;
        } else if (daysAgo > 30 && daysAgo <= 90) {
          weight = 0.4;
        } else if (daysAgo > 90) {
          weight = 0.1; // Very old completions have minimal impact
        }
        recentWeight += weight;
        if (daysAgo <= 7) recentCount++;
      });

      // Adjust base score based on recent activity (0-20% adjustment)
      const recentActivityFactor = Math.min(1.2, 1.0 + (recentCount / totalCompleted) * 0.2);
      const weightedScore = baseScore * recentActivityFactor;

      // Apply inactivity decay: reduce score if user hasn't completed recently
      const lastCompletion = completedChallenges[0]?.completed_at;
      if (lastCompletion) {
        const daysSinceLastCompletion = Math.floor((now.getTime() - new Date(lastCompletion).getTime()) / (1000 * 60 * 60 * 24));
        let decayFactor = 1.0;
        
        // Decay starts after 7 days of inactivity
        if (daysSinceLastCompletion > 7) {
          // Reduce by 2% per day after 7 days, max 30% reduction
          const decayDays = daysSinceLastCompletion - 7;
          decayFactor = Math.max(0.7, 1.0 - (decayDays * 0.02));
        }
        
        stats.comfort_score = Math.min(100, Math.max(0, Math.round(weightedScore * decayFactor)));
      } else {
        stats.comfort_score = Math.min(100, Math.round(weightedScore));
      }
    }

    await stats.save();
    return stats;
  }

  static async checkAndAwardBadges(userId: string) {
    const stats = await this.getOrCreateStats(userId);
    const earnedBadges: string[] = [...(stats.badges || [])];
    let newBadges: string[] = [];

    // Get completion count
    const totalCompleted = await UserChallenge.count({
      where: {
        user_id: userId,
        completed_at: { [Op.ne]: null },
      },
    });

    // Check for badges
    const badgeChecks = [
      { id: 'first_completion', condition: totalCompleted >= 1, name: 'First Step' },
      { id: 'first_week', condition: totalCompleted >= 7, name: 'First Week' },
      { id: 'ten_completions', condition: totalCompleted >= 10, name: 'Ten Completions' },
      { id: 'thirty_completions', condition: totalCompleted >= 30, name: 'Thirty Completions' },
      { id: 'fifty_completions', condition: totalCompleted >= 50, name: 'Fifty Completions' },
      { id: 'hundred_completions', condition: totalCompleted >= 100, name: 'Century' },
      { id: 'seven_day_streak', condition: stats.current_streak >= 7, name: 'Week Warrior' },
      { id: 'thirty_day_streak', condition: stats.current_streak >= 30, name: 'Month Master' },
      { id: 'longest_streak_10', condition: stats.longest_streak >= 10, name: 'Streak Starter' },
      { id: 'longest_streak_30', condition: stats.longest_streak >= 30, name: 'Streak Champion' },
    ];

    badgeChecks.forEach(({ id, condition }) => {
      if (condition && !earnedBadges.includes(id)) {
        earnedBadges.push(id);
        newBadges.push(id);
      }
    });

    // Update badges if new ones were earned
    if (newBadges.length > 0) {
      stats.badges = earnedBadges;
      await stats.save();
    }

    return { newBadges, allBadges: earnedBadges };
  }

  static async updateAllStats(userId: string) {
    await this.updateComfortScore(userId);
    const stats = await this.updateStreak(userId);
    await this.checkAndAwardBadges(userId);
    return stats;
  }
}

