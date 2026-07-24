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
        res.status(404).json({ erro: 'Register not found.' });
        return;
      case 'P2003':
        res.status(400).json({ erro: 'Invalid reference (related item does not exist).' });
        return;
      case 'P2002':
        res.status(409).json({ erro: 'A record with this unique value already exists.' });
        return;
      default:
        res.status(400).json({ erro: 'Error processing the request.' });
        return;
    }
  }

  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}