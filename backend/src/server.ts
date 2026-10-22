import 'dotenv/config';
import { createServer } from 'http';
import { app } from './app.js';
import { initRfidBridge } from './lib/rfidBridge.js';
import { logger } from './lib/logger.js';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST ?? '127.0.0.1';

const server = createServer(app);
initRfidBridge(server);

server.listen(PORT, HOST, () => {
  logger.info(`Servidor rodando em http://${HOST}:${PORT}`);
});