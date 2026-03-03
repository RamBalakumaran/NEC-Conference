const Registration = require('../model/Registration');
const User = require('../model/User');
const { sendEventBookConfirmationEmail } = require('../config/email');
const { paymentModel } = require('../model/paymentModel');
const { Op } = require('sequelize');

const normalizeEvents = (events) => {
  if (!Array.isArray(events)) return [];
  return events
    .map((ev) => (typeof ev === "string" ? ev : (ev?.name || ev?.title || ev?.id || "")))
    .map((name) => (typeof name === "string" ? name.trim() : ""))
    .filter(Boolean);
};

const normalizePaymentStatus = (value) => {
  if (value === true) return "Paid";
  if (value === false) return "Pending";
  const normalized = String(value || "").toLowerCase();
  if (normalized === "paid" || normalized === "captured" || normalized === "success" || normalized === "successful") {
    return "Paid";
  }
  if (normalized === "failed" || normalized === "cancelled" || normalized === "canceled") {
    return "Failed";
  }
  return "Pending";
};

const toPaidFlag = (paymentStatus) => {
  if (paymentStatus === true) return true;
  const normalized = String(paymentStatus || '').toLowerCase();
  return normalized === 'paid' || normalized === 'captured' || normalized === 'success' || normalized === 'successful';
};

exports.registerUser = async (req, res) => {
  try {
    console.log("[Registration] Register request received with data:", req.body);
    
    const { userId, id, email, name, transactionId, amount, paymentStatus, paperId, paymentDate, events } = req.body;
    const selectedEventNames = normalizeEvents(events);
    const isPaid = toPaidFlag(paymentStatus);
    const normalizedPaymentStatus = normalizePaymentStatus(paymentStatus);
    let resolvedUserId = userId || id || null;

    // Accept either userId or email for lookup
    const lookupId = userId || email;
    if (!lookupId) {
      return res.status(400).json({ error: "userId or email required" });
    }

    if (!resolvedUserId && email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser?.id) resolvedUserId = existingUser.id;
    }

    try {
      // Fetch related registrations for this user/email.
      const registrations = await Registration.findAll({
        where: {
          [Op.or]: [
            resolvedUserId ? { userId: resolvedUserId } : null,
            email ? { contactEmail: email } : null
          ].filter(Boolean)
        },
        order: [['updatedAt', 'DESC']]
      });

      const pendingRegistration = registrations.find((reg) => {
        const status = String(reg?.payment?.paymentStatus || '').toLowerCase();
        const hasEvents = Array.isArray(reg?.selectedEvents) && reg.selectedEvents.length > 0;
        return status === 'pending' && hasEvents;
      });

      let registration = null;

      let resolvedTransactionId = transactionId || null;
      if (!resolvedTransactionId) {
        const paymentLookupKey = email || resolvedUserId;
        if (paymentLookupKey) {
          const recentPaidPayment = await new Promise((resolve) => {
            paymentModel.getLatestPaidPaymentByUser(paymentLookupKey, (err, row) => {
              if (err) {
                console.warn("[Registration] Paid payment lookup failed:", err.message);
                return resolve(null);
              }
              resolve(row || null);
            });
          });
          resolvedTransactionId = recentPaidPayment?.transactionId || recentPaidPayment?.razorpayPaymentId || null;
        }
      }

      if (isPaid) {
        // If there is a pending cart registration for this user, convert it to paid.
        // Otherwise create a new paid registration row (keeps each payment cycle separate).
        if (pendingRegistration) {
          registration = pendingRegistration;
          registration.userId = resolvedUserId || registration.userId || null;
          if (email) registration.contactEmail = email;
          if (selectedEventNames.length) registration.selectedEvents = selectedEventNames;
          registration.status = "Paid";
          registration.payment = {
            ...registration.payment,
            paymentStatus: "Paid",
            transactionId: resolvedTransactionId || registration.payment?.transactionId || null,
            amount: amount || registration.payment?.amount || 0,
            date: paymentDate || new Date(),
          };
          registration.activityLog = [
            ...(registration.activityLog || []),
            { action: "Payment Successful", timestamp: new Date() }
          ];
          await registration.save();
        } else {
          registration = await Registration.create({
            userId: resolvedUserId || null,
            contactEmail: email,
            selectedEvents: selectedEventNames,
            status: "Paid",
            payment: {
              paymentStatus: "Paid",
              transactionId: resolvedTransactionId,
              amount: amount || 0,
              date: paymentDate || new Date(),
            },
            activityLog: [
              { action: "Registration Created", timestamp: new Date() },
              { action: "Payment Successful", timestamp: new Date() }
            ],
          });
        }
      } else if (!pendingRegistration) {
        console.log("[Registration] Creating new pending registration for:", lookupId);
        registration = await Registration.create({
          userId: resolvedUserId || null,
          contactEmail: email,
          selectedEvents: selectedEventNames,
          status: normalizedPaymentStatus,
          payment: {
            paymentStatus: normalizedPaymentStatus,
            transactionId: resolvedTransactionId,
            amount: amount || 0,
            date: paymentDate || new Date(),
          },
          activityLog: [
            {
              action: "Registration Created",
              timestamp: new Date(),
            },
            {
              action: normalizedPaymentStatus === "Failed" ? "Payment Failed" : "Payment Pending",
              timestamp: new Date(),
            },
          ],
        });
      } else {
        registration = pendingRegistration;
        console.log("[Registration] Updating existing pending registration for:", lookupId);
        if (selectedEventNames.length) {
          registration.selectedEvents = selectedEventNames;
        }
        if (email) registration.contactEmail = email;
        registration.status = normalizedPaymentStatus;
        registration.payment = {
          ...registration.payment,
          paymentStatus: normalizedPaymentStatus,
          transactionId: resolvedTransactionId || registration.payment?.transactionId || null,
          amount: amount || registration.payment?.amount || 0,
          date: paymentDate || new Date(),
        };
        registration.activityLog = [
          ...(registration.activityLog || []),
          {
            action:
              normalizedPaymentStatus === "Failed"
                ? "Payment Failed"
                : normalizedPaymentStatus === "Paid"
                ? "Payment Successful"
                : "Payment Updated",
            timestamp: new Date(),
          },
        ];
        await registration.save();
      }

      // Sync selected event names into users.registeredEvents
      const targetUser = await User.findOne({
        where: resolvedUserId ? { id: resolvedUserId } : { email }
      });
      if (targetUser && selectedEventNames.length) {
        const existing = Array.isArray(targetUser.registeredEvents) ? targetUser.registeredEvents : [];
        const merged = Array.from(new Set([...existing, ...selectedEventNames]));
        await targetUser.update({ registeredEvents: merged });
      }

      console.log("[Registration] Registration saved successfully:", registration.id);

      // Try to send confirmation email if payment was successful
      if (isPaid && email) {
        try {
          await sendEventBookConfirmationEmail(
            { email, name },
            resolvedTransactionId || "N/A",
            amount || 0,
            {
              participantId: targetUser?.participantId || "-",
              name: name || targetUser?.name || "Participant",
              email,
              paymentStatus: normalizedPaymentStatus,
              paymentDate: paymentDate || new Date(),
              events: selectedEventNames
            }
          );
          console.log("[Registration] Confirmation email sent to:", email);
        } catch (emailErr) {
          console.warn("[Registration] Email send failed:", emailErr.message);
          // Don't fail the registration if email fails
        }
      }

      res.status(200).json({ 
        success: true,
        message: "Registration confirmed", 
        registrationId: registration.id 
      });

  } catch (innerError) {
      console.error("[Registration] Error processing registration:", innerError);
      res.status(500).json({ error: "Failed to process registration" });
    }

  } catch (error) {
    console.error("[Registration] Register Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

