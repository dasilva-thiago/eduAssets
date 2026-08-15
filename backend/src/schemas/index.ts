import { z } from 'zod';

export const loginSchema = z.object({
  login: z.string().trim().min(1).max(200),
  password: z.string().min(1).max(200),
});

export const categoriaCreateSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório.').max(100),
});

export const equipamentoCreateSchema = z.object({
  categoriaId: z.number().int().positive(),
  modelo: z.string().trim().min(1, 'Modelo é obrigatório.').max(150),
  quantidadeTotal: z.number().int().positive(),
});

export const equipamentoUpdateSchema = z
  .object({
    quantidadeTotal: z.number().int().nonnegative().optional(),
    quantidadeDisponivel: z.number().int().nonnegative().optional(),
    quantidadeQuebrada: z.number().int().nonnegative().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  });

export const responsavelCreateSchema = z.object({
  nome: z.string().trim().min(1).max(150),
  cargo: z.string().trim().min(1).max(150),
});

export const usuarioCreateSchema = z.object({
  nome: z.string().trim().min(1).max(150),
  login: z.string().trim().min(1).max(200),
  senha: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.').max(200),
  nivelAcesso: z.enum(['ADMINISTRADOR', 'EDITOR']),
});

const itemEmprestimoSchema = z.object({
  equipamentoId: z.number().int().positive(),
  quantidade: z.number().int().positive(),
});

export const emprestimoCreateSchema = z.object({
  solicitanteNome: z.string().trim().min(1).max(150),
  responsavelId: z.number().int().positive(),
  dataRetirada: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Data inválida.'),
  observacao: z.string().max(2000).optional(),
  itens: z.array(itemEmprestimoSchema).min(1, 'É necessário informar ao menos um item.'),
});

export const emprestimoUpdateItensSchema = z.object({
  itens: z.array(itemEmprestimoSchema).min(1, 'É necessário informar ao menos um item.'),
});

export const ocorrenciaCreateSchema = z.object({
  equipamentoId: z.number().int().positive(),
  tipo: z.enum(['OBSERVACAO', 'MANUTENCAO', 'QUEBRADO']),
  problema: z.string().trim().min(1).max(100),
  descricao: z.string().trim().min(1).max(2000),
  numeros: z.array(z.string().trim().min(1).max(50)).min(1),
});

export const ocorrenciaUpdateSchema = z.object({
  problema: z.string().trim().min(1).max(100).optional(),
  descricao: z.string().trim().min(1).max(2000).optional(),
  numero: z.string().trim().max(50).optional(),
  medidasTomadas: z.string().trim().max(2000).optional(),
});

export const ocorrenciaResolverSchema = z.object({
  medidasTomadas: z.string().trim().min(1, 'Descreva as medidas tomadas.').max(2000),
});

export const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, 'Informe a senha atual.').max(200),
  novaSenha: z.string().min(8, 'A nova senha deve ter no mínimo 8 caracteres.').max(200),
});

export const rfidScanSchema = z.object({
  token: z.string().trim().regex(/^[0-9a-f]{32}$/i, 'Token de cartão inválido.'),
});