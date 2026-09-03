// src/components/government/GovernmentSidebar.tsx - AVEC VRAI LOGO TERAS + LIEN CHATBOT
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Briefcase,
  AlertCircle,
  FileText,
  FolderOpen,
  Settings,
  LogOut,
  ChevronRight,
  Bot, // ⭐ NOUVEAU
} from 'lucide-react';
import logoTeras from '../../assets/logo-teras.svg';

export default function GovernmentSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      path: '/government/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard National',
      description: 'Vue d\'ensemble',
    },
    {
      path: '/government/regions',
      icon: MapPin,
      label: 'Régions',
      description: 'Données régionales',
    },
    {
      path: '/government/sectors',
      icon: Briefcase,
      label: 'Secteurs',
      description: 'Économie sectorielle',
    },
    {
      path: '/government/alerts',
      icon: AlertCircle,
      label: 'Alertes',
      description: 'Système d\'alertes',
    },
    {
      path: '/government/documents',
      icon: FolderOpen,
      label: 'Documents',
      description: 'Pièces et analyses',
    },
    {
      path: '/government/reports',
      icon: FileText,
      label: 'Rapports',
      description: 'Génération rapports',
    },
    // ⭐ NOUVEAU : Lien vers la démo du chatbot
    {
      path: '/government/assistant',
      icon: Bot,
      label: 'Assistant IA',
      description: 'Chatbot intelligent',
    },
    {
      path: '/government/settings',
      icon: Settings,
      label: 'Paramètres',
      description: 'Configuration',
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // ⭐ AJOUT : Nettoyer aussi les tokens TERAS
    localStorage.removeItem('teras_access_token');
    localStorage.removeItem('teras_token');
    localStorage.removeItem('teras_refresh_token');
    localStorage.removeItem('teras-auth');
    localStorage.removeItem('teras_auth_context');

    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-50">
      {/* Header / Logo TERAS RÉEL */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {/* Logo TERAS SVG avec effet glow */}
          <div className="relative group">
            <img
              src={logoTeras}
              alt="TERAS"
              className="w-12 h-12 transition-transform duration-300 group-hover:scale-110"
            />
            {/* Effet glow au hover */}
            <div className="absolute inset-0 bg-sky-500/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>

          <div>
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
              TERAS
            </p>
            <h2 className="text-sm font-bold text-slate-50">Gouvernement</h2>
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
                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/50 scale-[1.02]'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:scale-[1.01]'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'animate-pulse' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-200'}`}>
                      {item.label}
                    </p>
                    <p className={`text-xs ${active ? 'text-sky-100' : 'text-slate-500'}`}>
                      {item.description}
                    </p>
                  </div>
                  {active && (
                    <ChevronRight className="w-4 h-4 text-white animate-pulse" />
                  )}

                  {/* ⭐ Badge "NOUVEAU" pour le chatbot */}
                  {item.path === '/government/assistant' && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      NEW
                    </span>
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
          <p className="text-sm font-medium text-slate-200">Gouvernement</p>
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
