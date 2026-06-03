'use client';

import { useState, useEffect, useCallback } from 'react';
import { consommationsApi, enginsApi } from '@/lib/api';
import { formatNumber, formatDate } from '@/lib/utils';
import {
  Droplets,
  Search,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gauge,
  Plus,
  CalendarIcon,
} from 'lucide-react';

export default function ConsommationsPage() {
  const [consommations, setConsommations] = useState<any[]>([]);
  const [engins, setEngins] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    enginId: '',
    poste: '',
    dateDebut: '',
    dateFin: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    enginsApi.getAll({ limit: '200' }).then(r => setEngins(r.data)).catch(console.error);
  }, []);

  const fetchConsommations = useCallback(async (p = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { page: String(p), limit: '20' };
      if (filters.search) params.search = filters.search;
      if (filters.enginId) params.enginId = filters.enginId;
      if (filters.poste) params.poste = filters.poste;
      if (filters.dateDebut) params.dateDebut = filters.dateDebut;
      if (filters.dateFin) params.dateFin = filters.dateFin;

      const result = await consommationsApi.getAll(params);
      setConsommations(result.data);
      setPagination(result.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchConsommations(1); }, 300);
    return () => clearTimeout(timer);
  }, [fetchConsommations]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette consommation ?')) return;
    try {
      await consommationsApi.delete(id);
      fetchConsommations(page);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchConsommations(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Consommations</h1>
          <p className="page-subtitle">{pagination.total} enregistrements</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-primary-500/25"
        >
          <Plus className="h-4 w-4" />
          Nouvelle consommation
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un engin..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={filters.enginId}
            onChange={(e) => setFilters(f => ({ ...f, enginId: e.target.value }))}
            className="px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tous les engins</option>
            {engins.map((e: any) => (
              <option key={e.id} value={e.id}>{e.nom}</option>
            ))}
          </select>
          <select
            value={filters.poste}
            onChange={(e) => setFilters(f => ({ ...f, poste: e.target.value }))}
            className="px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tous les postes</option>
            <option value="Poste 1">Poste 1</option>
            <option value="Poste 2">Poste 2</option>
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.dateDebut}
              onChange={(e) => setFilters(f => ({ ...f, dateDebut: e.target.value }))}
              className="flex-1 px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Engin</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Poste</th>
                <th className="text-right py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compteur début</th>
                <th className="text-right py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compteur fin</th>
                <th className="text-right py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Heures marche
                  </div>
                </th>
                <th className="text-right py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1">
                    <Droplets className="h-3.5 w-3.5" />
                    Gasoil (L)
                  </div>
                </th>
                <th className="text-right py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1">
                    <Gauge className="h-3.5 w-3.5" />
                    L/heure
                  </div>
                </th>
                <th className="py-3.5 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : consommations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <Droplets className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Aucune consommation trouvée</p>
                  </td>
                </tr>
              ) : (
                consommations.map((c) => (
                  <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{c.engin?.nom}</p>
                        <p className="text-xs text-muted-foreground">{c.engin?.code} • {c.engin?.site}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-muted-foreground">
                      {formatDate(c.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                        c.poste === 'Poste 1'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20'
                      }`}>
                        {c.poste}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-muted-foreground">
                      {c.compteurDebut ? formatNumber(c.compteurDebut, 1) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-foreground">
                      {c.compteurFin ? formatNumber(c.compteurFin, 1) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {c.heuresMarche ? (
                        <span className="font-semibold text-sm text-foreground">{formatNumber(c.heuresMarche, 1)} h</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-sm text-primary-600 dark:text-primary-400">
                        {formatNumber(c.quantiteGasoil)} L
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {c.consommationHeure ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className={`text-sm font-semibold ${
                            c.consommationHeure > 90 ? 'text-red-600' :
                            c.consommationHeure > 70 ? 'text-amber-600' :
                            'text-green-600'
                          }`}>
                            {formatNumber(c.consommationHeure, 1)}
                          </span>
                          <span className="text-xs text-muted-foreground">L/h</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} sur {pagination.pages} • {pagination.total} résultats
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.pages}
                className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <ConsommationForm
          engins={engins}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); fetchConsommations(1); }}
        />
      )}
    </div>
  );
}

function ConsommationForm({ engins, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    enginId: '',
    date: new Date().toISOString().split('T')[0],
    poste: 'Poste 1',
    compteurFin: '',
    quantiteGasoil: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await consommationsApi.create({
        ...formData,
        compteurFin: formData.compteurFin ? parseFloat(formData.compteurFin) : undefined,
        quantiteGasoil: parseFloat(formData.quantiteGasoil),
      });
      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-semibold text-lg">Nouvelle consommation</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl">{error}</div>}
          <div>
            <label className="text-sm font-medium block mb-1.5">Engin *</label>
            <select
              value={formData.enginId}
              onChange={(e) => setFormData(f => ({ ...f, enginId: e.target.value }))}
              required
              className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Sélectionner un engin</option>
              {engins.map((e: any) => <option key={e.id} value={e.id}>{e.nom} ({e.code})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(f => ({ ...f, date: e.target.value }))}
                required
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Poste *</label>
              <select
                value={formData.poste}
                onChange={(e) => setFormData(f => ({ ...f, poste: e.target.value }))}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option>Poste 1</option>
                <option>Poste 2</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Nouveau compteur (h)</label>
              <input
                type="number"
                step="0.1"
                value={formData.compteurFin}
                onChange={(e) => setFormData(f => ({ ...f, compteurFin: e.target.value }))}
                placeholder="Ex: 12450.5"
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Quantité gasoil (L) *</label>
              <input
                type="number"
                step="1"
                value={formData.quantiteGasoil}
                onChange={(e) => setFormData(f => ({ ...f, quantiteGasoil: e.target.value }))}
                required
                placeholder="Ex: 850"
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground bg-accent/50 rounded-xl p-3">
            💡 Les heures de marche et la consommation/heure seront calculées automatiquement.
          </p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-accent transition-colors">
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Enregistrement...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
