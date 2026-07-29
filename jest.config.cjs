module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: [
    '/tests/tree/test_integration.test.js',
    '/tests/tree/test_runtime_supplement.test.js',
  ],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  maxWorkers: 1,
};
