'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Truck,
  Droplets,
  FileSpreadsheet,
  BarChart3,
  Settings,
  Fuel,
  ChevronRight,
  Users,
  Archive,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'Principal',
    items: [
      { label: 'Tableau de bord', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Engins', icon: Truck, href: '/engins' },
      { label: 'Consommations', icon: Droplets, href: '/consommations' },
    ],
  },
  {
    title: 'Imports',
    items: [
      { label: 'Importer Excel', icon: FileSpreadsheet, href: '/imports/upload' },
      { label: 'Historique imports', icon: Archive, href: '/imports' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Rapports', icon: BarChart3, href: '/rapports', roles: ['ADMIN', 'MANAGER'] },
      { label: 'Utilisateurs', icon: Users, href: '/utilisateurs', roles: ['ADMIN'] },
      { label: 'Paramètres', icon: Settings, href: '/parametres' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="gradient-primary rounded-xl p-2.5 shadow-lg shadow-primary-500/30">
            <Fuel className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-base leading-none">FuelTrack</h1>
            <p className="text-xs text-muted-foreground mt-0.5">OCP Group</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navItems.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                if ((item as any).roles && user && !(item as any).roles.includes(user.role)) {
                  return null;
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                        isActive
                          ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      <item.icon className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                      )} />
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight className="h-3 w-3 text-white/70" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User info */}
      {user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-accent/50">
            <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.prenom[0]}{user.nom[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.prenom} {user.nom}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
