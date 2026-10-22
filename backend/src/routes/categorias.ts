import { Router } from 'express';
import { requireAdmin } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { categoriaCreateSchema } from '../schemas/index.js';
import * as categoriasController from '../controllers/categorias.controller.js';

export const categoriasRouter = Router();

categoriasRouter.get('/', categoriasController.listar);
categoriasRouter.post('/', requireAdmin, validateBody(categoriaCreateSchema), categoriasController.criar);