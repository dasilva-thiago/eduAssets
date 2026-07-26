// backend/src/routes/usuarios.ts
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const usuariosRouter = Router();
usuariosRouter.use(requireAuth);

usuariosRouter.get('/', async (req, res) => {
  const usuarios = await prisma.usuario.findMany({
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true, login: true, nivelAcesso: true, createdAt: true },
  });
  res.json(usuarios);
});

usuariosRouter.post('/', async (req, res) => {
  const { nome, login, senha, nivelAcesso } = req.body;

  if (!nome || !login || !senha || !nivelAcesso) {
    res.status(400).json({ erro: 'Nome, login, senha e nível de acesso são obrigatórios.' });
    return;
  }

  if (senha.length < 8) {
    res.status(400).json({ erro: 'A senha deve ter no mínimo 8 caracteres.' });
    return;
  }

  const passwordHash = await bcrypt.hash(senha, 10);

  const criado = await prisma.usuario.create({
    data: { nome, login, passwordHash, nivelAcesso },
    select: { id: true, nome: true, login: true, nivelAcesso: true, createdAt: true },
  });

  res.status(201).json(criado);
});