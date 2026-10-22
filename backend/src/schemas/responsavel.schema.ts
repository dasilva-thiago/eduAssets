import { z } from 'zod';

export const responsavelCreateSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório.').max(150),
  cargo: z.string().trim().min(1, 'Cargo é obrigatório.').max(150),
});

export type ResponsavelCreateSchemaInput = z.infer<typeof responsavelCreateSchema>;
