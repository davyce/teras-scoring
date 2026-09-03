import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/enterprise/EnterpriseClientDetail.tsx
// ✅ Connecté à l'API Django
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, AlertCircle, ArrowLeft, FileText } from "lucide-react";
import enterpriseApi from "../../services/enterpriseApi";
const riskLabel = (r) => ({ low: 'Faible', medium: 'Moyen', high: 'Élevé' }[r] || r);
const riskColor = (r) => {
    if (r === 'low')
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    if (r === 'medium')
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
};
const bandLabel = (s) => s >= 900 ? 'A' : s >= 750 ? 'B' : s >= 600 ? 'C' : s >= 400 ? 'D' : 'E';
const bandColor = (s) => s >= 750 ? 'text-emerald-400' : s >= 600 ? 'text-sky-400' : s >= 400 ? 'text-amber-400' : 'text-rose-400';
const EnterpriseClientDetail = () => {
    const { id } = useParams();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const load = async () => {
            try {
                const data = await enterpriseApi.getClient(Number(id));
                setClient(data);
            }
            catch (e) {
                setError(e.message);
            }
            finally {
                setLoading(false);
            }
        };
        if (id)
            load();
    }, [id]);
    if (loading)
        return (_jsx("div", { className: "min-h-screen bg-slate-950 flex items-center justify-center", children: _jsx(Loader2, { className: "w-8 h-8 animate-spin text-cyan-400" }) }));
    if (error || !client)
        return (_jsxs("div", { className: "min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center gap-4", children: [_jsx(AlertCircle, { className: "w-10 h-10 text-rose-400" }), _jsx("p", { className: "text-slate-400", children: error || 'Client introuvable' }), _jsx(Link, { to: "/enterprise/clients", className: "text-sm text-cyan-400 hover:text-cyan-300", children: "\u2190 Retour \u00E0 la liste" })] }));
    const score = client.teras_score || 0;
    return (_jsx("div", { className: "min-h-screen bg-slate-950 text-slate-50 p-6", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsxs(Link, { to: "/enterprise/clients", className: "flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-3 transition-colors", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), " Retour au portefeuille"] }), _jsx("p", { className: "text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1", children: "TERAS Entreprise" }), _jsx("h1", { className: "text-2xl font-black text-white", children: client.name }), _jsxs("p", { className: "text-sm text-slate-400 mt-0.5", children: [client.client_type_display || client.client_type, " \u00B7 ", client.kyc_id || `#${client.id}`] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "md:col-span-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center", children: [_jsx("p", { className: "text-xs text-slate-500 mb-2", children: "Score TERAS" }), _jsx("p", { className: `text-6xl font-black ${bandColor(score)}`, children: score }), _jsx("p", { className: "text-slate-500 text-sm mt-1", children: "/ 1000" }), _jsxs("div", { className: `mt-3 px-3 py-1 rounded-full text-xs font-bold border ${riskColor(client.risk_level)}`, children: ["Bande ", bandLabel(score), " \u00B7 Risque ", riskLabel(client.risk_level)] })] }), _jsx("div", { className: "md:col-span-2 grid grid-cols-2 gap-4", children: [
                                { label: 'Statut', value: client.status === 'active' ? '✓ Actif' : client.status_display || client.status, color: client.status === 'active' ? 'text-emerald-400' : 'text-slate-400' },
                                { label: 'Type de client', value: client.client_type_display || client.client_type, color: 'text-slate-200' },
                                { label: 'Réf. interne', value: client.internal_ref || '—', color: 'text-slate-300' },
                                { label: 'Créé le', value: new Date(client.created_at).toLocaleDateString('fr-FR'), color: 'text-slate-300' },
                            ].map((item, i) => (_jsxs("div", { className: "bg-slate-900/60 border border-slate-800 rounded-xl p-4", children: [_jsx("p", { className: "text-xs text-slate-500 mb-1", children: item.label }), _jsx("p", { className: `text-sm font-semibold ${item.color}`, children: item.value })] }, i))) })] }), client.notes && (_jsxs("div", { className: "bg-slate-900/60 border border-slate-800 rounded-2xl p-5", children: [_jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-widest mb-2", children: "Notes" }), _jsx("p", { className: "text-sm text-slate-300 leading-relaxed", children: client.notes })] })), _jsxs("div", { className: "bg-slate-900/60 border border-slate-800 rounded-2xl p-5", children: [_jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-widest mb-3", children: "Documents associ\u00E9s" }), _jsxs("div", { className: "flex items-center gap-3 text-slate-500", children: [_jsx(FileText, { className: "w-5 h-5" }), _jsx("p", { className: "text-sm", children: "Les relev\u00E9s bancaires, mobile money et bulletins de salaire utilis\u00E9s pour ce dossier seront affich\u00E9s ici." })] })] }), _jsxs("p", { className: "text-xs text-slate-600 text-center", children: ["Derni\u00E8re mise \u00E0 jour : ", new Date(client.updated_at).toLocaleString('fr-FR')] })] }) }));
};
export default EnterpriseClientDetail;
