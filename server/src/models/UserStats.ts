import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/connection.js';

export class UserStats extends Model {
  declare user_id: string;
  declare current_streak: number;
  declare longest_streak: number;
  declare comfort_score: number;
  declare updatedAt: Date;
}

UserStats.init(
  {
    user_id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    current_streak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    longest_streak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    comfort_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
  },
  {
    sequelize,
    modelName: 'UserStats',
    tableName: 'user_stats',
    timestamps: true,
    updatedAt: true,
    createdAt: false,
    underscored: false,
  }
);

