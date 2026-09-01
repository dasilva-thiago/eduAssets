import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2025':
        res.status(404).json({ erro: 'backend.geral.registro_nao_encontrado' });
        return;
      case 'P2003':
        res.status(400).json({ erro: 'backend.geral.referencia_invalida' });
        return;
      case 'P2002':
        res.status(409).json({ erro: 'backend.geral.registro_duplicado' });
        return;
      default:
        res.status(400).json({ erro: 'backend.geral.erro_processar_requisicao' });
        return;
    }
  }

  console.error(err);
  res.status(500).json({ erro: 'backend.geral.erro_interno' });
}