import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface ParsedRow {
  enginNom: string;
  matricule?: string;
  immatriculation?: string;
  date: Date;
  poste: string;       // "Poste 1" ou "Poste 2"
  compteur: number | null;
  quantiteGasoil: number | null;
  moyenne: number | null;
}

interface ImportResult {
  success: boolean;
  totalLignes: number;
  enginsCrees: number;
  consommationsCrees: number;
  erreurs: string[];
  avertissements: string[];
  periodeDebut?: Date;
  periodeFin?: Date;
}

/**
 * Convertit un numéro de série Excel ou string en Date
 */
function parseExcelDate(val: unknown): Date | null {
  if (val == null || val === '') return null;
  if (val instanceof Date) return val;
  if (typeof val === 'number') {
    // Excel serial date (jours depuis 1900-01-01)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + val * 86400000);
  }
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? null : d;
}

function isNumber(v: unknown): boolean {
  return typeof v === 'number' && !isNaN(v) && isFinite(v);
}

function toNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
}

/**
 * Parse un fichier Excel au format OCP :
 * - Ligne 0 : dates (cols 5, 9, 13... ) + récap quinzaine
 * - Ligne 1 : sous-en-têtes (COMP, Q GASOIL, moy, sur/cons)
 * - Ligne 2 : ligne "matricule"
 * - Ligne 3+ : par paires (poste 1 puis poste 2)
 *   Col 1 = nom engin, Col 2 = S/A (matricule cat), Col 3 = compteur initial, Col 4 = immatriculation
 */
export async function parseExcelFile(filePath: string): Promise<ParsedRow[]> {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convertir en array of arrays
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });

  if (rows.length < 4) {
    throw new Error('Fichier Excel trop court ou format invalide');
  }

  // ========== Identifier les colonnes des dates ==========
  const dateRow = rows[0];
  const dateColumns: { col: number; date: Date }[] = [];

  for (let c = 0; c < dateRow.length; c++) {
    const d = parseExcelDate(dateRow[c]);
    if (d && d.getFullYear() > 2000 && d.getFullYear() < 2100) {
      dateColumns.push({ col: c, date: d });
    }
  }

  if (dateColumns.length === 0) {
    throw new Error('Aucune date trouvée dans la première ligne');
  }

  logger.info(`📅 ${dateColumns.length} dates détectées (du ${dateColumns[0].date.toISOString().slice(0, 10)} au ${dateColumns[dateColumns.length - 1].date.toISOString().slice(0, 10)})`);

  // ========== Parser les lignes d'engins ==========
  const parsed: ParsedRow[] = [];

  // Les engins commencent à partir de la ligne 3 (après header rows 0, 1, 2)
  // Format : 2 lignes par engin = Poste 1 + Poste 2
  for (let r = 3; r < rows.length; r += 2) {
    const rowP1 = rows[r];
    const rowP2 = rows[r + 1];

    if (!rowP1) continue;

    // Nom de l'engin en colonne 1
    const enginNom = String(rowP1[1] || '').trim();
    if (!enginNom || enginNom.toLowerCase().includes('flotte') || enginNom === 'NaN') {
      continue; // Skip lignes vides ou en-têtes de flotte
    }

    const matricule = rowP1[2] ? String(rowP1[2]).trim() : undefined;
    const immatriculation = rowP1[4] ? String(rowP1[4]).trim() : undefined;

    // Pour chaque date, extraire COMP/Q GASOIL pour P1 et P2
    for (const { col, date } of dateColumns) {
      // Structure : col = COMP, col+1 = Q GASOIL, col+2 = moy, col+3 = sur/cons
      const compP1 = toNumber(rowP1[col]);
      const gasoilP1 = toNumber(rowP1[col + 1]);
      const moyP1 = toNumber(rowP1[col + 2]);

      const compP2 = rowP2 ? toNumber(rowP2[col]) : null;
      const gasoilP2 = rowP2 ? toNumber(rowP2[col + 1]) : null;
      const moyP2 = rowP2 ? toNumber(rowP2[col + 2]) : null;

      // Poste 1 : on l'ajoute s'il y a au moins un compteur ou une quantité
      if (compP1 !== null || (gasoilP1 !== null && gasoilP1 > 0)) {
        parsed.push({
          enginNom,
          matricule,
          immatriculation,
          date,
          poste: 'Poste 1',
          compteur: compP1,
          quantiteGasoil: gasoilP1,
          moyenne: moyP1,
        });
      }

      // Poste 2
      if (compP2 !== null || (gasoilP2 !== null && gasoilP2 > 0)) {
        parsed.push({
          enginNom,
          matricule,
          immatriculation,
          date,
          poste: 'Poste 2',
          compteur: compP2,
          quantiteGasoil: gasoilP2,
          moyenne: moyP2,
        });
      }
    }
  }

  logger.info(`📊 ${parsed.length} entrées extraites du fichier`);
  return parsed;
}

/**
 * Importe les données parsées dans la base
 */
export async function importExcelData(
  filePath: string,
  utilisateurId: string,
  importId: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    totalLignes: 0,
    enginsCrees: 0,
    consommationsCrees: 0,
    erreurs: [],
    avertissements: [],
  };

  try {
    const parsed = await parseExcelFile(filePath);
    result.totalLignes = parsed.length;

    if (parsed.length === 0) {
      result.erreurs.push('Aucune donnée valide trouvée dans le fichier');
      return result;
    }

    // Calculer période
    const dates = parsed.map(p => p.date).sort((a, b) => a.getTime() - b.getTime());
    result.periodeDebut = dates[0];
    result.periodeFin = dates[dates.length - 1];

    // Grouper par engin
    const enginNames = [...new Set(parsed.map(p => p.enginNom))];
    const enginMap = new Map<string, string>(); // nom -> id

    for (const nom of enginNames) {
      const sample = parsed.find(p => p.enginNom === nom);
      const code = nom.replace(/\s+/g, '-').toUpperCase();

      // Détection auto du type depuis le nom
      let type = 'Engin';
      if (nom.toUpperCase().includes('D11')) type = 'Bulldozer D11';
      else if (nom.toUpperCase().includes('D10')) type = 'Bulldozer D10';
      else if (nom.toUpperCase().includes('PELLE')) type = 'Pelle';
      else if (nom.toUpperCase().includes('CHARG')) type = 'Chargeur';
      else if (nom.toUpperCase().includes('CAMION')) type = 'Camion';

      const engin = await prisma.engin.upsert({
        where: { code },
        update: {
          description: sample?.immatriculation ? `Immat: ${sample.immatriculation}` : undefined,
        },
        create: {
          code,
          nom,
          type,
          categorie: sample?.matricule,
          description: sample?.immatriculation ? `Immat: ${sample.immatriculation}` : undefined,
        },
      });

      if (engin.createdAt.getTime() === engin.updatedAt.getTime()) {
        result.enginsCrees++;
      }

      enginMap.set(nom, engin.id);
    }

    logger.info(`✅ ${enginNames.length} engins traités (${result.enginsCrees} créés)`);

    // Trier par engin + date + poste pour calculer correctement heuresMarche
    parsed.sort((a, b) => {
      if (a.enginNom !== b.enginNom) return a.enginNom.localeCompare(b.enginNom);
      const dt = a.date.getTime() - b.date.getTime();
      if (dt !== 0) return dt;
      return a.poste.localeCompare(b.poste);
    });

    // Maintenir le dernier compteur connu par engin
    const dernierCompteurMap = new Map<string, number>();

    // Récupérer derniers compteurs depuis la BD
    for (const [nom, id] of enginMap) {
      const engin = await prisma.engin.findUnique({
        where: { id },
        select: { dernierCompteur: true },
      });
      if (engin?.dernierCompteur != null) {
        dernierCompteurMap.set(nom, engin.dernierCompteur);
      }
    }

    // Insertion en batch
    let inserted = 0;
    for (const row of parsed) {
      try {
        const enginId = enginMap.get(row.enginNom);
        if (!enginId) continue;

        // Skip si pas de quantité gasoil ET pas de variation compteur
        const hasGasoil = row.quantiteGasoil != null && row.quantiteGasoil > 0;
        const hasCompteur = row.compteur != null;
        if (!hasGasoil && !hasCompteur) continue;

        // Calcul heures de marche
        const compteurDebut = dernierCompteurMap.get(row.enginNom) ?? row.compteur ?? null;
        const compteurFin = row.compteur;
        let heuresMarche: number | null = null;
        if (compteurFin != null && compteurDebut != null && compteurFin >= compteurDebut) {
          heuresMarche = compteurFin - compteurDebut;
        }

        // Calcul consommation/heure
        let consommationHeure: number | null = row.moyenne;
        if (consommationHeure == null && heuresMarche && heuresMarche > 0 && row.quantiteGasoil) {
          consommationHeure = row.quantiteGasoil / heuresMarche;
        }

        await prisma.consommation.create({
          data: {
            enginId,
            importId,
            date: row.date,
            poste: row.poste,
            compteurDebut,
            compteurFin,
            quantiteGasoil: row.quantiteGasoil ?? 0,
            heuresMarche,
            consommationHeure,
          },
        });

        // Mettre à jour le dernier compteur
        if (compteurFin != null) {
          dernierCompteurMap.set(row.enginNom, compteurFin);
        }

        inserted++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue';
        result.avertissements.push(`Ligne ignorée (${row.enginNom} - ${row.date.toISOString().slice(0, 10)}): ${msg}`);
      }
    }

    // Mettre à jour le dernier compteur des engins
    for (const [nom, compteur] of dernierCompteurMap) {
      const id = enginMap.get(nom);
      if (id) {
        await prisma.engin.update({
          where: { id },
          data: { dernierCompteur: compteur },
        });
      }
    }

    result.consommationsCrees = inserted;
    result.success = true;
    logger.info(`✅ Import terminé : ${inserted} consommations créées`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error(`❌ Erreur d'import : ${msg}`);
    result.erreurs.push(msg);
  }

  return result;
}