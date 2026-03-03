const express = require('express');
const router = express.Router();

// FIX: Added 'logout' to the import list
const { login, signup, logout, adminLogin } = require('../controller/authController');

// Matches /conference/auth/login & /signup
router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', logout);
router.post('/admin-login', adminLogin);

module.exports = router;