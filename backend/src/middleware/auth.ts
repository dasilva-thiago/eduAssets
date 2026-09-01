import type { NextFunction, Request, Response } from 'express';
import { verifyToken, AppJwtPayload } from '../lib/jwt.js';
import { registrarAtividadeAdmin, sessaoAdminExpirada, limparAtividadeAdmin } from '../lib/adminActivity.js';

declare global {
  namespace Express {
    interface Request {
      user?: AppJwtPayload;
    }
  }
}


export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ erro: 'backend.auth.autenticacao_necessaria' });
    return;
  }

  let payload: AppJwtPayload;
  try {
    payload = verifyToken(header.slice(7));
  } catch {
    res.status(401).json({ erro: 'backend.auth.token_invalido' });
    return;
  }

  if (payload.nivelAcesso === 'ADMINISTRADOR') {
    if (sessaoAdminExpirada(payload.sub)) {
      limparAtividadeAdmin(payload.sub);
      res.status(401).json({ erro: 'backend.auth.sessao_expirada', sessaoExpirada: true });
      return;
    }
    registrarAtividadeAdmin(payload.sub);
  }

  req.user = payload;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.nivelAcesso !== 'ADMINISTRADOR') {
      res.status(403).json({ erro: 'backend.auth.acesso_restrito_admin' });
      return;
    }
    next();
  });
}