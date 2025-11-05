import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/connection.js';

export class UserChallenge extends Model {
  declare id: string;
  declare user_id: string;
  declare challenge_id: string;
  declare assigned_date: Date;
  declare completed_at: Date | null;
  declare note: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

UserChallenge.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    challenge_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'challenges',
        key: 'id',
      },
    },
    assigned_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000],
      },
    },
  },
  {
    sequelize,
    modelName: 'UserChallenge',
    tableName: 'user_challenges',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'assigned_date'],
        name: 'uniq_user_day',
      },
      {
        fields: ['assigned_date'],
      },
    ],
  }
);

