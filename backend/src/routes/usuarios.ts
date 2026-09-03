import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma.js';
import { requireAdmin } from '../middleware/auth.js';
import { validateBody, requireIntParam } from '../lib/validate.js';
import { usuarioCreateSchema } from '../schemas/index.js';
import { gerarRfidToken, hashRfidToken } from '../lib/rfidToken.js';
import { rfidProvisionRateLimiter } from '../middleware/security.js';

export const usuariosRouter = Router();
usuariosRouter.use(requireAdmin);

const RFID_BRIDGE_TIMEOUT_MS = 40000;
const RFID_BRIDGE_SECRET = process.env.RFID_BRIDGE_SECRET;
// Só tenta contatar o bridge físico se a variável de ambiente indicar
// explicitamente que ele está disponível nesta implantação.

// Only attempt to contact the physical bridge if the environment variable explicitly indicates
// that it is available in this deployment.
const RFID_BRIDGE_ENABLED = process.env.RFID_BRIDGE_ENABLED === 'true';

if (RFID_BRIDGE_ENABLED && !RFID_BRIDGE_SECRET) {
  throw new Error('RFID_BRIDGE_SECRET não definida no ambiente do backend com RFID_BRIDGE_ENABLED=true.');
}

usuariosRouter.get('/', async (req, res, next) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, login: true, nivelAcesso: true, createdAt: true, rfidTokenHash: true },
    });

    res.json(usuarios.map((usuario) => ({
      id: usuario.id,
      nome: usuario.nome,
      login: usuario.login,
      nivelAcesso: usuario.nivelAcesso,
      createdAt: usuario.createdAt,
      possuiCartaoRfid: usuario.rfidTokenHash !== null,
    })));
  } catch (error) {
    console.error('Erro ao buscar usuários (Prisma):', error);
    next(error);
  }
});

usuariosRouter.post('/:id/rfid-token', requireIntParam('id'), rfidProvisionRateLimiter, async (req, res) => {
  if (!RFID_BRIDGE_ENABLED) {
    res.status(503).json({ erro: 'backend.usuarios.rfid_indisponivel' });
    return;
  }

  const id = Number(req.params.id);
  const tokenHex = gerarRfidToken();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RFID_BRIDGE_TIMEOUT_MS);

  try {
    const bridgeResponse = await fetch('http://127.0.0.1:3001/provision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RFID-Bridge-Secret': RFID_BRIDGE_SECRET ?? ''
      },
      body: JSON.stringify({ token: tokenHex }),
      signal: controller.signal
    });

    if (!bridgeResponse.ok) {
      throw new Error(`Bridge HTTP status: ${bridgeResponse.status}`);
    }

    await prisma.usuario.update({
      where: { id },
      data: { rfidTokenHash: hashRfidToken(tokenHex) },
      select: { id: true, nome: true }
    });

    res.status(201).json({ message: 'Modo de gravação ativo com sucesso.', token: tokenHex });
  } catch (hardwareError) {
    console.error('Falha ao contatar eduassets-rfid:', hardwareError);

    const expirouPorTimeout = hardwareError instanceof Error && hardwareError.name === 'AbortError';

    res.status(502).json({
      erro: expirouPorTimeout ? 'backend.usuarios.rfid_timeout' : 'backend.usuarios.rfid_hardware_indisponivel'
    });
  } finally {
    clearTimeout(timeoutId);
  }
});

usuariosRouter.delete('/:id/rfid-token', requireIntParam('id'), async (req, res) => {
  const id = Number(req.params.id);
  await prisma.usuario.update({ where: { id }, data: { rfidTokenHash: null } });
  res.status(204).send();
});