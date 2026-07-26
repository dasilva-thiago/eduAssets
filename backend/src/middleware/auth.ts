import type { NextFunction, Request, Response } from 'express';
import { verifyToken, AppJwtPayload } from '../lib/jwt.js';
import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: AppJwtPayload;
    }
  }
}

/**
 * Middleware para exigir autenticação.
 * Modelo atual do projeto é binário (Guest / Admin), conforme GuestMode.md.
 * Qualquer Usuario autenticado é tratado como Admin. nivelAcesso já fica
 * disponível em req.user para permissões mais granulares no futuro
 * (ex: EDITOR com acesso parcial).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ erro: 'Autenticação necessária.' });
    return;
  }

  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}