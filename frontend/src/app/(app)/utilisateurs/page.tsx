'use client';

import { useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface Utilisateur {
  id: string;
  nom: string;
  prenom?: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'OPERATEUR';
  actif?: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  OPERATEUR: 'Opérateur',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  MANAGER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  OPERATEUR: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function UtilisateursPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<Utilisateur | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', password: '', role: 'OPERATEUR' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setDebugInfo('');
    try {
      const data = await authApi.getUsers();
      console.log('Réponse API utilisateurs:', data);

      // Normalisation défensive : la réponse peut être un tableau direct ou wrapped
      let usersList: Utilisateur[] = [];
      if (Array.isArray(data)) {
        usersList = data;
      } else if (Array.isArray(data?.utilisateurs)) {
        usersList = data.utilisateurs;
      } else if (Array.isArray(data?.data)) {
        usersList = data.data;
      } else if (Array.isArray(data?.users)) {
        usersList = data.users;
      } else {
        setDebugInfo(`Format de réponse inattendu : ${JSON.stringify(data).slice(0, 200)}`);
      }

      setUsers(usersList);
    } catch (e) {
      setDebugInfo(`Erreur API : ${(e as Error).message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ nom: '', prenom: '', email: '', password: '', role: 'OPERATEUR' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (u: Utilisateur) => {
    setEditUser(u);
    setForm({ nom: u.nom, prenom: u.prenom || '', email: u.email, password: '', role: u.role });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.nom || !form.email) { setError('Nom et email requis'); return; }
    if (!editUser && !form.password) { setError('Mot de passe requis'); return; }
    setSaving(true); setError('');
    try {
      if (editUser) {
        await authApi.updateUser(editUser.id as any, {
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          role: form.role,
          ...(form.password ? { password: form.password } : {})
        });
      } else {
        await authApi.register({
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          password: form.password,
          role: form.role
        });
      }
      setShowModal(false);
      fetchUsers();
    } catch (e) {
      setError((e as Error).message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Désactiver cet utilisateur ?')) return;
    try { await authApi.deleteUser(id as any); fetchUsers(); } catch { /* ignore */ }
  };

  const filtered = users.filter(u =>
    u.nom?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Utilisateurs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {users.length} utilisateur{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}
          </p>
        </div>
        {currentUser?.role === 'ADMIN' && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvel utilisateur
          </button>
        )}
      </div>

      {/* Debug info if any */}
      {debugInfo && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
          <p className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">Information de débogage</p>
          <p className="text-yellow-700 dark:text-yellow-400 font-mono text-xs">{debugInfo}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                {['Utilisateur', 'Email', 'Rôle', 'Statut', 'Membre depuis', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {u.nom?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {u.prenom ? `${u.prenom} ${u.nom}` : u.nom}
                      </span>
                      {u.id === currentUser?.id && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Vous</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      u.actif !== false
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.actif !== false ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {currentUser?.role === 'ADMIN' && u.id !== currentUser.id && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(u)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(u.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                  {users.length === 0 ? 'Aucun utilisateur dans la base. Vérifiez le seed.' : 'Aucun utilisateur ne correspond à votre recherche.'}
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editUser ? 'Modifier utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">{error}</div>}
              {[
                { label: 'Prénom', key: 'prenom', type: 'text', placeholder: 'Ahmed' },
                { label: 'Nom', key: 'nom', type: 'text', placeholder: 'Alami' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'ahmed@ocp.ma' },
                { label: editUser ? 'Nouveau mot de passe (vide = inchangé)' : 'Mot de passe', key: 'password', type: 'password', placeholder: '••••••••' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                  <input type={f.type} value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rôle</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="OPERATEUR">Opérateur</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium">
                {saving ? 'Enregistrement...' : (editUser ? 'Modifier' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}