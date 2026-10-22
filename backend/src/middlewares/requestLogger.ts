import morgan from 'morgan';
import { logger } from '../lib/logger.js';

const stream = {
  write: (message: string) => logger.info(message.trim()),
};

export const requestLogger = morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  { stream }
);
