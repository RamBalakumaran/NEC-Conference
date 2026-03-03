const ActionLog = require('../model/ActionLog');
const User = require('../model/User');
const Registration = require('../model/Registration');
const emailer = require('../config/email');

// Record an action and optionally trigger emails
const recordAction = async (req, res) => {
  try {
    const { action, userId, email, department, eventId, amount, details, meta } = req.body;

    // Try to attach user id if not provided but email present
    let user = userId || null;
    let foundUser = null;
    if (!user && email) {
      foundUser = await User.findOne({ where: { email } });
      if (foundUser) user = foundUser.id;
    } else if (user) {
      foundUser = await User.findOne({ where: { id: user } });
    }

    // create record via Sequelize
    const log = await ActionLog.create({ action, userId: user, email, department, eventId, amount, details, meta });

    // Trigger emails based on action type
    switch ((action || '').toLowerCase()) {
      case 'signup':
        if (email) emailer.sendWelcomeEmail({ name: details?.name || 'User', email });
        break;
      case 'login':
        if (email) emailer.sendLoginAlert({ name: details?.name || 'User', email });
        break;
      case 'cart_add':
      case 'cart_remove':
        if (email) emailer.sendCartChangeEmail({ name: details?.name || 'User', email }, action, details?.item);
        break;
      case 'registered_pending':
        if (email) {
          emailer.sendRegistrationReminderEmail(
            { name: details?.name || 'User', email, userId: user || userId },
            details?.registrationId,
            {
              participantId: foundUser?.participantId || '-',
              amount: amount || details?.amount || '-',
              events: details?.events || []
            }
          );
        }
        break;
      case 'registered_paid':
        if (email) {
          emailer.sendEventBookConfirmationEmail(
            { name: details?.name || 'User', email, role: details?.role || '' },
            details?.transactionId,
            amount || details?.amount,
            {
              participantId: foundUser?.participantId || '-',
              name: details?.name || 'User',
              email,
              paymentStatus: 'Paid',
              events: details?.events || []
            }
          );
        }
        break;
      case 'payment_failed':
      case 'left_without_payment':
        if (email) emailer.sendFailedPaymentEmail({ name: details?.name || 'User', email }, { action, ...details });
        break;
      default:
        break;
    }

    // Notify admin about the action
    try { emailer.sendAdminNotification(log); } catch (e) { /* ignore */ }

    res.status(201).json({ success: true, log });
  } catch (error) {
    console.error('Record Action Error:', error);
    res.status(500).json({ success: false, message: 'Failed to record action' });
  }
};

// Simple query endpoint for logs (admin use)
const queryLogs = async (req, res) => {
  try {
    const { action, email, department, from, to, limit = 100 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (email) filter.email = email;
    if (department) filter.department = department;
    if (from || to) filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);

    const logs = await ActionLog.findAll({
      where: filter,
      order: [['createdAt','DESC']],
      limit: parseInt(limit, 10)
    });
    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    console.error('Query Logs Error:', error);
    res.status(500).json({ success: false, message: 'Failed to query logs' });
  }
};

module.exports = { recordAction, queryLogs };
