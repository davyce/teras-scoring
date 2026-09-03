import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, BarChart3, Shield, User, Settings, LogOut, ChevronRight, Bell, Bot, MessageSquare, DollarSign, Briefcase, X, } from 'lucide-react';
import { useAuth } from '../../stores/auth';
import terasLogoUrl from '../../assets/logo-teras.svg';
const menuItems = [
    { path: '/enterprise/dashboard', icon: LayoutDashboard, label: 'Dashboard', desc: 'Vue d\'ensemble' },
    { path: '/enterprise/assistant', icon: Bot, label: 'Assistant IA', desc: 'Conseils intelligents' },
    { path: '/enterprise/clients', icon: Briefcase, label: 'Clients', desc: 'Portefeuille clients' },
    { path: '/enterprise/transactions', icon: DollarSign, label: 'Transactions', desc: 'Historique financier' },
    { path: '/enterprise/documents', icon: FileText, label: 'Documents', desc: 'Gestion documents' },
    { path: '/enterprise/employees', icon: Users, label: 'Employés', desc: 'Gestion personnel' },
    { path: '/enterprise/reports', icon: BarChart3, label: 'Rapports', desc: 'Analyses & Stats' },
    { path: '/enterprise/compliance', icon: Shield, label: 'Conformité', desc: 'Statut conformité' },
    { path: '/enterprise/notifications', icon: Bell, label: 'Notifications', desc: 'Alertes système', badge: 3 },
    { path: '/enterprise/support', icon: MessageSquare, label: 'Support', desc: 'Assistance technique' },
    { path: '/enterprise/profile', icon: User, label: 'Profil', desc: 'Infos entreprise' },
    { path: '/enterprise/settings', icon: Settings, label: 'Paramètres', desc: 'Configuration' },
];
export default function EnterpriseSidebar({ collapsed, onToggle }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isActive = (path) => location.pathname === path;
    const handleLogout = () => {
        ['token', 'refreshToken', 'user', 'teras_access_token', 'teras_token',
            'teras_refresh_token', 'teras-auth', 'teras_auth_context'].forEach(k => localStorage.removeItem(k));
        navigate('/login');
    };
    const userName = user?.company_name || user?.first_name || 'Entreprise';
    return (_jsxs("aside", { className: `fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-800/60 flex flex-col z-50 transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'}`, children: [_jsxs("div", { className: `flex items-center border-b border-slate-800/60 flex-shrink-0 ${collapsed ? 'justify-center p-3' : 'justify-between px-4 py-4'}`, children: [!collapsed && (_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [_jsx("img", { src: terasLogoUrl, alt: "TERAS", className: "w-9 h-9 flex-shrink-0" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-xs font-bold text-cyan-400 uppercase tracking-widest leading-none", children: "TERAS" }), _jsx("p", { className: "text-sm font-semibold text-white mt-0.5", children: "Entreprise" })] })] })), collapsed && _jsx("img", { src: terasLogoUrl, alt: "TERAS", className: "w-8 h-8" }), _jsx("button", { onClick: onToggle, className: `p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex-shrink-0 ${collapsed ? 'mt-2' : ''}`, children: collapsed ? _jsx(ChevronRight, { className: "w-4 h-4" }) : _jsx(X, { className: "w-4 h-4" }) })] }), _jsx("nav", { className: "flex-1 overflow-y-auto py-3 px-2 space-y-0.5", children: menuItems.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (_jsxs(Link, { to: item.path, title: collapsed ? item.label : undefined, className: `group flex items-center gap-3 rounded-xl transition-all duration-150 ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'} ${active
                            ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/30'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'}`, children: [_jsxs("div", { className: "relative flex-shrink-0", children: [_jsx(Icon, { className: `w-4.5 h-4.5 ${active ? 'text-cyan-400' : ''}`, style: { width: '18px', height: '18px' } }), item.badge && item.badge > 0 && (_jsx("span", { className: "absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center", children: item.badge > 9 ? '9+' : item.badge }))] }), !collapsed && (_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: `text-sm font-medium leading-none ${active ? 'text-cyan-300' : 'text-slate-200'}`, children: item.label }), _jsx("p", { className: "text-xs text-slate-500 mt-0.5 leading-none truncate", children: item.desc })] })), active && !collapsed && _jsx("div", { className: "w-1 h-4 bg-cyan-400 rounded-full flex-shrink-0" })] }, item.path));
                }) }), _jsxs("div", { className: `border-t border-slate-800/60 flex-shrink-0 ${collapsed ? 'p-2' : 'p-3'}`, children: [!collapsed && (_jsxs("div", { className: "mb-2 px-3 py-2 bg-slate-800/40 rounded-xl border border-slate-700/30", children: [_jsx("p", { className: "text-xs text-slate-500 leading-none", children: "Connect\u00E9 en tant que" }), _jsx("p", { className: "text-sm font-semibold text-slate-200 mt-0.5 truncate", children: userName })] })), _jsxs("button", { onClick: handleLogout, title: collapsed ? 'Déconnexion' : undefined, className: `w-full flex items-center gap-3 rounded-xl text-slate-400 hover:bg-rose-900/20 hover:text-rose-400 transition-all border border-transparent hover:border-rose-800/30 ${collapsed ? 'justify-center p-2' : 'px-3 py-2'}`, children: [_jsx(LogOut, { style: { width: '16px', height: '16px' }, className: "flex-shrink-0" }), !collapsed && _jsx("span", { className: "text-sm font-medium", children: "D\u00E9connexion" })] })] })] }));
}
