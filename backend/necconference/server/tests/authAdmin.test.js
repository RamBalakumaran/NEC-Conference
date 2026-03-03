const jwt = require('jsonwebtoken');
const authAdmin = require('../middleware/authAdmin');
const User = require('../model/User');

jest.mock('../model/User');

const secret = process.env.JWT_SECRET || 'NEC_CONFERENCE_SECRET_KEY_2025';

describe('authAdmin middleware', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns 401 if Authorization header missing', async () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await authAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 403 if user is not admin', async () => {
    const token = jwt.sign({ id: 'uid' }, secret);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    // Mock findByPk to simulate Sequelize response
    User.findByPk.mockReturnValue(Promise.resolve({ id: 'uid', isAdmin: false, role: 'user' }));

    await authAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('calls next when user is admin', async () => {
    const token = jwt.sign({ id: 'uid' }, secret);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    User.findByPk.mockReturnValue(Promise.resolve({ id: 'uid', isAdmin: true, role: 'admin' }));

    await authAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
