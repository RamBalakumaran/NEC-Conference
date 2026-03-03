
const { paymentModel } = require('../model/paymentModel');
const User = require('../model/User');
const Registration = require('../model/Registration');
const { sendFailedPaymentEmail } = require('../config/email');
const { createOrder: razorpayCreateOrder, verifyPaymentSignature } = require('../service/razorpayService');

const toCanonicalStatus = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'captured' || normalized === 'paid') return 'Paid';
  if (normalized === 'failed') return 'Failed';
  if (normalized === 'refunded') return 'Refunded';
  return 'Pending';
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
          // return existing pending order (amount in paise from razorpay)
          return res.json({
            keyId: process.env.RAZORPAY_KEY_ID,
            orderId: pending.razorpayOrderId,
            amount: Math.round(Number(pending.amount || 0) * 100),
            currency: pending.currency
          });
        }

        // determine rupee amount
        let rupees = parseFloat(bodyAmount) || 0;
        if (rupees <= 0) {
          // fallback value
          //rupees = 300; // original default
          rupees = 10;    // use ₹10 for real-time testing
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

  paymentModel.updatePaymentStatus(razorpayOrderId, 'Paid', razorpayPaymentId, razorpayPaymentId, (err) => {
    if (err) {
      console.error('Error updating status after verification:', err);
      return handleError(res, err);
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
          if (reg) {
            const paymentJson = reg.payment || {};
            await reg.update({
              status: 'Failed',
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
