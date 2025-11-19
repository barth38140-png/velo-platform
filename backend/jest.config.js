module.exports = {
  testEnvironment: "node",
  testTimeout: 10000,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: { branches: 40, functions: 50, lines: 60, statements: 60 }
  }
};
