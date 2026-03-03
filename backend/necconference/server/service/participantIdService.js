const { Op } = require("sequelize");
const { db } = require("../config/db");
const User = require("../model/User");

const PID_PREFIX = "PID";
const PID_PAD = 6;

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

const buildPid = (seq) => `${PID_PREFIX}${String(seq).padStart(PID_PAD, "0")}`;

const ensureParticipantIdColumn = async () => {
  try {
    await query("ALTER TABLE users ADD COLUMN participantId VARCHAR(32) NULL");
  } catch (err) {
    if (err.code !== "ER_DUP_FIELDNAME") throw err;
  }

  try {
    await query("CREATE UNIQUE INDEX ux_users_participantId ON users (participantId)");
  } catch (err) {
    if (err.code !== "ER_DUP_KEYNAME" && err.code !== "ER_DUP_ENTRY") throw err;
  }
};

const nextParticipantId = async () => {
  const lockRows = await query("SELECT GET_LOCK('participant_id_lock', 10) AS l");
  const locked = Array.isArray(lockRows) && Number(lockRows[0]?.l) === 1;
  if (!locked) throw new Error("Unable to acquire participant ID lock");

  try {
    const rows = await query(
      `SELECT participantId
       FROM users
       WHERE participantId REGEXP '^PID[0-9]+$'
       ORDER BY CAST(SUBSTRING(participantId, 4) AS UNSIGNED) DESC
       LIMIT 1`
    );
    const lastPid = rows?.[0]?.participantId || null;
    const lastSeq = lastPid ? Number(String(lastPid).replace(PID_PREFIX, "")) : 0;
    return buildPid(lastSeq + 1);
  } finally {
    await query("DO RELEASE_LOCK('participant_id_lock')");
  }
};

const assignParticipantIdToUser = async (user) => {
  if (!user) return null;
  if (user.isAdmin || String(user.role || "").toLowerCase() === "admin") return null;
  if (user.participantId) return user.participantId;

  for (let i = 0; i < 5; i += 1) {
    const pid = await nextParticipantId();
    try {
      await user.update({ participantId: pid });
      return pid;
    } catch (err) {
      if (err?.name === "SequelizeUniqueConstraintError" || err?.parent?.code === "ER_DUP_ENTRY") {
        continue;
      }
      throw err;
    }
  }
  throw new Error("Failed to assign unique participant ID");
};

const backfillParticipantIds = async () => {
  const users = await User.findAll({
    where: {
      [Op.and]: [
        { isAdmin: false },
        { role: { [Op.ne]: "admin" } },
        {
          [Op.or]: [{ participantId: null }, { participantId: "" }],
        },
      ],
    },
    order: [["createdAt", "ASC"]],
  });

  let updated = 0;
  for (const user of users) {
    await assignParticipantIdToUser(user);
    updated += 1;
  }
  return updated;
};

const initializeParticipantIds = async () => {
  await ensureParticipantIdColumn();
  const updated = await backfillParticipantIds();
  if (updated > 0) {
    console.log(`Participant IDs backfilled: ${updated}`);
  } else {
    console.log("Participant IDs already present for existing participants");
  }
};

module.exports = {
  initializeParticipantIds,
  assignParticipantIdToUser,
};

