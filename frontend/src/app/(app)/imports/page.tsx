'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { importsApi } from '@/lib/api';
import {
  FileSpreadsheet,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { formatDateTime, formatDate } from '@/lib/utils';

const statutConfig: Record<string, { label: string; color: string }> = {
  SUCCES: { label: 'Succès', color: 'bg-green-50 text-green-700 dark:bg-green-900/20' },
  PARTIEL: { label: 'Partiel', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20' },
  ERREUR: { label: 'Erreur', color: 'bg-red-50 text-red-700 dark:bg-red-900/20' },
  EN_COURS: { label: 'En cours', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20' },
};

export default function ImportsPage() {
  const [imports, setImports] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchImports = async (p = 1) => {
    setIsLoading(true);
    try {
      const result = await importsApi.getAll({ page: String(p), limit: '15' });
      setImports(result.data);
      setPagination(result.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchImports(1); }, []);

  const handleDelete = async (id: string, nom: string) => {
    if (!confirm(`Supprimer l'import "${nom}" et toutes ses consommations ?`)) return;
    try {
      await importsApi.delete(id);
      fetchImports(page);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Historique des imports</h1>
          <p className="page-subtitle">{pagination.total} imports réalisés</p>
        </div>
        <Link
          href="/imports/upload"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-primary-500/25"
        >
          <Upload className="h-4 w-4" />
          Nouvel import
        </Link>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fichier</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Importé par</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                <th className="text-right py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lignes</th>
                <th className="text-right py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Engins</th>
                <th className="text-right py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Erreurs</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Période</th>
                <th className="py-3.5 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : imports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Aucun import trouvé</p>
                    <Link href="/imports/upload" className="text-primary-600 text-sm mt-2 inline-block hover:underline">
                      Importer votre premier fichier
                    </Link>
                  </td>
                </tr>
              ) : (
                imports.map((imp) => {
                  const statut = statutConfig[imp.statut] || { label: imp.statut, color: 'bg-muted text-muted-foreground' };
                  return (
                    <tr key={imp.id} className="hover:bg-accent/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="font-medium text-sm text-foreground truncate max-w-[220px]">
                            {imp.nomFichier}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-muted-foreground">
                        {imp.utilisateur?.prenom} {imp.utilisateur?.nom}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {formatDateTime(imp.dateImport)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statut.color}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {statut.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-sm font-semibold">{imp.nombreLignes}</td>
                      <td className="py-3.5 px-4 text-right text-sm font-semibold">{imp.nombreEngins}</td>
                      <td className="py-3.5 px-4 text-right">
                        {imp.nombreErreurs > 0 ? (
                          <span className="text-sm font-semibold text-red-600">{imp.nombreErreurs}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {imp.periodeDebut && imp.periodeFin ? (
                          `${formatDate(imp.periodeDebut)} – ${formatDate(imp.periodeFin)}`
                        ) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleDelete(imp.id, imp.nomFichier)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} sur {pagination.pages} • {pagination.total} imports
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { const p = page - 1; setPage(p); fetchImports(p); }}
                disabled={page === 1}
                className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => { const p = page + 1; setPage(p); fetchImports(p); }}
                disabled={page === pagination.pages}
                className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
