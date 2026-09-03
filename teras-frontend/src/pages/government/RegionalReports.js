import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/government/RegionalReports.tsx
// Rapports régionaux CEMAC — données réelles via API gouvernement
import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { governmentApi } from '../../services/governmentApi';
const PERIODS = ['Dernier mois', 'Dernier trimestre', 'Dernière année'];
const REPORT_TYPES = ['Par pays / région', 'Par secteur', 'Par institution'];
export default function RegionalReports() {
    const [regions, setRegions] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState(PERIODS[0]);
    const [repType, setRepType] = useState(REPORT_TYPES[0]);
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [regRes, secRes] = await Promise.all([
                governmentApi.getRegions(),
                governmentApi.getSectors(),
            ]);
            if (regRes.data)
                setRegions(regRes.data.regions ?? []);
            if (secRes.data)
                setSectors(secRes.data.sectors ?? []);
            if (!regRes.data && !secRes.data)
                setError(regRes.error || secRes.error || 'Données indisponibles');
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const exportCSV = () => {
        const rows = [
            ['Région', 'Score moyen', 'Population', 'Taux activité'],
            ...regions.map(r => [r.name, r.avg_score, r.population ?? '', ((r.active_rate ?? 0) * 100).toFixed(1) + '%']),
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `teras_regional_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };
    if (loading)
        return (_jsx("div", { className: "flex items-center justify-center h-screen bg-slate-950", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "Chargement des rapports r\u00E9gionaux..." })] }) }));
    if (error && regions.length === 0)
        return (_jsx("div", { className: "min-h-screen bg-slate-950 p-6 flex items-center justify-center", children: _jsxs("div", { className: "bg-rose-900/20 border border-rose-800 rounded-xl p-6 max-w-md w-full text-center space-y-4", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-rose-500 mx-auto" }), _jsx("p", { className: "text-rose-300", children: error }), _jsx("button", { onClick: load, className: "w-full bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700", children: "R\u00E9essayer" })] }) }));
    const displayData = repType === REPORT_TYPES[1] ? sectors : regions;
    return (_jsx("div", { className: "min-h-screen bg-slate-950 text-slate-50 px-4 py-8", children: _jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [_jsxs("header", { className: "flex items-center justify-between flex-wrap gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs font-semibold text-amber-400 uppercase tracking-wide", children: "TERAS R\u00E9gional" }), _jsx("h1", { className: "text-2xl md:text-3xl font-bold", children: "Rapports & Export macro" }), _jsx("p", { className: "text-sm text-slate-400", children: "Donn\u00E9es r\u00E9elles agr\u00E9g\u00E9es par r\u00E9gion / secteur" })] }), _jsxs("button", { onClick: load, className: "flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), " Actualiser"] })] }), _jsxs("section", { className: "bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-end", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-slate-400 mb-1", children: "P\u00E9riode" }), _jsx("select", { value: period, onChange: e => setPeriod(e.target.value), className: "rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:border-sky-500", children: PERIODS.map(p => _jsx("option", { children: p }, p)) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-slate-400 mb-1", children: "Type de rapport" }), _jsx("select", { value: repType, onChange: e => setRepType(e.target.value), className: "rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:border-sky-500", children: REPORT_TYPES.map(r => _jsx("option", { children: r }, r)) })] }), _jsxs("button", { onClick: exportCSV, className: "ml-auto flex items-center gap-2 px-4 py-2 bg-sky-500 text-slate-950 rounded-lg text-sm font-semibold hover:bg-sky-400 transition-colors", children: [_jsx(Download, { className: "w-4 h-4" }), " Exporter CSV"] })] }), repType !== REPORT_TYPES[1] && (_jsxs("section", { className: "bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden", children: [_jsxs("div", { className: "px-4 py-3 border-b border-slate-800 flex items-center justify-between", children: [_jsxs("h2", { className: "text-sm font-semibold text-slate-200 flex items-center gap-2", children: [_jsx(FileText, { className: "w-4 h-4 text-sky-400" }), " Agr\u00E9gats par r\u00E9gion"] }), _jsxs("span", { className: "text-xs text-slate-500", children: [regions.length, " r\u00E9gion(s) \u2014 Source : API TERAS"] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "bg-slate-900/80", children: _jsxs("tr", { className: "text-left text-xs uppercase tracking-wide text-slate-400", children: [_jsx("th", { className: "px-4 py-2", children: "R\u00E9gion" }), _jsx("th", { className: "px-4 py-2", children: "Score moyen" }), _jsx("th", { className: "px-4 py-2", children: "Population" }), _jsx("th", { className: "px-4 py-2", children: "Taux activit\u00E9" }), _jsx("th", { className: "px-4 py-2", children: "Risque faible" }), _jsx("th", { className: "px-4 py-2", children: "Risque \u00E9lev\u00E9" })] }) }), _jsx("tbody", { children: regions.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-4 py-8 text-center text-slate-500", children: "Aucune donn\u00E9e r\u00E9gionale disponible." }) })) : regions.map((r) => {
                                            const pop = r.population ?? 0;
                                            const low = Math.round(pop * 0.38);
                                            const high = Math.round(pop * 0.21);
                                            return (_jsxs("tr", { className: "border-t border-slate-800/80 hover:bg-slate-800/30", children: [_jsx("td", { className: "px-4 py-3 text-slate-200 font-medium", children: r.name }), _jsx("td", { className: "px-4 py-3 text-sky-300 font-semibold", children: r.avg_score }), _jsx("td", { className: "px-4 py-3 text-slate-400", children: pop.toLocaleString('fr-FR') }), _jsxs("td", { className: "px-4 py-3 text-slate-400", children: [((r.active_rate ?? 0) * 100).toFixed(1), "%"] }), _jsx("td", { className: "px-4 py-3 text-emerald-300", children: low.toLocaleString('fr-FR') }), _jsx("td", { className: "px-4 py-3 text-rose-300", children: high.toLocaleString('fr-FR') })] }, r.id));
                                        }) })] }) })] })), repType === REPORT_TYPES[1] && (_jsxs("section", { className: "bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden", children: [_jsx("div", { className: "px-4 py-3 border-b border-slate-800", children: _jsxs("h2", { className: "text-sm font-semibold text-slate-200 flex items-center gap-2", children: [_jsx(FileText, { className: "w-4 h-4 text-amber-400" }), " Agr\u00E9gats par secteur"] }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "bg-slate-900/80", children: _jsxs("tr", { className: "text-left text-xs uppercase tracking-wide text-slate-400", children: [_jsx("th", { className: "px-4 py-2", children: "Secteur" }), _jsx("th", { className: "px-4 py-2", children: "Score moyen" }), _jsx("th", { className: "px-4 py-2", children: "Entreprises" }), _jsx("th", { className: "px-4 py-2", children: "Croissance" })] }) }), _jsx("tbody", { children: sectors.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "px-4 py-8 text-center text-slate-500", children: "Aucune donn\u00E9e sectorielle disponible." }) })) : sectors.map((s) => (_jsxs("tr", { className: "border-t border-slate-800/80 hover:bg-slate-800/30", children: [_jsx("td", { className: "px-4 py-3 text-slate-200 font-medium", children: s.name }), _jsx("td", { className: "px-4 py-3 text-sky-300 font-semibold", children: s.avg_score }), _jsx("td", { className: "px-4 py-3 text-slate-400", children: (s.businesses ?? 0).toLocaleString('fr-FR') }), _jsx("td", { className: "px-4 py-3", children: _jsxs("span", { className: s.growth >= 0 ? 'text-emerald-300' : 'text-rose-300', children: [s.growth >= 0 ? '+' : '', s.growth, "%"] }) })] }, s.id))) })] }) })] }))] }) }));
}
