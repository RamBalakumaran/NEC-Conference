const express = require('express');
const router = express.Router();
const authUser = require('../middleware/authUser');

// FIX: Added 'logout' to the import list
const { login, signup, logout, adminLogin, getProfile } = require('../controller/authController');

// Matches /conference/auth/login & /signup
router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', logout);
router.post('/admin-login', adminLogin);
router.get('/profile', authUser, getProfile);

module.exports = router;
