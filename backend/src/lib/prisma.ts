import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from './logger.js';

const realPrisma = new PrismaClient();

export const TRANSACTION_TIMEOUT_MS = 15000;
export const TRANSACTION_MAX_WAIT_MS = 5000;

export type TransactionClient = Prisma.TransactionClient;

// ============================================================================
// In-Memory Fallback Store (usado quando o PostgreSQL não está conectado)
// ============================================================================

interface CategoriaRecord {
  id: number;
  nome: string;
}

interface EquipamentoRecord {
  id: number;
  categoriaId: number;
  modelo: string;
  quantidadeTotal: number;
  quantidadeDisponivel: number;
  quantidadeQuebrada: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ResponsavelRecord {
  id: number;
  nome: string;
  cargo: string;
}

interface UsuarioRecord {
  id: number;
  nome: string;
  login: string;
  passwordHash: string;
  nivelAcesso: 'ADMINISTRADOR' | 'EDITOR';
  rfidTokenHash: string | null;
  createdAt: Date;
}

interface ItemEmprestimoRecord {
  id: number;
  emprestimoId: number;
  equipamentoId: number;
  quantidade: number;
}

interface EmprestimoRecord {
  id: number;
  solicitanteNome: string;
  responsavelId: number;
  status: 'ABERTO' | 'DEVOLVIDO';
  dataRetirada: Date;
  dataDevolucao: Date | null;
  observacao: string | null;
  createdAt: Date;
}

interface OcorrenciaRecord {
  id: number;
  equipamentoId: number;
  numero: string | null;
  tipo: 'OBSERVACAO' | 'MANUTENCAO' | 'QUEBRADO';
  status: 'ABERTO' | 'RESOLVIDO';
  problema: string;
  descricao: string;
  resolvidoEm: Date | null;
  medidasTomadas: string | null;
  createdAt: Date;
}

class InMemoryDb {
  categorias: CategoriaRecord[] = [
    { id: 1, nome: 'Notebooks' },
    { id: 2, nome: 'Tablets' },
    { id: 3, nome: 'Projetores' },
    { id: 4, nome: 'Acessórios' },
  ];

  equipamentos: EquipamentoRecord[] = [
    {
      id: 1,
      categoriaId: 1,
      modelo: 'Positivo Master N1110',
      quantidadeTotal: 15,
      quantidadeDisponivel: 12,
      quantidadeQuebrada: 1,
      createdAt: new Date(Date.now() - 30 * 86400000),
      updatedAt: new Date(),
    },
    {
      id: 2,
      categoriaId: 1,
      modelo: 'Lenovo ThinkPad E14',
      quantidadeTotal: 10,
      quantidadeDisponivel: 8,
      quantidadeQuebrada: 0,
      createdAt: new Date(Date.now() - 25 * 86400000),
      updatedAt: new Date(),
    },
    {
      id: 3,
      categoriaId: 2,
      modelo: 'Samsung Galaxy Tab A8',
      quantidadeTotal: 20,
      quantidadeDisponivel: 18,
      quantidadeQuebrada: 1,
      createdAt: new Date(Date.now() - 20 * 86400000),
      updatedAt: new Date(),
    },
    {
      id: 4,
      categoriaId: 3,
      modelo: 'Epson PowerLite E20',
      quantidadeTotal: 5,
      quantidadeDisponivel: 4,
      quantidadeQuebrada: 0,
      createdAt: new Date(Date.now() - 15 * 86400000),
      updatedAt: new Date(),
    },
    {
      id: 5,
      categoriaId: 4,
      modelo: 'Adaptador HDMI para VGA',
      quantidadeTotal: 8,
      quantidadeDisponivel: 7,
      quantidadeQuebrada: 0,
      createdAt: new Date(Date.now() - 10 * 86400000),
      updatedAt: new Date(),
    },
  ];

  responsaveis: ResponsavelRecord[] = [
    { id: 1, nome: 'Prof. Carlos Eduardo', cargo: 'Professor de Matemática' },
    { id: 2, nome: 'Profa. Mariana Souza', cargo: 'Coordenadora Pedagógica' },
    { id: 3, nome: 'Roberto Alencar', cargo: 'Laboratório de Informática' },
  ];

  usuarios: UsuarioRecord[] = [
    {
      id: 1,
      nome: 'Thiago da Silva',
      login: 'admin@eduassets.com',
      // Hash bcrypt para a senha 'admin123'
      passwordHash: '$2b$10$b1pgiag7d8Zdo73V6uCpTO1mWBls3zI2OyPokm5FaBmDGM5E.E5mm',
      nivelAcesso: 'ADMINISTRADOR',
      rfidTokenHash: null,
      createdAt: new Date(Date.now() - 60 * 86400000),
    },
    {
      id: 2,
      nome: 'Editor de Teste',
      login: 'editor@eduassets.com',
      passwordHash: '$2b$10$b1pgiag7d8Zdo73V6uCpTO1mWBls3zI2OyPokm5FaBmDGM5E.E5mm',
      nivelAcesso: 'EDITOR',
      rfidTokenHash: null,
      createdAt: new Date(Date.now() - 40 * 86400000),
    },
  ];

  itensEmprestimo: ItemEmprestimoRecord[] = [
    { id: 1, emprestimoId: 1, equipamentoId: 1, quantidade: 2 },
    { id: 2, emprestimoId: 2, equipamentoId: 4, quantidade: 1 },
  ];

  emprestimos: EmprestimoRecord[] = [
    {
      id: 1,
      solicitanteNome: 'Prof. Carlos Eduardo',
      responsavelId: 1,
      status: 'ABERTO',
      dataRetirada: new Date(Date.now() - 2 * 86400000),
      dataDevolucao: null,
      observacao: 'Aula prática de Geometria',
      createdAt: new Date(Date.now() - 2 * 86400000),
    },
    {
      id: 2,
      solicitanteNome: 'Profa. Mariana Souza',
      responsavelId: 2,
      status: 'DEVOLVIDO',
      dataRetirada: new Date(Date.now() - 6 * 86400000),
      dataDevolucao: new Date(Date.now() - 3 * 86400000),
      observacao: 'Apresentação pedagógica no auditório',
      createdAt: new Date(Date.now() - 6 * 86400000),
    },
  ];

  ocorrencias: OcorrenciaRecord[] = [
    {
      id: 1,
      equipamentoId: 1,
      numero: 'NTB-01',
      tipo: 'QUEBRADO',
      status: 'ABERTO',
      problema: 'Tela trincada após queda',
      descricao: 'O aparelho sofreu impacto lateral na carcaça.',
      resolvidoEm: null,
      medidasTomadas: null,
      createdAt: new Date(Date.now() - 4 * 86400000),
    },
    {
      id: 2,
      equipamentoId: 3,
      numero: 'TAB-08',
      tipo: 'MANUTENCAO',
      status: 'ABERTO',
      problema: 'Bateria não carrega além de 15%',
      descricao: 'Necessita verificação do conector USB-C.',
      resolvidoEm: null,
      medidasTomadas: null,
      createdAt: new Date(Date.now() - 3 * 86400000),
    },
    {
      id: 3,
      equipamentoId: 2,
      numero: 'NTB-05',
      tipo: 'OBSERVACAO',
      status: 'RESOLVIDO',
      problema: 'Teclado com teclas travando',
      descricao: 'Limpeza preventiva realizada no teclado.',
      resolvidoEm: new Date(Date.now() - 1 * 86400000),
      medidasTomadas: 'Higienização interna e teste de digitação aprovado.',
      createdAt: new Date(Date.now() - 5 * 86400000),
    },
  ];

  nextCategoriaId = 5;
  nextEquipamentoId = 6;
  nextResponsavelId = 4;
  nextUsuarioId = 3;
  nextEmprestimoId = 3;
  nextItemEmprestimoId = 3;
  nextOcorrenciaId = 4;
}

const db = new InMemoryDb();

// Flag para saber se o PostgreSQL está inalcançável
const isPostgresUrlMock = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('host:5432');
let useInMemory = isPostgresUrlMock;

function mapEquipamentoComCategoria(e: EquipamentoRecord) {
  const cat = db.categorias.find((c) => c.id === e.categoriaId);
  return {
    ...e,
    categoria: cat ? { ...cat } : { id: e.categoriaId, nome: 'Geral' },
  };
}

function mapEmprestimoComDetalhes(emp: EmprestimoRecord) {
  const resp = db.responsaveis.find((r) => r.id === emp.responsavelId);
  const itens = db.itensEmprestimo
    .filter((i) => i.emprestimoId === emp.id)
    .map((item) => {
      const eq = db.equipamentos.find((e) => e.id === item.equipamentoId);
      return {
        ...item,
        equipamento: eq ? mapEquipamentoComCategoria(eq) : undefined,
      };
    });

  return {
    ...emp,
    responsavel: resp ? { ...resp } : undefined,
    itens,
  };
}

function mapOcorrenciaComEquipamento(oco: OcorrenciaRecord) {
  const eq = db.equipamentos.find((e) => e.id === oco.equipamentoId);
  return {
    ...oco,
    equipamento: eq ? mapEquipamentoComCategoria(eq) : undefined,
  };
}

export const inMemoryPrisma = {
  categoria: {
    async findMany(args?: { orderBy?: { nome: 'asc' | 'desc' } }) {
      return [...db.categorias].sort((a, b) => a.nome.localeCompare(b.nome));
    },
    async create(args: { data: { nome: string } }) {
      const nova: CategoriaRecord = { id: db.nextCategoriaId++, nome: args.data.nome };
      db.categorias.push(nova);
      return { ...nova };
    },
  },

  equipamento: {
    async findMany(args?: {
      where?: { id?: { in?: number[] } };
      include?: { categoria?: boolean };
      orderBy?: unknown;
    }) {
      let list = db.equipamentos;
      if (args?.where?.id?.in) {
        const inIds = new Set(args.where.id.in);
        list = list.filter((e) => inIds.has(e.id));
      }
      return list.map(mapEquipamentoComCategoria);
    },
    async findUnique(args: { where: { id: number } }) {
      const eq = db.equipamentos.find((e) => e.id === args.where.id);
      return eq ? mapEquipamentoComCategoria(eq) : null;
    },
    async create(args: {
      data: { categoriaId: number; modelo: string; quantidadeTotal: number; quantidadeDisponivel: number };
      include?: { categoria?: boolean };
    }) {
      const criado: EquipamentoRecord = {
        id: db.nextEquipamentoId++,
        categoriaId: args.data.categoriaId,
        modelo: args.data.modelo,
        quantidadeTotal: args.data.quantidadeTotal,
        quantidadeDisponivel: args.data.quantidadeDisponivel,
        quantidadeQuebrada: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      db.equipamentos.push(criado);
      return mapEquipamentoComCategoria(criado);
    },
    async update(args: {
      where: { id: number };
      data: {
        quantidadeTotal?: number;
        quantidadeDisponivel?: number | { increment?: number; decrement?: number };
        quantidadeQuebrada?: number | { increment?: number; decrement?: number };
      };
      include?: { categoria?: boolean };
    }) {
      const eq = db.equipamentos.find((e) => e.id === args.where.id);
      if (!eq) throw new Error('Equipamento não encontrado');

      if (args.data.quantidadeTotal !== undefined) {
        eq.quantidadeTotal = args.data.quantidadeTotal;
      }
      if (args.data.quantidadeDisponivel !== undefined) {
        if (typeof args.data.quantidadeDisponivel === 'number') {
          eq.quantidadeDisponivel = args.data.quantidadeDisponivel;
        } else if (args.data.quantidadeDisponivel.increment) {
          eq.quantidadeDisponivel += args.data.quantidadeDisponivel.increment;
        } else if (args.data.quantidadeDisponivel.decrement) {
          eq.quantidadeDisponivel -= args.data.quantidadeDisponivel.decrement;
        }
      }
      if (args.data.quantidadeQuebrada !== undefined) {
        if (typeof args.data.quantidadeQuebrada === 'number') {
          eq.quantidadeQuebrada = args.data.quantidadeQuebrada;
        } else if (args.data.quantidadeQuebrada.increment) {
          eq.quantidadeQuebrada += args.data.quantidadeQuebrada.increment;
        } else if (args.data.quantidadeQuebrada.decrement) {
          eq.quantidadeQuebrada -= args.data.quantidadeQuebrada.decrement;
        }
      }
      eq.updatedAt = new Date();
      return mapEquipamentoComCategoria(eq);
    },
    async updateMany(args: {
      where: { id: number; quantidadeDisponivel?: { gte: number } };
      data: { quantidadeDisponivel?: { decrement: number } };
    }) {
      const eq = db.equipamentos.find((e) => e.id === args.where.id);
      if (!eq) return { count: 0 };
      if (args.where.quantidadeDisponivel?.gte !== undefined) {
        if (eq.quantidadeDisponivel < args.where.quantidadeDisponivel.gte) {
          return { count: 0 };
        }
      }
      if (args.data.quantidadeDisponivel?.decrement) {
        eq.quantidadeDisponivel -= args.data.quantidadeDisponivel.decrement;
      }
      eq.updatedAt = new Date();
      return { count: 1 };
    },
  },

  responsavel: {
    async findMany(args?: { orderBy?: { nome: 'asc' | 'desc' } }) {
      return [...db.responsaveis].sort((a, b) => a.nome.localeCompare(b.nome));
    },
    async create(args: { data: { nome: string; cargo: string } }) {
      const criado: ResponsavelRecord = {
        id: db.nextResponsavelId++,
        nome: args.data.nome,
        cargo: args.data.cargo,
      };
      db.responsaveis.push(criado);
      return { ...criado };
    },
  },

  usuario: {
    async findMany(args?: { orderBy?: unknown; select?: unknown }) {
      return [...db.usuarios].sort((a, b) => a.nome.localeCompare(b.nome));
    },
    async findUnique(args: {
      where: { id?: number; login?: string; rfidTokenHash?: string };
      select?: unknown;
    }) {
      if (args.where.id !== undefined) {
        return db.usuarios.find((u) => u.id === args.where.id) ?? null;
      }
      if (args.where.login !== undefined) {
        return db.usuarios.find((u) => u.login.toLowerCase() === args.where.login!.toLowerCase()) ?? null;
      }
      if (args.where.rfidTokenHash !== undefined) {
        return db.usuarios.find((u) => u.rfidTokenHash === args.where.rfidTokenHash) ?? null;
      }
      return null;
    },
    async create(args: {
      data: { nome: string; login: string; passwordHash: string; nivelAcesso: 'ADMINISTRADOR' | 'EDITOR' };
    }) {
      const criado: UsuarioRecord = {
        id: db.nextUsuarioId++,
        nome: args.data.nome,
        login: args.data.login,
        passwordHash: args.data.passwordHash,
        nivelAcesso: args.data.nivelAcesso,
        rfidTokenHash: null,
        createdAt: new Date(),
      };
      db.usuarios.push(criado);
      return { ...criado };
    },
    async update(args: {
      where: { id: number };
      data: { passwordHash?: string; rfidTokenHash?: string | null };
      select?: unknown;
    }) {
      const u = db.usuarios.find((user) => user.id === args.where.id);
      if (!u) throw new Error('Usuário não encontrado');
      if (args.data.passwordHash !== undefined) u.passwordHash = args.data.passwordHash;
      if (args.data.rfidTokenHash !== undefined) u.rfidTokenHash = args.data.rfidTokenHash;
      return { ...u };
    },
  },

  emprestimo: {
    async findMany(args?: unknown) {
      return [...db.emprestimos]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(mapEmprestimoComDetalhes);
    },
    async findUnique(args: { where: { id: number }; include?: unknown }) {
      const emp = db.emprestimos.find((e) => e.id === args.where.id);
      return emp ? mapEmprestimoComDetalhes(emp) : null;
    },
    async findUniqueOrThrow(args: { where: { id: number }; include?: unknown }) {
      const emp = db.emprestimos.find((e) => e.id === args.where.id);
      if (!emp) throw new Error('Empréstimo não encontrado');
      return mapEmprestimoComDetalhes(emp);
    },
    async create(args: {
      data: {
        solicitanteNome: string;
        responsavelId: number;
        dataRetirada: Date;
        observacao?: string;
        itens: { create: Array<{ equipamentoId: number; quantidade: number }> };
      };
      include?: unknown;
    }) {
      const emp: EmprestimoRecord = {
        id: db.nextEmprestimoId++,
        solicitanteNome: args.data.solicitanteNome,
        responsavelId: args.data.responsavelId,
        status: 'ABERTO',
        dataRetirada: args.data.dataRetirada,
        dataDevolucao: null,
        observacao: args.data.observacao ?? null,
        createdAt: new Date(),
      };
      db.emprestimos.push(emp);

      for (const it of args.data.itens.create) {
        db.itensEmprestimo.push({
          id: db.nextItemEmprestimoId++,
          emprestimoId: emp.id,
          equipamentoId: it.equipamentoId,
          quantidade: it.quantidade,
        });
      }

      return mapEmprestimoComDetalhes(emp);
    },
    async updateMany(args: {
      where: { id: number; status?: 'ABERTO' | 'DEVOLVIDO' };
      data: { status: 'ABERTO' | 'DEVOLVIDO'; dataDevolucao: Date };
    }) {
      const emp = db.emprestimos.find((e) => e.id === args.where.id);
      if (!emp) return { count: 0 };
      if (args.where.status && emp.status !== args.where.status) return { count: 0 };
      emp.status = args.data.status;
      emp.dataDevolucao = args.data.dataDevolucao;
      return { count: 1 };
    },
  },

  itemEmprestimo: {
    async findMany(args: { where: { emprestimoId: number } }) {
      return db.itensEmprestimo.filter((i) => i.emprestimoId === args.where.emprestimoId);
    },
    async deleteMany(args: { where: { emprestimoId: number } }) {
      const count = db.itensEmprestimo.filter((i) => i.emprestimoId === args.where.emprestimoId).length;
      db.itensEmprestimo = db.itensEmprestimo.filter((i) => i.emprestimoId !== args.where.emprestimoId);
      return { count };
    },
    async createMany(args: {
      data: Array<{ emprestimoId: number; equipamentoId: number; quantidade: number }>;
    }) {
      for (const d of args.data) {
        db.itensEmprestimo.push({
          id: db.nextItemEmprestimoId++,
          emprestimoId: d.emprestimoId,
          equipamentoId: d.equipamentoId,
          quantidade: d.quantidade,
        });
      }
      return { count: args.data.length };
    },
  },

  ocorrencia: {
    async findMany(args?: unknown) {
      return [...db.ocorrencias]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(mapOcorrenciaComEquipamento);
    },
    async findUnique(args: { where: { id: number } }) {
      const oco = db.ocorrencias.find((o) => o.id === args.where.id);
      return oco ? mapOcorrenciaComEquipamento(oco) : null;
    },
    async create(args: {
      data: {
        equipamentoId: number;
        tipo: 'OBSERVACAO' | 'MANUTENCAO' | 'QUEBRADO';
        problema: string;
        descricao: string;
        numero?: string;
      };
      include?: unknown;
    }) {
      const criada: OcorrenciaRecord = {
        id: db.nextOcorrenciaId++,
        equipamentoId: args.data.equipamentoId,
        numero: args.data.numero ?? null,
        tipo: args.data.tipo,
        status: 'ABERTO',
        problema: args.data.problema,
        descricao: args.data.descricao,
        resolvidoEm: null,
        medidasTomadas: null,
        createdAt: new Date(),
      };
      db.ocorrencias.push(criada);
      return mapOcorrenciaComEquipamento(criada);
    },
    async update(args: {
      where: { id: number };
      data: {
        status?: 'ABERTO' | 'RESOLVIDO';
        resolvidoEm?: Date;
        medidasTomadas?: string;
        problema?: string;
        descricao?: string;
        numero?: string;
      };
      include?: unknown;
    }) {
      const oco = db.ocorrencias.find((o) => o.id === args.where.id);
      if (!oco) throw new Error('Ocorrência não encontrada');
      if (args.data.status !== undefined) oco.status = args.data.status;
      if (args.data.resolvidoEm !== undefined) oco.resolvidoEm = args.data.resolvidoEm;
      if (args.data.medidasTomadas !== undefined) oco.medidasTomadas = args.data.medidasTomadas;
      if (args.data.problema !== undefined) oco.problema = args.data.problema;
      if (args.data.descricao !== undefined) oco.descricao = args.data.descricao;
      if (args.data.numero !== undefined) oco.numero = args.data.numero;
      return mapOcorrenciaComEquipamento(oco);
    },
    async delete(args: { where: { id: number } }) {
      const idx = db.ocorrencias.findIndex((o) => o.id === args.where.id);
      if (idx !== -1) {
        const [removida] = db.ocorrencias.splice(idx, 1);
        return mapOcorrenciaComEquipamento(removida);
      }
      return null;
    },
  },
};

/**
 * Proxy do Prisma:
 * Executa as operações delegando para realPrisma se o banco estiver conectado,
 * ou recorre de forma transparente ao inMemoryPrisma caso o banco esteja indisponível.
 */
export const prisma: any = new Proxy(realPrisma, {
  get(target, prop, receiver) {
    if (useInMemory && prop in inMemoryPrisma) {
      return (inMemoryPrisma as any)[prop];
    }

    const orig = Reflect.get(target, prop, receiver);
    if (typeof orig === 'object' && orig !== null && prop in inMemoryPrisma) {
      const memoryModel = (inMemoryPrisma as any)[prop];
      return new Proxy(orig, {
        get(modelTarget, modelProp) {
          const modelMethod = Reflect.get(modelTarget, modelProp);
          if (typeof modelMethod === 'function') {
            return async (...args: any[]) => {
              if (useInMemory) {
                return (memoryModel as any)[modelProp](...args);
              }
              try {
                return await modelMethod.apply(modelTarget, args);
              } catch (err: any) {
                // Se falhar conexão com o banco de dados (ex: host inalcançável)
                if (
                  err?.name === 'PrismaClientInitializationError' ||
                  err?.code === 'P1001' ||
                  err?.message?.includes("Can't reach database server") ||
                  err?.message?.includes('ECONNREFUSED')
                ) {
                  logger.warn(`PostgreSQL inalcançável (${err.message}). Alternando para in-memory store de demonstração.`);
                  useInMemory = true;
                  return (memoryModel as any)[modelProp](...args);
                }
                throw err;
              }
            };
          }
          return modelMethod;
        },
      });
    }

    return orig;
  },
});

/**
 * Executa uma transação interativa com timeout padrão de 15 segundos.
 */
export async function runTransaction<T>(
  fn: (tx: any) => Promise<T>,
  options?: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  }
): Promise<T> {
  if (useInMemory) {
    return fn(inMemoryPrisma);
  }

  try {
    return await realPrisma.$transaction(fn, {
      timeout: options?.timeout ?? TRANSACTION_TIMEOUT_MS,
      maxWait: options?.maxWait ?? TRANSACTION_MAX_WAIT_MS,
      isolationLevel: options?.isolationLevel,
    });
  } catch (err: any) {
    if (
      err?.name === 'PrismaClientInitializationError' ||
      err?.code === 'P1001' ||
      err?.message?.includes("Can't reach database server")
    ) {
      logger.warn(`Transação falhou por indisponibilidade de banco. Alternando para in-memory store.`);
      useInMemory = true;
      return fn(inMemoryPrisma);
    }
    throw err;
  }
}
