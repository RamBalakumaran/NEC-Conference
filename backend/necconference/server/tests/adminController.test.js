const request = require('supertest');
const express = require('express');
const bodyParser = require('express').json;

// avoid loading the real sequelize models (which set up associations) during tests
jest.mock('../model', () => ({ sequelize: {} }));

const adminController = require('../controller/adminController');
const Registration = require('../model/Registration');

jest.mock('../model/Registration', () => {
  return jest.fn().mockImplementation(() => ({}));
});

// We'll override static methods we need later by attaching to Registration
Registration.findByPk = jest.fn();

const app = express();
app.use(bodyParser());
app.post('/attendance/bulk', adminController.markAttendanceBulk);

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
});
