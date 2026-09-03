import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// teras-frontend/src/layouts/EnterpriseLayout.tsx
import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Brain, Users, DollarSign, FileText, UserCheck, BarChart3, ShieldCheck, Bell, MessageCircle, User, Settings, LogOut, ChevronLeft, Menu, X, Wallet, } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authFetch } from "../services/authFetch";
import terasLogoUrl from "../assets/logo-teras.svg";
const NavItem = ({ to, icon, label, sub, isActive, isCollapsed, badge, onClick }) => (_jsxs(Link, { to: to, onClick: onClick, className: `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${isActive ? "bg-sky-500/20 text-sky-400 border-l-2 border-sky-500" : "text-slate-400 hover:text-white hover:bg-slate-800/50"} ${isCollapsed ? "justify-center" : ""}`, title: isCollapsed ? label : undefined, children: [_jsxs("span", { className: "flex-shrink-0 relative", children: [icon, !!badge && badge > 0 && (_jsx("span", { className: "absolute -top-1 -right-1 flex items-center justify-center", children: badge <= 9
                        ? _jsx("span", { className: "bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none", children: badge })
                        : _jsx("span", { className: "w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" }) }))] }), !isCollapsed && (_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium leading-none", children: label }), sub && _jsx("p", { className: "text-xs text-slate-500 mt-0.5 truncate", children: sub })] }))] }));
// ── EnterpriseLayout ───────────────────────────────────────────────────────────
export default function EnterpriseLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [unreadBank, setUnreadBank] = useState(0);
    const [unreadNotif, setUnreadNotif] = useState(0);
    // Poll messages banque toutes les 30s
    useEffect(() => {
        const fetchUnread = () => {
            authFetch('/api/scoring/enterprise/bank-messages/')
                .then(r => r.json())
                .then(d => setUnreadBank(d.unread_count || 0))
                .catch(() => { });
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, []);
    const handleLogout = () => { logout(); navigate("/", { replace: true }); };
    const isActive = (path) => location.pathname.startsWith(`/enterprise/${path}`);
    const close = () => setIsMobileOpen(false);
    const navItems = [
        { to: '/enterprise/dashboard', icon: _jsx(LayoutDashboard, { className: "w-5 h-5" }), label: 'Dashboard', sub: 'Vue d\'ensemble' },
        { to: '/enterprise/assistant', icon: _jsx(Brain, { className: "w-5 h-5" }), label: 'Assistant IA', sub: 'Conseils intelligents' },
        { to: '/enterprise/clients', icon: _jsx(Users, { className: "w-5 h-5" }), label: 'Clients', sub: 'Portefeuille clients' },
        { to: '/enterprise/transactions', icon: _jsx(DollarSign, { className: "w-5 h-5" }), label: 'Transactions', sub: 'Historique financier' },
        { to: '/enterprise/documents', icon: _jsx(FileText, { className: "w-5 h-5" }), label: 'Documents', sub: 'Gestion documents' },
        { to: '/enterprise/employees', icon: _jsx(UserCheck, { className: "w-5 h-5" }), label: 'Employés', sub: 'Gestion personnel' },
        { to: '/enterprise/reports', icon: _jsx(BarChart3, { className: "w-5 h-5" }), label: 'Rapports', sub: 'Analyses & Stats' },
        { to: '/enterprise/compliance', icon: _jsx(ShieldCheck, { className: "w-5 h-5" }), label: 'Conformité', sub: 'Statut conformité' },
        // ── Finance & Banque ─────────────────────────────────────────────────────
        { to: '/enterprise/finance', icon: _jsx(Wallet, { className: "w-5 h-5" }), label: 'Finance & Banque', sub: 'Crédits & messages', badge: unreadBank },
        // ─────────────────────────────────────────────────────────────────────────
        { to: '/enterprise/notifications', icon: _jsx(Bell, { className: "w-5 h-5" }), label: 'Notifications', sub: 'Alertes système', badge: unreadNotif },
        { to: '/enterprise/support', icon: _jsx(MessageCircle, { className: "w-5 h-5" }), label: 'Support', sub: 'Assistance technique' },
        { to: '/enterprise/profile', icon: _jsx(User, { className: "w-5 h-5" }), label: 'Profil', sub: 'Infos entreprise' },
        { to: '/enterprise/settings', icon: _jsx(Settings, { className: "w-5 h-5" }), label: 'Paramètres', sub: 'Configuration' },
    ];
    return (_jsxs("div", { className: "min-h-screen bg-[#0b1220] flex", children: [isMobileOpen && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-40 lg:hidden", onClick: close })), _jsxs("aside", { className: `fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-slate-900/95 border-r border-white/10 transition-all duration-300 ${isCollapsed ? "w-[72px]" : "w-56"} ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`, children: [_jsxs("div", { className: "flex items-center justify-between h-14 px-3 border-b border-white/10 shrink-0", children: [_jsxs(Link, { to: "/enterprise/dashboard", className: "flex items-center gap-2 min-w-0", children: [_jsx("img", { src: terasLogoUrl, alt: "TERAS", className: "h-7 w-auto shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.4)]" }), !isCollapsed && (_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-white font-bold text-sm leading-none", children: "TERAS" }), _jsx("p", { className: "text-sky-400 text-xs", children: "Entreprise" })] }))] }), _jsxs("div", { className: "flex items-center gap-1", children: [isMobileOpen && (_jsx("button", { onClick: close, className: "lg:hidden p-1 text-slate-400 hover:text-white", children: _jsx(X, { className: "w-4 h-4" }) })), _jsx("button", { onClick: () => setIsCollapsed(p => !p), className: "hidden lg:flex p-1 text-slate-400 hover:text-white", children: _jsx(ChevronLeft, { className: `w-4 h-4 transition-transform ${isCollapsed ? "rotate-180" : ""}` }) })] })] }), _jsx("nav", { className: "flex-1 px-2 py-3 space-y-0.5 overflow-y-auto", children: navItems.map(item => (_jsx(NavItem, { ...item, isActive: isActive(item.to.replace('/enterprise/', '')), isCollapsed: isCollapsed, onClick: close }, item.to))) }), _jsxs("div", { className: "px-2 py-3 border-t border-white/10 shrink-0", children: [!isCollapsed && (_jsxs("div", { className: "px-3 py-2 mb-2 bg-slate-800/50 rounded-xl", children: [_jsx("p", { className: "text-slate-500 text-xs", children: "Connect\u00E9 en tant que" }), _jsx("p", { className: "text-white text-xs font-semibold truncate", children: user?.email || 'Entreprise' }), _jsx("p", { className: "text-sky-400 text-xs", children: "Entreprise" })] })), _jsxs("button", { onClick: handleLogout, className: `flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ${isCollapsed ? 'justify-center' : ''}`, children: [_jsx(LogOut, { className: "w-4 h-4 shrink-0" }), !isCollapsed && _jsx("span", { className: "text-sm", children: "D\u00E9connexion" })] })] })] }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [_jsxs("header", { className: "h-14 bg-slate-900/50 border-b border-white/10 flex items-center justify-between px-4 lg:hidden shrink-0", children: [_jsx("button", { onClick: () => setIsMobileOpen(true), className: "p-2 text-slate-400 hover:text-white", children: _jsx(Menu, { className: "w-5 h-5" }) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("img", { src: terasLogoUrl, alt: "TERAS", className: "h-6 w-auto" }), _jsx("span", { className: "text-white font-bold text-sm", children: "TERAS" })] }), _jsxs(Link, { to: "/enterprise/finance", className: "relative p-2 text-slate-400 hover:text-sky-400 transition-colors", children: [_jsx(Wallet, { className: "w-5 h-5" }), unreadBank > 0 && (_jsx("span", { className: "absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold", children: unreadBank }))] })] }), _jsx("main", { className: "flex-1 overflow-auto", children: _jsx(Outlet, {}) })] })] }));
}
