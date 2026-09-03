import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, XCircle, Search, RefreshCw, AlertCircle, } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
export default function AdminActivityMonitor() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    useEffect(() => {
        loadActivities();
    }, []);
    useEffect(() => {
        if (!autoRefresh)
            return;
        const interval = setInterval(() => loadActivities(true), 30000);
        return () => clearInterval(interval);
    }, [autoRefresh]);
    const loadActivities = async (silent = false) => {
        try {
            if (!silent)
                setLoading(true);
            const response = await adminApi.getActivities({ limit: 100 });
            if (response.error)
                throw new Error(response.error);
            setActivities(response.data ?? []);
            setError(null);
        }
        catch (error) {
            console.error('Erreur:', error);
            setError(error instanceof Error ? error.message : 'Impossible de charger les activités.');
        }
        finally {
            if (!silent)
                setLoading(false);
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return _jsx(CheckCircle, { className: "w-5 h-5 text-green-600 dark:text-green-400" });
            case 'warning':
                return _jsx(AlertTriangle, { className: "w-5 h-5 text-orange-600 dark:text-orange-400" });
            case 'error':
                return _jsx(XCircle, { className: "w-5 h-5 text-red-600 dark:text-red-400" });
            default:
                return _jsx(Activity, { className: "w-5 h-5 text-gray-600 dark:text-gray-400" });
        }
    };
    const getStatusColor = (status) => {
        const colors = {
            success: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
            warning: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
            error: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
        };
        return colors[status] || 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    };
    const getActionColor = (action) => {
        if (action.includes('LOGIN'))
            return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
        if (action.includes('LOGOUT'))
            return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
        if (action.includes('FAILED'))
            return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
        if (action.includes('UPDATE'))
            return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
        if (action.includes('COMPUTE') || action.includes('SCORE'))
            return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    };
    const filteredActivities = activities.filter((activity) => {
        const matchesSearch = activity.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.details.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
        return matchesSearch && matchesStatus;
    });
    const stats = {
        total: activities.length,
        success: activities.filter((a) => a.status === 'success').length,
        warnings: activities.filter((a) => a.status === 'warning').length,
        errors: activities.filter((a) => a.status === 'error').length,
        uniqueUsers: new Set(activities.map((a) => a.user_id)).size,
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Chargement des activit\u00E9s..." })] }) }));
    }
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Surveillance des Activit\u00E9s" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mt-1", children: "Monitoring en temps r\u00E9el des actions utilisateurs" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("label", { className: "flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700", children: [_jsx("input", { type: "checkbox", checked: autoRefresh, onChange: (e) => setAutoRefresh(e.target.checked), className: "rounded" }), _jsx(RefreshCw, { className: `w-4 h-4 ${autoRefresh ? 'text-blue-600 dark:text-blue-400 animate-spin' : 'text-gray-600 dark:text-gray-400'}` }), _jsx("span", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: "Auto-refresh (30s)" })] }), _jsxs("button", { onClick: () => loadActivities(), className: "px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), "Actualiser"] })] })] }), error && (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300", children: [_jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }), _jsx("span", { className: "text-sm", children: error })] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-4", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-blue-600 dark:border-blue-400 border border-gray-200 dark:border-gray-700", children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-1", children: "Total Activit\u00E9s" }), _jsx("p", { className: "text-2xl font-bold text-blue-600 dark:text-blue-400", children: stats.total })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-green-600 dark:border-green-400 border border-gray-200 dark:border-gray-700", children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-1", children: "Succ\u00E8s" }), _jsx("p", { className: "text-2xl font-bold text-green-600 dark:text-green-400", children: stats.success })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-orange-600 dark:border-orange-400 border border-gray-200 dark:border-gray-700", children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-1", children: "Avertissements" }), _jsx("p", { className: "text-2xl font-bold text-orange-600 dark:text-orange-400", children: stats.warnings })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-red-600 dark:border-red-400 border border-gray-200 dark:border-gray-700", children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-1", children: "Erreurs" }), _jsx("p", { className: "text-2xl font-bold text-red-600 dark:text-red-400", children: stats.errors })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-purple-600 dark:border-purple-400 border border-gray-200 dark:border-gray-700", children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-1", children: "Utilisateurs actifs" }), _jsx("p", { className: "text-2xl font-bold text-purple-600 dark:text-purple-400", children: stats.uniqueUsers })] })] }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "flex gap-4 items-center", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx("input", { type: "text", placeholder: "Rechercher activit\u00E9s...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" })] }), _jsxs("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: "px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white", children: [_jsx("option", { value: "all", children: "Tous statuts" }), _jsx("option", { value: "success", children: "Succ\u00E8s" }), _jsx("option", { value: "warning", children: "Avertissement" }), _jsx("option", { value: "error", children: "Erreur" })] })] }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700", children: filteredActivities.length === 0 ? (_jsxs("div", { className: "p-12 text-center text-gray-500 dark:text-gray-400", children: [_jsx(Activity, { className: "w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" }), _jsx("p", { children: "Aucune activit\u00E9 trouv\u00E9e" })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase", children: "Horodatage" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase", children: "Utilisateur" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase", children: "Action" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase", children: "Statut" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase", children: "D\u00E9tails" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: filteredActivities.map((log) => (_jsxs("tr", { className: "hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors", children: [_jsx("td", { className: "px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap", children: new Date(log.timestamp).toLocaleString('fr-FR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: log.username }), log.region && (_jsx("span", { className: "text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400", children: log.region }))] }), _jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: ["ID: ", log.user_id] })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`, children: log.action.replace(/_/g, ' ') }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: `flex items-center gap-2 px-3 py-1 rounded-lg border ${getStatusColor(log.status)} w-fit`, children: [getStatusIcon(log.status), _jsx("span", { className: "text-sm font-medium capitalize", children: log.status })] }) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-md", children: _jsxs("div", { children: [_jsx("p", { children: log.details }), log.ip_address && (_jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-500 mt-1", children: ["IP: ", log.ip_address] }))] }) })] }, log.id))) })] }) })) }), filteredActivities.length > 0 && (_jsxs("div", { className: "text-center text-sm text-gray-600 dark:text-gray-400", children: ["Affichage de ", filteredActivities.length, " activit\u00E9(s) sur ", activities.length, " au total"] }))] }));
}
