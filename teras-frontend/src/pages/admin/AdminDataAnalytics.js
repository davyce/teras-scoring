import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { adminApi } from '../../services/adminApi';
import { useState, useEffect } from 'react';
import { TrendingUp, Users, Activity, BarChart3, Download, AlertCircle, } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, } from 'recharts';
export default function AdminDataAnalytics() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        loadAnalytics();
    }, []);
    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminApi.getAnalytics();
            if (!response.data)
                throw new Error(response.error || 'Erreur analytics');
            const d = response.data;
            const normalizedKpis = {
                total_users: d.kpis?.total_users ?? d.summary?.total_users ?? d.total_users ?? 0,
                active_users: d.kpis?.active_users ?? d.summary?.active_users ?? d.active_users ?? 0,
                avg_score: d.kpis?.avg_score ?? d.summary?.avg_score ?? d.avg_score ?? 0,
                recent_scores: d.kpis?.recent_scores ?? d.summary?.total_scores ?? d.recent_scores ?? 0,
                suspended_users: d.kpis?.suspended_users ?? d.summary?.suspended_users ?? d.suspended_users ?? 0,
                kyc_completion_rate: d.kpis?.kyc_completion_rate ?? d.summary?.kyc_completion_rate ?? 0,
            };
            setAnalytics({
                kpis: normalizedKpis,
                score_distribution: d.score_distribution ?? {},
                recent_registrations: d.recent_registrations ?? d.score_evolution?.map((item) => ({
                    date: item.date,
                    count: item.new_users ?? 0,
                })) ?? [],
                users_by_type: d.users_by_type ?? [],
                regions: d.regions ?? [],
                sectors: d.sectors ?? [],
            });
        }
        catch (err) {
            setError(err.message || 'Erreur de connexion');
        }
        finally {
            setLoading(false);
        }
    };
    const exportCsv = () => {
        if (!analytics)
            return;
        const rows = [
            ['metrique', 'valeur'],
            ['total_users', analytics.kpis.total_users],
            ['active_users', analytics.kpis.active_users],
            ['avg_score', analytics.kpis.avg_score],
            ['recent_scores', analytics.kpis.recent_scores],
            ['suspended_users', analytics.kpis.suspended_users],
            ['kyc_completion_rate', analytics.kpis.kyc_completion_rate ?? 0],
            [],
            ['distribution_score', 'count'],
            ...Object.entries(analytics.score_distribution).map(([band, count]) => [band, count]),
            [],
            ['date_inscription', 'count'],
            ...(analytics.recent_registrations ?? []).map((item) => [item.date, item.count]),
            [],
            ['type_utilisateur', 'count'],
            ...(analytics.users_by_type ?? []).map((item) => [item.user_type, item.count]),
        ];
        const csv = rows
            .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(';'))
            .join('\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `admin-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Chargement des analytics..." })] }) }));
    }
    if (error || !analytics) {
        return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-red-900 dark:text-red-200 mb-2 text-center", children: "Erreur" }), _jsx("p", { className: "text-red-700 dark:text-red-300 mb-4 text-center", children: error }), _jsx("button", { onClick: loadAnalytics, className: "w-full bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600", children: "R\u00E9essayer" })] }) }));
    }
    const scoreDistributionData = Object.entries(analytics.score_distribution ?? analytics.kpis?.score_distribution ?? {}).map(([range, count]) => ({
        range,
        count,
    }));
    const registrationsData = (analytics.recent_registrations ?? []).map((reg) => ({
        date: new Date(reg.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        count: reg.count,
    }));
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Analytics & Donn\u00E9es" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mt-1", children: "Statistiques d\u00E9taill\u00E9es du syst\u00E8me" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: loadAnalytics, className: "px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600", children: "Actualiser" }), _jsxs("button", { onClick: exportCsv, className: "flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300", children: [_jsx(Download, { className: "w-4 h-4" }), "Exporter CSV"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [_jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(Users, { className: "w-8 h-8 text-blue-600 dark:text-blue-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Total Utilisateurs" }), _jsx("p", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: (analytics.kpis?.total_users ?? analytics.total_users ?? 0).toLocaleString() })] })] }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(Activity, { className: "w-8 h-8 text-green-600 dark:text-green-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Utilisateurs Actifs" }), _jsx("p", { className: "text-3xl font-bold text-green-600 dark:text-green-400", children: (analytics.kpis?.active_users ?? analytics.active_users ?? 0).toLocaleString() })] })] }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(TrendingUp, { className: "w-8 h-8 text-purple-600 dark:text-purple-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Score Moyen" }), _jsx("p", { className: "text-3xl font-bold text-purple-600 dark:text-purple-400", children: (analytics.kpis?.avg_score ?? analytics.avg_score ?? 0).toFixed(0) })] })] }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(BarChart3, { className: "w-8 h-8 text-orange-600 dark:text-orange-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Scores R\u00E9cents" }), _jsx("p", { className: "text-3xl font-bold text-orange-600 dark:text-orange-400", children: (analytics.kpis?.recent_scores ?? 0).toLocaleString() })] })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Distribution des Scores TERAS" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: scoreDistributionData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#374151" }), _jsx(XAxis, { dataKey: "range", stroke: "#9ca3af" }), _jsx(YAxis, { stroke: "#9ca3af" }), _jsx(Tooltip, { contentStyle: {
                                                backgroundColor: '#1f2937',
                                                border: '1px solid #374151',
                                                borderRadius: '8px',
                                                color: '#fff',
                                            } }), _jsx(Bar, { dataKey: "count", fill: "#3b82f6" })] }) })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Nouvelles Inscriptions (7 derniers jours)" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: registrationsData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#374151" }), _jsx(XAxis, { dataKey: "date", stroke: "#9ca3af" }), _jsx(YAxis, { stroke: "#9ca3af" }), _jsx(Tooltip, { contentStyle: {
                                                backgroundColor: '#1f2937',
                                                border: '1px solid #374151',
                                                borderRadius: '8px',
                                                color: '#fff',
                                            } }), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "count", stroke: "#10b981", strokeWidth: 2, name: "Inscriptions" })] }) })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Utilisateurs par Type" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: (analytics.users_by_type ?? []).map((type, index) => (_jsxs("div", { className: "p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow", children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-1", children: type.user_type === 'individual'
                                        ? 'Individus'
                                        : type.user_type === 'enterprise'
                                            ? 'Entreprises'
                                            : type.user_type === 'admin'
                                                ? 'Administrateurs'
                                                : type.user_type }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: type.count }), _jsx("div", { className: "mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 dark:bg-blue-500 h-2 rounded-full", style: {
                                            width: `${(type.count / Math.max(analytics.kpis.total_users || 0, 1)) * 100}%`,
                                        } }) }), _jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: [((type.count / Math.max(analytics.kpis.total_users || 0, 1)) * 100).toFixed(1), "%"] })] }, index))) })] })] }));
}
