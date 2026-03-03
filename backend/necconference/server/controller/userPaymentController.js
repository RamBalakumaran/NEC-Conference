const { db } = require("../config/db.js");
const { userPaymentModel } = require("../model/userPaymentModel.js");

const PAYMENT_CURRENCY = "INR";
const ADDITIONAL_PARTICIPANT_AMOUNT = 20 * 100; // in paise (₹20 per additional participant)

const BASE_AMOUNTS = {
  ug_student: 8000 * 100,
  pg_student: 8000 * 100,
  faculty: 9000 * 100,
  industry: 10000 * 100
};

const BASE_CATEGORY_LABELS = {
  ug_student: "UG/PG Student",
  pg_student: "UG/PG Student",
  faculty: "Faculty",
  industry: "Industry"
};

const ACCEPTED_STATUSES = [
  "accepted",
  "accepted_with_minor_revision",
  "accepted_with_major_revision"
];

const normalizeType = (value) => {
  if (!value) return "";
  const normalized = value.toString().trim().toLowerCase().replace(/\s+/g, "_");
  if (normalized.includes("ug")) return "ug_student";
  if (normalized.includes("pg")) return "pg_student";
  if (normalized.includes("faculty")) return "faculty";
  if (normalized.includes("industry")) return "industry";
  return normalized;
};

const parseAuthors = (authors) => {
  if (!authors) return [];
  if (Array.isArray(authors)) return authors;
  if (typeof authors === "string") {
    try {
      const parsed = JSON.parse(authors);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const sanitizeIndexes = (indexes, authorsLength) => {
  if (!Array.isArray(indexes)) return [];
  const cleaned = indexes
    .map((idx) => Number.parseInt(idx, 10))
    .filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < authorsLength);
  return Array.from(new Set(cleaned));
};

const prepareUserPayment = async (req, res) => {
  try {
    const { paperId, presentationMode, stayRequired, participantIndexes } = req.body;
    const userId = req.user.id;

    if (!paperId) {
      return res.status(400).json({ error: "Paper ID is required" });
    }
    if (!presentationMode || !["online", "offline"].includes(presentationMode)) {
      return res.status(400).json({ error: "Presentation mode must be online or offline" });
    }

    const paperQuery = "SELECT * FROM registrations WHERE id = ? AND userId = ?";
    db.query(paperQuery, [paperId, userId], (err, papers) => {
      if (err) {
        console.error("Error fetching paper:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (!papers || papers.length === 0) {
        return res.status(404).json({ error: "Paper not found" });
      }

      const paper = papers[0];
      const isAccepted =
        ACCEPTED_STATUSES.includes(paper.status) ||
        ACCEPTED_STATUSES.includes(paper.reviewStatus);

      if (!paper.notificationSent || !isAccepted) {
        return res.status(400).json({
          error: "Payment is available only for accepted papers after notification",
          code: "PAYMENT_NOT_AVAILABLE"
        });
      }

      const authors = parseAuthors(paper.authors);
      if (!authors.length) {
        return res.status(400).json({ error: "Author details not found for this paper" });
      }

      const mainAuthor = authors[0];
      const mainType = normalizeType(mainAuthor?.type);
      const baseAmount = BASE_AMOUNTS[mainType];
      const baseCategory = BASE_CATEGORY_LABELS[mainType];

      if (!baseAmount) {
        return res.status(400).json({
          error: "Unable to determine base amount for the main author type",
          code: "INVALID_AUTHOR_TYPE"
        });
      }

      const cleanedIndexes = sanitizeIndexes(participantIndexes, authors.length);
      if (!cleanedIndexes.includes(0)) {
        cleanedIndexes.unshift(0);
      }

      const additionalParticipants = Math.max(0, cleanedIndexes.length - 1);
      const additionalAmount = additionalParticipants * ADDITIONAL_PARTICIPANT_AMOUNT;
      const totalAmount = baseAmount + additionalAmount;

      userPaymentModel.upsertPaymentConfig(
        {
          paperId,
          userId,
          presentationMode,
          stayRequired: !!stayRequired,
          participantIndexes: cleanedIndexes,
          baseCategory,
          baseAmount,
          additionalParticipants,
          additionalAmount,
          totalAmount,
          currency: PAYMENT_CURRENCY
        },
        (saveErr) => {
          if (saveErr) {
            return res.status(500).json({ error: "Failed to save payment details" });
          }

          return res.status(200).json({
            paperId,
            presentationMode,
            stayRequired: !!stayRequired,
            participantIndexes: cleanedIndexes,
            baseCategory,
            baseAmount,
            additionalParticipants,
            additionalAmount,
            totalAmount,
            currency: PAYMENT_CURRENCY
          });
        }
      );
    });
  } catch (error) {
    console.error("Prepare user payment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUserPaymentConfig = async (req, res) => {
  try {
    const { paperId } = req.params;
    const userId = req.user.id;

    if (!paperId) {
      return res.status(400).json({ error: "Paper ID is required" });
    }

    const paperQuery = "SELECT * FROM registrations WHERE id = ? AND userId = ?";
    db.query(paperQuery, [paperId, userId], (err, papers) => {
      if (err) {
        console.error("Error fetching paper:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (!papers || papers.length === 0) {
        return res.status(404).json({ error: "Paper not found" });
      }

      userPaymentModel.getPaymentConfigByPaperId(paperId, (configErr, config) => {
        if (configErr) {
          return res.status(500).json({ error: "Error fetching payment config" });
        }

        if (!config) {
          return res.status(404).json({ error: "Payment config not found" });
        }

        let participantIndexes = [];
        try {
          participantIndexes = config.participantIndexes
            ? JSON.parse(config.participantIndexes)
            : [];
        } catch {
          participantIndexes = [];
        }

        return res.status(200).json({
          paperId: config.paperId,
          presentationMode: config.presentationMode,
          stayRequired: !!config.stayRequired,
          participantIndexes,
          baseCategory: config.baseCategory,
          baseAmount: config.baseAmount,
          additionalParticipants: config.additionalParticipants,
          additionalAmount: config.additionalAmount,
          totalAmount: config.totalAmount,
          currency: config.currency || PAYMENT_CURRENCY
        });
      });
    });
  } catch (error) {
    console.error("Get user payment config error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  prepareUserPayment,
  getUserPaymentConfig
};
