import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * EnterpriseNewClientModal.tsx
 * Modal de création d'un nouveau client pour l'interface Entreprise
 */
import { useState } from 'react';
import { X, User, Building2, Phone, Mail, MapPin, CreditCard, Loader2, CheckCircle } from 'lucide-react';
const CLIENT_TYPES = [
    { value: 'individual', label: 'Particulier', icon: User },
    { value: 'enterprise', label: 'Entreprise', icon: Building2 },
];
const SECTORS = [
    'Commerce & Distribution', 'Agriculture', 'Transport & Logistique',
    'BTP & Immobilier', 'Services & Conseil', 'Industrie & Manufacture',
    'Santé', 'Éducation', 'Technologie', 'Autre',
];
export default function EnterpriseNewClientModal({ isOpen, onClose, onSuccess }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [form, setForm] = useState({
        type: 'individual',
        firstName: '', lastName: '', companyName: '',
        kyc_id: '', phone: '', email: '',
        address: '', city: '', country: 'CG',
        sector: '', monthlyIncome: '', notes: '',
    });
    const [errors, setErrors] = useState({});
    if (!isOpen)
        return null;
    const set = (k, v) => {
        setForm(f => ({ ...f, [k]: v }));
        setErrors(e => ({ ...e, [k]: '' }));
    };
    const validateStep1 = () => {
        const e = {};
        if (form.type === 'individual') {
            if (!form.firstName.trim())
                e.firstName = 'Requis';
            if (!form.lastName.trim())
                e.lastName = 'Requis';
        }
        else {
            if (!form.companyName.trim())
                e.companyName = 'Requis';
        }
        if (!form.kyc_id.trim())
            e.kyc_id = 'Requis';
        if (!form.phone.trim())
            e.phone = 'Requis';
        setErrors(e);
        return Object.keys(e).length === 0;
    };
    const validateStep2 = () => {
        const e = {};
        if (!form.city.trim())
            e.city = 'Requis';
        if (!form.sector)
            e.sector = 'Requis';
        setErrors(e);
        return Object.keys(e).length === 0;
    };
    const handleNext = () => {
        if (step === 1 && validateStep1())
            setStep(2);
        else if (step === 2 && validateStep2())
            setStep(3);
    };
    const handleSubmit = async () => {
        setLoading(true);
        try {
            // TODO: remplacer par authFetch réel
            // const res = await authFetch('/api/scoring/enterprise/clients/', {
            //   method: 'POST', body: JSON.stringify(form)
            // });
            await new Promise(r => setTimeout(r, 1500));
            setSuccess(true);
            setTimeout(() => {
                onSuccess?.({ ...form, id: Date.now(), score: 0, status: 'pending' });
                handleClose();
            }, 1500);
        }
        catch {
            setErrors({ submit: 'Erreur lors de la création. Réessayez.' });
        }
        finally {
            setLoading(false);
        }
    };
    const handleClose = () => {
        setStep(1);
        setSuccess(false);
        setLoading(false);
        setForm({ type: 'individual', firstName: '', lastName: '', companyName: '',
            kyc_id: '', phone: '', email: '', address: '', city: '', country: 'CG',
            sector: '', monthlyIncome: '', notes: '' });
        setErrors({});
        onClose();
    };
    const Field = ({ label, k, placeholder, type = 'text' }) => (_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-slate-400 mb-1.5 font-medium", children: label }), _jsx("input", { type: type, value: form[k], onChange: e => set(k, e.target.value), placeholder: placeholder, className: `w-full px-3 py-2.5 bg-slate-800/60 border rounded-xl text-white text-sm placeholder-slate-500
          focus:outline-none focus:ring-1 transition-all
          ${errors[k] ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500'}` }), errors[k] && _jsx("p", { className: "text-xs text-rose-400 mt-1", children: errors[k] })] }));
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("div", { className: "absolute inset-0 bg-black/70 backdrop-blur-sm", onClick: handleClose }), _jsxs("div", { className: "relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-slate-800", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold text-cyan-400 uppercase tracking-widest", children: "TERAS Entreprise" }), _jsx("h2", { className: "text-lg font-black text-white mt-0.5", children: "Nouveau client" })] }), _jsx("button", { onClick: handleClose, className: "p-2 hover:bg-slate-800 rounded-lg transition-colors", children: _jsx(X, { className: "w-5 h-5 text-slate-400" }) })] }), _jsx("div", { className: "flex px-6 pt-4 gap-2", children: ['Identité', 'Localisation', 'Confirmation'].map((s, i) => (_jsxs("div", { className: "flex-1 flex flex-col items-center gap-1", children: [_jsx("div", { className: `w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${step > i + 1 ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-500'}`, children: step > i + 1 ? '✓' : i + 1 }), _jsx("span", { className: `text-xs transition-colors ${step === i + 1 ? 'text-cyan-400' : 'text-slate-500'}`, children: s })] }, i))) }), _jsxs("div", { className: "px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto", children: [success && (_jsxs("div", { className: "flex flex-col items-center justify-center py-8 gap-3", children: [_jsx(CheckCircle, { className: "w-16 h-16 text-emerald-400" }), _jsx("p", { className: "text-white font-semibold text-lg", children: "Client cr\u00E9\u00E9 avec succ\u00E8s !" }), _jsx("p", { className: "text-slate-400 text-sm text-center", children: "Le scoring TERAS sera calcul\u00E9 dans quelques instants." })] })), !success && step === 1 && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-slate-400 mb-2 font-medium", children: "Type de client" }), _jsx("div", { className: "flex gap-3", children: CLIENT_TYPES.map(({ value, label, icon: Icon }) => (_jsxs("button", { onClick: () => set('type', value), className: `flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all
                        ${form.type === value
                                                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                                                        : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'}`, children: [_jsx(Icon, { className: "w-4 h-4" }), label] }, value))) })] }), form.type === 'individual' ? (_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Field, { label: "Pr\u00E9nom", k: "firstName", placeholder: "Jean" }), _jsx(Field, { label: "Nom", k: "lastName", placeholder: "Mokoko" })] })) : (_jsx(Field, { label: "Raison sociale", k: "companyName", placeholder: "SARL Mokoko & Fils" })), _jsx(Field, { label: "KYC ID / Num\u00E9ro de pi\u00E8ce", k: "kyc_id", placeholder: "CG-2024-0001" }), _jsx(Field, { label: "T\u00E9l\u00E9phone", k: "phone", placeholder: "+242 06 000 0000" }), _jsx(Field, { label: "Email (optionnel)", k: "email", placeholder: "client@example.com", type: "email" })] })), !success && step === 2 && (_jsxs(_Fragment, { children: [_jsx(Field, { label: "Adresse", k: "address", placeholder: "Avenue de l'Ind\u00E9pendance" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Field, { label: "Ville", k: "city", placeholder: "Brazzaville" }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-slate-400 mb-1.5 font-medium", children: "Pays" }), _jsxs("select", { value: form.country, onChange: e => set('country', e.target.value), className: "w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500", children: [_jsx("option", { value: "CG", children: "Congo (CG)" }), _jsx("option", { value: "CD", children: "RD Congo (CD)" }), _jsx("option", { value: "CM", children: "Cameroun (CM)" }), _jsx("option", { value: "GA", children: "Gabon (GA)" }), _jsx("option", { value: "CF", children: "Centrafrique (CF)" }), _jsx("option", { value: "TD", children: "Tchad (TD)" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-slate-400 mb-1.5 font-medium", children: "Secteur d'activit\u00E9" }), _jsxs("select", { value: form.sector, onChange: e => set('sector', e.target.value), className: `w-full px-3 py-2.5 bg-slate-800/60 border rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500
                    ${errors.sector ? 'border-rose-500' : 'border-slate-700'}`, children: [_jsx("option", { value: "", children: "S\u00E9lectionner..." }), SECTORS.map(s => _jsx("option", { value: s, children: s }, s))] }), errors.sector && _jsx("p", { className: "text-xs text-rose-400 mt-1", children: errors.sector })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-slate-400 mb-1.5 font-medium", children: "Revenu mensuel estim\u00E9 (FCFA)" }), _jsx("input", { type: "number", value: form.monthlyIncome, onChange: e => set('monthlyIncome', e.target.value), placeholder: "ex: 250000", className: "w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-slate-400 mb-1.5 font-medium", children: "Notes (optionnel)" }), _jsx("textarea", { value: form.notes, onChange: e => set('notes', e.target.value), placeholder: "Informations compl\u00E9mentaires...", rows: 3, className: "w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none" })] })] })), !success && step === 3 && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "bg-slate-800/60 rounded-xl p-4 space-y-3", children: [_jsx("p", { className: "text-xs font-bold text-cyan-400 uppercase tracking-widest", children: "R\u00E9capitulatif" }), [
                                                { icon: User, label: 'Identité', val: form.type === 'individual' ? `${form.firstName} ${form.lastName}` : form.companyName },
                                                { icon: CreditCard, label: 'KYC ID', val: form.kyc_id },
                                                { icon: Phone, label: 'Téléphone', val: form.phone },
                                                { icon: Mail, label: 'Email', val: form.email || '—' },
                                                { icon: MapPin, label: 'Ville', val: `${form.city}, ${form.country}` },
                                                { icon: Building2, label: 'Secteur', val: form.sector || '—' },
                                            ].map(({ icon: Icon, label, val }) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Icon, { className: "w-4 h-4 text-slate-500 shrink-0" }), _jsx("span", { className: "text-xs text-slate-400 w-20 shrink-0", children: label }), _jsx("span", { className: "text-sm text-white font-medium truncate", children: val })] }, label)))] }), _jsx("div", { className: "bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3", children: _jsxs("p", { className: "text-xs text-cyan-300", children: ["\u2139\uFE0F Le score TERAS sera calcul\u00E9 automatiquement apr\u00E8s cr\u00E9ation. Le client appara\u00EEtra dans votre portefeuille avec le statut ", _jsx("strong", { children: "En attente" }), "."] }) }), errors.submit && (_jsx("p", { className: "text-xs text-rose-400 text-center", children: errors.submit }))] }))] }), !success && (_jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-t border-slate-800", children: [_jsx("button", { onClick: step === 1 ? handleClose : () => setStep(s => s - 1), className: "px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors", children: step === 1 ? 'Annuler' : '← Retour' }), step < 3 ? (_jsx("button", { onClick: handleNext, className: "px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-xl transition-all", children: "Suivant \u2192" })) : (_jsx("button", { onClick: handleSubmit, disabled: loading, className: "flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50", children: loading ? _jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), "Cr\u00E9ation..."] }) : '✓ Créer le client' }))] }))] })] }));
}
