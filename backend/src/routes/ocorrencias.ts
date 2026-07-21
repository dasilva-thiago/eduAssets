import { Router } from 'express';
import { prisma } from '../prisma.js';

export const ocorrenciasRouter = Router();

ocorrenciasRouter.get('/', async (req, res) => {
  const ocorrencias = await prisma.ocorrencia.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(ocorrencias);
});

ocorrenciasRouter.post('/', async (req, res) => {
  const { equipamentoId, tipo, problema, descricao, numeros } = req.body;

  if (!equipamentoId || !tipo || !problema || !descricao || !Array.isArray(numeros) || numeros.length === 0) {
    res.status(400).json({ erro: 'Dados incompletos para registrar a ocorrência.' });
    return;
  }

  const quantidade = numeros.length;

  const criadas = await prisma.$transaction(async (tx) => {
    const ocorrencias = await Promise.all(
      numeros.map((numero: string) =>
        tx.ocorrencia.create({
          data: { equipamentoId, tipo, problema, descricao, numero },
        })
      )
    );

    if (tipo === 'MANUTENCAO' || tipo === 'QUEBRADO') {
      await tx.equipamento.update({
        where: { id: equipamentoId },
        data: {
          quantidadeDisponivel: { decrement: quantidade },
          ...(tipo === 'QUEBRADO' ? { quantidadeQuebrada: { increment: quantidade } } : {}),
        },
      });
    }

    return ocorrencias;
  });

  res.status(201).json(criadas);
});

ocorrenciasRouter.patch('/:id/resolver', async (req, res) => {
  const id = Number(req.params.id);
  const { medidasTomadas } = req.body;

  const resolvida = await prisma.$transaction(async (tx) => {
    const ocorrencia = await tx.ocorrencia.update({
      where: { id },
      data: { status: 'RESOLVIDO', resolvidoEm: new Date(), medidasTomadas },
    });

    if (ocorrencia.tipo === 'MANUTENCAO' || ocorrencia.tipo === 'QUEBRADO') {
      await tx.equipamento.update({
        where: { id: ocorrencia.equipamentoId },
        data: {
          quantidadeDisponivel: { increment: 1 },
          ...(ocorrencia.tipo === 'QUEBRADO' ? { quantidadeQuebrada: { decrement: 1 } } : {}),
        },
      });
    }

    return ocorrencia;
  });

  res.json(resolvida);
});