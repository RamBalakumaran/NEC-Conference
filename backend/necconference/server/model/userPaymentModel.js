const { db } = require("../config/db.js");

// User payment configuration model
const userPaymentModel = {
  // Initialize user payment config table
  initializeTable: () => {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS user_payment_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        paperId VARCHAR(36) NOT NULL UNIQUE,
        userId VARCHAR(50) NOT NULL,
        presentationMode ENUM('online', 'offline') NOT NULL,
        stayRequired BOOLEAN DEFAULT FALSE,
        participantIndexes JSON,
        baseCategory VARCHAR(50),
        baseAmount INT NOT NULL,
        additionalParticipants INT NOT NULL,
        additionalAmount INT NOT NULL,
        totalAmount INT NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_userId (userId),
        INDEX idx_paperId (paperId)
      )
    `;

    db.query(createQuery, (err) => {
      if (err) {
        console.error("Error creating user_payment_configs table:", err);
      } else {
        console.log("User payment configs table initialized successfully");
      }
    });
  },

  // Upsert user payment config by paperId
  upsertPaymentConfig: (config, callback) => {
    const cb = typeof callback === "function" ? callback : () => {};
    const {
      paperId,
      userId,
      presentationMode,
      stayRequired,
      participantIndexes,
      baseCategory,
      baseAmount,
      additionalParticipants,
      additionalAmount,
      totalAmount,
      currency
    } = config;

    const query = `
      INSERT INTO user_payment_configs
        (paperId, userId, presentationMode, stayRequired, participantIndexes, baseCategory, baseAmount, additionalParticipants, additionalAmount, totalAmount, currency, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        presentationMode = VALUES(presentationMode),
        stayRequired = VALUES(stayRequired),
        participantIndexes = VALUES(participantIndexes),
        baseCategory = VALUES(baseCategory),
        baseAmount = VALUES(baseAmount),
        additionalParticipants = VALUES(additionalParticipants),
        additionalAmount = VALUES(additionalAmount),
        totalAmount = VALUES(totalAmount),
        currency = VALUES(currency),
        updatedAt = NOW()
    `;

    db.query(
      query,
      [
        paperId,
        userId,
        presentationMode,
        stayRequired ? 1 : 0,
        JSON.stringify(participantIndexes || []),
        baseCategory || null,
        baseAmount,
        additionalParticipants,
        additionalAmount,
        totalAmount,
        currency || "INR"
      ],
      (err, result) => {
        if (err) {
          console.error("Error upserting user payment config:", err);
          return cb(err, null);
        }
        return cb(null, result);
      }
    );
  },

  // Get payment config by paperId
  getPaymentConfigByPaperId: (paperId, callback) => {
    const query = `
      SELECT * FROM user_payment_configs WHERE paperId = ? LIMIT 1
    `;

    db.query(query, [paperId], (err, result) => {
      if (err) {
        console.error("Error fetching user payment config:", err);
        return callback(err, null);
      }
      return callback(null, result[0] || null);
    });
  }
};

module.exports = { userPaymentModel };
