import { prisma } from '../lib/prisma.js';
import { AppError } from '../errors/AppError.js';

export interface EquipamentoCreateInput {
  categoriaId: number;
  modelo: string;
  quantidadeTotal: number;
}

export interface EquipamentoUpdateInput {
  quantidadeTotal?: number;
  quantidadeDisponivel?: number;
  quantidadeQuebrada?: number;
}

export async function listarEquipamentos() {
  return prisma.equipamento.findMany({
    include: { categoria: true },
    orderBy: { categoria: { nome: 'asc' } },
  });
}

export async function criarEquipamento(dados: EquipamentoCreateInput) {
  const { categoriaId, modelo, quantidadeTotal } = dados;

  return prisma.equipamento.create({
    data: {
      categoriaId,
      modelo,
      quantidadeTotal,
      quantidadeDisponivel: quantidadeTotal,
    },
    include: { categoria: true },
  });
}

export async function atualizarEquipamento(id: number, dados: EquipamentoUpdateInput) {
  const { quantidadeTotal, quantidadeDisponivel, quantidadeQuebrada } = dados;

  const atual = await prisma.equipamento.findUnique({ where: { id } });
  if (!atual) {
    throw new AppError(404, 'backend.equipamentos.nao_encontrado');
  }

  const totalFinal = quantidadeTotal ?? atual.quantidadeTotal;
  const disponivelFinal = quantidadeDisponivel ?? atual.quantidadeDisponivel;
  const quebradaFinal = quantidadeQuebrada ?? atual.quantidadeQuebrada;

  if (disponivelFinal + quebradaFinal > totalFinal) {
    throw new AppError(400, 'backend.equipamentos.soma_invalida');
  }

  return prisma.equipamento.update({
    where: { id },
    data: { quantidadeTotal, quantidadeDisponivel, quantidadeQuebrada },
    include: { categoria: true },
  });
}
