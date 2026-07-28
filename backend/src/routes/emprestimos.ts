import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { agruparQuantidades, validarEstoqueDisponivel, EstoqueInsuficienteError } from '../lib/estoque.js';

export const emprestimosRouter = Router();

emprestimosRouter.get('/', async (req, res) => {
  const emprestimos = await prisma.emprestimo.findMany({
    include: {
      responsavel: true,
      itens: { include: { equipamento: { include: { categoria: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(emprestimos);
});

emprestimosRouter.post('/', requireAuth, async (req, res) => {
  const { solicitanteNome, responsavelId, dataRetirada, observacao, itens } = req.body;

  if (!solicitanteNome || !responsavelId || !dataRetirada || !Array.isArray(itens) || itens.length === 0) {
    res.status(400).json({ erro: 'Dados incompletos para registrar o empréstimo.' });
    return;
  }

  try {
    const criado = await prisma.$transaction(async (tx) => {
      const quantidadesSolicitadas = agruparQuantidades(itens);
      await validarEstoqueDisponivel(tx, quantidadesSolicitadas);

      const emprestimo = await tx.emprestimo.create({
        data: {
          solicitanteNome,
          responsavelId,
          dataRetirada: new Date(dataRetirada),
          observacao,
          itens: {
            create: itens.map((item: { equipamentoId: number; quantidade: number }) => ({
              equipamentoId: item.equipamentoId,
              quantidade: item.quantidade,
            })),
          },
        },
        include: { itens: true },
      });

      for (const item of itens) {
        await tx.equipamento.update({
          where: { id: item.equipamentoId },
          data: { quantidadeDisponivel: { decrement: item.quantidade } },
        });
      }

      return emprestimo;
    });

    res.status(201).json(criado);
  } catch (err) {
    if (err instanceof EstoqueInsuficienteError) {
      res.status(400).json({ erro: err.message, itens: err.itens });
      return;
    }
    throw err;
  }
});

emprestimosRouter.patch('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { itens } = req.body;

  if (!Array.isArray(itens) || itens.length === 0) {
    res.status(400).json({ erro: 'É necessário informar ao menos um item.' });
    return;
  }

  try {
    const atualizado = await prisma.$transaction(async (tx) => {
      const itensAntigos = await tx.itemEmprestimo.findMany({ where: { emprestimoId: id } });

      const quantidadesDevolvidas = agruparQuantidades(
        itensAntigos.map((item) => ({ equipamentoId: item.equipamentoId, quantidade: item.quantidade }))
      );
      const quantidadesSolicitadas = agruparQuantidades(itens);

      await validarEstoqueDisponivel(tx, quantidadesSolicitadas, quantidadesDevolvidas);

      for (const item of itensAntigos) {
        await tx.equipamento.update({
          where: { id: item.equipamentoId },
          data: { quantidadeDisponivel: { increment: item.quantidade } },
        });
      }

      await tx.itemEmprestimo.deleteMany({ where: { emprestimoId: id } });

      await tx.itemEmprestimo.createMany({
        data: itens.map((item: { equipamentoId: number; quantidade: number }) => ({
          emprestimoId: id,
          equipamentoId: item.equipamentoId,
          quantidade: item.quantidade,
        })),
      });

      for (const item of itens) {
        await tx.equipamento.update({
          where: { id: item.equipamentoId },
          data: { quantidadeDisponivel: { decrement: item.quantidade } },
        });
      }

      return tx.emprestimo.findUnique({
        where: { id },
        include: { responsavel: true, itens: { include: { equipamento: true } } },
      });
    });

    res.json(atualizado);
  } catch (err) {
    if (err instanceof EstoqueInsuficienteError) {
      res.status(400).json({ erro: err.message, itens: err.itens });
      return;
    }
    throw err;
  }
});

emprestimosRouter.patch('/:id/devolver', requireAuth, async (req, res) => {
  const id = Number(req.params.id);

  const devolvido = await prisma.$transaction(async (tx) => {
    const emprestimo = await tx.emprestimo.update({
      where: { id },
      data: { status: 'DEVOLVIDO', dataDevolucao: new Date() },
      include: { itens: true },
    });

    for (const item of emprestimo.itens) {
      await tx.equipamento.update({
        where: { id: item.equipamentoId },
        data: { quantidadeDisponivel: { increment: item.quantidade } },
      });
    }

    return emprestimo;
  });

  res.json(devolvido);
});