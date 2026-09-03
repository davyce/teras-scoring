import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { authFetch } from '../../utils/authFetch';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Eye, User, RefreshCw, AlertCircle, TrendingUp, CreditCard, Copy, CheckCircle, } from 'lucide-react';
// ── Helpers ───────────────────────────────────────────────────────────────────
const BAND_COLOR = {
    A: 'emerald', B: 'green', C: 'blue', D: 'amber', E: 'red',
};
const STATUS_COLOR = {
    active: 'emerald', inactive: 'slate', suspended: 'red',
};
const STATUS_LABEL = {
    active: 'Actif', inactive: 'Inactif', suspended: 'Suspendu',
};
function formatFCFA(val) {
    const n = typeof val === 'string' ? parseFloat(val) : val;
    if (!n)
        return '0 FCFA';
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M FCFA`;
    if (n >= 1000)
        return `${Math.round(n / 1000)}k FCFA`;
    return `${n.toLocaleString('fr-FR')} FCFA`;
}
// ── Composant ─────────────────────────────────────────────────────────────────
export default function BankClients() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [filterScore, setFilterScore] = useState('all');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const loadClients = async () => {
        setLoading(true);
        setError(null);
        try {
            let url = `/api/scoring/bank/clients/?page=${page}`;
            if (search)
                url += `&search=${encodeURIComponent(search)}`;
            if (filterScore === 'high')
                url += '&score_min=700';
            if (filterScore === 'medium')
                url += '&score_min=600&score_max=699';
            if (filterScore === 'low')
                url += '&score_max=599';
            const res = await authFetch(url);
            if (!res.ok)
                throw new Error(`Erreur ${res.status}`);
            const json = await res.json();
            setClients(json.results ?? []);
            setTotal(json.count ?? 0);
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { loadClients(); }, [search, filterScore, page]);
    const copyToClipboard = async (text, id) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };
    // ── Stats ─────────────────────────────────────────────────────────────────
    const stats = {
        total,
        active: clients.filter(c => c.status === 'active').length,
        avgScore: clients.length
            ? Math.round(clients.filter(c => c.teras_score).reduce((s, c) => s + (c.teras_score || 0), 0) / Math.max(clients.filter(c => c.teras_score).length, 1))
            : 0,
        totalVolume: clients.reduce((s, c) => s + parseFloat(c.total_borrowed || '0'), 0),
    };
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Clients Particuliers" }), _jsxs("p", { className: "text-slate-400 mt-1", children: [total, " clients enregistr\u00E9s"] })] }), _jsxs("button", { onClick: () => navigate('/bank/clients/new'), className: "px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all flex items-center gap-2 text-sm", children: [_jsx(Plus, { className: "w-4 h-4" }), " Nouveau Client"] })] }), _jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
                    { label: 'Total Clients', value: total, icon: Users, color: 'blue' },
                    { label: 'Clients Actifs', value: stats.active, icon: User, color: 'emerald' },
                    { label: 'Score Moyen', value: stats.avgScore || '—', icon: TrendingUp, color: 'amber' },
                    { label: 'Volume Total', value: formatFCFA(stats.totalVolume), icon: CreditCard, color: 'purple' },
                ].map((s, i) => (_jsx("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-10 h-10 rounded-xl bg-${s.color}-500/20 flex items-center justify-center`, children: _jsx(s.icon, { className: `w-5 h-5 text-${s.color}-400` }) }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs", children: s.label }), _jsx("p", { className: "text-xl font-bold text-white", children: s.value })] })] }) }, i))) }), _jsx("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4", children: _jsxs("div", { className: "grid md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "md:col-span-2 relative", children: [_jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { type: "text", value: search, onChange: e => { setSearch(e.target.value); setPage(1); }, placeholder: "Rechercher par nom, NIU ou email\u2026", className: "w-full pl-11 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 text-sm" })] }), _jsxs("select", { value: filterScore, onChange: e => { setFilterScore(e.target.value); setPage(1); }, className: "px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 text-sm", children: [_jsx("option", { value: "all", children: "Tous les scores" }), _jsx("option", { value: "high", children: "Score \u00E9lev\u00E9 (\u2265700)" }), _jsx("option", { value: "medium", children: "Score moyen (600\u2013699)" }), _jsx("option", { value: "low", children: "Score faible (<600)" })] })] }) }), error && (_jsxs("div", { className: "bg-red-900/30 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-300 text-sm", children: [_jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }), " ", error, _jsxs("button", { onClick: loadClients, className: "ml-auto flex items-center gap-1 hover:text-red-100", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), " R\u00E9essayer"] })] })), _jsx("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden", children: loading ? (_jsxs("div", { className: "flex items-center justify-center py-16 text-slate-400 gap-3", children: [_jsx(RefreshCw, { className: "w-5 h-5 animate-spin text-blue-400" }), " Chargement\u2026"] })) : (_jsxs("div", { className: "overflow-x-auto", children: [_jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-slate-800", children: ['Client', 'NIU', 'Contact', 'Score TERAS', 'CRM', 'Crédits', 'Compte TERAS', 'Statut', ''].map(h => (_jsx("th", { className: "text-left p-4 text-slate-400 font-medium text-sm whitespace-nowrap", children: h }, h))) }) }), _jsx("tbody", { children: clients.map(client => {
                                        const band = client.teras_band || 'E';
                                        const bandCol = BAND_COLOR[band] || 'slate';
                                        const statusCol = STATUS_COLOR[client.status] || 'slate';
                                        return (_jsxs("tr", { className: "border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors", children: [_jsx("td", { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shrink-0", children: _jsxs("span", { className: "text-white text-xs font-bold", children: [client.first_name[0], client.last_name[0]] }) }), _jsxs("div", { children: [_jsxs("p", { className: "text-white font-medium text-sm", children: [client.first_name, " ", client.last_name] }), _jsxs("p", { className: "text-slate-500 text-xs", children: [client.city, ", ", client.country] })] })] }) }), _jsx("td", { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "text-slate-300 text-xs font-mono", children: client.niu }), _jsx("button", { onClick: () => copyToClipboard(client.niu, client.id), className: "text-slate-600 hover:text-slate-300 transition-colors", title: "Copier NIU", children: copiedId === client.id
                                                                    ? _jsx(CheckCircle, { className: "w-3 h-3 text-emerald-400" })
                                                                    : _jsx(Copy, { className: "w-3 h-3" }) })] }) }), _jsxs("td", { className: "p-4", children: [_jsx("p", { className: "text-slate-300 text-sm", children: client.email }), _jsx("p", { className: "text-slate-500 text-xs", children: client.phone })] }), _jsx("td", { className: "p-4", children: _jsxs("div", { className: "flex flex-col items-center gap-1", children: [_jsx("span", { className: "text-white font-semibold text-sm", children: client.teras_score ?? '—' }), client.teras_band && (_jsx("span", { className: `px-2 py-0.5 bg-${bandCol}-500/10 text-${bandCol}-400 text-xs rounded`, children: band }))] }) }), _jsx("td", { className: "p-4", children: _jsxs("span", { className: "text-emerald-400 text-sm font-medium", children: [formatFCFA(client.crm_limit), "/mois"] }) }), _jsxs("td", { className: "p-4 text-center", children: [_jsx("span", { className: "text-white text-sm", children: client.active_loans_count }), parseFloat(client.total_borrowed) > 0 && (_jsx("p", { className: "text-slate-500 text-xs", children: formatFCFA(client.total_borrowed) }))] }), _jsx("td", { className: "p-4", children: client.teras_account_email ? (_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(CheckCircle, { className: "w-3.5 h-3.5 text-emerald-400 shrink-0" }), _jsx("span", { className: "text-slate-400 text-xs truncate max-w-[120px]", children: client.teras_account_email })] })) : (_jsx("span", { className: "text-slate-600 text-xs", children: "Non cr\u00E9\u00E9" })) }), _jsx("td", { className: "p-4", children: _jsx("span", { className: `px-2.5 py-1 bg-${statusCol}-500/10 text-${statusCol}-400 text-xs rounded-lg`, children: STATUS_LABEL[client.status] || client.status }) }), _jsx("td", { className: "p-4", children: _jsx("button", { onClick: () => navigate(`/bank/clients/${client.id}`), className: "p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors", title: "Voir d\u00E9tails", children: _jsx(Eye, { className: "w-4 h-4" }) }) })] }, client.id));
                                    }) })] }), clients.length === 0 && !loading && (_jsxs("div", { className: "text-center py-12", children: [_jsx(Users, { className: "w-12 h-12 text-slate-600 mx-auto mb-3" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Aucun client trouv\u00E9" }), _jsxs("button", { onClick: () => navigate('/bank/clients/new'), className: "mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm flex items-center gap-2 mx-auto", children: [_jsx(Plus, { className: "w-4 h-4" }), " Cr\u00E9er le premier client"] })] }))] })) }), total > 20 && (_jsxs("div", { className: "flex items-center justify-between text-sm text-slate-400", children: [_jsxs("span", { children: ["Page ", page, " \u2014 ", Math.min(page * 20, total), "/", total, " clients"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1, className: "px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors", children: "\u2190 Pr\u00E9c\u00E9dent" }), _jsx("button", { onClick: () => setPage(p => p + 1), disabled: page * 20 >= total, className: "px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors", children: "Suivant \u2192" })] })] }))] }));
}
