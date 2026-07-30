import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma.js';
import { signToken } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../lib/validate.js';
import { loginSchema, alterarSenhaSchema } from '../schemas/index.js';
import { loginRateLimiter } from '../middleware/security.js';

export const authRouter = Router();

authRouter.post('/login', loginRateLimiter, validateBody(loginSchema), async (req, res) => {
  const { login, password } = req.body;

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

authRouter.patch('/senha', requireAuth, validateBody(alterarSenhaSchema), async (req, res) => {
  const { senhaAtual, novaSenha } = req.body;

  const usuario = await prisma.usuario.findUnique({ where: { id: req.user!.sub } });
  if (!usuario) {
    res.status(401).json({ erro: 'Usuário não existe mais.' });
    return;
  }

  const senhaValida = await bcrypt.compare(senhaAtual, usuario.passwordHash);
  if (!senhaValida) {
    res.status(401).json({ erro: 'Senha atual incorreta.' });
    return;
  }

  const novoHash = await bcrypt.hash(novaSenha, 12);
  await prisma.usuario.update({ where: { id: usuario.id }, data: { passwordHash: novoHash } });

  res.status(204).send();
});