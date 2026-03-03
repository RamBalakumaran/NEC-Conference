// Sequelize-based User model for MySQL
// retains a small compatibility layer so existing controller code
// that uses mongoose-style method names still works.

const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.models.User || sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  participantId: { type: DataTypes.STRING, allowNull: true, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  college: { type: DataTypes.STRING, allowNull: true },
  department: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  year: { type: DataTypes.STRING, allowNull: true },
  isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
  role: { type: DataTypes.STRING, defaultValue: 'User' },
  // Login Tracking
  lastLogin: { type: DataTypes.DATE, allowNull: true },
  loginCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  // Cart/Registered Events (stored as JSON array)
  registeredEvents: { type: DataTypes.JSON, defaultValue: [] }
}, {
  tableName: 'users',
  getterMethods: {
    _id() {
      return this.id;
    }
  }
});

// compatibility helpers for controllers/tests that relied on mongoose
User.findById = function(id) {
  return this.findByPk(id);
};

User.findByIdAndUpdate = function(id, update, options = {}) {
  return this.update(update, { where: { id }, ...options });
};

// allow findOne({ email }) style
const origFindOne = User.findOne.bind(User);
User.findOne = async function(filter, opts) {
  if (!filter || filter.where) {
    return origFindOne(filter, opts);
  }
  return origFindOne({ where: filter }, opts);
};

module.exports = User;
