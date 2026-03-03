const express = require('express');
const router = express.Router();
const { recordAction, queryLogs } = require('../controller/trackController');

// POST /conference/track/action  -> record an action
router.post('/action', recordAction);

// GET /conference/track/logs -> query recent logs (admin)
router.get('/logs', queryLogs);

module.exports = router;
// (duplicates removed) keep endpoints: POST /action and GET /logs
