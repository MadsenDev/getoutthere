import { Challenge, UserChallenge, UserStats } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Format a date as YYYY-MM-DD using local time (not UTC)
 * This avoids timezone issues where midnight local time might be the previous day in UTC
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class ChallengeService {
  static getDifficultyRange(comfortScore: number): [number, number] {
    // Difficulty bands based on comfort score
    // 0-20: Level 1-2 (beginner)
    // 21-50: Level 2-3 (intermediate)
    // 51-80: Level 3-4 (advanced)
    // 81-100: Level 4-5 (expert)
    if (comfortScore <= 20) return [1, 2];
    if (comfortScore <= 50) return [2, 3];
    if (comfortScore <= 80) return [3, 4];
    return [4, 5];
  }

  static async getTodayChallenge(userId: string, date: Date = new Date()): Promise<UserChallenge | null> {
    const dateStr = formatLocalDate(date);
    
    let userChallenge = await UserChallenge.findOne({
      where: {
        user_id: userId,
        assigned_date: dateStr,
      },
      include: [{ model: Challenge, as: 'challenge' }],
    });

    if (!userChallenge) {
      // Assign a new challenge
      const stats = await UserStats.findByPk(userId) || 
        await UserStats.create({
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          comfort_score: 0,
          badges: [],
        });

      // Check for missed days - if user missed 3+ days, reduce difficulty
      const today = new Date(date);
      today.setHours(0, 0, 0, 0);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const recentCompletions = await UserChallenge.count({
        where: {
          user_id: userId,
          completed_at: { [Op.ne]: null },
          assigned_date: { [Op.gte]: formatLocalDate(threeDaysAgo) },
        },
      });

      // Adjust comfort score for catch-up: reduce difficulty if missed days
      let adjustedComfortScore = stats.comfort_score;
      if (recentCompletions === 0) {
        // No completions in last 3 days - reduce difficulty by 20 points
        adjustedComfortScore = Math.max(0, stats.comfort_score - 20);
      } else if (recentCompletions === 1) {
        // Only 1 completion in last 3 days - reduce difficulty by 10 points
        adjustedComfortScore = Math.max(0, stats.comfort_score - 10);
      }

      const [minDiff, maxDiff] = this.getDifficultyRange(adjustedComfortScore);
      
      // For brand new users (comfort_score = 0), prioritize level 1 challenges
      const preferredDifficulty = adjustedComfortScore === 0 ? 1 : null;

      // Get recent categories to avoid repetition (last 3 days, not just yesterday)
      const recentCategories = new Set<string>();
      for (let i = 1; i <= 3; i++) {
        const pastDate = new Date(date);
        pastDate.setDate(pastDate.getDate() - i);
        const pastDateStr = formatLocalDate(pastDate);
        const pastChallenge = await UserChallenge.findOne({
          where: {
            user_id: userId,
            assigned_date: pastDateStr,
          },
          include: [{ model: Challenge, as: 'challenge' }],
        });
        if ((pastChallenge as any)?.challenge?.category) {
          recentCategories.add((pastChallenge as any).challenge.category);
        }
      }

      const excludeCategories = Array.from(recentCategories);

      // Find eligible challenges - prefer level 1 for new users, avoid recent categories
      let eligibleChallenges: Challenge[] = [];
      
      if (preferredDifficulty) {
        // Try to get challenges at preferred difficulty first
        const preferredWhere: any = {
          is_active: true,
          difficulty: preferredDifficulty,
        };
        if (excludeCategories.length > 0) {
          preferredWhere.category = { [Op.notIn]: excludeCategories };
        }
        eligibleChallenges = await Challenge.findAll({
          where: preferredWhere,
        });
      }
      
      // If no preferred challenges found, fall back to full range
      if (eligibleChallenges.length === 0) {
        const whereClause: any = {
          is_active: true,
          difficulty: { [Op.between]: [minDiff, maxDiff] },
        };
        if (excludeCategories.length > 0) {
          whereClause.category = { [Op.notIn]: excludeCategories };
        }
        eligibleChallenges = await Challenge.findAll({
          where: whereClause,
        });
      }

      if (eligibleChallenges.length === 0) {
        // Fallback: try without category restriction but still respect difficulty
        const fallbackWhere: any = {
          is_active: true,
          difficulty: { [Op.between]: [minDiff, maxDiff] },
        };
        if (preferredDifficulty) {
          // Still prefer level 1 if available
          const level1Fallback = await Challenge.findAll({
            where: {
              is_active: true,
              difficulty: preferredDifficulty,
            },
          });
          if (level1Fallback.length > 0) {
            eligibleChallenges = level1Fallback;
          }
        }
        
        if (eligibleChallenges.length === 0) {
          eligibleChallenges = await Challenge.findAll({
            where: fallbackWhere,
          });
        }
        
        // Final fallback: any active challenge
        if (eligibleChallenges.length === 0) {
          eligibleChallenges = await Challenge.findAll({
            where: { is_active: true },
          });
        }
        
        if (eligibleChallenges.length === 0) {
          throw new Error('No challenges available');
        }
      }

      const selected = eligibleChallenges[Math.floor(Math.random() * eligibleChallenges.length)];
      userChallenge = await UserChallenge.create({
        user_id: userId,
        challenge_id: selected.id,
        assigned_date: dateStr,
      });

      // Reload with challenge data
      userChallenge = await UserChallenge.findByPk(userChallenge.id, {
        include: [{ model: Challenge, as: 'challenge' }],
      });
    }

    return userChallenge;
  }

  static async completeChallenge(userId: string, note?: string): Promise<UserChallenge> {
    const today = new Date();
    const dateStr = formatLocalDate(today);

    const userChallenge = await UserChallenge.findOne({
      where: {
        user_id: userId,
        assigned_date: dateStr,
      },
    });

    if (!userChallenge) {
      throw new Error('No active challenge assigned.');
    }

    if (userChallenge.completed_at) {
      throw new Error('Challenge already completed.');
    }

    userChallenge.completed_at = new Date();
    if (note) {
      userChallenge.note = note;
    }

    await userChallenge.save();
    return userChallenge;
  }
}

