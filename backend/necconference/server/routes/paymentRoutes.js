const express = require('express');
const router = express.Router();
const paymentController = require('../controller/paymentController');
// potential middlewares: auth check (not implemented above)

router.get('/user-payments', paymentController.getUserPayments);
router.get('/all-payments', paymentController.getAllPayments);
router.get('/status/:orderId', paymentController.getStatus);
router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verify);
router.post('/failure', paymentController.failure);

module.exports = router;