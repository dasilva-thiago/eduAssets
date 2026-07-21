import express from 'express';
import cors from 'cors';
import { categoriasRouter } from './routes/categorias.js';
import { ocorrenciasRouter } from './routes/ocorrencias.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('eduAssets API running.');
});

app.use('/categorias', categoriasRouter);
app.use('/ocorrencias', ocorrenciasRouter);

app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});