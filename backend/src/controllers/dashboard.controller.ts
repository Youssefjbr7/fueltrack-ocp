import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { periode = '30' } = req.query;
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - parseInt(periode as string));

    const [
      totalEngins,
      enginsActifs,
      totalConsommations,
      consommationsPeriode,
      totalCarburantMois,
      totalCarburantMoisPrecedent,
      topEngins,
      consommationParJour,
      consommationParPoste,
      consommationParType,
      derniersImports,
    ] = await Promise.all([
      prisma.engin.count(),

      prisma.engin.count({
        where: {
          consommations: {
            some: { date: { gte: dateDebut } },
          },
        },
      }),

      prisma.consommation.count(),

      prisma.consommation.count({ where: { date: { gte: dateDebut } } }),

      prisma.consommation.aggregate({
        where: { date: { gte: dateDebut } },
        _sum: { quantiteGasoil: true, heuresMarche: true },
      }),

      prisma.consommation.aggregate({
        where: {
          date: {
            gte: new Date(dateDebut.getTime() - parseInt(periode as string) * 24 * 60 * 60 * 1000),
            lt: dateDebut,
          },
        },
        _sum: { quantiteGasoil: true },
      }),

      prisma.consommation.groupBy({
        by: ['enginId'],
        where: { date: { gte: dateDebut } },
        _sum: { quantiteGasoil: true, heuresMarche: true },
        orderBy: { _sum: { quantiteGasoil: 'desc' } },
        take: 10,
      }),

      // Consommation par jour avec heures de marche
      prisma.$queryRaw<Array<{ jour: Date; total: number; heures: number; nb_consommations: bigint }>>`
        SELECT
          DATE(date) as jour,
          COALESCE(SUM("quantiteGasoil"), 0)::float as total,
          COALESCE(SUM("heuresMarche"), 0)::float as heures,
          COUNT(*) as nb_consommations
        FROM consommations
        WHERE date >= ${dateDebut}
        GROUP BY DATE(date)
        ORDER BY jour ASC
      `,

      prisma.consommation.groupBy({
        by: ['poste'],
        where: { date: { gte: dateDebut } },
        _sum: { quantiteGasoil: true },
        _count: true,
      }),

      prisma.$queryRaw<Array<{ type: string; total: number; nb_engins: bigint }>>`
        SELECT
          e.type,
          COALESCE(SUM(c."quantiteGasoil"), 0)::float as total,
          COUNT(DISTINCT c."enginId") as nb_engins
        FROM consommations c
        JOIN engins e ON c."enginId" = e.id
        WHERE c.date >= ${dateDebut}
        GROUP BY e.type
        ORDER BY total DESC
      `,

      prisma.importExcel.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { utilisateur: { select: { nom: true, prenom: true } } },
      }),
    ]);

    // Normaliser les chartParJour pour matcher ce qu'attend le frontend
    const chartParJourNormalise = consommationParJour.map((row) => ({
      date: new Date(row.jour).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      conso: Number(row.total) || 0,
      heures: Number(row.heures) || 0,
    }));

    const chartParPosteNormalise = consommationParPoste.map((row) => ({
      poste: row.poste,
      conso: Number(row._sum.quantiteGasoil) || 0,
      count: Number(row._count) || 0,
    }));

    const chartParTypeNormalise = consommationParType.map((row) => ({
      type: row.type,
      conso: Number(row.total) || 0,
    }));

    // Enrichir top engins
    const topEnginsEnriched = await Promise.all(
      topEngins.map(async (item) => {
        const engin = await prisma.engin.findUnique({
          where: { id: item.enginId },
          select: { id: true, nom: true, code: true, type: true },
        });
        return {
          nom: engin?.nom || 'Inconnu',
          type: engin?.type || '',
          code: engin?.code || '',
          conso: Math.round(item._sum.quantiteGasoil || 0),
          heures: Math.round((item._sum.heuresMarche || 0) * 10) / 10,
        };
      })
    );

    const currentTotal = totalCarburantMois._sum.quantiteGasoil || 0;
    const previousTotal = totalCarburantMoisPrecedent._sum.quantiteGasoil || 0;
    const variation = previousTotal > 0
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
      : 0;

    const totalHeures = totalCarburantMois._sum.heuresMarche || 0;
    const consommationMoyenneGlobale = totalHeures > 0
      ? Math.round((currentTotal / totalHeures) * 10) / 10
      : 0;

    res.json({
      kpis: {
        totalEngins,
        enginsActifs,
        totalConsommations,
        consommationsPeriode,
        totalCarburant: Math.round(currentTotal),
        totalConsommation: Math.round(currentTotal), // alias pour compatibilité frontend
        totalHeures: Math.round(totalHeures * 10) / 10,
        consommationMoyenneGlobale,
        moyenneConso: consommationMoyenneGlobale, // alias
        variation,
      },
      // Structure normalisée directement accessible
      chartParJour: chartParJourNormalise,
      chartParPoste: chartParPosteNormalise,
      chartParType: chartParTypeNormalise,
      topEngins: topEnginsEnriched,
      // Structure imbriquée (compat)
      charts: {
        consommationParJour: chartParJourNormalise,
        consommationParPoste: chartParPosteNormalise,
        consommationParType: chartParTypeNormalise,
        topEngins: topEnginsEnriched,
      },
      derniersImports,
    });
  } catch (error) {
    next(error);
  }
};

export const getAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const enginsInactifs = await prisma.engin.findMany({
      where: {
        actif: true,
        OR: [
          { consommations: { none: {} } },
          { consommations: { none: { date: { gte: sevenDaysAgo } } } },
        ],
      },
      select: { id: true, nom: true, code: true, type: true },
      take: 10,
    });

    const avgResult = await prisma.consommation.aggregate({
      _avg: { consommationHeure: true },
      _count: true,
    });

    res.json({
      enginsInactifs,
      totalEnginsInactifs: enginsInactifs.length,
      moyenneConsommation: Math.round((avgResult._avg.consommationHeure || 0) * 10) / 10,
    });
  } catch (error) {
    next(error);
  }
};