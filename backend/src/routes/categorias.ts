import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAdmin } from '../middleware/auth.js';
import { validateBody } from '../lib/validate.js';
import { categoriaCreateSchema } from '../schemas/index.js';

export const categoriasRouter = Router();

categoriasRouter.get('/', async (req, res) => {
  const categorias = await prisma.categoria.findMany({ orderBy: { nome: 'asc' } });
  res.json(categorias);
});

categoriasRouter.post('/', requireAdmin, validateBody(categoriaCreateSchema), async (req, res) => {
  const { nome } = req.body;
  const criada = await prisma.categoria.create({ data: { nome } });
  res.status(201).json(criada);
});