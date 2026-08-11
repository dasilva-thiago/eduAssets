import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const senhaAdminInicial = process.env.SEED_ADMIN_PASSWORD;
  if (!senhaAdminInicial) {
    console.error('Erro: SEED_ADMIN_PASSWORD não está definida.');
    process.exit(1);
  }
  const senhaHash = await bcrypt.hash(senhaAdminInicial, 10);

  await prisma.usuario.upsert({
    where: { login: 'admin@eduassets.com' },
    update: { passwordHash: senhaHash },
    create: {
      nome: 'Thiago da Silva',
      login: 'admin@eduassets.com',
      passwordHash: senhaHash,
      nivelAcesso: 'ADMINISTRADOR',
    },
  });

  const senhaEditorInicial = process.env.SEED_EDITOR_PASSWORD;
  if (senhaEditorInicial) {
    const senhaEditorHash = await bcrypt.hash(senhaEditorInicial, 10);

    await prisma.usuario.upsert({
      where: { login: 'editor@eduassets.com' },
      update: { passwordHash: senhaEditorHash },
      create: {
        nome: 'Editor de Teste',
        login: 'editor@eduassets.com',
        passwordHash: senhaEditorHash,
        nivelAcesso: 'EDITOR',
      },
    });
  } else {
    console.log('SEED_EDITOR_PASSWORD não definida — usuário EDITOR de teste não criado.');
  }

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