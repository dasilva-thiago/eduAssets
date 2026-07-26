import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma.js';
import { signToken } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    res.status(400).json({ erro: 'Login e senha são obrigatórios.' });
    return;
  }

  const usuario = await prisma.usuario.findUnique({ where: { login } });
  if (!usuario) {
    res.status(401).json({ erro: 'Credenciais inválidas.' });
    return;
  }

  const senhaValida = await bcrypt.compare(password, usuario.passwordHash);
  if (!senhaValida) {
    res.status(401).json({ erro: 'Credenciais inválidas.' });
    return;
  }

  const token = signToken({ sub: usuario.id, nivelAcesso: usuario.nivelAcesso });

  res.json({
    token,
    user: {
      id: usuario.id,
      nome: usuario.nome,
      login: usuario.login,
      nivelAcesso: usuario.nivelAcesso
    }
  });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.user!.sub } });

  if (!usuario) {
    res.status(401).json({ erro: 'Usuário não existe mais.' });
    return;
  }

  res.json({
    id: usuario.id,
    nome: usuario.nome,
    login: usuario.login,
    nivelAcesso: usuario.nivelAcesso
  });
});