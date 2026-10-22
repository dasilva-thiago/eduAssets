import { prisma } from '../lib/prisma.js';

export async function listarCategorias() {
  return prisma.categoria.findMany({
    orderBy: { nome: 'asc' },
  });
}

export async function criarCategoria(nome: string) {
  return prisma.categoria.create({
    data: { nome },
  });
}
