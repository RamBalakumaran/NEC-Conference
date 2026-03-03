const request = require('supertest');
const express = require('express');
const bodyParser = require('express').json;

// mocks for Registration and User to avoid DB
jest.mock('../model/Registration');
jest.mock('../model/User');
// stub out email helper to avoid actual network or open handles
jest.mock('../config/email', () => ({ sendEventBookConfirmationEmail: jest.fn().mockResolvedValue() }));

const Registration = require('../model/Registration');
const regController = require('../controller/regController');

// simple express app for testing
const app = express();
app.use(bodyParser());
app.post('/registration/register', regController.registerUser);

describe('regController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create new registration with events when none exists', async () => {
    Registration.findOne = jest.fn().mockResolvedValue(null);
    Registration.create = jest.fn().mockResolvedValue({ id: 'reg1' });

    const payload = { userId: 'u1', email: 'a@b.com', name: 'Alice', paymentStatus: true, amount: 10, events: [{name:'E1'}] };
    const res = await request(app).post('/registration/register').send(payload);
    expect(res.status).toBe(200);
    expect(Registration.create).toHaveBeenCalledWith(expect.objectContaining({ selectedEvents: payload.events }));
    expect(res.body.registrationId).toBe('reg1');
  });

  test('should update existing registration events and payment info', async () => {
    const existing = {
      id: 'reg2',
      selectedEvents: [],
      attendance: {},
      payment: {},
      activityLog: [],
      save: jest.fn()
    };
    Registration.findOne = jest.fn().mockResolvedValue(existing);

    const payload = { userId: 'u2', email: 'b@c.com', paymentStatus: true, amount: 15, events: [{name:'E2'}] };
    const res = await request(app).post('/registration/register').send(payload);
    expect(res.status).toBe(200);
    expect(existing.selectedEvents).toEqual(payload.events);
    expect(existing.save).toHaveBeenCalled();
  });
});