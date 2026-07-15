module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    'src/utils/**/*.js',
    'src/services/**/*.js',
    'src/routes/**/*.js',
    'src/controllers/**/*.js',
    '!src/app.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // 测试超时设置
  testTimeout: 10000,
}
