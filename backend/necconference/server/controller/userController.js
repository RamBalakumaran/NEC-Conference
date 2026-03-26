const { sendCartChangeEmail, sendRegistrationReminderEmail } = require("../config/email");
const Registration = require("../model/Registration");
const User = require("../model/User");
const { sequelize } = require("../model");
const { Op } = require("sequelize");

const normalizeEvents = (events) => {
  if (!Array.isArray(events)) return[];
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

    // Uncomment the below line if you want to debug incoming cart data in your terminal
    // console.log("saveCartState body:", JSON.stringify(req.body).slice(0, 1000));

    if (!userData || !userData.email) {
      return res.status(400).json({ message: "User data required" });
    }

    const userId = userData._id || userData.id || null;
    const base =[];
    if (userId) {
      base.push({ userId });
    } else {
      base.push({ contactEmail: userData.email });
    }
    
    // use sequelize.json helper to avoid bad escaping of the dollar sign
    base.push(
      sequelize.where(
        sequelize.json('payment.paymentStatus'),
        'Pending'
      )
    );

    let registration = null;
    let isStale = false; // Track this to handle responses safely outside the transaction

    // Define values OUTSIDE the transaction so the email logic at the bottom can read it
    const incomingCartUpdatedAt = Number(cartUpdatedAt || Date.now());
    const values = {
      userId: userId || null,
      contactEmail: userData.email,
      selectedEvents: normalizeEvents(selectedEvents),
      payment: { amount, paymentStatus: "Pending", cartUpdatedAt: incomingCartUpdatedAt },
      registeredOn: new Date(),
    };

    // perform read+write inside a transaction to avoid race conditions
    await sequelize.transaction(async (t) => {
      registration = await Registration.findOne({
        where: {[Op.and]: base },
        order: [["updatedAt", "DESC"]],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      const existingCartUpdatedAt = Number(registration?.payment?.cartUpdatedAt || 0);

      // Ignore stale/out-of-order cart writes
      if (registration && existingCartUpdatedAt > 0 && incomingCartUpdatedAt < existingCartUpdatedAt) {
        isStale = true;
        return; // Exits the transaction callback early, NO res.json() here!
      }

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
          registration = existing;
          await registration.update(values, { transaction: t });
        } else {
          registration = await Registration.create(values, { transaction: t });
        }
      }
    });

    // --- RESPONSES HANDLED SAFELY OUTSIDE THE TRANSACTION ---

    // 1. Check if the cart was stale and return early
    if (isStale) {
      return res.status(200).json({ message: "Stale cart update ignored", pendingEmailSent: false, staleIgnored: true });
    }

    // 2. Send "registered but payment pending" mail only when explicitly requested
    if (sendPendingEmail === true && Array.isArray(values.selectedEvents) && values.selectedEvents.length > 0) {
      // Wrapped in its own try/catch so email failures NEVER cause a 500 error for the cart
      try {
        let participantId = userData?.participantId || "-";
        const uid = userId || null;
        let user = null;
        if (uid) user = await User.findOne({ where: { id: uid } });
        if (!user && userData?.email) user = await User.findOne({ where: { email: userData.email } });
        if (user?.participantId) participantId = user.participantId;

        const sent = await sendRegistrationReminderEmail(
          {
            name: userData?.name || "Participant",
            email: userData?.email,
            participantId,
            userId: uid,
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
      } catch (emailErr) {
        console.warn("Non-fatal warning: Failed to send pending email:", emailErr.message);
      }
    }

    // 3. Send final success response
    return res.status(200).json({ message: "Cart saved", pendingEmailSent });

  } catch (e) {
    console.error("Save Cart Error:", e);
    // Double check that headers weren't sent to prevent crashes
    if (!res.headersSent) {
      return res.status(500).json({ error: "Server error saving cart data." });
    }
  }
};

// 4. Validate User
exports.validateUser = (req, res) => {
  res.status(200).json({ message: "User is valid" });
};