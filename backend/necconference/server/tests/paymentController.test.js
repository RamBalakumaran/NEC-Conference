const request = require('supertest');
const express = require('express');
const bodyParser = require('express').json;

// controllers and dependencies to mock
const paymentController = require('../controller/paymentController');
const { paymentModel } = require('../model/paymentModel');
const razorpayService = require('../service/razorpayService');

jest.mock('../model/paymentModel', () => ({
  paymentModel: {
    getPendingPayment: jest.fn(),
    createPayment: jest.fn(),
    getPaymentByOrderId: jest.fn(),
    updatePaymentStatus: jest.fn(),
  }
}));

jest.mock('../service/razorpayService', () => ({
  createOrder: jest.fn(),
  verifyPaymentSignature: jest.fn(),
}));

const app = express();
app.use(bodyParser());
app.post('/payment/create-order', paymentController.createOrder);
app.post('/payment/verify', paymentController.verify);

// simple helper to reset mocks
const resetAll = () => {
  jest.clearAllMocks();
};

describe('paymentController', () => {
  afterEach(resetAll);

  describe('POST /payment/create-order', () => {
    test('returns 400 when userId missing', async () => {
      const res = await request(app).post('/payment/create-order').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/userId required/);
    });

    test('returns existing pending order when one exists', async () => {
      // pending payment amount stored in rupees now
      paymentModel.getPendingPayment.mockImplementation((userId, cb) => cb(null, { razorpayOrderId: 'ord123', amount: 15, currency: 'INR' }));
      const res = await request(app).post('/payment/create-order').send({ userId: 'u1' });
      expect(res.status).toBe(200);
      expect(res.body.orderId).toBe('ord123');
    });

    test('creates new order when none pending (fallback amount)', async () => {
      paymentModel.getPendingPayment.mockImplementation((userId, cb) => cb(null, null));
      razorpayService.createOrder.mockResolvedValue({ success: true, order: { id: 'ordXYZ', amount: 1000, currency: 'INR' } });

      const res = await request(app).post('/payment/create-order').send({ userId: 'u2', events: ['e1'] });
      expect(res.status).toBe(200);
      expect(res.body.orderId).toBe('ordXYZ');
      // since no amount is provided, fallback rupees 10 should be stored
      expect(paymentModel.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u2', events: ['e1'], amount: 10 }),
        expect.any(Function)
      );
      // verify notes not include upiId when none provided
      expect(razorpayService.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({ notes: { userId: 'u2' } })
      );
    });

    test('uses provided amount correctly', async () => {
      paymentModel.getPendingPayment.mockImplementation((userId, cb) => cb(null, null));
      razorpayService.createOrder.mockResolvedValue({ success: true, order: { id: 'ordABC', amount: 1500, currency: 'INR' } });

      const upi = 'tester@upi';
      const res = await request(app).post('/payment/create-order').send({ userId: 'u3', events: ['e2'], amount: 15, upiId: upi });
      expect(res.status).toBe(200);
      expect(res.body.orderId).toBe('ordABC');
      expect(paymentModel.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u3', events: ['e2'], amount: 15 }),
        expect.any(Function)
      );
      // ensure the upiId gets forwarded into the Razorpay notes
      expect(razorpayService.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({ notes: { userId: 'u3', upiId: upi } })
      );
    });
  });

  describe('POST /payment/verify', () => {
    test('returns 400 when signature invalid', async () => {
      razorpayService.verifyPaymentSignature.mockReturnValue({ valid: false, error: 'bad' });
      const res = await request(app)
        .post('/payment/verify')
        .send({ razorpayOrderId: 'o1', razorpayPaymentId: 'p1', razorpaySignature: 'sig' });
      expect(res.status).toBe(400);
      expect(res.body.verified).toBe(false);
    });

    test('marks payment captured when signature valid', async () => {
      razorpayService.verifyPaymentSignature.mockReturnValue({ valid: true });
      // our model signature is (orderId, status, paymentId, transactionId, callback)
      paymentModel.updatePaymentStatus.mockImplementation(
        (orderId, status, paymentId, transactionId, cb) => cb(null)
      );

      const res = await request(app)
        .post('/payment/verify')
        .send({ razorpayOrderId: 'o2', razorpayPaymentId: 'p2', razorpaySignature: 'sig' });

      expect(res.status).toBe(200);
      expect(res.body.verified).toBe(true);
      // upiId not sent so it should be null/undefined
      expect(res.body.upiId).toBeUndefined();
      expect(paymentModel.updatePaymentStatus).toHaveBeenCalledWith(
        'o2',
        'captured',
        'p2',
        null,
        expect.any(Function)
      );
    });

    test('verify accepts upiId without breaking behaviour', async () => {
      razorpayService.verifyPaymentSignature.mockReturnValue({ valid: true });
      paymentModel.updatePaymentStatus.mockImplementation((orderId, status, paymentId, transactionId, cb) => cb(null));

      const res = await request(app)
        .post('/payment/verify')
        .send({ razorpayOrderId: 'o3', razorpayPaymentId: 'p3', razorpaySignature: 'sig', upiId: 'user@upi' });

      expect(res.status).toBe(200);
      expect(res.body.verified).toBe(true);
      expect(res.body.upiId).toBe('user@upi');
      expect(paymentModel.updatePaymentStatus).toHaveBeenCalledWith(
        'o3',
        'captured',
        'p3',
        null,
        expect.any(Function)
      );
    });
  });
});
