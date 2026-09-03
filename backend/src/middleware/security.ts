import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const securityHeaders = helmet();

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'backend.seguranca.muitas_requisicoes' },
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'backend.seguranca.muitas_tentativas_login' },
});

export const rfidLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'backend.seguranca.muitas_tentativas_rfid' },
});

export const rfidProvisionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) => `admin:${req.user?.sub ?? 'unknown'}:ip:${ipKeyGenerator(req.ip ?? '')}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'backend.seguranca.muitas_provisionamentos_rfid' },
});