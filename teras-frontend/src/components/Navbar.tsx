/**
 * Composant de navigation sidebar TERAS
 * ✅ KYC User intégré avec badge statut
 * ✅ Notifications banque fonctionnelles avec panel dropdown
 */

import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Calculator, History, FileText, User,
  LogOut, Menu, X, ChevronLeft, Settings, Bell,
  MessageCircle, MessageSquare, ShieldCheck,
  Package, Clock, AlertCircle, Info, MailOpen, ArrowRight, RefreshCw,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { authGet, authFetch } from "../utils/authFetch";
import terasLogoUrl from "../assets/logo-teras.svg";
import UserAIAssistant from "./user/UserAIAssistant";

type KycStatus = "pending" | "approved" | "rejected" | null;

// ── Config types de message ────────────────────────────────────────────────
const MSG_CFG: Record<string, { color: string; bg: string; Icon: React.ElementType }> = {
  info:     { color: 'text-blue-400',    bg: 'bg-blue-500/10',    Icon: Info        },
  offer:    { color: 'text-emerald-400', bg: 'bg-emerald-500/10', Icon: Package     },
  reminder: { color: 'text-amber-400',   bg: 'bg-amber-500/10',   Icon: Clock       },
  alert:    { color: 'text-red-400',     bg: 'bg-red-500/10',     Icon: AlertCircle },
};
function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (diff < 1)    return "À l'instant";
  if (diff < 60)   return `Il y a ${diff}min`;
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ── Panel Notifications ────────────────────────────────────────────────────
function NotificationPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate   = useNavigate();
  const panelRef   = useRef<HTMLDivElement>(null);
  const [msgs, setMsgs]       = useState<any[]>([]);
  const [unread, setUnread]   = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    authFetch('/api/scoring/user/bank-messages/')
      .then(r => r.json())
      .then(d => { setMsgs(d.messages || []); setUnread(d.unread_count || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  const markRead = async (id: number) => {
    await authFetch(`/api/scoring/user/bank-messages/${id}/read/`, { method: 'POST' });
    setMsgs(p => p.map(m => m.id === id ? { ...m, is_read: true } : m));
    setUnread(p => Math.max(0, p - 1));
  };
  const markAll = async () => {
    await authFetch('/api/scoring/user/bank-messages/read-all/', { method: 'POST' });
    setMsgs(p => p.map(m => ({ ...m, is_read: true })));
    setUnread(0);
  };

  if (!isOpen) return null;

  return (
    <div ref={panelRef}
      className="absolute top-full right-0 mt-2 w-96 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-sky-400" />
          <h3 className="text-white font-semibold text-sm">Notifications</h3>
          {unread > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{unread}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAll} className="text-slate-400 hover:text-sky-400 text-xs flex items-center gap-1 transition-colors">
              <MailOpen className="w-3 h-3" /> Tout lire
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-400 gap-2 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" /> Chargement…
          </div>
        ) : msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Bell className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-slate-400 text-sm">Aucune notification</p>
            <p className="text-slate-600 text-xs mt-1">Vos messages bancaires apparaîtront ici</p>
          </div>
        ) : msgs.map(msg => {
          const cfg = MSG_CFG[msg.type] || MSG_CFG.info;
          return (
            <div key={msg.id}
              onClick={() => { markRead(msg.id); navigate('/mes-messages'); onClose(); }}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-800/50 transition-colors border-b border-slate-800/40 last:border-0 ${!msg.is_read ? 'bg-slate-800/30' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                <cfg.Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium leading-snug ${!msg.is_read ? 'text-white' : 'text-slate-300'}`}>{msg.subject}</p>
                  {!msg.is_read && <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 mt-1.5" />}
                </div>
                <p className="text-slate-500 text-xs mt-0.5 truncate">{msg.body?.slice(0, 55)}…</p>
                <p className="text-slate-600 text-xs mt-0.5">{timeAgo(msg.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/80">
        <button onClick={() => { navigate('/mes-messages'); onClose(); }}
          className="w-full flex items-center justify-center gap-2 text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors">
          Voir tous les messages <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── NavItem ────────────────────────────────────────────────────────────────
interface NavItemProps {
  to: string; icon: React.ReactNode; label: string;
  isActive: boolean; isCollapsed: boolean;
  badge?: React.ReactNode; onClick?: () => void;
}
const NavItem = ({ to, icon, label, isActive, isCollapsed, badge, onClick }: NavItemProps) => (
  <Link to={to} onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
      isActive ? "bg-sky-500/20 text-sky-400 border-l-2 border-sky-500" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
    } ${isCollapsed ? "justify-center" : ""}`}
    title={isCollapsed ? label : undefined}>
    <span className="flex-shrink-0">{icon}</span>
    {!isCollapsed && (
      <span className="flex items-center justify-between w-full text-sm font-medium">
        {label}{badge}
      </span>
    )}
  </Link>
);

// ── Navbar principal ───────────────────────────────────────────────────────
interface NavbarProps { children: React.ReactNode; }

const Navbar = ({ children }: NavbarProps) => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  const [isCollapsed, setIsCollapsed]       = useState(false);
  const [isMobileOpen, setIsMobileOpen]     = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [showNotifs, setShowNotifs]         = useState(false);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [kycStatus, setKycStatus]           = useState<KycStatus>(null);

  // Fetch KYC
  useEffect(() => {
    authGet<{ kyc: { status: KycStatus } | null }>("/api/scoring/user/kyc/status/")
      .then(res => setKycStatus(res.kyc?.status ?? null))
      .catch(() => {});
  }, []);

  // Poll notifications count toutes les 30s
  useEffect(() => {
    const fetchCount = () => {
      authFetch('/api/scoring/user/bank-messages/')
        .then(r => r.json())
        .then(d => setUnreadCount(d.unread_count || 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => { logout(); navigate("/", { replace: true }); };

  const renderKycBadge = () => {
    if (kycStatus === "approved") return <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">✔ Vérifié</span>;
    if (kycStatus === "pending")  return <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">⏳ En attente</span>;
    return <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">✖ Non vérifié</span>;
  };

  const navItems = [
    { to: "/mon-espace",  icon: <LayoutDashboard className="h-5 w-5" />, label: "Tableau de bord"   },
    { to: "/simulateurs", icon: <Calculator className="h-5 w-5" />,      label: "Simulateurs"       },
    { to: "/calcul-score",icon: <Calculator className="h-5 w-5" />,      label: "Calculer Score"    },
    { to: "/historique",  icon: <History className="h-5 w-5" />,         label: "Historique"        },
    { to: "/documents",   icon: <FileText className="h-5 w-5" />,        label: "Documents"         },
    { to: "/profil",      icon: <User className="h-5 w-5" />,            label: "Mon Profil"        },
    { to: "/kyc",         icon: <ShieldCheck className="h-5 w-5" />,     label: "Vérification KYC", badge: renderKycBadge() },
    { to: "/chat-history",icon: <MessageSquare className="h-5 w-5" />,   label: "Mes Conversations" },
    {
      to: "/mes-messages",
      icon: <Bell className="h-5 w-5" />,
      label: "Banque & Messages",
      badge: unreadCount || undefined
        ? <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{unreadCount}</span>
        : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b1220] flex">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-slate-900/95 border-r border-white/10 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>

        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <Link to="/mon-espace" className="flex items-center gap-3">
            <img src={terasLogoUrl} alt="TERAS" className="h-8 w-auto shadow-[0_0_18px_rgba(56,189,248,0.45)]" />
            {!isCollapsed && <span className="text-lg font-bold text-white">TERAS</span>}
          </Link>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:flex p-1.5 text-slate-400 hover:text-white">
            <ChevronLeft className={`h-5 w-5 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavItem key={item.to} {...item}
              isActive={location.pathname === item.to}
              isCollapsed={isCollapsed}
              onClick={() => setIsMobileOpen(false)} />
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <NavItem to="/parametres" icon={<Settings className="h-5 w-5" />} label="Paramètres"
            isActive={location.pathname === "/parametres"} isCollapsed={isCollapsed} />
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="text-sm">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-slate-900/50 border-b border-white/10 flex items-center justify-between px-4 shrink-0">
          <button onClick={() => setIsMobileOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-white">
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            {/* Chat IA */}
            <button onClick={() => setIsAssistantOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-purple-400 transition-colors"
              title="Assistant IA">
              <MessageCircle className="h-5 w-5" />
            </button>

            {/* Cloche notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifs(p => !p)}
                className="relative p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-sky-400 transition-colors"
                title="Notifications">
                <Bell className="h-5 w-5" />
                {!!unreadCount && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <NotificationPanel isOpen={showNotifs} onClose={() => setShowNotifs(false)} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      <UserAIAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
    </div>
  );
};

export default Navbar;
