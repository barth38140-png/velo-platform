const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser = {}, launchOptions) => {
        // Common flags to make Chromium/Electron stable in headless/CI environments
        const disableGpuFlags = [
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
        ];

        if (browser.family === 'chromium' && Array.isArray(launchOptions.args)) {
          launchOptions.args.push(...disableGpuFlags);
          return launchOptions;
        }

        if (browser.name === 'electron') {
          launchOptions.args = launchOptions.args || [];
          launchOptions.args.push(...disableGpuFlags);
          return launchOptions;
        }

        return launchOptions;
      });

      return config;
    }
  }
});
