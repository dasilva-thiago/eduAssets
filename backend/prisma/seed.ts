import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const notebook = await prisma.categoria.upsert({
    where: { nome: 'Notebook' },
    update: {},
    create: { nome: 'Notebook' },
  });
  const tablet = await prisma.categoria.upsert({
    where: { nome: 'Tablet' },
    update: {},
    create: { nome: 'Tablet' },
  });
  const fone = await prisma.categoria.upsert({
    where: { nome: 'Fone de ouvido' },
    update: {},
    create: { nome: 'Fone de ouvido' },
  });
  const fonte = await prisma.categoria.upsert({
    where: { nome: 'Fonte de carregamento' },
    update: {},
    create: { nome: 'Fonte de carregamento' },
  });
  const carregador = await prisma.categoria.upsert({
    where: { nome: 'Carregador USB' },
    update: {},
    create: { nome: 'Carregador USB' },
  });

  async function upsertEquipamento(data: {
    categoriaId: number;
    modelo: string;
    quantidadeTotal: number;
    quantidadeDisponivel: number;
    quantidadeQuebrada?: number;
  }) {
    const existente = await prisma.equipamento.findFirst({
      where: { categoriaId: data.categoriaId, modelo: data.modelo },
    });
    if (existente) return existente;
    return prisma.equipamento.create({ data });
  }

  await Promise.all([
    upsertEquipamento({
      categoriaId: notebook.id,
      modelo: 'Multilaser',
      quantidadeTotal: 40,
      quantidadeDisponivel: 28,
      quantidadeQuebrada: 2,
    }),
    upsertEquipamento({
      categoriaId: tablet.id,
      modelo: 'Samsung Galaxy Tab A',
      quantidadeTotal: 20,
      quantidadeDisponivel: 15,
      quantidadeQuebrada: 1,
    }),
    upsertEquipamento({
      categoriaId: fone.id,
      modelo: 'JBL Tune 510',
      quantidadeTotal: 15,
      quantidadeDisponivel: 12,
    }),
    upsertEquipamento({
      categoriaId: fonte.id,
      modelo: 'Fonte Universal 65W',
      quantidadeTotal: 10,
      quantidadeDisponivel: 9,
    }),
    upsertEquipamento({
      categoriaId: carregador.id,
      modelo: 'USB-C 20W',
      quantidadeTotal: 25,
      quantidadeDisponivel: 20,
    }),
  ]);

  async function upsertResponsavel(data: { nome: string; cargo: string }) {
    const existente = await prisma.responsavel.findFirst({ where: { nome: data.nome } });
    if (existente) return existente;
    return prisma.responsavel.create({ data });
  }

  await Promise.all([
    upsertResponsavel({ nome: 'Thiago da Silva', cargo: 'Administrador' }),
    upsertResponsavel({ nome: 'Prof. Maria', cargo: 'Professora' }),
    upsertResponsavel({ nome: 'Prof. João', cargo: 'Professor' }),
  ]);

  const senhaAdminInicial = process.env.SEED_ADMIN_PASSWORD;
  if (!senhaAdminInicial) {
    console.error('Erro: SEED_ADMIN_PASSWORD não está definida.');
    process.exit(1);
  }
  const senhaHash = await bcrypt.hash(senhaAdminInicial, 10);

  await prisma.usuario.upsert({
    where: { login: 'admin@eduassets.com' },
    update: {passwordHash: senhaHash},
    create: {
      nome: 'Thiago da Silva',
      login: 'admin@eduassets.com',
      passwordHash: senhaHash,
      nivelAcesso: 'ADMINISTRADOR',
    },
  });

  console.log('Seed concluído com sucesso.');
}

main()
  .catch((erro) => {
    console.error('Erro ao rodar o seed:', erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });