import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// teras-frontend/src/pages/government/GovernmentSectors.tsx
import { useState, useEffect } from 'react';
import { authFetch } from '../../services/authFetch';
import { Briefcase, RefreshCw, Users, DollarSign, BarChart3, Filter, Globe2, } from 'lucide-react';
const FLAG = {
    CG: '🇨🇬', CM: '🇨🇲', GA: '🇬🇦', CF: '🇨🇫', TD: '🇹🇩', GQ: '🇬🇶', CD: '🇨🇩',
};
const CEMAC = ['', 'CG', 'CM', 'GA', 'CF', 'TD', 'GQ', 'CD'];
const COLORS = [
    'from-sky-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-purple-500 to-indigo-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-red-600',
    'from-cyan-500 to-sky-600',
    'from-violet-500 to-purple-600',
    'from-green-500 to-emerald-600',
    'from-orange-500 to-amber-600',
    'from-pink-500 to-rose-600',
    'from-teal-500 to-cyan-600',
    'from-indigo-500 to-violet-600',
];
const fmtB = (n) => {
    if (!n)
        return '0 FCFA';
    if (n >= 1000000000)
        return `${(n / 1000000000).toFixed(1)}Md FCFA`;
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M FCFA`;
    if (n >= 1000)
        return `${Math.round(n / 1000)}k FCFA`;
    return `${n.toLocaleString('fr-FR')} FCFA`;
};
const fmtN = (n) => n?.toLocaleString('fr-FR') || '0';
const SC = (s) => s >= 700 ? 'text-emerald-400' : s >= 500 ? 'text-amber-400' : s >= 300 ? 'text-orange-400' : 'text-red-400';
export default function GovernmentSectors() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [country, setCountry] = useState('');
    const [sortBy, setSortBy] = useState('revenue');
    const load = async (c = country) => {
        setLoading(true);
        try {
            const url = `/api/scoring/government/sectors/${c ? `?country=${c}` : ''}`;
            const d = await authFetch(url).then(r => r.json());
            setData(d);
        }
        catch { }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);
    const sectors = data?.sectors || [];
    const sorted = [...sectors].sort((a, b) => b[sortBy] - a[sortBy]);
    const sum = data?.summary || {};
    const maxRev = Math.max(...sectors.map(s => s.revenue), 1);
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-white flex items-center gap-3", children: [_jsx(Briefcase, { className: "w-6 h-6 text-purple-400" }), " Secteurs \u00C9conomiques CEMAC"] }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Analyse sectorielle \u2014 donn\u00E9es entreprises TERAS" })] }), _jsx("button", { onClick: () => load(country), className: "p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors", children: _jsx(RefreshCw, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "flex gap-3 flex-wrap", children: [_jsxs("div", { className: "flex items-center gap-2 bg-slate-900/50 border border-slate-800/50 rounded-xl px-3 py-2", children: [_jsx(Globe2, { className: "w-4 h-4 text-slate-400" }), _jsxs("select", { value: country, onChange: e => { setCountry(e.target.value); load(e.target.value); }, className: "bg-transparent text-white text-sm focus:outline-none", children: [_jsx("option", { value: "", children: "Zone CEMAC compl\u00E8te" }), [['CG', 'Congo Brazza'], ['CM', 'Cameroun'], ['GA', 'Gabon'], ['CF', 'Centrafrique'], ['TD', 'Tchad'], ['GQ', 'Guinée Éq.'], ['CD', 'RD Congo']].map(([c, n]) => (_jsxs("option", { value: c, children: [FLAG[c], " ", n] }, c)))] })] }), _jsxs("div", { className: "flex items-center gap-2 bg-slate-900/50 border border-slate-800/50 rounded-xl px-3 py-2", children: [_jsx(Filter, { className: "w-4 h-4 text-slate-400" }), _jsxs("select", { value: sortBy, onChange: e => setSortBy(e.target.value), className: "bg-transparent text-white text-sm focus:outline-none", children: [_jsx("option", { value: "revenue", children: "Trier par CA" }), _jsx("option", { value: "count", children: "Trier par nombre" }), _jsx("option", { value: "avg_score", children: "Trier par score" })] })] })] }), !loading && sum && (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
                    { l: 'Entreprises analysées', v: fmtN(sum.total_enterprises), c: 'blue', i: Users },
                    { l: 'CA total', v: fmtB(sum.total_revenue), c: 'emerald', i: DollarSign },
                    { l: 'Emplois formels', v: fmtN(sum.total_employees), c: 'purple', i: Briefcase },
                    { l: 'Secteurs identifiés', v: sum.sectors_count || 0, c: 'amber', i: BarChart3 },
                ].map(({ l, v, c, i: Icon }) => (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 flex items-center gap-3", children: [_jsx("div", { className: `w-10 h-10 rounded-xl bg-${c}-500/20 flex items-center justify-center shrink-0`, children: _jsx(Icon, { className: `w-5 h-5 text-${c}-400` }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xl font-bold text-white", children: v }), _jsx("p", { className: "text-slate-400 text-xs", children: l })] })] }, l))) })), loading ? (_jsxs("div", { className: "flex items-center justify-center py-16 gap-3 text-slate-400", children: [_jsx(RefreshCw, { className: "w-5 h-5 animate-spin text-purple-400" }), " Chargement\u2026"] })) : sorted.length === 0 ? (_jsxs("div", { className: "text-center py-14 text-slate-500", children: [_jsx(Briefcase, { className: "w-12 h-12 mx-auto mb-3 text-slate-700" }), _jsx("p", { children: "Aucune donn\u00E9e sectorielle disponible." })] })) : (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("h3", { className: "text-white font-semibold mb-5 flex items-center gap-2", children: [_jsx(BarChart3, { className: "w-5 h-5 text-purple-400" }), " R\u00E9partition du CA par secteur"] }), _jsx("div", { className: "space-y-3", children: sorted.slice(0, 10).map((s, i) => {
                                    const pct = Math.round((s.revenue / maxRev) * 100);
                                    return (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-1.5", children: [_jsx("span", { className: "text-white font-medium", children: s.label }), _jsxs("div", { className: "flex items-center gap-3 text-xs", children: [_jsxs("span", { className: "text-slate-400", children: [s.count, " entr."] }), _jsxs("span", { className: `font-semibold ${SC(s.avg_score)}`, children: [s.avg_score || '—', " pts"] }), _jsx("span", { className: "text-white font-semibold", children: fmtB(s.revenue) })] })] }), _jsx("div", { className: "h-3 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full bg-gradient-to-r ${COLORS[i % COLORS.length]} rounded-full transition-all duration-700`, style: { width: `${pct}%` } }) }), _jsx("div", { className: "flex gap-1 mt-1", children: s.countries?.map((c) => _jsx("span", { className: "text-sm", children: FLAG[c] || '🌍' }, c)) })] }, s.sector));
                                }) })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden", children: [_jsx("div", { className: "p-5 border-b border-slate-800/50", children: _jsx("h3", { className: "text-white font-semibold", children: "Analyse d\u00E9taill\u00E9e par secteur" }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-slate-800", children: ['Secteur', 'Entreprises', 'CA annuel', 'Emplois', 'Score moy.', 'Présence', 'Poids CA'].map(h => (_jsx("th", { className: `p-4 text-slate-400 font-medium ${h === 'Secteur' ? 'text-left' : 'text-right'}`, children: h }, h))) }) }), _jsx("tbody", { children: sorted.map((s, i) => {
                                                const totalRev = sum.total_revenue || 1;
                                                const share = Math.round((s.revenue / totalRev) * 100);
                                                return (_jsxs("tr", { className: "border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors", children: [_jsx("td", { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-2.5 h-8 rounded-full bg-gradient-to-b ${COLORS[i % COLORS.length]}` }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-medium", children: s.label }), _jsxs("p", { className: "text-slate-500 text-xs", children: [s.country_count, " pays"] })] })] }) }), _jsx("td", { className: "p-4 text-right text-white", children: fmtN(s.count) }), _jsx("td", { className: "p-4 text-right", children: _jsx("span", { className: "text-white font-semibold", children: fmtB(s.revenue) }) }), _jsx("td", { className: "p-4 text-right text-slate-300", children: fmtN(s.employees) }), _jsx("td", { className: "p-4 text-right", children: _jsx("span", { className: `font-bold ${SC(s.avg_score)}`, children: s.avg_score || '—' }) }), _jsx("td", { className: "p-4 text-right", children: _jsx("div", { className: "flex gap-1 justify-end flex-wrap", children: s.countries?.map((c) => _jsx("span", { children: FLAG[c] || '🌍' }, c)) }) }), _jsx("td", { className: "p-4 text-right", children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsxs("span", { className: "text-white font-semibold", children: [share, "%"] }), _jsx("div", { className: "w-14 h-2 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full bg-gradient-to-r ${COLORS[i % COLORS.length]} rounded-full`, style: { width: `${share}%` } }) })] }) })] }, s.sector));
                                            }) })] }) })] })] }))] }));
}
