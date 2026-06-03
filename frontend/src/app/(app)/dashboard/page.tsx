'use client';

import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '@/lib/api';
import { Truck, Droplets, Clock, Activity, FileSpreadsheet, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';

const COLORS = ['#00875A', '#0052CC', '#FF8B00', '#FF5630', '#6554C0', '#00B8D9', '#36B37E', '#FFAB00'];
const n = (v) => { const x = Number(v); return isFinite(x) && !isNaN(x) ? x : 0; };
const fmt = (v, d = 0) => n(v).toLocaleString('fr-FR', { maximumFractionDigits: d });
const PERIODES = [
  { label: '7 jours', value: 7 }, { label: '30 jours', value: 30 },
  { label: '90 jours', value: 90 }, { label: '180 jours', value: 180 },
  { label: '12 derniers mois', value: 365 },
];

function KpiCard({ label, value, unit, icon: Icon, color = 'text-primary', subtitle, trend }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-primary/10 ${color}`}><Icon className="w-5 h-5" /></div>
        {trend !== undefined && trend !== 0 && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}{unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </p>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">{label}</p>
      {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState(365);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await dashboardApi.getStats(periode); setData(res); }
    catch (e) { console.error(e); setData(null); }
    finally { setLoading(false); }
  }, [periode]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const kpis = data?.kpis || {};
  const chartParJour = (data?.chartParJour || []).map(r => ({
    date: r.date || '', conso: n(r.conso), heures: n(r.heures),
  })).filter(r => r.date && r.date !== 'Invalid Date');
  const chartParPoste = (data?.chartParPoste || []).map(r => ({
    poste: r.poste || '—', conso: n(r.conso), count: n(r.count),
  })).filter(r => r.conso > 0);
  const chartParType = (data?.chartParType || []).map(r => ({
    type: r.type || '—', conso: n(r.conso),
  })).filter(r => r.conso > 0);
  const topEngins = (data?.topEngins || []).map(r => ({
    nom: r.nom || 'N/A', type: r.type || '', conso: n(r.conso), heures: n(r.heures),
  })).filter(r => r.conso > 0);

  const totalCarburant = n(kpis.totalCarburant);
  const totalHeures = n(kpis.totalHeures);
  const totalEngins = n(kpis.totalEngins);
  const enginsActifs = n(kpis.enginsActifs);
  const moyenneConso = n(kpis.consommationMoyenneGlobale);
  const variation = n(kpis.variation);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Vue d&apos;ensemble de la consommation fuel</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={periode} onChange={e => setPeriode(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            {PERIODES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button onClick={fetchData} disabled={loading}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Engins actifs / Total" value={`${enginsActifs} / ${totalEngins}`} icon={Truck}
          subtitle={`${totalEngins > 0 ? Math.round((enginsActifs / totalEngins) * 100) : 0}% du parc actif`} />
        <KpiCard label="Carburant consommé" value={fmt(totalCarburant)} unit="L" icon={Droplets}
          subtitle="vs période précédente" trend={variation} />
        <KpiCard label="Heures de marche" value={fmt(totalHeures, 1)} unit="h" icon={Clock} color="text-orange-600"
          subtitle={`${n(kpis.consommationsPeriode)} enregistrements`} />
        <KpiCard label="Consommation moyenne" value={fmt(moyenneConso, 2)} unit="L/h" icon={Activity}
          color="text-purple-600" subtitle="Tous engins confondus" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Consommation journalière</h3>
              <p className="text-xs text-gray-500">Évolution sur {periode} jours</p>
            </div>
            <span className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-primary" />Litres
            </span>
          </div>
          {chartParJour.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartParJour}>
                <defs>
                  <linearGradient id="gradConso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00875A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00875A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${fmt(v)} L`, 'Gasoil']} />
                <Area type="monotone" dataKey="conso" stroke="#00875A" fill="url(#gradConso)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Répartition par poste</h3>
          <p className="text-xs text-gray-500 mb-4">Poste 1 vs Poste 2</p>
          {chartParPoste.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">Aucune donnée</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={chartParPoste} dataKey="conso" nameKey="poste" cx="50%" cy="50%" outerRadius={70}>
                    {chartParPoste.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${fmt(v)} L`, 'Conso']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {chartParPoste.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {p.poste}
                    </span>
                    <span className="font-semibold">{fmt(p.conso)} L</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Top 10 engins - Consommation</h3>
          <p className="text-xs text-gray-500 mb-4">Plus grands consommateurs de la période</p>
          {topEngins.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">Aucune donnée</div>
          ) : (
            <div className="space-y-2.5">
              {topEngins.slice(0, 10).map((e, i) => {
                const max = n(topEngins[0]?.conso) || 1;
                return (
                  <div key={e.nom + i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className="text-xs font-medium text-gray-900 dark:text-white truncate">{e.nom}</span>
                        <span className="text-xs font-bold text-primary shrink-0">{fmt(e.conso)} L</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${(e.conso / max) * 100}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Consommation par type d&apos;engin</h3>
          <p className="text-xs text-gray-500 mb-4">Répartition par catégorie</p>
          {chartParType.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartParType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="type" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip formatter={(v) => [`${fmt(v)} L`, 'Conso']} />
                <Bar dataKey="conso" radius={[0, 4, 4, 0]}>
                  {chartParType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}