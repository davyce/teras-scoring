import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { authFetch } from '../../utils/authFetch';
import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Users, Activity, PieChart, BarChart3, Target, AlertCircle, CheckCircle, XCircle, Clock, RefreshCw, Wallet, Shield, } from 'lucide-react';
// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtM = (n) => {
    if (!n)
        return '0';
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)
        return `${Math.round(n / 1000)}k`;
    return n.toLocaleString('fr-FR');
};
const fmtFCFA = (n) => `${fmtM(n)} FCFA`;
const BAND_COLORS = ['bg-emerald-500', 'bg-green-500', 'bg-blue-500', 'bg-amber-500', 'bg-red-500'];
// ── Composant principal ───────────────────────────────────────────────────────
export default function BankAnalytics() {
    const [period, setPeriod] = useState('month');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const load = async (p = period) => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch(`/api/scoring/bank/analytics/?period=${p}`);
            if (!res.ok)
                throw new Error(`Erreur ${res.status}`);
            const json = await res.json();
            setData(json);
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(period); }, [period]);
    if (loading)
        return (_jsxs("div", { className: "flex items-center justify-center h-96 gap-3 text-slate-400", children: [_jsx(RefreshCw, { className: "w-6 h-6 animate-spin text-sky-400" }), " Chargement des analytics\u2026"] }));
    if (error || !data)
        return (_jsxs("div", { className: "flex flex-col items-center justify-center h-96 gap-4", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-red-400" }), _jsx("p", { className: "text-red-400", children: error || 'Données indisponibles' }), _jsx("button", { onClick: () => load(), className: "px-4 py-2 bg-slate-800 text-white rounded-xl text-sm", children: "R\u00E9essayer" })] }));
    const overview = data.overview || {};
    const counts = data.counts || {};
    const risk = data.riskMetrics || {};
    const trends = data.trends || {};
    const scoreD = data.scoreDistribution || [];
    const products = data.productPerformance || [];
    const volumes = data.volumesByMonth || [];
    const totalVol = products.reduce((s, p) => s + p.volume, 0) || 1;
    const kpis = [
        {
            label: 'Portefeuille Total', value: fmtFCFA(overview.portfolioValue || 0),
            sub: `${counts.active_loans || 0} crédits actifs`, color: 'emerald', icon: Wallet,
        },
        {
            label: 'Clients Enregistrés', value: counts.total_clients || 0,
            sub: `Score moyen : ${counts.avg_score || '—'}`, color: 'blue', icon: Users,
        },
        {
            label: 'Taux d\'Approbation', value: `${counts.approval_rate || 0}%`,
            sub: `${counts.approved_count || 0} approuvés / ${counts.rejected_count || 0} rejetés`, color: 'amber', icon: Target,
        },
        {
            label: 'En Attente', value: counts.pending_count || 0,
            sub: 'Dossiers à traiter', color: 'purple', icon: Clock,
        },
    ];
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "Analytics & Rapports" }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Donn\u00E9es r\u00E9elles du portefeuille bancaire TERAS" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("select", { value: period, onChange: e => setPeriod(e.target.value), className: "px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500", children: [_jsx("option", { value: "week", children: "7 derniers jours" }), _jsx("option", { value: "month", children: "30 derniers jours" }), _jsx("option", { value: "quarter", children: "Trimestre" }), _jsx("option", { value: "year", children: "Ann\u00E9e" })] }), _jsx("button", { onClick: () => load(period), className: "p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors", children: _jsx(RefreshCw, { className: "w-4 h-4" }) })] })] }), _jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: kpis.map(({ label, value, sub, color, icon: Icon }) => (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5", children: [_jsx("div", { className: "flex items-center justify-between mb-3", children: _jsx("div", { className: `w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center`, children: _jsx(Icon, { className: `w-5 h-5 text-${color}-400` }) }) }), _jsx("p", { className: "text-slate-400 text-xs mb-1", children: label }), _jsx("p", { className: "text-2xl font-bold text-white", children: value }), _jsx("p", { className: "text-slate-500 text-xs mt-1", children: sub })] }, label))) }), _jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-5", children: [_jsx(BarChart3, { className: "w-5 h-5 text-blue-400" }), _jsx("h3", { className: "text-white font-semibold", children: "Volume Mensuel" }), _jsx("span", { className: "ml-auto text-slate-500 text-xs", children: "6 derniers mois" })] }), volumes.length === 0 ? (_jsx("div", { className: "flex items-center justify-center h-32 text-slate-500 text-sm", children: "Aucune donn\u00E9e sur la p\u00E9riode" })) : (_jsx("div", { className: "space-y-3", children: volumes.map((item, idx) => {
                                    const maxVol = Math.max(...volumes.map((v) => v.volume), 1);
                                    const pct = Math.round((item.volume / maxVol) * 100);
                                    return (_jsx("div", { children: _jsxs("div", { className: "flex items-center justify-between mb-1 text-sm", children: [_jsx("span", { className: "text-slate-300 w-10", children: item.month }), _jsx("div", { className: "flex-1 mx-3", children: _jsx("div", { className: "h-2.5 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-700", style: { width: `${pct}%` } }) }) }), _jsxs("div", { className: "text-right w-28", children: [_jsx("span", { className: "text-white font-semibold", children: fmtFCFA(item.volume) }), item.loans > 0 && _jsxs("span", { className: "text-slate-500 text-xs ml-1", children: ["(", item.loans, ")"] })] })] }) }, idx));
                                }) })), volumes.length === 0 && (_jsx("p", { className: "text-slate-500 text-xs text-center mt-2", children: "Les cr\u00E9dits approuv\u00E9s alimenteront ce graphique" }))] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-5", children: [_jsx(PieChart, { className: "w-5 h-5 text-emerald-400" }), _jsx("h3", { className: "text-white font-semibold", children: "Distribution Score TERAS" }), _jsxs("span", { className: "ml-auto text-slate-500 text-xs", children: [counts.total_clients || 0, " clients"] })] }), scoreD.every((s) => s.count === 0) ? (_jsxs("div", { className: "flex items-center justify-center h-32 text-slate-500 text-sm flex-col gap-2", children: [_jsx(Shield, { className: "w-8 h-8 text-slate-700" }), "Aucun score calcul\u00E9 encore"] })) : (_jsx("div", { className: "space-y-3", children: scoreD.map((item, idx) => (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-1 text-sm", children: [_jsx("span", { className: "text-slate-300", children: item.band }), _jsxs("span", { className: "text-white font-semibold", children: [item.count, " ", _jsxs("span", { className: "text-slate-500 font-normal", children: ["(", item.percentage, "%)"] })] })] }), _jsx("div", { className: "h-2 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full ${BAND_COLORS[idx] || 'bg-slate-500'} rounded-full transition-all duration-700`, style: { width: `${item.percentage}%` } }) })] }, idx))) }))] })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-5", children: [_jsx(TrendingUp, { className: "w-5 h-5 text-purple-400" }), _jsx("h3", { className: "text-white font-semibold", children: "Performance par Produit" })] }), products.filter((p) => p.count > 0).length === 0 ? (_jsxs("div", { className: "flex items-center justify-center h-24 text-slate-500 text-sm flex-col gap-2", children: [_jsx(Activity, { className: "w-8 h-8 text-slate-700" }), "Aucun cr\u00E9dit accord\u00E9 pour le moment"] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-slate-800", children: ['Produit', 'Volume', 'Nb crédits', 'Ticket moyen', 'Taux', 'Part marché'].map(h => (_jsx("th", { className: `p-3 text-slate-400 font-medium ${h === 'Produit' ? 'text-left' : 'text-right'}`, children: h }, h))) }) }), _jsx("tbody", { children: products.map((p, idx) => {
                                        const share = p.volume > 0 ? ((p.volume / totalVol) * 100).toFixed(1) : '0';
                                        return (_jsxs("tr", { className: "border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors", children: [_jsx("td", { className: "p-3", children: _jsx("p", { className: "text-white font-medium", children: p.product }) }), _jsx("td", { className: "p-3 text-right", children: _jsx("p", { className: "text-white font-semibold", children: fmtFCFA(p.volume) }) }), _jsx("td", { className: "p-3 text-right", children: _jsx("span", { className: "px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg", children: p.count }) }), _jsx("td", { className: "p-3 text-right", children: _jsx("p", { className: "text-slate-300", children: fmtFCFA(p.avgTicket) }) }), _jsx("td", { className: "p-3 text-right", children: _jsxs("span", { className: "px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-lg", children: [p.rate, "%"] }) }), _jsx("td", { className: "p-3 text-right", children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsxs("span", { className: "text-white font-semibold", children: [share, "%"] }), _jsx("div", { className: "w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full", style: { width: `${share}%` } }) })] }) })] }, idx));
                                    }) })] }) }))] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-5", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-400" }), _jsx("h3", { className: "text-white font-semibold", children: "M\u00E9triques de Risque" })] }), _jsx("div", { className: "space-y-3", children: [
                                    { label: 'Santé du Portefeuille', val: `${risk.portfolioHealth || 0}%`, icon: CheckCircle, color: 'emerald' },
                                    { label: 'Taux de Défaut', val: `${risk.defaultRate || 0}%`, icon: XCircle, color: 'red' },
                                    { label: 'Taux de Collecte estimé', val: `${risk.collectionRate || 0}%`, icon: DollarSign, color: 'blue' },
                                    { label: 'Délai moyen traitement', val: `${risk.avgDelay || 0}j`, icon: Clock, color: 'amber' },
                                    { label: 'Provisions (5%)', val: fmtFCFA(risk.provisions || 0), icon: AlertCircle, color: 'orange' },
                                ].map(({ label, val, icon: Icon, color }) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-800/30 rounded-xl", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Icon, { className: `w-4 h-4 text-${color}-400` }), _jsx("span", { className: "text-slate-300 text-sm", children: label })] }), _jsx("span", { className: "text-white font-bold", children: val })] }, label))) })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-5", children: [_jsx(TrendingUp, { className: "w-5 h-5 text-cyan-400" }), _jsx("h3", { className: "text-white font-semibold", children: "Indicateurs Cl\u00E9s" })] }), _jsx("div", { className: "space-y-3", children: [
                                    { label: 'Taux d\'Approbation', val: `${trends.approvalRate || 0}%`, icon: CheckCircle, color: 'emerald' },
                                    { label: 'Délai traitement moyen', val: `${trends.avgProcessingTime || 0}j`, icon: Clock, color: 'blue' },
                                    { label: 'Satisfaction estimée', val: `${trends.customerSatisfaction || 0}/5`, icon: Target, color: 'amber' },
                                    { label: 'Score TERAS moyen', val: counts.avg_score || '—', icon: Shield, color: 'purple' },
                                    { label: 'Clients avec score', val: counts.total_clients || 0, icon: Users, color: 'sky' },
                                ].map(({ label, val, icon: Icon, color }) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-800/30 rounded-xl", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Icon, { className: `w-4 h-4 text-${color}-400` }), _jsx("span", { className: "text-slate-300 text-sm", children: label })] }), _jsx("span", { className: "text-white font-bold", children: val })] }, label))) })] })] })] }));
}
