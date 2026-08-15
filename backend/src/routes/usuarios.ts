import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma.js';
import { requireAdmin } from '../middleware/auth.js';
import { validateBody, requireIntParam } from '../lib/validate.js';
import { usuarioCreateSchema } from '../schemas/index.js';
import { gerarRfidToken, hashRfidToken } from '../lib/rfidToken.js';

export const usuariosRouter = Router();
usuariosRouter.use(requireAdmin);

usuariosRouter.get('/', async (req, res) => {
  const usuarios = await prisma.usuario.findMany({
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true, login: true, nivelAcesso: true, createdAt: true, rfidTokenHash: true },
  });
  res.json(usuarios.map(({ rfidTokenHash, ...usuario }) => ({
    ...usuario,
    possuiCartaoRfid: rfidTokenHash !== null,
  })));
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

usuariosRouter.post('/:id/rfid-token', requireIntParam('id'), async (req, res) => {
  const id = Number(req.params.id);
  const tokenHex = gerarRfidToken();

  const usuario = await prisma.usuario.update({
    where: { id },
    data: { rfidTokenHash: hashRfidToken(tokenHex) },
    select: { id: true, nome: true }
  });

  res.status(201).json({ usuario, token: tokenHex });
});

usuariosRouter.delete('/:id/rfid-token', requireIntParam('id'), async (req, res) => {
  const id = Number(req.params.id);
  await prisma.usuario.update({ where: { id }, data: { rfidTokenHash: null } });
  res.status(204).send();
});