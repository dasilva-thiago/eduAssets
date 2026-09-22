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
import { requestLogger } from './middleware/requestLogger.js';
import { securityHeaders, globalRateLimiter } from './middleware/security.js';
import { createServer } from 'http';
import { initRfidBridge } from './lib/rfidBridge.js';
import { logger } from './lib/logger.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST ?? '127.0.0.1';

const isProduction = process.env.NODE_ENV === 'production';
const isLoopbackHost = HOST === 'localhost' || HOST === '127.0.0.1' || HOST === '::1';
const isLocalDevelopment = !isProduction && !process.env.NODE_ENV && isLoopbackHost;

/**
 * trust proxy: nunca confiar cegamente em X-Forwarded-For.
 * - TRUST_PROXY explícito (ex: "1" para um único hop, como um nginx/Cloudflare
 *   Tunnel na frente do Oracle Free Tier) sempre vence.
 * - Em produção sem TRUST_PROXY definido, assume 1 hop como padrão seguro
 *   (cenário mais comum: um único reverse proxy na frente).
 * - Fora de produção (sem proxy real), não confia em nenhum hop — evita que
 *   um cliente local falsifique X-Forwarded-For e escape dos rate limiters.
 */
const trustProxyEnv = process.env.TRUST_PROXY;
if (trustProxyEnv !== undefined) {
  const asNumber = Number(trustProxyEnv);
  app.set('trust proxy', Number.isNaN(asNumber) ? trustProxyEnv : asNumber);
} else if (isProduction) {
  app.set('trust proxy', 1);
} else {
  app.set('trust proxy', false);
}

app.use(securityHeaders);

const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

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

app.use(requestLogger);
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

server.listen(PORT, HOST, () => logger.info(`Servidor rodando em http://${HOST}:${PORT}`));