import morgan from 'morgan';
import { logger } from '../lib/logger.js';

const stream = {
  write: (message: string) => logger.info(message.trim()),
};

// 'combined' inclui IP/user-agent (útil atrás de proxy/CDN em produção);
// 'dev' é mais enxuto para desenvolvimento local.
export const requestLogger = morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  { stream }
);