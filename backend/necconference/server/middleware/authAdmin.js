const jwt = require('jsonwebtoken');
const User = require('../model/User');

const secret = process.env.JWT_SECRET || 'NEC_CONFERENCE_SECRET_KEY_2025';

// Checks Authorization: Bearer <token> and ensures user has admin privileges
module.exports = async function (req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });

    const token = auth.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Invalid token' });

    const decoded = jwt.verify(token, secret);
    if (!decoded?.id) return res.status(401).json({ message: 'Invalid token payload' });

    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    // Accept either explicit isAdmin flag or role === 'admin' / 'Admin'
    const isAdmin = user.isAdmin === true || (user.role && String(user.role).toLowerCase() === 'admin');
    if (!isAdmin) return res.status(403).json({ message: 'Admin access required' });

    req.user = user;
    next();
  } catch (err) {
    console.error('Admin Auth Error:', err?.message || err);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};
