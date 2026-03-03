const { sendCartChangeEmail, sendRegistrationReminderEmail } = require("../config/email");
const Registration = require("../model/Registration");
const User = require("../model/User");
const { sequelize } = require("../model");
const { Op } = require("sequelize");

const normalizeEvents = (events) => {
  if (!Array.isArray(events)) return [];
  return Array.from(
    new Set(
      events
        .map((ev) => (typeof ev === "string" ? ev : ev?.name || ev?.title || ev?.id || ""))
        .map((name) => (typeof name === "string" ? name.trim() : ""))
        .filter(Boolean)
    )
  );
};

// 1. Notify Add to Cart
exports.notifyAddToCart = async (req, res) => {
  try {
    const { email, eventName, userName } = req.body;
    await sendCartChangeEmail(
      { name: userName || "Participant", email },
      "cart_add",
      eventName || "Selected Event"
    );
    res.status(200).json({ message: "Notification sent" });
  } catch (error) {
    console.error("Add Cart Email Error:", error);
    res.status(500).json({ message: "Error sending email" });
  }
};

// 2. Notify Remove from Cart
exports.notifyRemoveFromCart = async (req, res) => {
  try {
    const { email, eventName, userName } = req.body;
    await sendCartChangeEmail(
      { name: userName || "Participant", email },
      "cart_remove",
      eventName || "Selected Event"
    );
    res.status(200).json({ message: "Notification sent" });
  } catch (error) {
    console.error("Remove Cart Email Error:", error);
    res.status(500).json({ message: "Error sending email" });
  }
};

// 3. Save Cart State (For Admin Dashboard "Pending" status)
exports.saveCartState = async (req, res) => {
  try {
    const { userData, selectedEvents, amount, cartUpdatedAt, sendPendingEmail } = req.body;
    let pendingEmailSent = false;

    console.log("saveCartState body:", JSON.stringify(req.body).slice(0, 1000));

    if (!userData || !userData.email) {
      return res.status(400).json({ message: "User data required" });
    }

    const userId = userData._id || userData.id || null;
    const base = [];
    if (userId) {
      base.push({ userId });
    } else {
      base.push({ contactEmail: userData.email });
    }
    // use sequelize.json helper to avoid bad escaping of the dollar sign
    // earlier we saw MySQL error with '$$.paymentStatus' path
    base.push(
      sequelize.where(
        sequelize.json('payment.paymentStatus'),
        'Pending'
      )
    );

    // perform read+write inside a transaction to avoid race conditions
    let registration = null;
    await sequelize.transaction(async (t) => {
      registration = await Registration.findOne({
        where: {
          [Op.and]: base,
        },
        order: [["updatedAt", "DESC"]],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

    const incomingCartUpdatedAt = Number(cartUpdatedAt || Date.now());
    const existingCartUpdatedAt = Number(registration?.payment?.cartUpdatedAt || 0);

    // Ignore stale/out-of-order cart writes (common when two add/remove requests race).
    if (registration && existingCartUpdatedAt > 0 && incomingCartUpdatedAt < existingCartUpdatedAt) {
      return res.status(200).json({ message: "Stale cart update ignored", pendingEmailSent: false, staleIgnored: true });
    }

    const values = {
      userId: userId || null,
      contactEmail: userData.email,
      selectedEvents: normalizeEvents(selectedEvents),
      payment: { amount, paymentStatus: "Pending", cartUpdatedAt: incomingCartUpdatedAt },
      registeredOn: new Date(),
    };

      if (registration) {
        await registration.update(values, { transaction: t });
      } else {
        // simple duplicate prevention: if an identical pending cart exists, reuse it
        const existing = await Registration.findOne({
          where: {
            contactEmail: values.contactEmail,
            status: 'Cart'
          },
          transaction: t,
          lock: t.LOCK.UPDATE
        });
        if (existing) {
          // update the existing record
          registration = existing;
          await registration.update(values, { transaction: t });
        } else {
          registration = await Registration.create(values, { transaction: t });
        }
      }
    });

    // Send "registered but payment pending" mail only when explicitly requested
    if (sendPendingEmail === true && Array.isArray(values.selectedEvents) && values.selectedEvents.length > 0) {
      let participantId = userData?.participantId || "-";
      try {
        const uid = userId || null;
        let user = null;
        if (uid) user = await User.findOne({ where: { id: uid } });
        if (!user && userData?.email) user = await User.findOne({ where: { email: userData.email } });
        if (user?.participantId) participantId = user.participantId;
      } catch (_) {
        // do not fail cart save for participantId lookup issues
      }

      const sent = await sendRegistrationReminderEmail(
        {
          name: userData?.name || "Participant",
          email: userData?.email,
          participantId,
          userId: userId || null,
        },
        registration.id,
        {
          participantId,
          amount: amount || 0,
          events: values.selectedEvents,
          email: userData?.email,
        }
      );
      pendingEmailSent = !!sent;
    }

    res.status(200).json({ message: "Cart saved", pendingEmailSent });
  } catch (e) {
    console.error("Save Cart Error:", e);
    res.status(500).json({ error: e.message });
  }
};

// 4. Validate User
exports.validateUser = (req, res) => {
  res.status(200).json({ message: "User is valid" });
};
