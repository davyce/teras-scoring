import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/enterprise/EnterpriseClientsList.tsx
// ✅ Connecté à l'API Django
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, AlertCircle, Plus, RefreshCw } from "lucide-react";
import enterpriseApi from "../../services/enterpriseApi";
const riskBadge = (risk) => {
    if (risk === 'low')
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    if (risk === 'medium')
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
};
const riskLabel = (risk) => ({ low: 'Faible', medium: 'Moyen', high: 'Élevé' }[risk] || risk);
const bandColor = (score) => score >= 750 ? 'text-emerald-400' : score >= 600 ? 'text-sky-400' : score >= 400 ? 'text-amber-400' : 'text-rose-400';
const EnterpriseClientsList = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await enterpriseApi.getClients();
            setClients(Array.isArray(data) ? data : []);
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);
    const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.kyc_id || '').toLowerCase().includes(search.toLowerCase()));
    return (_jsx("div", { className: "min-h-screen bg-slate-950 text-slate-50 px-4 py-8", children: _jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [_jsxs("header", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1", children: "TERAS Entreprise" }), _jsx("h1", { className: "text-2xl md:text-3xl font-black text-white", children: "Portefeuille clients" }), _jsxs("p", { className: "text-sm text-slate-400 mt-1", children: [clients.length, " client", clients.length > 1 ? 's' : '', " analys\u00E9", clients.length > 1 ? 's' : ''] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: load, className: "flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm transition-all", children: [_jsx(RefreshCw, { className: "w-3.5 h-3.5" }), " Actualiser"] }), _jsxs(Link, { to: "/enterprise/new-case", className: "flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-medium transition-all", children: [_jsx(Plus, { className: "w-4 h-4" }), " Nouveau client"] })] })] }), _jsx("input", { value: search, onChange: e => setSearch(e.target.value), placeholder: "Rechercher par nom ou KYC ID...", className: "w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-600" }), error && (_jsxs("div", { className: "flex items-center gap-2 px-4 py-3 bg-rose-900/20 border border-rose-800 rounded-xl text-rose-300 text-sm", children: [_jsx(AlertCircle, { className: "w-4 h-4 flex-shrink-0" }), " ", error] })), _jsx("section", { className: "bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "bg-slate-900/80 border-b border-slate-800", children: _jsxs("tr", { className: "text-left text-xs uppercase tracking-widest text-slate-500", children: [_jsx("th", { className: "px-5 py-3", children: "Client" }), _jsx("th", { className: "px-5 py-3", children: "Type" }), _jsx("th", { className: "px-5 py-3", children: "Score TERAS" }), _jsx("th", { className: "px-5 py-3", children: "Risque" }), _jsx("th", { className: "px-5 py-3", children: "Statut" }), _jsx("th", { className: "px-5 py-3 text-right", children: "Actions" })] }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsxs("td", { colSpan: 6, className: "px-5 py-10 text-center", children: [_jsx(Loader2, { className: "w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" }), _jsx("p", { className: "text-slate-500 text-sm", children: "Chargement..." })] }) })) : filtered.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-5 py-10 text-center text-slate-500 text-sm", children: search ? 'Aucun résultat pour cette recherche.' : 'Aucun client enregistré.' }) })) : filtered.map((cl) => (_jsxs("tr", { className: "border-t border-slate-800/60 hover:bg-slate-800/20 transition-colors", children: [_jsxs("td", { className: "px-5 py-3.5", children: [_jsx("div", { className: "font-semibold text-slate-100", children: cl.name }), _jsx("div", { className: "text-xs text-slate-500 mt-0.5", children: cl.kyc_id || `#${cl.id}` })] }), _jsx("td", { className: "px-5 py-3.5 text-slate-300 text-sm", children: cl.client_type_display || cl.client_type }), _jsxs("td", { className: "px-5 py-3.5", children: [_jsx("span", { className: `font-bold text-base ${bandColor(cl.teras_score || 0)}`, children: cl.teras_score || '—' }), _jsx("span", { className: "text-slate-600 text-xs ml-1", children: "/1000" })] }), _jsx("td", { className: "px-5 py-3.5", children: _jsx("span", { className: `inline-flex px-2.5 py-0.5 rounded-full border text-xs font-medium ${riskBadge(cl.risk_level)}`, children: riskLabel(cl.risk_level) }) }), _jsx("td", { className: "px-5 py-3.5", children: _jsx("span", { className: `text-xs ${cl.status === 'active' ? 'text-emerald-400' : 'text-slate-400'}`, children: cl.status === 'active' ? '● Actif' : '○ ' + (cl.status_display || cl.status) }) }), _jsx("td", { className: "px-5 py-3.5 text-right", children: _jsx(Link, { to: `/enterprise/clients/${cl.id}`, className: "text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors", children: "D\u00E9tails \u2192" }) })] }, cl.id))) })] }) }) })] }) }));
};
export default EnterpriseClientsList;
