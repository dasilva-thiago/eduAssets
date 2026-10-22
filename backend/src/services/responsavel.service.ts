import { prisma } from '../lib/prisma.js';

export async function listarResponsaveis() {
  return prisma.responsavel.findMany({
    orderBy: { nome: 'asc' },
  });
}

export async function criarResponsavel(nome: string, cargo: string) {
  return prisma.responsavel.create({
    data: { nome, cargo },
  });
}
