import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../lib/validate.js';
import { usuarioCreateSchema } from '../schemas/index.js';

export const usuariosRouter = Router();
usuariosRouter.use(requireAuth);

usuariosRouter.get('/', async (req, res) => {
  const usuarios = await prisma.usuario.findMany({
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true, login: true, nivelAcesso: true, createdAt: true },
  });
  res.json(usuarios);
});

usuariosRouter.post('/', validateBody(usuarioCreateSchema), async (req, res) => {
  const { nome, login, senha, nivelAcesso } = req.body;
  const passwordHash = await bcrypt.hash(senha, 12);

  const criado = await prisma.usuario.create({
    data: { nome, login, passwordHash, nivelAcesso },
    select: { id: true, nome: true, login: true, nivelAcesso: true, createdAt: true },
  });

  res.status(201).json(criado);
});