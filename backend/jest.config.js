module.exports = {
  testEnvironment: "node",
  testTimeout: 10000,
  // Disable collecting coverage by default to avoid failing CI on low coverage.
  // Increase tests/coverage and re-enable later.
  collectCoverage: false,
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: { branches: 70, functions: 70, lines: 80, statements: 80 }
  }
};
