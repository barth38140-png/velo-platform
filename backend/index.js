// Entrypoint: delegate to `src/index.js` so the same app is used for tests and container runs
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { start } = require('./src/index');
const PORT = process.env.PORT || 3010;

const logger = require('./src/logger');

start(PORT).then(() => {
  logger.info({ port: PORT }, 'Server started via src/index');
}).catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});




