const baseConfig = require('./jest.config.cjs');

module.exports = {
  ...baseConfig,
  testMatch: [
    '**/tests/tree/test_integration.test.js',
    '**/tests/tree/test_runtime_supplement.test.js',
  ],
  testPathIgnorePatterns: [],
  testTimeout: 120000,
};
