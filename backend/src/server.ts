import express from 'express';
import cors from 'cors';
import { categoriasRouter } from './routes/categorias.js';
import { equipamentosRouter } from './routes/equipamentos.js';
import { responsaveisRouter } from './routes/responsaveis.js';
import { usuariosRouter } from './routes/usuarios.js';
import { emprestimosRouter } from './routes/emprestimos.js';
import { ocorrenciasRouter } from './routes/ocorrencias.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('eduAssets API running.');
});

app.use('/categorias', categoriasRouter);
app.use('/equipamentos', equipamentosRouter);
app.use('/responsaveis', responsaveisRouter);
app.use('/usuarios', usuariosRouter);
app.use('/emprestimos', emprestimosRouter);
app.use('/ocorrencias', ocorrenciasRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});