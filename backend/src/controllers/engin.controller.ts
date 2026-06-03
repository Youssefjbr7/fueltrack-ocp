import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const getEngins = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, type, site, actif, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (search) {
      where.OR = [
        { nom: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (type) where.type = type;
    if (site) where.site = site;
    if (actif !== undefined) where.actif = actif === 'true';

    const [engins, total] = await Promise.all([
      prisma.engin.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { nom: 'asc' },
        include: {
          _count: { select: { consommations: true } },
          consommations: {
            orderBy: { date: 'desc' },
            take: 1,
            select: { date: true, compteurFin: true, quantiteGasoil: true },
          },
        },
      }),
      prisma.engin.count({ where }),
    ]);

    res.json({
      data: engins,
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

export const getEnginById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const engin = await prisma.engin.findUnique({
      where: { id: req.params.id },
      include: {
        consommations: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!engin) throw new AppError('Engin non trouvé', 404);
    res.json(engin);
  } catch (error) {
    next(error);
  }
};

export const createEngin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, nom, type, categorie, site, description } = req.body;

    const engin = await prisma.engin.create({
      data: { code, nom, type, categorie, site, description },
    });

    res.status(201).json(engin);
  } catch (error) {
    next(error);
  }
};

export const updateEngin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, nom, type, categorie, site, description, actif } = req.body;

    const engin = await prisma.engin.update({
      where: { id: req.params.id },
      data: { code, nom, type, categorie, site, description, actif },
    });

    res.json(engin);
  } catch (error) {
    next(error);
  }
};

export const deleteEngin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.engin.update({
      where: { id: req.params.id },
      data: { actif: false },
    });

    res.json({ message: 'Engin désactivé avec succès' });
  } catch (error) {
    next(error);
  }
};

export const getEnginStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { periode = '30' } = req.query;

    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - parseInt(periode as string));

    const consommations = await prisma.consommation.findMany({
      where: {
        enginId: id,
        date: { gte: dateDebut },
      },
      orderBy: { date: 'asc' },
    });

    const totalCarburant = consommations.reduce((sum, c) => sum + c.quantiteGasoil, 0);
    const totalHeures = consommations.reduce((sum, c) => sum + (c.heuresMarche || 0), 0);
    const consommationMoyenne = totalHeures > 0 ? totalCarburant / totalHeures : 0;

    res.json({
      totalCarburant: Math.round(totalCarburant),
      totalHeures: Math.round(totalHeures * 10) / 10,
      consommationMoyenne: Math.round(consommationMoyenne * 10) / 10,
      nombreJours: consommations.length,
      historique: consommations,
    });
  } catch (error) {
    next(error);
  }
};
