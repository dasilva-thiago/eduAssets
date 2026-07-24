import { Router } from 'express';
import { prisma } from '../prisma.js';

export const ocorrenciasRouter = Router();

const ocorrenciaInclude = {
  equipamento: {
    include: {
      categoria: true,
    },
  },
};

ocorrenciasRouter.get('/', async (req, res) => {
  const ocorrencias = await prisma.ocorrencia.findMany({
    include: ocorrenciaInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json(ocorrencias);
});

ocorrenciasRouter.post('/', async (req, res) => {
  const { equipamentoId, tipo, problema, descricao, numeros } = req.body;

  if (!equipamentoId || !tipo || !problema || !descricao || !Array.isArray(numeros) || numeros.length === 0) {
    res.status(400).json({ erro: 'Incomplete data to register the occurrence.' });
    return;
  }

  const quantidade = numeros.length;

  const criadas = await prisma.$transaction(async (tx) => {
    const ocorrencias = await Promise.all(
      numeros.map((numero: string) =>
        tx.ocorrencia.create({
          data: { equipamentoId, tipo, problema, descricao, numero },
          include: ocorrenciaInclude,
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

ocorrenciasRouter.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { problema, descricao, numero } = req.body;

  const atualizada = await prisma.ocorrencia.update({
    where: { id },
    data: { problema, descricao, numero, ...(req.body.medidasTomadas ? { medidasTomadas: req.body.medidasTomadas } : {}) },
    include: ocorrenciaInclude,
  });

  res.json(atualizada);
});

ocorrenciasRouter.patch('/:id/resolver', async (req, res) => {
  const id = Number(req.params.id);
  const { medidasTomadas } = req.body;

  const resolvida = await prisma.$transaction(async (tx) => {
    const ocorrencia = await tx.ocorrencia.update({
      where: { id },
      data: { status: 'RESOLVIDO', resolvidoEm: new Date(), medidasTomadas },
      include: ocorrenciaInclude,
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

ocorrenciasRouter.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  await prisma.$transaction(async (tx) => {
    const ocorrencia = await tx.ocorrencia.findUnique({ where: { id } });
    if (!ocorrencia) return;

    if (ocorrencia.status === 'ABERTO' && (ocorrencia.tipo === 'MANUTENCAO' || ocorrencia.tipo === 'QUEBRADO')) {
      await tx.equipamento.update({
        where: { id: ocorrencia.equipamentoId },
        data: {
          quantidadeDisponivel: { increment: 1 },
          ...(ocorrencia.tipo === 'QUEBRADO' ? { quantidadeQuebrada: { decrement: 1 } } : {}),
        },
      });
    }

    await tx.ocorrencia.delete({ where: { id } });
  });

  res.status(204).send();
});