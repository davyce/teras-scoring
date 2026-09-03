import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/bank/BankDashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Users, TrendingUp, Activity, Clock, CheckCircle, ArrowUpRight, ArrowDownRight, BarChart3, CreditCard, AlertCircle, RefreshCw, } from 'lucide-react';
// ─── authFetch inline (compatible avec les deux chemins du projet) ─────────────
async function apiFetch(url) {
    const token = localStorage.getItem('teras_access_token') ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('token');
    return fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
}
// ─── Données mock (fallback si backend indisponible) ─────────────────────────
const MOCK = {
    total_clients: 1247, clients_growth: 15.8,
    active_loans: 156, loans_growth: 18.2,
    portfolio_value: 145000000, portfolio_growth: 23.5,
    avg_score: 704, score_growth: 12.3,
    recent_applications: [
        { id: 1, application_id: 'APP-001', client_name: 'Marie Kanda', enterprise_name: null, requested_amount: 1200000, status: 'pending' },
        { id: 2, application_id: 'APP-002', client_name: 'Jean Mukendi', enterprise_name: null, requested_amount: 2500000, status: 'approved' },
        { id: 3, application_id: 'APP-003', client_name: 'Paul Nzambi', enterprise_name: null, requested_amount: 4200000, status: 'pending' },
        { id: 4, application_id: 'APP-004', client_name: null, enterprise_name: 'Restaurant Le Fleuve', requested_amount: 3500000, status: 'approved' },
        { id: 5, application_id: 'APP-005', client_name: 'Alice Mbemba', enterprise_name: null, requested_amount: 800000, status: 'review' },
    ],
    top_products: [
        { name: 'Crédit Immobilier', volume: 45000000, count: 12, color: 'blue' },
        { name: 'Crédit PME', volume: 38000000, count: 24, color: 'green' },
        { name: 'Crédit Auto', volume: 28000000, count: 35, color: 'purple' },
    ],
    portfolio_health: { on_time_rate: 87.2, late_rate: 4.5, collection_rate: 94.8, avg_roi: 11.5 },
};
// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_COLOR = {
    pending: 'orange', approved: 'green', review: 'blue', rejected: 'red', disbursed: 'emerald',
};
const STATUS_LABEL = {
    pending: 'En attente', approved: 'Approuvé', review: 'En révision',
    rejected: 'Rejeté', disbursed: 'Décaissé',
};
function fmtCFA(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' CFA'; }
function fmtM(n) {
    if (n >= 1000000)
        return (n / 1000000).toFixed(1) + 'M CFA';
    if (n >= 1000)
        return (n / 1000).toFixed(0) + 'k CFA';
    return fmtCFA(n);
}
// ─── Composant ───────────────────────────────────────────────────────────────
export default function BankDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(MOCK);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMock, setIsMock] = useState(false);
    const [lastSync, setLastSync] = useState(new Date());
    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiFetch('/api/scoring/bank/dashboard/');
            if (res.ok) {
                const d = await res.json();
                setData({ ...MOCK, ...d });
                setIsMock(false);
            }
            else {
                // Backend répond mais erreur (403, 404…) → mock + message
                setData(MOCK);
                setIsMock(true);
                if (res.status === 403)
                    setError('Accès refusé — connectez-vous avec un compte banque.');
                else
                    setError(`Backend: erreur ${res.status} — données de démonstration affichées.`);
            }
        }
        catch {
            // Pas de réseau → mock silencieux
            setData(MOCK);
            setIsMock(true);
        }
        setLastSync(new Date());
        setLoading(false);
    };
    useEffect(() => { load(); }, []);
    const kpis = [
        { label: 'Total Clients', value: data.total_clients.toLocaleString('fr-FR'), growth: data.clients_growth, icon: Users, color: 'blue', path: '/bank/clients' },
        { label: 'Crédits Actifs', value: String(data.active_loans), growth: data.loans_growth, icon: Activity, color: 'green', path: '/bank/applications/pending' },
        { label: 'Valeur Portefeuille', value: fmtM(data.portfolio_value), growth: data.portfolio_growth, icon: DollarSign, color: 'emerald', path: '/bank/portfolio' },
        { label: 'Score TERAS Moyen', value: String(data.avg_score), growth: data.score_growth, icon: TrendingUp, color: 'amber', path: '/bank/analytics' },
    ];
    return (_jsxs("div", { className: "p-8 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Dashboard Banque" }), _jsxs("p", { className: "text-slate-400 mt-1", children: ["Vue d'ensemble du portefeuille TERAS", isMock && _jsx("span", { className: "ml-2 px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs rounded-full border border-amber-500/20", children: "D\u00E9mo" }), !isMock && _jsxs("span", { className: "ml-2 text-slate-500 text-xs", children: ["\u00B7 ", lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })] })] })] }), _jsxs("button", { onClick: load, disabled: loading, className: "flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:text-white rounded-xl transition-all disabled:opacity-50", children: [_jsx(RefreshCw, { className: `w-4 h-4 ${loading ? 'animate-spin' : ''}` }), "Actualiser"] })] }), error && (_jsxs("div", { className: "flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400", children: [_jsx(AlertCircle, { className: "w-5 h-5 flex-shrink-0" }), _jsx("p", { className: "text-sm", children: error })] })), _jsx("div", { className: "grid grid-cols-4 gap-4", children: kpis.map((k) => (_jsxs("div", { onClick: () => navigate(k.path), className: `bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 hover:border-${k.color}-500/30 transition-all cursor-pointer ${loading ? 'opacity-60' : ''}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("div", { className: `w-12 h-12 rounded-xl bg-${k.color}-500/20 flex items-center justify-center`, children: _jsx(k.icon, { className: `w-6 h-6 text-${k.color}-400` }) }), k.growth !== 0 && (_jsxs("div", { className: `flex items-center gap-1 text-sm ${k.growth > 0 ? 'text-green-400' : 'text-red-400'}`, children: [k.growth > 0 ? _jsx(ArrowUpRight, { className: "w-4 h-4" }) : _jsx(ArrowDownRight, { className: "w-4 h-4" }), _jsxs("span", { className: "font-semibold", children: [Math.abs(k.growth).toFixed(1), "%"] })] }))] }), _jsx("p", { className: "text-slate-400 text-sm mb-1", children: k.label }), _jsx("p", { className: "text-3xl font-bold text-white", children: k.value })] }, k.label))) }), _jsx("div", { className: "grid grid-cols-4 gap-4", children: [
                    { label: 'Nouveau Client', sub: 'Créer un profil', icon: Users, color: 'blue', path: '/bank/clients/new' },
                    { label: 'Demandes en Attente', sub: 'À traiter', icon: Clock, color: 'orange', path: '/bank/applications/pending' },
                    { label: 'Simulateur Crédit', sub: 'Calculer une offre', icon: CreditCard, color: 'purple', path: '/bank/simulator' },
                    { label: 'Analytics', sub: 'Rapports & stats', icon: BarChart3, color: 'cyan', path: '/bank/analytics' },
                ].map((a) => (_jsx("button", { onClick: () => navigate(a.path), className: `bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-4 hover:border-${a.color}-500/50 hover:bg-slate-800/50 transition-all group text-left`, children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-10 h-10 rounded-xl bg-${a.color}-500/20 group-hover:bg-${a.color}-500/30 flex items-center justify-center transition-all`, children: _jsx(a.icon, { className: `w-5 h-5 text-${a.color}-400` }) }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-medium", children: a.label }), _jsx("p", { className: "text-slate-400 text-sm", children: a.sub })] })] }) }, a.label))) }), _jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-white font-semibold text-xl", children: "Demandes R\u00E9centes" }), _jsx("button", { onClick: () => navigate('/bank/applications/pending'), className: "text-sky-400 hover:text-sky-300 text-sm font-medium", children: "Voir tout \u2192" })] }), _jsx("div", { className: "space-y-3", children: data.recent_applications.map((app) => {
                                    const sc = STATUS_COLOR[app.status] ?? 'slate';
                                    const name = app.client_name ?? app.enterprise_name ?? '—';
                                    return (_jsxs("div", { onClick: () => navigate('/bank/applications/pending'), className: "flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-all cursor-pointer", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-2 h-2 rounded-full bg-${sc}-400` }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-medium", children: name }), _jsxs("p", { className: "text-slate-400 text-sm", children: [fmtCFA(app.requested_amount), " \u00B7 ", app.application_id] })] })] }), _jsx("span", { className: `px-3 py-1 bg-${sc}-500/10 text-${sc}-400 text-xs rounded-lg`, children: STATUS_LABEL[app.status] ?? app.status })] }, app.id));
                                }) })] }), _jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-white font-semibold text-xl", children: "Produits Performants" }), _jsx("button", { onClick: () => navigate('/bank/products'), className: "text-sky-400 hover:text-sky-300 text-sm font-medium", children: "Voir tout \u2192" })] }), _jsx("div", { className: "space-y-4", children: data.top_products.map((p, idx) => {
                                    const total = data.top_products.reduce((s, x) => s + x.volume, 0);
                                    const pct = total > 0 ? ((p.volume / total) * 100).toFixed(1) : '0';
                                    const color = p.color ?? ['blue', 'green', 'purple', 'amber'][idx % 4];
                                    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-3 h-3 rounded-full bg-${color}-500` }), _jsx("span", { className: "text-white font-medium", children: p.name })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-white font-semibold", children: fmtM(p.volume) }), _jsxs("p", { className: "text-slate-400 text-xs", children: [p.count, " cr\u00E9dits"] })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex-1 h-2 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full bg-${color}-500 rounded-full transition-all`, style: { width: `${pct}%` } }) }), _jsxs("span", { className: "text-slate-400 text-sm w-12 text-right", children: [pct, "%"] })] })] }, idx));
                                }) }), _jsxs("button", { onClick: () => navigate('/bank/products/create'), className: "w-full mt-4 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-xl transition-all flex items-center justify-center gap-2", children: [_jsx(CreditCard, { className: "w-4 h-4" }), "Cr\u00E9er un Nouveau Produit"] })] })] }), _jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h2", { className: "text-white font-semibold text-xl mb-4", children: "Sant\u00E9 du Portefeuille" }), _jsx("div", { className: "grid grid-cols-4 gap-4", children: [
                            { icon: CheckCircle, color: 'green', value: `${data.portfolio_health.on_time_rate}%`, label: 'À jour' },
                            { icon: Clock, color: 'orange', value: `${data.portfolio_health.late_rate}%`, label: 'En retard' },
                            { icon: DollarSign, color: 'blue', value: `${data.portfolio_health.collection_rate}%`, label: 'Taux collecte' },
                            { icon: TrendingUp, color: 'amber', value: `${data.portfolio_health.avg_roi}%`, label: 'ROI moyen' },
                        ].map((item, i) => (_jsxs("div", { className: "text-center p-4 bg-slate-800/30 rounded-xl", children: [_jsx("div", { className: `w-12 h-12 rounded-full bg-${item.color}-500/20 flex items-center justify-center mx-auto mb-2`, children: _jsx(item.icon, { className: `w-6 h-6 text-${item.color}-400` }) }), _jsx("p", { className: "text-2xl font-bold text-white mb-1", children: item.value }), _jsx("p", { className: "text-slate-400 text-sm", children: item.label })] }, i))) })] })] }));
}
