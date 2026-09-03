import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// teras-frontend/src/pages/government/GovernmentAlerts.tsx
import { useState, useEffect } from 'react';
import { authFetch } from '../../services/authFetch';
import { AlertCircle, Shield, RefreshCw, TrendingDown, Globe2, Filter, BarChart3, } from 'lucide-react';
const FLAG = {
    CG: '🇨🇬', CM: '🇨🇲', GA: '🇬🇦', CF: '🇨🇫', TD: '🇹🇩', GQ: '🇬🇶', CD: '🇨🇩',
};
const fmtB = (n) => {
    if (!n)
        return '0 FCFA';
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M FCFA`;
    if (n >= 1000)
        return `${Math.round(n / 1000)}k FCFA`;
    return `${n.toLocaleString('fr-FR')} FCFA`;
};
const RISK_CFG = {
    'critique': { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    'élevé': { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
    'moyen': { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
};
export default function GovernmentAlerts() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [country, setCountry] = useState('');
    const [threshold, setThreshold] = useState(500);
    const [search, setSearch] = useState('');
    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (country)
                params.set('country', country);
            params.set('threshold', String(threshold));
            const d = await authFetch(`/api/scoring/government/compliance/?${params}`).then(r => r.json());
            setData(d);
        }
        catch { }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [country, threshold]);
    const alerts = (data?.alerts || []).filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.city?.toLowerCase().includes(search.toLowerCase()));
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-white flex items-center gap-3", children: [_jsx(AlertCircle, { className: "w-6 h-6 text-red-400" }), " Alertes de Conformit\u00E9"] }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Entreprises \u00E0 risque \u2014 score TERAS insuffisant" })] }), _jsx("button", { onClick: load, className: "p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors", children: _jsx(RefreshCw, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "flex gap-3 flex-wrap", children: [_jsxs("select", { value: country, onChange: e => setCountry(e.target.value), className: "px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none", children: [_jsx("option", { value: "", children: "Tous pays CEMAC" }), [['CG', 'Congo Brazza'], ['CM', 'Cameroun'], ['GA', 'Gabon'], ['CF', 'Centrafrique'], ['TD', 'Tchad'], ['GQ', 'Guinée Éq.'], ['CD', 'RD Congo']].map(([c, n]) => (_jsxs("option", { value: c, children: [FLAG[c], " ", n] }, c)))] }), _jsxs("select", { value: threshold, onChange: e => setThreshold(Number(e.target.value)), className: "px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none", children: [_jsx("option", { value: 300, children: "Critique < 300" }), _jsx("option", { value: 400, children: "\u00C9lev\u00E9 < 400" }), _jsx("option", { value: 500, children: "Moyen < 500" }), _jsx("option", { value: 600, children: "Surveillance < 600" })] }), _jsx("input", { value: search, onChange: e => setSearch(e.target.value), placeholder: "Rechercher une entreprise\u2026", className: "flex-1 min-w-48 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none placeholder-slate-500" })] }), loading ? (_jsxs("div", { className: "flex items-center justify-center py-16 gap-3 text-slate-400", children: [_jsx(RefreshCw, { className: "w-5 h-5 animate-spin text-red-400" }), " Chargement\u2026"] })) : (_jsxs(_Fragment, { children: [data && (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
                            { l: 'Total à risque', v: data.total_at_risk || 0, c: 'red', i: AlertCircle },
                            { l: 'Critique (<300)', v: (data.alerts || []).filter((a) => a.teras_score < 300).length, c: 'orange', i: TrendingDown },
                            { l: 'Pays concernés', v: (data.by_country || []).length, c: 'amber', i: Globe2 },
                            { l: 'Seuil appliqué', v: `< ${threshold} pts`, c: 'slate', i: Filter },
                        ].map(({ l, v, c, i: Icon }) => (_jsxs("div", { className: `bg-${c === 'slate' ? 'slate-900/50' : `${c}-500/10 border-${c}-500/20`} border border-slate-800/50 rounded-2xl p-4 flex items-center gap-3`, children: [_jsx("div", { className: `w-10 h-10 rounded-xl bg-${c}-500/20 flex items-center justify-center shrink-0`, children: _jsx(Icon, { className: `w-5 h-5 text-${c}-400` }) }), _jsxs("div", { children: [_jsx("p", { className: `text-xl font-bold text-${c === 'slate' ? 'white' : c + '-400'}`, children: v }), _jsx("p", { className: "text-slate-400 text-xs", children: l })] })] }, l))) })), data?.by_country?.length > 0 && (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5", children: [_jsxs("h3", { className: "text-white font-semibold mb-4 flex items-center gap-2", children: [_jsx(BarChart3, { className: "w-4 h-4 text-red-400" }), " R\u00E9partition par pays"] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: data.by_country.map((c) => (_jsxs("div", { className: "bg-red-500/5 border border-red-500/15 rounded-xl p-3 text-center", children: [_jsx("p", { className: "text-2xl mb-1", children: FLAG[c.country.split(' ')[0]] || '🌍' }), _jsx("p", { className: "text-white font-semibold text-sm", children: c.country }), _jsx("p", { className: "text-red-400 font-bold text-xl", children: c.count }), _jsxs("p", { className: "text-slate-500 text-xs", children: ["Score moy: ", c.avg_score] })] }, c.country))) })] })), alerts.length === 0 ? (_jsxs("div", { className: "bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-12 text-center", children: [_jsx(Shield, { className: "w-14 h-14 text-emerald-400 mx-auto mb-4" }), _jsx("h3", { className: "text-white font-bold text-lg mb-2", children: "Aucune alerte d\u00E9tect\u00E9e" }), _jsxs("p", { className: "text-slate-400 text-sm", children: ["Tous les acteurs sont au-dessus du seuil de ", threshold, " points."] })] })) : (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden", children: [_jsxs("div", { className: "p-4 border-b border-slate-800/50 flex items-center justify-between", children: [_jsxs("h3", { className: "text-white font-semibold", children: [alerts.length, " entreprises \u00E0 surveiller"] }), _jsxs("span", { className: "text-slate-500 text-xs", children: ["Score < ", threshold, " pts \u00B7 actives"] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-slate-800", children: ['Entreprise', 'Pays', 'Secteur', 'Score', 'CA annuel', 'Emplois', 'Crédits actifs', 'Risque'].map(h => (_jsx("th", { className: `p-3 text-slate-400 font-medium ${h === 'Entreprise' ? 'text-left' : 'text-center'}`, children: h }, h))) }) }), _jsx("tbody", { children: alerts.map((a) => {
                                                const r = RISK_CFG[a.risk_level] || RISK_CFG['moyen'];
                                                return (_jsxs("tr", { className: "border-b border-slate-800/40 hover:bg-red-500/5 transition-colors", children: [_jsxs("td", { className: "p-3", children: [_jsx("p", { className: "text-white font-medium", children: a.name }), _jsx("p", { className: "text-slate-500 text-xs", children: a.city })] }), _jsx("td", { className: "p-3 text-center", children: _jsx("span", { className: "text-xl", title: a.country_name, children: FLAG[a.country] || '🌍' }) }), _jsx("td", { className: "p-3 text-center text-slate-300 text-xs", children: a.sector || '—' }), _jsx("td", { className: "p-3 text-center", children: _jsx("span", { className: "font-bold text-red-400 text-base", children: a.teras_score }) }), _jsx("td", { className: "p-3 text-center text-slate-300", children: fmtB(a.annual_revenue) }), _jsx("td", { className: "p-3 text-center text-slate-300", children: a.employees_count || 0 }), _jsx("td", { className: "p-3 text-center", children: _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs ${a.active_loans > 0 ? 'bg-amber-500/10 text-amber-400' : 'text-slate-500'}`, children: a.active_loans || 0 }) }), _jsx("td", { className: "p-3 text-center", children: _jsx("span", { className: `px-2.5 py-1 rounded-full text-xs font-semibold border ${r.bg} ${r.color}`, children: a.risk_level }) })] }, a.id));
                                            }) })] }) })] }))] }))] }));
}
