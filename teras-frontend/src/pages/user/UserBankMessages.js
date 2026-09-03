import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// teras-frontend/src/pages/user/UserBankMessages.tsx
// teras-frontend/src/pages/user/UserBankMessages.tsx
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { authFetch } from '../../services/authFetch';
import { Bell, MessageCircle, CheckCircle, XCircle, Clock, RefreshCw, DollarSign, AlertCircle, Info, Package, MailOpen, ChevronDown, ChevronUp, Calculator, TrendingUp, Calendar, Send, Zap, ArrowRight, Shield, Star, } from 'lucide-react';
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
function fmtDate(d, short = false) {
    if (!d)
        return '—';
    const date = new Date(d);
    if (short)
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 1)
        return "À l'instant";
    if (diff < 60)
        return `Il y a ${diff} min`;
    if (diff < 1440)
        return `Il y a ${Math.floor(diff / 60)}h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function addDays(d, days) {
    const dt = new Date(d);
    dt.setDate(dt.getDate() + days);
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
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
function daysUntil(d) {
    const dt = new Date(d);
    const now = new Date();
    const diff = Math.ceil((dt.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diff;
}
const MSG_CFG = {
    info: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', Icon: Info },
    offer: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', Icon: Package },
    reminder: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', Icon: Clock },
    alert: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', Icon: AlertCircle },
};
const APP_ST = {
    pending: { label: 'En attente', color: 'text-amber-400', bg: 'bg-amber-500/10', Icon: Clock },
    review: { label: 'En révision', color: 'text-blue-400', bg: 'bg-blue-500/10', Icon: RefreshCw },
    approved: { label: 'Approuvé ✓', color: 'text-emerald-400', bg: 'bg-emerald-500/10', Icon: CheckCircle },
    rejected: { label: 'Rejeté', color: 'text-red-400', bg: 'bg-red-500/10', Icon: XCircle },
    disbursed: { label: 'Actif 🟢', color: 'text-emerald-400', bg: 'bg-emerald-500/10', Icon: CheckCircle },
    cancelled: { label: 'Annulé', color: 'text-slate-400', bg: 'bg-slate-700/50', Icon: XCircle },
};
const TYPE_ICON = {
    microcredit: '💰', personal: '💳', salary: '🏛', auto: '🚗',
    immobilier: '🏠', pme: '🏢', agricole: '🌾', education: '📚', other: '📦',
};
const VALID_TABS = ['messages', 'credits', 'produits', 'simulator'];
function isBankMessagesTab(value) {
    return typeof value === 'string' && VALID_TABS.includes(value);
}
// ── Modal : Demander un crédit ────────────────────────────────────────────────
function ApplyModal({ product, onClose, onDone }) {
    const [amount, setAmount] = useState('');
    const [duration, setDuration] = useState('');
    const [purpose, setPurpose] = useState('');
    const [sim, setSim] = useState(null);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    // Calcul temps réel
    useEffect(() => {
        if (!amount || !duration || !product) {
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
    const handleSubmit = async () => {
        if (!amount || !duration || !purpose) {
            setError('Tous les champs sont requis');
            return;
        }
        const amt = parseFloat(amount);
        if (amt < parseFloat(product.min_amount) || amt > parseFloat(product.max_amount)) {
            setError(`Montant entre ${fmt(product.min_amount)} et ${fmt(product.max_amount)}`);
            return;
        }
        setSending(true);
        setError('');
        try {
            const res = await authFetch('/api/scoring/user/my-applications/request/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: product.id, requested_amount: amount, duration_months: parseInt(duration), purpose }),
            });
            const payload = await readApiPayload(res);
            if (!res.ok)
                throw new Error(apiErrorMessage(payload, `Erreur ${res.status}`));
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
        return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center", children: [_jsx(CheckCircle, { className: "w-16 h-16 text-emerald-400 mx-auto mb-4" }), _jsx("h3", { className: "text-white font-bold text-xl mb-2", children: "Demande envoy\u00E9e !" }), _jsxs("p", { className: "text-slate-400 text-sm mb-2", children: ["Votre demande de ", _jsx("strong", { className: "text-white", children: product.name }), " a \u00E9t\u00E9 transmise \u00E0 votre conseiller bancaire."] }), _jsx("p", { className: "text-slate-500 text-xs mb-6", children: "D\u00E9lai de r\u00E9ponse habituel : 24\u201348h. Vous serez notifi\u00E9 ici." }), _jsx("button", { onClick: () => { onDone(); onClose(); }, className: "px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm", children: "Fermer" })] }) }));
    return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4", onClick: e => e.target === e.currentTarget && onClose(), children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-400 mb-0.5", children: "Demande de cr\u00E9dit" }), _jsx("h3", { className: "text-white font-bold", children: product.name })] }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-white text-xl", children: "\u2715" })] }), _jsxs("div", { className: "p-5 space-y-4", children: [_jsxs("div", { className: "bg-slate-800/40 rounded-xl p-3 grid grid-cols-3 gap-3 text-xs", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "Taux" }), _jsxs("p", { className: "text-white font-semibold", children: [product.interest_rate, "%/an"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "Montant" }), _jsxs("p", { className: "text-white font-semibold", children: [fmt(product.min_amount), "\u2013", fmt(product.max_amount)] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "Dur\u00E9e" }), _jsxs("p", { className: "text-white font-semibold", children: [product.min_duration_months, "\u2013", product.max_duration_months, " mois"] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1 block", children: "Montant souhait\u00E9 (FCFA) *" }), _jsx("input", { type: "number", value: amount, onChange: e => setAmount(e.target.value), placeholder: `Ex: ${Math.round(parseFloat(product.min_amount) * 2).toLocaleString()}`, className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1 block", children: "Dur\u00E9e souhait\u00E9e (mois) *" }), _jsxs("select", { value: duration, onChange: e => setDuration(e.target.value), className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "", children: "Choisir une dur\u00E9e" }), Array.from({ length: product.max_duration_months - product.min_duration_months + 1 }, (_, i) => product.min_duration_months + i).filter(m => m <= 6 || m % 3 === 0 || m === product.max_duration_months).slice(0, 10)
                                            .map(m => _jsxs("option", { value: m, children: [m, " mois"] }, m))] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1 block", children: "Objet du cr\u00E9dit *" }), _jsx("textarea", { value: purpose, onChange: e => setPurpose(e.target.value), rows: 2, placeholder: "Ex: Achat d'\u00E9quipement pour mon activit\u00E9 commerciale...", className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 resize-none" })] }), sim && (_jsxs("div", { className: "bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3", children: [_jsx("p", { className: "text-emerald-400 text-xs font-semibold mb-2", children: "\uD83D\uDCCA Simulation indicative" }), _jsxs("div", { className: "grid grid-cols-3 gap-2 text-xs", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 mb-0.5", children: "Mensualit\u00E9" }), _jsx("p", { className: "text-white font-bold text-base", children: fmt(sim.monthly) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 mb-0.5", children: "Total" }), _jsx("p", { className: "text-white font-semibold", children: fmt(sim.total) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 mb-0.5", children: "Int\u00E9r\u00EAts" }), _jsx("p", { className: "text-amber-400", children: fmt(sim.interest) })] })] })] })), error && _jsxs("p", { className: "text-red-400 text-xs flex items-center gap-1", children: [_jsx(AlertCircle, { className: "w-3.5 h-3.5" }), error] }), _jsxs("div", { className: "flex gap-3 pt-1", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm", children: "Annuler" }), _jsx("button", { onClick: handleSubmit, disabled: sending, className: "flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2", children: sending ? _jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), "Envoi\u2026"] }) : _jsxs(_Fragment, { children: [_jsx(Send, { className: "w-4 h-4" }), "Envoyer la demande"] }) })] })] })] }) }));
}
// ── Composant principal ───────────────────────────────────────────────────────
export default function UserBankMessages() {
    const location = useLocation();
    const requestedTab = location.state?.openTab;
    const [tab, setTab] = useState(isBankMessagesTab(requestedTab) ? requestedTab : 'credits');
    const [messages, setMessages] = useState([]);
    const [applications, setApps] = useState([]);
    const [summary, setSummary] = useState({});
    const [products, setProducts] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [applying, setApplying] = useState(null);
    const [accepting, setAccepting] = useState(null);
    const [declining, setDeclining] = useState(null);
    const [actionMsg, setActionMsg] = useState(null);
    // Simulator
    const [simProduct, setSimProduct] = useState('');
    const [simAmount, setSimAmount] = useState('');
    const [simDuration, setSimDuration] = useState('');
    const [simResult, setSimResult] = useState(null);
    const load = async () => {
        setLoading(true);
        await Promise.all([
            authFetch('/api/scoring/user/bank-messages/').then(r => r.json()).then(d => { setMessages(d.messages || []); setUnread(d.unread_count || 0); }).catch(() => { }),
            authFetch('/api/scoring/user/my-applications/').then(r => r.json()).then(d => { setApps(d.applications || []); setSummary(d.summary || {}); }).catch(() => { }),
            authFetch('/api/scoring/user/products/').then(r => r.json()).then(d => setProducts(Array.isArray(d) ? d : (d.results || []))).catch(() => { }),
        ]);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);
    useEffect(() => {
        if (isBankMessagesTab(requestedTab)) {
            setTab(requestedTab);
        }
    }, [requestedTab]);
    const markRead = async (id) => {
        await authFetch(`/api/scoring/user/bank-messages/${id}/read/`, { method: 'POST' });
        setMessages(p => p.map(m => m.id === id ? { ...m, is_read: true } : m));
        setUnread(p => Math.max(0, p - 1));
    };
    const handleAccept = async (appId) => {
        setAccepting(appId);
        setActionMsg(null);
        try {
            const res = await authFetch(`/api/scoring/user/my-applications/${appId}/accept/`, { method: 'POST' });
            const payload = await readApiPayload(res);
            if (res.ok) {
                setActionMsg({ text: apiErrorMessage(payload, '✅ Crédit accepté ! Les fonds vont être virés sur votre compte.'), ok: true });
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
            const res = await authFetch(`/api/scoring/user/my-applications/${appId}/decline/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Refus client' }) });
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
    // Simulateur
    const selectedProduct = products.find(p => String(p.id) === simProduct);
    const runSim = () => {
        if (!selectedProduct || !simAmount || !simDuration)
            return;
        const rate = parseFloat(selectedProduct.interest_rate) / 100 / 12;
        const n = parseInt(simDuration);
        const amt = parseFloat(simAmount);
        const fees = amt * (parseFloat(selectedProduct.origination_fee || '1.5') / 100);
        const monthly = rate > 0 ? amt * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1) : amt / n;
        setSimResult({ monthly: Math.round(monthly), total: Math.round(monthly * n), interest: Math.round(monthly * n - amt), fees: Math.round(fees), rate: selectedProduct.interest_rate });
    };
    const pendingApps = applications.filter(a => a.status === 'pending' || a.status === 'review');
    const approvedApps = applications.filter(a => a.status === 'approved');
    const activeApps = applications.filter(a => a.status === 'disbursed');
    const closedApps = applications.filter(a => ['rejected', 'cancelled'].includes(a.status));
    return (_jsxs("div", { className: "min-h-screen bg-[#0b1220]", children: [applying && _jsx(ApplyModal, { product: applying, onClose: () => setApplying(null), onDone: load }), _jsxs("div", { className: "max-w-3xl mx-auto px-4 py-8 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-white flex items-center gap-3", children: [_jsx(Bell, { className: "w-6 h-6 text-sky-400" }), " Banque & Cr\u00E9dits"] }), _jsx("p", { className: "text-slate-400 text-sm mt-0.5", children: "Messages, suivi de vos demandes et produits disponibles" })] }), _jsx("button", { onClick: load, className: "p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors", children: _jsx(RefreshCw, { className: "w-4 h-4" }) })] }), actionMsg && (_jsxs("div", { className: `rounded-xl p-3 text-sm border flex items-center gap-2 ${actionMsg.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`, children: [actionMsg.text, _jsx("button", { onClick: () => setActionMsg(null), className: "ml-auto text-slate-400 hover:text-white", children: "\u2715" })] })), _jsx("div", { className: "flex gap-1 bg-slate-900/50 border border-slate-800/50 rounded-2xl p-1.5", children: [
                            { id: 'credits', label: 'Mes Crédits', badge: approvedApps.length || undefined, color: 'emerald' },
                            { id: 'produits', label: 'Demander', badge: null, color: 'blue' },
                            { id: 'simulator', label: 'Simulateur', badge: null, color: 'purple' },
                            { id: 'messages', label: 'Messages', badge: unread || undefined, color: 'sky' },
                        ].map(({ id, label, badge, color }) => (_jsxs("button", { onClick: () => setTab(id), className: `flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${tab === id ? `bg-${color}-500/20 text-${color}-400` : 'text-slate-400 hover:text-white'}`, children: [label, badge != null && badge > 0 && _jsx("span", { className: `bg-${color}-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`, children: badge })] }, id))) }), loading ? (_jsxs("div", { className: "flex items-center justify-center py-20 text-slate-400 gap-3", children: [_jsx(RefreshCw, { className: "w-5 h-5 animate-spin text-sky-400" }), " Chargement\u2026"] })) : (_jsxs(_Fragment, { children: [tab === 'credits' && (_jsxs("div", { className: "space-y-5", children: [_jsx("div", { className: "grid grid-cols-4 gap-3", children: [
                                            { label: 'Total', val: summary.total || 0, color: 'slate' },
                                            { label: 'En attente', val: summary.pending || 0, color: 'amber' },
                                            { label: 'Approuvés', val: approvedApps.length, color: 'emerald' },
                                            { label: 'Actifs', val: activeApps.length, color: 'sky' },
                                        ].map(({ label, val, color }) => (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-xl p-3 text-center", children: [_jsx("p", { className: `text-${color}-400 font-bold text-2xl`, children: val }), _jsx("p", { className: "text-slate-500 text-xs mt-0.5", children: label })] }, label))) }), approvedApps.length > 0 && (_jsxs("div", { className: "space-y-3", children: [_jsxs("h3", { className: "text-white font-semibold flex items-center gap-2", children: [_jsx(Star, { className: "w-4 h-4 text-emerald-400" }), " Offres \u00E0 accepter", _jsx("span", { className: "px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full", children: approvedApps.length })] }), approvedApps.map(app => {
                                                const deadline = addDays(app.reviewed_at || app.created_at, 7);
                                                const daysLeft = daysUntil(new Date(app.reviewed_at || app.created_at).toISOString().split('T')[0].replace(/-/g, '/'));
                                                return (_jsxs("div", { className: "bg-emerald-500/5 border-2 border-emerald-500/30 rounded-2xl p-5", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-xl", children: TYPE_ICON[app.product_type] || '💳' }), _jsx("p", { className: "text-white font-bold text-lg", children: app.product_name })] }), _jsx("p", { className: "text-slate-400 text-xs", children: app.application_id })] }), _jsxs("div", { className: "text-right", children: [_jsx("span", { className: "px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-semibold", children: "\u2713 Approuv\u00E9" }), _jsxs("p", { className: "text-amber-400 text-xs mt-1 flex items-center gap-1 justify-end", children: [_jsx(Calendar, { className: "w-3 h-3" }), " Expire le ", deadline] })] })] }), _jsx("div", { className: "grid grid-cols-4 gap-2 mb-4", children: [
                                                                { l: 'Montant accordé', v: fmt(app.requested_amount), c: 'emerald' },
                                                                { l: 'Mensualité', v: fmt(app.monthly_payment), c: 'white' },
                                                                { l: 'Durée', v: `${app.duration_months} mois`, c: 'white' },
                                                                { l: 'Taux', v: `${app.interest_rate}%/an`, c: 'white' },
                                                            ].map(({ l, v, c }) => (_jsxs("div", { className: "bg-slate-800/50 rounded-lg p-2.5 text-center", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: l }), _jsx("p", { className: `text-${c === 'emerald' ? 'emerald-400' : 'white'} font-bold text-sm`, children: v })] }, l))) }), _jsxs("div", { className: "bg-slate-800/30 rounded-xl p-3 mb-4", children: [_jsx("p", { className: "text-slate-400 text-xs mb-2 font-medium", children: "\uD83D\uDCC5 Calendrier de remboursement" }), _jsxs("div", { className: "flex items-center gap-2 overflow-x-auto pb-1", children: [[1, 2, 3, 4, 5, 6].map(i => {
                                                                            const d = new Date();
                                                                            d.setMonth(d.getMonth() + i);
                                                                            return (_jsxs("div", { className: "flex flex-col items-center gap-1 shrink-0", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center", children: _jsx("span", { className: "text-emerald-400 text-xs font-bold", children: i }) }), _jsx("p", { className: "text-slate-500 text-xs", children: d.toLocaleDateString('fr-FR', { month: 'short' }) }), _jsx("p", { className: "text-white text-xs font-medium", children: fmt(app.monthly_payment) })] }, i));
                                                                        }), app.duration_months > 6 && (_jsxs("div", { className: "flex flex-col items-center gap-1 shrink-0 opacity-40", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center", children: _jsx("span", { className: "text-slate-400 text-xs", children: "\u2026" }) }), _jsxs("p", { className: "text-slate-500 text-xs", children: ["+", app.duration_months - 6] })] }))] }), _jsxs("p", { className: "text-slate-500 text-xs mt-2", children: ["Total \u00E0 rembourser : ", _jsx("span", { className: "text-white font-medium", children: fmt(parseFloat(app.monthly_payment) * app.duration_months) })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("button", { onClick: () => handleDecline(app.id), disabled: !!declining, className: "px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 rounded-xl text-sm flex items-center gap-2 transition-colors", children: [declining === app.id ? _jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }) : _jsx(XCircle, { className: "w-4 h-4" }), " D\u00E9cliner"] }), _jsx("button", { onClick: () => handleAccept(app.id), disabled: !!accepting, className: "flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20", children: accepting === app.id ? _jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), "Traitement\u2026"] }) : _jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "w-4 h-4" }), "Accepter et encaisser"] }) })] })] }, app.id));
                                            })] })), activeApps.length > 0 && (_jsxs("div", { className: "space-y-3", children: [_jsxs("h3", { className: "text-white font-semibold flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-4 h-4 text-sky-400" }), " Cr\u00E9dits actifs"] }), activeApps.map(app => {
                                                const paid = Math.min(3, app.duration_months); // simulé
                                                const pct = Math.round((paid / app.duration_months) * 100);
                                                const nextDate = new Date();
                                                nextDate.setMonth(nextDate.getMonth() + 1);
                                                return (_jsxs("div", { className: "bg-slate-900/50 border border-sky-500/20 rounded-2xl p-5", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white font-semibold", children: app.product_name }), _jsx("p", { className: "text-slate-400 text-xs mt-0.5", children: app.application_id })] }), _jsx("span", { className: "px-2.5 py-1 bg-sky-500/10 text-sky-400 text-xs rounded-full font-semibold", children: "\uD83D\uDFE2 Actif" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3 mb-4 text-sm", children: [_jsxs("div", { className: "bg-slate-800/40 rounded-lg p-3", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: "Montant initial" }), _jsx("p", { className: "text-white font-bold", children: fmt(app.requested_amount) })] }), _jsxs("div", { className: "bg-sky-500/10 rounded-lg p-3 border border-sky-500/20", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: "Prochain paiement" }), _jsx("p", { className: "text-sky-400 font-bold", children: fmt(app.monthly_payment) }), _jsxs("p", { className: "text-slate-500 text-xs", children: ["le ", nextDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })] })] }), _jsxs("div", { className: "bg-slate-800/40 rounded-lg p-3", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: "Dur\u00E9e restante" }), _jsxs("p", { className: "text-white font-bold", children: [app.duration_months - paid, " mois"] })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-xs mb-1.5", children: [_jsx("span", { className: "text-slate-400", children: "Progression remboursement" }), _jsxs("span", { className: "text-white font-medium", children: [paid, "/", app.duration_months, " mois \u2014 ", pct, "%"] })] }), _jsx("div", { className: "h-2.5 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all", style: { width: `${pct}%` } }) })] })] }, app.id));
                                            })] })), pendingApps.length > 0 && (_jsxs("div", { className: "space-y-3", children: [_jsxs("h3", { className: "text-white font-semibold flex items-center gap-2", children: [_jsx(Clock, { className: "w-4 h-4 text-amber-400" }), " En cours d'examen"] }), pendingApps.map(app => (_jsxs("div", { className: "bg-slate-900/50 border border-amber-500/20 rounded-2xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white font-medium text-sm", children: app.product_name }), _jsxs("p", { className: "text-slate-400 text-xs mt-0.5", children: [fmt(app.requested_amount), " \u00B7 ", app.duration_months, " mois \u00B7 ", fmtDate(app.created_at)] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "flex gap-1", children: [1, 2, 3].map(i => _jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse", style: { animationDelay: `${i * 0.2}s` } }, i)) }), _jsx("span", { className: "px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full", children: "En attente banque" })] })] }), _jsxs("p", { className: "text-slate-500 text-xs mt-3 flex items-center gap-1", children: [_jsx(Shield, { className: "w-3 h-3" }), " D\u00E9lai habituel : 24\u201348h apr\u00E8s d\u00E9p\u00F4t"] })] }, app.id)))] })), closedApps.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-slate-400 font-medium text-sm", children: "Historique" }), closedApps.map(app => {
                                                const st = APP_ST[app.status] || APP_ST.cancelled;
                                                return (_jsxs("div", { className: "bg-slate-900/30 border border-slate-800/30 rounded-xl p-3 flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-slate-300 text-sm", children: [app.product_name, " \u2014 ", fmt(app.requested_amount)] }), app.rejection_reason && _jsxs("p", { className: "text-slate-500 text-xs mt-0.5", children: ["Motif : ", app.rejection_reason] })] }), _jsx("span", { className: `px-2.5 py-1 ${st.bg} ${st.color} text-xs rounded-full`, children: st.label })] }, app.id));
                                            })] })), applications.length === 0 && (_jsxs("div", { className: "text-center py-14", children: [_jsx(DollarSign, { className: "w-12 h-12 text-slate-600 mx-auto mb-3" }), _jsx("p", { className: "text-white font-medium mb-1", children: "Aucune demande de cr\u00E9dit" }), _jsx("p", { className: "text-slate-400 text-sm mb-4", children: "Explorez les produits disponibles pour vous." }), _jsxs("button", { onClick: () => setTab('produits'), className: "px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm flex items-center gap-2 mx-auto transition-colors", children: [_jsx(Package, { className: "w-4 h-4" }), " Voir les produits disponibles"] })] }))] })), tab === 'produits' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3", children: [_jsx(Info, { className: "w-5 h-5 text-blue-400 shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-blue-400 font-medium text-sm", children: "Comment \u00E7a marche ?" }), _jsx("p", { className: "text-slate-400 text-xs mt-0.5", children: "Choisissez un produit, soumettez votre demande. Votre conseiller bancaire l'examinera sous 24\u201348h et vous notifiera ici." })] })] }), _jsx("div", { className: "space-y-3", children: products.filter(p => p.is_active).map(p => (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 hover:border-blue-500/30 rounded-2xl p-5 transition-all", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-3xl", children: TYPE_ICON[p.product_type] || '💳' }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-semibold", children: p.name }), _jsxs("p", { className: "text-slate-400 text-xs mt-0.5", children: [p.description?.slice(0, 70), "\u2026"] })] })] }), _jsxs("div", { className: "text-right shrink-0 ml-3", children: [_jsxs("p", { className: "text-white font-bold", children: [p.interest_rate, "%", _jsx("span", { className: "text-slate-400 text-xs", children: "/an" })] }), _jsxs("p", { className: "text-slate-500 text-xs", children: ["Score \u2265 ", p.min_score_required] })] })] }), _jsxs("div", { className: "flex items-center justify-between text-xs text-slate-400 mb-4", children: [_jsxs("span", { children: [fmt(p.min_amount), " \u2192 ", fmt(p.max_amount)] }), _jsxs("span", { children: [p.min_duration_months, "\u2013", p.max_duration_months, " mois"] })] }), p.features?.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-1 mb-4", children: p.features.slice(0, 3).map((f, i) => (_jsxs("span", { className: "px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full", children: ["\u2713 ", f] }, i))) })), _jsxs("button", { onClick: () => setApplying(p), className: "w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors", children: [_jsx(Send, { className: "w-4 h-4" }), " Faire une demande"] })] }, p.id))) })] })), tab === 'simulator' && (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 space-y-4", children: [_jsxs("h3", { className: "text-white font-bold flex items-center gap-2", children: [_jsx(Calculator, { className: "w-5 h-5 text-purple-400" }), " Simuler mon cr\u00E9dit"] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Produit" }), _jsxs("select", { value: simProduct, onChange: e => { setSimProduct(e.target.value); setSimResult(null); }, className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500", children: [_jsx("option", { value: "", children: "Choisir un produit" }), products.filter(p => p.is_active).map(p => _jsxs("option", { value: p.id, children: [p.name, " \u2014 ", p.interest_rate, "%/an"] }, p.id))] })] }), selectedProduct && (_jsxs("div", { className: "bg-slate-800/30 rounded-xl p-3 grid grid-cols-3 gap-3 text-xs", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "Taux annuel" }), _jsxs("p", { className: "text-white font-semibold", children: [selectedProduct.interest_rate, "%"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "Frais dossier" }), _jsxs("p", { className: "text-white font-semibold", children: [selectedProduct.origination_fee, "%"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-500 mb-0.5", children: "Montant max" }), _jsx("p", { className: "text-white font-semibold", children: fmt(selectedProduct.max_amount) })] })] })), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Montant (FCFA)" }), _jsx("input", { type: "number", value: simAmount, onChange: e => { setSimAmount(e.target.value); setSimResult(null); }, placeholder: selectedProduct ? `${fmt(selectedProduct.min_amount)}` : 'Montant', className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Dur\u00E9e (mois)" }), _jsx("input", { type: "number", value: simDuration, onChange: e => { setSimDuration(e.target.value); setSimResult(null); }, placeholder: selectedProduct ? `${selectedProduct.min_duration_months}–${selectedProduct.max_duration_months}` : 'Durée', className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500" })] })] }), _jsxs("button", { onClick: runSim, disabled: !simProduct || !simAmount || !simDuration, className: "w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors", children: [_jsx(Calculator, { className: "w-4 h-4" }), " Calculer"] })] }), simResult && (_jsxs("div", { className: "bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6 space-y-5", children: [_jsxs("h3", { className: "text-white font-bold flex items-center gap-2", children: [_jsx(Zap, { className: "w-5 h-5 text-purple-400" }), " R\u00E9sultat de la simulation"] }), _jsxs("div", { className: "text-center py-4 bg-purple-500/10 rounded-xl border border-purple-500/20", children: [_jsx("p", { className: "text-slate-400 text-sm mb-1", children: "Mensualit\u00E9 estim\u00E9e" }), _jsx("p", { className: "text-5xl font-black text-white", children: fmt(simResult.monthly) }), _jsxs("p", { className: "text-purple-400 text-sm mt-1", children: ["par mois pendant ", simDuration, " mois"] })] }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: [
                                                    { l: 'Total à rembourser', v: fmt(simResult.total), c: 'white' },
                                                    { l: 'Coût des intérêts', v: fmt(simResult.interest), c: 'amber-400' },
                                                    { l: 'Frais de dossier', v: fmt(simResult.fees), c: 'slate-300' },
                                                ].map(({ l, v, c }) => (_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-3 text-center", children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: l }), _jsx("p", { className: `text-${c} font-bold text-sm`, children: v })] }, l))) }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs font-medium mb-3", children: "\uD83D\uDCC5 Premiers remboursements" }), _jsxs("div", { className: "space-y-2", children: [Array.from({ length: Math.min(4, parseInt(simDuration)) }, (_, i) => {
                                                                const d = new Date();
                                                                d.setMonth(d.getMonth() + i + 1);
                                                                return (_jsxs("div", { className: "flex items-center justify-between py-2 border-b border-slate-800/50", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 font-bold", children: i + 1 }), _jsx("span", { className: "text-slate-300 text-sm", children: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) })] }), _jsx("span", { className: "text-white font-semibold text-sm", children: fmt(simResult.monthly) })] }, i));
                                                            }), parseInt(simDuration) > 4 && _jsxs("p", { className: "text-slate-500 text-xs text-center pt-1", children: ["\u2026 et ", parseInt(simDuration) - 4, " mensualit\u00E9s suppl\u00E9mentaires"] })] })] }), _jsxs("button", { onClick: () => { setTab('produits'); setApplying(selectedProduct); }, className: "w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors", children: [_jsx(Send, { className: "w-4 h-4" }), " Faire une demande pour ce produit ", _jsx(ArrowRight, { className: "w-4 h-4" })] })] }))] })), tab === 'messages' && (_jsxs("div", { className: "space-y-3", children: [unread > 0 && (_jsx("div", { className: "flex justify-end", children: _jsxs("button", { onClick: async () => { await authFetch('/api/scoring/user/bank-messages/read-all/', { method: 'POST' }); setMessages(p => p.map(m => ({ ...m, is_read: true }))); setUnread(0); }, className: "text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1.5", children: [_jsx(MailOpen, { className: "w-3.5 h-3.5" }), " Tout marquer lu"] }) })), messages.length === 0 ? (_jsxs("div", { className: "text-center py-14", children: [_jsx(MessageCircle, { className: "w-12 h-12 text-slate-600 mx-auto mb-3" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Aucun message de votre conseiller." })] })) : messages.map(msg => {
                                        const cfg = MSG_CFG[msg.type] || MSG_CFG.info;
                                        const isOpen = expanded === msg.id;
                                        return (_jsxs("div", { onClick: () => { setExpanded(isOpen ? null : msg.id); if (!msg.is_read)
                                                markRead(msg.id); }, className: `border rounded-2xl overflow-hidden cursor-pointer transition-all ${!msg.is_read ? 'border-sky-500/30 bg-sky-500/5' : 'border-slate-800/50 bg-slate-900/50'}`, children: [_jsxs("div", { className: "flex items-start gap-3 p-4", children: [_jsx("div", { className: `w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border`, children: _jsx(cfg.Icon, { className: `w-4 h-4 ${cfg.color}` }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: `text-sm font-semibold ${!msg.is_read ? 'text-white' : 'text-slate-300'}`, children: msg.subject }), !msg.is_read && _jsx("span", { className: "w-2 h-2 bg-sky-400 rounded-full shrink-0" })] }), _jsxs("p", { className: "text-slate-500 text-xs mt-0.5", children: [msg.sender_name, " \u00B7 ", fmtDate(msg.created_at)] }), !isOpen && _jsxs("p", { className: "text-slate-400 text-xs mt-1 truncate", children: [msg.body.slice(0, 80), "\u2026"] })] }), isOpen ? _jsx(ChevronUp, { className: "w-4 h-4 text-slate-500 shrink-0" }) : _jsx(ChevronDown, { className: "w-4 h-4 text-slate-500 shrink-0" })] }), isOpen && (_jsxs("div", { className: "px-4 pb-4 border-t border-slate-800/50 pt-3", children: [_jsx("p", { className: "text-slate-300 text-sm leading-relaxed whitespace-pre-line", children: msg.body }), msg.type === 'offer' && (_jsxs("button", { onClick: e => { e.stopPropagation(); setTab('credits'); }, className: "mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors", children: [_jsx(DollarSign, { className: "w-3.5 h-3.5" }), " Voir et accepter l'offre \u2192"] }))] }))] }, msg.id));
                                    })] }))] }))] })] }));
}
