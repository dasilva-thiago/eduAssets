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
import { createServer } from 'http';
import { initRfidBridge } from './lib/rfidBridge.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST ?? '127.0.0.1';

app.set('trust proxy', 1);

app.use(securityHeaders);

const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';
const isLoopbackHost = HOST === 'localhost' || HOST === '127.0.0.1' || HOST === '::1';
const isLocalDevelopment = !isProduction && !process.env.NODE_ENV && isLoopbackHost;

if (!isLocalDevelopment && allowedOrigins.length === 0) {
  throw new Error(
    'CORS_ORIGIN não definida fora do desenvolvimento local. Configure a variável de ambiente com as origens permitidas (ex: https://eduassets.vercel.app) antes de iniciar o servidor.'
  );
}

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
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

const server = createServer(app);
initRfidBridge(server);

server.listen(PORT, HOST, () => console.log(`Servidor rodando em http://${HOST}:${PORT}`));