import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { authFetch } from '../../utils/authFetch';
import DocumentPreviewModal from '../../components/shared/DocumentPreviewModal';
import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, TrendingUp, DollarSign, FileText, RefreshCw, MessageCircle, Zap, CheckCircle, AlertCircle, Package, Clock, BarChart3, Upload, User, CreditCard, Shield, Copy, ExternalLink, X, Send, Calculator, Eye, EyeOff, Download, Trash2, } from 'lucide-react';
// ── Helpers ───────────────────────────────────────────────────────────────────
const BAND_COLOR = {
    A: 'emerald', B: 'green', C: 'blue', D: 'amber', E: 'red',
};
const PILLAR_CONFIG = {
    T: { label: 'Transactions', max: 300, color: 'sky' },
    E: { label: 'Épargne', max: 150, color: 'green' },
    R: { label: 'Revenus', max: 200, color: 'blue' },
    A: { label: 'Actifs', max: 150, color: 'purple' },
    S: { label: 'Social', max: 200, color: 'amber' },
};
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
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
const REQUIRED_CLIENT_DOCS = [
    { name: 'NIU / Carte Nationale', type: 'Identité', required: true, keywords: ['identity', 'carte', 'national', 'niu'] },
    { name: 'Justificatif de domicile', type: 'Adresse', required: true, keywords: ['domicile', 'adresse', 'residence', 'proof'] },
    { name: 'Bulletins de salaire (3 mois)', type: 'Revenus', required: true, keywords: ['payslip', 'salaire', 'paie'] },
    { name: 'Relevés ZOLA / banque (6 mois)', type: 'Financier', required: true, keywords: ['bank_statement', 'statement', 'releve', 'relevé', 'zola'] },
    { name: "Photos ou justificatifs d'actifs", type: 'Actifs', required: false, keywords: ['proof_asset', 'asset', 'actif'] },
];
function matchesRequiredDoc(requiredDoc, document) {
    const haystack = [
        document.category,
        document.category_label,
        document.doc_type,
        document.filename,
    ].filter(Boolean).join(' ').toLowerCase();
    return requiredDoc.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}
function getReviewTone(status) {
    if (status === 'approved')
        return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20';
    if (status === 'rejected')
        return 'bg-rose-500/10 text-rose-300 border border-rose-500/20';
    return 'bg-amber-500/10 text-amber-300 border border-amber-500/20';
}
function getDocStatusTone(status) {
    if (status === 'parsed' || status === 'validated')
        return 'bg-emerald-500/10 text-emerald-300';
    if (status === 'processing')
        return 'bg-sky-500/10 text-sky-300';
    if (status === 'failed' || status === 'rejected')
        return 'bg-rose-500/10 text-rose-300';
    return 'bg-slate-700/70 text-slate-300';
}
// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
    return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4", onClick: e => { if (e.target === e.currentTarget)
            onClose(); }, children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10", children: [_jsx("h3", { className: "text-white font-bold text-base", children: title }), _jsx("button", { onClick: onClose, className: "p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("div", { className: "p-6", children: children })] }) }));
}
// ── Modal 1: Proposer un crédit ───────────────────────────────────────────────
function ProposeCredit({ client, onClose }) {
    const [products, setProducts] = useState([]);
    const [loadingP, setLoadingP] = useState(true);
    const [form, setForm] = useState({ product: '', amount: '', duration: '', purpose: '' });
    const [sim, setSim] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    React.useEffect(() => {
        (async () => {
            try {
                const res = await authFetch('/api/scoring/bank/products/');
                const json = await res.json();
                const list = (Array.isArray(json) ? json : json.results ?? [])
                    .filter((p) => p.is_active && (!client.teras_score || p.min_score_required <= client.teras_score));
                setProducts(list);
            }
            catch {
                setProducts([]);
            }
            finally {
                setLoadingP(false);
            }
        })();
    }, []);
    // Calcul simulation mensualité
    const selectedProduct = products.find(p => String(p.id) === form.product);
    React.useEffect(() => {
        if (!selectedProduct || !form.amount || !form.duration) {
            setSim(null);
            return;
        }
        const rate = parseFloat(selectedProduct.interest_rate) / 100 / 12;
        const n = parseInt(form.duration);
        const amount = parseFloat(form.amount);
        const monthly = rate > 0 ? amount * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1) : amount / n;
        const total = monthly * n;
        const crm = client.crm_limit || 0;
        setSim({
            monthly: Math.round(monthly),
            total: Math.round(total),
            interest: Math.round(total - amount),
            eligible: monthly <= crm,
            effort: crm > 0 ? Math.round((monthly / crm) * 100) : 0,
        });
    }, [form.amount, form.duration, form.product, selectedProduct]);
    const handleSubmit = async () => {
        if (!form.product || !form.amount || !form.duration || !form.purpose) {
            setError('Tous les champs sont requis.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const res = await authFetch('/api/scoring/bank/applications/submit/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicant_type: 'individual',
                    client: client.id,
                    product: parseInt(form.product),
                    requested_amount: parseFloat(form.amount),
                    duration_months: parseInt(form.duration),
                    purpose: form.purpose,
                }),
            });
            if (!res.ok) {
                const d = await res.json();
                setError(JSON.stringify(d));
                return;
            }
            setSuccess(true);
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setSubmitting(false);
        }
    };
    if (success)
        return (_jsxs("div", { className: "text-center py-6", children: [_jsx(CheckCircle, { className: "w-14 h-14 text-emerald-400 mx-auto mb-4" }), _jsx("h3", { className: "text-white font-bold text-lg mb-2", children: "Demande soumise !" }), _jsxs("p", { className: "text-slate-400 text-sm mb-6", children: ["La demande de cr\u00E9dit de ", client.first_name, " est en attente de validation."] }), _jsx("button", { onClick: onClose, className: "px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm", children: "Fermer" })] }));
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4 flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center", children: _jsxs("span", { className: "text-white text-sm font-bold", children: [client.first_name[0], client.last_name[0]] }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("p", { className: "text-white font-medium text-sm", children: [client.first_name, " ", client.last_name] }), _jsxs("p", { className: "text-slate-400 text-xs", children: ["Score : ", client.teras_score ?? '—', " \u00B7 CRM : ", fmt(client.crm_limit), "/mois"] })] }), client.teras_score && (_jsx("span", { className: `px-2.5 py-1 text-xs rounded-full font-medium bg-${BAND_COLOR[client.teras_band || 'E']}-500/10 text-${BAND_COLOR[client.teras_band || 'E']}-400`, children: client.teras_band || 'E' }))] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Produit financier *" }), loadingP ? _jsx("p", { className: "text-slate-500 text-sm", children: "Chargement\u2026" }) : (_jsxs("select", { value: form.product, onChange: e => setForm(f => ({ ...f, product: e.target.value, amount: '', duration: '' })), className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "", children: "S\u00E9lectionner un produit" }), products.map(p => (_jsxs("option", { value: p.id, children: [p.name, " \u2014 ", p.interest_rate, "%/an (", fmt(p.min_amount), "\u2013", fmt(p.max_amount), ")"] }, p.id)))] })), products.length === 0 && !loadingP && (_jsx("p", { className: "text-amber-400 text-xs mt-1", children: "\u26A0 Aucun produit \u00E9ligible pour ce score." }))] }), selectedProduct && (_jsxs("div", { className: "bg-slate-800/30 rounded-xl p-3 text-xs text-slate-400 space-y-1", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Montant" }), _jsxs("span", { className: "text-white", children: [fmt(selectedProduct.min_amount), " \u2192 ", fmt(selectedProduct.max_amount)] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Dur\u00E9e" }), _jsxs("span", { className: "text-white", children: [selectedProduct.min_duration_months, "\u2013", selectedProduct.max_duration_months, " mois"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Taux" }), _jsxs("span", { className: "text-white", children: [selectedProduct.interest_rate, "%/an"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Score min requis" }), _jsx("span", { className: "text-white", children: selectedProduct.min_score_required })] })] })), selectedProduct && (_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Montant (FCFA) *" }), _jsx("input", { type: "number", value: form.amount, onChange: e => setForm(f => ({ ...f, amount: e.target.value })), placeholder: `${selectedProduct.min_amount}–${selectedProduct.max_amount}`, min: selectedProduct.min_amount, max: selectedProduct.max_amount, className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Dur\u00E9e (mois) *" }), _jsxs("select", { value: form.duration, onChange: e => setForm(f => ({ ...f, duration: e.target.value })), className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "", children: "\u2014" }), Array.from({ length: selectedProduct.max_duration_months - selectedProduct.min_duration_months + 1 }, (_, i) => selectedProduct.min_duration_months + i).filter(m => m % (selectedProduct.min_duration_months <= 3 ? 1 : 3) === 0 || m === selectedProduct.min_duration_months || m === selectedProduct.max_duration_months)
                                        .slice(0, 12)
                                        .map(m => _jsxs("option", { value: m, children: [m, " mois"] }, m))] })] })] })), sim && (_jsxs("div", { className: `rounded-xl p-4 border ${sim.eligible ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Calculator, { className: "w-4 h-4 text-slate-400" }), _jsx("p", { className: "text-white font-semibold text-sm", children: "Simulation" }), _jsx("span", { className: `ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${sim.eligible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`, children: sim.eligible ? '✓ Éligible' : '✗ Dépasse le CRM' })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3 text-xs", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 mb-0.5", children: "Mensualit\u00E9" }), _jsx("p", { className: "text-white font-bold text-base", children: fmt(sim.monthly) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 mb-0.5", children: "Total rembours\u00E9" }), _jsx("p", { className: "text-white font-semibold", children: fmt(sim.total) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 mb-0.5", children: "Int\u00E9r\u00EAts" }), _jsx("p", { className: "text-amber-400 font-semibold", children: fmt(sim.interest) })] })] }), _jsxs("div", { className: "mt-3", children: [_jsxs("div", { className: "flex justify-between text-xs mb-1", children: [_jsx("span", { className: "text-slate-400", children: "Effort (mensualit\u00E9 / CRM)" }), _jsxs("span", { className: sim.eligible ? 'text-emerald-400' : 'text-red-400', children: [sim.effort, "% ", sim.eligible ? '≤ 100% ✓' : '> 100% ✗'] })] }), _jsx("div", { className: "h-2 bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full ${sim.eligible ? 'bg-emerald-500' : 'bg-red-500'}`, style: { width: `${Math.min(sim.effort, 100)}%` } }) })] })] })), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Objet du cr\u00E9dit *" }), _jsx("textarea", { value: form.purpose, onChange: e => setForm(f => ({ ...f, purpose: e.target.value })), placeholder: "Ex: Achat d'une moto-taxi pour l'activit\u00E9 commerciale\u2026", rows: 3, className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 resize-none" })] }), error && _jsxs("p", { className: "text-red-400 text-xs flex items-center gap-1", children: [_jsx(AlertCircle, { className: "w-3.5 h-3.5" }), error] }), _jsxs("div", { className: "flex gap-3 pt-2", children: [_jsx("button", { onClick: onClose, className: "px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors", children: "Annuler" }), _jsx("button", { onClick: handleSubmit, disabled: submitting || !sim?.eligible, className: "flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors", children: submitting ? _jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), " Envoi\u2026"] }) : _jsxs(_Fragment, { children: [_jsx(Send, { className: "w-4 h-4" }), " Soumettre la demande"] }) })] })] }));
}
// ── Modal 2: Simulateur crédit ────────────────────────────────────────────────
function SimulatorModal({ client, onClose }) {
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({ product: '', amount: '', duration: '' });
    const [result, setResult] = useState(null);
    React.useEffect(() => {
        authFetch('/api/scoring/bank/products/')
            .then(r => r.json())
            .then(d => setProducts(Array.isArray(d) ? d : d.results ?? []));
    }, []);
    const product = products.find(p => String(p.id) === form.product);
    const calculate = () => {
        if (!product || !form.amount || !form.duration)
            return;
        const rate = parseFloat(product.interest_rate) / 100 / 12;
        const n = parseInt(form.duration);
        const amount = parseFloat(form.amount);
        const fees = amount * (parseFloat(product.origination_fee) / 100);
        const monthly = rate > 0 ? amount * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1) : amount / n;
        const total = monthly * n;
        const crm = client.crm_limit || 0;
        setResult({
            monthly: Math.round(monthly),
            total: Math.round(total),
            interest: Math.round(total - amount),
            fees: Math.round(fees),
            eligible: !client.teras_score || product.min_score_required <= client.teras_score,
            affordable: crm === 0 || monthly <= crm,
            effort: crm > 0 ? Math.round((monthly / crm) * 100) : 0,
            rate: product.interest_rate,
        });
    };
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4 text-sm", children: [_jsx("p", { className: "text-slate-400 text-xs mb-2", children: "Client simul\u00E9" }), _jsxs("p", { className: "text-white font-medium", children: [client.first_name, " ", client.last_name] }), _jsxs("p", { className: "text-slate-400 text-xs", children: ["Score : ", client.teras_score ?? '—', " \u00B7 CRM : ", fmt(client.crm_limit), "/mois"] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Produit" }), _jsxs("select", { value: form.product, onChange: e => setForm(f => ({ ...f, product: e.target.value })), className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "", children: "Choisir un produit" }), products.map(p => _jsxs("option", { value: p.id, children: [p.name, " \u2014 ", p.interest_rate, "%"] }, p.id))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Montant (FCFA)" }), _jsx("input", { type: "number", value: form.amount, onChange: e => setForm(f => ({ ...f, amount: e.target.value })), placeholder: product ? `${fmt(product.min_amount)} – ${fmt(product.max_amount)}` : 'Montant', className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Dur\u00E9e (mois)" }), _jsx("input", { type: "number", value: form.duration, onChange: e => setForm(f => ({ ...f, duration: e.target.value })), placeholder: product ? `${product.min_duration_months}–${product.max_duration_months}` : 'Durée', className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" })] })] }), _jsxs("button", { onClick: calculate, className: "w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors", children: [_jsx(Calculator, { className: "w-4 h-4" }), " Calculer"] }), result && (_jsxs("div", { className: "bg-slate-800/40 rounded-xl p-5 space-y-4", children: [_jsx("div", { className: "grid grid-cols-2 gap-3", children: [
                            { label: 'Mensualité', val: fmt(result.monthly), color: 'white', big: true },
                            { label: 'Total à rembourser', val: fmt(result.total), color: 'slate-300', big: false },
                            { label: 'Intérêts totaux', val: fmt(result.interest), color: 'amber-400', big: false },
                            { label: 'Frais dossier', val: fmt(result.fees), color: 'slate-400', big: false },
                        ].map(({ label, val, color, big }) => (_jsxs("div", { className: "bg-slate-800/50 rounded-lg p-3", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: label }), _jsx("p", { className: `text-${color} font-${big ? 'bold text-lg' : 'semibold text-sm'}`, children: val })] }, label))) }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: `flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${result.eligible ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`, children: [result.eligible ? _jsx(CheckCircle, { className: "w-4 h-4" }) : _jsx(AlertCircle, { className: "w-4 h-4" }), "Score ", result.eligible ? `≥ ${product?.min_score_required} ✓ Éligible` : `< score requis ✗`] }), _jsxs("div", { className: `flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${result.affordable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`, children: [result.affordable ? _jsx(CheckCircle, { className: "w-4 h-4" }) : _jsx(AlertCircle, { className: "w-4 h-4" }), "Effort budg\u00E9taire : ", result.effort, "% du CRM ", result.affordable ? '✓ Acceptable' : '⚠ Dépasse le CRM'] })] }), _jsxs("p", { className: "text-slate-500 text-xs", children: ["Taux annuel fixe : ", result.rate, "% \u00B7 Calcul indicatif, conditions d\u00E9finitives selon dossier."] })] })), _jsx("button", { onClick: onClose, className: "w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors", children: "Fermer" })] }));
}
// ── Modal 3: Envoyer un message ───────────────────────────────────────────────
function MessageModal({ client, onClose }) {
    const [type, setType] = useState('info');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const TEMPLATES = {
        info: { subject: 'Information sur votre compte TERAS', body: `Bonjour ${client.first_name},\n\nNous vous contactons au sujet de votre compte TERAS.\n\n` },
        reminder: { subject: 'Rappel échéance de remboursement', body: `Bonjour ${client.first_name},\n\nNous vous rappelons que votre prochaine échéance de remboursement approche.\n\nMontant dû : \nDate limite : \n\nEn cas de difficulté, contactez-nous.\n\nCordialement,\nL'équipe TERAS Banque` },
        offer: { subject: 'Offre de crédit personnalisée pour vous', body: `Bonjour ${client.first_name},\n\nSuite à l'analyse de votre profil TERAS (Score : ${client.teras_score ?? '—'}), nous avons le plaisir de vous proposer :\n\n• Produit : \n• Montant : jusqu'à ${fmt(client.crm_limit * 12)} FCFA\n• Taux préférentiel\n\nContactez votre conseiller pour plus d'informations.\n\nCordialement,\nL'équipe TERAS Banque` },
        alert: { subject: 'Action requise sur votre compte', body: `Bonjour ${client.first_name},\n\nVotre attention est requise concernant votre compte TERAS.\n\n` },
    };
    const applyTemplate = (t) => {
        setType(t);
        setSubject(TEMPLATES[t].subject);
        setBody(TEMPLATES[t].body);
    };
    const handleSend = async () => {
        if (!subject || !body)
            return;
        setSending(true);
        setError('');
        try {
            const res = await authFetch('/api/scoring/bank/send-message/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient_email: client.email,
                    subject,
                    body,
                    type,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data.error || `Erreur ${res.status}`);
            setSent(true);
        }
        catch (e) {
            setError(e.message || "Impossible d'envoyer le message.");
        }
        finally {
            setSending(false);
        }
    };
    if (sent)
        return (_jsxs("div", { className: "text-center py-8", children: [_jsx(Send, { className: "w-14 h-14 text-emerald-400 mx-auto mb-4" }), _jsx("h3", { className: "text-white font-bold text-lg mb-2", children: "Message envoy\u00E9 !" }), _jsxs("p", { className: "text-slate-400 text-sm mb-6", children: [client.first_name, " ", client.last_name, " recevra le message sur ", _jsx("span", { className: "text-white", children: client.email })] }), _jsx("button", { onClick: onClose, className: "px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm", children: "Fermer" })] }));
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4 flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shrink-0", children: _jsxs("span", { className: "text-white text-sm font-bold", children: [client.first_name[0], client.last_name[0]] }) }), _jsxs("div", { children: [_jsxs("p", { className: "text-white font-medium text-sm", children: [client.first_name, " ", client.last_name] }), _jsxs("p", { className: "text-slate-400 text-xs", children: [client.email, " \u00B7 ", client.phone] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-2 block", children: "Type de message" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: [
                            { id: 'info', label: '📋 Information', color: 'blue' },
                            { id: 'offer', label: '🎁 Offre commerciale', color: 'emerald' },
                            { id: 'reminder', label: '⏰ Rappel échéance', color: 'amber' },
                            { id: 'alert', label: '⚠️ Alerte compte', color: 'red' },
                        ].map(({ id, label, color }) => (_jsx("button", { onClick: () => applyTemplate(id), className: `px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${type === id
                                ? `bg-${color}-500/20 text-${color}-400 border border-${color}-500/30`
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'}`, children: label }, id))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Sujet" }), _jsx("input", { value: subject, onChange: e => setSubject(e.target.value), placeholder: "Sujet du message", className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: "Message" }), _jsx("textarea", { value: body, onChange: e => setBody(e.target.value), rows: 8, className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 resize-none font-mono text-xs leading-relaxed" })] }), error && _jsx("p", { className: "text-red-400 text-xs", children: error }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: onClose, className: "px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors", children: "Annuler" }), _jsx("button", { onClick: handleSend, disabled: sending || !subject || !body, className: "flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors", children: sending ? _jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), " Envoi\u2026"] }) : _jsxs(_Fragment, { children: [_jsx(Send, { className: "w-4 h-4" }), " Envoyer"] }) })] })] }));
}
// ── Sous-composant produits éligibles ─────────────────────────────────────────
function ProductSuggestions({ score }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    React.useEffect(() => {
        (async () => {
            try {
                const res = await authFetch('/api/scoring/bank/products/');
                const json = await res.json();
                setProducts((Array.isArray(json) ? json : json.results ?? [])
                    .filter((p) => !score || p.min_score_required <= score).slice(0, 4));
            }
            catch {
                setProducts([]);
            }
            finally {
                setLoading(false);
            }
        })();
    }, [score]);
    if (loading)
        return _jsx("p", { className: "text-slate-500 text-xs text-center py-4", children: "Chargement\u2026" });
    if (!products.length)
        return _jsx("p", { className: "text-slate-500 text-xs text-center py-4", children: "Aucun produit \u00E9ligible." });
    return (_jsx("div", { className: "space-y-3", children: products.map(p => (_jsxs("div", { className: "bg-slate-800/30 rounded-xl p-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white text-sm font-medium", children: p.name }), _jsxs("p", { className: "text-slate-400 text-xs", children: [p.interest_rate, "%/an \u00B7 Score \u2265 ", p.min_score_required, " \u00B7 jusqu'\u00E0 ", fmt(p.max_amount)] })] }), _jsx("span", { className: "px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full shrink-0", children: "\u00C9ligible" })] }, p.id))) }));
}
// ── Composant principal ───────────────────────────────────────────────────────
export default function BankClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileRef = useRef(null);
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [uploading, setUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState(null);
    const [clientOwnedDocs, setClientOwnedDocs] = useState([]);
    const [bankSideDocs, setBankSideDocs] = useState([]);
    const [docsSummary, setDocsSummary] = useState({});
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [previewDocId, setPreviewDocId] = useState(null);
    const [copied, setCopied] = useState(false);
    const [aiRecs, setAiRecs] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [refreshingPassport, setRefreshingPassport] = useState(false);
    // Modals
    const [modal, setModal] = useState(null);
    const [showPass, setShowPass] = useState(false);
    const loadClient = async () => {
        if (!id)
            return;
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch(`/api/scoring/bank/clients/${id}/`);
            if (!res.ok)
                throw new Error(`Client introuvable (${res.status})`);
            setClient(await res.json());
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    };
    React.useEffect(() => { loadClient(); }, [id]);
    const loadClientDocs = React.useCallback(async () => {
        if (!id)
            return;
        setLoadingDocs(true);
        try {
            const res = await authFetch(`/api/scoring/bank/clients/${id}/documents/`);
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data.error || `Erreur ${res.status}`);
            setClientOwnedDocs(data.client_documents || []);
            setBankSideDocs(data.bank_documents || []);
            setDocsSummary(data.summary || {});
        }
        catch (e) {
            setUploadMsg(`❌ ${e.message || 'Erreur chargement documents client.'}`);
        }
        finally {
            setLoadingDocs(false);
        }
    }, [id]);
    React.useEffect(() => {
        if (activeTab === 'documents') {
            loadClientDocs();
        }
    }, [activeTab, loadClientDocs]);
    const refreshPassport = async () => {
        if (!id)
            return;
        setRefreshingPassport(true);
        setError(null);
        try {
            const res = await authFetch(`/api/scoring/bank/clients/${id}/refresh-passport/`, { method: 'POST' });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(payload.error || `Erreur ${res.status}`);
            setClient(payload);
        }
        catch (e) {
            setError(e.message || 'Impossible de rafraichir le passeport client.');
        }
        finally {
            setRefreshingPassport(false);
        }
    };
    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !client)
            return;
        setUploading(true);
        setUploadMsg(null);
        try {
            const form = new FormData();
            form.append('file', file);
            form.append('doc_type', 'bank_document');
            form.append('notes', `Document banque — ${client.first_name} ${client.last_name}`);
            form.append('client_id', String(client.id));
            const res = await authFetch('/api/scoring/bank/documents/upload/', { method: 'POST', body: form });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data.error || `Erreur ${res.status}`);
            if (data.status === 'parsed') {
                setUploadMsg(`✅ Document client uploadé et analysé${data.transactions_count ? ` (${data.transactions_count} lignes)` : ''}`);
            }
            else if (data.status === 'processing') {
                setUploadMsg('✅ Document client enregistré. Analyse en arrière-plan en cours.');
            }
            else {
                setUploadMsg(data.message || '✅ Document client enregistré.');
            }
            loadClientDocs();
        }
        catch (e) {
            setUploadMsg(`❌ ${e.message}`);
        }
        finally {
            setUploading(false);
            if (fileRef.current)
                fileRef.current.value = '';
        }
    };
    const handleClientDocDownload = async (doc) => {
        try {
            const endpoint = doc.source === 'client'
                ? `/api/scoring/bank/client-documents/${doc.document_id}/download/`
                : `/api/scoring/bank/documents/${doc.id}/download/`;
            const res = await authFetch(endpoint);
            if (!res.ok)
                throw new Error(`Erreur ${res.status}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = doc.filename || doc.id;
            anchor.click();
            URL.revokeObjectURL(url);
        }
        catch (e) {
            setUploadMsg(`❌ ${e.message || 'Téléchargement impossible.'}`);
        }
    };
    const handleBankDocDelete = async (doc) => {
        if (!confirm('Supprimer ce document banque ?'))
            return;
        try {
            const res = await authFetch(`/api/scoring/bank/documents/${doc.id}/delete/`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data.error || `Erreur ${res.status}`);
            setUploadMsg('✅ Document supprimé.');
            if (previewDocId === doc.id)
                setPreviewDocId(null);
            loadClientDocs();
        }
        catch (e) {
            setUploadMsg(`❌ ${e.message || 'Suppression impossible.'}`);
        }
    };
    const handleClientDocReview = async (doc, reviewStatus) => {
        const defaultNote = reviewStatus === 'approved'
            ? 'Document vérifié par la banque.'
            : 'Document incomplet, illisible ou non conforme.';
        const note = window.prompt(reviewStatus === 'approved'
            ? 'Commentaire de validation (optionnel)'
            : 'Motif du rejet du document', defaultNote);
        if (note === null)
            return;
        if (reviewStatus === 'rejected' && !note.trim()) {
            setUploadMsg('❌ Le motif du rejet est obligatoire.');
            return;
        }
        try {
            const res = await authFetch(`/api/scoring/bank/client-documents/${doc.document_id}/review/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: reviewStatus, notes: note }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data.error || `Erreur ${res.status}`);
            setUploadMsg(`✅ ${data.message || 'Document mis à jour.'}`);
            loadClientDocs();
        }
        catch (e) {
            setUploadMsg(`❌ ${e.message || 'Revue du document impossible.'}`);
        }
    };
    const allDocs = [...clientOwnedDocs, ...bankSideDocs];
    const previewDoc = allDocs.find(doc => doc.id === previewDocId) || null;
    const uploadedCoverage = REQUIRED_CLIENT_DOCS.map((requiredDoc) => {
        const matches = clientOwnedDocs.filter((doc) => matchesRequiredDoc(requiredDoc, doc));
        const approved = matches.some((doc) => doc.bank_review?.status === 'approved');
        return {
            ...requiredDoc,
            count: matches.length,
            approved,
        };
    });
    const generateAIRecs = async () => {
        if (!client)
            return;
        setAiLoading(true);
        setAiRecs([]);
        try {
            const bd = client.score_breakdown || {};
            const res = await authFetch('/api/scoring/user/recommendations/generate-from-simulation/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    score: client.teras_score || 0,
                    breakdown: { T: bd.T || 0, E: bd.E || 0, R: bd.R || 0, A: bd.A || 0, S: bd.S || 0 },
                }),
            });
            const data = await res.json();
            setAiRecs(data.recommendations || []);
        }
        catch {
            setAiRecs(['Augmente tes dépôts ZOLA régulièrement', 'Déclare tes actifs pour +30 pts', 'Maintiens 0 défaut de paiement']);
        }
        finally {
            setAiLoading(false);
        }
    };
    if (loading)
        return _jsx("div", { className: "flex items-center justify-center h-96", children: _jsx("div", { className: "w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" }) });
    if (error || !client)
        return (_jsxs("div", { className: "flex flex-col items-center justify-center h-96 gap-4", children: [_jsx("p", { className: "text-rose-400", children: error || 'Données indisponibles' }), _jsx("button", { onClick: () => navigate('/bank/clients'), className: "px-4 py-2 bg-slate-800 text-white rounded-xl text-sm", children: "\u2190 Retour" })] }));
    const band = client.teras_band || 'E';
    const bandCol = BAND_COLOR[band] || 'slate';
    const breakdown = client.score_breakdown || {};
    const apps = client.applications || [];
    const passport = client.financial_passport || {};
    const docPassport = passport.documents || {};
    const analysisPassport = passport.analysis || {};
    const metricPassport = passport.metrics || {};
    const assetPassport = analysisPassport.asset_intelligence || {};
    const tabs = [
        { id: 'overview', label: "Vue d'ensemble", icon: BarChart3 },
        { id: 'scoring', label: 'Score Détaillé', icon: TrendingUp },
        { id: 'credits', label: `Crédits (${apps.length})`, icon: DollarSign },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'recommendations', label: 'IA Conseils', icon: Zap },
    ];
    return (_jsxs("div", { className: "space-y-6 p-1", children: [modal === 'credit' && _jsx(Modal, { title: "Proposer un cr\u00E9dit", onClose: () => setModal(null), children: _jsx(ProposeCredit, { client: client, onClose: () => { setModal(null); loadClient(); } }) }), modal === 'simulator' && _jsx(Modal, { title: "Simulateur de cr\u00E9dit", onClose: () => setModal(null), children: _jsx(SimulatorModal, { client: client, onClose: () => setModal(null) }) }), modal === 'message' && _jsx(Modal, { title: "Envoyer un message", onClose: () => setModal(null), children: _jsx(MessageModal, { client: client, onClose: () => setModal(null) }) }), _jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: () => navigate('/bank/clients'), className: "p-2 hover:bg-slate-800 rounded-lg transition-colors", children: _jsx(ArrowLeft, { className: "w-5 h-5 text-slate-400" }) }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center", children: _jsxs("span", { className: "text-white text-xl font-bold", children: [client.first_name?.[0], client.last_name?.[0]] }) }), _jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-white", children: [client.first_name, " ", client.last_name] }), _jsxs("p", { className: "text-slate-400 text-sm", children: ["NIU : ", client.niu, " \u00B7 ", client.city, ", Congo (CG)"] })] })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: "Score TERAS" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-3xl font-bold text-white", children: client.teras_score ?? '—' }), _jsx("span", { className: `px-2.5 py-1 bg-${bandCol}-500/10 text-${bandCol}-400 text-sm rounded-full font-semibold`, children: band })] })] }), _jsxs("button", { onClick: refreshPassport, className: "px-4 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 rounded-xl flex items-center gap-2 text-sm", children: [_jsx(Zap, { className: `w-4 h-4 ${refreshingPassport ? 'animate-pulse' : ''}` }), " Rafra\u00EEchir le passeport"] }), _jsxs("button", { onClick: loadClient, className: "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center gap-2 text-sm", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), " Actualiser"] })] })] }), _jsx("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-2", children: _jsx("div", { className: "flex items-center gap-2 overflow-x-auto", children: tabs.map(tab => (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap text-sm ${activeTab === tab.id ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`, children: [_jsx(tab.icon, { className: "w-4 h-4" }), " ", tab.label] }, tab.id))) }) }), _jsxs("div", { className: "grid lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [activeTab === 'overview' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h2", { className: "text-white font-bold text-lg mb-5", children: "Informations Client" }), _jsx("div", { className: "grid md:grid-cols-2 gap-5", children: [
                                                    { icon: Mail, label: 'Email', val: client.email },
                                                    { icon: Phone, label: 'Téléphone', val: client.phone },
                                                    { icon: Calendar, label: 'Date de naissance', val: fmtDate(client.date_of_birth) },
                                                    { icon: MapPin, label: 'Adresse', val: `${client.address || '—'}, ${client.city}` },
                                                    { icon: User, label: 'Profession', val: client.occupation || '—' },
                                                    { icon: Clock, label: 'Client depuis', val: fmtDate(client.join_date) },
                                                ].map(({ icon: Icon, label, val }) => (_jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Icon, { className: "w-4 h-4 text-slate-400 mt-0.5 shrink-0" }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs", children: label }), _jsx("p", { className: "text-white text-sm", children: val })] })] }, label))) })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h2", { className: "text-white font-bold text-lg mb-5", children: "Passeport Financier" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
                                                    { label: 'Revenus/mois', val: fmt(metricPassport.verified_income_total || client.monthly_income), color: 'emerald' },
                                                    { label: 'CRM (30%)', val: fmt(client.crm_limit), color: 'sky' },
                                                    { label: 'Crédits actifs', val: client.active_loans_count, color: 'blue' },
                                                    { label: 'Actifs vérifiés', val: fmt(metricPassport.verified_assets_total || 0), color: 'purple' },
                                                ].map(({ label, val, color }) => (_jsxs("div", { className: `bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4`, children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: label }), _jsx("p", { className: `text-${color}-400 font-bold`, children: val })] }, label))) })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-white font-bold text-lg", children: "Actifs & Garanties" }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Lecture bancaire des preuves d'actifs appliquees au dossier individuel." })] }), _jsx("span", { className: `px-3 py-1 rounded-full text-xs font-semibold ${assetPassport.asset_proof_strength === 'strong'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                            : assetPassport.asset_proof_strength === 'medium'
                                                                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                                                : assetPassport.asset_proof_strength === 'light'
                                                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`, children: assetPassport.asset_proof_strength === 'strong'
                                                            ? 'Dossier mobilisable'
                                                            : assetPassport.asset_proof_strength === 'medium'
                                                                ? 'Preuves solides'
                                                                : assetPassport.asset_proof_strength === 'light'
                                                                    ? 'Base presente'
                                                                    : 'A completer' })] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
                                                    { label: "Pièces d'actifs", val: docPassport.proof_asset_docs || 0, color: 'sky' },
                                                    { label: 'Actifs appliqués', val: docPassport.proof_asset_docs_applied || 0, color: 'emerald' },
                                                    { label: 'Valeur documentée', val: fmt(metricPassport.documented_assets_total_xaf || 0), color: 'purple' },
                                                    { label: 'Garantie potentielle', val: fmt(metricPassport.collateral_candidate_value_xaf || 0), color: 'amber' },
                                                ].map(({ label, val, color }) => (_jsxs("div", { className: `bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4`, children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: label }), _jsx("p", { className: `text-${color}-400 font-bold`, children: val })] }, label))) }), _jsxs("div", { className: "mt-5 grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-slate-800/40 rounded-xl p-4 border border-slate-700/60", children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: "Derni\u00E8re preuve" }), _jsx("p", { className: "text-white font-medium", children: assetPassport.latest_proof_label || docPassport.latest_proof_label || 'Aucune preuve d’actif appliquée' }), _jsx("p", { className: "text-slate-500 text-xs mt-1 truncate", children: assetPassport.latest_proof_filename || docPassport.latest_proof_filename || 'Ajoutez facture, carte grise ou titre pour enrichir le passeport.' })] }), _jsxs("div", { className: "bg-slate-800/40 rounded-xl p-4 border border-slate-700/60", children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: "Derni\u00E8re valeur d\u00E9tect\u00E9e" }), _jsx("p", { className: "text-white font-medium", children: fmt(assetPassport.latest_asset_value_xaf || 0) }), _jsx("p", { className: "text-slate-500 text-xs mt-1", children: docPassport.latest_processed_at
                                                                    ? `Traitée le ${fmtDate(docPassport.latest_processed_at)}`
                                                                    : 'Aucun traitement d’actif récent.' })] })] }), !!assetPassport.alerts?.length && (_jsx("div", { className: "mt-5 space-y-2", children: (assetPassport.alerts || []).slice(0, 2).map((item, index) => (_jsxs("div", { className: "flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-amber-400 mt-0.5 shrink-0" }), _jsx("p", { className: "text-sm text-slate-300", children: item })] }, `${item}-${index}`))) }))] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h2", { className: "text-white font-bold text-lg mb-5", children: "Couverture documentaire" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
                                                    { label: 'Pièces totales', val: docPassport.total_docs || 0, color: 'sky' },
                                                    { label: 'Analysées IA', val: docPassport.analyzed_docs || 0, color: 'violet' },
                                                    { label: 'Appliquées TERAS', val: docPassport.applied_docs || 0, color: 'emerald' },
                                                    { label: 'Recommandations ouvertes', val: metricPassport.pending_recommendations || 0, color: 'amber' },
                                                ].map(({ label, val, color }) => (_jsxs("div", { className: `bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4`, children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: label }), _jsx("p", { className: `text-${color}-400 font-bold`, children: val })] }, label))) }), (analysisPassport.latest_strengths?.length || analysisPassport.latest_risks?.length || analysisPassport.latest_recommendations?.length) ? (_jsxs("div", { className: "mt-5 grid md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-slate-800/40 rounded-xl p-4", children: [_jsx("p", { className: "text-emerald-400 text-xs font-semibold mb-2", children: "Forces d\u00E9tect\u00E9es" }), (analysisPassport.latest_strengths || []).slice(0, 3).map((item, index) => (_jsxs("p", { className: "text-sm text-slate-300 mb-1", children: ["\u2022 ", item] }, `strength-${index}`)))] }), _jsxs("div", { className: "bg-slate-800/40 rounded-xl p-4", children: [_jsx("p", { className: "text-amber-400 text-xs font-semibold mb-2", children: "Vigilances" }), (analysisPassport.latest_risks || []).slice(0, 3).map((item, index) => (_jsxs("p", { className: "text-sm text-slate-300 mb-1", children: ["\u2022 ", item] }, `risk-${index}`)))] }), _jsxs("div", { className: "bg-slate-800/40 rounded-xl p-4", children: [_jsx("p", { className: "text-sky-400 text-xs font-semibold mb-2", children: "Actions recommand\u00E9es" }), (analysisPassport.latest_recommendations || []).slice(0, 3).map((item, index) => (_jsxs("p", { className: "text-sm text-slate-300 mb-1", children: ["\u2022 ", item] }, `action-${index}`)))] })] })) : (_jsx("p", { className: "text-slate-500 text-sm mt-5", children: "Aucun signal documentaire applique pour ce client pour le moment." })), analysisPassport.latest_summary_meta && (_jsxs("div", { className: "mt-5 rounded-xl bg-slate-800/40 p-4 border border-slate-700/60", children: [_jsx("p", { className: "text-cyan-400 text-xs font-semibold mb-2", children: "Derni\u00E8re analyse appliqu\u00E9e au dossier" }), _jsxs("div", { className: "grid md:grid-cols-4 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: "Type" }), _jsx("p", { className: "text-white", children: analysisPassport.latest_summary_meta.document_type || '—' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: "Impact estim\u00E9" }), _jsxs("p", { className: "text-white", children: ["+", analysisPassport.latest_summary_meta.estimated_change || 0, " pts"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: "Confiance" }), _jsxs("p", { className: "text-white", children: [Math.round(Number(analysisPassport.latest_summary_meta.confidence || 0) * 100), "%"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: "Analys\u00E9 le" }), _jsx("p", { className: "text-white", children: fmtDate(analysisPassport.latest_summary_meta.analyzed_at) })] })] })] })), _jsxs("div", { className: "mt-4 text-xs text-slate-500", children: ["Dernier traitement : ", fmtDate(docPassport.latest_processed_at), " \u00B7 Derni\u00E8re cat\u00E9gorie : ", docPassport.latest_category || '—', " \u00B7 Couverture dossier : ", Math.round(Number(docPassport.coverage_ratio || 0) * 100), "%"] })] }), client.teras_account_email && (_jsxs("div", { className: "bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "text-sky-400 font-semibold flex items-center gap-2", children: [_jsx(Shield, { className: "w-4 h-4" }), " Compte TERAS Auto-Cr\u00E9\u00E9"] }), _jsx("span", { className: "px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20", children: "\u2713 Actif" })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "bg-slate-800/40 rounded-xl p-3 flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-slate-400 text-xs mb-0.5", children: "Email de connexion" }), _jsx("p", { className: "text-white font-mono text-xs truncate", children: client.teras_account_email })] }), _jsx("button", { onClick: async () => { await navigator.clipboard.writeText(client.teras_account_email); setCopied(true); setTimeout(() => setCopied(false), 2000); }, className: "p-1.5 hover:bg-slate-700 rounded-lg transition-colors shrink-0", children: copied ? _jsx(CheckCircle, { className: "w-3.5 h-3.5 text-emerald-400" }) : _jsx(Copy, { className: "w-3.5 h-3.5 text-slate-500 hover:text-sky-400" }) })] }), client.teras_account_password && (_jsxs("div", { className: "bg-slate-800/40 rounded-xl p-3 flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-slate-400 text-xs mb-0.5", children: "Mot de passe initial" }), _jsx("p", { className: "text-white font-mono text-xs", children: showPass ? client.teras_account_password : '••••••••••••' })] }), _jsxs("div", { className: "flex gap-1.5 shrink-0", children: [_jsx("button", { onClick: () => setShowPass(p => !p), className: "p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white", children: showPass ? _jsx(EyeOff, { className: "w-3.5 h-3.5" }) : _jsx(Eye, { className: "w-3.5 h-3.5" }) }), _jsx("button", { onClick: async () => { await navigator.clipboard.writeText(client.teras_account_password); setCopied(true); setTimeout(() => setCopied(false), 2000); }, className: "p-1.5 hover:bg-slate-700 rounded-lg transition-colors", children: copied ? _jsx(CheckCircle, { className: "w-3.5 h-3.5 text-emerald-400" }) : _jsx(Copy, { className: "w-3.5 h-3.5 text-slate-500 hover:text-sky-400" }) })] })] })), _jsxs("div", { className: "flex items-center justify-between text-xs pt-1", children: [_jsx("p", { className: "text-slate-500", children: "Le client modifie son mot de passe \u00E0 la 1\u00E8re connexion." }), _jsxs("a", { href: "/login", target: "_blank", rel: "noopener", className: "text-sky-400 hover:text-sky-300 flex items-center gap-1 shrink-0 ml-3", children: ["Interface TERAS ", _jsx(ExternalLink, { className: "w-3 h-3" })] })] })] })] }))] })), activeTab === 'scoring' && (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-white font-bold text-lg", children: "D\u00E9composition TERAS" }), _jsxs("span", { className: `px-3 py-1 bg-${bandCol}-500/10 text-${bandCol}-400 text-sm rounded-full font-semibold`, children: [client.teras_score ?? '—', " pts \u2014 Bande ", band] })] }), Object.entries(PILLAR_CONFIG).map(([key, cfg]) => {
                                        const score = breakdown[key] ?? 0;
                                        const pct = Math.round((score / cfg.max) * 100);
                                        return (_jsxs("div", { className: "mb-5", children: [_jsxs("div", { className: "flex justify-between mb-2", children: [_jsxs("span", { className: "text-white font-semibold text-sm", children: [key, " \u2014 ", cfg.label, " ", _jsxs("span", { className: "text-slate-400 text-xs", children: ["(", score, "/", cfg.max, " pts)"] })] }), _jsxs("span", { className: `text-${cfg.color}-400 text-sm font-bold`, children: [pct, "%"] })] }), _jsx("div", { className: "h-3 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full bg-${cfg.color}-500 rounded-full transition-all duration-700`, style: { width: `${pct}%` } }) })] }, key));
                                    }), !client.score_breakdown && _jsx("p", { className: "text-center text-slate-500 text-sm py-4", children: "Score non encore calcul\u00E9." }), _jsxs("div", { className: "mt-5 pt-5 border-t border-slate-800/50 bg-sky-500/10 rounded-xl p-4", children: [_jsx("p", { className: "text-sky-400 font-semibold mb-3", children: "CRM \u2014 Capacit\u00E9 de Remboursement Mensuelle" }), _jsxs("div", { className: "grid grid-cols-3 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs mb-0.5", children: "Revenus/mois" }), _jsx("p", { className: "text-white font-bold", children: fmt(client.monthly_income) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs mb-0.5", children: "CRM = 30%" }), _jsx("p", { className: "text-sky-400 font-bold", children: fmt(client.crm_limit) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs mb-0.5", children: "Protocole" }), _jsx("p", { className: "text-slate-400 text-xs", children: "ZOLA / TERAS standard" })] })] })] })] })), activeTab === 'credits' && (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex justify-end", children: _jsxs("button", { onClick: () => setModal('credit'), className: "px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm flex items-center gap-2 transition-colors", children: [_jsx(Package, { className: "w-4 h-4" }), " Nouvelle demande"] }) }), apps.length === 0 ? (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-12 text-center", children: [_jsx(CreditCard, { className: "w-12 h-12 text-slate-600 mx-auto mb-3" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Aucune demande de cr\u00E9dit pour ce client." }), _jsx("button", { onClick: () => setModal('credit'), className: "mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm", children: "Proposer un cr\u00E9dit" })] })) : apps.map((app) => (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white font-semibold", children: app.product_name }), _jsx("p", { className: "text-slate-400 text-xs", children: app.application_id })] }), _jsx("span", { className: `px-3 py-1 text-xs rounded-full font-medium ${app.status === 'disbursed' ? 'bg-emerald-500/10 text-emerald-400' :
                                                            app.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                                                                app.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`, children: app.status === 'disbursed' ? 'Décaissé' : app.status === 'approved' ? 'Approuvé' : app.status === 'pending' ? 'En attente' : 'Rejeté' })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs mb-0.5", children: "Montant" }), _jsx("p", { className: "text-white font-semibold", children: fmt(app.requested_amount) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs mb-0.5", children: "Mensualit\u00E9" }), _jsx("p", { className: "text-white font-semibold", children: app.monthly_payment ? fmt(app.monthly_payment) : '—' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs mb-0.5", children: "Dur\u00E9e" }), _jsxs("p", { className: "text-white font-semibold", children: [app.duration_months, " mois"] })] })] }), _jsxs("p", { className: "text-slate-500 text-xs mt-3", children: ["Score au d\u00E9p\u00F4t : ", app.teras_score_at_application ?? '—', " \u00B7 ", fmtDate(app.created_at)] })] }, app.id)))] })), activeTab === 'documents' && (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "grid grid-cols-2 xl:grid-cols-4 gap-4", children: [
                                            { label: 'Dossier client TERAS', value: docsSummary.client_documents ?? clientOwnedDocs.length, color: 'sky' },
                                            { label: 'Pièces banque', value: docsSummary.bank_documents ?? bankSideDocs.length, color: 'violet' },
                                            { label: 'À vérifier', value: docsSummary.pending_review ?? 0, color: 'amber' },
                                            { label: 'Validées banque', value: docsSummary.approved_review ?? 0, color: 'emerald' },
                                        ].map((item) => (_jsxs("div", { className: `rounded-2xl border border-${item.color}-500/20 bg-${item.color}-500/10 p-4`, children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: item.label }), _jsx("p", { className: `text-${item.color}-300 text-2xl font-bold`, children: item.value })] }, item.label))) }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("h3", { className: "text-white font-semibold mb-4 flex items-center gap-2", children: [_jsx(Upload, { className: "w-4 h-4 text-sky-400" }), " Ajouter un Document"] }), _jsxs("div", { onClick: () => fileRef.current?.click(), className: "border-2 border-dashed border-slate-700 hover:border-sky-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors group", children: [_jsx(Upload, { className: "w-10 h-10 text-slate-600 group-hover:text-sky-400 mx-auto mb-3 transition-colors" }), _jsx("p", { className: "text-slate-400 text-sm mb-1", children: "Cliquer pour uploader" }), _jsx("p", { className: "text-slate-600 text-xs", children: "PDF, JPG, PNG, XLSX \u2014 Relev\u00E9s, contrats, justificatifs, actifs\u2026" }), _jsx("input", { ref: fileRef, type: "file", accept: ".pdf,.jpg,.jpeg,.png,.xlsx,.csv", className: "hidden", onChange: handleUpload })] }), uploading && _jsxs("div", { className: "flex items-center gap-2 mt-3 text-sky-400 text-sm", children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), " Analyse IA en cours\u2026"] }), uploadMsg && _jsx("p", { className: `mt-3 text-sm ${uploadMsg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`, children: uploadMsg })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden", children: [_jsxs("div", { className: "p-5 border-b border-slate-800/50 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-white font-semibold", children: "Dossier TERAS du client" }), _jsx("p", { className: "text-slate-500 text-xs mt-1", children: "Pi\u00E8ces d\u00E9j\u00E0 t\u00E9l\u00E9vers\u00E9es par le client, avec revue banque et notification automatique." })] }), _jsx("button", { onClick: loadClientDocs, className: "p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition", children: _jsx(RefreshCw, { className: `w-4 h-4 ${loadingDocs ? 'animate-spin' : ''}` }) })] }), loadingDocs ? (_jsxs("div", { className: "p-6 text-sm text-slate-400 flex items-center gap-2", children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), "Chargement des documents client..."] })) : clientOwnedDocs.length === 0 ? (_jsx("div", { className: "p-6 text-sm text-slate-500", children: "Aucun document TERAS client r\u00E9cup\u00E9r\u00E9 pour le moment." })) : (_jsx("div", { className: "divide-y divide-slate-800/30", children: clientOwnedDocs.map(doc => (_jsxs("div", { className: "flex items-start justify-between gap-4 p-4 hover:bg-slate-800/20 transition-colors", children: [_jsxs("div", { className: "flex items-start gap-3 min-w-0 flex-1", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0", children: _jsx(FileText, { className: "w-4 h-4 text-sky-400" }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-white text-sm truncate", children: doc.filename }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-500 flex-wrap", children: [_jsx("span", { children: doc.category_label || doc.category || 'document' }), _jsxs("span", { children: [doc.size_mb, " MB"] }), _jsx("span", { children: fmtDate(doc.uploaded_at) }), doc.summary?.transactions_count ? _jsxs("span", { children: [doc.summary.transactions_count, " lignes d\u00E9tect\u00E9es"] }) : null, doc.confidence ? _jsxs("span", { children: ["Confiance ", Math.round(doc.confidence), "%"] }) : null] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 mt-2", children: [_jsx("span", { className: `px-2 py-1 rounded-full text-[11px] ${getDocStatusTone(doc.status)}`, children: doc.display_status || doc.status }), _jsx("span", { className: `px-2 py-1 rounded-full text-[11px] ${getReviewTone(doc.bank_review?.status)}`, children: doc.bank_review?.status_label || 'À vérifier' }), doc.bank_review?.notes ? (_jsx("span", { className: "text-slate-500 text-[11px] truncate max-w-[360px]", children: doc.bank_review.notes })) : null] })] })] }), _jsxs("div", { className: "flex items-center gap-1 shrink-0 flex-wrap justify-end", children: [_jsx("button", { onClick: () => setPreviewDocId(doc.id), className: "p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition", title: "Visualiser", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleClientDocDownload(doc), className: "p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition", title: "T\u00E9l\u00E9charger", children: _jsx(Download, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleClientDocReview(doc, 'approved'), className: "px-3 py-2 rounded-lg text-emerald-300 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 transition text-xs", title: "Valider et notifier", children: "Valider" }), _jsx("button", { onClick: () => handleClientDocReview(doc, 'rejected'), className: "px-3 py-2 rounded-lg text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 transition text-xs", title: "Rejeter et notifier", children: "Rejeter" })] })] }, doc.id))) }))] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden", children: [_jsx("div", { className: "p-5 border-b border-slate-800/50 flex items-center justify-between", children: _jsxs("div", { children: [_jsx("h3", { className: "text-white font-semibold", children: "Pi\u00E8ces ajout\u00E9es par la banque" }), _jsx("p", { className: "text-slate-500 text-xs mt-1", children: "Contrats, analyses, pi\u00E8ces compl\u00E9mentaires et documents de travail internes." })] }) }), bankSideDocs.length === 0 ? (_jsx("div", { className: "p-6 text-sm text-slate-500", children: "Aucun document banque stock\u00E9 pour ce client pour le moment." })) : (_jsx("div", { className: "divide-y divide-slate-800/30", children: bankSideDocs.map(doc => (_jsxs("div", { className: "flex items-center justify-between gap-4 p-4 hover:bg-slate-800/20 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0", children: _jsx(FileText, { className: "w-4 h-4 text-violet-400" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-white text-sm truncate", children: doc.filename }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-500 flex-wrap", children: [_jsx("span", { children: doc.doc_type || 'document banque' }), _jsxs("span", { children: [doc.size_mb, " MB"] }), _jsx("span", { children: fmtDate(doc.uploaded_at) })] }), _jsx("div", { className: "mt-2", children: _jsx("span", { className: `px-2 py-1 rounded-full text-[11px] ${getDocStatusTone(doc.status)}`, children: doc.message || doc.display_status || doc.status }) })] })] }), _jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [_jsx("button", { onClick: () => setPreviewDocId(doc.id), className: "p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition", title: "Visualiser", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleClientDocDownload(doc), className: "p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition", title: "T\u00E9l\u00E9charger", children: _jsx(Download, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleBankDocDelete(doc), className: "p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 transition", title: "Supprimer", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }, doc.id))) }))] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden", children: [_jsx("div", { className: "p-5 border-b border-slate-800/50", children: _jsx("h3", { className: "text-white font-semibold", children: "Documents KYC Requis" }) }), _jsx("div", { className: "divide-y divide-slate-800/30", children: uploadedCoverage.map((doc, i) => (_jsxs("div", { className: "flex items-center justify-between p-4 hover:bg-slate-800/20 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-9 h-9 rounded-xl bg-slate-700/50 flex items-center justify-center", children: _jsx(FileText, { className: "w-4 h-4 text-sky-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-white text-sm", children: doc.name }), _jsxs("p", { className: "text-slate-500 text-xs", children: [doc.type, " \u00B7 ", doc.required ? 'Obligatoire' : 'Optionnel', " \u00B7 ", doc.count > 0 ? `${doc.count} reçu(x)` : 'Aucun reçu'] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `px-2.5 py-1 rounded-full text-[11px] ${doc.approved
                                                                        ? 'bg-emerald-500/10 text-emerald-300'
                                                                        : doc.count > 0
                                                                            ? 'bg-amber-500/10 text-amber-300'
                                                                            : 'bg-slate-700/70 text-slate-300'}`, children: doc.approved ? 'Vérifié' : doc.count > 0 ? 'Reçu' : 'Manquant' }), _jsxs("button", { onClick: () => fileRef.current?.click(), className: "px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg flex items-center gap-1.5 transition-colors", children: [_jsx(Upload, { className: "w-3 h-3" }), " Ajouter"] })] })] }, i))) })] })] })), activeTab === 'recommendations' && (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-start gap-4 mb-5", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0", children: _jsx(Zap, { className: "w-6 h-6 text-blue-400" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-white font-semibold text-lg mb-1", children: "Conseils IA Personnalis\u00E9s" }), _jsxs("p", { className: "text-slate-400 text-sm", children: ["Bas\u00E9 sur le score de ", client.first_name, " (", client.teras_score ?? '?', "/1000)"] })] }), _jsxs("button", { onClick: generateAIRecs, disabled: aiLoading, className: "px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm flex items-center gap-2", children: [aiLoading ? _jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }) : _jsx(Zap, { className: "w-4 h-4" }), aiLoading ? 'Génération…' : 'Générer'] })] }), aiRecs.length > 0 ? (_jsx("div", { className: "space-y-3", children: aiRecs.map((rec, i) => (_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4 flex items-start gap-3", children: [_jsx("div", { className: `w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${i === 0 ? 'bg-green-500/20' : i === 1 ? 'bg-blue-500/20' : 'bg-purple-500/20'}`, children: _jsx("span", { className: `font-bold text-sm ${i === 0 ? 'text-green-400' : i === 1 ? 'text-blue-400' : 'text-purple-400'}`, children: i + 1 }) }), _jsx("p", { className: "text-slate-300 text-sm leading-relaxed", children: rec })] }, i))) })) : !aiLoading && _jsx("p", { className: "text-slate-500 text-sm text-center py-4", children: "Cliquez sur \"G\u00E9n\u00E9rer\" pour obtenir des recommandations personnalis\u00E9es." })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("h3", { className: "text-white font-semibold mb-4 flex items-center gap-2", children: [_jsx(Package, { className: "w-4 h-4 text-amber-400" }), " Produits Financiers \u00C9ligibles"] }), _jsx(ProductSuggestions, { score: client.teras_score })] })] }))] }), _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5", children: [_jsx("h3", { className: "text-white font-semibold mb-4", children: "Actions Rapides" }), _jsxs("div", { className: "space-y-2.5", children: [_jsxs("button", { onClick: () => setModal('credit'), className: "w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20", children: [_jsx(Package, { className: "w-4 h-4" }), " Proposer un cr\u00E9dit"] }), _jsxs("button", { onClick: () => setModal('simulator'), className: "w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-slate-700", children: [_jsx(Calculator, { className: "w-4 h-4" }), " Simuler un cr\u00E9dit"] }), _jsxs("button", { onClick: () => setModal('message'), className: "w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-slate-700", children: [_jsx(MessageCircle, { className: "w-4 h-4" }), " Envoyer un message"] }), _jsxs("button", { onClick: loadClient, className: "w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors border border-slate-700", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), " Actualiser les donn\u00E9es"] })] })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5", children: [_jsx("h3", { className: "text-white font-semibold mb-4", children: "Statut du Compte" }), _jsx("div", { className: "space-y-3 text-sm", children: [
                                            { label: 'Statut', val: client.status === 'active' ? 'Actif' : client.status, color: client.status === 'active' ? 'emerald' : 'red' },
                                            { label: 'NIU', val: client.niu, color: 'slate' },
                                            { label: 'Pays', val: 'Congo (CG)', color: 'slate' },
                                            { label: 'Ville', val: client.city, color: 'slate' },
                                        ].map(({ label, val, color }) => (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: label }), _jsx("span", { className: `text-${color}-400 font-medium text-xs`, children: val })] }, label))) })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5", children: [_jsx("h3", { className: "text-white font-semibold mb-4", children: "\u00C9valuation Risque" }), client.teras_score ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-3", children: [_jsxs("div", { className: "flex justify-between text-xs mb-1", children: [_jsx("span", { className: "text-slate-400", children: "Niveau de risque" }), _jsx("span", { className: `text-${client.teras_score >= 700 ? 'emerald' : client.teras_score >= 500 ? 'amber' : 'red'}-400 font-medium`, children: client.teras_score >= 700 ? 'Faible' : client.teras_score >= 500 ? 'Moyen' : 'Élevé' })] }), _jsx("div", { className: "h-2.5 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full ${client.teras_score >= 700 ? 'bg-emerald-500' : client.teras_score >= 500 ? 'bg-amber-500' : 'bg-red-500'}`, style: { width: `${Math.round((client.teras_score / 1000) * 100)}%` } }) })] }), _jsxs("div", { className: "space-y-1.5 text-xs text-slate-400", children: [client.teras_score >= 600 && _jsxs("p", { className: "flex items-center gap-1.5", children: [_jsx(CheckCircle, { className: "w-3 h-3 text-emerald-400" }), "Score \u2265 600 \u2014 cr\u00E9dit standard \u00E9ligible"] }), client.active_loans_count === 0 && _jsxs("p", { className: "flex items-center gap-1.5", children: [_jsx(CheckCircle, { className: "w-3 h-3 text-emerald-400" }), "Aucun cr\u00E9dit en cours"] }), client.monthly_income && parseFloat(client.monthly_income) > 0 && _jsxs("p", { className: "flex items-center gap-1.5", children: [_jsx(CheckCircle, { className: "w-3 h-3 text-emerald-400" }), "Revenus d\u00E9clar\u00E9s"] }), client.teras_score < 500 && _jsxs("p", { className: "flex items-center gap-1.5", children: [_jsx(AlertCircle, { className: "w-3 h-3 text-amber-400" }), "Score insuffisant \u2014 microcr\u00E9dit uniquement"] })] })] })) : _jsx("p", { className: "text-slate-500 text-xs", children: "Score non encore calcul\u00E9." })] })] })] }), _jsx(DocumentPreviewModal, { isOpen: !!previewDoc, title: previewDoc ? `Document ${previewDoc.source === 'client' ? 'TERAS' : 'banque'} — ${previewDoc.filename}` : '', fileName: previewDoc?.filename || '', sourceUrl: previewDoc
                    ? previewDoc.source === 'client'
                        ? `/api/scoring/bank/client-documents/${previewDoc.document_id}/download/`
                        : `/api/scoring/bank/documents/${previewDoc.id}/download/`
                    : '', mode: "auth-fetch", onClose: () => setPreviewDocId(null), onDownload: () => {
                    if (previewDoc)
                        handleClientDocDownload(previewDoc);
                } })] }));
}
