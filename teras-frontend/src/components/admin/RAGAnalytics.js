import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// teras-frontend/src/components/admin/RAGAnalytics.tsx - AVEC FILTRES
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, FileText, Users, Clock, Download, RefreshCw, } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import RAGAnalyticsFilters from './RAGAnalyticsFilters';
import './RAGAnalytics.css';
export default function RAGAnalytics() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [dailyStats, setDailyStats] = useState([]);
    const [topQueries, setTopQueries] = useState([]);
    const [topDocuments, setTopDocuments] = useState([]);
    const [queriesByHour, setQueriesByHour] = useState([]);
    const [filters, setFilters] = useState({ days: 365 });
    useEffect(() => {
        loadAnalytics();
    }, []);
    const buildQueryString = (filterValues) => {
        const params = new URLSearchParams();
        Object.entries(filterValues).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, String(value));
            }
        });
        return params.toString();
    };
    const loadAnalytics = async (filterValues = filters) => {
        setLoading(true);
        try {
            setError(null);
            const queryString = buildQueryString(filterValues);
            const [overviewRes, queriesRes, docsRes] = await Promise.all([
                authFetch(`/api/ai/analytics/overview/?${queryString}`),
                authFetch(`/api/ai/analytics/queries/?${queryString}`),
                authFetch(`/api/ai/analytics/documents/?${queryString}`),
            ]);
            if (!overviewRes.ok)
                throw new Error(`Erreur overview RAG (${overviewRes.status})`);
            if (!queriesRes.ok)
                throw new Error(`Erreur requêtes RAG (${queriesRes.status})`);
            if (!docsRes.ok)
                throw new Error(`Erreur documents RAG (${docsRes.status})`);
            const overviewData = await overviewRes.json();
            setMetrics(overviewData.metrics);
            setDailyStats(overviewData.daily_stats || []);
            const queriesData = await queriesRes.json();
            setTopQueries(queriesData.top_queries || []);
            setQueriesByHour(queriesData.queries_by_hour || []);
            const docsData = await docsRes.json();
            setTopDocuments(docsData.top_documents || []);
        }
        catch (error) {
            console.error('Error loading analytics:', error);
            setError(error instanceof Error ? error.message : 'Impossible de charger les analytics RAG.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        loadAnalytics(newFilters);
    };
    const handleFilterReset = () => {
        const defaultFilters = { days: 365 };
        setFilters(defaultFilters);
        loadAnalytics(defaultFilters);
    };
    const exportData = async () => {
        try {
            const queryString = buildQueryString(filters);
            const res = await authFetch(`/api/ai/analytics/export/?${queryString}&format=json`);
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rag-analytics-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
        catch (error) {
            console.error('Error exporting data:', error);
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "rag-analytics-loading", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Chargement des analytics..." })] }));
    }
    return (_jsxs("div", { className: "rag-analytics-container", children: [_jsxs("div", { className: "analytics-header", children: [_jsxs("div", { children: [_jsxs("h1", { children: [_jsx(BarChart3, { size: 32, style: { color: '#667eea' } }), "Analytics RAG TERAS"] }), _jsx("p", { className: "subtitle", children: "Tableau de bord d'utilisation du Chat RAG avec filtres avanc\u00E9s" })] }), _jsxs("div", { className: "header-actions", children: [_jsx(RAGAnalyticsFilters, { onFilterChange: handleFilterChange, onReset: handleFilterReset }), _jsxs("button", { onClick: () => loadAnalytics(filters), className: "btn-refresh", children: [_jsx(RefreshCw, { size: 18 }), "Actualiser"] }), _jsxs("button", { onClick: exportData, className: "btn-export", children: [_jsx(Download, { size: 18 }), "Exporter"] })] })] }), error && (_jsx("div", { className: "empty-state", style: { marginBottom: '24px' }, children: _jsx("p", { children: error }) })), _jsxs("div", { className: "metrics-grid", children: [_jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon blue", children: _jsx(BarChart3, { size: 24 }) }), _jsxs("div", { className: "metric-content", children: [_jsx("p", { className: "metric-label", children: "Total Requ\u00EAtes" }), _jsx("h2", { className: "metric-value", children: metrics?.total_queries || 0 })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon green", children: _jsx(Clock, { size: 24 }) }), _jsxs("div", { className: "metric-content", children: [_jsx("p", { className: "metric-label", children: "Temps Moyen" }), _jsxs("h2", { className: "metric-value", children: [metrics?.avg_response_time_ms || 0, "ms"] })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon purple", children: _jsx(FileText, { size: 24 }) }), _jsxs("div", { className: "metric-content", children: [_jsx("p", { className: "metric-label", children: "Docs Utilis\u00E9s" }), _jsx("h2", { className: "metric-value", children: metrics?.avg_documents_used?.toFixed(1) || 0 })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon orange", children: _jsx(Users, { size: 24 }) }), _jsxs("div", { className: "metric-content", children: [_jsx("p", { className: "metric-label", children: "Utilisateurs Actifs" }), _jsx("h2", { className: "metric-value", children: metrics?.active_users || 0 })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon pink", children: _jsx(TrendingUp, { size: 24 }) }), _jsxs("div", { className: "metric-content", children: [_jsx("p", { className: "metric-label", children: "Tokens Utilis\u00E9s" }), _jsx("h2", { className: "metric-value", children: (metrics?.total_tokens || 0).toLocaleString() })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon emerald", children: _jsx(FileText, { size: 24 }) }), _jsxs("div", { className: "metric-content", children: [_jsx("p", { className: "metric-label", children: "Co\u00FBt Estim\u00E9" }), _jsxs("h2", { className: "metric-value", children: ["$", metrics?.estimated_cost_usd?.toFixed(2) || 0] })] })] })] }), _jsxs("div", { className: "charts-grid", children: [_jsxs("div", { className: "chart-card", children: [_jsx("h3", { children: "Activit\u00E9 Quotidienne" }), _jsx("div", { className: "chart-content", children: dailyStats.length > 0 ? (_jsx("div", { className: "bar-chart", children: dailyStats.map((stat, i) => {
                                        const maxCount = Math.max(...dailyStats.map(s => s.count), 1);
                                        const height = (stat.count / maxCount) * 100;
                                        return (_jsxs("div", { className: "bar-wrapper", children: [_jsx("div", { className: "bar", style: { height: `${height}%` }, title: `${stat.date}: ${stat.count} requêtes` }), _jsx("span", { className: "bar-label", children: new Date(stat.date).getDate() })] }, i));
                                    }) })) : (_jsx("div", { className: "empty-state", children: _jsx("p", { children: "Aucune donn\u00E9e disponible pour cette p\u00E9riode" }) })) })] }), _jsxs("div", { className: "chart-card", children: [_jsx("h3", { children: "Top Requ\u00EAtes" }), _jsx("div", { className: "list-content", children: topQueries.length > 0 ? (topQueries.slice(0, 8).map((item, i) => (_jsxs("div", { className: "list-item", children: [_jsxs("span", { className: "rank", children: ["#", i + 1] }), _jsx("span", { className: "query-text", children: item.query }), _jsx("span", { className: "count-badge", children: item.count })] }, i)))) : (_jsx("div", { className: "empty-state", children: _jsx("p", { children: "Aucune requ\u00EAte trouv\u00E9e" }) })) })] }), _jsxs("div", { className: "chart-card", children: [_jsx("h3", { children: "Documents Populaires" }), _jsx("div", { className: "list-content", children: topDocuments.length > 0 ? (topDocuments.slice(0, 8).map((item, i) => (_jsxs("div", { className: "list-item", children: [_jsxs("span", { className: "rank", children: ["#", i + 1] }), _jsx("span", { className: "doc-title", children: item.title }), _jsx("span", { className: "count-badge", children: item.count })] }, i)))) : (_jsx("div", { className: "empty-state", children: _jsx("p", { children: "Aucun document trouv\u00E9" }) })) })] }), _jsxs("div", { className: "chart-card", children: [_jsx("h3", { children: "R\u00E9partition Horaire" }), _jsx("div", { className: "chart-content", children: queriesByHour.some(count => count > 0) ? (_jsx("div", { className: "bar-chart horizontal", children: queriesByHour.map((count, hour) => {
                                        const maxCount = Math.max(...queriesByHour, 1);
                                        const width = (count / maxCount) * 100;
                                        return (_jsxs("div", { className: "bar-wrapper-horizontal", children: [_jsxs("span", { className: "hour-label", children: [hour, "h"] }), _jsx("div", { className: "bar-horizontal", style: { width: `${width}%` }, title: `${hour}h: ${count} requêtes` }), _jsx("span", { className: "count-text", children: count })] }, hour));
                                    }) })) : (_jsx("div", { className: "empty-state", children: _jsx("p", { children: "Aucune donn\u00E9e horaire disponible" }) })) })] })] })] }));
}
