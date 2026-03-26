const jwt = require('jsonwebtoken');
const User = require('../model/User');

const secret = process.env.JWT_SECRET || 'NEC_CONFERENCE_SECRET_KEY_2025';

module.exports = async function authUser(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization || '';
    if (!auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing token' });
    }

    const token = auth.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const decoded = jwt.verify(token, secret);
    if (!decoded?.id) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('User Auth Error:', error?.message || error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};
