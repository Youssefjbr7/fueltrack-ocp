'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { enginsApi } from '@/lib/api';
import { formatNumber, formatDate } from '@/lib/utils';
import {
  Truck,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Activity,
  Droplets,
  Clock,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';

const typeColors: Record<string, string> = {
  Tombereau: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  Chargeur: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  Bulldozer: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
  Pelle: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  Niveleuse: 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300',
};

export default function EnginsPage() {
  const [engins, setEngins] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 15 });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEngin, setEditingEngin] = useState<any>(null);

  const fetchEngins = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '15',
      };
      if (search) params.search = search;
      if (filterType) params.type = filterType;

      const result = await enginsApi.getAll(params);
      setEngins(result.data);
      setPagination(result.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [search, filterType]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEngins(1), 300);
    return () => clearTimeout(timer);
  }, [fetchEngins]);

  const handleDelete = async (id: string, nom: string) => {
    if (!confirm(`Désactiver l'engin "${nom}" ?`)) return;
    try {
      await enginsApi.delete(id);
      fetchEngins(pagination.page);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Gestion des engins</h1>
          <p className="page-subtitle">{pagination.total} engins enregistrés</p>
        </div>
        <button
          onClick={() => { setEditingEngin(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-primary-500/25"
        >
          <Plus className="h-4 w-4" />
          Nouvel engin
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par nom ou code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 border border-border rounded-xl bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Tous les types</option>
          {['Tombereau', 'Chargeur', 'Bulldozer', 'Pelle', 'Niveleuse'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Engin</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Site</th>
                <th className="text-right py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compteur</th>
                <th className="text-right py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Consommations</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                <th className="py-3.5 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : engins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Truck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Aucun engin trouvé</p>
                  </td>
                </tr>
              ) : (
                engins.map((engin) => (
                  <tr key={engin.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Truck className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{engin.nom}</p>
                          <p className="text-xs text-muted-foreground">{engin.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${typeColors[engin.type] || 'bg-muted text-muted-foreground'}`}>
                        {engin.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {engin.site ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {engin.site}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono text-sm text-foreground">
                        {engin.dernierCompteur ? formatNumber(engin.dernierCompteur, 1) + ' h' : '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="text-sm font-semibold text-foreground">{engin._count?.consommations || 0}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        engin.actif
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/20'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${engin.actif ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {engin.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/engins/${engin.id}`}
                          className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => { setEditingEngin(engin); setShowForm(true); }}
                          className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(engin.id, engin.nom)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
              Page {pagination.page} sur {pagination.pages} • {pagination.total} résultats
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchEngins(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => fetchEngins(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <EnginForm
          engin={editingEngin}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); fetchEngins(1); }}
        />
      )}
    </div>
  );
}

function EnginForm({ engin, onClose, onSave }: { engin: any; onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    code: engin?.code || '',
    nom: engin?.nom || '',
    type: engin?.type || 'Tombereau',
    categorie: engin?.categorie || '',
    site: engin?.site || '',
    description: engin?.description || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (engin) {
        await enginsApi.update(engin.id, formData);
      } else {
        await enginsApi.create(formData);
      }
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
          <h3 className="font-semibold text-foreground text-lg">
            {engin ? 'Modifier l\'engin' : 'Nouvel engin'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl border border-destructive/20">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                placeholder="CAT-001"
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {['Tombereau', 'Chargeur', 'Bulldozer', 'Pelle', 'Niveleuse', 'Autre'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Nom *</label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
              placeholder="CAT 785C"
              className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Catégorie</label>
              <input
                type="text"
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                placeholder="Transport"
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Site</label>
              <input
                type="text"
                value={formData.site}
                onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                placeholder="Khouribga"
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-accent transition-colors">
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Enregistrement...' : engin ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
