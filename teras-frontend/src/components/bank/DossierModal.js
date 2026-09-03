import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// ═══════════════════════════════════════════════════════════════════════════
// PARTIE 1 — Modal DossierComplet.tsx
// Créer ce fichier : teras-frontend/src/components/bank/DossierModal.tsx
// ═══════════════════════════════════════════════════════════════════════════
import { useState } from 'react';
import { authFetch } from '../../utils/authFetch';
import { X, FileText, Download, User, Building2, CheckCircle, Shield, Loader2, Smartphone, Banknote, AlertCircle, Clock, } from 'lucide-react';
const fmt = (val) => {
    const n = parseFloat(val);
    if (!n || isNaN(n))
        return '0 FCFA';
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M FCFA`;
    if (n >= 1000)
        return `${Math.round(n / 1000)}k FCFA`;
    return `${n.toLocaleString('fr-FR')} FCFA`;
};
const fmtDate = (d) => {
    if (!d)
        return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};
const calcMonthly = (principal, annualRate, months) => {
    if (months <= 0)
        return 0;
    if (annualRate <= 0)
        return principal / months;
    const r = annualRate / 100 / 12;
    return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
};
export default function DossierModal({ app, onClose }) {
    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState('');
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const principal = parseFloat(app.requested_amount || 0);
    const duration = parseInt(app.duration_months || 1);
    const annualRate = parseFloat(app.interest_rate || 10);
    const monthly = calcMonthly(principal, annualRate, duration);
    const totalCost = monthly * duration;
    const totalInterets = totalCost - principal;
    const isIndividual = app.applicant_type === 'individual';
    const clientName = app.client_name || app.enterprise_name || '—';
    const score = app.teras_score_at_application || 0;
    const STATUS_MAP = {
        approved: { label: 'En attente acceptation client', color: 'text-amber-400', bg: 'bg-amber-500/10 border border-amber-500/30' },
        disbursed: { label: 'Crédit actif / Décaissé', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/30' },
    };
    const statusCfg = STATUS_MAP[app.status] || STATUS_MAP.approved;
    // ── Télécharger le contrat PDF ────────────────────────────────────────────
    const downloadContract = async () => {
        setDownloading(true);
        setDownloadError('');
        setDownloadSuccess(false);
        try {
            const res = await authFetch(`/api/scoring/bank/applications/${app.id}/contract/`);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Erreur ${res.status}`);
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `TERAS_Contrat_${app.application_id}_${clientName.replace(/\s+/g, '_')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 4000);
        }
        catch (e) {
            setDownloadError(e.message || 'Erreur génération contrat.');
        }
        finally {
            setDownloading(false);
        }
    };
    // ── Amortissement (6 premières lignes) ────────────────────────────────────
    const amortLines = [];
    let balance = principal;
    const r = annualRate / 100 / 12;
    for (let i = 1; i <= Math.min(duration, 6); i++) {
        const interest = r > 0 ? balance * r : 0;
        const capital = r > 0 ? monthly - interest : monthly;
        balance -= capital;
        amortLines.push({ month: i, monthly, capital, interest, balance: Math.max(balance, 0) });
    }
    return (_jsx("div", { className: "fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto", onClick: e => e.target === e.currentTarget && onClose(), children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl my-4", children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-slate-800", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center", children: _jsx(FileText, { className: "w-5 h-5 text-sky-400" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-white font-bold text-lg", children: "Dossier Cr\u00E9dit" }), _jsx("p", { className: "text-slate-400 text-xs", children: app.application_id })] })] }), _jsx("button", { onClick: onClose, className: "p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "p-6 space-y-5 overflow-y-auto max-h-[80vh]", children: [_jsxs("div", { className: `flex items-center gap-3 px-4 py-3 rounded-xl ${statusCfg.bg}`, children: [app.status === 'disbursed'
                                    ? _jsx(CheckCircle, { className: "w-5 h-5 text-emerald-400 shrink-0" })
                                    : _jsx(Clock, { className: "w-5 h-5 text-amber-400 shrink-0" }), _jsx("span", { className: `font-semibold text-sm ${statusCfg.color}`, children: statusCfg.label }), _jsx("span", { className: "text-slate-500 text-xs ml-auto", children: fmtDate(app.reviewed_at || app.created_at) })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-400 text-xs font-medium uppercase tracking-wider mb-3", children: "Emprunteur" }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isIndividual ? 'bg-blue-500/20' : 'bg-purple-500/20'}`, children: isIndividual ? _jsx(User, { className: "w-6 h-6 text-blue-400" }) : _jsx(Building2, { className: "w-6 h-6 text-purple-400" }) }), _jsxs("div", { className: "flex-1 grid grid-cols-2 gap-x-6 gap-y-2 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-500 text-xs", children: "Nom complet" }), _jsx("p", { className: "text-white font-semibold", children: clientName })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-500 text-xs", children: "Score TERAS" }), _jsxs("p", { className: `font-bold ${score >= 700 ? 'text-emerald-400' : score >= 500 ? 'text-amber-400' : 'text-rose-400'}`, children: [score, " / 1000 ", score >= 700 ? '🥇' : score >= 600 ? '🥈' : '🥉'] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-500 text-xs", children: "Produit" }), _jsx("p", { className: "text-white", children: app.product_name || '—' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-500 text-xs", children: "Date approbation" }), _jsx("p", { className: "text-white", children: fmtDate(app.reviewed_at) })] })] })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs font-medium uppercase tracking-wider mb-3", children: "Conditions du Cr\u00E9dit" }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: [
                                        { label: 'Montant', value: fmt(principal), color: 'sky' },
                                        { label: 'Durée', value: `${duration} mois`, color: 'violet' },
                                        { label: 'Taux /an', value: `${annualRate.toFixed(1)}%`, color: 'amber' },
                                        { label: 'Mensualité', value: fmt(Math.round(monthly)), color: 'emerald' },
                                        { label: 'Total', value: fmt(Math.round(totalCost)), color: 'slate' },
                                        { label: 'Intérêts', value: fmt(Math.round(totalInterets)), color: 'rose' },
                                    ].map((k, i) => (_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-3 text-center", children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: k.label }), _jsx("p", { className: `font-bold text-sm text-${k.color}-400`, children: k.value })] }, i))) })] }), _jsxs("div", { className: "bg-slate-800/30 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-400 text-xs font-medium uppercase tracking-wider mb-3", children: "Modalit\u00E9s de Pr\u00E9l\u00E8vement Automatique" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl", children: [_jsx(Smartphone, { className: "w-5 h-5 text-sky-400 shrink-0" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-white text-sm font-medium", children: "Mobile Money" }), _jsxs("p", { className: "text-slate-400 text-xs", children: ["Pr\u00E9l\u00E8vement automatique mensuel de ", _jsx("span", { className: "text-sky-400 font-bold", children: fmt(Math.round(monthly)) })] }), _jsx("p", { className: "text-slate-500 text-xs mt-0.5", children: "Airtel Money / MTN Money / Orange Money / ZOLA" })] }), _jsx(CheckCircle, { className: "w-4 h-4 text-emerald-400 shrink-0" })] }), _jsxs("div", { className: "flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl", children: [_jsx(Banknote, { className: "w-5 h-5 text-emerald-400 shrink-0" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-white text-sm font-medium", children: "Compte Bancaire" }), _jsxs("p", { className: "text-slate-400 text-xs", children: ["Pr\u00E9l\u00E8vement automatique mensuel de ", _jsx("span", { className: "text-emerald-400 font-bold", children: fmt(Math.round(monthly)) })] }), _jsx("p", { className: "text-slate-500 text-xs mt-0.5", children: "Virement automatique selon coordonn\u00E9es bancaires d\u00E9clar\u00E9es" })] })] })] })] }), _jsxs("div", { children: [_jsxs("p", { className: "text-slate-400 text-xs font-medium uppercase tracking-wider mb-3", children: ["Aper\u00E7u Remboursement (", Math.min(duration, 6), " premi\u00E8res \u00E9ch\u00E9ances)"] }), _jsx("div", { className: "overflow-hidden rounded-xl border border-slate-800", children: _jsxs("table", { className: "w-full text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-slate-800", children: [_jsx("th", { className: "px-3 py-2 text-slate-400 text-left", children: "Mois" }), _jsx("th", { className: "px-3 py-2 text-slate-400 text-right", children: "Mensualit\u00E9" }), _jsx("th", { className: "px-3 py-2 text-slate-400 text-right", children: "Capital" }), _jsx("th", { className: "px-3 py-2 text-slate-400 text-right", children: "Int\u00E9r\u00EAts" }), _jsx("th", { className: "px-3 py-2 text-slate-400 text-right", children: "Restant" })] }) }), _jsxs("tbody", { children: [amortLines.map((line, i) => (_jsxs("tr", { className: `border-t border-slate-800/60 ${i % 2 ? 'bg-slate-900/30' : ''}`, children: [_jsxs("td", { className: "px-3 py-2 text-slate-300", children: ["Mois ", line.month] }), _jsx("td", { className: "px-3 py-2 text-right text-white font-medium", children: fmt(Math.round(line.monthly)) }), _jsx("td", { className: "px-3 py-2 text-right text-sky-400", children: fmt(Math.round(line.capital)) }), _jsx("td", { className: "px-3 py-2 text-right text-amber-400", children: fmt(Math.round(line.interest)) }), _jsx("td", { className: "px-3 py-2 text-right text-slate-400", children: fmt(Math.round(line.balance)) })] }, i))), duration > 6 && (_jsx("tr", { className: "border-t border-slate-800 bg-slate-900/50", children: _jsxs("td", { colSpan: 5, className: "px-3 py-2 text-slate-500 text-center", children: ["... ", duration - 6, " \u00E9ch\u00E9ances restantes \u2014 voir le contrat complet"] }) }))] })] }) })] }), _jsx("div", { className: "bg-slate-800/20 border border-slate-700/40 rounded-xl p-4", children: _jsxs("div", { className: "flex items-start gap-2.5", children: [_jsx(Shield, { className: "w-4 h-4 text-sky-400 shrink-0 mt-0.5" }), _jsxs("div", { className: "text-xs text-slate-400 leading-relaxed", children: [_jsx("p", { className: "text-white font-medium mb-1", children: "Contrat de cr\u00E9dit TERAS" }), "Le contrat PDF contient : identit\u00E9 compl\u00E8te, conditions de cr\u00E9dit, tableau d'amortissement complet, autorisation de pr\u00E9l\u00E8vement automatique sign\u00E9e par ", _jsx("strong", { className: "text-white", children: clientName }), ", et les conditions g\u00E9n\u00E9rales applicables. Ce contrat a valeur l\u00E9gale conform\u00E9ment au droit OHADA et \u00E0 la r\u00E9glementation bancaire en vigueur au Congo Brazzaville."] })] }) }), downloadError && (_jsxs("div", { className: "flex items-center gap-2 px-4 py-3 bg-rose-900/20 border border-rose-700/40 rounded-xl", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-rose-400 shrink-0" }), _jsx("p", { className: "text-rose-300 text-sm", children: downloadError })] })), downloadSuccess && (_jsxs("div", { className: "flex items-center gap-2 px-4 py-3 bg-emerald-900/20 border border-emerald-700/40 rounded-xl", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-emerald-400 shrink-0" }), _jsx("p", { className: "text-emerald-300 text-sm", children: "Contrat t\u00E9l\u00E9charg\u00E9 avec succ\u00E8s." })] }))] }), _jsxs("div", { className: "px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-3", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition", children: "Fermer" }), _jsx("button", { onClick: downloadContract, disabled: downloading, className: "flex items-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-sky-500/20", children: downloading
                                ? _jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), " G\u00E9n\u00E9ration du contrat..."] })
                                : _jsxs(_Fragment, { children: [_jsx(Download, { className: "w-4 h-4" }), " T\u00E9l\u00E9charger le Contrat PDF"] }) })] })] }) }));
}
