import { Router } from 'express';
import { requireAdmin } from '../middlewares/auth.js';
import { validateBody, requireIntParam } from '../middlewares/validate.js';
import { usuarioCreateSchema } from '../schemas/index.js';
import { rfidProvisionRateLimiter } from '../middlewares/security.js';
import * as usuariosController from '../controllers/usuarios.controller.js';

export const usuariosRouter = Router();

// Todas as rotas de usuários são estritamente restritas a administradores
usuariosRouter.use(requireAdmin);

usuariosRouter.get('/', usuariosController.listar);
usuariosRouter.post('/', validateBody(usuarioCreateSchema), usuariosController.criar);
usuariosRouter.post(
  '/:id/rfid-token',
  requireIntParam('id'),
  rfidProvisionRateLimiter,
  usuariosController.provisionarRfid
);
usuariosRouter.delete(
  '/:id/rfid-token',
  requireIntParam('id'),
  usuariosController.revogarRfid
);