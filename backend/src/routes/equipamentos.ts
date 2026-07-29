import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, requireIntParam } from '../lib/validate.js';
import { equipamentoCreateSchema, equipamentoUpdateSchema } from '../schemas/index.js';

export const equipamentosRouter = Router();

equipamentosRouter.get('/', async (req, res) => {
  const equipamentos = await prisma.equipamento.findMany({
    include: { categoria: true },
    orderBy: { categoria: { nome: 'asc' } },
  });
  res.json(equipamentos);
});

equipamentosRouter.post('/', requireAuth, validateBody(equipamentoCreateSchema), async (req, res) => {
  const { categoriaId, modelo, quantidadeTotal } = req.body;

  const criado = await prisma.equipamento.create({
    data: { categoriaId, modelo, quantidadeTotal, quantidadeDisponivel: quantidadeTotal },
    include: { categoria: true },
  });

  res.status(201).json(criado);
});

equipamentosRouter.patch(
  '/:id',
  requireAuth,
  requireIntParam('id'),
  validateBody(equipamentoUpdateSchema),
  async (req, res) => {
    const id = Number(req.params.id);
    const { quantidadeTotal, quantidadeDisponivel, quantidadeQuebrada } = req.body;

    const atualizado = await prisma.equipamento.update({
      where: { id },
      data: { quantidadeTotal, quantidadeDisponivel, quantidadeQuebrada },
    });

    res.json(atualizado);
  }
);