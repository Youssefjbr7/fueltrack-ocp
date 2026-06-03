import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { importExcelData } from '../services/excel.service';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const uploadExcel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('Aucun fichier uploadé', 400);
    }

    const { originalname, path: filePath, size } = req.file;
    const ext = path.extname(originalname).toLowerCase();

    if (!['.xlsx', '.xlsb', '.xls'].includes(ext)) {
      fs.unlinkSync(filePath);
      throw new AppError('Format de fichier non supporté. Utilisez .xlsx, .xlsb ou .xls', 400);
    }

    logger.info(`📁 Import fichier: ${originalname} (${size} bytes)`);

    // Créer l'enregistrement d'import
    const importRecord = await prisma.importExcel.create({
      data: {
        nomFichier: originalname,
        cheminFichier: filePath,
        utilisateurId: req.user!.id,
        statut: 'EN_COURS',
      },
    });

    // Importer les données
    const result = await importExcelData(filePath, req.user!.id, importRecord.id);

    // Mise à jour du record d'import
    await prisma.importExcel.update({
      where: { id: importRecord.id },
      data: {
        statut: result.success
          ? (result.erreurs.length > 0 ? 'PARTIEL' : 'SUCCES')
          : 'ERREUR',
        nombreLignes: result.totalLignes,
        nombreEngins: result.enginsCrees,
        nombreErreurs: result.erreurs.length,
        erreurs: result.erreurs.length > 0 || result.avertissements.length > 0
          ? { erreurs: result.erreurs, avertissements: result.avertissements }
          : undefined,
        periodeDebut: result.periodeDebut,
        periodeFin: result.periodeFin,
      },
    });

    // Archiver le fichier
    const archiveDir = path.join(process.cwd(), 'uploads', 'archives');
    if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
    const archivePath = path.join(archiveDir, `${importRecord.id}_${originalname}`);
    try {
      fs.renameSync(filePath, archivePath);
      await prisma.importExcel.update({
        where: { id: importRecord.id },
        data: { cheminFichier: archivePath },
      });
    } catch (err) {
      logger.warn(`Impossible d'archiver le fichier: ${err}`);
    }

    const finalImport = await prisma.importExcel.findUnique({
      where: { id: importRecord.id },
      include: { utilisateur: { select: { nom: true, prenom: true } } },
    });

    res.json({
      import: finalImport,
      resume: {
        totalLignes: result.totalLignes,
        creees: result.consommationsCrees,
        enginsCrees: result.enginsCrees,
        erreurs: result.erreurs,
        avertissements: result.avertissements,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getImports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [imports, total] = await Promise.all([
      prisma.importExcel.findMany({
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          utilisateur: { select: { nom: true, prenom: true, email: true } },
          _count: { select: { consommations: true } },
        },
      }),
      prisma.importExcel.count(),
    ]);

    res.json({
      data: imports,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getImportById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const importRecord = await prisma.importExcel.findUnique({
      where: { id: req.params.id },
      include: {
        utilisateur: { select: { nom: true, prenom: true } },
        consommations: {
          include: { engin: { select: { nom: true, code: true } } },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!importRecord) throw new AppError('Import non trouvé', 404);
    res.json(importRecord);
  } catch (error) {
    next(error);
  }
};

export const deleteImport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const importRecord = await prisma.importExcel.findUnique({
      where: { id: req.params.id },
    });

    if (!importRecord) throw new AppError('Import non trouvé', 404);

    await prisma.consommation.deleteMany({ where: { importId: req.params.id } });
    await prisma.importExcel.delete({ where: { id: req.params.id } });

    if (importRecord.cheminFichier && fs.existsSync(importRecord.cheminFichier)) {
      fs.unlinkSync(importRecord.cheminFichier);
    }

    res.json({ message: 'Import supprimé avec succès' });
  } catch (error) {
    next(error);
  }
};