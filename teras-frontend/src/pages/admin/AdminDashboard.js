import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// AdminDashboard.tsx - VERSION CONNECTÉE API CONGO
import { useState, useEffect } from 'react';
import { Users, UserCheck, Clock, AlertCircle, Activity, ArrowUp, ArrowDown, BarChart3, UserX, Building2, TrendingUp, Shield, } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        loadDashboard();
        const interval = setInterval(loadDashboard, 30000); // Refresh toutes les 30s
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const loadDashboard = async () => {
        try {
            setError(null);
            const response = await authFetch('/api/scoring/admin/dashboard/');
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload?.detail || payload?.error || `Erreur ${response.status}`);
            }
            setData(payload);
        }
        catch (err) {
            setError(err?.message || 'Erreur réseau');
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Chargement du tableau de bord..." })] }) }));
    }
    if (error || !data) {
        return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md mx-auto", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-red-900 dark:text-red-200 mb-2 text-center", children: "Erreur" }), _jsx("p", { className: "text-red-700 dark:text-red-300 mb-4 text-center", children: error || 'Aucune donnée' }), _jsx("button", { onClick: loadDashboard, className: "w-full bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors", children: "R\u00E9essayer" })] }) }));
    }
    // ✅ SAFEGUARDS: évite les crashs si l'API renvoie des champs manquants
    const metrics = data?.metrics ?? {};
    const regionsStats = data?.regions_stats && typeof data.regions_stats === 'object' ? data.regions_stats : {};
    const sectorsStats = data?.sectors_stats && typeof data.sectors_stats === 'object' ? data.sectors_stats : {};
    const riskDistribution = data?.risk_distribution ?? { low: 0, medium: 0, high: 0 };
    const systemHealth = data?.system_health ?? {};
    const recentActivities = Array.isArray(data?.recent_activities) ? data.recent_activities : [];
    const fraudAlertsRecent = Array.isArray(data?.fraud_alerts_recent) ? data.fraud_alerts_recent : [];
    const topRegion = Object.entries(regionsStats).sort((a, b) => Number(b?.[1]?.count ?? 0) - Number(a?.[1]?.count ?? 0))[0];
    const topSector = Object.entries(sectorsStats).sort((a, b) => Number(b?.[1] ?? 0) - Number(a?.[1] ?? 0))[0];
    const kycBacklogRate = Number(metrics.total_users ?? 0) > 0
        ? Math.round((Number(metrics.kyc_pending ?? 0) / Number(metrics.total_users ?? 1)) * 100)
        : 0;
    const kpiCards = [
        {
            title: 'Utilisateurs Totaux',
            value: metrics.total_users,
            icon: Users,
            lightBg: 'bg-blue-50 dark:bg-blue-900/20',
            textColor: 'text-blue-600 dark:text-blue-400',
            borderColor: 'border-blue-200 dark:border-blue-800',
        },
        {
            title: 'Utilisateurs Actifs',
            value: metrics.active_users,
            icon: UserCheck,
            lightBg: 'bg-green-50 dark:bg-green-900/20',
            textColor: 'text-green-600 dark:text-green-400',
            borderColor: 'border-green-200 dark:border-green-800',
        },
        {
            title: 'En attente KYC',
            value: metrics.kyc_pending,
            icon: Clock,
            lightBg: 'bg-orange-50 dark:bg-orange-900/20',
            textColor: 'text-orange-600 dark:text-orange-400',
            borderColor: 'border-orange-200 dark:border-orange-800',
        },
        {
            title: 'Suspendus',
            value: metrics.suspended_users,
            icon: UserX,
            lightBg: 'bg-red-50 dark:bg-red-900/20',
            textColor: 'text-red-600 dark:text-red-400',
            borderColor: 'border-red-200 dark:border-red-800',
        },
        {
            title: 'Entreprises',
            value: metrics.enterprise_users,
            icon: Building2,
            lightBg: 'bg-purple-50 dark:bg-purple-900/20',
            textColor: 'text-purple-600 dark:text-purple-400',
            borderColor: 'border-purple-200 dark:border-purple-800',
        },
        {
            title: 'Nouveaux (7j)',
            value: metrics.new_users_week,
            icon: TrendingUp,
            lightBg: 'bg-indigo-50 dark:bg-indigo-900/20',
            textColor: 'text-indigo-600 dark:text-indigo-400',
            borderColor: 'border-indigo-200 dark:border-indigo-800',
        },
        {
            title: 'Score Moyen',
            value: Math.round(Number(metrics.avg_score ?? 0)),
            icon: BarChart3,
            lightBg: 'bg-cyan-50 dark:bg-cyan-900/20',
            textColor: 'text-cyan-600 dark:text-cyan-400',
            borderColor: 'border-cyan-200 dark:border-cyan-800',
        },
        {
            title: 'Tendance',
            value: metrics.score_trend ?? 0,
            icon: (metrics.score_trend ?? 0) >= 0 ? ArrowUp : ArrowDown,
            lightBg: (metrics.score_trend ?? 0) >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20',
            textColor: (metrics.score_trend ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
            borderColor: (metrics.score_trend ?? 0) >= 0 ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800',
        },
    ];
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Dashboard Admin \uD83C\uDDE8\uD83C\uDDEC" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mt-1", children: "Vue d'ensemble TERAS Congo-Brazzaville" })] }), _jsx("button", { onClick: loadDashboard, className: "px-6 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium shadow-sm", children: "Actualiser" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: kpiCards.map((kpi, index) => {
                    const Icon = kpi.icon;
                    const val = Number(kpi.value ?? 0);
                    return (_jsxs("div", { className: `bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 ${kpi.borderColor} border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all`, children: [_jsx("div", { className: "flex items-center justify-between mb-3", children: _jsx("div", { className: `p-2.5 rounded-lg ${kpi.lightBg}`, children: _jsx(Icon, { className: `w-5 h-5 ${kpi.textColor}` }) }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-1", children: kpi.title }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: Number.isFinite(val) ? val.toLocaleString() : '0' })] })] }, index));
                }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: [_jsxs("h2", { className: "text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [_jsx(Users, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }), "Utilisateurs par R\u00E9gion"] }), Object.keys(regionsStats).length === 0 ? (_jsx("div", { className: "text-center py-10 text-gray-500 dark:text-gray-400", children: _jsx("p", { children: "Aucune donn\u00E9e r\u00E9gion" }) })) : (_jsx("div", { className: "space-y-3", children: Object.entries(regionsStats).slice(0, 5).map(([region, stats]) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: region }), _jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: [Number(stats?.active ?? 0), " actifs / ", Number(stats?.count ?? 0), " total"] })] }), _jsx("div", { className: "text-right", children: _jsx("p", { className: "text-lg font-bold text-blue-600 dark:text-blue-400", children: Number(stats?.count ?? 0) }) })] }, region))) }))] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: [_jsxs("h2", { className: "text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [_jsx(Building2, { className: "w-5 h-5 text-green-600 dark:text-green-400" }), "Utilisateurs par Secteur"] }), Object.keys(sectorsStats).length === 0 ? (_jsx("div", { className: "text-center py-10 text-gray-500 dark:text-gray-400", children: _jsx("p", { children: "Aucune donn\u00E9e secteur" }) })) : (_jsx("div", { className: "space-y-3", children: Object.entries(sectorsStats).slice(0, 5).map(([sector, count]) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg", children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: sector }), _jsx("p", { className: "text-lg font-bold text-green-600 dark:text-green-400", children: Number(count ?? 0) })] }, sector))) }))] })] }), _jsx("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
                    {
                        title: 'Zone la plus couverte',
                        value: topRegion?.[0] || '—',
                        detail: `${Number(topRegion?.[1]?.count ?? 0)} utilisateurs suivis`,
                        tone: 'text-blue-600 dark:text-blue-400',
                    },
                    {
                        title: 'Secteur le plus représenté',
                        value: topSector?.[0] || '—',
                        detail: `${Number(topSector?.[1] ?? 0)} comptes qualifiés`,
                        tone: 'text-green-600 dark:text-green-400',
                    },
                    {
                        title: 'Backlog KYC',
                        value: `${kycBacklogRate}%`,
                        detail: `${Number(metrics.kyc_pending ?? 0)} dossier(s) à traiter`,
                        tone: 'text-orange-600 dark:text-orange-400',
                    },
                ].map((item) => (_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: item.title }), _jsx("p", { className: `text-2xl font-bold mt-2 ${item.tone}`, children: item.value }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mt-2", children: item.detail })] }, item.title))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: [_jsxs("h2", { className: "text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [_jsx(Shield, { className: "w-5 h-5 text-orange-600 dark:text-orange-400" }), "Distribution des Risques"] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { className: "text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800", children: [_jsx("p", { className: "text-3xl font-bold text-green-600 dark:text-green-400", children: Number(riskDistribution.low ?? 0) }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: "Risque Faible" })] }), _jsxs("div", { className: "text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800", children: [_jsx("p", { className: "text-3xl font-bold text-orange-600 dark:text-orange-400", children: Number(riskDistribution.medium ?? 0) }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: "Risque Moyen" })] }), _jsxs("div", { className: "text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800", children: [_jsx("p", { className: "text-3xl font-bold text-red-600 dark:text-red-400", children: Number(riskDistribution.high ?? 0) }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: "Risque \u00C9lev\u00E9" })] })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: [_jsxs("h2", { className: "text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [_jsx(Activity, { className: "w-5 h-5 text-purple-600 dark:text-purple-400" }), "Sant\u00E9 du Syst\u00E8me"] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg", children: [_jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: "API Status" }), _jsx("p", { className: "text-lg font-bold text-green-600 dark:text-green-400 capitalize", children: String(systemHealth.api_status ?? 'unknown') })] }), _jsxs("div", { className: "p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg", children: [_jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: "Uptime" }), _jsxs("p", { className: "text-lg font-bold text-gray-900 dark:text-white", children: [Number(systemHealth.uptime_percentage ?? 0), "%"] })] }), _jsxs("div", { className: "p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg", children: [_jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: "Temps R\u00E9ponse" }), _jsxs("p", { className: "text-lg font-bold text-gray-900 dark:text-white", children: [Number(systemHealth.response_time_avg ?? 0), "ms"] })] }), _jsxs("div", { className: "p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg", children: [_jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: "Connexions" }), _jsx("p", { className: "text-lg font-bold text-gray-900 dark:text-white", children: Number(systemHealth.active_connections ?? 0) })] })] })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 dark:text-white", children: "Activit\u00E9s R\u00E9centes" }), _jsx(Activity, { className: "w-5 h-5 text-gray-400 dark:text-gray-500" })] }), recentActivities.length === 0 ? (_jsxs("div", { className: "text-center py-12 text-gray-500 dark:text-gray-400", children: [_jsx(Activity, { className: "w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" }), _jsx("p", { children: "Aucune activit\u00E9 r\u00E9cente" })] })) : (_jsx("div", { className: "space-y-3", children: recentActivities.slice(0, 5).map((activity) => (_jsxs("div", { className: "flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-gray-100 dark:border-gray-700", children: [_jsx("div", { className: `w-2 h-2 rounded-full flex-shrink-0 ${activity?.status === 'success'
                                        ? 'bg-green-500 dark:bg-green-400'
                                        : activity?.status === 'warning'
                                            ? 'bg-orange-500 dark:bg-orange-400'
                                            : 'bg-red-500 dark:bg-red-400'}` }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white truncate", children: activity?.username ?? 'Utilisateur' }), activity?.region && (_jsx("span", { className: "text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded", children: activity.region }))] }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 truncate", children: activity?.details ?? '' }), activity?.ip_address && (_jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-500 mt-1", children: ["IP: ", activity.ip_address] }))] }), _jsx("div", { className: "text-sm text-gray-500 dark:text-gray-400 text-right flex-shrink-0", children: activity?.timestamp ?? '' })] }, activity?.id ?? `${activity?.username ?? 'u'}-${activity?.timestamp ?? Math.random()}`))) }))] }), fraudAlertsRecent.length > 0 && (_jsxs("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(AlertCircle, { className: "w-6 h-6 text-red-600 dark:text-red-400" }), _jsxs("h2", { className: "text-xl font-bold text-red-900 dark:text-red-200", children: ["Alertes Fraude R\u00E9centes (", fraudAlertsRecent.length, ")"] })] }), _jsx("div", { className: "space-y-3", children: fraudAlertsRecent.map((alert) => (_jsxs("div", { className: "bg-white dark:bg-gray-800 p-4 rounded-lg border border-red-200 dark:border-red-800", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: alert?.username ?? 'Utilisateur' }), _jsx("span", { className: `px-2 py-0.5 rounded text-xs font-medium ${alert?.severity === 'critical'
                                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`, children: String(alert?.severity ?? 'unknown') })] }), _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: alert?.detected_at ?? '' })] }), _jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300 mb-2", children: alert?.description ?? '' }), _jsxs("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: ["Action: ", alert?.auto_action ?? ''] })] }, alert?.id ?? `${alert?.username ?? 'u'}-${alert?.detected_at ?? Math.random()}`))) })] }))] }));
}
