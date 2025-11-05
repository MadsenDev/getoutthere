import { Challenge, UserChallenge, UserStats } from '../models/index.js';
import { Op } from 'sequelize';

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
    const dateStr = date.toISOString().split('T')[0];
    
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
        });

      const [minDiff, maxDiff] = this.getDifficultyRange(stats.comfort_score);
      
      // For brand new users (comfort_score = 0), prioritize level 1 challenges
      const preferredDifficulty = stats.comfort_score === 0 ? 1 : null;

      // Get yesterday's category to avoid repetition
      const yesterday = new Date(date);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayChallenge = await UserChallenge.findOne({
        where: {
          user_id: userId,
          assigned_date: yesterdayStr,
        },
        include: [{ model: Challenge, as: 'challenge' }],
      });

      const excludeCategory = (yesterdayChallenge as any)?.challenge?.category;

      // Find eligible challenges - prefer level 1 for new users
      let eligibleChallenges: Challenge[] = [];
      
      if (preferredDifficulty) {
        // Try to get challenges at preferred difficulty first
        const preferredWhere: any = {
          is_active: true,
          difficulty: preferredDifficulty,
        };
        if (excludeCategory) {
          preferredWhere.category = { [Op.ne]: excludeCategory };
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
        if (excludeCategory) {
          whereClause.category = { [Op.ne]: excludeCategory };
        }
        eligibleChallenges = await Challenge.findAll({
          where: whereClause,
        });
      }

      if (eligibleChallenges.length === 0) {
        // Fallback: try without category restriction
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
    const dateStr = today.toISOString().split('T')[0];

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

