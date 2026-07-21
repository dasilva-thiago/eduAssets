-- CreateEnum
CREATE TYPE "NivelAcesso" AS ENUM ('ADMINISTRADOR', 'EDITOR');

-- CreateEnum
CREATE TYPE "StatusEmprestimo" AS ENUM ('ABERTO', 'DEVOLVIDO');

-- CreateEnum
CREATE TYPE "TipoOcorrencia" AS ENUM ('OBSERVACAO', 'MANUTENCAO', 'QUEBRADO');

-- CreateEnum
CREATE TYPE "StatusOcorrencia" AS ENUM ('ABERTO', 'RESOLVIDO');

-- CreateTable
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipamento" (
    "id" SERIAL NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "modelo" TEXT NOT NULL,
    "quantidadeTotal" INTEGER NOT NULL,
    "quantidadeDisponivel" INTEGER NOT NULL,
    "quantidadeQuebrada" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responsavel" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,

    CONSTRAINT "Responsavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "nivelAcesso" "NivelAcesso" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Emprestimo" (
    "id" SERIAL NOT NULL,
    "solicitanteNome" TEXT NOT NULL,
    "responsavelId" INTEGER NOT NULL,
    "status" "StatusEmprestimo" NOT NULL DEFAULT 'ABERTO',
    "dataRetirada" TIMESTAMP(3) NOT NULL,
    "dataDevolucao" TIMESTAMP(3),
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Emprestimo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemEmprestimo" (
    "id" SERIAL NOT NULL,
    "emprestimoId" INTEGER NOT NULL,
    "equipamentoId" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "ItemEmprestimo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ocorrencia" (
    "id" SERIAL NOT NULL,
    "equipamentoId" INTEGER NOT NULL,
    "numero" TEXT,
    "tipo" "TipoOcorrencia" NOT NULL,
    "status" "StatusOcorrencia" NOT NULL DEFAULT 'ABERTO',
    "problema" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "resolvidoEm" TIMESTAMP(3),
    "medidasTomadas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ocorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_login_key" ON "Usuario"("login");

-- AddForeignKey
ALTER TABLE "Equipamento" ADD CONSTRAINT "Equipamento_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emprestimo" ADD CONSTRAINT "Emprestimo_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEmprestimo" ADD CONSTRAINT "ItemEmprestimo_emprestimoId_fkey" FOREIGN KEY ("emprestimoId") REFERENCES "Emprestimo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEmprestimo" ADD CONSTRAINT "ItemEmprestimo_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "Equipamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ocorrencia" ADD CONSTRAINT "Ocorrencia_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "Equipamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
