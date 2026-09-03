import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// teras-frontend/src/pages/bank/BankApplicationsApproved.tsx
import { authFetch } from '../../utils/authFetch';
import DossierModal from '../../components/bank/DossierModal';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, DollarSign, FileText, RefreshCw, User, Building2, TrendingUp, AlertCircle, Search, Edit2, Save, X, Wallet, BarChart3, Clock, Package, } from 'lucide-react';
// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(val) {
    const n = typeof val === 'string' ? parseFloat(val) : val;
    if (!n || isNaN(n))
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
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
const STATUS_CFG = {
    approved: { label: 'En attente client', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    disbursed: { label: 'Actif / Décaissé', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
};
// ── Modal : Modifier montant réservé ─────────────────────────────────────────
function EditAmountModal({ app, onClose, onSave }) {
    const [amount, setAmount] = useState(app.requested_amount);
    const [duration, setDuration] = useState(app.duration_months);
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    // Calcul mensualité temps réel
    const rate = parseFloat(app.interest_rate || '10') / 100 / 12;
    const n = parseInt(duration);
    const amt = parseFloat(amount);
    const monthly = !isNaN(amt) && !isNaN(n) && n > 0
        ? (rate > 0 ? amt * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1) : amt / n)
        : 0;
    const handleSave = async () => {
        if (!reason.trim()) {
            setError('Le motif de modification est requis.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const res = await authFetch(`/api/scoring/bank/applications/${app.id}/update-amount/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requested_amount: parseFloat(amount),
                    duration_months: parseInt(duration),
                    reason,
                }),
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => { onSave(); onClose(); }, 1200);
            }
            else {
                const d = await res.json();
                setError(d.error || 'Erreur lors de la mise à jour');
            }
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setSaving(false);
        }
    };
    if (success)
        return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full text-center", children: [_jsx(CheckCircle, { className: "w-14 h-14 text-emerald-400 mx-auto mb-3" }), _jsx("h3", { className: "text-white font-bold text-lg", children: "Montant mis \u00E0 jour !" }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Le client sera notifi\u00E9 du changement." })] }) }));
    return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4", onClick: e => e.target === e.currentTarget && onClose(), children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md", children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-slate-800", children: [_jsxs("h3", { className: "text-white font-bold flex items-center gap-2", children: [_jsx(Edit2, { className: "w-4 h-4 text-sky-400" }), " Modifier le montant r\u00E9serv\u00E9"] }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-white text-xl", children: "\u2715" })] }), _jsxs("div", { className: "p-5 space-y-4", children: [_jsxs("div", { className: "bg-slate-800/40 rounded-xl p-3 text-xs space-y-1", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Dossier" }), _jsx("span", { className: "text-white", children: app.application_id })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Client" }), _jsx("span", { className: "text-white", children: app.client_name || app.enterprise_name })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Montant actuel" }), _jsx("span", { className: "text-amber-400 font-bold", children: fmt(app.requested_amount) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Nouveau montant accord\u00E9 (FCFA) *" }), _jsx("input", { type: "number", value: amount, onChange: e => setAmount(e.target.value), className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Dur\u00E9e (mois) *" }), _jsx("input", { type: "number", value: duration, onChange: e => setDuration(e.target.value), min: 1, max: 120, className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500" })] }), monthly > 0 && (_jsxs("div", { className: "bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 grid grid-cols-3 gap-3 text-xs", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 mb-0.5", children: "Mensualit\u00E9" }), _jsx("p", { className: "text-sky-400 font-bold", children: fmt(Math.round(monthly)) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 mb-0.5", children: "Total" }), _jsx("p", { className: "text-white font-semibold", children: fmt(Math.round(monthly * n)) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 mb-0.5", children: "Int\u00E9r\u00EAts" }), _jsx("p", { className: "text-amber-400", children: fmt(Math.round(monthly * n - amt)) })] })] })), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Motif de modification *" }), _jsx("textarea", { value: reason, onChange: e => setReason(e.target.value), rows: 2, placeholder: "Ex: Ajustement selon politique cr\u00E9dit Q2 2026, capacit\u00E9 CRM r\u00E9\u00E9valu\u00E9e...", className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 resize-none" })] }), error && _jsxs("p", { className: "text-red-400 text-xs flex items-center gap-1", children: [_jsx(AlertCircle, { className: "w-3.5 h-3.5" }), error] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm", children: "Annuler" }), _jsx("button", { onClick: handleSave, disabled: saving, className: "flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2", children: saving ? _jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), "Mise \u00E0 jour\u2026"] }) : _jsxs(_Fragment, { children: [_jsx(Save, { className: "w-4 h-4" }), "Enregistrer"] }) })] })] })] }) }));
}
// ── Composant principal ───────────────────────────────────────────────────────
export default function BankApplicationsApproved() {
    const navigate = useNavigate();
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [editing, setEditing] = useState(null);
    const [dossierApp, setDossierApp] = useState(null);
    // Stats réserve
    const [reserve, setReserve] = useState(50000000);
    const [editReserve, setEditReserve] = useState(false);
    const [newReserve, setNewReserve] = useState('');
    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch('/api/scoring/bank/applications/approved/');
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
        const q = search.toLowerCase();
        const matchSearch = !search || (a.client_name || '').toLowerCase().includes(q) ||
            (a.enterprise_name || '').toLowerCase().includes(q) || (a.application_id || '').includes(q);
        const matchFilter = filter === 'all' || a.status === filter;
        return matchSearch && matchFilter;
    });
    // Stats
    const totalEngaged = apps.filter(a => a.status === 'disbursed').reduce((s, a) => s + parseFloat(a.requested_amount || '0'), 0);
    const totalApproved = apps.filter(a => a.status === 'approved').reduce((s, a) => s + parseFloat(a.requested_amount || '0'), 0);
    const used = totalEngaged + totalApproved;
    const reservePct = reserve > 0 ? Math.min(Math.round((used / reserve) * 100), 100) : 0;
    const available = Math.max(reserve - used, 0);
    return (_jsxs("div", { className: "p-6 space-y-6", children: [dossierApp && _jsx(DossierModal, { app: dossierApp, onClose: () => setDossierApp(null) }), editing && _jsx(EditAmountModal, { app: editing, onClose: () => setEditing(null), onSave: load }), _jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-white flex items-center gap-3", children: [_jsx(CheckCircle, { className: "w-6 h-6 text-emerald-400" }), " Portefeuille Cr\u00E9dits"] }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Cr\u00E9dits approuv\u00E9s en attente d'acceptation + cr\u00E9dits actifs" })] }), _jsxs("button", { onClick: load, className: "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center gap-2 text-sm", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), " Actualiser"] })] }), _jsxs("div", { className: "bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-slate-700/50 rounded-2xl p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "text-white font-semibold flex items-center gap-2", children: [_jsx(Wallet, { className: "w-5 h-5 text-sky-400" }), " R\u00E9serve de Cr\u00E9dit Bancaire"] }), !editReserve ? (_jsxs("button", { onClick: () => { setEditReserve(true); setNewReserve(String(reserve)); }, className: "flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg text-xs font-medium transition-colors", children: [_jsx(Edit2, { className: "w-3.5 h-3.5" }), " Modifier le montant"] })) : (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "number", value: newReserve, onChange: e => setNewReserve(e.target.value), className: "w-40 px-3 py-1.5 bg-slate-800 border border-sky-500/50 rounded-lg text-white text-xs focus:outline-none" }), _jsx("button", { onClick: () => { setReserve(parseFloat(newReserve) || reserve); setEditReserve(false); }, className: "p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors", children: _jsx(Save, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => setEditReserve(false), className: "p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg", children: _jsx(X, { className: "w-4 h-4" }) })] }))] }), _jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex justify-between text-xs mb-2", children: [_jsx("span", { className: "text-slate-400", children: "Utilis\u00E9" }), _jsxs("span", { className: `font-semibold ${reservePct > 80 ? 'text-red-400' : reservePct > 60 ? 'text-amber-400' : 'text-emerald-400'}`, children: [reservePct, "% \u2014 ", fmt(used)] })] }), _jsx("div", { className: "h-3 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full transition-all duration-700 ${reservePct > 80 ? 'bg-red-500' : reservePct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`, style: { width: `${reservePct}%` } }) }), reservePct > 80 && (_jsxs("p", { className: "text-red-400 text-xs mt-1.5 flex items-center gap-1", children: [_jsx(AlertCircle, { className: "w-3.5 h-3.5" }), " Attention : r\u00E9serve utilis\u00E9e \u00E0 plus de 80%"] }))] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-3", children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: "R\u00E9serve totale" }), _jsx("p", { className: "text-white font-bold", children: fmt(reserve) })] }), _jsxs("div", { className: "bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20", children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: "Disponible" }), _jsx("p", { className: "text-emerald-400 font-bold", children: fmt(available) })] }), _jsxs("div", { className: "bg-amber-500/10 rounded-xl p-3 border border-amber-500/20", children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: "Engag\u00E9" }), _jsx("p", { className: "text-amber-400 font-bold", children: fmt(used) })] })] })] }), _jsx("div", { className: "grid grid-cols-4 gap-4", children: [
                    { label: 'Total dossiers', val: apps.length, color: 'slate', icon: BarChart3 },
                    { label: 'En attente client', val: apps.filter(a => a.status === 'approved').length, color: 'amber', icon: Clock },
                    { label: 'Actifs / Décaissés', val: apps.filter(a => a.status === 'disbursed').length, color: 'emerald', icon: CheckCircle },
                    { label: 'Encours total', val: fmt(totalEngaged), color: 'sky', icon: DollarSign },
                ].map(({ label, val, color, icon: Icon }) => (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 flex items-center gap-3", children: [_jsx("div", { className: `w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center shrink-0`, children: _jsx(Icon, { className: `w-5 h-5 text-${color}-400` }) }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs", children: label }), _jsx("p", { className: "text-white font-bold text-lg", children: val })] })] }, label))) }), _jsxs("div", { className: "flex gap-3 flex-wrap", children: [_jsxs("div", { className: "relative flex-1 min-w-48", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { value: search, onChange: e => setSearch(e.target.value), placeholder: "Rechercher client, dossier\u2026", className: "w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 text-sm" })] }), _jsx("div", { className: "flex gap-2", children: [['all', 'Tous'], ['approved', 'En attente client'], ['disbursed', 'Actifs']].map(([val, label]) => (_jsx("button", { onClick: () => setFilter(val), className: `px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === val ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-transparent'}`, children: label }, val))) })] }), error && (_jsxs("div", { className: "bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-300 text-sm", children: [_jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }), " ", error] })), loading ? (_jsxs("div", { className: "flex items-center justify-center py-16 text-slate-400 gap-3", children: [_jsx(RefreshCw, { className: "w-5 h-5 animate-spin text-emerald-400" }), " Chargement\u2026"] })) : filtered.length === 0 ? (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-16 text-center", children: [_jsx(Package, { className: "w-14 h-14 text-slate-600 mx-auto mb-4" }), _jsx("h3", { className: "text-white font-semibold text-lg mb-2", children: apps.length === 0 ? 'Aucun crédit approuvé' : 'Aucun résultat' }), _jsx("p", { className: "text-slate-400 text-sm", children: apps.length === 0 ? 'Les crédits approuvés apparaîtront ici.' : 'Modifiez votre recherche.' })] })) : (_jsx("div", { className: "space-y-3", children: filtered.map(app => {
                    const st = STATUS_CFG[app.status] || STATUS_CFG.approved;
                    const isIndividual = app.applicant_type === 'individual';
                    const score = app.teras_score_at_application;
                    return (_jsxs("div", { className: `border rounded-2xl p-5 transition-all ${app.status === 'disbursed' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900/50 border-slate-800/50 hover:border-amber-500/20'}`, children: [_jsxs("div", { className: "flex items-start justify-between gap-4 mb-4", children: [_jsxs("div", { className: "flex items-start gap-3 flex-1 min-w-0", children: [_jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isIndividual ? 'bg-blue-500/20' : 'bg-purple-500/20'}`, children: isIndividual ? _jsx(User, { className: "w-5 h-5 text-blue-400" }) : _jsx(Building2, { className: "w-5 h-5 text-purple-400" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("p", { className: "text-white font-semibold text-sm", children: app.client_name || app.enterprise_name || '—' }), _jsx("span", { className: "text-slate-500 text-xs", children: app.application_id })] }), _jsxs("p", { className: "text-slate-400 text-xs mt-0.5", children: [app.product_name, " \u00B7 ", fmtDate(app.created_at)] })] })] }), _jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [score && (_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-slate-500 text-xs", children: "Score" }), _jsx("p", { className: `font-bold text-sm ${score >= 700 ? 'text-emerald-400' : score >= 500 ? 'text-amber-400' : 'text-red-400'}`, children: score })] })), _jsx("span", { className: `px-3 py-1 rounded-full text-xs font-semibold border ${st.bg} ${st.color}`, children: st.label })] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3 text-sm mb-4", children: [_jsxs("div", { className: "bg-slate-800/40 rounded-xl p-3", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: "Montant accord\u00E9" }), _jsx("p", { className: "text-white font-bold text-base", children: fmt(app.requested_amount) })] }), _jsxs("div", { className: "bg-slate-800/40 rounded-xl p-3", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: "Mensualit\u00E9" }), _jsx("p", { className: `font-semibold ${app.status === 'disbursed' ? 'text-emerald-400' : 'text-white'}`, children: app.monthly_payment && parseFloat(app.monthly_payment) > 0 ? fmt(app.monthly_payment) : '—' })] }), _jsxs("div", { className: "bg-slate-800/40 rounded-xl p-3", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: "Dur\u00E9e" }), _jsxs("p", { className: "text-white font-semibold", children: [app.duration_months, " mois"] })] })] }), app.status === 'disbursed' && (_jsxs("div", { className: "bg-emerald-500/10 rounded-xl p-3 mb-4 flex items-center gap-3", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-emerald-400 shrink-0" }), _jsxs("div", { className: "text-xs", children: [_jsx("span", { className: "text-emerald-400 font-semibold", children: "Cr\u00E9dit actif" }), _jsxs("span", { className: "text-slate-400", children: [" \u00B7 Accept\u00E9 le ", fmtDate(app.reviewed_at || app.created_at)] })] })] })), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => setDossierApp(app), className: "px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-xl text-xs flex items-center gap-1.5 transition-colors font-medium", children: [_jsx(FileText, { className: "w-3.5 h-3.5" }), " Dossier complet"] }), app.status === 'approved' && (_jsxs("button", { onClick: () => setEditing({ ...app, interest_rate: app.product?.interest_rate || '10' }), className: "px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-sky-500/20", children: [_jsx(Edit2, { className: "w-3.5 h-3.5" }), " Modifier le montant"] })), app.status === 'disbursed' && (_jsx("div", { className: "flex-1 flex items-center justify-end", children: _jsxs("span", { className: "text-emerald-400 text-xs flex items-center gap-1.5", children: [_jsx(TrendingUp, { className: "w-3.5 h-3.5" }), "Remboursement en cours \u00B7 ", fmt(app.monthly_payment), "/mois"] }) })), app.status === 'approved' && (_jsx("div", { className: "flex-1 flex items-center justify-end", children: _jsxs("span", { className: "text-amber-400 text-xs flex items-center gap-1.5", children: [_jsx(Clock, { className: "w-3.5 h-3.5" }), "En attente d'acceptation par le client"] }) }))] })] }, app.id));
                }) }))] }));
}
