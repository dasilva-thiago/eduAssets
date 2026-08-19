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
  
  // Retorno mapeado explicitamente para evitar erro de tipo "any"
  res.json(usuarios.map((u:any) => ({
    id: u.id,
    nome: u.nome,
    login: u.login,
    nivelAcesso: u.nivelAcesso,
    createdAt: u.createdAt,
    possuiCartaoRfid: u.rfidTokenHash !== null,
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

// AQUI: Rota atualizada para integração com o Hardware via API Local[cite: 20]
usuariosRouter.post('/:id/rfid-token', requireIntParam('id'), async (req, res) => {
  const id = Number(req.params.id);
  const tokenHex = gerarRfidToken();

  // Salva no banco de dados primeiro[cite: 20]
  const usuario = await prisma.usuario.update({
    where: { id },
    data: { rfidTokenHash: hashRfidToken(tokenHex) },
    select: { id: true, nome: true }
  });

  // Tenta contatar o serviço Python local na porta 3001[cite: 20]
  try {
    const bridgeResponse = await fetch('http://127.0.0.1:3001/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenHex })
    });

    if (!bridgeResponse.ok) {
      throw new Error(`Bridge HTTP status: ${bridgeResponse.status}`);
    }

    res.status(201).json({ message: "Modo de gravação ativo com sucesso.", token: tokenHex });
  } catch (hardwareError) {
    console.error("Falha ao contatar eduassets-rfid:", hardwareError);
    // Se o serviço Python não estiver rodando ou falhar, retorna o Erro 502 (Bad Gateway)[cite: 20]
    res.status(502).json({ error: "Hardware RFID indisponível. Verifique se o serviço eduassets-rfid está rodando." });
  }
});

usuariosRouter.delete('/:id/rfid-token', requireIntParam('id'), async (req, res) => {
  const id = Number(req.params.id);
  await prisma.usuario.update({ where: { id }, data: { rfidTokenHash: null } });
  res.status(204).send();
});