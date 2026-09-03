import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * EnterpriseNotifications.tsx
 * Connecté à l'API /api/scoring/enterprise/notifications/
 * Zéro mock — états vides si API indisponible
 */
import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, Search, AlertTriangle, Info, CheckCircle, TrendingUp, FileText, Users, Shield, Loader2, AlertCircle, } from 'lucide-react';
import enterpriseApi from '../../services/enterpriseApi';
const getIcon = (type) => {
    switch (type) {
        case 'success': return CheckCircle;
        case 'warning': return AlertTriangle;
        case 'alert': return AlertTriangle;
        case 'info': return Info;
        default: return Bell;
    }
};
const getColor = (type) => {
    switch (type) {
        case 'success': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
        case 'warning': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
        case 'alert': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
        case 'info': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
};
const getCategoryIcon = (category) => {
    switch (category) {
        case 'score': return TrendingUp;
        case 'document': return FileText;
        case 'employee': return Users;
        case 'compliance': return Shield;
        default: return Bell;
    }
};
const EnterpriseNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    useEffect(() => { fetchNotifications(); }, []);
    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await enterpriseApi.getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        }
        catch (e) {
            setError(e.message || 'Impossible de charger les notifications.');
            setNotifications([]);
        }
        finally {
            setLoading(false);
        }
    };
    const handleMarkAsRead = async (id) => {
        try {
            await enterpriseApi.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        }
        catch { /* silencieux */ }
    };
    const handleMarkAllAsRead = async () => {
        try {
            await enterpriseApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
        catch { /* silencieux */ }
    };
    const handleDelete = async (id) => {
        try {
            await enterpriseApi.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        }
        catch { /* silencieux */ }
    };
    const filtered = notifications.filter(n => {
        const matchFilter = filterType === 'all' ||
            (filterType === 'unread' && !n.read) ||
            (filterType === 'read' && n.read);
        const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.message.toLowerCase().includes(searchQuery.toLowerCase());
        return matchFilter && matchSearch;
    });
    const unreadCount = notifications.filter(n => !n.read).length;
    if (loading)
        return (_jsx("div", { className: "min-h-screen bg-slate-950 flex items-center justify-center", children: _jsx(Loader2, { className: "w-10 h-10 text-cyan-500 animate-spin" }) }));
    return (_jsx("div", { className: "min-h-screen bg-slate-950 p-6", children: _jsxs("div", { className: "max-w-5xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1", children: "TERAS Entreprise" }), _jsx("h1", { className: "text-3xl font-black text-white", children: "Notifications" }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: unreadCount > 0
                                        ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                                        : 'Aucune notification non lue' })] }), _jsxs("button", { onClick: handleMarkAllAsRead, disabled: unreadCount === 0, className: "flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium", children: [_jsx(CheckCheck, { className: "w-4 h-4" }), " Tout marquer comme lu"] })] }), error && (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 bg-rose-900/20 border border-rose-800 rounded-xl text-rose-300 text-sm", children: [_jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }), " ", error, _jsx("button", { onClick: fetchNotifications, className: "ml-auto text-xs underline", children: "R\u00E9essayer" })] })), _jsxs("div", { className: "bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" }), _jsx("input", { value: searchQuery, onChange: e => setSearchQuery(e.target.value), placeholder: "Rechercher une notification...", className: "w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500" })] }), _jsx("div", { className: "flex gap-2", children: ['all', 'unread', 'read'].map(f => (_jsx("button", { onClick: () => setFilterType(f), className: `px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterType === f ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`, children: f === 'all' ? 'Toutes' : f === 'unread' ? 'Non lues' : 'Lues' }, f))) })] }), _jsx("div", { className: "space-y-3", children: filtered.length === 0 ? (_jsxs("div", { className: "bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center", children: [_jsx(Bell, { className: "w-12 h-12 text-slate-700 mx-auto mb-3" }), _jsx("p", { className: "text-slate-400 text-sm", children: notifications.length === 0 ? 'Aucune notification pour le moment.' : 'Aucun résultat.' })] })) : filtered.map(notif => {
                        const Icon = getIcon(notif.type);
                        const CatIcon = getCategoryIcon(notif.category);
                        const ts = typeof notif.timestamp === 'string'
                            ? new Date(notif.timestamp)
                            : notif.timestamp;
                        return (_jsx("div", { className: `bg-slate-900/60 border rounded-2xl p-5 transition-all hover:border-slate-700 ${notif.read ? 'border-slate-800 opacity-60' : 'border-slate-700'}`, children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: `p-3 rounded-xl border ${getColor(notif.type)} shrink-0`, children: _jsx(Icon, { className: "w-5 h-5" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between gap-3 mb-2 flex-wrap", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: `font-semibold text-sm ${notif.read ? 'text-slate-400' : 'text-white'}`, children: notif.title }), !notif.read && _jsx("span", { className: "w-2 h-2 bg-cyan-500 rounded-full shrink-0" })] }), _jsxs("div", { className: "flex items-center gap-2 text-slate-500", children: [_jsx(CatIcon, { className: "w-3.5 h-3.5" }), _jsx("span", { className: "text-xs", children: ts.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })] })] }), _jsx("p", { className: "text-sm text-slate-400 mb-3", children: notif.message }), _jsxs("div", { className: "flex items-center gap-4", children: [!notif.read && (_jsx("button", { onClick: () => handleMarkAsRead(notif.id), className: "text-xs text-cyan-400 hover:text-cyan-300 transition-colors", children: "Marquer comme lu" })), _jsxs("button", { onClick: () => handleDelete(notif.id), className: "text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1", children: [_jsx(Trash2, { className: "w-3 h-3" }), " Supprimer"] })] })] })] }) }, notif.id));
                    }) })] }) }));
};
export default EnterpriseNotifications;
