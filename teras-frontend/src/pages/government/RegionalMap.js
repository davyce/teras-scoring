import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/government/RegionalMap.tsx
// Cartographie des scores CEMAC — données réelles via API gouvernement
import { useState, useEffect, useCallback } from 'react';
import { MapPin, AlertCircle, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { governmentApi } from '../../services/governmentApi';
const SCORE_COLOR = (score) => {
    if (score >= 700)
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', bar: 'bg-emerald-500', label: '> 700 — Excellent' };
    if (score >= 600)
        return { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/40', bar: 'bg-sky-500', label: '600-700 — Bon' };
    if (score >= 500)
        return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', bar: 'bg-amber-500', label: '500-600 — Moyen' };
    return { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40', bar: 'bg-rose-500', label: '< 500 — Faible' };
};
const LEGEND = [
    { label: 'Score > 700', color: '#22c55e' },
    { label: 'Score 600–700', color: '#38bdf8' },
    { label: 'Score 500–600', color: '#facc15' },
    { label: 'Score < 500', color: '#f97316' },
];
export default function RegionalMap() {
    const [regions, setRegions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('month');
    const [selected, setSelected] = useState(null);
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await governmentApi.getRegions();
            if (res.data)
                setRegions(res.data.regions ?? []);
            else
                setError(res.error || 'Données indisponibles');
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    if (loading)
        return (_jsx("div", { className: "flex items-center justify-center h-screen bg-slate-950", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "Chargement de la cartographie..." })] }) }));
    if (error && regions.length === 0)
        return (_jsx("div", { className: "min-h-screen bg-slate-950 p-6 flex items-center justify-center", children: _jsxs("div", { className: "bg-rose-900/20 border border-rose-800 rounded-xl p-6 max-w-md w-full text-center space-y-4", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-rose-500 mx-auto" }), _jsx("p", { className: "text-rose-300", children: error }), _jsx("button", { onClick: load, className: "w-full bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700", children: "R\u00E9essayer" })] }) }));
    const maxPop = Math.max(...regions.map(r => r.population ?? 1), 1);
    return (_jsx("div", { className: "min-h-screen bg-slate-950 text-slate-50 px-4 py-8", children: _jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [_jsxs("header", { className: "flex items-center justify-between flex-wrap gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs font-semibold text-amber-400 uppercase tracking-wide", children: "TERAS R\u00E9gional" }), _jsx("h1", { className: "text-2xl md:text-3xl font-bold", children: "Cartographie des scores" }), _jsxs("p", { className: "text-sm text-slate-400", children: [regions.length, " r\u00E9gion(s) \u2014 donn\u00E9es r\u00E9elles TERAS"] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("select", { value: period, onChange: e => setPeriod(e.target.value), className: "rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:border-sky-500", children: [_jsx("option", { value: "month", children: "Dernier mois" }), _jsx("option", { value: "quarter", children: "3 derniers mois" }), _jsx("option", { value: "year", children: "12 derniers mois" })] }), _jsx("button", { onClick: load, className: "flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors", children: _jsx(RefreshCw, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6", children: [_jsxs("div", { className: "bg-slate-900/80 border border-slate-800 rounded-xl p-4", children: [_jsx("h2", { className: "text-sm font-semibold text-slate-300 mb-4", children: "Zones par score TERAS" }), regions.length === 0 ? (_jsx("div", { className: "flex items-center justify-center h-48 text-slate-500 text-sm", children: "Aucune donn\u00E9e r\u00E9gionale disponible." })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: regions.map((r) => {
                                        const col = SCORE_COLOR(r.avg_score);
                                        const isSelected = selected?.id === r.id;
                                        return (_jsxs("button", { onClick: () => setSelected(isSelected ? null : r), className: `text-left p-4 rounded-xl border transition-all ${col.bg} ${col.border} ${isSelected ? 'ring-2 ring-sky-400 scale-[1.02]' : 'hover:scale-[1.01]'}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(MapPin, { className: `w-4 h-4 ${col.text}` }), _jsx("span", { className: "font-semibold text-slate-100 text-sm", children: r.name })] }), _jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-xs text-slate-400", children: "Score TERAS" }), _jsx("span", { className: `text-lg font-bold ${col.text}`, children: r.avg_score })] }), _jsx("div", { className: "h-1.5 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full ${col.bar} rounded-full`, style: { width: `${(r.avg_score / 1000) * 100}%` } }) }), r.population && (_jsxs("div", { className: "flex items-center gap-1 mt-2", children: [_jsx(Users, { className: "w-3 h-3 text-slate-500" }), _jsx("span", { className: "text-xs text-slate-500", children: r.population.toLocaleString('fr-FR') }), _jsx("div", { className: "flex-1 h-1 bg-slate-800 rounded-full ml-1 overflow-hidden", children: _jsx("div", { className: "h-full bg-slate-600 rounded-full", style: { width: `${(r.population / maxPop) * 100}%` } }) })] }))] }, r.id));
                                    }) }))] }), _jsxs("div", { className: "space-y-4", children: [selected && (_jsxs("div", { className: "bg-slate-900/80 border border-sky-500/30 rounded-xl p-5 space-y-3", children: [_jsxs("h3", { className: "font-semibold text-white flex items-center gap-2", children: [_jsx(MapPin, { className: "w-4 h-4 text-sky-400" }), " ", selected.name] }), [
                                            { label: 'Score moyen', value: selected.avg_score, color: 'text-sky-400' },
                                            { label: 'Population', value: selected.population?.toLocaleString('fr-FR'), color: 'text-slate-200' },
                                            { label: 'Taux d\'activité', value: `${((selected.active_rate ?? 0) * 100).toFixed(1)}%`, color: 'text-emerald-400' },
                                        ].map(({ label, value, color }) => (_jsxs("div", { className: "flex justify-between text-sm border-t border-slate-800 pt-2", children: [_jsx("span", { className: "text-slate-400", children: label }), _jsx("span", { className: `font-semibold ${color}`, children: value ?? '—' })] }, label))), _jsx("button", { onClick: () => setSelected(null), className: "w-full text-xs text-slate-500 hover:text-slate-300 pt-1", children: "Fermer" })] })), _jsxs("div", { className: "bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold text-slate-200", children: "L\u00E9gende des zones" }), _jsx("ul", { className: "space-y-2 text-sm", children: LEGEND.map((item) => (_jsxs("li", { className: "flex items-center gap-3", children: [_jsx("span", { className: "w-4 h-4 rounded-sm border border-slate-700 shrink-0", style: { backgroundColor: item.color } }), _jsx("span", { className: "text-slate-300", children: item.label })] }, item.label))) }), _jsx("p", { className: "text-xs text-slate-500 pt-2 border-t border-slate-800", children: "Cliquez sur une zone pour voir le d\u00E9tail. Une carte SVG interactive sera int\u00E9gr\u00E9e en V2." })] }), regions.length > 0 && (_jsxs("div", { className: "bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2", children: [_jsxs("h2", { className: "text-sm font-semibold text-slate-200 flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-4 h-4 text-amber-400" }), " Synth\u00E8se CEMAC"] }), [
                                            { label: 'Score max', value: Math.max(...regions.map(r => r.avg_score)), color: 'text-emerald-400' },
                                            { label: 'Score min', value: Math.min(...regions.map(r => r.avg_score)), color: 'text-rose-400' },
                                            { label: 'Score moyen', value: Math.round(regions.reduce((s, r) => s + r.avg_score, 0) / regions.length), color: 'text-sky-400' },
                                            { label: 'Régions', value: regions.length, color: 'text-slate-200' },
                                        ].map(({ label, value, color }) => (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-slate-400", children: label }), _jsx("span", { className: `font-semibold ${color}`, children: value })] }, label)))] }))] })] })] }) }));
}
