const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, json, simple } = format;

const logger = createLogger({
  transports: [
    new transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: false,
      format: combine(timestamp(), colorize(), json(), simple())
    })
  ]
});

module.exports = client => {
  client.error = logger.error;
  client.info = logger.info;
  client.verbose = logger.verbose;
  client.debug = logger.debug;
};
