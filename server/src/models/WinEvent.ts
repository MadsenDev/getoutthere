import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/connection.js';

export type WinEventType = 'WIN_POSTED' | 'LIKE';

export class WinEvent extends Model {
  declare id: string;
  declare user_hash: string;
  declare type: WinEventType;
  declare createdAt: Date;
}

WinEvent.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_hash: {
      type: DataTypes.CHAR(64),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('WIN_POSTED', 'LIKE'),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'WinEvent',
    tableName: 'win_events',
    timestamps: true,
    createdAt: true,
    updatedAt: false,
    underscored: false,
    indexes: [
      {
        fields: ['user_hash', 'createdAt'],
      },
    ],
  }
);

