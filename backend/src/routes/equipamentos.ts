import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAdmin } from '../middleware/auth.js';
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

equipamentosRouter.post('/', requireAdmin, validateBody(equipamentoCreateSchema), async (req, res) => {
  const { categoriaId, modelo, quantidadeTotal } = req.body;

  const criado = await prisma.equipamento.create({
    data: { categoriaId, modelo, quantidadeTotal, quantidadeDisponivel: quantidadeTotal },
    include: { categoria: true },
  });

  res.status(201).json(criado);
});

equipamentosRouter.patch(
  '/:id',
  requireAdmin,
  requireIntParam('id'),
  validateBody(equipamentoUpdateSchema),
  async (req, res) => {
    const id = Number(req.params.id);
    const { quantidadeTotal, quantidadeDisponivel, quantidadeQuebrada } = req.body;

    const atual = await prisma.equipamento.findUnique({ where: { id } });
    if (!atual) {
      res.status(404).json({ erro: 'Equipamento não encontrado.' });
      return;
    }

    const totalFinal = quantidadeTotal ?? atual.quantidadeTotal;
    const disponivelFinal = quantidadeDisponivel ?? atual.quantidadeDisponivel;
    const quebradaFinal = quantidadeQuebrada ?? atual.quantidadeQuebrada;

    if (disponivelFinal + quebradaFinal > totalFinal) {
      res.status(400).json({ erro: 'A soma de Disponível e Quebrado não pode ultrapassar o Total.' });
      return;
    }

    const atualizado = await prisma.equipamento.update({
      where: { id },
      data: { quantidadeTotal, quantidadeDisponivel, quantidadeQuebrada },
    });

    res.json(atualizado);
  }
);