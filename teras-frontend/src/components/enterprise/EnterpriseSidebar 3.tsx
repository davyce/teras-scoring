/**
 * Sidebar Navigation pour l'interface Entreprise
 * Navigation entre les différentes pages de l'espace entreprise
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Shield,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Bot, // ⭐ Assistant IA
} from 'lucide-react';
import terasLogoUrl from '../../assets/logo-teras.svg';

export default function EnterpriseSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  // ⭐ Badge de notifications
  const unreadNotifications = 3;

  const menuItems = [
    {
      path: '/enterprise/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      description: 'Vue d\'ensemble',
    },
    {
      path: '/enterprise/assistant', // ⭐ ASSISTANT IA - NOUVEAU
      icon: Bot,
      label: 'Assistant IA',
      description: 'Conseils intelligents',
    },
    {
      path: '/enterprise/documents',
      icon: FileText,
      label: 'Documents',
      description: 'Gestion documents',
    },
    {
      path: '/enterprise/employees',
      icon: Users,
      label: 'Employés',
      description: 'Gestion personnel',
    },
    {
      path: '/enterprise/reports',
      icon: BarChart3,
      label: 'Rapports',
      description: 'Analyses & Stats',
    },
    {
      path: '/enterprise/notifications',
      icon: Bell,
      label: 'Notifications',
      description: 'Alertes système',
      badge: unreadNotifications, // Badge avec le nombre de notifications
    },
    {
      path: '/enterprise/compliance',
      icon: Shield,
      label: 'Conformité',
      description: 'Statut conformité',
    },
    {
      path: '/enterprise/profile',
      icon: User,
      label: 'Profil',
      description: 'Infos entreprise',
    },
    {
      path: '/enterprise/settings',
      icon: Settings,
      label: 'Paramètres',
      description: 'Configuration',
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    // Nettoyer tous les tokens
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('teras_access_token');
    localStorage.removeItem('teras_token');
    localStorage.removeItem('teras_refresh_token');
    localStorage.removeItem('teras-auth');
    localStorage.removeItem('teras_auth_context');
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-50">
      {/* Header / Logo TERAS */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {/* Logo TERAS avec effet glow */}
          <div className="relative group">
            <img
              src={terasLogoUrl}
              alt="TERAS"
              className="w-12 h-12 transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-cyan-500/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>

          <div>
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
              TERAS
            </p>
            <h2 className="text-sm font-bold text-slate-50">Entreprise</h2>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    group relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${
                      active
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/50 scale-[1.02]'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:scale-[1.01]'
                    }
                  `}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'animate-pulse' : ''}`} />

                    {/* ⭐ Badge notifications (seulement pour Notifications) */}
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-200'}`}>
                      {item.label}
                    </p>
                    <p className={`text-xs ${active ? 'text-cyan-100' : 'text-slate-500'}`}>
                      {item.description}
                    </p>
                  </div>

                  {active && (
                    <ChevronRight className="w-4 h-4 text-white animate-pulse" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / User Info / Logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="mb-3 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <p className="text-xs text-slate-500">Connecté en tant que</p>
          <p className="text-sm font-medium text-slate-200">Directeur Entreprise</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-red-900/20 hover:text-red-400 rounded-lg transition-all duration-200 group border border-transparent hover:border-red-800/30"
        >
          <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
          <span className="text-sm font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}