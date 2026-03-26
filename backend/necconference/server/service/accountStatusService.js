const { db } = require("../config/db");

const ACTIVE_ACCOUNT_STATUS = "active";
const INACTIVE_ACCOUNT_STATUS = "inactive";
const VALID_ACCOUNT_STATUSES = Object.freeze([
  ACTIVE_ACCOUNT_STATUS,
  INACTIVE_ACCOUNT_STATUS,
]);

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

const normalizeAccountStatus = (value) =>
  String(value || "").toLowerCase() === INACTIVE_ACCOUNT_STATUS
    ? INACTIVE_ACCOUNT_STATUS
    : ACTIVE_ACCOUNT_STATUS;

const ensureAccountStatusColumn = async () => {
  try {
    await query(
      "ALTER TABLE users ADD COLUMN accountStatus VARCHAR(16) NOT NULL DEFAULT 'active'"
    );
  } catch (err) {
    if (err.code !== "ER_DUP_FIELDNAME") throw err;
  }
};

const normalizeStoredAccountStatuses = async () => {
  const result = await query(`
    UPDATE users
    SET accountStatus = CASE
      WHEN LOWER(TRIM(COALESCE(accountStatus, ''))) = 'inactive' THEN 'inactive'
      ELSE 'active'
    END
  `);

  return Number(result?.changedRows || result?.affectedRows || 0);
};

const initializeAccountStatuses = async () => {
  await ensureAccountStatusColumn();
  const updated = await normalizeStoredAccountStatuses();
  if (updated > 0) {
    console.log(`Account statuses normalized: ${updated}`);
  } else {
    console.log("Account statuses already synchronized");
  }
};

module.exports = {
  ACTIVE_ACCOUNT_STATUS,
  INACTIVE_ACCOUNT_STATUS,
  VALID_ACCOUNT_STATUSES,
  initializeAccountStatuses,
  normalizeAccountStatus,
};
