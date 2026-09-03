import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Composant de navigation sidebar TERAS
 * ✅ KYC User intégré avec badge statut
 * ✅ Notifications banque fonctionnelles avec panel dropdown
 */
import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Calculator, History, FileText, User, LogOut, Menu, X, ChevronLeft, Settings, Bell, MessageCircle, MessageSquare, ShieldCheck, Package, Clock, AlertCircle, Info, MailOpen, ArrowRight, RefreshCw, } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authGet, authFetch } from "../utils/authFetch";
import terasLogoUrl from "../assets/logo-teras.svg";
import UserAIAssistant from "./user/UserAIAssistant";
// ── Config types de message ────────────────────────────────────────────────
const MSG_CFG = {
    info: { color: 'text-blue-400', bg: 'bg-blue-500/10', Icon: Info },
    offer: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', Icon: Package },
    reminder: { color: 'text-amber-400', bg: 'bg-amber-500/10', Icon: Clock },
    alert: { color: 'text-red-400', bg: 'bg-red-500/10', Icon: AlertCircle },
};
function timeAgo(d) {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (diff < 1)
        return "À l'instant";
    if (diff < 60)
        return `Il y a ${diff}min`;
    if (diff < 1440)
        return `Il y a ${Math.floor(diff / 60)}h`;
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}
// ── Panel Notifications ────────────────────────────────────────────────────
function NotificationPanel({ isOpen, onClose }) {
    const navigate = useNavigate();
    const panelRef = useRef(null);
    const [msgs, setMsgs] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target))
                onClose();
        };
        if (isOpen)
            document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, onClose]);
    useEffect(() => {
        if (!isOpen)
            return;
        setLoading(true);
        authFetch('/api/scoring/user/bank-messages/')
            .then(r => r.json())
            .then(d => { setMsgs(d.messages || []); setUnread(d.unread_count || 0); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [isOpen]);
    const markRead = async (id) => {
        await authFetch(`/api/scoring/user/bank-messages/${id}/read/`, { method: 'POST' });
        setMsgs(p => p.map(m => m.id === id ? { ...m, is_read: true } : m));
        setUnread(p => Math.max(0, p - 1));
    };
    const markAll = async () => {
        await authFetch('/api/scoring/user/bank-messages/read-all/', { method: 'POST' });
        setMsgs(p => p.map(m => ({ ...m, is_read: true })));
        setUnread(0);
    };
    if (!isOpen)
        return null;
    return (_jsxs("div", { ref: panelRef, className: "absolute top-full right-0 mt-2 w-96 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b border-slate-800", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Bell, { className: "w-4 h-4 text-sky-400" }), _jsx("h3", { className: "text-white font-semibold text-sm", children: "Notifications" }), unread > 0 && (_jsx("span", { className: "bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center", children: unread }))] }), _jsxs("div", { className: "flex items-center gap-2", children: [unread > 0 && (_jsxs("button", { onClick: markAll, className: "text-slate-400 hover:text-sky-400 text-xs flex items-center gap-1 transition-colors", children: [_jsx(MailOpen, { className: "w-3 h-3" }), " Tout lire"] })), _jsx("button", { onClick: onClose, className: "p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors", children: _jsx(X, { className: "w-4 h-4" }) })] })] }), _jsx("div", { className: "max-h-80 overflow-y-auto", children: loading ? (_jsxs("div", { className: "flex items-center justify-center py-8 text-slate-400 gap-2 text-sm", children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), " Chargement\u2026"] })) : msgs.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-10 px-4 text-center", children: [_jsx(Bell, { className: "w-10 h-10 text-slate-700 mb-3" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Aucune notification" }), _jsx("p", { className: "text-slate-600 text-xs mt-1", children: "Vos messages bancaires appara\u00EEtront ici" })] })) : msgs.map(msg => {
                    const cfg = MSG_CFG[msg.type] || MSG_CFG.info;
                    return (_jsxs("div", { onClick: () => { markRead(msg.id); navigate('/mes-messages'); onClose(); }, className: `flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-800/50 transition-colors border-b border-slate-800/40 last:border-0 ${!msg.is_read ? 'bg-slate-800/30' : ''}`, children: [_jsx("div", { className: `w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`, children: _jsx(cfg.Icon, { className: `w-4 h-4 ${cfg.color}` }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx("p", { className: `text-sm font-medium leading-snug ${!msg.is_read ? 'text-white' : 'text-slate-300'}`, children: msg.subject }), !msg.is_read && _jsx("span", { className: "w-2 h-2 rounded-full bg-sky-400 shrink-0 mt-1.5" })] }), _jsxs("p", { className: "text-slate-500 text-xs mt-0.5 truncate", children: [msg.body?.slice(0, 55), "\u2026"] }), _jsx("p", { className: "text-slate-600 text-xs mt-0.5", children: timeAgo(msg.created_at) })] })] }, msg.id));
                }) }), _jsx("div", { className: "px-4 py-3 border-t border-slate-800 bg-slate-900/80", children: _jsxs("button", { onClick: () => { navigate('/mes-messages'); onClose(); }, className: "w-full flex items-center justify-center gap-2 text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors", children: ["Voir tous les messages ", _jsx(ArrowRight, { className: "w-4 h-4" })] }) })] }));
}
const NavItem = ({ to, icon, label, isActive, isCollapsed, badge, onClick }) => (_jsxs(Link, { to: to, onClick: onClick, className: `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? "bg-sky-500/20 text-sky-400 border-l-2 border-sky-500" : "text-slate-400 hover:text-white hover:bg-slate-800/50"} ${isCollapsed ? "justify-center" : ""}`, title: isCollapsed ? label : undefined, children: [_jsx("span", { className: "flex-shrink-0", children: icon }), !isCollapsed && (_jsxs("span", { className: "flex items-center justify-between w-full text-sm font-medium", children: [label, badge] }))] }));
const Navbar = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [kycStatus, setKycStatus] = useState(null);
    // Fetch KYC
    useEffect(() => {
        authGet("/api/scoring/user/kyc/status/")
            .then(res => setKycStatus(res.kyc?.status ?? null))
            .catch(() => { });
    }, []);
    // Poll notifications count toutes les 30s
    useEffect(() => {
        const fetchCount = () => {
            authFetch('/api/scoring/user/bank-messages/')
                .then(r => r.json())
                .then(d => setUnreadCount(d.unread_count || 0))
                .catch(() => { });
        };
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);
    const handleLogout = () => { logout(); navigate("/", { replace: true }); };
    const renderKycBadge = () => {
        if (kycStatus === "approved")
            return _jsx("span", { className: "text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400", children: "\u2714 V\u00E9rifi\u00E9" });
        if (kycStatus === "pending")
            return _jsx("span", { className: "text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400", children: "\u23F3 En attente" });
        return _jsx("span", { className: "text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400", children: "\u2716 Non v\u00E9rifi\u00E9" });
    };
    const navItems = [
        { to: "/mon-espace", icon: _jsx(LayoutDashboard, { className: "h-5 w-5" }), label: "Tableau de bord" },
        { to: "/simulateurs", icon: _jsx(Calculator, { className: "h-5 w-5" }), label: "Simulateurs" },
        { to: "/calcul-score", icon: _jsx(Calculator, { className: "h-5 w-5" }), label: "Calculer Score" },
        { to: "/historique", icon: _jsx(History, { className: "h-5 w-5" }), label: "Historique" },
        { to: "/documents", icon: _jsx(FileText, { className: "h-5 w-5" }), label: "Documents" },
        { to: "/profil", icon: _jsx(User, { className: "h-5 w-5" }), label: "Mon Profil" },
        { to: "/kyc", icon: _jsx(ShieldCheck, { className: "h-5 w-5" }), label: "Vérification KYC", badge: renderKycBadge() },
        { to: "/chat-history", icon: _jsx(MessageSquare, { className: "h-5 w-5" }), label: "Mes Conversations" },
        {
            to: "/mes-messages",
            icon: _jsx(Bell, { className: "h-5 w-5" }),
            label: "Banque & Messages",
            badge: unreadCount || undefined
                ? _jsx("span", { className: "bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center", children: unreadCount })
                : undefined,
        },
    ];
    return (_jsxs("div", { className: "min-h-screen bg-[#0b1220] flex", children: [isMobileOpen && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-40 lg:hidden", onClick: () => setIsMobileOpen(false) })), _jsxs("aside", { className: `fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-slate-900/95 border-r border-white/10 transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"} ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`, children: [_jsxs("div", { className: "flex items-center justify-between h-16 px-4 border-b border-white/10", children: [_jsxs(Link, { to: "/mon-espace", className: "flex items-center gap-3", children: [_jsx("img", { src: terasLogoUrl, alt: "TERAS", className: "h-8 w-auto shadow-[0_0_18px_rgba(56,189,248,0.45)]" }), !isCollapsed && _jsx("span", { className: "text-lg font-bold text-white", children: "TERAS" })] }), _jsx("button", { onClick: () => setIsCollapsed(!isCollapsed), className: "hidden lg:flex p-1.5 text-slate-400 hover:text-white", children: _jsx(ChevronLeft, { className: `h-5 w-5 transition-transform ${isCollapsed ? "rotate-180" : ""}` }) })] }), _jsx("nav", { className: "flex-1 px-3 py-4 space-y-1 overflow-y-auto", children: navItems.map(item => (_jsx(NavItem, { ...item, isActive: location.pathname === item.to, isCollapsed: isCollapsed, onClick: () => setIsMobileOpen(false) }, item.to))) }), _jsxs("div", { className: "px-3 py-4 border-t border-white/10 space-y-1", children: [_jsx(NavItem, { to: "/parametres", icon: _jsx(Settings, { className: "h-5 w-5" }), label: "Param\u00E8tres", isActive: location.pathname === "/parametres", isCollapsed: isCollapsed }), _jsxs("button", { onClick: handleLogout, className: "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors", children: [_jsx(LogOut, { className: "h-5 w-5" }), !isCollapsed && _jsx("span", { className: "text-sm", children: "D\u00E9connexion" })] })] })] }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [_jsxs("header", { className: "h-16 bg-slate-900/50 border-b border-white/10 flex items-center justify-between px-4 shrink-0", children: [_jsx("button", { onClick: () => setIsMobileOpen(true), className: "lg:hidden p-2 text-slate-400 hover:text-white", children: _jsx(Menu, { className: "h-5 w-5" }) }), _jsxs("div", { className: "flex items-center gap-2 ml-auto", children: [_jsx("button", { onClick: () => setIsAssistantOpen(true), className: "p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-purple-400 transition-colors", title: "Assistant IA", children: _jsx(MessageCircle, { className: "h-5 w-5" }) }), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setShowNotifs(p => !p), className: "relative p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-sky-400 transition-colors", title: "Notifications", children: [_jsx(Bell, { className: "h-5 w-5" }), !!unreadCount && unreadCount > 0 && (_jsx("span", { className: "absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none", children: unreadCount > 9 ? '9+' : unreadCount }))] }), _jsx(NotificationPanel, { isOpen: showNotifs, onClose: () => setShowNotifs(false) })] })] })] }), _jsx("main", { className: "flex-1 overflow-auto", children: children })] }), _jsx(UserAIAssistant, { isOpen: isAssistantOpen, onClose: () => setIsAssistantOpen(false) })] }));
};
export default Navbar;
