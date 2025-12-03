module.exports = {
  testEnvironment: "node",
  testTimeout: 10000,
  // Reset module registry between each test file to avoid mocked modules leaking
  resetModules: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: { branches: 40, functions: 50, lines: 60, statements: 60 }
  }
};
