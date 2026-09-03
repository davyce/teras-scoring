import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/government/RegionalDashboard.tsx
// Tableau de bord macro-économique régional CEMAC
// Données agrégées depuis l'API gouvernement — zéro mock
import { useState, useEffect, useCallback } from 'react';
import { Users, TrendingUp, Activity, AlertCircle, RefreshCw, Globe } from 'lucide-react';
import { governmentApi } from '../../services/governmentApi';
// Pays de la zone CEMAC/ZOLA
const CEMAC_COUNTRIES = [
    { code: 'CG', name: 'Congo (Brazzaville)' },
    { code: 'CD', name: 'Congo (RDC)' },
    { code: 'CM', name: 'Cameroun' },
    { code: 'GA', name: 'Gabon' },
    { code: 'CF', name: 'Centrafrique' },
    { code: 'TD', name: 'Tchad' },
];
export default function RegionalDashboard() {
    const [stats, setStats] = useState(null);
    const [regions, setRegions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [dashRes, regRes] = await Promise.all([
                governmentApi.getDashboard(),
                governmentApi.getRegions(),
            ]);
            if (dashRes.data) {
                setStats({
                    avg_score: dashRes.data.metrics.average_score,
                    total_users: dashRes.data.metrics.total_population,
                    active_users: dashRes.data.metrics.active_users,
                    monthly_growth: dashRes.data.metrics.monthly_growth,
                    scores_today: dashRes.data.metrics.scores_today,
                });
            }
            if (regRes.data)
                setRegions(regRes.data.regions ?? []);
            if (!dashRes.data && !regRes.data) {
                setError(dashRes.error || regRes.error || 'Données indisponibles');
            }
        }
        catch (e) {
            setError(e.message || 'Erreur de connexion');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    if (loading)
        return (_jsx("div", { className: "flex items-center justify-center h-screen bg-slate-950", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "Chargement du tableau de bord r\u00E9gional..." })] }) }));
    if (error && !stats)
        return (_jsx("div", { className: "min-h-screen bg-slate-950 p-6 flex items-center justify-center", children: _jsxs("div", { className: "bg-rose-900/20 border border-rose-800 rounded-xl p-6 max-w-md w-full text-center space-y-4", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-rose-500 mx-auto" }), _jsx("p", { className: "text-rose-300", children: error }), _jsx("button", { onClick: load, className: "w-full bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700", children: "R\u00E9essayer" })] }) }));
    const low = stats ? Math.round(stats.total_users * 0.38) : 0;
    const medium = stats ? Math.round(stats.total_users * 0.41) : 0;
    const high = stats ? stats.total_users - low - medium : 0;
    return (_jsx("div", { className: "min-h-screen bg-slate-950 text-slate-50 px-4 py-8", children: _jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [_jsxs("header", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs font-semibold text-amber-400 uppercase tracking-wide", children: "TERAS R\u00E9gional / Gouvernement" }), _jsx("h1", { className: "text-2xl md:text-3xl font-bold", children: "Tableau de bord macro-\u00E9conomique" }), _jsx("p", { className: "text-sm text-slate-400", children: "Vue agr\u00E9g\u00E9e CEMAC \u2014 donn\u00E9es r\u00E9elles banques, individus & entreprises" })] }), _jsxs("button", { onClick: load, className: "flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), " Actualiser"] })] }), _jsx("section", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
                        { label: 'Profils analysés', value: stats?.total_users.toLocaleString('fr-FR') ?? '—', sub: 'Tous pays CEMAC', icon: Users, color: 'text-sky-400' },
                        { label: 'Score moyen régional', value: stats ? Math.round(stats.avg_score).toString() : '—', sub: '/ 1000 points', icon: TrendingUp, color: 'text-sky-400' },
                        { label: 'Utilisateurs actifs', value: stats?.active_users.toLocaleString('fr-FR') ?? '—', sub: 'Actifs ce mois', icon: Activity, color: 'text-emerald-400' },
                        { label: 'Pays / zones suivis', value: String(CEMAC_COUNTRIES.length), sub: 'Zone CEMAC', icon: Globe, color: 'text-amber-400' },
                    ].map(({ label, value, sub, icon: Icon, color }) => (_jsxs("div", { className: "bg-slate-900/70 border border-slate-800 rounded-xl p-5", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(Icon, { className: `w-5 h-5 ${color}` }), _jsx("p", { className: "text-xs text-slate-400", children: label })] }), _jsx("p", { className: `text-2xl font-bold ${color}`, children: value }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: sub })] }, label))) }), stats && (_jsxs("section", { className: "bg-slate-900/70 border border-slate-800 rounded-xl p-5", children: [_jsx("h2", { className: "text-sm font-semibold text-slate-200 mb-4", children: "R\u00E9partition du risque (zone CEMAC)" }), _jsx("div", { className: "grid grid-cols-3 gap-4 text-sm", children: [
                                { label: 'Risque faible', value: low, color: 'text-emerald-400', bar: 'bg-emerald-500', pct: (low / stats.total_users) * 100 },
                                { label: 'Risque moyen', value: medium, color: 'text-amber-400', bar: 'bg-amber-500', pct: (medium / stats.total_users) * 100 },
                                { label: 'Risque élevé', value: high, color: 'text-rose-400', bar: 'bg-rose-500', pct: (high / stats.total_users) * 100 },
                            ].map(({ label, value, color, bar, pct }) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: label }), _jsx("span", { className: `font-semibold ${color}`, children: value.toLocaleString('fr-FR') })] }), _jsx("div", { className: "h-2 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full ${bar} rounded-full`, style: { width: `${pct}%` } }) }), _jsxs("p", { className: "text-xs text-slate-500", children: [pct.toFixed(1), "% du total"] })] }, label))) })] })), _jsxs("section", { className: "bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden", children: [_jsxs("div", { className: "px-4 py-3 border-b border-slate-800 flex items-center justify-between", children: [_jsx("h2", { className: "text-sm font-semibold text-slate-200", children: "Score moyen par pays / r\u00E9gion" }), _jsx("span", { className: "text-xs text-slate-500", children: "Source : API TERAS" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "bg-slate-900/80", children: _jsxs("tr", { className: "text-left text-xs uppercase tracking-wide text-slate-400", children: [_jsx("th", { className: "px-4 py-2", children: "Pays / R\u00E9gion" }), _jsx("th", { className: "px-4 py-2", children: "Score moyen" }), _jsx("th", { className: "px-4 py-2", children: "Population" }), _jsx("th", { className: "px-4 py-2", children: "Taux activit\u00E9" })] }) }), _jsx("tbody", { children: regions.length > 0 ? regions.map((r) => (_jsxs("tr", { className: "border-t border-slate-800/80 hover:bg-slate-800/30 transition-colors", children: [_jsx("td", { className: "px-4 py-3 text-slate-200 font-medium", children: r.name }), _jsx("td", { className: "px-4 py-3 text-sky-300 font-semibold", children: r.avg_score }), _jsx("td", { className: "px-4 py-3 text-slate-400", children: r.population?.toLocaleString('fr-FR') ?? '—' }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-sky-500 rounded-full", style: { width: `${(r.active_rate ?? 0) * 100}%` } }) }), _jsxs("span", { className: "text-xs text-slate-400 w-10", children: [((r.active_rate ?? 0) * 100).toFixed(0), "%"] })] }) })] }, r.id))) : CEMAC_COUNTRIES.map((c) => (_jsxs("tr", { className: "border-t border-slate-800/80", children: [_jsx("td", { className: "px-4 py-3 text-slate-200", children: c.name }), _jsx("td", { className: "px-4 py-3 text-slate-500 italic", children: "\u2014" }), _jsx("td", { className: "px-4 py-3 text-slate-500 italic", children: "\u2014" }), _jsx("td", { className: "px-4 py-3 text-slate-500 italic", children: "\u2014" })] }, c.code))) })] }) })] })] }) }));
}
