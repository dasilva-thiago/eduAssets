import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma.js';
import { requireAdmin } from '../middleware/auth.js';
import { validateBody, requireIntParam } from '../lib/validate.js';
import { usuarioCreateSchema } from '../schemas/index.js';
import { gerarRfidToken, hashRfidToken } from '../lib/rfidToken.js';

export const usuariosRouter = Router();
usuariosRouter.use(requireAdmin);

const RFID_BRIDGE_TIMEOUT_MS = 5000;

usuariosRouter.get('/', async (req, res) => {
  const usuarios = await prisma.usuario.findMany({
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true, login: true, nivelAcesso: true, createdAt: true, rfidTokenHash: true },
  });

  res.json(usuarios.map((u: any) => ({
    id: u.id,
    nome: u.nome,
    login: u.login,
    nivelAcesso: u.nivelAcesso,
    createdAt: u.createdAt,
    possuiCartaoRfid: u.rfidTokenHash !== null,
  })));
});

usuariosRouter.get('/', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, login: true, nivelAcesso: true, createdAt: true, rfidTokenHash: true },
    });

    res.json(usuarios.map((u: any) => ({
      id: u.id,
      nome: u.nome,
      login: u.login,
      nivelAcesso: u.nivelAcesso,
      createdAt: u.createdAt,
      possuiCartaoRfid: u.rfidTokenHash !== null,
    })));
  } catch (error) {
    console.error('Erro ao buscar usuários (Prisma):', error);
    res.status(500).json({ erro: 'Falha ao consultar o banco de dados.' });
  }
});

usuariosRouter.post('/:id/rfid-token', requireIntParam('id'), async (req, res) => {
  const id = Number(req.params.id);
  const tokenHex = gerarRfidToken();

  // Salva no banco de dados primeiro
  await prisma.usuario.update({
    where: { id },
    data: { rfidTokenHash: hashRfidToken(tokenHex) },
    select: { id: true, nome: true }
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RFID_BRIDGE_TIMEOUT_MS);

  try {
    const bridgeResponse = await fetch('http://127.0.0.1:3001/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenHex }),
      signal: controller.signal
    });

    if (!bridgeResponse.ok) {
      throw new Error(`Bridge HTTP status: ${bridgeResponse.status}`);
    }

    res.status(201).json({ message: 'Modo de gravação ativo com sucesso.', token: tokenHex });
  } catch (hardwareError) {
    console.error('Falha ao contatar eduassets-rfid:', hardwareError);

    const expirouPorTimeout = hardwareError instanceof Error && hardwareError.name === 'AbortError';

    res.status(502).json({
      error: expirouPorTimeout
        ? 'Hardware RFID não respondeu a tempo. Verifique se o serviço eduassets-rfid está rodando.'
        : 'Hardware RFID indisponível. Verifique se o serviço eduassets-rfid está rodando.'
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