import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
//teras-frontend/src/pages/bank/BankApplicationsPending.tsx
import { authFetch } from '../../utils/authFetch';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, Eye, RefreshCw, User, Building2, DollarSign, AlertCircle, Search, FileText, } from 'lucide-react';
// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(val) {
    const n = typeof val === 'string' ? parseFloat(val) : val;
    if (!n)
        return '0 FCFA';
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M FCFA`;
    if (n >= 1000)
        return `${Math.round(n / 1000)}k FCFA`;
    return `${n.toLocaleString('fr-FR')} FCFA`;
}
function fmtDate(d) {
    if (!d)
        return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
// ── Modal de décision ─────────────────────────────────────────────────────────
function DecisionModal({ app, onClose, onDone, }) {
    const [decision, setDecision] = useState(null);
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async () => {
        if (!decision)
            return;
        if (decision === 'rejected' && !reason.trim()) {
            setError('La raison du rejet est obligatoire.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const res = await authFetch(`/api/scoring/bank/applications/${app.id}/review/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: decision, rejection_reason: reason }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(JSON.stringify(d));
            }
            setDone(true);
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setSaving(false);
        }
    };
    if (done)
        return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center", children: [decision === 'approved'
                        ? _jsx(CheckCircle, { className: "w-16 h-16 text-emerald-400 mx-auto mb-4" })
                        : _jsx(XCircle, { className: "w-16 h-16 text-red-400 mx-auto mb-4" }), _jsxs("h3", { className: "text-white font-bold text-xl mb-2", children: ["Demande ", decision === 'approved' ? 'approuvée' : 'rejetée'] }), _jsxs("p", { className: "text-slate-400 text-sm mb-6", children: [app.client_name || app.enterprise_name, " sera notifi\u00E9(e) de la d\u00E9cision."] }), _jsx("button", { onClick: () => { onDone(); onClose(); }, className: "px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm", children: "Fermer" })] }) }));
    return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg", children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-slate-800", children: [_jsxs("h3", { className: "text-white font-bold", children: ["D\u00E9cision \u2014 ", app.application_id] }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-white text-xl", children: "\u2715" })] }), _jsxs("div", { className: "p-6 space-y-5", children: [_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4 space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Client" }), _jsx("span", { className: "text-white font-medium", children: app.client_name || app.enterprise_name })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Produit" }), _jsx("span", { className: "text-white", children: app.product_name })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Montant" }), _jsx("span", { className: "text-white font-bold", children: fmt(app.requested_amount) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Dur\u00E9e" }), _jsxs("span", { className: "text-white", children: [app.duration_months, " mois"] })] }), app.monthly_payment && _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Mensualit\u00E9" }), _jsx("span", { className: "text-emerald-400 font-medium", children: fmt(app.monthly_payment) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Score TERAS" }), _jsx("span", { className: `font-medium ${app.teras_score_at_application >= 600 ? 'text-emerald-400' : 'text-amber-400'}`, children: app.teras_score_at_application ?? '—' })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("button", { onClick: () => setDecision('approved'), className: `py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all border ${decision === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-emerald-500/30'}`, children: [_jsx(CheckCircle, { className: "w-4 h-4" }), " Approuver"] }), _jsxs("button", { onClick: () => setDecision('rejected'), className: `py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all border ${decision === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-red-500/30'}`, children: [_jsx(XCircle, { className: "w-4 h-4" }), " Rejeter"] })] }), decision === 'rejected' && (_jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Motif du rejet *" }), _jsx("textarea", { value: reason, onChange: e => setReason(e.target.value), rows: 3, placeholder: "Ex: Score insuffisant, revenus insuffisants pour couvrir la mensualit\u00E9\u2026", className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 resize-none" })] })), error && _jsxs("p", { className: "text-red-400 text-xs flex items-center gap-1", children: [_jsx(AlertCircle, { className: "w-3.5 h-3.5" }), error] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: onClose, className: "px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm", children: "Annuler" }), _jsx("button", { onClick: handleSubmit, disabled: !decision || saving, className: `flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${decision === 'approved' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                                        decision === 'rejected' ? 'bg-red-500 hover:bg-red-600 text-white' :
                                            'bg-slate-700 text-slate-400'}`, children: saving ? _jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), " Traitement\u2026"] }) :
                                        decision === 'approved' ? _jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "w-4 h-4" }), " Confirmer l'approbation"] }) :
                                            decision === 'rejected' ? _jsxs(_Fragment, { children: [_jsx(XCircle, { className: "w-4 h-4" }), " Confirmer le rejet"] }) :
                                                'Choisir une décision' })] })] })] }) }));
}
// ── Composant principal ───────────────────────────────────────────────────────
export default function BankApplicationsPending() {
    const navigate = useNavigate();
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch('/api/scoring/bank/applications/pending/');
            if (!res.ok)
                throw new Error(`Erreur ${res.status}`);
            const json = await res.json();
            setApps(Array.isArray(json) ? json : json.results ?? []);
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);
    const filtered = apps.filter(a => {
        if (!search)
            return true;
        const q = search.toLowerCase();
        return (a.client_name || '').toLowerCase().includes(q) ||
            (a.enterprise_name || '').toLowerCase().includes(q) ||
            (a.application_id || '').toLowerCase().includes(q) ||
            (a.product_name || '').toLowerCase().includes(q);
    });
    const stats = {
        total: apps.length,
        volume: apps.reduce((s, a) => s + parseFloat(a.requested_amount || '0'), 0),
        avgScore: apps.length ? Math.round(apps.filter(a => a.teras_score_at_application).reduce((s, a) => s + (a.teras_score_at_application || 0), 0) / Math.max(apps.filter(a => a.teras_score_at_application).length, 1)) : 0,
    };
    return (_jsxs("div", { className: "p-6 space-y-6", children: [selected && _jsx(DecisionModal, { app: selected, onClose: () => setSelected(null), onDone: load }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-white flex items-center gap-3", children: [_jsx(Clock, { className: "w-6 h-6 text-amber-400" }), "Demandes En Attente"] }), _jsxs("p", { className: "text-slate-400 mt-1 text-sm", children: [stats.total, " demandes \u00E0 traiter \u00B7 Volume : ", fmt(stats.volume)] })] }), _jsxs("button", { onClick: load, className: "flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), " Actualiser"] })] }), _jsx("div", { className: "grid grid-cols-3 gap-4", children: [
                    { label: 'En attente', val: stats.total, color: 'amber', icon: Clock },
                    { label: 'Volume total', val: fmt(stats.volume), color: 'blue', icon: DollarSign },
                    { label: 'Score moyen', val: stats.avgScore || '—', color: 'emerald', icon: FileText },
                ].map(({ label, val, color, icon: Icon }) => (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 flex items-center gap-3", children: [_jsx("div", { className: `w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center shrink-0`, children: _jsx(Icon, { className: `w-5 h-5 text-${color}-400` }) }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs", children: label }), _jsx("p", { className: "text-white font-bold text-lg", children: val })] })] }, label))) }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { value: search, onChange: e => setSearch(e.target.value), placeholder: "Rechercher par client, produit, ID\u2026", className: "w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-slate-800/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-sm" })] }), error && (_jsxs("div", { className: "bg-red-900/30 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-300 text-sm", children: [_jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }), " ", error, _jsxs("button", { onClick: load, className: "ml-auto flex items-center gap-1 hover:text-red-100", children: [_jsx(RefreshCw, { className: "w-3.5 h-3.5" }), " R\u00E9essayer"] })] })), loading ? (_jsxs("div", { className: "flex items-center justify-center py-16 text-slate-400 gap-3", children: [_jsx(RefreshCw, { className: "w-5 h-5 animate-spin text-amber-400" }), " Chargement\u2026"] })) : filtered.length === 0 ? (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-16 text-center", children: [_jsx(CheckCircle, { className: "w-14 h-14 text-emerald-400/50 mx-auto mb-4" }), _jsx("h3", { className: "text-white font-semibold text-lg mb-2", children: apps.length === 0 ? 'Aucune demande en attente' : 'Aucun résultat' }), _jsx("p", { className: "text-slate-400 text-sm", children: apps.length === 0 ? 'Toutes les demandes ont été traitées.' : 'Modifiez votre recherche.' })] })) : (_jsx("div", { className: "space-y-3", children: filtered.map(app => {
                    const isIndividual = app.applicant_type === 'individual';
                    const score = app.teras_score_at_application;
                    const scoreColor = !score ? 'slate' : score >= 700 ? 'emerald' : score >= 500 ? 'amber' : 'red';
                    const canOpenDossier = Boolean((isIndividual && app.client) || (!isIndividual && app.enterprise));
                    return (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 hover:border-amber-500/20 rounded-2xl p-5 transition-all", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex items-start gap-4 flex-1 min-w-0", children: [_jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isIndividual ? 'bg-blue-500/20' : 'bg-purple-500/20'}`, children: isIndividual
                                                    ? _jsx(User, { className: `w-5 h-5 text-blue-400` })
                                                    : _jsx(Building2, { className: `w-5 h-5 text-purple-400` }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("p", { className: "text-white font-semibold text-sm", children: app.client_name || app.enterprise_name || '—' }), _jsx("span", { className: `px-2 py-0.5 text-xs rounded-full ${isIndividual ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`, children: isIndividual ? 'Particulier' : 'Entreprise' }), _jsx("span", { className: "text-slate-500 text-xs", children: app.application_id })] }), _jsxs("p", { className: "text-slate-400 text-xs mt-0.5", children: [app.product_name, " \u00B7 D\u00E9pos\u00E9e le ", fmtDate(app.created_at)] })] })] }), _jsxs("div", { className: "text-center shrink-0", children: [_jsx("p", { className: "text-slate-400 text-xs mb-0.5", children: "Score" }), _jsx("span", { className: `text-${scoreColor}-400 font-bold text-base`, children: score ?? '—' })] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3 mt-4 text-sm", children: [_jsxs("div", { className: "bg-slate-800/30 rounded-lg p-3", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: "Montant demand\u00E9" }), _jsx("p", { className: "text-white font-bold", children: fmt(app.requested_amount) })] }), _jsxs("div", { className: "bg-slate-800/30 rounded-lg p-3", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: "Mensualit\u00E9" }), _jsx("p", { className: "text-white font-semibold", children: app.monthly_payment ? fmt(app.monthly_payment) : '—' })] }), _jsxs("div", { className: "bg-slate-800/30 rounded-lg p-3", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: "Dur\u00E9e" }), _jsxs("p", { className: "text-white font-semibold", children: [app.duration_months, " mois"] })] })] }), _jsxs("div", { className: "flex gap-3 mt-4", children: [_jsxs("button", { onClick: () => {
                                            if (isIndividual && app.client)
                                                navigate(`/bank/clients/${app.client}`);
                                            else if (app.enterprise)
                                                navigate(`/bank/enterprises/${app.enterprise}`);
                                        }, disabled: !canOpenDossier, className: "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed", children: [_jsx(Eye, { className: "w-3.5 h-3.5" }), " Voir le dossier"] }), _jsxs("button", { onClick: () => setSelected(app), className: "flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors", children: [_jsx(Clock, { className: "w-4 h-4" }), " Traiter la demande"] })] })] }, app.id));
                }) }))] }));
}
