import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@2024', 10);
  const admin = await prisma.utilisateur.upsert({
    where: { email: 'admin@ocp.ma' },
    update: {},
    create: {
      nom: 'ADMIN',
      prenom: 'Système',
      email: 'admin@ocp.ma',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const managerPassword = await bcrypt.hash('Manager@2024', 10);
  await prisma.utilisateur.upsert({
    where: { email: 'manager@ocp.ma' },
    update: {},
    create: {
      nom: 'BENALI',
      prenom: 'Karim',
      email: 'manager@ocp.ma',
      password: managerPassword,
      role: Role.MANAGER,
    },
  });

  const operateurPassword = await bcrypt.hash('Operateur@2024', 10);
  await prisma.utilisateur.upsert({
    where: { email: 'operateur@ocp.ma' },
    update: {},
    create: {
      nom: 'ALAMI',
      prenom: 'Said',
      email: 'operateur@ocp.ma',
      password: operateurPassword,
      role: Role.OPERATEUR,
    },
  });

  // Create engins
  const enginsData = [
    { code: 'CAT-001', nom: 'CAT 785C', type: 'Tombereau', categorie: 'Transport', site: 'Khouribga' },
    { code: 'CAT-002', nom: 'CAT 793F', type: 'Tombereau', categorie: 'Transport', site: 'Khouribga' },
    { code: 'KOM-001', nom: 'KOMATSU HD785', type: 'Tombereau', categorie: 'Transport', site: 'Benguerir' },
    { code: 'KOM-002', nom: 'KOMATSU WA600', type: 'Chargeur', categorie: 'Chargement', site: 'Benguerir' },
    { code: 'CAT-003', nom: 'CAT 992K', type: 'Chargeur', categorie: 'Chargement', site: 'Khouribga' },
    { code: 'LIE-001', nom: 'LIEBHERR T282', type: 'Tombereau', categorie: 'Transport', site: 'Youssoufia' },
    { code: 'CAT-004', nom: 'CAT D11T', type: 'Bulldozer', categorie: 'Terrassement', site: 'Khouribga' },
    { code: 'KOM-003', nom: 'KOMATSU D375A', type: 'Bulldozer', categorie: 'Terrassement', site: 'Benguerir' },
    { code: 'HIT-001', nom: 'HITACHI EX3600', type: 'Pelle', categorie: 'Excavation', site: 'Youssoufia' },
    { code: 'KOM-004', nom: 'KOMATSU PC4000', type: 'Pelle', categorie: 'Excavation', site: 'Khouribga' },
    { code: 'CAT-005', nom: 'CAT 16M', type: 'Niveleuse', categorie: 'Terrassement', site: 'Benguerir' },
    { code: 'VOL-001', nom: 'VOLVO EC700', type: 'Pelle', categorie: 'Excavation', site: 'Youssoufia' },
  ];

  const engins: any[] = [];
  for (const enginData of enginsData) {
    const engin = await prisma.engin.upsert({
      where: { code: enginData.code },
      update: {},
      create: {
        ...enginData,
        dernierCompteur: Math.floor(Math.random() * 10000) + 5000,
      },
    });
    engins.push(engin);
  }

  // Create sample import
  const importRecord = await prisma.importExcel.create({
    data: {
      nomFichier: 'consommation_janvier_2024.xlsx',
      cheminFichier: '/uploads/archives/consommation_janvier_2024.xlsx',
      utilisateurId: admin.id,
      statut: 'SUCCES',
      nombreLignes: 48,
      nombreEngins: 12,
      nombreErreurs: 0,
      periodeDebut: new Date('2024-01-01'),
      periodeFin: new Date('2024-01-31'),
    },
  });

  // Create consommations for last 3 months
  const postes = ['Poste 1', 'Poste 2'];
  const now = new Date();
  
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    for (let day = 1; day <= 28; day += 2) {
      const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, day);
      
      for (const engin of engins.slice(0, 8)) {
        for (const poste of postes) {
          if (Math.random() > 0.1) { // 90% chance of having data
            const compteurDebut = (engin.dernierCompteur || 5000) + (day * 8) + (monthOffset * 240);
            const heuresMarche = Math.random() * 6 + 6; // 6-12 hours
            const compteurFin = compteurDebut + heuresMarche;
            const consommationHeure = Math.random() * 40 + 60; // 60-100 L/h
            const quantiteGasoil = heuresMarche * consommationHeure;

            await prisma.consommation.create({
              data: {
                enginId: engin.id,
                importId: importRecord.id,
                date,
                poste,
                compteurDebut,
                compteurFin,
                quantiteGasoil: Math.round(quantiteGasoil),
                heuresMarche: Math.round(heuresMarche * 10) / 10,
                consommationHeure: Math.round(consommationHeure * 10) / 10,
              },
            });
          }
        }
      }
    }
  }

  console.log('✅ Database seeded successfully!');
  console.log('👤 Comptes créés:');
  console.log('   admin@ocp.ma / Admin@2024');
  console.log('   manager@ocp.ma / Manager@2024');
  console.log('   operateur@ocp.ma / Operateur@2024');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
