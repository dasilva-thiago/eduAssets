import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const categoriasRouter = Router();

categoriasRouter.get('/', async (req, res) => {
  const categorias = await prisma.categoria.findMany({
    orderBy: { nome: 'asc' },
  });
  res.json(categorias);
});

categoriasRouter.post('/', requireAuth, async (req, res) => {
  const { nome } = req.body;

  if (!nome) {
    res.status(400).json({ erro: 'Nome é obrigatório.' });
    return;
  }

  const criada = await prisma.categoria.create({ data: { nome } });
  res.status(201).json(criada);
});