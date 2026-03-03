require('dotenv').config();
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');

async function seed() {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@necconf.local';
    const adminPass = process.env.ADMIN_PASS || 'Admin@1234';

    const existing = await User.findOne({ where: { email: adminEmail } });
    if (existing) {
      await existing.update({ isAdmin: true, role: 'admin' });
      console.log('Updated existing user to admin:', adminEmail);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(adminPass, 12);
    const admin = new User({
      name: 'Administrator',
      email: adminEmail,
      password: hashed,
      college: 'NA',
      department: 'Admin',
      phone: '0000000000',
      year: 'NA',
      isAdmin: true,
      role: 'admin'
    });
    await admin.save();
    console.log('Admin user created:', adminEmail);
    console.log('Use ADMIN_EMAIL and ADMIN_PASS env vars to override.');
    process.exit(0);
  } catch (err) {
    console.error('Seed Admin Error:', err);
    process.exit(1);
  }
}

seed();
