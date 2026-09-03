import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// @ts-nocheck
// teras-frontend/src/pages/government/GovernmentDashboard.tsx
// Dashboard présidentiel TERAS — données réelles CEMAC
import { useState, useEffect } from 'react';
import { authFetch } from '../../services/authFetch';
import { Globe2, Building2, Users, DollarSign, BarChart3, Shield, AlertCircle, RefreshCw, ChevronRight, Briefcase, Activity, MapPin, } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GovernmentUsersMap from '../../components/government/GovernmentUsersMap';
// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtB = (n) => {
    if (!n)
        return '0 FCFA';
    if (n >= 1000000000000)
        return `${(n / 1000000000000).toFixed(2)}T FCFA`;
    if (n >= 1000000000)
        return `${(n / 1000000000).toFixed(1)}Md FCFA`;
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M FCFA`;
    if (n >= 1000)
        return `${Math.round(n / 1000)}k FCFA`;
    return `${n.toLocaleString('fr-FR')} FCFA`;
};
const fmtN = (n) => n?.toLocaleString('fr-FR') || '0';
const SCORE_COLOR = (s) => s >= 700 ? 'text-emerald-400' : s >= 500 ? 'text-amber-400' : s >= 300 ? 'text-orange-400' : 'text-red-400';
const SCORE_BG = (s) => s >= 700 ? 'bg-emerald-500/10 border-emerald-500/20' : s >= 500 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';
const BAND_COLORS = ['bg-emerald-500', 'bg-green-500', 'bg-blue-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500'];
const FLAG = {
    CG: '🇨🇬', CM: '🇨🇲', GA: '🇬🇦', CF: '🇨🇫', TD: '🇹🇩', GQ: '🇬🇶', CD: '🇨🇩',
};
// ── Mini barre ────────────────────────────────────────────────────────────────
const Bar = ({ pct, color = 'bg-sky-500' }) => (_jsx("div", { className: "h-2 bg-slate-800 rounded-full overflow-hidden mt-1", children: _jsx("div", { className: `h-full ${color} rounded-full transition-all duration-700`, style: { width: `${Math.min(pct, 100)}%` } }) }));
// ── Composant principal ───────────────────────────────────────────────────────
export default function GovernmentDashboard() {
    const navigate = useNavigate();
    const [overview, setOverview] = useState(null);
    const [macro, setMacro] = useState(null);
    const [sectors, setSectors] = useState(null);
    const [compliance, setCompliance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [countryDetail, setCountryDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const load = async () => {
        setLoading(true);
        try {
            const [ov, mc, sc, co] = await Promise.all([
                authFetch('/api/scoring/government/overview/').then(r => r.json()),
                authFetch('/api/scoring/government/macro/').then(r => r.json()),
                authFetch('/api/scoring/government/sectors/').then(r => r.json()),
                authFetch('/api/scoring/government/compliance/').then(r => r.json()),
            ]);
            setOverview(ov);
            setMacro(mc);
            setSectors(sc);
            setCompliance(co);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setLoading(false);
        }
    };
    const loadCountry = async (code) => {
        if (selectedCountry === code) {
            setSelectedCountry(null);
            setCountryDetail(null);
            return;
        }
        setSelectedCountry(code);
        setLoadingDetail(true);
        try {
            const d = await authFetch(`/api/scoring/government/countries/${code}/`).then(r => r.json());
            setCountryDetail(d);
        }
        catch { }
        finally {
            setLoadingDetail(false);
        }
    };
    useEffect(() => { load(); }, []);
    if (loading)
        return (_jsxs("div", { className: "flex items-center justify-center h-96 gap-3 text-slate-400", children: [_jsx(RefreshCw, { className: "w-6 h-6 animate-spin text-sky-400" }), " Chargement des donn\u00E9es CEMAC\u2026"] }));
    const sum = overview?.summary || {};
    const countries = overview?.by_country || [];
    const maxRev = Math.max(...countries.map((c) => c.annual_revenue), 1);
    return (_jsxs("div", { className: "p-6 space-y-8 text-white", children: [_jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-black flex items-center gap-3", children: [_jsx(Globe2, { className: "w-8 h-8 text-sky-400" }), " Tableau de Bord CEMAC"] }), _jsxs("p", { className: "text-slate-400 mt-1", children: ["Donn\u00E9es \u00E9conomiques r\u00E9elles de la zone franc \u2014 ", new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })] })] }), _jsxs("button", { onClick: load, className: "flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), " Actualiser"] })] }), _jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
                    { label: 'Entreprises enregistrées', val: fmtN(sum.enterprises), sub: `${sum.enterprises_active || 0} actives`, color: 'blue', icon: Building2 },
                    { label: 'Individus TERAS', val: fmtN(sum.individuals), sub: `Score moyen: ${sum.avg_individual_score}`, color: 'emerald', icon: Users },
                    { label: 'Revenus agrégés annuels', val: fmtB(sum.total_annual_revenue), sub: 'Entreprises formelles', color: 'purple', icon: DollarSign },
                    { label: 'Volume crédits actifs', val: fmtB(sum.loans_volume), sub: `Taux approbation: ${sum.loan_approval_rate}%`, color: 'amber', icon: Activity },
                ].map(({ label, val, sub, color, icon: Icon }) => (_jsxs("div", { className: `bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5`, children: [_jsx("div", { className: `w-11 h-11 rounded-xl bg-${color}-500/20 flex items-center justify-center mb-3`, children: _jsx(Icon, { className: `w-5 h-5 text-${color}-400` }) }), _jsx("p", { className: "text-2xl font-bold text-white", children: val }), _jsx("p", { className: "text-slate-400 text-xs mt-0.5", children: label }), _jsx("p", { className: "text-slate-500 text-xs mt-0.5", children: sub })] }, label))) }), macro && (_jsxs("div", { className: "bg-gradient-to-br from-slate-900/80 to-blue-900/20 border border-blue-500/20 rounded-2xl p-6", children: [_jsxs("h2", { className: "text-white font-bold text-lg mb-5 flex items-center gap-2", children: [_jsx(BarChart3, { className: "w-5 h-5 text-blue-400" }), " Indicateurs Macro\u00E9conomiques CEMAC"] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
                            { label: 'PIB Proxy TERAS', val: fmtB(macro.gdp_proxy), color: 'sky' },
                            { label: 'Emplois formels déclarés', val: fmtN(macro.formal_jobs), color: 'emerald' },
                            { label: 'Inclusion financière', val: `${macro.inclusion_rate}%`, color: 'purple' },
                            { label: 'Score TERAS moyen global', val: macro.avg_enterprise_score, color: 'amber' },
                            { label: 'Volume crédits total', val: fmtB(macro.loan_total_volume), color: 'blue' },
                            { label: 'Taux d\'approbation', val: `${macro.approval_rate}%`, color: 'green' },
                            { label: 'Taux défaut', val: `${macro.default_rate}%`, color: 'red' },
                            { label: 'Acteurs économiques', val: fmtN(macro.total_actors), color: 'white' },
                        ].map(({ label, val, color }) => (_jsxs("div", { className: "bg-slate-800/40 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: label }), _jsx("p", { className: `text-${color === 'white' ? 'white' : color + '-400'} font-bold text-xl`, children: val })] }, label))) })] })), _jsxs("div", { children: [_jsxs("h2", { className: "text-white font-bold text-lg mb-4 flex items-center gap-2", children: [_jsx(MapPin, { className: "w-5 h-5 text-sky-400" }), " R\u00E9partition par Pays", _jsx("span", { className: "text-slate-500 text-sm font-normal ml-2", children: "Cliquez sur un pays pour l'analyse d\u00E9taill\u00E9e" })] }), _jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-4", children: countries.map((c) => {
                            const isSelected = selectedCountry === c.code;
                            const pct = maxRev > 0 ? Math.round((c.annual_revenue / maxRev) * 100) : 0;
                            return (_jsxs("div", { children: [_jsxs("button", { onClick: () => loadCountry(c.code), className: `w-full text-left p-5 rounded-2xl border transition-all ${isSelected
                                            ? 'bg-sky-500/15 border-sky-500/40 shadow-lg shadow-sky-500/10'
                                            : c.is_own_country
                                                ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50'
                                                : 'bg-slate-900/50 border-slate-800/50 hover:border-slate-600/50'}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-3xl", children: FLAG[c.code] || '🌍' }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "text-white font-bold text-sm", children: c.name }), c.is_own_country && _jsx("span", { className: "px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-medium", children: "Votre pays" }), !c.is_own_country && _jsx("span", { className: "px-1.5 py-0.5 bg-slate-700/50 text-slate-500 text-xs rounded-full", children: "Donn\u00E9es agr\u00E9g\u00E9es" })] }), _jsxs("p", { className: "text-slate-400 text-xs", children: [c.code, " \u00B7 ", c.enterprises, " entreprises \u00B7 ", c.individuals, " individus"] })] })] }), _jsx(ChevronRight, { className: `w-4 h-4 text-slate-500 transition-transform ${isSelected ? 'rotate-90' : ''}` })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 text-xs mb-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "Score moyen" }), _jsx("p", { className: `font-bold ${SCORE_COLOR(c.avg_score)}`, children: c.avg_score || '—' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "CA annuel" }), _jsx("p", { className: "text-white font-semibold", children: fmtB(c.annual_revenue) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "Emplois" }), _jsx("p", { className: "text-white font-semibold", children: fmtN(c.employees) })] })] }), _jsx(Bar, { pct: pct, color: c.avg_score >= 600 ? 'bg-emerald-500' : c.avg_score >= 400 ? 'bg-amber-500' : 'bg-red-400' }), _jsxs("p", { className: "text-slate-600 text-xs mt-1", children: [pct, "% du revenu total CEMAC"] })] }), isSelected && (_jsx("div", { className: "mt-2 bg-slate-900/80 border border-sky-500/20 rounded-2xl p-5 space-y-5", children: loadingDetail ? (_jsxs("div", { className: "flex items-center justify-center py-6 gap-2 text-slate-400", children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), " Chargement\u2026"] })) : countryDetail ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-3 gap-3", children: [
                                                        { l: 'Crédits totaux', v: countryDetail.loans?.total || 0, c: 'slate' },
                                                        { l: 'Volume actif', v: fmtB(countryDetail.loans?.active_volume || 0), c: 'emerald' },
                                                        { l: 'Taux approbation', v: `${Math.round((countryDetail.loans?.approved || 0) / Math.max(countryDetail.loans?.total || 1, 1) * 100)}%`, c: 'blue' },
                                                    ].map(({ l, v, c }) => (_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-3 text-center", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: l }), _jsx("p", { className: `text-${c === 'slate' ? 'white' : c + '-400'} font-bold`, children: v })] }, l))) }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs font-semibold mb-2", children: "Distribution Scores TERAS \u2014 Entreprises" }), _jsx("div", { className: "space-y-1.5", children: Object.entries(countryDetail.enterprises?.score_distribution || {}).map(([band, count], i) => {
                                                                const total = Object.values(countryDetail.enterprises?.score_distribution || {}).reduce((a, b) => a + b, 0) || 1;
                                                                const pct = Math.round((count / total) * 100);
                                                                return (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-xs mb-0.5", children: [_jsx("span", { className: "text-slate-400", children: band }), _jsxs("span", { className: "text-white font-medium", children: [count, " (", pct, "%)"] })] }), _jsx(Bar, { pct: pct, color: BAND_COLORS[i] || 'bg-slate-500' })] }, band));
                                                            }) })] }), countryDetail.enterprises?.top_enterprises?.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs font-semibold mb-2", children: "Top Entreprises par Score TERAS" }), _jsx("div", { className: "space-y-2", children: countryDetail.enterprises.top_enterprises.slice(0, 5).map((e, i) => (_jsxs("div", { className: "flex items-center justify-between py-2 border-b border-slate-800/40", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-slate-600 text-xs w-5", children: [i + 1, "."] }), _jsxs("div", { children: [_jsx("p", { className: "text-white text-sm font-medium", children: e.name }), _jsxs("p", { className: "text-slate-500 text-xs", children: [e.sector || e.enterprise_type, " \u00B7 ", e.city] })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: `font-bold ${SCORE_COLOR(e.teras_score)}`, children: e.teras_score }), _jsxs("p", { className: "text-slate-500 text-xs", children: [fmtB(e.annual_revenue), "/an"] })] })] }, e.id))) })] })), countryDetail.enterprises?.by_city?.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs font-semibold mb-2", children: "Activit\u00E9 par Ville" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: countryDetail.enterprises.by_city.slice(0, 4).map((city) => (_jsxs("div", { className: "bg-slate-800/30 rounded-xl p-2.5", children: [_jsx("p", { className: "text-white text-xs font-medium", children: city.city }), _jsxs("p", { className: "text-slate-400 text-xs", children: [city.count, " entr. \u00B7 Score: ", Math.round(city.avg_score || 0)] })] }, city.city))) })] })), countryDetail.loans?.trend_6months?.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs font-semibold mb-2", children: "Tendance Cr\u00E9dit (6 mois)" }), _jsx("div", { className: "flex items-end gap-2 h-16", children: countryDetail.loans.trend_6months.map((m) => {
                                                                const maxVol = Math.max(...countryDetail.loans.trend_6months.map((x) => x.volume), 1);
                                                                const h = maxVol > 0 ? Math.round((m.volume / maxVol) * 100) : 2;
                                                                return (_jsxs("div", { className: "flex-1 flex flex-col items-center gap-1", children: [_jsx("div", { className: "w-full bg-blue-500 rounded-sm", style: { height: `${Math.max(h, 4)}%`, minHeight: 4 } }), _jsx("p", { className: "text-slate-600 text-xs", style: { fontSize: 9 }, children: m.month.slice(0, 3) })] }, m.month));
                                                            }) })] }))] })) : detail?.restricted ? (_jsxs("div", { className: "bg-slate-800/40 rounded-xl p-6 text-center", children: [_jsx("p", { className: "text-3xl mb-2", children: "\uD83D\uDD12" }), _jsx("p", { className: "text-slate-300 font-medium text-sm", children: detail.message }), _jsxs("div", { className: "grid grid-cols-3 gap-3 mt-4 text-xs", children: [_jsxs("div", { className: "bg-slate-800/50 rounded-lg p-2.5", children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "Entreprises" }), _jsx("p", { className: "text-white font-bold text-base", children: detail.enterprises?.total || 0 })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-lg p-2.5", children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "Score moyen" }), _jsx("p", { className: "text-white font-bold text-base", children: detail.enterprises?.avg_score || '—' })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-lg p-2.5", children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "CA annuel" }), _jsx("p", { className: "text-white font-bold text-base", children: detail.enterprises?.annual_revenue ? (detail.enterprises.annual_revenue / 1e9).toFixed(1) + 'Md FCFA' : '—' })] })] })] })) : _jsx("p", { className: "text-slate-500 text-sm text-center py-4", children: "Donn\u00E9es non disponibles pour ce pays." }) }))] }, c.code));
                        }) })] }), _jsx(GovernmentUsersMap, {}), sectors?.sectors?.length > 0 && (_jsxs("div", { children: [_jsxs("h2", { className: "text-white font-bold text-lg mb-4 flex items-center gap-2", children: [_jsx(Briefcase, { className: "w-5 h-5 text-purple-400" }), " Secteurs \u00C9conomiques CEMAC"] }), _jsx("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-slate-800", children: ['Secteur', 'Entreprises', 'CA total', 'Emplois', 'Score moyen', 'Pays', 'Part du CA'].map(h => (_jsx("th", { className: `p-4 text-slate-400 font-medium ${h === 'Secteur' ? 'text-left' : 'text-right'}`, children: h }, h))) }) }), _jsx("tbody", { children: sectors.sectors.slice(0, 12).map((s, i) => {
                                            const totalRev = sectors.summary?.total_revenue || 1;
                                            const share = Math.round((s.revenue / totalRev) * 100);
                                            return (_jsxs("tr", { className: "border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors", children: [_jsx("td", { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-2 h-8 rounded-full ${BAND_COLORS[i % BAND_COLORS.length]}` }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-medium", children: s.label }), _jsxs("p", { className: "text-slate-500 text-xs", children: [s.country_count, " pays"] })] })] }) }), _jsx("td", { className: "p-4 text-right text-white", children: fmtN(s.count) }), _jsx("td", { className: "p-4 text-right text-white font-semibold", children: fmtB(s.revenue) }), _jsx("td", { className: "p-4 text-right text-slate-300", children: fmtN(s.employees) }), _jsx("td", { className: "p-4 text-right", children: _jsx("span", { className: `font-bold ${SCORE_COLOR(s.avg_score)}`, children: s.avg_score || '—' }) }), _jsx("td", { className: "p-4 text-right", children: _jsx("div", { className: "flex gap-1 justify-end", children: s.countries.map((c) => _jsx("span", { className: "text-base", children: FLAG[c] || '🌍' }, c)) }) }), _jsx("td", { className: "p-4 text-right", children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsxs("span", { className: "text-white font-semibold", children: [share, "%"] }), _jsx("div", { className: "w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full ${BAND_COLORS[i % BAND_COLORS.length]} rounded-full`, style: { width: `${share}%` } }) })] }) })] }, s.sector));
                                        }) })] }) }) })] })), compliance && (_jsxs("div", { children: [_jsxs("h2", { className: "text-white font-bold text-lg mb-4 flex items-center gap-2", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-400" }), " Alertes Conformit\u00E9", _jsx("span", { className: "px-2.5 py-0.5 bg-red-500 text-white text-xs rounded-full", children: compliance.total_at_risk }), _jsxs("span", { className: "text-slate-500 text-sm font-normal", children: ["Entreprises actives score < ", compliance.threshold] })] }), compliance.total_at_risk === 0 ? (_jsxs("div", { className: "bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center", children: [_jsx(Shield, { className: "w-12 h-12 text-emerald-400 mx-auto mb-3" }), _jsx("p", { className: "text-white font-semibold", children: "Aucune alerte \u2014 Tous les acteurs au-dessus du seuil" })] })) : (_jsxs("div", { className: "space-y-4", children: [compliance.by_country?.length > 0 && (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: compliance.by_country.map((c) => (_jsxs("div", { className: "bg-red-500/10 border border-red-500/20 rounded-xl p-3", children: [_jsx("p", { className: "text-white font-semibold text-sm", children: c.country }), _jsx("p", { className: "text-red-400 font-bold text-xl", children: c.count }), _jsxs("p", { className: "text-slate-500 text-xs", children: ["Score moyen: ", c.avg_score] })] }, c.country))) })), _jsx("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-slate-800", children: ['Entreprise', 'Pays', 'Secteur', 'Score TERAS', 'CA annuel', 'Risque'].map(h => (_jsx("th", { className: `p-3 text-slate-400 font-medium ${h === 'Entreprise' ? 'text-left' : 'text-center'}`, children: h }, h))) }) }), _jsx("tbody", { children: compliance.alerts?.slice(0, 10).map((a) => (_jsxs("tr", { className: "border-b border-slate-800/40 hover:bg-red-500/5 transition-colors", children: [_jsxs("td", { className: "p-3", children: [_jsx("p", { className: "text-white font-medium", children: a.name }), _jsx("p", { className: "text-slate-500 text-xs", children: a.city })] }), _jsx("td", { className: "p-3 text-center", children: _jsx("span", { className: "text-xl", children: FLAG[a.country] || '🌍' }) }), _jsx("td", { className: "p-3 text-center text-slate-300 text-xs", children: a.sector || '—' }), _jsx("td", { className: "p-3 text-center", children: _jsx("span", { className: `font-bold ${SCORE_COLOR(a.teras_score)}`, children: a.teras_score }) }), _jsx("td", { className: "p-3 text-center text-slate-300", children: fmtB(a.annual_revenue) }), _jsx("td", { className: "p-3 text-center", children: _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${a.risk_level === 'critique' ? 'bg-red-500/20 text-red-400' :
                                                                    a.risk_level === 'élevé' ? 'bg-orange-500/20 text-orange-400' :
                                                                        'bg-amber-500/20 text-amber-400'}`, children: a.risk_level }) })] }, a.id))) })] }) }) })] }))] })), _jsx("div", { className: "flex justify-center pb-4", children: _jsxs("button", { onClick: () => navigate('/government/reports'), className: "flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-sky-500/20", children: [_jsx(BarChart3, { className: "w-5 h-5" }), " G\u00E9n\u00E9rer un rapport IA complet \u2192"] }) })] }));
}
