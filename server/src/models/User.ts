import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/connection.js';

export class User extends Model {
  declare id: string;
  declare email: string | null;
  declare password_hash: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(190),
      unique: true,
      allowNull: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: false,
  }
);

