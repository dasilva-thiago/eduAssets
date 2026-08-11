import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAdmin } from '../middleware/auth.js';
import { validateBody } from '../lib/validate.js';
import { responsavelCreateSchema } from '../schemas/index.js';

export const responsaveisRouter = Router();

responsaveisRouter.get('/', async (req, res) => {
  const responsaveis = await prisma.responsavel.findMany({ orderBy: { nome: 'asc' } });
  res.json(responsaveis);
});

responsaveisRouter.post('/', requireAdmin, validateBody(responsavelCreateSchema), async (req, res) => {
  const { nome, cargo } = req.body;
  const criado = await prisma.responsavel.create({ data: { nome, cargo } });
  res.status(201).json(criado);
});