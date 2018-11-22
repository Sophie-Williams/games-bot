const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, json, simple } = format;

const logger = createLogger({
  transports: [
    new transports.Console({
      format: combine(timestamp(), colorize(), json(), simple())
    })
  ]
});

module.exports = client => {
  client.log = logger.info;
  client.error = logger.error;
};
