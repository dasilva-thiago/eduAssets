import type { Request, Response } from 'express';
import * as usuariosService from '../services/usuarios.service.js';

export async function listar(req: Request, res: Response): Promise<void> {
  const usuarios = await usuariosService.listarUsuarios();
  res.json(usuarios);
}

export async function criar(req: Request, res: Response): Promise<void> {
  const criado = await usuariosService.criarUsuario(req.body);
  res.status(201).json(criado);
}

export async function provisionarRfid(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const resultado = await usuariosService.provisionarCartaoRfid(id);
  res.status(201).json(resultado);
}

export async function revogarRfid(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  await usuariosService.revogarCartaoRfid(id);
  res.status(204).send();
}
