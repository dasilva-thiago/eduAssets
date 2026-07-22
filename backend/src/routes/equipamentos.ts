import { Router } from 'express';
import { prisma } from '../prisma.js';

export const equipamentosRouter = Router();

equipamentosRouter.get('/', async (req, res) => {
  const equipamentos = await prisma.equipamento.findMany({
    include: { categoria: true },
    orderBy: { categoria: { nome: 'asc' } },
  });
  res.json(equipamentos);
});

equipamentosRouter.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { quantidadeTotal, quantidadeDisponivel, quantidadeQuebrada } = req.body;

  const atualizado = await prisma.equipamento.update({
    where: { id },
    data: { quantidadeTotal, quantidadeDisponivel, quantidadeQuebrada },
  });

  res.json(atualizado);
});