import { PrismaClient, Prisma } from '@prisma/client';

export const prisma = new PrismaClient();

export const TRANSACTION_TIMEOUT_MS = 15000;
export const TRANSACTION_MAX_WAIT_MS = 5000;

export type TransactionClient = Prisma.TransactionClient;

/**
 * Executa uma transação interativa com timeout padrão de 15 segundos.
 * Não altera a semântica de transações em lote ($transaction([...])).
 */
export async function runTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  }
): Promise<T> {
  return prisma.$transaction(fn, {
    timeout: options?.timeout ?? TRANSACTION_TIMEOUT_MS,
    maxWait: options?.maxWait ?? TRANSACTION_MAX_WAIT_MS,
    isolationLevel: options?.isolationLevel,
  });
}
