import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { categoriasRouter } from './routes/categorias.js';
import { equipamentosRouter } from './routes/equipamentos.js';
import { responsaveisRouter } from './routes/responsaveis.js';
import { usuariosRouter } from './routes/usuarios.js';
import { emprestimosRouter } from './routes/emprestimos.js';
import { ocorrenciasRouter } from './routes/ocorrencias.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { securityHeaders, globalRateLimiter } from './middleware/security.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// necessário atrás de proxy reverso (Render/Vercel) para o rate limiter
// identificar o IP real do cliente, e não o IP interno do proxy
app.set('trust proxy', 1);

app.use(securityHeaders);

const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    // TODO: configure CORS properly for production
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(globalRateLimiter);

app.get('/', (req, res) => res.send('eduAssets API running.'));

app.use('/auth', authRouter);
app.use('/categorias', categoriasRouter);
app.use('/equipamentos', equipamentosRouter);
app.use('/responsaveis', responsaveisRouter);
app.use('/usuarios', usuariosRouter);
app.use('/emprestimos', emprestimosRouter);
app.use('/ocorrencias', ocorrenciasRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));