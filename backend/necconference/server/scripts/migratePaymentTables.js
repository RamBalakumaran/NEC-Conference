const { db } = require("../config/db.js");

/**
 * Payment migration strategy
 * - Default: non-destructive (preserve history)
 * - Optional destructive reset only when PAYMENT_RESET_ON_BOOT=true
 */
const migratePaymentTables = (callback) => {
  const cb = typeof callback === "function" ? callback : () => {};
  const allowReset = String(process.env.PAYMENT_RESET_ON_BOOT || "").toLowerCase() === "true";

  if (!allowReset) {
    console.log("[Payments] Safe migration mode: preserving existing payments table/data.");
    const { paymentModel } = require("../model/paymentModel");
    paymentModel.initializeTable();
    cb(null);
    return;
  }

  console.warn("[Payments] PAYMENT_RESET_ON_BOOT=true -> dropping legacy payment tables.");
  const dropTables = [
    "DROP TABLE IF EXISTS payment_audit_logs",
    "DROP TABLE IF EXISTS user_payment_configs",
    "DROP TABLE IF EXISTS paper_payment_amounts",
    "DROP TABLE IF EXISTS payments",
  ];

  let completed = 0;
  dropTables.forEach((sql) => {
    db.query(sql, (err) => {
      if (err) {
        console.warn("[Payments] Table drop warning:", err.message);
      }
      completed += 1;
      if (completed === dropTables.length) {
        const { paymentModel } = require("../model/paymentModel");
        paymentModel.initializeTable();
        cb(null);
      }
    });
  });
};

module.exports = { migratePaymentTables };

