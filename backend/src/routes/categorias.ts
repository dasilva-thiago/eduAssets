import { Router } from 'express';
import { prisma } from '../prisma.js';

export const categoriasRouter = Router();

categoriasRouter.get('/', async (req, res) => {
  const categorias = await prisma.categoria.findMany({
    orderBy: { nome: 'asc' },
  });
  res.json(categorias);
});