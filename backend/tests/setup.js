/**
 * Shared test setup.
 *
 * Connects once to a dedicated test database — never the development one —
 * and clears it between test files so no test can depend on another's data.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_at_least_32_chars';
process.env.JWT_EXPIRE = '1h';
process.env.JWT_REFRESH_EXPIRE = '7d';
// Rate limiting would reject the suite's rapid registrations; the limiter
// itself is covered by its own assertions rather than left to throttle here.
process.env.RATE_LIMIT_MAX = '1000000';
process.env.AUTH_RATE_LIMIT_MAX = '1000000';
process.env.DISABLE_REMINDER_SCHEDULER = 'true';

const mongoose = require('mongoose');

const TEST_DB_URI =
  process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/family_connect_test';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }

  // Guard against ever pointing the suite at a real database: the tests drop
  // collections, and doing that to development data would be unrecoverable.
  const dbName = mongoose.connection.name;
  if (!/test/i.test(dbName)) {
    throw new Error(
      `Refusing to run tests against database "${dbName}" — the name must contain "test".`,
    );
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

/** Wipe every collection so each test file starts from a known empty state. */
global.clearDatabase = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
};

beforeEach(async () => {
  await global.clearDatabase();
});
