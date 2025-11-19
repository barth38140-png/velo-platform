module.exports = {
  testEnvironment: "node",
  testTimeout: 10000,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: { branches: 70, functions: 70, lines: 80, statements: 80 }
  }
};
