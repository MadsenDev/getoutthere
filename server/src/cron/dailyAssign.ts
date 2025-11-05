import 'dotenv/config';
import { User, UserChallenge, UserStats } from '../models/index.js';
import { ChallengeService } from '../services/ChallengeService.js';
import { Op } from 'sequelize';

async function assignDailyChallenges() {
  try {
    console.log('Starting daily challenge assignment...');

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    // Get all users
    const users = await User.findAll();

    let assigned = 0;
    let skipped = 0;

    for (const user of users) {
      // Check if already assigned today
      const existing = await UserChallenge.findOne({
        where: {
          user_id: user.id,
          assigned_date: dateStr,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      try {
        await ChallengeService.getTodayChallenge(user.id, today);
        assigned++;
      } catch (error) {
        console.error(`Failed to assign challenge for user ${user.id}:`, error);
      }
    }

    console.log(`✅ Daily assignment complete: ${assigned} assigned, ${skipped} skipped`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Daily assignment failed:', error);
    process.exit(1);
  }
}

assignDailyChallenges();

