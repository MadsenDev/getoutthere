import 'dotenv/config';
import { Challenge } from '../models/index.js';
import { sequelize } from '../db/connection.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const challengesData = JSON.parse(
  readFileSync(join(__dirname, 'challenges.json'), 'utf-8')
);

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected for seeding');

    // Import UUID generation
    const { v4: uuidv4 } = await import('uuid');

    const challenges = challengesData.map((challenge: any) => ({
      id: uuidv4(),
      slug: challenge.slug,
      category: challenge.category,
      difficulty: challenge.difficulty,
      text: challenge.text,
      is_active: true,
    }));

    await Challenge.bulkCreate(challenges, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${challenges.length} challenges`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();

