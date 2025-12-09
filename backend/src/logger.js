const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? {
        targets: [
          {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname'
            },
            level: 'debug'
          },
          {
            target: 'pino/file',
            options: { destination: './backend/logs/app.log', mkdir: true },
            level: 'info'
          }
        ]
      }
    : {
        target: 'pino/file',
        options: { destination: './backend/logs/app.log', mkdir: true },
        level: 'info'
      },
  // formatters supprimé car incompatible avec transport.targets
  base: {
    env: process.env.NODE_ENV || 'development'
  }
});

module.exports = logger;
