'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { enginsApi, consommationsApi } from '@/lib/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const n = (v: unknown): number => (typeof v === 'number' && !isNaN(v) ? v : Number(v) || 0);
const fmt = (v: unknown, decimals = 0): string =>
  n(v).toLocaleString('fr-FR', { maximumFractionDigits: decimals, minimumFractionDigits: 0 });

export default function EnginDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [engin, setEngin] = useState<any>(null);
  const [consommations, setConsommations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [periode, setPeriode] = useState(365); // Par défaut 1 an pour voir vos données juin 2025

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const enginId = String(id);
      const [enginData, consoData, statsData] = await Promise.all([
        enginsApi.getById(enginId).catch(() => null),
        consommationsApi.getAll({ enginId, page, limit: 15 }).catch(() => ({ data: [], consommations: [], pagination: { total: 0 } })),
        enginsApi.getStats(enginId, periode).catch(() => null),
      ]);

      // Le backend renvoie directement l'engin (pas dans .engin)
      setEngin(enginData);

      // Le backend renvoie .data, le frontend attendait .consommations
      const consoList = consoData?.data || consoData?.consommations || [];
      setConsommations(consoList);
      setTotal(consoData?.pagination?.total || 0);

      setStats(statsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id, page, periode]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Préparer les données du graphique
  const chartData = (stats?.historique || []).map((c: any) => ({
    date: new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    conso: n(c.quantiteGasoil),
    heures: n(c.heuresMarche),
  }));

  const STATUT_COLORS: Record<string, string> = {
    ACTIF: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    MAINTENANCE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    INACTIF: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!engin) return (
    <div className="text-center py-32">
      <p className="text-gray-500 text-lg">Engin introuvable</p>
      <p className="text-xs text-gray-400 mt-2">ID demandé : {String(id)}</p>
      <button onClick={() => router.push('/engins')}
        className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
        Retour à la liste
      </button>
    </div>
  );

  const totalPages = Math.ceil(total / 15);
  const statut = engin.actif === false ? 'INACTIF' : 'ACTIF';

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push('/engins')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mt-0.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{engin.nom}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUT_COLORS[statut]}`}>
              {statut}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {engin.code} · {engin.type} {engin.site && `· ${engin.site}`} {engin.categorie && `· ${engin.categorie}`}
          </p>
          {engin.description && (
            <p className="text-xs text-gray-400 mt-0.5">{engin.description}</p>
          )}
        </div>
        <div>
          <select value={periode} onChange={e => setPeriode(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
            <option value={180}>180 jours</option>
            <option value={365}>1 an</option>
            <option value={730}>2 ans</option>
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total gasoil', value: `${fmt(stats?.totalCarburant)} L`, icon: '⛽' },
          { label: 'Heures de marche', value: `${fmt(stats?.totalHeures, 1)} h`, icon: '⏱️' },
          { label: 'Conso moyenne/h', value: `${fmt(stats?.consommationMoyenne, 2)} L/h`, icon: '📊' },
          { label: 'Entrées totales', value: fmt(total), icon: '📋' },
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-2xl mb-2">{k.icon}</div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{k.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Évolution consommation</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00875A" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00875A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`${fmt(v)} L`, 'Gasoil']} />
              <Area type="monotone" dataKey="conso" stroke="#00875A" fill="url(#gc)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table consommations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Historique des consommations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                {['Date', 'Poste', 'Compteur début', 'Compteur fin', 'Heures', 'Gasoil (L)', 'L/h'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {consommations.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {new Date(c.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.poste?.includes('1')
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {c.poste || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.compteurDebut != null ? fmt(c.compteurDebut) : '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.compteurFin != null ? fmt(c.compteurFin) : '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.heuresMarche != null ? `${fmt(c.heuresMarche, 1)} h` : '—'}</td>
                  <td className="px-4 py-3 font-medium text-primary">{fmt(c.quantiteGasoil)} L</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.consommationHeure != null ? fmt(c.consommationHeure, 2) : '—'}</td>
                </tr>
              ))}
              {consommations.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">Aucune consommation enregistrée</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} sur {totalPages} · {total} entrées
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">
                ← Précédent
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">
                Suivant →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}