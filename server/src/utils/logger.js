const logLevels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = logLevels[process.env.LOG_LEVEL || 'info'];

const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  return {
    timestamp,
    level,
    message,
    ...meta,
  };
};

const logger = {
  debug: (message, meta) => {
    if (currentLevel <= logLevels.debug) {
      console.log(JSON.stringify(formatLog('debug', message, meta)));
    }
  },
  info: (message, meta) => {
    if (currentLevel <= logLevels.info) {
      console.log(JSON.stringify(formatLog('info', message, meta)));
    }
  },
  warn: (message, meta) => {
    if (currentLevel <= logLevels.warn) {
      console.warn(JSON.stringify(formatLog('warn', message, meta)));
    }
  },
  error: (message, meta) => {
    if (currentLevel <= logLevels.error) {
      console.error(JSON.stringify(formatLog('error', message, meta)));
    }
  },
};

export default logger;
