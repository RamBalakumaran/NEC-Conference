const { db } = require("../config/db.js");

// very simple payment model backed by a single `payments` table
// fields: userId, events (json), amount, currency, razorpayOrderId, razorpayPaymentId, status, transactionId

const sanitizeEventNames = (events) => {
  if (!Array.isArray(events)) return [];
  return events
    .map((ev) => (typeof ev === "string" ? ev : (ev?.name || ev?.title || ev?.id || "")))
    .map((name) => (typeof name === "string" ? name.trim() : ""))
    .filter(Boolean);
};
const paymentModel = {
  initializeTable: () => {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId VARCHAR(50) NOT NULL,
        events JSON NOT NULL,
        amount INT NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        razorpayOrderId VARCHAR(100) UNIQUE,
        razorpayPaymentId VARCHAR(100),
        status ENUM('Pending','Paid','Failed','Refunded') DEFAULT 'Pending',
        transactionId VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_userId (userId),
        INDEX idx_razorpayOrderId (razorpayOrderId),
        INDEX idx_status (status)
      )
    `;

    db.query(createQuery, (err) => {
      if (err) console.error('Error creating payments table:', err);
      else console.log('Payments table initialized');
    });
  },

  createPayment: (paymentData, callback) => {
    const { userId, events, amount, currency, razorpayOrderId, status, transactionId } = paymentData;
    const eventNames = sanitizeEventNames(events);
    const query = `
      INSERT INTO payments (userId, events, amount, currency, razorpayOrderId, razorpayPaymentId, status, transactionId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    db.query(
      query,
      [
        userId,
        JSON.stringify(eventNames),
        amount,
        currency || 'INR',
        razorpayOrderId || null,
        null,
        status || 'Pending',
        transactionId || null
      ],
      (err, result) => {
        if (err) {
          console.error('Error creating payment record:', err);
          return callback(err, null);
        }
        return callback(null, result);
      }
    );
  },

  updatePaymentStatus: (razorpayOrderId, status, razorpayPaymentId, transactionId, callback) => {
    const cb = typeof callback === 'function' ? callback : () => {};
    const query = `
      UPDATE payments
      SET status = ?,
          razorpayPaymentId = ?,
          transactionId = ?,
          updatedAt = NOW()
      WHERE razorpayOrderId = ?
    `;
    db.query(
      query,
      [status, razorpayPaymentId || null, transactionId || null, razorpayOrderId],
      (err, result) => {
        if (err) {
          console.error('Error updating payment status:', err);
          return cb(err, null);
        }
        return cb(null, result);
      }
    );
  },

  updatePaymentStatusIfCurrent: (
    razorpayOrderId,
    nextStatus,
    currentStatus,
    razorpayPaymentId,
    transactionId,
    callback
  ) => {
    const cb = typeof callback === "function" ? callback : () => {};
    const query = `
      UPDATE payments
      SET status = ?,
          razorpayPaymentId = ?,
          transactionId = ?,
          updatedAt = NOW()
      WHERE razorpayOrderId = ? AND status = ?
    `;
    db.query(
      query,
      [nextStatus, razorpayPaymentId || null, transactionId || null, razorpayOrderId, currentStatus],
      (err, result) => {
        if (err) {
          console.error("Error conditionally updating payment status:", err);
          return cb(err, null);
        }
        return cb(null, result);
      }
    );
  },

  getPaymentByOrderId: (razorpayOrderId, callback) => {
    const query = `SELECT * FROM payments WHERE razorpayOrderId = ?`;
    db.query(query, [razorpayOrderId], (err, result) => {
      if (err) {
        console.error('Error fetching payment by order ID:', err);
        return callback(err, null);
      }
      return callback(null, result[0] || null);
    });
  },

  getPaymentsByUserId: (userId, callback) => {
    const query = `SELECT * FROM payments WHERE userId = ? ORDER BY createdAt DESC`;
    db.query(query, [userId], (err, result) => {
      if (err) {
        console.error('Error fetching payments by user ID:', err);
        return callback(err, null);
      }
      return callback(null, result);
    });
  },

  getPendingPayment: (userId, callback) => {
    const query = `
      SELECT * FROM payments
      WHERE userId = ? AND status = 'Pending'
        AND createdAt > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      ORDER BY createdAt DESC LIMIT 1
    `;
    db.query(query, [userId], (err, result) => {
      if (err) {
        console.error('Error fetching pending payment:', err);
        return callback(err, null);
      }
      return callback(null, result[0] || null);
    });
  },

  getPendingPaymentsOlderThan: (minutes, callback) => {
    const query = `
      SELECT * FROM payments
      WHERE status = 'Pending' AND createdAt < DATE_SUB(NOW(), INTERVAL ? MINUTE)
      ORDER BY createdAt ASC
    `;
    db.query(query, [minutes], (err, result) => {
      if (err) {
        console.error('Error fetching pending payments:', err);
        return callback(err, null);
      }
      return callback(null, result);
    });
  },

  getAllPayments: (callback) => {
    const query = `SELECT * FROM payments ORDER BY createdAt DESC`;
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching all payments:', err);
        return callback(err, null);
      }
      return callback(null, result);
    });
  },

  getLatestPaidPaymentByUser: (userId, callback) => {
    const query = `
      SELECT * FROM payments
      WHERE userId = ? AND status = 'Paid'
      ORDER BY updatedAt DESC, createdAt DESC
      LIMIT 1
    `;
    db.query(query, [userId], (err, result) => {
      if (err) {
        console.error('Error fetching latest paid payment:', err);
        return callback(err, null);
      }
      return callback(null, result[0] || null);
    });
  }
};

module.exports = { paymentModel };
