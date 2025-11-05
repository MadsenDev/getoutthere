import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/connection.js';

export class Win extends Model {
  declare id: string;
  declare user_id: string | null;
  declare text: string;
  declare likes: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Win.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    text: {
      type: DataTypes.STRING(280),
      allowNull: false,
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Win',
    tableName: 'wins',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        fields: ['createdAt'],
      },
    ],
  }
);

