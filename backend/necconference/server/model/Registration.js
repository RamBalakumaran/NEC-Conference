// Sequelize-based Registration model
const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db');

const Registration = sequelize.models.Registration || sequelize.define('Registration', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  eventId: { type: DataTypes.STRING, allowNull: true },
  selectedEvents: { type: DataTypes.JSON, defaultValue: [] },
  status: { type: DataTypes.STRING, defaultValue: 'Cart' },
  payment: { type: DataTypes.JSON, defaultValue: {} },
  activityLog: { type: DataTypes.JSON, defaultValue: [] },
  attendance: { type: DataTypes.JSON, defaultValue: {} },
  registeredOn: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'registrations',
  indexes: [
    { fields: ['userId'] },
    { fields: ['contactEmail'] },
    { fields: ['registeredOn'] },
    // add composite unique index for userId + eventId (eventId may be null for existing rows)
    { unique: true, fields: ['userId', 'eventId'], name: 'user_event_unique' }
  ],
  getterMethods: {
    _id() {
      return this.id;
    }
  }
});

// Compatibility helpers
Registration.findById = function(id) {
  return this.findByPk(id);
};

Registration.findByIdAndUpdate = function(id, update, options = {}) {
  return this.update(update, { where: { id }, ...options });
};

// support findOneAndUpdate(filter, update, opts)
Registration.findOneAndUpdate = async function(filter, update, opts = {}) {
  let whereClause = {};
  if (filter) {
    // simple conversion: flatten dot notation into JSON extraction if necessary
    Object.keys(filter).forEach(key => {
      if (key.includes('.')) {
        // For nested JSON queries (e.g., payment.paymentStatus)
        const [root, child] = key.split('.');
        whereClause[sequelize.literal(`JSON_EXTRACT(${root}, '$.${child}')`)] = filter[key];
      } else {
        whereClause[key === 'user' ? 'userId' : key] = filter[key];
      }
    });
  }

  let reg = await Registration.findOne({ where: whereClause });
  if (reg) {
    await reg.update(update);
    return reg;
  } else {
    const toCreate = { ...filter, ...update };
    // rename user -> userId if present
    if (toCreate.user) {
      toCreate.userId = toCreate.user;
      delete toCreate.user;
    }
    const created = await Registration.create(toCreate);
    return created;
  }
};

module.exports = Registration;
