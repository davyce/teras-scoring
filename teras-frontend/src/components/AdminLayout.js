import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
//src/components/AdminLayout.tsx
import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, CheckSquare, BarChart3, Activity, MessageSquare, Bot, Search, Bell, Menu, X, LogOut, Settings, User, Moon, Sun, FileText, Upload, BookOpen, Database, BarChart2, // ⭐ NOUVEAU - Icône Analytics RAG
ShieldCheck, // ✅ NOUVEAU - Icône KYC
 } from 'lucide-react';
import { useAuth } from '../stores/auth';
import { useTheme } from '../stores/theme';
import logoTeras from '../assets/logo-teras.svg';
export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const menuItems = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-blue-600 dark:text-blue-400' },
        { path: '/admin/users', icon: Users, label: 'Utilisateurs', color: 'text-purple-600 dark:text-purple-400' },
        // ✅ NOUVEAU - KYC Admin
        { path: '/admin/kyc', icon: ShieldCheck, label: 'KYC', color: 'text-teal-600 dark:text-teal-400' },
        { path: '/admin/validation', icon: CheckSquare, label: 'Validations', color: 'text-orange-600 dark:text-orange-400' },
        { path: '/admin/documents', icon: FileText, label: 'Documents', color: 'text-green-600 dark:text-green-400' },
        { path: '/admin/upload', icon: Upload, label: 'Upload Docs', color: 'text-cyan-600 dark:text-cyan-400' },
        { path: '/admin/legislation', icon: BookOpen, label: 'Législation', color: 'text-amber-600 dark:text-amber-400' },
        { path: '/admin/analytics', icon: BarChart3, label: 'Analytics', color: 'text-emerald-600 dark:text-emerald-400' },
        { path: '/admin/monitor', icon: Activity, label: 'Monitoring', color: 'text-pink-600 dark:text-pink-400' },
        { path: '/admin/support', icon: MessageSquare, label: 'Support', color: 'text-rose-600 dark:text-rose-400' },
        { path: '/admin/ai-chat', icon: Bot, label: 'IA Assistant', color: 'text-indigo-600 dark:text-indigo-400' },
        { path: '/admin/rag-chat', icon: Database, label: 'Chat RAG', color: 'text-violet-600 dark:text-violet-400' },
        // ⭐ NOUVEAU - ANALYTICS RAG
        { path: '/admin/rag-analytics', icon: BarChart2, label: 'Analytics RAG', color: 'text-cyan-600 dark:text-cyan-400' },
    ];
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return (_jsxs("div", { className: "flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors", children: [_jsxs("aside", { className: `fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`, children: [_jsxs("div", { className: "flex items-center gap-3 h-16 px-6 border-b border-gray-200 dark:border-gray-700", children: [_jsx("img", { src: logoTeras, alt: "TERAS Logo", className: "w-8 h-8" }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-gray-900 dark:text-white", children: "TERAS Admin" }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Syst\u00E8me d'administration" })] })] }), _jsx("nav", { className: "flex-1 px-4 py-6 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]", children: menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (_jsxs(Link, { to: item.path, className: `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`, children: [_jsx(Icon, { className: `w-5 h-5 ${isActive ? item.color : ''}` }), _jsx("span", { className: "text-sm", children: item.label })] }, item.path));
                        }) }), _jsxs("div", { className: "p-4 border-t border-gray-200 dark:border-gray-700", children: [_jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Version 2.0.0" }), _jsx("p", { className: "text-xs text-gray-400 dark:text-gray-500", children: "\u00A9 2025 TERAS System" })] })] }), _jsxs("div", { className: `flex-1 flex flex-col transition-all duration-200 ${isSidebarOpen ? 'lg:ml-64' : ''}`, children: [_jsx("header", { className: "sticky top-0 z-40 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm", children: _jsxs("div", { className: "flex items-center justify-between h-full px-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: () => setIsSidebarOpen(!isSidebarOpen), className: "lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors", children: isSidebarOpen ? (_jsx(X, { className: "w-6 h-6 text-gray-600 dark:text-gray-300" })) : (_jsx(Menu, { className: "w-6 h-6 text-gray-600 dark:text-gray-300" })) }), _jsxs("div", { className: "flex items-center gap-2 lg:hidden", children: [_jsx("img", { src: logoTeras, alt: "TERAS", className: "w-6 h-6" }), _jsx("span", { className: "font-bold text-gray-900 dark:text-white", children: "TERAS" })] })] }), _jsx("div", { className: "hidden md:flex flex-1 max-w-md mx-8", children: _jsxs("div", { className: "relative w-full", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Rechercher...", className: "w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors" })] }) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: toggleTheme, className: "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors", title: isDarkMode ? 'Mode clair' : 'Mode sombre', children: isDarkMode ? (_jsx(Sun, { className: "w-5 h-5 text-yellow-500" })) : (_jsx(Moon, { className: "w-5 h-5 text-gray-600" })) }), _jsxs("button", { className: "relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors", children: [_jsx(Bell, { className: "w-5 h-5 text-gray-600 dark:text-gray-300" }), _jsx("span", { className: "absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" })] }), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setIsProfileOpen(!isProfileOpen), className: "flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center", children: _jsx("span", { className: "text-sm font-semibold text-white", children: user?.username?.charAt(0).toUpperCase() || 'A' }) }), _jsxs("div", { className: "hidden md:block text-left", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: user?.username || 'Admin' }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Administrateur" })] })] }), isProfileOpen && (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-40", onClick: () => setIsProfileOpen(false) }), _jsxs("div", { className: "absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50", children: [_jsxs("button", { onClick: () => {
                                                                        setIsProfileOpen(false);
                                                                        navigate('/admin/profile');
                                                                    }, className: "w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors", children: [_jsx(User, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm", children: "Mon Profil" })] }), _jsxs("button", { onClick: () => {
                                                                        setIsProfileOpen(false);
                                                                        navigate('/admin/settings');
                                                                    }, className: "w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors", children: [_jsx(Settings, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm", children: "Param\u00E8tres" })] }), _jsx("hr", { className: "my-2 border-gray-200 dark:border-gray-700" }), _jsxs("button", { onClick: handleLogout, className: "w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors", children: [_jsx(LogOut, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm", children: "D\u00E9connexion" })] })] })] }))] })] })] }) }), _jsx("main", { className: "flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900", children: _jsx(Outlet, {}) })] }), isSidebarOpen && (_jsx("div", { className: "fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden", onClick: () => setIsSidebarOpen(false) }))] }));
}
