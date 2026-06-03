'use client';

import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const COLORS = ['#00875A', '#0052CC', '#FF8B00', '#FF5630', '#6554C0', '#00B8D9', '#36B37E', '#FFAB00'];

const PERIODES = [
  { label: '7 jours', value: 7 },
  { label: '30 jours', value: 30 },
  { label: '90 jours', value: 90 },
  { label: '180 jours', value: 180 },
  { label: '365 jours', value: 365 },
];

// Helpers ultra-defensifs
const n = (v: unknown): number => (typeof v === 'number' && !isNaN(v) ? v : Number(v) || 0);
const fmt = (v: unknown, decimals = 0): string => n(v).toLocaleString('fr-FR', { maximumFractionDigits: decimals, minimumFractionDigits: 0 });

export default function RapportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState(30);
  const [activeTab, setActiveTab] = useState<'evolution' | 'postes' | 'types' | 'top'>('evolution');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.getStats(periode);
      setStats(data);
    } catch (e) {
      console.error(e);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [periode]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const tabs = [
    { key: 'evolution', label: 'Évolution' },
    { key: 'postes', label: 'Par poste' },
    { key: 'types', label: 'Par type' },
    { key: 'top', label: 'Top engins' },
  ] as const;

  // Extraction sûre des données
  const kpis = stats?.kpis || {};
  const charts = stats?.charts || {};

  // Normaliser les données : le backend peut renvoyer différentes structures
  const parJourRaw = charts.consommationParJour || stats?.chartParJour || [];
  const parPosteRaw = charts.consommationParPoste || stats?.chartParPoste || [];
  const parTypeRaw = charts.consommationParType || stats?.chartParType || [];
  const topEnginsRaw = charts.topEngins || stats?.topEngins || [];

  // Normalisation des données par jour
  const dataParJour = parJourRaw.map((r: any) => ({
    date: r.date || r.jour || '',
    conso: n(r.conso ?? r.total ?? r.quantiteGasoil),
    heures: n(r.heures ?? r.totalHeures ?? r.heuresMarche),
  }));

  // Normalisation par poste
  const dataParPoste = parPosteRaw.map((r: any) => ({
    poste: r.poste || '—',
    conso: n(r.conso ?? r._sum?.quantiteGasoil ?? r.total),
    count: n(r.count ?? r._count),
  }));

  // Normalisation par type
  const dataParType = parTypeRaw.map((r: any) => ({
    type: r.type || '—',
    conso: n(r.conso ?? r.total),
  }));

  // Normalisation top engins
  const dataTopEngins = topEnginsRaw.map((r: any) => ({
    nom: r.nom ?? r.engin?.nom ?? '—',
    type: r.type ?? r.engin?.type ?? '',
    conso: n(r.conso ?? r.totalCarburant),
    heures: n(r.heures ?? r.totalHeures),
  }));

  // KPIs normalisés (le backend renvoie totalCarburant pas totalConsommation)
  const totalConso = n(kpis.totalCarburant ?? kpis.totalConsommation);
  const totalHeures = n(kpis.totalHeures);
  const totalEngins = n(kpis.enginsActifs ?? kpis.totalEngins);
  const moyenneConso = n(kpis.consommationMoyenneGlobale ?? kpis.moyenneConso);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rapports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Analyse détaillée des consommations</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
          {PERIODES.map(p => (
            <button key={p.value} onClick={() => setPeriode(p.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                periode === p.value
                  ? 'bg-primary text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Consommation totale', value: `${fmt(totalConso)} L`, sub: 'gasoil', color: 'text-primary' },
          { label: 'Heures de marche', value: `${fmt(totalHeures, 1)} h`, sub: 'cumulées', color: 'text-blue-600' },
          { label: 'Engins actifs', value: fmt(totalEngins), sub: 'sur la période', color: 'text-orange-600' },
          { label: 'Consommation/h', value: `${fmt(moyenneConso, 2)} L/h`, sub: 'moyenne', color: 'text-purple-600' },
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">{k.label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !stats ? (
            <p className="text-center text-gray-400 py-16">Aucune donnée disponible</p>
          ) : (
            <>
              {activeTab === 'evolution' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Consommation journalière (L)</h3>
                    {dataParJour.length === 0 ? (
                      <p className="text-center text-gray-400 py-8">Aucune donnée sur cette période</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={dataParJour}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: number) => [`${fmt(v)} L`, 'Gasoil']} />
                          <Line type="monotone" dataKey="conso" stroke="#00875A" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  {dataParJour.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Heures de marche journalières</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={dataParJour}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: number) => [`${fmt(v, 1)} h`, 'Heures']} />
                          <Bar dataKey="heures" fill="#0052CC" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'postes' && (
                dataParPoste.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Aucune donnée sur cette période</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={dataParPoste} dataKey="conso" nameKey="poste" cx="50%" cy="50%" outerRadius={100}
                          label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                          {dataParPoste.map((_: any, i: number) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${fmt(v)} L`, 'Conso']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {dataParPoste.map((p: any, i: number) => (
                        <div key={p.poste + i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{p.poste}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{fmt(p.conso)} L</p>
                            <p className="text-xs text-gray-500">{fmt(p.count)} entrées</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              {activeTab === 'types' && (
                dataParType.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Aucune donnée sur cette période</p>
                ) : (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Consommation par type d&apos;engin (L)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dataParType} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="type" type="category" tick={{ fontSize: 11 }} width={140} />
                        <Tooltip formatter={(v: number) => [`${fmt(v)} L`, 'Consommation']} />
                        <Bar dataKey="conso" radius={[0, 4, 4, 0]}>
                          {dataParType.map((_: any, i: number) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              )}

              {activeTab === 'top' && (
                dataTopEngins.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Aucune donnée sur cette période</p>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Top {dataTopEngins.length} engins consommateurs
                    </h3>
                    {dataTopEngins.map((e: any, i: number) => {
                      const max = n(dataTopEngins[0]?.conso) || 1;
                      return (
                        <div key={e.nom + i} className="flex items-center gap-4">
                          <span className="text-sm font-bold text-gray-400 w-6 text-right">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{e.nom}</span>
                                {e.type && <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{e.type}</span>}
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-bold text-primary">{fmt(e.conso)} L</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{fmt(e.heures, 1)} h</span>
                              </div>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${(e.conso / max) * 100}%`, background: COLORS[i % COLORS.length] }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}