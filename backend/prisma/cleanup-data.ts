/**
 * Script de nettoyage des données aberrantes
 * Usage: npx ts-node prisma/cleanup-data.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Démarrage du nettoyage des données aberrantes...\n');

  // 1. Trouver les consommations avec heuresMarche aberrantes (> 24h par jour)
  const aberrantes = await prisma.consommation.findMany({
    where: {
      OR: [
        { heuresMarche: { gt: 50 } },          // Plus de 50h en un poste = impossible
        { heuresMarche: { lt: 0 } },           // Négatif
        { quantiteGasoil: { gt: 100000 } },    // Plus de 100k litres = aberrant
        { compteurFin: { gt: 9999999 } },      // Compteur > 10 millions = aberrant
      ],
    },
    include: { engin: { select: { nom: true, code: true } } },
  });

  console.log(`📊 ${aberrantes.length} consommations aberrantes trouvées\n`);

  if (aberrantes.length > 0) {
    console.log('Exemples :');
    aberrantes.slice(0, 10).forEach(c => {
      console.log(`  - ${c.engin.nom} (${c.date.toISOString().slice(0,10)}, ${c.poste}): ${c.heuresMarche}h, ${c.quantiteGasoil}L, compteur ${c.compteurFin}`);
    });
    console.log();
  }

  // 2. Correction : recalculer heuresMarche en ignorant les valeurs aberrantes
  let corrected = 0;
  for (const c of aberrantes) {
    await prisma.consommation.update({
      where: { id: c.id },
      data: {
        heuresMarche: null,
        consommationHeure: null,
      },
    });
    corrected++;
  }

  console.log(`✅ ${corrected} consommations nettoyées (heuresMarche mise à null)\n`);

  // 3. Réinitialiser les dernierCompteur aberrants des engins
  const enginsAberrants = await prisma.engin.findMany({
    where: { dernierCompteur: { gt: 9999999 } },
  });

  console.log(`📊 ${enginsAberrants.length} engins avec compteur aberrant\n`);

  for (const e of enginsAberrants) {
    console.log(`  - Reset compteur de ${e.nom}: ${e.dernierCompteur} → null`);
    await prisma.engin.update({
      where: { id: e.id },
      data: { dernierCompteur: null },
    });
  }

  console.log(`\n✅ Nettoyage terminé !\n`);

  // 4. Stats finales
  const totals = await prisma.consommation.aggregate({
    _sum: { quantiteGasoil: true, heuresMarche: true },
    _count: true,
  });
  console.log(`📊 État après nettoyage :`);
  console.log(`   ${totals._count} consommations`);
  console.log(`   ${Math.round(totals._sum.quantiteGasoil || 0).toLocaleString('fr-FR')} L de carburant`);
  console.log(`   ${Math.round((totals._sum.heuresMarche || 0) * 10) / 10} h de marche`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());