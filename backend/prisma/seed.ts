import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categorias = await Promise.all([
    prisma.categoria.create({ data: { nome: 'Notebook' } }),
    prisma.categoria.create({ data: { nome: 'Tablet' } }),
    prisma.categoria.create({ data: { nome: 'Fone de ouvido' } }),
    prisma.categoria.create({ data: { nome: 'Fonte de carregamento' } }),
    prisma.categoria.create({ data: { nome: 'Carregador USB' } }),
  ]);

  const [notebook, tablet, fone, fonte, carregador] = categorias;

  await Promise.all([
    prisma.equipamento.create({
      data: {
        categoriaId: notebook.id,
        modelo: 'Multilaser',
        quantidadeTotal: 40,
        quantidadeDisponivel: 28,
        quantidadeQuebrada: 2,
      },
    }),
    prisma.equipamento.create({
      data: {
        categoriaId: tablet.id,
        modelo: 'Samsung Galaxy Tab A',
        quantidadeTotal: 20,
        quantidadeDisponivel: 15,
        quantidadeQuebrada: 1,
      },
    }),
    prisma.equipamento.create({
      data: {
        categoriaId: fone.id,
        modelo: 'JBL Tune 510',
        quantidadeTotal: 15,
        quantidadeDisponivel: 12,
      },
    }),
    prisma.equipamento.create({
      data: {
        categoriaId: fonte.id,
        modelo: 'Fonte Universal 65W',
        quantidadeTotal: 10,
        quantidadeDisponivel: 9,
      },
    }),
    prisma.equipamento.create({
      data: {
        categoriaId: carregador.id,
        modelo: 'USB-C 20W',
        quantidadeTotal: 25,
        quantidadeDisponivel: 20,
      },
    }),
  ]);

  await Promise.all([
    prisma.responsavel.create({ data: { nome: 'Thiago da Silva', cargo: 'Administrador' } }),
    prisma.responsavel.create({ data: { nome: 'Prof. Maria', cargo: 'Professora' } }),
    prisma.responsavel.create({ data: { nome: 'Prof. João', cargo: 'Professor' } }),
  ]);

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