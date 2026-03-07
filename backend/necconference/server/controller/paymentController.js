
const { paymentModel } = require('../model/paymentModel');
const User = require('../model/User');
const Registration = require('../model/Registration');
const { sendFailedPaymentEmail, sendEventBookConfirmationEmail } = require('../config/email');
const { createOrder: razorpayCreateOrder, verifyPaymentSignature } = require('../service/razorpayService');

const toCanonicalStatus = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'captured' || normalized === 'paid') return 'Paid';
  if (normalized === 'failed') return 'Failed';
  if (normalized === 'refunded') return 'Refunded';
  return 'Pending';
};

const parseEvents = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizeEvents = (events) =>
  parseEvents(events)
    .map((ev) => (typeof ev === 'string' ? ev : (ev?.name || ev?.title || ev?.id || '')))
    .map((name) => String(name).trim())
    .filter(Boolean);

const syncRegistrationFromPayment = async ({
  userEmail,
  events,
  amount,
  status,
  transactionId
}) => {
  if (!userEmail) return;

  const selectedEvents = normalizeEvents(events);
  const now = new Date();
  const canonicalStatus = toCanonicalStatus(status);

  let reg = await Registration.findOne({
    where: { contactEmail: userEmail },
    order: [['updatedAt', 'DESC']]
  });

  if (reg) {
    const existingEvents = Array.isArray(reg.selectedEvents) ? reg.selectedEvents : [];
    const mergedEvents = Array.from(new Set([...existingEvents, ...selectedEvents]));
    const paymentJson = reg.payment || {};
    await reg.update({
      status: canonicalStatus,
      selectedEvents: mergedEvents,
      payment: {
        ...paymentJson,
        paymentStatus: canonicalStatus,
        amount: amount ?? paymentJson.amount ?? 0,
        transactionId: transactionId || paymentJson.transactionId || null,
        date: now
      },
      activityLog: [
        ...(reg.activityLog || []),
        {
          action: canonicalStatus === 'Paid' ? 'Payment Paid' : canonicalStatus === 'Failed' ? 'Payment Failed' : 'Payment Pending',
          timestamp: now
        }
      ]
    });
    return;
  }

  const user = await User.findOne({ where: { email: userEmail } });
  await Registration.create({
    userId: user?.id || null,
    contactEmail: userEmail,
    selectedEvents,
    status: canonicalStatus,
    payment: {
      amount: amount || 0,
      paymentStatus: canonicalStatus,
      transactionId: transactionId || null,
      date: now
    },
    activityLog: [
      {
        action: canonicalStatus === 'Paid' ? 'Payment Paid' : canonicalStatus === 'Failed' ? 'Payment Failed' : 'Payment Pending',
        timestamp: now
      }
    ],
    attendance: {}
  });
};

// helper to respond with standardized error
const handleError = (res, err) => {
  console.error(err);
  return res.status(500).json({ error: err.message || 'Server error' });
};

// GET /payment/user-payments
const getUserPayments = (req, res) => {
  const userId = req.query.userId || req.body.userId || null;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  paymentModel.getPaymentsByUserId(userId, (err, payments) => {
    if (err) return handleError(res, err);
    const mapped = (payments || []).map((p) => ({ ...p, status: toCanonicalStatus(p.status) }));
    res.json({ payments: mapped });
  });
};

// GET /payment/all-payments
const getAllPayments = (req, res) => {
  paymentModel.getAllPayments((err, payments) => {
    if (err) return handleError(res, err);
    const mapped = (payments || []).map((p) => ({ ...p, status: toCanonicalStatus(p.status) }));
    res.json({ payments: mapped });
  });
};

// GET /payment/status/:orderId
const getStatus = (req, res) => {
  const { orderId } = req.params;
  if (!orderId) return res.status(400).json({ error: 'orderId required' });

  paymentModel.getPaymentByOrderId(orderId, (err, payment) => {
    if (err) return handleError(res, err);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json({
      orderId,
      status: toCanonicalStatus(payment.status),
      amount: payment.amount, // now in rupees
      currency: payment.currency,
      events: payment.events
    });
  });
};

// POST /payment/create-order
const createOrder = async (req, res) => {
  try {
      const { userId, amount: bodyAmount, events, upiId } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId required' });

      // check for existing pending order for this user
      paymentModel.getPendingPayment(userId, async (err, pending) => {
        if (err) return handleError(res, err);
        if (pending) {
          await syncRegistrationFromPayment({
            userEmail: userId,
            events: pending.events,
            amount: pending.amount,
            status: 'Pending',
            transactionId: pending.transactionId || pending.razorpayPaymentId || null
          });
          // return existing pending order (amount in paise from razorpay)
          return res.json({
            keyId: process.env.RAZORPAY_KEY_ID,
            orderId: pending.razorpayOrderId,
            amount: Math.round(Number(pending.amount || 0) * 100),
            currency: pending.currency
          });
        }

        // determine rupee amount (allowlisted for server-side enforcement)
        const ALLOWED_AMOUNTS = [300, 500, 1500];
        const hasBodyAmount = bodyAmount !== undefined && bodyAmount !== null && bodyAmount !== '';
        let rupees = hasBodyAmount ? parseFloat(bodyAmount) : 10;
        if (!Number.isFinite(rupees) || rupees <= 0) {
          return res.status(400).json({ error: 'Invalid amount' });
        }
        if (!ALLOWED_AMOUNTS.includes(rupees)) {
          return res.status(400).json({ error: 'Amount must be one of 300, 500, or 1500' });
        }
        const paise = Math.round(rupees * 100);
        const currency = 'INR';

        const receipt = `order_${userId}_${Date.now()}`;
        // attach upiId to the notes so it travels with the razorpay order and is easy to lookup later
        const notes = { userId };
        if (upiId) notes.upiId = upiId;

        const result = await razorpayCreateOrder({ amount: paise, currency, receipt, notes });
        const order = result.order; // extract order object returned by razorpay service
      await new Promise((resolve, reject) => {
        paymentModel.createPayment(
          {
            userId,
            events,
            amount: rupees, // store rupee amount in our table
            currency,
            razorpayOrderId: order.id,
            status: 'Pending'
          },
          (createErr) => {
            if (createErr) return reject(createErr);
            return resolve();
          }
        );
      });

      await syncRegistrationFromPayment({
        userEmail: userId,
        events,
        amount: rupees,
        status: 'Pending',
        transactionId: null
      });

      // order.amount is paise (what razorpay returns)
      return res.json({ keyId: process.env.RAZORPAY_KEY_ID, orderId: order.id, amount: order.amount, currency: order.currency });
    });
  } catch (e) {
    console.error('Error in createOrder:', e);
    handleError(res, e);
  }
};

// POST /payment/verify
const verify = (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, upiId } = req.body;

  // optionally record the provided UPI ID; our simple payments table doesn't have a column yet,
  // but we can log it for audit or future use. If you later alter the table you could store it there.
  if (upiId) {
    console.log(`Payment verify called with upiId=${upiId}`);
    // could update paymentModel to keep this info if needed
  }

  const check = verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
  if (!check.valid) {
    return res.status(400).json({ verified: false, error: check.error });
  }

  paymentModel.updatePaymentStatusIfCurrent(
    razorpayOrderId,
    'Paid',
    'Pending',
    razorpayPaymentId,
    razorpayPaymentId,
    (err) => {
    if (err) {
      console.error('Error updating status after verification:', err);
      return handleError(res, err);
    }
    paymentModel.getPaymentByOrderId(razorpayOrderId, async (fetchErr, paymentRow) => {
      if (!fetchErr && paymentRow) {
        try {
          await syncRegistrationFromPayment({
            userEmail: paymentRow.userId,
            events: paymentRow.events,
            amount: paymentRow.amount,
            status: 'Paid',
            transactionId: razorpayPaymentId
          });

          const userEmail = paymentRow.userId; // in this app, userId is email
          const user = await User.findOne({ where: { email: userEmail } });
          const reg = await Registration.findOne({
            where: { contactEmail: userEmail },
            order: [['updatedAt', 'DESC']]
          });
          const registeredEvents = normalizeEvents(paymentRow.events);
          const effectiveEvents = registeredEvents.length
            ? registeredEvents
            : (Array.isArray(reg?.selectedEvents) ? reg.selectedEvents : []);

          await sendEventBookConfirmationEmail(
            {
              name: user?.name || reg?.contactName || 'Participant',
              email: userEmail,
              participantId: user?.participantId || user?.id || '-',
              events: effectiveEvents
            },
            razorpayPaymentId,
            paymentRow.amount,
            {
              participantId: user?.participantId || user?.id || '-',
              name: user?.name || reg?.contactName || 'Participant',
              email: userEmail,
              paymentStatus: 'Paid',
              paymentDate: new Date(),
              events: effectiveEvents,
              orderId: razorpayOrderId,
              paymentId: razorpayPaymentId,
              upiId: upiId || null,
              currency: paymentRow.currency || 'INR'
            }
          );
        } catch (syncErr) {
          console.warn('Registration/email sync warning on verify:', syncErr?.message || syncErr);
        }
      }

      res.json({
        verified: true,
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        transactionId: razorpayPaymentId,
        status: 'Paid',
        upiId: upiId || null
      });
    });
  }
  );
};

// POST /payment/failure
const failure = (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, error } = req.body;
  if (!razorpayOrderId) return res.status(400).json({ success: false, error: 'razorpayOrderId required' });
  paymentModel.updatePaymentStatusIfCurrent(razorpayOrderId, 'Failed', 'Pending', razorpayPaymentId || null, null, (err, result) => {
    if (err) console.error('Error marking payment failed:', err);
    // Send failed payment mail when a row was updated
    if ((result?.affectedRows || 0) > 0) {
      paymentModel.getPaymentByOrderId(razorpayOrderId, async (fetchErr, paymentRow) => {
        if (fetchErr || !paymentRow) return;
        const userEmail = paymentRow.userId; // in this app, userId is email for payments
        try {
          const user = await User.findOne({ where: { email: userEmail } });
          const reg = await Registration.findOne({
            where: { contactEmail: userEmail },
            order: [['updatedAt', 'DESC']]
          });
          const normalizedPaymentEvents = normalizeEvents(paymentRow.events);
          if (reg) {
            const paymentJson = reg.payment || {};
            await reg.update({
              status: 'Failed',
              selectedEvents: normalizedPaymentEvents.length
                ? Array.from(new Set([...(Array.isArray(reg.selectedEvents) ? reg.selectedEvents : []), ...normalizedPaymentEvents]))
                : (Array.isArray(reg.selectedEvents) ? reg.selectedEvents : []),
              payment: {
                ...paymentJson,
                paymentStatus: 'Failed',
                transactionId: razorpayPaymentId || paymentJson.transactionId || null,
                amount: paymentRow.amount || paymentJson.amount || 0,
                date: new Date()
              },
              activityLog: [
                ...(reg.activityLog || []),
                { action: 'Payment Failed', timestamp: new Date() }
              ]
            });
          } else {
            await syncRegistrationFromPayment({
              userEmail,
              events: paymentRow.events,
              amount: paymentRow.amount,
              status: 'Failed',
              transactionId: razorpayPaymentId || null
            });
          }

          await sendFailedPaymentEmail(
            { name: user?.name || 'Participant', email: userEmail },
            {
              razorpayOrderId,
              razorpayPaymentId: razorpayPaymentId || paymentRow.razorpayPaymentId || null,
              reason: error || 'payment_failed_or_cancelled',
              amount: paymentRow.amount,
              events: paymentRow.events,
            }
          );
        } catch (mailErr) {
          console.warn('Failed payment email send warning:', mailErr?.message || mailErr);
        }
      });
    }
    res.json({ success: true, updated: result?.affectedRows || 0 });
  });
};

module.exports = {
  getUserPayments,
  getAllPayments,
  getStatus,
  createOrder,
  verify,
  failure
};

