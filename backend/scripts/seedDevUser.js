/**
 * Create or reset the local dev login user.
 * Usage: node scripts/seedDevUser.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const { resolveMongoUri } = require('../config/db');

const DEV_EMAIL = 'malar@gmail.com';
const DEV_PASSWORD = 'Family1234';
const DEV_NAME = 'Malaravan';

async function main() {
  const uri = resolveMongoUri();
  await mongoose.connect(uri);

  let user = await User.findOne({ email: DEV_EMAIL }).select('+password');
  if (user) {
    user.password = DEV_PASSWORD;
    user.fullName = DEV_NAME;
    user.isActive = true;
    await user.save();
    console.log(`Updated dev user: ${DEV_EMAIL}`);
  } else {
    user = await User.create({
      fullName: DEV_NAME,
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
      role: 'admin',
    });
    console.log(`Created dev user: ${DEV_EMAIL}`);
  }

  console.log(`Password: ${DEV_PASSWORD}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
