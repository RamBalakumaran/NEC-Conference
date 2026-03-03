const request = require('supertest');
const express = require('express');
const bodyParser = require('express').json;

const trackController = require('../controller/trackController');
const ActionLog = require('../model/ActionLog');
const User = require('../model/User');
const emailer = require('../config/email');

jest.mock('../model/ActionLog');
jest.mock('../model/User');
jest.mock('../config/email', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(),
  sendLoginAlert: jest.fn().mockResolvedValue(),
  sendCartChangeEmail: jest.fn().mockResolvedValue(),
  sendRegistrationReminderEmail: jest.fn().mockResolvedValue(),
  sendEventBookConfirmationEmail: jest.fn().mockResolvedValue(),
  sendFailedPaymentEmail: jest.fn().mockResolvedValue(),
  sendAdminNotification: jest.fn().mockResolvedValue()
}));

const app = express();
app.use(bodyParser());
app.post('/action', trackController.recordAction);

describe('trackController.recordAction', () => {
  afterEach(() => jest.clearAllMocks());

  test('records an action and returns 201', async () => {
    ActionLog.create = jest.fn().mockResolvedValue(true);
    User.findOne = jest.fn().mockResolvedValue(null);

    const payload = { action: 'login', email: 'a@b.com', details: { name: 'A' } };
    const res = await request(app).post('/action').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(ActionLog.create).toHaveBeenCalled();
  }, 10000);
});
