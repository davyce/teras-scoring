// teras-frontend/src/layouts/EnterpriseLayout.tsx
import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Brain, Users, DollarSign, FileText,
  UserCheck, BarChart3, ShieldCheck, Bell, MessageCircle,
  User, Settings, LogOut, ChevronLeft, Menu, X,
  Wallet, TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authFetch } from "../services/authFetch";
import terasLogoUrl from "../assets/logo-teras.svg";

// ── NavItem ────────────────────────────────────────────────────────────────────
interface NavItemProps {
  to: string; icon: React.ReactNode; label: string; sub?: string;
  isActive: boolean; isCollapsed: boolean; badge?: number; onClick?: () => void;
}
const NavItem = ({ to, icon, label, sub, isActive, isCollapsed, badge, onClick }: NavItemProps) => (
  <Link to={to} onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
      isActive ? "bg-sky-500/20 text-sky-400 border-l-2 border-sky-500" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
    } ${isCollapsed ? "justify-center" : ""}`}
    title={isCollapsed ? label : undefined}>
    <span className="flex-shrink-0 relative">
      {icon}
      {!!badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center">
          {badge <= 9
            ? <span className="bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">{badge}</span>
            : <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          }
        </span>
      )}
    </span>
    {!isCollapsed && (
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-none">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5 truncate">{sub}</p>}
      </div>
    )}
  </Link>
);

// ── EnterpriseLayout ───────────────────────────────────────────────────────────
export default function EnterpriseLayout() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const { user, logout } = useAuth();

  const [isCollapsed, setIsCollapsed]   = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadBank, setUnreadBank]     = useState(0);
  const [unreadNotif, setUnreadNotif]   = useState(0);

  // Poll messages banque toutes les 30s
  useEffect(() => {
    const fetchUnread = () => {
      authFetch('/api/scoring/enterprise/bank-messages/')
        .then(r => r.json())
        .then(d => setUnreadBank(d.unread_count || 0))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => { logout(); navigate("/", { replace: true }); };
  const isActive = (path: string) => location.pathname.startsWith(`/enterprise/${path}`);
  const close    = () => setIsMobileOpen(false);

  const navItems = [
    { to: '/enterprise/dashboard',     icon: <LayoutDashboard className="w-5 h-5"/>, label: 'Dashboard',       sub: 'Vue d\'ensemble'      },
    { to: '/enterprise/assistant',     icon: <Brain className="w-5 h-5"/>,            label: 'Assistant IA',    sub: 'Conseils intelligents' },
    { to: '/enterprise/clients',       icon: <Users className="w-5 h-5"/>,            label: 'Clients',         sub: 'Portefeuille clients'  },
    { to: '/enterprise/transactions',  icon: <DollarSign className="w-5 h-5"/>,       label: 'Transactions',    sub: 'Historique financier'  },
    { to: '/enterprise/documents',     icon: <FileText className="w-5 h-5"/>,         label: 'Documents',       sub: 'Gestion documents'     },
    { to: '/enterprise/employees',     icon: <UserCheck className="w-5 h-5"/>,        label: 'Employés',        sub: 'Gestion personnel'     },
    { to: '/enterprise/reports',       icon: <BarChart3 className="w-5 h-5"/>,        label: 'Rapports',        sub: 'Analyses & Stats'      },
    { to: '/enterprise/compliance',    icon: <ShieldCheck className="w-5 h-5"/>,      label: 'Conformité',      sub: 'Statut conformité'     },
    // ── Finance & Banque ─────────────────────────────────────────────────────
    { to: '/enterprise/finance',       icon: <Wallet className="w-5 h-5"/>,           label: 'Finance & Banque',sub: 'Crédits & messages',   badge: unreadBank },
    // ─────────────────────────────────────────────────────────────────────────
    { to: '/enterprise/notifications', icon: <Bell className="w-5 h-5"/>,             label: 'Notifications',   sub: 'Alertes système',      badge: unreadNotif },
    { to: '/enterprise/support',       icon: <MessageCircle className="w-5 h-5"/>,    label: 'Support',         sub: 'Assistance technique'  },
    { to: '/enterprise/profile',       icon: <User className="w-5 h-5"/>,             label: 'Profil',          sub: 'Infos entreprise'      },
    { to: '/enterprise/settings',      icon: <Settings className="w-5 h-5"/>,         label: 'Paramètres',      sub: 'Configuration'         },
  ];

  return (
    <div className="min-h-screen bg-[#0b1220] flex">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={close}/>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-slate-900/95 border-r border-white/10 transition-all duration-300 ${
        isCollapsed ? "w-[72px]" : "w-56"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>

        {/* Header */}
        <div className="flex items-center justify-between h-14 px-3 border-b border-white/10 shrink-0">
          <Link to="/enterprise/dashboard" className="flex items-center gap-2 min-w-0">
            <img src={terasLogoUrl} alt="TERAS" className="h-7 w-auto shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.4)]"/>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-white font-bold text-sm leading-none">TERAS</p>
                <p className="text-sky-400 text-xs">Entreprise</p>
              </div>
            )}
          </Link>
          <div className="flex items-center gap-1">
            {isMobileOpen && (
              <button onClick={close} className="lg:hidden p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4"/>
              </button>
            )}
            <button onClick={() => setIsCollapsed(p => !p)} className="hidden lg:flex p-1 text-slate-400 hover:text-white">
              <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`}/>
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavItem key={item.to} {...item}
              isActive={isActive(item.to.replace('/enterprise/', ''))}
              isCollapsed={isCollapsed}
              onClick={close}/>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-white/10 shrink-0">
          {!isCollapsed && (
            <div className="px-3 py-2 mb-2 bg-slate-800/50 rounded-xl">
              <p className="text-slate-500 text-xs">Connecté en tant que</p>
              <p className="text-white text-xs font-semibold truncate">{user?.email || 'Entreprise'}</p>
              <p className="text-sky-400 text-xs">Entreprise</p>
            </div>
          )}
          <button onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
            <LogOut className="w-4 h-4 shrink-0"/>
            {!isCollapsed && <span className="text-sm">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="h-14 bg-slate-900/50 border-b border-white/10 flex items-center justify-between px-4 lg:hidden shrink-0">
          <button onClick={() => setIsMobileOpen(true)} className="p-2 text-slate-400 hover:text-white">
            <Menu className="w-5 h-5"/>
          </button>
          <div className="flex items-center gap-2">
            <img src={terasLogoUrl} alt="TERAS" className="h-6 w-auto"/>
            <span className="text-white font-bold text-sm">TERAS</span>
          </div>
          <Link to="/enterprise/finance" className="relative p-2 text-slate-400 hover:text-sky-400 transition-colors">
            <Wallet className="w-5 h-5"/>
            {unreadBank > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {unreadBank}
              </span>
            )}
          </Link>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet/>
        </main>
      </div>
    </div>
  );
}
