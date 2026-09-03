import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/pages/enterprise/EnterpriseNewCase.tsx
// ✅ Formulaire connecté à l'API Django
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import enterpriseApi from "../../services/enterpriseApi";
const EnterpriseNewCase = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        name: '', client_type: 'individual', kyc_id: '', internal_ref: '', notes: ''
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.kyc_id.trim()) {
            setError('Le nom et le KYC ID sont obligatoires.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await enterpriseApi.createClient(form);
            setSuccess(true);
            setTimeout(() => navigate('/enterprise/clients'), 1500);
        }
        catch (e) {
            setError(e.message || 'Erreur lors de la création.');
        }
        finally {
            setLoading(false);
        }
    };
    const field = (label, key, placeholder = '', type = 'text') => (_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-slate-400 mb-1.5", children: label }), _jsx("input", { type: type, value: form[key], placeholder: placeholder, onChange: e => setForm(f => ({ ...f, [key]: e.target.value })), className: "w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors" })] }));
    return (_jsx("div", { className: "min-h-screen bg-slate-950 text-slate-50 p-6", children: _jsxs("div", { className: "max-w-2xl mx-auto space-y-6", children: [_jsxs("div", { children: [_jsxs(Link, { to: "/enterprise/clients", className: "flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-4 transition-colors", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), " Retour au portefeuille"] }), _jsx("p", { className: "text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1", children: "TERAS Entreprise" }), _jsx("h1", { className: "text-2xl font-black text-white", children: "Nouveau dossier client" }), _jsx("p", { className: "text-sm text-slate-400 mt-1", children: "Cr\u00E9ez un dossier analys\u00E9 par le moteur TERAS." })] }), success && (_jsxs("div", { className: "flex items-center gap-2 px-4 py-3 bg-emerald-900/20 border border-emerald-700 rounded-xl text-emerald-300", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), " Client cr\u00E9\u00E9 avec succ\u00E8s ! Redirection..."] })), error && (_jsx("div", { className: "px-4 py-3 bg-rose-900/20 border border-rose-800 rounded-xl text-rose-300 text-sm", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [field('Nom / Raison sociale *', 'name', 'Ex: Boutique Marchand OYO'), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-slate-400 mb-1.5", children: "Type de client" }), _jsxs("select", { value: form.client_type, onChange: e => setForm(f => ({ ...f, client_type: e.target.value })), className: "w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500", children: [_jsx("option", { value: "individual", children: "Particulier" }), _jsx("option", { value: "sme", children: "PME" }), _jsx("option", { value: "enterprise", children: "Entreprise" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [field('KYC ID *', 'kyc_id', 'Ex: CG-2025-001234'), field('Référence interne', 'internal_ref', 'Code dans votre système')] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-slate-400 mb-1.5", children: "Notes" }), _jsx("textarea", { value: form.notes, onChange: e => setForm(f => ({ ...f, notes: e.target.value })), rows: 3, placeholder: "Observations, contexte...", className: "w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 resize-none" })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-2 border-t border-slate-800", children: [_jsx(Link, { to: "/enterprise/clients", className: "px-4 py-2 rounded-xl text-sm border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors", children: "Annuler" }), _jsx("button", { type: "submit", disabled: loading, className: "flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all", children: loading ? _jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), " Cr\u00E9ation..."] }) : 'Créer le dossier' })] })] })] }) }));
};
export default EnterpriseNewCase;
