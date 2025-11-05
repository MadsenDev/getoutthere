import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/connection.js';

export type ChallengeCategory =
  | 'awareness'
  | 'private'
  | 'visual'
  | 'interaction'
  | 'share'
  | 'reflect';

export class Challenge extends Model {
  declare id: string;
  declare slug: string;
  declare category: ChallengeCategory;
  declare difficulty: number;
  declare text: string;
  declare is_active: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Challenge.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    slug: {
      type: DataTypes.STRING(120),
      unique: true,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(
        'awareness',
        'private',
        'visual',
        'interaction',
        'share',
        'reflect'
      ),
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    text: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Challenge',
    tableName: 'challenges',
    timestamps: true,
    underscored: false,
  }
);

