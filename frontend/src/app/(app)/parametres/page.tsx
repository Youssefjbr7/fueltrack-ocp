'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import { useTheme } from 'next-themes';

export default function ParametresPage() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profil' | 'securite' | 'apparence' | 'apropos'>('profil');

  // Form change password
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async () => {
    setPwdMessage(null);
    if (!pwdForm.current || !pwdForm.new) {
      setPwdMessage({ type: 'error', text: 'Tous les champs sont requis' });
      return;
    }
    if (pwdForm.new !== pwdForm.confirm) {
      setPwdMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }
    if (pwdForm.new.length < 6) {
      setPwdMessage({ type: 'error', text: 'Le nouveau mot de passe doit faire au moins 6 caractères' });
      return;
    }
    setPwdLoading(true);
    try {
      await authApi.changePassword(pwdForm.current, pwdForm.new);
      setPwdMessage({ type: 'success', text: 'Mot de passe modifié avec succès' });
      setPwdForm({ current: '', new: '', confirm: '' });
    } catch (e) {
      setPwdMessage({ type: 'error', text: (e as Error).message || 'Erreur' });
    } finally {
      setPwdLoading(false);
    }
  };

  const tabs = [
    { key: 'profil', label: 'Profil', icon: '👤' },
    { key: 'securite', label: 'Sécurité', icon: '🔒' },
    { key: 'apparence', label: 'Apparence', icon: '🎨' },
    { key: 'apropos', label: 'À propos', icon: 'ℹ️' },
  ] as const;

  const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Administrateur',
    MANAGER: 'Manager',
    OPERATEUR: 'Opérateur',
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez votre compte et vos préférences</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}>
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Profil */}
          {activeTab === 'profil' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                  {user?.nom?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{user?.nom || 'Utilisateur'}</h2>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <span className="inline-block mt-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                    {ROLE_LABELS[user?.role || 'OPERATEUR']}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Nom complet</label>
                  <p className="text-sm text-gray-900 dark:text-white">{user?.nom || '—'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email</label>
                  <p className="text-sm text-gray-900 dark:text-white">{user?.email || '—'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Rôle</label>
                  <p className="text-sm text-gray-900 dark:text-white">{ROLE_LABELS[user?.role || 'OPERATEUR']}</p>
                </div>
              </div>
            </div>
          )}

          {/* Sécurité */}
          {activeTab === 'securite' && (
            <div className="space-y-4 max-w-md">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Changer le mot de passe</h2>
              <p className="text-sm text-gray-500">Choisissez un mot de passe robuste d&apos;au moins 6 caractères.</p>

              {pwdMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  pwdMessage.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                }`}>
                  {pwdMessage.text}
                </div>
              )}

              {[
                { label: 'Mot de passe actuel', key: 'current' },
                { label: 'Nouveau mot de passe', key: 'new' },
                { label: 'Confirmer le nouveau mot de passe', key: 'confirm' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                  <input type="password" value={pwdForm[f.key as keyof typeof pwdForm]}
                    onChange={e => setPwdForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              ))}

              <button onClick={handleChangePassword} disabled={pwdLoading}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {pwdLoading ? 'Modification...' : 'Modifier le mot de passe'}
              </button>
            </div>
          )}

          {/* Apparence */}
          {activeTab === 'apparence' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Thème</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
                {[
                  { value: 'light', label: 'Clair', icon: '☀️', desc: 'Interface lumineuse' },
                  { value: 'dark', label: 'Sombre', icon: '🌙', desc: 'Interface sombre' },
                  { value: 'system', label: 'Système', icon: '💻', desc: 'Selon votre OS' },
                ].map(t => (
                  <button key={t.value} onClick={() => setTheme(t.value)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      theme === t.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}>
                    <div className="text-2xl mb-2">{t.icon}</div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{t.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* À propos */}
          {activeTab === 'apropos' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white text-2xl">⛽</div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">FuelTrack OCP</h2>
                  <p className="text-sm text-gray-500">Version 1.0.0</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Système de gestion et suivi de la consommation de carburant pour les engins industriels.
                Imports Excel automatiques, calcul des heures de marche, alertes de surconsommation et tableaux de bord en temps réel.
              </p>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 grid grid-cols-2 gap-4">
                {[
                  { label: 'Version', value: '1.0.0' },
                  { label: 'Environnement', value: 'Production' },
                  { label: 'Frontend', value: 'Next.js 15' },
                  { label: 'Backend', value: 'Express + Prisma' },
                ].map(i => (
                  <div key={i.label}>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{i.label}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{i.value}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-xs text-gray-400">© 2026 OCP Group · Tous droits réservés</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}