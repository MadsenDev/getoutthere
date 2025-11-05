import { User } from './User.js';
import { Challenge } from './Challenge.js';
import { UserChallenge } from './UserChallenge.js';
import { UserStats } from './UserStats.js';
import { Win } from './Win.js';
import { WinEvent } from './WinEvent.js';
import { JournalEntry } from './JournalEntry.js';

// Define relationships
User.hasMany(UserChallenge, { foreignKey: 'user_id', onDelete: 'CASCADE' });
UserChallenge.belongsTo(User, { foreignKey: 'user_id' });

// Alias the relation so included data appears under `challenge`
Challenge.hasMany(UserChallenge, { foreignKey: 'challenge_id', as: 'userChallenges' });
UserChallenge.belongsTo(Challenge, { foreignKey: 'challenge_id', as: 'challenge' });

User.hasOne(UserStats, { foreignKey: 'user_id', onDelete: 'CASCADE' });
UserStats.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Win, { foreignKey: 'user_id' });
Win.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(JournalEntry, { foreignKey: 'user_id', onDelete: 'CASCADE' });
JournalEntry.belongsTo(User, { foreignKey: 'user_id' });

export { User, Challenge, UserChallenge, UserStats, Win, WinEvent, JournalEntry };

