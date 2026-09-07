/**
 * Jest configuration — proposal §6.4 ("Perform unit testing using Jest").
 *
 * Integration tests share one MongoDB connection and one Express app, so they
 * run in band (see the npm script) rather than in parallel workers fighting
 * over the same test database.
 */
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  // Integration tests hit a real database; the default 5s is too tight.
  testTimeout: 30000,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  // Surface anything that leaks a handle rather than hanging silently.
  detectOpenHandles: false,
  forceExit: true,
  verbose: true,
};
