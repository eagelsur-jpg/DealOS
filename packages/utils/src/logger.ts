import pino, { type Logger, type LoggerOptions } from 'pino';

const defaultOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: ['req.headers.authorization', 'password', 'token', '*.apiKey'],
    censor: '[REDACTED]'
  }
};

export const createLogger = (options?: LoggerOptions): Logger =>
  pino({
    ...defaultOptions,
    ...options
  });

export const logger = createLogger();
