// Sequelize-based ActionLog model
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ActionLog = sequelize.models.ActionLog || sequelize.define('ActionLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  action: { type: DataTypes.STRING, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  department: { type: DataTypes.STRING, allowNull: true },
  eventId: { type: DataTypes.UUID, allowNull: true },
  amount: { type: DataTypes.FLOAT, defaultValue: 0 },
  details: { type: DataTypes.JSON, defaultValue: {} },
  meta: { type: DataTypes.JSON, defaultValue: {} },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'action_logs',
  timestamps: false // createdAt is managed manually in field above
});

module.exports = ActionLog;
