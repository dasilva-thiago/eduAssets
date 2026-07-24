import { Router } from 'express';
import { prisma } from '../prisma.js';

export const usuariosRouter = Router();

usuariosRouter.get('/', async (req, res) => {
  const usuarios = await prisma.usuario.findMany({
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true, login: true, nivelAcesso: true, createdAt: true },
  });
  res.json(usuarios);
});

usuariosRouter.post('/', async (req, res) => {
  const { nome, login, nivelAcesso } = req.body;

  if (!nome || !login || !nivelAcesso) {
    res.status(400).json({ erro: 'Nome, login e nível de acesso são obrigatórios.' });
    return;
  }

  const criado = await prisma.usuario.create({
    data: { nome, login, nivelAcesso },
    select: { id: true, nome: true, login: true, nivelAcesso: true, createdAt: true },
  });

  res.status(201).json(criado);
});