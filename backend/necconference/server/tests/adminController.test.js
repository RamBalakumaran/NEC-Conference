const request = require('supertest');
const express = require('express');
const bodyParser = require('express').json;

// avoid loading the real sequelize models (which set up associations) during tests
jest.mock('../model', () => ({ sequelize: {} }));

const adminController = require('../controller/adminController');
const Registration = require('../model/Registration');
const User = require('../model/User');

jest.mock('../model/Registration', () => {
  return jest.fn().mockImplementation(() => ({}));
});
jest.mock('../model/User', () => ({
  findOne: jest.fn()
}));

// We'll override static methods we need later by attaching to Registration
Registration.findByPk = jest.fn();

const app = express();
app.use(bodyParser());
app.post('/attendance/bulk', adminController.markAttendanceBulk);
app.patch('/account-status', adminController.updateAccountStatus);

describe('adminController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /attendance/bulk', () => {
    test('returns 400 if updates is not array', async () => {
      const res = await request(app).post('/attendance/bulk').send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/updates array required/);
    });

    test('iterates and updates registrations when provided', async () => {
      // setup mocks
      const dummyReg = { attendance: { day1: false }, update: jest.fn() };
      Registration.findByPk.mockResolvedValue(dummyReg);

      const updates = [
        { registrationId: 'r1', attendance: { day1: true } },
        { registrationId: 'temp_xyz', attendance: { day1: true } }, // should be skipped
        { registrationId: 'r2', attendance: { day2: true } },
      ];

      const res = await request(app).post('/attendance/bulk').send({ updates });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/Bulk attendance updated/);
      expect(Registration.findByPk).toHaveBeenCalledWith('r1');
      expect(Registration.findByPk).toHaveBeenCalledWith('r2');
      // two updates called
      expect(dummyReg.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('PATCH /account-status', () => {
    test('returns 400 for an invalid status value', async () => {
      const res = await request(app)
        .patch('/account-status')
        .send({ userId: 'u1', status: 'paused' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/status must be active or inactive/);
    });

    test('updates a user account status in the backend', async () => {
      const update = jest.fn().mockResolvedValue();
      User.findOne.mockResolvedValue({
        id: 'u1',
        email: 'demo@example.com',
        accountStatus: 'active',
        update
      });

      const res = await request(app)
        .patch('/account-status')
        .send({ userId: 'u1', status: 'inactive' });

      expect(res.status).toBe(200);
      expect(User.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
      expect(update).toHaveBeenCalledWith({ accountStatus: 'inactive' });
      expect(res.body).toMatchObject({
        userId: 'u1',
        email: 'demo@example.com',
        status: 'inactive'
      });
    });
  });
});
