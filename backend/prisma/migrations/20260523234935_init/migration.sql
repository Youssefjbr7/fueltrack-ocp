-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'OPERATEUR');

-- CreateEnum
CREATE TYPE "StatutImport" AS ENUM ('EN_COURS', 'SUCCES', 'ERREUR', 'PARTIEL');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERATEUR',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engins" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "categorie" TEXT,
    "site" TEXT,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dernierCompteur" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consommations" (
    "id" TEXT NOT NULL,
    "enginId" TEXT NOT NULL,
    "importId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "poste" TEXT NOT NULL,
    "compteurDebut" DOUBLE PRECISION,
    "compteurFin" DOUBLE PRECISION,
    "quantiteGasoil" DOUBLE PRECISION NOT NULL,
    "heuresMarche" DOUBLE PRECISION,
    "consommationHeure" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consommations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imports_excel" (
    "id" TEXT NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "cheminFichier" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "statut" "StatutImport" NOT NULL DEFAULT 'EN_COURS',
    "nombreLignes" INTEGER NOT NULL DEFAULT 0,
    "nombreEngins" INTEGER NOT NULL DEFAULT 0,
    "nombreErreurs" INTEGER NOT NULL DEFAULT 0,
    "erreurs" JSONB,
    "dateImport" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodeDebut" TIMESTAMP(3),
    "periodeFin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imports_excel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "engins_code_key" ON "engins"("code");

-- AddForeignKey
ALTER TABLE "consommations" ADD CONSTRAINT "consommations_enginId_fkey" FOREIGN KEY ("enginId") REFERENCES "engins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consommations" ADD CONSTRAINT "consommations_importId_fkey" FOREIGN KEY ("importId") REFERENCES "imports_excel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imports_excel" ADD CONSTRAINT "imports_excel_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
