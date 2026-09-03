import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { authFetch } from '../../utils/authFetch';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, Eye, Search, AlertTriangle, TrendingDown, Users, User, } from 'lucide-react';
export default function BankApplicationsRejected() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterReason, setFilterReason] = useState('all');
    const [applications, setApplications] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    React.useEffect(() => {
        (async () => {
            try {
                const res = await authFetch('/api/scoring/bank/applications/rejected/');
                if (!res.ok)
                    throw new Error(`Erreur ${res.status}`);
                const json = await res.json();
                setApplications(Array.isArray(json) ? json : (json.applications ?? json.data ?? []));
            }
            catch (e) {
                setError(e.message);
            }
            finally {
                setLoading(false);
            }
        })();
    }, []);
    const reasons = {
        score_insufficient: 'Score TERAS insuffisant',
        capacity_exceeded: 'Capacité de remboursement dépassée',
        documents_incomplete: 'Documents incomplets',
        credit_history: 'Historique crédit négatif',
        fraud_suspicion: 'Suspicion de fraude',
    };
    const getReasonColor = (reason) => {
        const colors = {
            score_insufficient: 'orange',
            capacity_exceeded: 'red',
            documents_incomplete: 'amber',
            credit_history: 'red',
            fraud_suspicion: 'red',
        };
        return colors[reason] || 'slate';
    };
    const getBandColor = (band) => {
        const colors = {
            'A+': 'emerald',
            'A': 'green',
            'B': 'blue',
            'C': 'amber',
            'D': 'orange',
            'E': 'red',
        };
        return colors[band] || 'slate';
    };
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR').format(amount);
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    const filteredApplications = applications.filter(app => {
        const matchSearch = app.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchReason = filterReason === 'all' || app.reason === filterReason;
        return matchSearch && matchReason;
    });
    const stats = {
        total: applications.length,
        totalAmount: applications.reduce((sum, a) => sum + a.amount, 0),
        avgScore: Math.round(applications.reduce((sum, a) => sum + a.score, 0) / applications.length),
        mainReason: 'score_insufficient',
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Demandes Rejet\u00E9es" }), _jsxs("p", { className: "text-slate-400 mt-1", children: [stats.total, " demandes rejet\u00E9es"] })] }), _jsxs("div", { className: "grid grid-cols-4 gap-4", children: [_jsx("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center", children: _jsx(XCircle, { className: "w-5 h-5 text-red-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm", children: "Total Rejet\u00E9es" }), _jsx("p", { className: "text-2xl font-bold text-white", children: stats.total })] })] }) }), _jsx("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center", children: _jsx(TrendingDown, { className: "w-5 h-5 text-orange-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm", children: "Score Moyen" }), _jsx("p", { className: "text-2xl font-bold text-white", children: stats.avgScore })] })] }) }), _jsx("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center", children: _jsx(AlertTriangle, { className: "w-5 h-5 text-amber-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm", children: "Montant Refus\u00E9" }), _jsxs("p", { className: "text-2xl font-bold text-white", children: [(stats.totalAmount / 1000000).toFixed(1), "M"] })] })] }) }), _jsx("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center", children: _jsx(Users, { className: "w-5 h-5 text-slate-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm", children: "Raison Principale" }), _jsx("p", { className: "text-sm font-semibold text-white", children: "Score insuffisant" })] })] }) })] }), _jsx("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: _jsxs("div", { className: "grid md:grid-cols-3 gap-4", children: [_jsx("div", { className: "md:col-span-2", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" }), _jsx("input", { type: "text", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), placeholder: "Rechercher par nom ou num\u00E9ro...", className: "w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20" })] }) }), _jsx("div", { children: _jsxs("select", { value: filterReason, onChange: (e) => setFilterReason(e.target.value), className: "w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20", children: [_jsx("option", { value: "all", children: "Toutes les raisons" }), Object.entries(reasons).map(([key, label]) => (_jsx("option", { value: key, children: label }, key)))] }) })] }) }), _jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl overflow-hidden", children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-800", children: [_jsx("th", { className: "text-left p-4 text-slate-400 font-medium", children: "Demande" }), _jsx("th", { className: "text-left p-4 text-slate-400 font-medium", children: "Client" }), _jsx("th", { className: "text-left p-4 text-slate-400 font-medium", children: "Produit" }), _jsx("th", { className: "text-right p-4 text-slate-400 font-medium", children: "Montant" }), _jsx("th", { className: "text-center p-4 text-slate-400 font-medium", children: "Score" }), _jsx("th", { className: "text-left p-4 text-slate-400 font-medium", children: "Raison" }), _jsx("th", { className: "text-left p-4 text-slate-400 font-medium", children: "Rejet\u00E9 Le" }), _jsx("th", { className: "text-center p-4 text-slate-400 font-medium", children: "Actions" })] }) }), _jsx("tbody", { children: filteredApplications.map((app) => (_jsxs("tr", { className: "border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors", children: [_jsx("td", { className: "p-4", children: _jsx("p", { className: "text-white font-medium", children: app.id }) }), _jsx("td", { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center", children: _jsx(User, { className: "w-5 h-5 text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-medium", children: app.clientName }), _jsx("p", { className: "text-slate-400 text-sm", children: app.clientId })] })] }) }), _jsxs("td", { className: "p-4", children: [_jsx("p", { className: "text-white", children: app.productType }), _jsxs("p", { className: "text-slate-400 text-sm", children: [app.duration, " mois"] })] }), _jsx("td", { className: "p-4 text-right", children: _jsxs("p", { className: "text-white font-semibold", children: [formatCurrency(app.amount), " CFA"] }) }), _jsx("td", { className: "p-4 text-center", children: _jsxs("div", { className: "flex flex-col items-center gap-1", children: [_jsx("span", { className: "text-white font-semibold", children: app.score }), _jsx("span", { className: `px-2 py-0.5 bg-${getBandColor(app.band)}-500/10 text-${getBandColor(app.band)}-400 text-xs rounded`, children: app.band })] }) }), _jsxs("td", { className: "p-4", children: [_jsx("span", { className: `px-3 py-1 bg-${getReasonColor(app.reason)}-500/10 text-${getReasonColor(app.reason)}-400 text-sm rounded-lg inline-block`, children: reasons[app.reason] }), _jsx("p", { className: "text-slate-400 text-xs mt-1", children: app.comments })] }), _jsxs("td", { className: "p-4", children: [_jsx("p", { className: "text-slate-300 text-sm", children: formatDate(app.rejectedAt) }), _jsxs("p", { className: "text-slate-400 text-xs", children: ["Par ", app.rejectedBy] })] }), _jsx("td", { className: "p-4", children: _jsx("div", { className: "flex items-center justify-center gap-2", children: _jsx("button", { onClick: () => navigate(`/bank/clients/${app.clientId}`), className: "p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors", title: "Voir d\u00E9tails", children: _jsx(Eye, { className: "w-4 h-4" }) }) }) })] }, app.id))) })] }) }), filteredApplications.length === 0 && (_jsxs("div", { className: "text-center py-12", children: [_jsx(XCircle, { className: "w-16 h-16 text-slate-600 mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "Aucune demande rejet\u00E9e" })] }))] }), _jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h3", { className: "text-white font-semibold mb-4", children: "R\u00E9partition par Raison de Rejet" }), _jsx("div", { className: "space-y-3", children: Object.entries(reasons).map(([key, label]) => {
                            const count = applications.filter(a => a.reason === key).length;
                            const percentage = (count / applications.length) * 100;
                            return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-slate-300 text-sm", children: label }), _jsxs("span", { className: "text-white font-semibold", children: [count, " (", percentage.toFixed(0), "%)"] })] }), _jsx("div", { className: "h-2 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full bg-${getReasonColor(key)}-500 rounded-full transition-all`, style: { width: `${percentage}%` } }) })] }, key));
                        }) })] })] }));
}
