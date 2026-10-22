import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger.js';
import { AppError } from '../errors/AppError.js';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  // Erro de parse de JSON malformado
  if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status: unknown }).status === 400 &&
    'body' in err
  ) {
    res.status(400).json({ erro: 'backend.geral.json_invalido' });
    return;
  }

  // Erros operacionais/de negócio da aplicação
  if (err instanceof AppError) {
    res.status(err.status).json({
      erro: err.chaveI18n,
      ...(err.extra ?? {}),
    });
    return;
  }

  // Erros conhecidos do Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.warn(`Prisma known error [${err.code}] em ${req.method} ${req.originalUrl}: ${err.message}`);

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

  // Erros inesperados: loga stack completa, responde mensagem genérica segura
  const erroFormatado = err instanceof Error
    ? { message: err.message, stack: err.stack }
    : { message: String(err) };

  logger.error(`Erro não tratado em ${req.method} ${req.originalUrl}`, { error: erroFormatado });
  res.status(500).json({ erro: 'backend.geral.erro_interno' });
}
