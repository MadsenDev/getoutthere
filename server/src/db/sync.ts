import 'dotenv/config';
import { sequelize } from './connection.js';
import '../models/index.js';

async function sync() {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    process.exit(1);
  }
}

sync();

