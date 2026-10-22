import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { loginSchema, alterarSenhaSchema, rfidScanSchema } from '../schemas/index.js';
import {
  loginRateLimiter,
  rfidLoginRateLimiter,
  changePasswordRateLimiter,
} from '../middlewares/security.js';
import * as authController from '../controllers/auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', loginRateLimiter, validateBody(loginSchema), authController.login);
authRouter.get('/me', requireAuth, authController.me);
authRouter.patch(
  '/senha',
  changePasswordRateLimiter,
  requireAuth,
  validateBody(alterarSenhaSchema),
  authController.alterarSenha
);
authRouter.post('/rfid', rfidLoginRateLimiter, validateBody(rfidScanSchema), authController.loginRfid);