const User = require('../model/User'); 
const Registration = require('../model/Registration');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { assignParticipantIdToUser } = require('../service/participantIdService');
const { paymentModel } = require('../model/paymentModel');

// FIX: Ensure this path matches your actual file structure
// In previous steps, we created it in ../service/emailService
const { sendWelcomeEmail, sendLoginAlert, sendRegistrationReminderEmail } = require('../config/email'); 

const secret = process.env.JWT_SECRET || "NEC_CONFERENCE_SECRET_KEY_2025";

const toCanonicalStatus = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'captured' || normalized === 'paid' || normalized === 'successful' || normalized === 'success') {
    return 'Paid';
  }
  if (normalized === 'failed' || normalized === 'cancelled' || normalized === 'canceled') {
    return 'Failed';
  }
  if (normalized === 'refunded') {
    return 'Refunded';
  }
  return 'Pending';
};

const parseArrayField = (value) => {
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
  Array.from(
    new Set(
      parseArrayField(events)
        .map((eventItem) => (typeof eventItem === 'string' ? eventItem : eventItem?.name || eventItem?.title || eventItem?.id || ''))
        .map((eventName) => String(eventName || '').trim())
        .filter(Boolean)
    )
  );

const normalizeActivityLog = (activityLog, registration) =>
  parseArrayField(activityLog)
    .map((entry, index) => ({
      id: `${registration?.id || 'registration'}-${index}`,
      action: String(entry?.action || 'Status Updated').trim() || 'Status Updated',
      timestamp: entry?.timestamp || registration?.updatedAt || registration?.createdAt || null,
      status: toCanonicalStatus(registration?.payment?.paymentStatus || registration?.status),
      registrationId: registration?.id || null,
      events: normalizeEvents(registration?.selectedEvents),
    }))
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

const getPaymentsByIdentifiers = (identifiers) =>
  new Promise((resolve, reject) => {
    paymentModel.getPaymentsByUserIdentifiers(identifiers, (err, payments) => {
      if (err) return reject(err);
      return resolve(payments || []);
    });
  });

exports.signup = async (req, res) => {
  const { name, email, password, college, department, phone, year, role } = req.body;
  
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const normalizedRole = String(role || '').trim().toLowerCase();
    const resolvedDepartment =
      normalizedRole === 'industry'
        ? 'Industry'
        : String(department || '').trim() || null;
    
    // Create User
    const result = await User.create({ 
      name, email, password: hashedPassword, college, department: resolvedDepartment, phone, year, role 
    });
    await assignParticipantIdToUser(result);

    const token = jwt.sign({ email: result.email, id: result.id }, secret, { expiresIn: "1h" });

    // Send Email (Catch error so signup doesn't fail if email fails)
    sendWelcomeEmail(result).catch(err => console.error("Email Error:", err.message));

    res.status(201).json({ result, token });
  } catch (error) {
    console.error("Signup Controller Error:", error);
    res.status(500).json({ message: "Something went wrong during signup" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (!existingUser) return res.status(404).json({ message: "User not found" });

    const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

    // Update lastLogin and increment loginCount
    await existingUser.update({ lastLogin: new Date() });
    await existingUser.increment('loginCount');

    const token = jwt.sign({ email: existingUser.email, id: existingUser.id }, secret, { expiresIn: "1h" });

    // Send login alert (do not block login)
    sendLoginAlert(existingUser)
      .then((ok) => {
        if (!ok) console.warn("Login alert email not delivered for:", existingUser.email);
      })
      .catch(err => console.error("Email Error:", err.message));

    res.status(200).json({ result: existingUser, token });
  } catch (error) {
    console.error("Login Controller Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const existingUser = await User.findByPk(userId);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = existingUser.toJSON ? existingUser.toJSON() : { ...existingUser };
    delete userData.password;

    const identifiers = Array.from(new Set([userData.id, userData.email].filter(Boolean)));

    const [registrations, payments] = await Promise.all([
      Registration.findAll({
        where: {
          [Op.or]: [
            userData.id ? { userId: userData.id } : null,
            userData.email ? { contactEmail: userData.email } : null,
          ].filter(Boolean),
        },
        order: [['updatedAt', 'DESC']],
      }),
      getPaymentsByIdentifiers(identifiers),
    ]);

    const paymentHistory = (payments || []).map((paymentRow) => {
      const status = toCanonicalStatus(paymentRow?.status);
      return {
        id: paymentRow?.id || null,
        amount: Number(paymentRow?.amount || 0),
        currency: paymentRow?.currency || 'INR',
        status,
        events: normalizeEvents(paymentRow?.events),
        orderId: paymentRow?.razorpayOrderId || null,
        paymentId: paymentRow?.razorpayPaymentId || null,
        transactionId: paymentRow?.transactionId || null,
        createdAt: paymentRow?.createdAt || null,
        updatedAt: paymentRow?.updatedAt || null,
        canDownloadBill: status === 'Paid',
      };
    });

    const registrationHistory = (registrations || []).map((registration) => {
      const payment = registration?.payment || {};
      return {
        id: registration?.id || null,
        status: toCanonicalStatus(payment?.paymentStatus || registration?.status),
        selectedEvents: normalizeEvents(registration?.selectedEvents),
        amount: Number(payment?.amount || 0),
        transactionId: payment?.transactionId || null,
        paymentDate: payment?.date || null,
        registeredOn: registration?.registeredOn || registration?.createdAt || null,
        updatedAt: registration?.updatedAt || null,
        activityLog: normalizeActivityLog(registration?.activityLog, registration),
      };
    });

    const activityHistory = registrationHistory
      .flatMap((registration) => registration.activityLog)
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    const confirmedEvents = Array.from(
      new Set([
        ...(Array.isArray(userData.registeredEvents) ? userData.registeredEvents : []),
        ...registrationHistory
          .filter((registration) => registration.status === 'Paid')
          .flatMap((registration) => registration.selectedEvents),
        ...paymentHistory
          .filter((payment) => payment.status === 'Paid')
          .flatMap((payment) => payment.events),
      ])
    );

    const summary = {
      totalPayments: paymentHistory.length,
      paidPayments: paymentHistory.filter((payment) => payment.status === 'Paid').length,
      pendingPayments: paymentHistory.filter((payment) => payment.status === 'Pending').length,
      failedPayments: paymentHistory.filter((payment) => payment.status === 'Failed').length,
      totalPaidAmount: paymentHistory
        .filter((payment) => payment.status === 'Paid')
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      confirmedEvents: confirmedEvents.length,
    };

    res.status(200).json({
      profile: {
        id: userData.id,
        participantId: userData.participantId || null,
        name: userData.name,
        email: userData.email,
        role: userData.role || 'Participant',
        organization: userData.college || null,
        college: userData.college || null,
        department: userData.department || null,
        phone: userData.phone || null,
        year: userData.year || null,
        accountStatus: userData.accountStatus || 'active',
        lastLogin: userData.lastLogin || null,
        loginCount: Number(userData.loginCount || 0),
        registeredEvents: confirmedEvents,
        createdAt: userData.createdAt || null,
      },
      summary,
      paymentHistory,
      registrationHistory,
      activityHistory,
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Unable to load profile history' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { userId, email, name, cartEvents = [], cartAmount = 0 } = req.body;
    let userRow = null;
    if (userId) {
      userRow = await User.findOne({ where: { id: userId } });
    }
    if (!userRow && email) {
      userRow = await User.findOne({ where: { email } });
    }
    const participantId = userRow?.participantId || "-";

    // Send pending payment reminder on logout when user has pending selected events
    const whereOr = [];
    if (userId) whereOr.push({ userId });
    if (email) whereOr.push({ contactEmail: email });

    if (whereOr.length > 0) {
      const regs = await Registration.findAll({
        where: { [Op.or]: whereOr },
        order: [['updatedAt', 'DESC']]
      });

      const pendingReg = (regs || []).find((reg) => {
        const paymentStatus = String(reg?.payment?.paymentStatus || '').toLowerCase();
        const hasEvents = Array.isArray(reg?.selectedEvents) && reg.selectedEvents.length > 0;
        const isPending = paymentStatus !== 'paid';
        return hasEvents && isPending;
      });

      if (pendingReg && email) {
        const mergedEvents = Array.from(
          new Set([
            ...((Array.isArray(pendingReg?.selectedEvents) ? pendingReg.selectedEvents : []).map((e) => String(e).trim()).filter(Boolean)),
            ...(Array.isArray(cartEvents) ? cartEvents.map((e) => String(e).trim()).filter(Boolean) : []),
          ])
        );
        const mergedAmount =
          Number(cartAmount || 0) > 0
            ? Number(cartAmount || 0)
            : Number(pendingReg?.payment?.amount || 0);

        if (mergedEvents.length > 0) {
          try {
            await pendingReg.update({
              selectedEvents: mergedEvents,
              payment: {
                ...(pendingReg.payment || {}),
                amount: mergedAmount,
                paymentStatus: "Pending",
              },
              status: "Pending",
            });
          } catch (syncErr) {
            console.warn("Pending registration sync failed on logout:", syncErr?.message || syncErr);
          }
        }

        const sent = await sendRegistrationReminderEmail(
          {
            name: name || 'Participant',
            email,
            participantId,
            userId,
          },
          pendingReg.id,
          {
            participantId,
            amount: mergedAmount,
            events: mergedEvents,
            email,
          }
        );
        if (!sent) {
          console.warn("Pending reminder email failed on logout for:", email);
        }
      } else if (email && Array.isArray(cartEvents) && cartEvents.length > 0) {
        // Fallback: if DB pending row is not yet visible, use cart data sent from frontend logout.
        const sent = await sendRegistrationReminderEmail(
          {
            name: name || 'Participant',
            email,
            participantId,
            userId,
          },
          'PENDING-CART',
          {
            participantId,
            amount: cartAmount || 0,
            events: cartEvents,
            email,
          }
        );
        if (!sent) {
          console.warn("Pending cart reminder email failed on logout for:", email);
        }
      }
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
};

// Admin login endpoint: creates admin user if missing and returns JWT
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const ADMIN_PASS = process.env.ADMIN_PASS || 'necadmin123';

    // Only allow known admin credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASS) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Find existing admin user or create one
    let adminUser = await User.findOne({ where: { email } });
    if (!adminUser) {
      const hashed = await bcrypt.hash(ADMIN_PASS, 12);
      adminUser = await User.create({
        name: 'Administrator',
        email: ADMIN_EMAIL,
        password: hashed,
        college: 'NEC',
        department: 'Admin',
        phone: '0000000000',
        year: 'NA',
        isAdmin: true,
        role: 'admin',
        lastLogin: new Date(),
        loginCount: 1
      });
    } else {
      await adminUser.update({ lastLogin: new Date() });
      await adminUser.increment('loginCount');
    }

    const token = jwt.sign({ email: adminUser.email, id: adminUser.id }, secret, { expiresIn: '8h' });
    res.status(200).json({ result: adminUser, token });
  } catch (err) {
    console.error('Admin Login Error:', err);
    res.status(500).json({ message: 'Admin login failed' });
  }
};
