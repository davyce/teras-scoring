import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// @ts-nocheck
// teras-frontend/src/pages/government/GovernmentRegions.tsx
import { useState, useEffect } from 'react';
import { authFetch } from '../../services/authFetch';
import { MapPin, Building2, Users, DollarSign, TrendingUp, RefreshCw, ChevronDown, ChevronUp, BarChart3, Briefcase, Activity, Shield, } from 'lucide-react';
const fmtB = (n) => {
    if (!n)
        return '0';
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
const SBG = (s) => s >= 700 ? 'bg-emerald-500' : s >= 500 ? 'bg-amber-500' : s >= 300 ? 'bg-orange-400' : 'bg-red-500';
const BANDS = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-red-400'];
const REGION_STYLE = {
    'Sud': 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    'Centre': 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    'Nord': 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
};
function Bar({ pct, color = 'bg-sky-500' }) {
    return (_jsx("div", { className: "h-2 bg-slate-800 rounded-full overflow-hidden mt-1", children: _jsx("div", { className: `h-full ${color} rounded-full transition-all duration-700`, style: { width: `${Math.min(pct, 100)}%` } }) }));
}
export default function GovernmentRegions() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [tabs, setTabs] = useState({});
    const load = () => {
        setLoading(true);
        authFetch('/api/scoring/government/regions/')
            .then(r => r.json())
            .then(d => setData(d))
            .catch(() => { })
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);
    const toggle = (dept) => setExpanded(p => p === dept ? null : dept);
    const setTab = (dept, t) => setTabs(p => ({ ...p, [dept]: t }));
    if (loading)
        return (_jsxs("div", { className: "flex items-center justify-center h-64 gap-3 text-slate-400", children: [_jsx(RefreshCw, { className: "w-5 h-5 animate-spin text-sky-400" }), " Chargement donn\u00E9es r\u00E9gionales\u2026"] }));
    const sum = data?.summary || {};
    const depts = data?.departments || [];
    const maxRev = Math.max(...depts.map((d) => d.annual_revenue), 1);
    // Grouper par région géographique
    const regions = {};
    depts.forEach((d) => {
        const r = d.region || 'Autre';
        if (!regions[r])
            regions[r] = [];
        regions[r].push(d);
    });
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-white flex items-center gap-3", children: [_jsx(MapPin, { className: "w-6 h-6 text-sky-400" }), "D\u00E9partements \u2014 ", data?.country?.name || 'Congo Brazzaville'] }), _jsxs("p", { className: "text-slate-400 text-sm mt-1", children: [sum.total_departments, " d\u00E9partements \u00B7 donn\u00E9es \u00E9conomiques r\u00E9elles TERAS"] })] }), _jsx("button", { onClick: load, className: "p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors", children: _jsx(RefreshCw, { className: "w-4 h-4" }) })] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-4", children: [
                    { l: 'Départements', v: sum.total_departments || 0, c: 'slate', i: MapPin },
                    { l: 'Entreprises', v: fmtN(sum.total_enterprises), c: 'blue', i: Building2 },
                    { l: 'CA national', v: fmtB(sum.total_revenue), c: 'purple', i: DollarSign },
                    { l: 'Emplois formels', v: fmtN(sum.total_employees), c: 'emerald', i: Briefcase },
                    { l: 'Score TERAS moyen', v: sum.avg_score || '—', c: 'amber', i: TrendingUp },
                ].map(({ l, v, c, i: Icon }) => (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 flex items-center gap-3", children: [_jsx("div", { className: `w-9 h-9 rounded-xl bg-${c}-500/20 flex items-center justify-center shrink-0`, children: _jsx(Icon, { className: `w-4 h-4 text-${c === 'slate' ? 'slate-400' : c + '-400'}` }) }), _jsxs("div", { children: [_jsx("p", { className: "text-lg font-bold text-white", children: v }), _jsx("p", { className: "text-slate-500 text-xs", children: l })] })] }, l))) }), depts.length > 0 && (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5", children: [_jsxs("h3", { className: "text-white font-semibold mb-4 flex items-center gap-2", children: [_jsx(BarChart3, { className: "w-4 h-4 text-purple-400" }), " R\u00E9partition du CA par d\u00E9partement"] }), _jsx("div", { className: "space-y-2.5", children: [...depts].sort((a, b) => b.annual_revenue - a.annual_revenue).map((d) => {
                            const pct = Math.round((d.annual_revenue / maxRev) * 100);
                            return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between text-xs mb-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-white font-medium w-28 truncate", children: d.dept }), d.region && (_jsx("span", { className: `px-1.5 py-0.5 rounded text-xs border ${REGION_STYLE[d.region] || 'text-slate-400 bg-slate-800 border-slate-700'}`, children: d.region }))] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("span", { className: "text-slate-400", children: [d.enterprises, " entr."] }), _jsx("span", { className: `font-semibold ${SC(d.avg_score)}`, children: d.avg_score || '—' }), _jsx("span", { className: "text-white font-semibold w-24 text-right", children: fmtB(d.annual_revenue) })] })] }), _jsx(Bar, { pct: pct, color: SBG(d.avg_score) })] }, d.dept));
                        }) })] })), Object.entries(regions).map(([region, deptList]) => (_jsxs("div", { className: "space-y-3", children: [_jsxs("h2", { className: "text-white font-bold flex items-center gap-2", children: [_jsx("span", { className: `px-2.5 py-1 rounded-lg text-sm border ${REGION_STYLE[region] || 'text-slate-400 bg-slate-800 border-slate-700'}`, children: region }), _jsxs("span", { className: "text-slate-500 text-sm font-normal", children: [deptList.length, " d\u00E9partement", deptList.length > 1 ? 's' : ''] })] }), _jsx("div", { className: "grid md:grid-cols-2 gap-3", children: deptList.map((dept) => {
                            const isOpen = expanded === dept.dept;
                            const tab = tabs[dept.dept] || 'overview';
                            return (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden", children: [_jsxs("button", { onClick: () => toggle(dept.dept), className: "w-full p-4 text-left hover:bg-slate-800/30 transition-colors", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-white font-bold text-base flex items-center gap-2", children: [_jsx(MapPin, { className: "w-4 h-4 text-sky-400 shrink-0" }), dept.dept] }), _jsxs("p", { className: "text-slate-400 text-xs mt-0.5", children: ["Chef-lieu : ", dept.capital, dept.cities.length > 1 && ` · ${dept.cities.slice(1).join(', ')}`] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "text-right", children: [_jsx("p", { className: `font-bold text-lg ${SC(dept.avg_score)}`, children: dept.avg_score || '—' }), _jsx("p", { className: "text-slate-500 text-xs", children: "Score TERAS" })] }), isOpen ? _jsx(ChevronUp, { className: "w-4 h-4 text-slate-500" }) : _jsx(ChevronDown, { className: "w-4 h-4 text-slate-500" })] })] }), _jsxs("div", { className: "flex items-center gap-4 mt-3 text-xs text-slate-400", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Building2, { className: "w-3 h-3" }), dept.enterprises, " entr."] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Users, { className: "w-3 h-3" }), dept.individuals, " ind."] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Briefcase, { className: "w-3 h-3" }), dept.employees, " emplois"] }), _jsxs("span", { className: "flex items-center gap-1 text-white font-medium ml-auto", children: [_jsx(DollarSign, { className: "w-3 h-3" }), fmtB(dept.annual_revenue)] })] })] }), isOpen && (_jsxs("div", { className: "border-t border-slate-800/50 p-4 space-y-4", children: [_jsx("div", { className: "flex gap-2 text-xs", children: [{ id: 'overview', l: 'Aperçu' }, { id: 'enterprises', l: 'Entreprises' }, { id: 'loans', l: 'Crédits' }].map(({ id, l }) => (_jsx("button", { onClick: () => setTab(dept.dept, id), className: `px-3 py-1.5 rounded-lg font-medium transition-all ${tab === id ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`, children: l }, id))) }), tab === 'overview' && (_jsxs("div", { className: "space-y-4", children: [dept.score_distribution && (_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs font-semibold mb-2", children: "Distribution Scores TERAS" }), _jsx("div", { className: "space-y-1.5", children: Object.entries(dept.score_distribution).map(([band, count], i) => {
                                                                    const tot = Object.values(dept.score_distribution).reduce((a, b) => a + b, 0) || 1;
                                                                    const p = Math.round((count / tot) * 100);
                                                                    return (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-xs mb-0.5", children: [_jsx("span", { className: "text-slate-400", children: band }), _jsxs("span", { className: "text-white", children: [count, " (", p, "%)"] })] }), _jsx(Bar, { pct: p, color: BANDS[i] || 'bg-slate-500' })] }, band));
                                                                }) })] })), dept.top_sectors?.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs font-semibold mb-2", children: "Secteurs dominants" }), _jsx("div", { className: "flex flex-wrap gap-2", children: dept.top_sectors.map((s) => (_jsxs("span", { className: "px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg", children: [s.sector, " ", _jsxs("span", { className: "text-sky-400 font-bold", children: ["(", s.count, ")"] })] }, s.sector))) })] })), _jsx("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [
                                                            { l: 'CA annuel', v: fmtB(dept.annual_revenue) },
                                                            { l: 'Emplois', v: fmtN(dept.employees) },
                                                            { l: 'Crédits actifs', v: dept.loans_active || 0 },
                                                            { l: 'Volume crédit', v: fmtB(dept.loans_volume) },
                                                        ].map(({ l, v }) => (_jsxs("div", { className: "bg-slate-800/40 rounded-lg p-2.5", children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: l }), _jsx("p", { className: "text-white font-semibold", children: v })] }, l))) })] })), tab === 'enterprises' && (_jsx("div", { className: "space-y-2", children: dept.enterprises === 0 ? (_jsxs("div", { className: "text-center py-6", children: [_jsx(Building2, { className: "w-10 h-10 text-slate-700 mx-auto mb-2" }), _jsx("p", { className: "text-slate-500 text-sm", children: "Aucune entreprise enregistr\u00E9e dans ce d\u00E9partement." })] })) : dept.top_enterprises?.length > 0 ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-slate-400 text-xs font-semibold", children: "Top entreprises \u2014 Score TERAS" }), dept.top_enterprises.map((e, i) => (_jsxs("div", { className: "flex items-center justify-between py-2 border-b border-slate-800/30", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx("span", { className: "text-slate-600 text-xs w-4 font-bold shrink-0", children: i + 1 }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-white text-sm font-medium truncate", children: e.name }), _jsxs("p", { className: "text-slate-500 text-xs", children: [e.sector, " \u00B7 ", e.city] })] })] }), _jsxs("div", { className: "text-right shrink-0 ml-2", children: [_jsx("p", { className: `font-bold text-sm ${SC(e.teras_score)}`, children: e.teras_score }), _jsx("p", { className: "text-slate-500 text-xs", children: fmtB(e.annual_revenue) })] })] }, i)))] })) : (_jsx("p", { className: "text-slate-500 text-xs text-center py-4", children: "Scores en cours de calcul." })) })), tab === 'loans' && (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "grid grid-cols-3 gap-2 text-xs", children: [
                                                            { l: 'Total', v: dept.loans_total || 0, c: 'white' },
                                                            { l: 'Actifs', v: dept.loans_active || 0, c: 'emerald-400' },
                                                            { l: 'Volume décaissé', v: fmtB(dept.loans_volume || 0), c: 'sky-400' },
                                                        ].map(({ l, v, c }) => (_jsxs("div", { className: "bg-slate-800/40 rounded-xl p-3 text-center", children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: l }), _jsx("p", { className: `font-bold text-base text-${c}`, children: v })] }, l))) }), dept.loans_total === 0 && (_jsxs("div", { className: "text-center py-4", children: [_jsx(Activity, { className: "w-8 h-8 text-slate-700 mx-auto mb-2" }), _jsx("p", { className: "text-slate-500 text-sm", children: "Aucun cr\u00E9dit enregistr\u00E9 dans ce d\u00E9partement." })] }))] }))] }))] }, dept.dept));
                        }) })] }, region))), depts.length === 0 && (_jsxs("div", { className: "text-center py-16", children: [_jsx(Shield, { className: "w-14 h-14 text-slate-700 mx-auto mb-4" }), _jsx("p", { className: "text-white font-semibold mb-2", children: "Aucune donn\u00E9e r\u00E9gionale" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Les donn\u00E9es appara\u00EEtront d\u00E8s que des entreprises seront enregistr\u00E9es." })] }))] }));
}
