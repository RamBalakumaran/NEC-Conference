const { sequelize } = require('../config/db');
const User = require('./User');
const Registration = require('./Registration');
const ActionLog = require('./ActionLog');

// associations
User.hasMany(Registration, { foreignKey: 'userId', as: 'registrations' });
Registration.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(ActionLog, { foreignKey: 'userId', as: 'actionLogs' });
ActionLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Registration.hasMany(ActionLog, { foreignKey: 'eventId', as: 'actions' });
ActionLog.belongsTo(Registration, { foreignKey: 'eventId', as: 'registration' });

module.exports = {
  sequelize,
  User,
  Registration,
  ActionLog
};