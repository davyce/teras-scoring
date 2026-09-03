import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/shared/LinkedAccounts.tsx
// Composant réutilisable pour tous les types d'utilisateurs
// Lier comptes Mobile Money, ZOLA, Bancaires
import { useState, useEffect, useCallback } from 'react';
import { Smartphone, Plus, Trash2, CheckCircle, AlertCircle, RefreshCw, Loader2, X, Shield, TrendingUp, Wallet, Eye, Star, Link as LinkIcon, } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
// ─── Config opérateurs ────────────────────────────────────────────────────────
const OPERATORS = [
    {
        value: 'airtel_money',
        label: 'Airtel Money',
        icon: '📱',
        color: 'from-red-600 to-red-700',
        border: 'border-red-500/40',
        bg: 'bg-red-900/20',
        description: 'Congo · RDC · Ouganda',
        type: 'mobile_money',
    },
    {
        value: 'mtn_money',
        label: 'MTN Money',
        icon: '📱',
        color: 'from-yellow-500 to-yellow-600',
        border: 'border-yellow-500/40',
        bg: 'bg-yellow-900/20',
        description: 'Cameroun · Congo · RDC',
        type: 'mobile_money',
    },
    {
        value: 'zola',
        label: 'ZOLA',
        icon: '⚡',
        color: 'from-sky-500 to-blue-600',
        border: 'border-sky-500/40',
        bg: 'bg-sky-900/20',
        description: 'Portefeuille TERAS natif',
        type: 'wallet',
    },
    {
        value: 'orange_money',
        label: 'Orange Money',
        icon: '📱',
        color: 'from-orange-500 to-orange-600',
        border: 'border-orange-500/40',
        bg: 'bg-orange-900/20',
        description: 'Cameroun · Mali · Sénégal',
        type: 'mobile_money',
    },
    {
        value: 'bank_account',
        label: 'Compte Bancaire',
        icon: '🏦',
        color: 'from-emerald-600 to-teal-700',
        border: 'border-emerald-500/40',
        bg: 'bg-emerald-900/20',
        description: 'Afriland · BGFI · Ecobank · LCB',
        type: 'bank_account',
    },
];
const FCFA = (n) => {
    if (!n)
        return '0 FCFA';
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(2)} M FCFA`;
    return `${Math.round(n).toLocaleString('fr-FR')} FCFA`;
};
// ─── Modal : Ajouter un compte ────────────────────────────────────────────────
function AddAccountModal({ onClose, onSuccess }) {
    const [step, setStep] = useState(1);
    const [operator, setOperator] = useState('');
    const [phone, setPhone] = useState('');
    const [accountNum, setAccountNum] = useState('');
    const [accountName, setAccountName] = useState('');
    const [bankName, setBankName] = useState('');
    const [isPrimary, setIsPrimary] = useState(false);
    const [consent, setConsent] = useState(false);
    const [otp, setOtp] = useState('');
    const [accountId, setAccountId] = useState(null);
    const [devOtp, setDevOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const selectedOp = OPERATORS.find(o => o.value === operator);
    const isBankAccount = operator === 'bank_account';
    const handleAdd = async () => {
        if (!operator) {
            setError('Sélectionnez un opérateur.');
            return;
        }
        if (!isBankAccount && !phone) {
            setError('Numéro de téléphone requis.');
            return;
        }
        if (isBankAccount && !accountNum) {
            setError('Numéro de compte requis.');
            return;
        }
        if (!consent) {
            setError('Vous devez donner votre consentement.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await authFetch('/api/scoring/user/linked-accounts/add/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operator,
                    phone_number: phone || undefined,
                    account_number: accountNum || undefined,
                    account_name: accountName || undefined,
                    bank_name: bankName || undefined,
                    is_primary: isPrimary,
                    consent_given: consent,
                    account_type: selectedOp?.type || 'mobile_money',
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setAccountId(data.account_id);
                setDevOtp(data.otp_code || ''); // Code de dev (à retirer en prod)
                setStep(2);
            }
            else {
                setError(data.error || 'Erreur lors de l\'ajout.');
            }
        }
        catch {
            setError('Erreur réseau.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleVerify = async () => {
        if (!otp || otp.length !== 4) {
            setError('Code OTP à 4 chiffres requis.');
            return;
        }
        if (!accountId)
            return;
        setLoading(true);
        setError('');
        try {
            const res = await authFetch(`/api/scoring/user/linked-accounts/${accountId}/verify/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp_code: otp }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(`✅ ${selectedOp?.label} vérifié avec succès !`);
                setStep(3);
                setTimeout(() => { onSuccess(); onClose(); }, 2000);
            }
            else {
                setError(data.error || 'Code OTP incorrect.');
            }
        }
        catch {
            setError('Erreur réseau.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4", onClick: e => e.target === e.currentTarget && onClose(), children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md", children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-slate-800", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center", children: _jsx(LinkIcon, { className: "w-4 h-4 text-sky-400" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-white font-bold text-sm", children: "Lier un compte" }), _jsxs("p", { className: "text-slate-500 text-xs", children: ["\u00C9tape ", step, " / 3"] })] })] }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-white p-1", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("div", { className: "h-1 bg-slate-800", children: _jsx("div", { className: "h-full bg-sky-500 transition-all duration-500", style: { width: `${(step / 3) * 100}%` } }) }), _jsxs("div", { className: "p-5 space-y-4", children: [error && (_jsxs("div", { className: "flex items-center gap-2 px-3 py-2 bg-rose-900/20 border border-rose-700/40 rounded-xl text-rose-300 text-sm", children: [_jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }), error] })), success && (_jsxs("div", { className: "flex items-center gap-2 px-3 py-2 bg-emerald-900/20 border border-emerald-700/40 rounded-xl text-emerald-300 text-sm", children: [_jsx(CheckCircle, { className: "w-4 h-4 shrink-0" }), success] })), step === 1 && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-300 text-sm font-medium mb-3", children: "Choisir l'op\u00E9rateur" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: OPERATORS.map(op => (_jsxs("button", { onClick: () => setOperator(op.value), className: `p-3 rounded-xl border text-left transition-all ${operator === op.value
                                                    ? `${op.border} ${op.bg}`
                                                    : 'border-slate-800 hover:border-slate-700 bg-slate-800/30'}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-lg", children: op.icon }), _jsx("span", { className: "text-white text-sm font-medium", children: op.label })] }), _jsx("p", { className: "text-slate-500 text-xs", children: op.description })] }, op.value))) })] }), operator && (_jsxs(_Fragment, { children: [!isBankAccount ? (_jsxs("div", { children: [_jsxs("label", { className: "text-slate-300 text-sm mb-1.5 block", children: ["Num\u00E9ro de t\u00E9l\u00E9phone ", selectedOp?.label, " *"] }), _jsx("input", { value: phone, onChange: e => setPhone(e.target.value), placeholder: "+242 06 XXX XXXX", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600" })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-sm mb-1.5 block", children: "Nom de la banque" }), _jsx("input", { value: bankName, onChange: e => setBankName(e.target.value), placeholder: "Ex: Afriland", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-sm mb-1.5 block", children: "N\u00B0 de compte *" }), _jsx("input", { value: accountNum, onChange: e => setAccountNum(e.target.value), placeholder: "IBAN ou N\u00B0 compte", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-sm mb-1.5 block", children: "Nom du titulaire" }), _jsx("input", { value: accountName, onChange: e => setAccountName(e.target.value), placeholder: "Nom tel qu'il appara\u00EEt sur le compte", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600" })] })] })), _jsxs("label", { className: "flex items-start gap-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: isPrimary, onChange: e => setIsPrimary(e.target.checked), className: "mt-0.5 w-4 h-4 accent-sky-500" }), _jsx("span", { className: "text-slate-400 text-xs", children: "D\u00E9finir comme compte principal (pr\u00E9l\u00E8vement automatique)" })] }), _jsx("div", { className: "bg-slate-800/40 border border-slate-700/40 rounded-xl p-3", children: _jsxs("label", { className: "flex items-start gap-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: consent, onChange: e => setConsent(e.target.checked), className: "mt-0.5 w-4 h-4 accent-sky-500" }), _jsxs("span", { className: "text-slate-300 text-xs leading-relaxed", children: [_jsx("strong", { className: "text-white", children: "Je consens" }), " \u00E0 ce que TERAS acc\u00E8de \u00E0 mes transactions et solde ", selectedOp?.label, " pour calculer mon score de cr\u00E9dit. Ces donn\u00E9es sont prot\u00E9g\u00E9es et ne seront pas partag\u00E9es sans mon accord."] })] }) })] })), _jsx("button", { onClick: handleAdd, disabled: loading || !operator || !consent, className: "w-full py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2", children: loading ? _jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), " Ajout en cours..."] }) : 'Continuer' })] })), step === 2 && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "text-center space-y-3", children: [_jsx("div", { className: "w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center mx-auto", children: _jsx(Smartphone, { className: "w-7 h-7 text-sky-400" }) }), _jsx("p", { className: "text-white font-semibold", children: "Code de v\u00E9rification" }), _jsxs("p", { className: "text-slate-400 text-sm", children: ["Un SMS a \u00E9t\u00E9 envoy\u00E9 au ", _jsx("strong", { className: "text-white", children: phone || accountNum })] }), devOtp && (_jsx("div", { className: "px-3 py-2 bg-amber-900/20 border border-amber-700/40 rounded-xl", children: _jsxs("p", { className: "text-amber-300 text-xs", children: ["\u26A0\uFE0F Mode d\u00E9veloppement \u2014 Code OTP : ", _jsx("strong", { className: "text-white text-base", children: devOtp })] }) }))] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-sm mb-2 block text-center", children: "Code OTP \u00E0 4 chiffres" }), _jsx("input", { value: otp, onChange: e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4)), placeholder: "0000", maxLength: 4, className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-3 text-xl text-center font-bold tracking-[0.5em] focus:outline-none focus:border-sky-500" })] }), _jsx("button", { onClick: handleVerify, disabled: loading || otp.length !== 4, className: "w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2", children: loading ? _jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), " V\u00E9rification..."] }) : '✅ Valider le code' }), _jsx("button", { onClick: () => setStep(1), className: "w-full py-2 text-slate-400 hover:text-white text-sm transition", children: "\u2190 Retour" })] })), step === 3 && (_jsxs("div", { className: "text-center space-y-4 py-4", children: [_jsx(CheckCircle, { className: "w-14 h-14 text-emerald-400 mx-auto" }), _jsx("p", { className: "text-white font-bold text-lg", children: success }), _jsx("p", { className: "text-slate-400 text-sm", children: "Vous pouvez maintenant synchroniser vos transactions et enrichir votre score TERAS." })] }))] })] }) }));
}
// ─── Carte compte lié ─────────────────────────────────────────────────────────
function AccountCard({ account, onSync, onDelete, onSetPrimary, onViewTransactions, syncing }) {
    const op = OPERATORS.find(o => o.value === account.operator);
    return (_jsxs("div", { className: `border rounded-2xl p-4 transition-all ${account.is_primary
            ? 'border-sky-500/40 bg-sky-900/10'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`, children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-3 flex-1 min-w-0", children: [_jsx("div", { className: `w-11 h-11 rounded-xl bg-gradient-to-br ${op?.color || 'from-slate-600 to-slate-700'} flex items-center justify-center text-xl shrink-0`, children: op?.icon || '💳' }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("p", { className: "text-white font-semibold text-sm", children: account.operator_label }), account.is_primary && (_jsxs("span", { className: "flex items-center gap-1 px-1.5 py-0.5 bg-sky-900/40 border border-sky-700/40 text-sky-400 text-xs rounded-lg", children: [_jsx(Star, { className: "w-2.5 h-2.5" }), " Principal"] })), account.is_verified ? (_jsxs("span", { className: "flex items-center gap-1 px-1.5 py-0.5 bg-emerald-900/40 text-emerald-400 text-xs rounded-lg", children: [_jsx(CheckCircle, { className: "w-2.5 h-2.5" }), " V\u00E9rifi\u00E9"] })) : (_jsx("span", { className: "px-1.5 py-0.5 bg-amber-900/40 text-amber-400 text-xs rounded-lg", children: "En attente" }))] }), _jsx("p", { className: "text-slate-400 text-xs mt-0.5", children: account.phone_number || account.account_number || '—' })] })] }), _jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [!account.is_primary && account.is_verified && (_jsx("button", { onClick: () => onSetPrimary(account.id), title: "D\u00E9finir comme principal", className: "p-1.5 text-slate-500 hover:text-sky-400 hover:bg-sky-900/30 rounded-lg transition", children: _jsx(Star, { className: "w-4 h-4" }) })), account.is_verified && (_jsx("button", { onClick: () => onViewTransactions(account.id), title: "Voir les transactions", className: "p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition", children: _jsx(Eye, { className: "w-4 h-4" }) })), _jsx("button", { onClick: () => onDelete(account.id), className: "p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }), account.is_verified && (_jsxs("div", { className: "mt-3 grid grid-cols-3 gap-2", children: [_jsxs("div", { className: "bg-slate-800/60 rounded-xl p-2.5 text-center", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: "Solde" }), _jsx("p", { className: "text-emerald-400 font-bold text-sm", children: FCFA(account.balance_xaf) })] }), _jsxs("div", { className: "bg-slate-800/60 rounded-xl p-2.5 text-center", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: "Transactions" }), _jsx("p", { className: "text-white font-bold text-sm", children: account.transactions_imported })] }), _jsxs("div", { className: "bg-slate-800/60 rounded-xl p-2.5 text-center", children: [_jsx("p", { className: "text-slate-500 text-xs mb-0.5", children: "Derni\u00E8re sync" }), _jsx("p", { className: "text-slate-400 text-xs", children: account.last_sync_at
                                    ? new Date(account.last_sync_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                                    : 'Jamais' })] })] })), account.is_verified && (_jsx("button", { onClick: () => onSync(account.id), disabled: syncing, className: "mt-3 w-full flex items-center justify-center gap-2 py-2 bg-slate-800/60 hover:bg-slate-700/60 disabled:opacity-50 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition", children: syncing ? _jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }), " Synchronisation..."] })
                    : _jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-3.5 h-3.5" }), " Synchroniser les transactions"] }) }))] }));
}
export default function LinkedAccounts({ title = "Comptes Liés", subtitle }) {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [syncingId, setSyncingId] = useState(null);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [viewingTxId, setViewingTxId] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loadingTx, setLoadingTx] = useState(false);
    const fetchAccounts = useCallback(async () => {
        try {
            const res = await authFetch('/api/scoring/user/linked-accounts/');
            const data = await res.json();
            setAccounts(data.accounts || []);
        }
        catch {
            setError('Erreur chargement comptes liés.');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
    const handleSync = async (id) => {
        setSyncingId(id);
        setError('');
        setSuccessMsg('');
        try {
            const res = await authFetch(`/api/scoring/user/linked-accounts/${id}/sync/`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setSuccessMsg(`✅ ${data.imported} nouvelles transactions importées.`);
                fetchAccounts();
            }
            else
                setError(data.error || 'Erreur sync.');
        }
        catch {
            setError('Erreur sync.');
        }
        finally {
            setSyncingId(null);
            setTimeout(() => setSuccessMsg(''), 5000);
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Délier ce compte ? Les transactions importées seront conservées.'))
            return;
        try {
            await authFetch(`/api/scoring/user/linked-accounts/${id}/delete/`, { method: 'DELETE' });
            fetchAccounts();
        }
        catch {
            setError('Erreur suppression.');
        }
    };
    const handleSetPrimary = async (id) => {
        try {
            await authFetch(`/api/scoring/user/linked-accounts/${id}/set-primary/`, { method: 'PATCH' });
            fetchAccounts();
        }
        catch {
            setError('Erreur.');
        }
    };
    const handleViewTransactions = async (id) => {
        if (viewingTxId === id) {
            setViewingTxId(null);
            return;
        }
        setViewingTxId(id);
        setLoadingTx(true);
        try {
            const res = await authFetch(`/api/scoring/user/linked-accounts/${id}/transactions/`);
            const data = await res.json();
            setTransactions(data.transactions || []);
        }
        catch {
            setError('Erreur transactions.');
        }
        finally {
            setLoadingTx(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [showAddModal && (_jsx(AddAccountModal, { onClose: () => setShowAddModal(false), onSuccess: fetchAccounts })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: title }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: subtitle || 'Liez vos comptes Mobile Money pour enrichir votre score TERAS automatiquement' })] }), _jsxs("button", { onClick: () => setShowAddModal(true), className: "flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm font-semibold transition", children: [_jsx(Plus, { className: "w-4 h-4" }), " Lier un compte"] })] }), successMsg && (_jsxs("div", { className: "flex items-center gap-2 px-4 py-3 bg-emerald-900/20 border border-emerald-700/40 rounded-xl", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-emerald-400 shrink-0" }), _jsx("p", { className: "text-emerald-300 text-sm", children: successMsg }), _jsx("button", { onClick: () => setSuccessMsg(''), className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-emerald-500" }) })] })), error && (_jsxs("div", { className: "flex items-center gap-2 px-4 py-3 bg-rose-900/20 border border-rose-700/40 rounded-xl", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-rose-400 shrink-0" }), _jsx("p", { className: "text-rose-300 text-sm", children: error }), _jsx("button", { onClick: () => setError(''), className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-rose-500" }) })] })), _jsx("div", { className: "grid grid-cols-3 gap-3", children: [
                    { icon: Smartphone, label: 'Liaison sécurisée', desc: 'Vérification par OTP sur votre téléphone', color: 'sky' },
                    { icon: TrendingUp, label: 'Score enrichi', desc: 'Vos transactions améliorent votre score TERAS', color: 'emerald' },
                    { icon: Shield, label: 'Données protégées', desc: 'Consentement requis, données chiffrées', color: 'violet' },
                ].map((item, i) => {
                    const Icon = item.icon;
                    return (_jsxs("div", { className: "bg-slate-900/40 border border-slate-800 rounded-xl p-3 flex items-center gap-3", children: [_jsx("div", { className: `w-8 h-8 rounded-xl bg-${item.color}-500/20 flex items-center justify-center shrink-0`, children: _jsx(Icon, { className: `w-4 h-4 text-${item.color}-400` }) }), _jsxs("div", { children: [_jsx("p", { className: "text-white text-xs font-medium", children: item.label }), _jsx("p", { className: "text-slate-500 text-xs", children: item.desc })] })] }, i));
                }) }), loading ? (_jsxs("div", { className: "flex items-center justify-center py-10", children: [_jsx(Loader2, { className: "w-5 h-5 text-sky-400 animate-spin mr-2" }), _jsx("span", { className: "text-slate-400", children: "Chargement..." })] })) : accounts.length === 0 ? (_jsxs("div", { className: "text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl", children: [_jsx(Wallet, { className: "w-12 h-12 text-slate-700 mx-auto mb-3" }), _jsx("p", { className: "text-slate-500 font-medium", children: "Aucun compte li\u00E9" }), _jsx("p", { className: "text-slate-600 text-sm mt-1 mb-4", children: "Liez votre Airtel Money, MTN Money ou compte bancaire pour enrichir votre score TERAS" }), _jsx("button", { onClick: () => setShowAddModal(true), className: "px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-400 rounded-xl text-sm transition", children: "+ Lier mon premier compte" })] })) : (_jsx("div", { className: "space-y-3", children: accounts.map(acc => (_jsxs("div", { children: [_jsx(AccountCard, { account: acc, onSync: handleSync, onDelete: handleDelete, onSetPrimary: handleSetPrimary, onViewTransactions: handleViewTransactions, syncing: syncingId === acc.id }), viewingTxId === acc.id && (_jsx("div", { className: "mt-2 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden", children: loadingTx ? (_jsxs("div", { className: "flex items-center justify-center py-6", children: [_jsx(Loader2, { className: "w-4 h-4 text-sky-400 animate-spin mr-2" }), _jsx("span", { className: "text-slate-400 text-sm", children: "Chargement..." })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "px-4 py-2.5 border-b border-slate-800 flex items-center justify-between", children: [_jsxs("p", { className: "text-white text-sm font-medium", children: [transactions.length, " transactions"] }), _jsx("button", { onClick: () => setViewingTxId(null), className: "text-slate-500 hover:text-white", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsx("div", { className: "max-h-64 overflow-y-auto", children: transactions.map((t, i) => (_jsxs("div", { className: `flex items-center gap-3 px-4 py-2.5 border-b border-slate-800/60 ${i % 2 ? 'bg-slate-900/30' : ''}`, children: [_jsx("span", { className: `text-sm ${t.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`, children: t.type === 'credit' ? '↑' : '↓' }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-white text-xs truncate", children: t.description }), _jsx("p", { className: "text-slate-500 text-xs", children: t.date })] }), _jsxs("p", { className: `text-sm font-medium shrink-0 ${t.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`, children: [t.type === 'credit' ? '+' : '-', FCFA(t.amount)] })] }, i))) })] })) }))] }, acc.id))) }))] }));
}
