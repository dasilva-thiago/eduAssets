import { Router } from 'express';
import { prisma } from '../prisma.js';

export const responsaveisRouter = Router();

responsaveisRouter.get('/', async (req, res) => {
  const responsaveis = await prisma.responsavel.findMany({
    orderBy: { nome: 'asc' },
  });
  res.json(responsaveis);
});

responsaveisRouter.post('/', async (req, res) => {
  const { nome, cargo } = req.body;

  if (!nome || !cargo) {
    res.status(400).json({ erro: 'Nome e cargo são obrigatórios.' });
    return;
  }

  const criado = await prisma.responsavel.create({ data: { nome, cargo } });
  res.status(201).json(criado);
});