const express = require('express');
const router = express.Router();

// Destructure ALL exported functions
const { 
    getAllRegistrations, 
    markAttendance, 
    markAttendanceBulk,
    getActiveUsers,
    getDepartmentAnalytics,
    getEventAnalytics,
    getAllEvents,
    sendPendingPaymentReminders,
    exportLogsToExcel,
    getLogs,
    exportRegistrationsToExcel
} = require('../controller/adminController');

// Define Routes
// Note: Middleware like 'authAdmin' can be added here if you have it

// 1. Main Data
router.get('/registrations', getAllRegistrations);

// 2. Attendance
router.post('/attendance', markAttendance);
router.post('/attendance/bulk', markAttendanceBulk); // accept array of updates

// 3. Analytics & Charts
router.get('/active-users', getActiveUsers);
router.get('/analytics/department', getDepartmentAnalytics);
router.get('/analytics/events', getEventAnalytics);
router.get('/events/all', getAllEvents);

// 4. Emails
router.post('/send-payment-reminders', sendPendingPaymentReminders);

// 5. Exports / Logs
router.get('/logs', getLogs);
router.get('/registrations/export-logs', exportLogsToExcel);
router.get('/registrations/export', exportRegistrationsToExcel);

module.exports = router;