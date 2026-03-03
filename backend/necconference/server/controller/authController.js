const User = require('../model/User'); 
const Registration = require('../model/Registration');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { assignParticipantIdToUser } = require('../service/participantIdService');

// FIX: Ensure this path matches your actual file structure
// In previous steps, we created it in ../service/emailService
const { sendWelcomeEmail, sendLoginAlert, sendRegistrationReminderEmail } = require('../config/email'); 

const secret = process.env.JWT_SECRET || "NEC_CONFERENCE_SECRET_KEY_2025";

exports.signup = async (req, res) => {
  const { name, email, password, college, department, phone, year, role } = req.body;
  
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create User
    const result = await User.create({ 
      name, email, password: hashedPassword, college, department, phone, year, role 
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
