import { Router } from 'express';
import { prisma } from '../prisma.js';

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

emprestimosRouter.post('/', async (req, res) => {
  const { solicitanteNome, responsavelId, dataRetirada, observacao, itens } = req.body;

  if (!solicitanteNome || !responsavelId || !dataRetirada || !Array.isArray(itens) || itens.length === 0) {
    res.status(400).json({ erro: 'Dados incompletos para registrar o empréstimo.' });
    return;
  }

  const criado = await prisma.$transaction(async (tx) => {
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
});

emprestimosRouter.patch('/:id/devolver', async (req, res) => {
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