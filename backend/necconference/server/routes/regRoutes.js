const express = require('express');
const router = express.Router();
const { registerUser } = require('../controller/regController');

// Matches POST /conference/registration/register
router.post('/register', registerUser);

module.exports = router;