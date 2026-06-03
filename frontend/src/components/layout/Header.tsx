'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Moon, Sun, LogOut, Bell, AlertTriangle, Activity, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/auth.store';
import { dashboardApi } from '@/lib/api';

const breadcrumbs: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/engins': 'Gestion des engins',
  '/consommations': 'Consommations',
  '/imports': 'Historique imports',
  '/imports/upload': 'Importer Excel',
  '/rapports': 'Rapports',
  '/utilisateurs': 'Utilisateurs',
  '/parametres': 'Paramètres',
};

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'critical';
  title: string;
  message: string;
  date: Date;
  link?: string;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const title = breadcrumbs[pathname] || 'FuelTrack';
  const unreadCount = notifs.length;

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  // Fermer le panel au clic extérieur
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    if (showPanel) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showPanel]);

  // Charger les alertes depuis le backend
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.getAlerts();
      const list: Notification[] = [];

      // Engins inactifs (pas de consommation depuis 7 jours)
      const inactifs = data?.enginsInactifs || [];
      if (inactifs.length > 0) {
        list.push({
          id: 'engins-inactifs',
          type: 'warning',
          title: `${inactifs.length} engin${inactifs.length > 1 ? 's' : ''} inactif${inactifs.length > 1 ? 's' : ''}`,
          message: `Aucune consommation enregistrée depuis 7 jours pour ${inactifs.slice(0, 3).map((e: any) => e.nom).join(', ')}${inactifs.length > 3 ? '...' : ''}`,
          date: new Date(),
          link: '/engins',
        });
      }

      // Consommation moyenne anormalement élevée
      const moyenne = data?.moyenneConsommation || 0;
      if (moyenne > 50) {
        list.push({
          id: 'conso-elevee',
          type: 'critical',
          title: 'Consommation moyenne élevée',
          message: `${moyenne.toFixed(1)} L/h en moyenne sur le parc — vérifier les engins consommateurs`,
          date: new Date(),
          link: '/rapports',
        });
      }

      // Si aucune alerte, message info
      if (list.length === 0) {
        list.push({
          id: 'no-alerts',
          type: 'info',
          title: 'Aucune alerte',
          message: 'Tout fonctionne normalement. Le parc est sous contrôle.',
          date: new Date(),
        });
      }

      setNotifs(list);
    } catch {
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  };

  // Polling toutes les 5 minutes
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const openPanel = () => {
    setShowPanel(s => !s);
    if (!showPanel) fetchAlerts();
  };

  const handleNotifClick = (notif: Notification) => {
    if (notif.link) {
      router.push(notif.link);
      setShowPanel(false);
    }
  };

  const dismiss = (id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  const realUnread = notifs.filter(n => n.id !== 'no-alerts').length;

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-6 gap-4">
      <div className="flex-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={panelRef}>
          <button onClick={openPanel}
            className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="h-5 w-5" />
            {realUnread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {realUnread > 9 ? '9+' : realUnread}
              </span>
            )}
          </button>

          {showPanel && (
            <div className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  <p className="text-xs text-gray-500">
                    {realUnread > 0 ? `${realUnread} alerte${realUnread > 1 ? 's' : ''} active${realUnread > 1 ? 's' : ''}` : 'Aucune alerte'}
                  </p>
                </div>
                <button onClick={() => fetchAlerts()} disabled={loading}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 transition-colors"
                  title="Actualiser">
                  <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading && notifs.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifs.length === 0 ? (
                  <p className="text-center py-8 text-sm text-gray-400">Aucune notification</p>
                ) : (
                  notifs.map(notif => {
                    const Icon = notif.type === 'critical' ? AlertTriangle
                      : notif.type === 'warning' ? AlertTriangle
                      : Activity;
                    const colors = notif.type === 'critical'
                      ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                      : notif.type === 'warning'
                      ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'
                      : 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';

                    return (
                      <div key={notif.id}
                        className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${notif.link ? 'cursor-pointer' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${colors}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0" onClick={() => handleNotifClick(notif)}>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {notif.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {notif.id !== 'no-alerts' && (
                            <button onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-400 transition-colors shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {notifs.length > 0 && realUnread > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
                  <button onClick={() => setNotifs([])}
                    className="text-xs text-primary hover:underline w-full text-center font-medium">
                    Tout marquer comme lu
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Logout */}
        <button onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors text-sm">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}