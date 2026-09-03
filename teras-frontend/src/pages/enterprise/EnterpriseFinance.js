import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// teras-frontend/src/pages/enterprise/EnterpriseFinance.tsx
import { useState, useEffect } from 'react';
import { authFetch } from '../../services/authFetch';
import { MessageCircle, DollarSign, Package, Calculator, CheckCircle, XCircle, Clock, RefreshCw, AlertCircle, Send, Info, ChevronDown, ChevronUp, MailOpen, Shield, Calendar, Star, ArrowRight, Zap, } from 'lucide-react';
const fmt = (v) => {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    if (!n || isNaN(n))
        return '0 FCFA';
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M FCFA`;
    if (n >= 1000)
        return `${Math.round(n / 1000)}k FCFA`;
    return `${n.toLocaleString('fr-FR')} FCFA`;
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }); };
async function readApiPayload(res) {
    const text = await res.text();
    if (!text)
        return {};
    try {
        return JSON.parse(text);
    }
    catch {
        const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
        return {
            error: isHtml
                ? `Le serveur a renvoyé une page HTML (${res.status}).`
                : text.slice(0, 300),
        };
    }
}
function apiErrorMessage(payload, fallback) {
    if (!payload)
        return fallback;
    if (typeof payload === 'string')
        return payload;
    if (payload.error)
        return String(payload.error);
    if (payload.detail)
        return String(payload.detail);
    if (payload.message)
        return String(payload.message);
    return fallback;
}
const TYPE_ICON = { microcredit: '💰', personal: '💳', salary: '🏛', auto: '🚗', immobilier: '🏠', pme: '🏢', agricole: '🌾', education: '📚', other: '📦' };
const MSG_CFG = {
    info: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', Icon: Info },
    offer: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', Icon: Package },
    reminder: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', Icon: Clock },
    alert: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', Icon: AlertCircle },
};
function ApplyModal({ product, onClose, onDone }) {
    const [amount, setAmount] = useState('');
    const [duration, setDuration] = useState('');
    const [purpose, setPurpose] = useState('');
    const [sim, setSim] = useState(null);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (!amount || !duration) {
            setSim(null);
            return;
        }
        const rate = parseFloat(product.interest_rate) / 100 / 12;
        const n = parseInt(duration);
        const amt = parseFloat(amount);
        if (isNaN(amt) || isNaN(n) || n <= 0)
            return;
        const monthly = rate > 0 ? amt * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1) : amt / n;
        setSim({ monthly: Math.round(monthly), total: Math.round(monthly * n), interest: Math.round(monthly * n - amt) });
    }, [amount, duration, product]);
    const submit = async () => {
        if (!amount || !duration || !purpose) {
            setError('Tous les champs sont requis');
            return;
        }
        setSending(true);
        setError('');
        try {
            const res = await authFetch('/api/scoring/enterprise/my-applications/request/', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: product.id, requested_amount: amount, duration_months: parseInt(duration), purpose }),
            });
            const payload = await readApiPayload(res);
            if (!res.ok) {
                throw new Error(apiErrorMessage(payload, `Erreur ${res.status}`));
            }
            setSuccess(true);
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setSending(false);
        }
    };
    if (success)
        return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-[#0d1829] border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center", children: [_jsx(CheckCircle, { className: "w-16 h-16 text-emerald-400 mx-auto mb-4" }), _jsx("h3", { className: "text-white font-bold text-xl mb-2", children: "Demande envoy\u00E9e !" }), _jsxs("p", { className: "text-slate-400 text-sm mb-6", children: ["Votre demande de ", _jsx("strong", { className: "text-white", children: product.name }), " a \u00E9t\u00E9 transmise. R\u00E9ponse sous 24\u201348h."] }), _jsx("button", { onClick: () => { onDone(); onClose(); }, className: "px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm", children: "Fermer" })] }) }));
    return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4", onClick: e => e.target === e.currentTarget && onClose(), children: _jsxs("div", { className: "bg-[#0d1829] border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-[#0d1829]", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs", children: "Demande de financement" }), _jsx("h3", { className: "text-white font-bold", children: product.name })] }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-white", children: "\u2715" })] }), _jsxs("div", { className: "p-5 space-y-4", children: [_jsxs("div", { className: "bg-slate-800/40 rounded-xl p-3 grid grid-cols-3 gap-2 text-xs", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "Taux" }), _jsxs("p", { className: "text-white font-semibold", children: [product.interest_rate, "%/an"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "Montant" }), _jsxs("p", { className: "text-white font-semibold", children: [fmt(product.min_amount), "\u2013", fmt(product.max_amount)] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "Dur\u00E9e" }), _jsxs("p", { className: "text-white font-semibold", children: [product.min_duration_months, "\u2013", product.max_duration_months, " mois"] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1 block", children: "Montant (FCFA) *" }), _jsx("input", { type: "number", value: amount, onChange: e => setAmount(e.target.value), placeholder: `Max: ${fmt(product.max_amount)}`, className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1 block", children: "Dur\u00E9e (mois) *" }), _jsxs("select", { value: duration, onChange: e => setDuration(e.target.value), className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500", children: [_jsx("option", { value: "", children: "Choisir" }), Array.from({ length: product.max_duration_months - product.min_duration_months + 1 }, (_, i) => product.min_duration_months + i)
                                            .filter(m => m <= 6 || m % 3 === 0 || m === product.max_duration_months).slice(0, 10)
                                            .map(m => _jsxs("option", { value: m, children: [m, " mois"] }, m))] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1 block", children: "Objet du financement *" }), _jsx("textarea", { value: purpose, onChange: e => setPurpose(e.target.value), rows: 2, placeholder: "Ex: Achat d'\u00E9quipements, extension des locaux, fonds de roulement...", className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 resize-none" })] }), sim && (_jsxs("div", { className: "bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 grid grid-cols-3 gap-2 text-xs", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 mb-0.5", children: "Mensualit\u00E9" }), _jsx("p", { className: "text-white font-bold text-base", children: fmt(sim.monthly) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 mb-0.5", children: "Total" }), _jsx("p", { className: "text-white", children: fmt(sim.total) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 mb-0.5", children: "Int\u00E9r\u00EAts" }), _jsx("p", { className: "text-amber-400", children: fmt(sim.interest) })] })] })), error && _jsxs("p", { className: "text-red-400 text-xs flex items-center gap-1", children: [_jsx(AlertCircle, { className: "w-3.5 h-3.5" }), error] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm", children: "Annuler" }), _jsx("button", { onClick: submit, disabled: sending, className: "flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2", children: sending ? _jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), "Envoi\u2026"] }) : _jsxs(_Fragment, { children: [_jsx(Send, { className: "w-4 h-4" }), "Envoyer"] }) })] })] })] }) }));
}
export default function EnterpriseFinance() {
    const [tab, setTab] = useState('credits');
    const [messages, setMessages] = useState([]);
    const [applications, setApps] = useState([]);
    const [summary, setSummary] = useState({});
    const [products, setProducts] = useState([]);
    const [profile, setProfile] = useState(null);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [applying, setApplying] = useState(null);
    const [accepting, setAccepting] = useState(null);
    const [declining, setDeclining] = useState(null);
    const [actionMsg, setActionMsg] = useState(null);
    const [simProduct, setSimProduct] = useState('');
    const [simAmount, setSimAmount] = useState('');
    const [simDuration, setSimDuration] = useState('');
    const [simResult, setSimResult] = useState(null);
    const load = async () => {
        setLoading(true);
        await Promise.all([
            authFetch('/api/scoring/enterprise/bank-messages/').then(r => r.json()).then(d => { setMessages(d.messages || []); setUnread(d.unread_count || 0); }).catch(() => { }),
            authFetch('/api/scoring/enterprise/my-applications/').then(r => r.json()).then(d => { setApps(d.applications || []); setSummary(d.summary || {}); }).catch(() => { }),
            authFetch('/api/scoring/enterprise/products/').then(r => r.json()).then(d => setProducts(Array.isArray(d) ? d : [])).catch(() => { }),
            authFetch('/api/scoring/enterprise/bank-profile/').then(r => r.json()).then(d => setProfile(d)).catch(() => { }),
        ]);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);
    const markRead = async (id) => {
        await authFetch(`/api/scoring/enterprise/bank-messages/${id}/read/`, { method: 'POST' });
        setMessages(p => p.map(m => m.id === id ? { ...m, is_read: true } : m));
        setUnread(p => Math.max(0, p - 1));
    };
    const handleAccept = async (appId) => {
        setAccepting(appId);
        setActionMsg(null);
        try {
            const res = await authFetch(`/api/scoring/enterprise/my-applications/${appId}/accept/`, { method: 'POST' });
            const payload = await readApiPayload(res);
            if (res.ok) {
                setActionMsg({ text: apiErrorMessage(payload, '✅ Financement accepté ! Virement sous 24–48h.'), ok: true });
                load();
            }
            else {
                setActionMsg({ text: `❌ ${apiErrorMessage(payload, `Erreur ${res.status}`)}`, ok: false });
            }
        }
        catch (e) {
            setActionMsg({ text: `❌ ${e.message}`, ok: false });
        }
        finally {
            setAccepting(null);
        }
    };
    const handleDecline = async (appId) => {
        setDeclining(appId);
        try {
            const res = await authFetch(`/api/scoring/enterprise/my-applications/${appId}/decline/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: "Refus entreprise" }) });
            const payload = await readApiPayload(res);
            if (!res.ok)
                throw new Error(apiErrorMessage(payload, `Erreur ${res.status}`));
            setActionMsg({ text: apiErrorMessage(payload, 'Demande annulée.'), ok: true });
            load();
        }
        catch (e) {
            setActionMsg({ text: `❌ ${e.message}`, ok: false });
        }
        finally {
            setDeclining(null);
        }
    };
    const selectedProduct = products.find(p => String(p.id) === simProduct);
    const runSim = () => {
        if (!selectedProduct || !simAmount || !simDuration)
            return;
        const rate = parseFloat(selectedProduct.interest_rate) / 100 / 12;
        const n = parseInt(simDuration);
        const amt = parseFloat(simAmount);
        const fees = amt * (parseFloat(selectedProduct.origination_fee || '1.5') / 100);
        const monthly = rate > 0 ? amt * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1) : amt / n;
        setSimResult({ monthly: Math.round(monthly), total: Math.round(monthly * n), interest: Math.round(monthly * n - amt), fees: Math.round(fees) });
    };
    const approvedApps = applications.filter(a => a.status === 'approved');
    const activeApps = applications.filter(a => a.status === 'disbursed');
    const pendingApps = applications.filter(a => ['pending', 'review'].includes(a.status));
    return (_jsxs("div", { className: "min-h-screen bg-[#0b1220] p-4 md:p-6", children: [applying && _jsx(ApplyModal, { product: applying, onClose: () => setApplying(null), onDone: load }), _jsxs("div", { className: "max-w-3xl mx-auto space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-white flex items-center gap-3", children: [_jsx(DollarSign, { className: "w-6 h-6 text-sky-400" }), "Financement Entreprise"] }), _jsx("p", { className: "text-slate-400 text-sm mt-0.5", children: "Cr\u00E9dits, produits financiers et communications bancaires" })] }), _jsx("button", { onClick: load, className: "p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white", children: _jsx(RefreshCw, { className: "w-4 h-4" }) })] }), profile?.has_bank_profile && (_jsxs("div", { className: "bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 flex items-center gap-4", children: [_jsx(Shield, { className: "w-8 h-8 text-sky-400 shrink-0" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-white font-semibold text-sm", children: profile.name }), _jsxs("p", { className: "text-slate-400 text-xs", children: [profile.legal_name, " \u00B7 Score : ", _jsx("span", { className: "text-sky-400 font-bold", children: profile.teras_score || '—' }), " \u00B7 CRM : ", _jsxs("span", { className: "text-emerald-400 font-bold", children: [fmt(profile.crm_limit), "/mois"] })] })] }), _jsx("span", { className: `px-3 py-1 rounded-full text-xs font-semibold ${(profile.teras_score || 0) >= 600 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`, children: profile.teras_band || 'N/A' })] })), profile && !profile.has_bank_profile && (_jsxs("div", { className: "bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-amber-400 shrink-0 mt-0.5" }), _jsx("p", { className: "text-amber-400 text-sm", children: "Pas encore de profil bancaire. Contactez votre conseiller TERAS Banque pour cr\u00E9er votre dossier." })] })), actionMsg && (_jsxs("div", { className: `rounded-xl p-3 text-sm border flex items-center gap-2 ${actionMsg.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`, children: [actionMsg.text, _jsx("button", { onClick: () => setActionMsg(null), className: "ml-auto text-slate-400 hover:text-white", children: "\u2715" })] })), _jsx("div", { className: "flex gap-1 bg-slate-900/50 border border-slate-800/50 rounded-2xl p-1.5", children: [
                            { id: 'credits', label: 'Mes Financements', badge: approvedApps.length || undefined, color: 'emerald' },
                            { id: 'produits', label: 'Demander', badge: null, color: 'blue' },
                            { id: 'simulator', label: 'Simulateur', badge: null, color: 'purple' },
                            { id: 'messages', label: 'Messages', badge: unread || undefined, color: 'sky' },
                        ].map(({ id, label, badge, color }) => (_jsxs("button", { onClick: () => setTab(id), className: `flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${tab === id ? `bg-${color}-500/20 text-${color}-400` : 'text-slate-400 hover:text-white'}`, children: [label, badge != null && badge > 0 && _jsx("span", { className: `bg-${color}-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`, children: badge })] }, id))) }), loading ? (_jsxs("div", { className: "flex items-center justify-center py-16 gap-3 text-slate-400", children: [_jsx(RefreshCw, { className: "w-5 h-5 animate-spin text-sky-400" }), "Chargement\u2026"] })) : (_jsxs(_Fragment, { children: [tab === 'credits' && (_jsxs("div", { className: "space-y-5", children: [_jsx("div", { className: "grid grid-cols-4 gap-3", children: [
                                            { label: 'Total', val: summary.total || 0, color: 'slate' },
                                            { label: 'En attente', val: summary.pending || 0, color: 'amber' },
                                            { label: 'Approuvés', val: approvedApps.length, color: 'emerald' },
                                            { label: 'Actifs', val: activeApps.length, color: 'sky' },
                                        ].map(({ label, val, color }) => (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-xl p-3 text-center", children: [_jsx("p", { className: `text-${color}-400 font-bold text-2xl`, children: val }), _jsx("p", { className: "text-slate-500 text-xs mt-0.5", children: label })] }, label))) }), approvedApps.length > 0 && (_jsxs("div", { className: "space-y-3", children: [_jsxs("h3", { className: "text-white font-semibold flex items-center gap-2", children: [_jsx(Star, { className: "w-4 h-4 text-emerald-400" }), "Offres \u00E0 accepter", _jsx("span", { className: "px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full", children: approvedApps.length })] }), approvedApps.map(app => (_jsxs("div", { className: "bg-emerald-500/5 border-2 border-emerald-500/30 rounded-2xl p-5", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-white font-bold text-lg", children: [TYPE_ICON[app.product_type] || '💳', " ", app.product_name] }), _jsx("p", { className: "text-slate-400 text-xs", children: app.application_id })] }), _jsxs("div", { className: "text-right", children: [_jsx("span", { className: "px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-semibold", children: "\u2713 Approuv\u00E9" }), app.reviewed_at && _jsxs("p", { className: "text-amber-400 text-xs mt-1 flex items-center gap-1 justify-end", children: [_jsx(Calendar, { className: "w-3 h-3" }), "Expire le ", addDays(app.reviewed_at, 7)] })] })] }), _jsx("div", { className: "grid grid-cols-4 gap-2 mb-4", children: [
                                                            { l: 'Montant', v: fmt(app.requested_amount), c: 'emerald' },
                                                            { l: 'Mensualité', v: fmt(app.monthly_payment), c: 'white' },
                                                            { l: 'Durée', v: `${app.duration_months} mois`, c: 'white' },
                                                            { l: 'Taux', v: `${app.interest_rate}%/an`, c: 'white' },
                                                        ].map(({ l, v, c }) => (_jsxs("div", { className: "bg-slate-800/50 rounded-lg p-2.5 text-center", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: l }), _jsx("p", { className: `${c === 'emerald' ? 'text-emerald-400' : 'text-white'} font-bold text-sm`, children: v })] }, l))) }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("button", { onClick: () => handleDecline(app.id), disabled: !!declining, className: "px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 rounded-xl text-sm flex items-center gap-2", children: [declining === app.id ? _jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }) : _jsx(XCircle, { className: "w-4 h-4" }), "D\u00E9cliner"] }), _jsx("button", { onClick: () => handleAccept(app.id), disabled: !!accepting, className: "flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20", children: accepting === app.id ? _jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), "Traitement\u2026"] }) : _jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "w-4 h-4" }), "Accepter et encaisser"] }) })] })] }, app.id)))] })), activeApps.map(app => (_jsxs("div", { className: "bg-slate-900/50 border border-sky-500/20 rounded-2xl p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white font-semibold", children: app.product_name }), _jsx("p", { className: "text-slate-400 text-xs", children: app.application_id })] }), _jsx("span", { className: "px-2.5 py-1 bg-sky-500/10 text-sky-400 text-xs rounded-full font-semibold", children: "\uD83D\uDFE2 Actif" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("div", { className: "bg-slate-800/40 rounded-lg p-3", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: "Montant" }), _jsx("p", { className: "text-white font-bold", children: fmt(app.requested_amount) })] }), _jsxs("div", { className: "bg-sky-500/10 border border-sky-500/20 rounded-lg p-3", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: "Mensualit\u00E9" }), _jsx("p", { className: "text-sky-400 font-bold", children: fmt(app.monthly_payment) })] }), _jsxs("div", { className: "bg-slate-800/40 rounded-lg p-3", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: "Dur\u00E9e" }), _jsxs("p", { className: "text-white font-bold", children: [app.duration_months, " mois"] })] })] })] }, app.id))), pendingApps.map(app => (_jsx("div", { className: "bg-slate-900/50 border border-amber-500/20 rounded-2xl p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white font-medium text-sm", children: app.product_name }), _jsxs("p", { className: "text-slate-400 text-xs", children: [fmt(app.requested_amount), " \u00B7 ", app.duration_months, " mois \u00B7 ", fmtDate(app.created_at)] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "flex gap-1", children: [1, 2, 3].map(i => _jsx("div", { className: "w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse", style: { animationDelay: `${i * 0.2}s` } }, i)) }), _jsx("span", { className: "px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full", children: "En attente banque" })] })] }) }, app.id))), applications.length === 0 && (_jsxs("div", { className: "text-center py-14", children: [_jsx(DollarSign, { className: "w-12 h-12 text-slate-600 mx-auto mb-3" }), _jsx("p", { className: "text-white font-medium mb-1", children: "Aucune demande de financement" }), _jsxs("button", { onClick: () => setTab('produits'), className: "mt-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm flex items-center gap-2 mx-auto", children: [_jsx(Package, { className: "w-4 h-4" }), "D\u00E9couvrir les produits"] })] }))] })), tab === 'produits' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3", children: [_jsx(Info, { className: "w-5 h-5 text-blue-400 shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-blue-400 font-medium text-sm", children: "Financements pour votre entreprise" }), _jsx("p", { className: "text-slate-400 text-xs mt-0.5", children: "Soumettez votre demande en ligne. R\u00E9ponse de votre conseiller sous 24\u201348h." })] })] }), products.filter(p => p.is_active && ['pme', 'immobilier', 'agricole', 'education'].includes(p.product_type)).map(p => (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 hover:border-sky-500/30 rounded-2xl p-5 transition-all", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-3xl", children: TYPE_ICON[p.product_type] || '💳' }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-semibold", children: p.name }), _jsxs("p", { className: "text-slate-400 text-xs", children: [p.description?.slice(0, 70), "\u2026"] })] })] }), _jsxs("div", { className: "text-right shrink-0 ml-3", children: [_jsxs("p", { className: "text-white font-bold", children: [p.interest_rate, "%", _jsx("span", { className: "text-slate-400 text-xs", children: "/an" })] }), _jsxs("p", { className: "text-slate-500 text-xs", children: ["Score \u2265 ", p.min_score_required] })] })] }), _jsxs("div", { className: "flex items-center justify-between text-xs text-slate-400 mb-4", children: [_jsxs("span", { children: [fmt(p.min_amount), " \u2192 ", fmt(p.max_amount)] }), _jsxs("span", { children: [p.min_duration_months, "\u2013", p.max_duration_months, " mois"] })] }), p.features?.length > 0 && _jsx("div", { className: "flex flex-wrap gap-1 mb-4", children: p.features.slice(0, 3).map((f, i) => _jsxs("span", { className: "px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full", children: ["\u2713 ", f] }, i)) }), _jsxs("button", { onClick: () => setApplying(p), className: "w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2", children: [_jsx(Send, { className: "w-4 h-4" }), "Faire une demande"] })] }, p.id))), products.length === 0 && _jsx("div", { className: "text-center py-10 text-slate-500", children: "Aucun produit disponible." })] })), tab === 'simulator' && (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 space-y-4", children: [_jsxs("h3", { className: "text-white font-bold flex items-center gap-2", children: [_jsx(Calculator, { className: "w-5 h-5 text-purple-400" }), "Simuler un financement"] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Produit" }), _jsxs("select", { value: simProduct, onChange: e => { setSimProduct(e.target.value); setSimResult(null); }, className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500", children: [_jsx("option", { value: "", children: "Choisir un produit" }), products.filter(p => p.is_active).map(p => _jsxs("option", { value: p.id, children: [p.name, " \u2014 ", p.interest_rate, "%/an"] }, p.id))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Montant (FCFA)" }), _jsx("input", { type: "number", value: simAmount, onChange: e => { setSimAmount(e.target.value); setSimResult(null); }, placeholder: selectedProduct ? `Max: ${fmt(selectedProduct.max_amount)}` : 'Montant', className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Dur\u00E9e (mois)" }), _jsx("input", { type: "number", value: simDuration, onChange: e => { setSimDuration(e.target.value); setSimResult(null); }, placeholder: selectedProduct ? `${selectedProduct.max_duration_months}` : 'Durée', className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500" })] })] }), _jsxs("button", { onClick: runSim, disabled: !simProduct || !simAmount || !simDuration, className: "w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2", children: [_jsx(Zap, { className: "w-4 h-4" }), "Calculer"] })] }), simResult && (_jsxs("div", { className: "bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6 space-y-4", children: [_jsxs("div", { className: "text-center py-4 bg-purple-500/10 rounded-xl border border-purple-500/20", children: [_jsx("p", { className: "text-slate-400 text-sm mb-1", children: "Mensualit\u00E9 estim\u00E9e" }), _jsx("p", { className: "text-5xl font-black text-white", children: fmt(simResult.monthly) }), _jsxs("p", { className: "text-purple-400 text-sm mt-1", children: ["pendant ", simDuration, " mois"] })] }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: [{ l: 'Total', v: fmt(simResult.total), c: 'white' }, { l: 'Intérêts', v: fmt(simResult.interest), c: 'amber-400' }, { l: 'Frais', v: fmt(simResult.fees), c: 'slate-400' }].map(({ l, v, c }) => (_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-3 text-center", children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: l }), _jsx("p", { className: `text-${c} font-bold text-sm`, children: v })] }, l))) }), _jsxs("button", { onClick: () => { setTab('produits'); if (selectedProduct)
                                                    setApplying(selectedProduct); }, className: "w-full py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2", children: [_jsx(Send, { className: "w-4 h-4" }), "Faire une demande", _jsx(ArrowRight, { className: "w-4 h-4" })] })] }))] })), tab === 'messages' && (_jsxs("div", { className: "space-y-3", children: [unread > 0 && (_jsx("div", { className: "flex justify-end", children: _jsxs("button", { onClick: async () => { await authFetch('/api/scoring/enterprise/bank-messages/read-all/', { method: 'POST' }); setMessages(p => p.map(m => ({ ...m, is_read: true }))); setUnread(0); }, className: "text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1.5", children: [_jsx(MailOpen, { className: "w-3.5 h-3.5" }), "Tout marquer lu"] }) })), messages.length === 0 ? (_jsxs("div", { className: "text-center py-14", children: [_jsx(MessageCircle, { className: "w-12 h-12 text-slate-600 mx-auto mb-3" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Aucun message de votre conseiller." })] })) : messages.map(msg => {
                                        const cfg = MSG_CFG[msg.type] || MSG_CFG.info;
                                        const isOpen = expanded === msg.id;
                                        return (_jsxs("div", { onClick: () => { setExpanded(isOpen ? null : msg.id); if (!msg.is_read)
                                                markRead(msg.id); }, className: `border rounded-2xl overflow-hidden cursor-pointer transition-all ${!msg.is_read ? 'border-sky-500/30 bg-sky-500/5' : 'border-slate-800/50 bg-slate-900/50'}`, children: [_jsxs("div", { className: "flex items-start gap-3 p-4", children: [_jsx("div", { className: `w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border`, children: _jsx(cfg.Icon, { className: `w-4 h-4 ${cfg.color}` }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: `text-sm font-semibold ${!msg.is_read ? 'text-white' : 'text-slate-300'}`, children: msg.subject }), !msg.is_read && _jsx("span", { className: "w-2 h-2 bg-sky-400 rounded-full shrink-0" })] }), _jsxs("p", { className: "text-slate-500 text-xs mt-0.5", children: [msg.sender_name, " \u00B7 ", new Date(msg.created_at).toLocaleDateString('fr-FR')] }), !isOpen && _jsxs("p", { className: "text-slate-400 text-xs mt-1 truncate", children: [msg.body?.slice(0, 80), "\u2026"] })] }), isOpen ? _jsx(ChevronUp, { className: "w-4 h-4 text-slate-500 shrink-0" }) : _jsx(ChevronDown, { className: "w-4 h-4 text-slate-500 shrink-0" })] }), isOpen && (_jsxs("div", { className: "px-4 pb-4 border-t border-slate-800/50 pt-3", children: [_jsx("p", { className: "text-slate-300 text-sm leading-relaxed whitespace-pre-line", children: msg.body }), msg.type === 'offer' && _jsxs("button", { onClick: e => { e.stopPropagation(); setTab('credits'); }, className: "mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-medium flex items-center gap-1.5", children: [_jsx(DollarSign, { className: "w-3.5 h-3.5" }), "Voir et accepter l'offre \u2192"] })] }))] }, msg.id));
                                    })] }))] }))] })] }));
}
