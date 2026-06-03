import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const getConsommations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      enginId,
      poste,
      dateDebut,
      dateFin,
      search,
      page = '1',
      limit = '20',
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: any = {};

    if (enginId) where.enginId = enginId;
    if (poste) where.poste = poste;
    if (dateDebut || dateFin) {
      where.date = {};
      if (dateDebut) where.date.gte = new Date(dateDebut as string);
      if (dateFin) where.date.lte = new Date(dateFin as string);
    }
    if (search) {
      where.engin = {
        OR: [
          { nom: { contains: search as string, mode: 'insensitive' } },
          { code: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    const [consommations, total] = await Promise.all([
      prisma.consommation.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          engin: { select: { id: true, nom: true, code: true, type: true, site: true } },
        },
      }),
      prisma.consommation.count({ where }),
    ]);

    res.json({
      data: consommations,
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

export const getConsommationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const consommation = await prisma.consommation.findUnique({
      where: { id: req.params.id },
      include: {
        engin: true,
        import: { select: { id: true, nomFichier: true, dateImport: true } },
      },
    });

    if (!consommation) throw new AppError('Consommation non trouvée', 404);
    res.json(consommation);
  } catch (error) {
    next(error);
  }
};

export const createConsommation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { enginId, date, poste, compteurDebut, compteurFin, quantiteGasoil } = req.body;

    // Get last compteur for this engin if compteurDebut not provided
    let debutCompteur = compteurDebut;
    if (!debutCompteur) {
      const derniere = await prisma.consommation.findFirst({
        where: { enginId },
        orderBy: { date: 'desc' },
        select: { compteurFin: true },
      });
      debutCompteur = derniere?.compteurFin || null;
    }

    const heuresMarche = compteurFin && debutCompteur
      ? parseFloat(compteurFin) - parseFloat(debutCompteur)
      : null;

    const consommationHeure = heuresMarche && heuresMarche > 0
      ? Math.round((parseFloat(quantiteGasoil) / heuresMarche) * 10) / 10
      : null;

    const consommation = await prisma.consommation.create({
      data: {
        enginId,
        date: new Date(date),
        poste,
        compteurDebut: debutCompteur ? parseFloat(debutCompteur) : null,
        compteurFin: compteurFin ? parseFloat(compteurFin) : null,
        quantiteGasoil: parseFloat(quantiteGasoil),
        heuresMarche,
        consommationHeure,
      },
      include: { engin: { select: { nom: true, code: true } } },
    });

    // Update engin's last compteur
    if (compteurFin) {
      await prisma.engin.update({
        where: { id: enginId },
        data: { dernierCompteur: parseFloat(compteurFin) },
      });
    }

    res.status(201).json(consommation);
  } catch (error) {
    next(error);
  }
};

export const updateConsommation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, poste, compteurDebut, compteurFin, quantiteGasoil } = req.body;

    const heuresMarche = compteurFin && compteurDebut
      ? parseFloat(compteurFin) - parseFloat(compteurDebut)
      : undefined;

    const consommationHeure = heuresMarche && heuresMarche > 0
      ? Math.round((parseFloat(quantiteGasoil) / heuresMarche) * 10) / 10
      : undefined;

    const consommation = await prisma.consommation.update({
      where: { id: req.params.id },
      data: {
        date: date ? new Date(date) : undefined,
        poste,
        compteurDebut: compteurDebut ? parseFloat(compteurDebut) : undefined,
        compteurFin: compteurFin ? parseFloat(compteurFin) : undefined,
        quantiteGasoil: quantiteGasoil ? parseFloat(quantiteGasoil) : undefined,
        heuresMarche,
        consommationHeure,
      },
    });

    res.json(consommation);
  } catch (error) {
    next(error);
  }
};

export const deleteConsommation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.consommation.delete({ where: { id: req.params.id } });
    res.json({ message: 'Consommation supprimée avec succès' });
  } catch (error) {
    next(error);
  }
};
