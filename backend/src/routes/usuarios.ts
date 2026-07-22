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