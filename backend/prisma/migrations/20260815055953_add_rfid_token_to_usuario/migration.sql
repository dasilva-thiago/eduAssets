/*
  Warnings:

  - A unique constraint covering the columns `[rfidTokenHash]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "rfidTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_rfidTokenHash_key" ON "Usuario"("rfidTokenHash");
