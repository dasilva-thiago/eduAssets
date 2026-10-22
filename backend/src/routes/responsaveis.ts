import { Router } from 'express';
import { requireAdmin } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { responsavelCreateSchema } from '../schemas/index.js';
import * as responsaveisController from '../controllers/responsaveis.controller.js';

export const responsaveisRouter = Router();

responsaveisRouter.get('/', responsaveisController.listar);
responsaveisRouter.post(
  '/',
  requireAdmin,
  validateBody(responsavelCreateSchema),
  responsaveisController.criar
);