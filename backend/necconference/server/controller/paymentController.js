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
      return[];
    }
  }
  return[];
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
    const existingEvents = Array.isArray(reg.selectedEvents) ? reg.selectedEvents :[];
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
      activityLog:[
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
    activityLog:[
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
    const mapped = (payments ||[]).map((p) => ({ ...p, status: toCanonicalStatus(p.status) }));
    res.json({ payments: mapped });
  });
};

// GET /payment/all-payments
const getAllPayments = (req, res) => {
  paymentModel.getAllPayments((err, payments) => {
    if (err) return handleError(res, err);
    const mapped = (payments ||[]).map((p) => ({ ...p, status: toCanonicalStatus(p.status) }));
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
      amount: payment.amount, 
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

    paymentModel.getPendingPayment(userId, async (err, pending) => {
      if (err) return handleError(res, err);

      // --- CRITICAL FIX: The try/catch block below prevents the 524 Timeout Error ---
      try {
        if (pending) {
          await syncRegistrationFromPayment({
            userEmail: userId,
            events: pending.events,
            amount: pending.amount,
            status: 'Pending',
            transactionId: pending.transactionId || pending.razorpayPaymentId || null
          });
          return res.json({
            keyId: process.env.RAZORPAY_KEY_ID,
            orderId: pending.razorpayOrderId,
            amount: Math.round(Number(pending.amount || 0) * 100),
            currency: pending.currency
          });
        }

        // Validate exact amounts based on Pricing Cards (300, 500, 1500)
        const ALLOWED_AMOUNTS =[300, 500, 1500];
        
        if (bodyAmount === undefined || bodyAmount === null || bodyAmount === '') {
          return res.status(400).json({ error: 'Amount is required.' });
        }
        
        let rupees = parseFloat(bodyAmount);
        
        if (!Number.isFinite(rupees) || rupees <= 0) {
          return res.status(400).json({ error: 'Invalid amount.' });
        }
        if (!ALLOWED_AMOUNTS.includes(rupees)) {
          return res.status(400).json({ error: 'Amount must be exactly 300, 500, or 1500 based on the selected pass.' });
        }

        const paise = Math.round(rupees * 100);
        const currency = 'INR';
        const receipt = `order_${userId}_${Date.now()}`;
        
        const notes = { userId };
        if (upiId) notes.upiId = upiId;

        // Call Razorpay
        const result = await razorpayCreateOrder({ amount: paise, currency, receipt, notes });
        
        // Fix: Properly handle if Razorpay service fails
        if (!result.success || !result.order) {
           throw new Error(result.error || "Failed to create order with Razorpay");
        }
        
        const order = result.order; 

        // Save to Database
        await new Promise((resolve, reject) => {
          paymentModel.createPayment(
            {
              userId,
              events,
              amount: rupees,
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

        // Send order back to frontend successfully
        return res.json({ 
          keyId: process.env.RAZORPAY_KEY_ID, 
          orderId: order.id, 
          amount: order.amount, 
          currency: order.currency 
        });

      } catch (asyncErr) {
        console.error('Error during Razorpay API call or DB save:', asyncErr);
        // This stops the server from hanging and returns a fast 500 error instead of a 100-second 524 Timeout
        return handleError(res, asyncErr); 
      }
    });
  } catch (e) {
    console.error('Error in createOrder outer block:', e);
    handleError(res, e);
  }
};

// POST /payment/verify
const verify = (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, upiId } = req.body;

  if (upiId) {
    console.log(`Payment verify called with upiId=${upiId}`);
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
        try {
          if (!fetchErr && paymentRow) {
            await syncRegistrationFromPayment({
              userEmail: paymentRow.userId,
              events: paymentRow.events,
              amount: paymentRow.amount,
              status: 'Paid',
              transactionId: razorpayPaymentId
            });

            const userEmail = paymentRow.userId; 
            const user = await User.findOne({ where: { email: userEmail } });
            const reg = await Registration.findOne({
              where: { contactEmail: userEmail },
              order: [['updatedAt', 'DESC']]
            });
            
            const registeredEvents = normalizeEvents(paymentRow.events);
            const effectiveEvents = registeredEvents.length
              ? registeredEvents
              : (Array.isArray(reg?.selectedEvents) ? reg.selectedEvents :[]);

            sendEventBookConfirmationEmail(
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
            ).catch((mailErr) => {
              console.warn('Event confirmation email warning (async):', mailErr?.message || mailErr);
            });
          }
        } catch (syncErr) {
          console.warn('Registration/email sync warning on verify:', syncErr?.message || syncErr);
        } finally {
          // Send response instantly, don't wait for background tasks
          res.json({
            verified: true,
            orderId: razorpayOrderId,
            paymentId: razorpayPaymentId,
            transactionId: razorpayPaymentId,
            status: 'Paid',
            upiId: upiId || null
          });
        }
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
    
    if ((result?.affectedRows || 0) > 0) {
      paymentModel.getPaymentByOrderId(razorpayOrderId, async (fetchErr, paymentRow) => {
        if (fetchErr || !paymentRow) return;
        try {
          const userEmail = paymentRow.userId; 
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
                : (Array.isArray(reg.selectedEvents) ? reg.selectedEvents :[]),
              payment: {
                ...paymentJson,
                paymentStatus: 'Failed',
                transactionId: razorpayPaymentId || paymentJson.transactionId || null,
                amount: paymentRow.amount || paymentJson.amount || 0,
                date: new Date()
              },
              activityLog:[
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