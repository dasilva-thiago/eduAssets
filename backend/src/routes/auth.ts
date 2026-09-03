import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma.js';
import { signToken } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../lib/validate.js';
import { loginSchema, alterarSenhaSchema } from '../schemas/index.js';
import { loginRateLimiter, rfidLoginRateLimiter } from '../middleware/security.js';
import { hashRfidToken } from '../lib/rfidToken.js';
import { publicarLoginRfid } from '../lib/rfidBridge.js';
import { rfidScanSchema } from '../schemas/index.js';

export const authRouter = Router();

const RFID_BRIDGE_SECRET = process.env.RFID_BRIDGE_SECRET;

authRouter.post('/login', loginRateLimiter, validateBody(loginSchema), async (req, res) => {
  const { login, password } = req.body;

  const usuario = await prisma.usuario.findUnique({ where: { login } });
  if (!usuario) {
    res.status(401).json({ erro: 'backend.auth.credenciais_invalidas' });
    return;
  }

  const senhaValida = await bcrypt.compare(password, usuario.passwordHash);
  if (!senhaValida) {
    res.status(401).json({ erro: 'backend.auth.credenciais_invalidas' });
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
    res.status(401).json({ erro: 'backend.auth.usuario_nao_existe' });
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
    res.status(401).json({ erro: 'backend.auth.usuario_nao_existe' });
    return;
  }

  const senhaValida = await bcrypt.compare(senhaAtual, usuario.passwordHash);
  if (!senhaValida) {
    res.status(401).json({ erro: 'backend.auth.senha_atual_incorreta' });
    return;
  }

  const novoHash = await bcrypt.hash(novaSenha, 12);
  await prisma.usuario.update({ where: { id: usuario.id }, data: { passwordHash: novoHash } });

  res.status(204).send();
});

function ehLoopback(remoteAddress: string | undefined): boolean {
  if (!remoteAddress) return false;
  return remoteAddress === '127.0.0.1' || remoteAddress === '::1' || remoteAddress === '::ffff:127.0.0.1';
}

authRouter.post('/rfid', rfidLoginRateLimiter, validateBody(rfidScanSchema), async (req, res) => {
  if (!ehLoopback(req.socket.remoteAddress)) {
    res.status(403).json({ erro: 'backend.auth.origem_nao_permitida' });
    return;
  }

  if (!RFID_BRIDGE_SECRET || req.headers['x-rfid-bridge-secret'] !== RFID_BRIDGE_SECRET) {
    res.status(401).json({ erro: 'backend.auth.nao_autorizado' });
    return;
  }

  const { token } = req.body;
  const hash = hashRfidToken(token);

  const usuario = await prisma.usuario.findUnique({ where: { rfidTokenHash: hash } });
  if (!usuario) {
    res.status(401).json({ erro: 'backend.auth.cartao_nao_reconhecido' });
    return;
  }

  const jwtToken = signToken({ sub: usuario.id, nivelAcesso: usuario.nivelAcesso });

  publicarLoginRfid({
    token: jwtToken,
    user: { id: usuario.id, nome: usuario.nome, login: usuario.login, nivelAcesso: usuario.nivelAcesso }
  });

  res.status(204).send();
});