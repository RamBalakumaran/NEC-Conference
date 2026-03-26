jest.mock('../model/User', () => ({
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../model/Registration', () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../model/paymentModel', () => ({
  paymentModel: {
    getPaymentsByUserIdentifiers: jest.fn(),
  },
}));

jest.mock('../service/participantIdService', () => ({
  assignParticipantIdToUser: jest.fn(),
}));

jest.mock('../config/email', () => ({
  sendWelcomeEmail: jest.fn(),
  sendLoginAlert: jest.fn(),
  sendRegistrationReminderEmail: jest.fn(),
}));

const User = require('../model/User');
const Registration = require('../model/Registration');
const { paymentModel } = require('../model/paymentModel');
const authController = require('../controller/authController');

const buildRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('authController.getProfile', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns profile, payment history, and summary for the authenticated user', async () => {
    User.findByPk.mockResolvedValue({
      toJSON: () => ({
        id: 'user-1',
        participantId: 'NEC001',
        name: 'Asha',
        email: 'asha@example.com',
        role: 'student',
        college: 'NEC',
        department: 'CSE',
        phone: '9876543210',
        year: '3',
        accountStatus: 'active',
        loginCount: 4,
        registeredEvents: ['Hackathon'],
        createdAt: '2026-03-01T10:00:00.000Z',
        password: 'hidden',
      }),
    });

    Registration.findAll.mockResolvedValue([
      {
        id: 'reg-1',
        status: 'Paid',
        selectedEvents: ['Hackathon', 'Paper Presentation'],
        payment: {
          paymentStatus: 'Paid',
          amount: 500,
          transactionId: 'txn_123',
          date: '2026-03-10T10:30:00.000Z',
        },
        activityLog: [
          { action: 'Registration Created', timestamp: '2026-03-10T10:00:00.000Z' },
          { action: 'Payment Successful', timestamp: '2026-03-10T10:30:00.000Z' },
        ],
        registeredOn: '2026-03-10T10:00:00.000Z',
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:30:00.000Z',
      },
    ]);

    paymentModel.getPaymentsByUserIdentifiers.mockImplementation((identifiers, callback) => {
      callback(null, [
        {
          id: 1,
          userId: 'asha@example.com',
          events: JSON.stringify(['Hackathon', 'Paper Presentation']),
          amount: 500,
          currency: 'INR',
          razorpayOrderId: 'order_123',
          razorpayPaymentId: 'pay_123',
          transactionId: 'txn_123',
          status: 'Paid',
          createdAt: '2026-03-10T10:00:00.000Z',
          updatedAt: '2026-03-10T10:30:00.000Z',
        },
      ]);
    });

    const req = { user: { id: 'user-1' } };
    const res = buildRes();

    await authController.getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];

    expect(payload.profile.email).toBe('asha@example.com');
    expect(payload.profile.participantId).toBe('NEC001');
    expect(payload.summary.paidPayments).toBe(1);
    expect(payload.summary.totalPaidAmount).toBe(500);
    expect(payload.paymentHistory[0]).toEqual(
      expect.objectContaining({
        status: 'Paid',
        canDownloadBill: true,
        orderId: 'order_123',
        paymentId: 'pay_123',
      })
    );
    expect(payload.activityHistory[0].action).toBe('Payment Successful');
  });

  test('returns 404 when the authenticated user no longer exists', async () => {
    User.findByPk.mockResolvedValue(null);

    const req = { user: { id: 'missing-user' } };
    const res = buildRes();

    await authController.getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });
});
