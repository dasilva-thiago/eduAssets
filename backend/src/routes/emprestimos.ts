import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validateBody, requireIntParam } from '../middlewares/validate.js';
import { emprestimoCreateSchema, emprestimoUpdateItensSchema } from '../schemas/index.js';
import * as emprestimosController from '../controllers/emprestimos.controller.js';

export const emprestimosRouter = Router();

emprestimosRouter.get('/', emprestimosController.listar);
emprestimosRouter.post(
  '/',
  requireAuth,
  validateBody(emprestimoCreateSchema),
  emprestimosController.criar
);
emprestimosRouter.patch(
  '/:id',
  requireAuth,
  requireIntParam('id'),
  validateBody(emprestimoUpdateItensSchema),
  emprestimosController.atualizarItens
);
emprestimosRouter.patch(
  '/:id/devolver',
  requireAuth,
  requireIntParam('id'),
  emprestimosController.devolver
);