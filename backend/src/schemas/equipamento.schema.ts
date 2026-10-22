import { z } from 'zod';

export const equipamentoCreateSchema = z.object({
  categoriaId: z.number().int().positive('Categoria inválida.'),
  modelo: z.string().trim().min(1, 'Modelo é obrigatório.').max(150),
  quantidadeTotal: z.number().int().positive('Quantidade total deve ser positiva.'),
});

export const equipamentoUpdateSchema = z
  .object({
    quantidadeTotal: z.number().int().nonnegative().optional(),
    quantidadeDisponivel: z.number().int().nonnegative().optional(),
    quantidadeQuebrada: z.number().int().nonnegative().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  })
  .refine(
    (data) => {
      if (
        data.quantidadeTotal !== undefined &&
        data.quantidadeDisponivel !== undefined &&
        data.quantidadeQuebrada !== undefined
      ) {
        return data.quantidadeDisponivel + data.quantidadeQuebrada <= data.quantidadeTotal;
      }
      return true;
    },
    {
      message: 'A soma de Disponível e Quebrado não pode ultrapassar o Total.',
      path: ['quantidadeDisponivel'],
    }
  );

export type EquipamentoCreateSchemaInput = z.infer<typeof equipamentoCreateSchema>;
export type EquipamentoUpdateSchemaInput = z.infer<typeof equipamentoUpdateSchema>;
