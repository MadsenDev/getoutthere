import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/connection.js';

export class JournalEntry extends Model {
  declare id: string;
  declare user_id: string;
  declare entry_date: Date;
  declare content: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

JournalEntry.init(
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
    entry_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 5000],
      },
    },
  },
  {
    sequelize,
    modelName: 'JournalEntry',
    tableName: 'journal_entries',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        fields: ['user_id', 'entry_date'],
      },
      {
        fields: ['entry_date'],
      },
    ],
  }
);

