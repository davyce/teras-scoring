import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { authFetch } from '../../utils/authFetch';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, Briefcase, DollarSign, CheckCircle, AlertCircle, RefreshCw, CreditCard, Copy, Shield, Eye, EyeOff, } from 'lucide-react';
// ── Villes Congo Brazzaville ──────────────────────────────────────────────────
const VILLES_CG = [
    'Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Ouesso',
    'Owando', 'Impfondo', 'Madingou', 'Sibiti', 'Kinkala', 'Djambala',
    'Mossaka', 'Ewo', 'Makoua', 'Boundji', 'Autre',
];
// ── Professions courantes Congo ───────────────────────────────────────────────
const PROFESSIONS = [
    'Fonctionnaire / Agent de l\'État',
    'Employé secteur privé',
    'Commerçant(e)',
    'Vendeur(se) au marché',
    'Chauffeur / Transport',
    'Agriculteur / Éleveur',
    'Artisan / Menuisier / Soudeur',
    'Enseignant(e)',
    'Infirmier(e) / Aide-soignant(e)',
    'Médecin / Professionnel santé',
    'Agent immobilier',
    'Entrepreneur / Chef d\'entreprise',
    'Pêcheur',
    'Sans emploi',
    'Autre',
];
const EMPTY = {
    first_name: '',
    last_name: '',
    date_of_birth: '',
    niu: '',
    email: '',
    phone: '+242 ',
    address: '',
    city: 'Brazzaville',
    country: 'CG',
    occupation: '',
    monthly_income: '',
};
export default function BankClientNew() {
    const navigate = useNavigate();
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [created, setCreated] = useState(null);
    const [showPass, setShowPass] = useState(false);
    const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
    const validate = () => {
        const errs = {};
        if (!form.first_name.trim())
            errs.first_name = 'Prénom requis';
        if (!form.last_name.trim())
            errs.last_name = 'Nom requis';
        if (!form.date_of_birth)
            errs.date_of_birth = 'Date de naissance requise';
        if (!form.niu.trim())
            errs.niu = 'NIU requis';
        if (!form.email.includes('@'))
            errs.email = 'Email invalide';
        if (form.phone.length < 8)
            errs.phone = 'Téléphone invalide';
        if (!form.address.trim())
            errs.address = 'Adresse requise';
        if (!form.city)
            errs.city = 'Ville requise';
        if (!form.occupation)
            errs.occupation = 'Profession requise';
        if (!form.monthly_income || isNaN(Number(form.monthly_income)))
            errs.monthly_income = 'Revenu invalide';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };
    const handleSubmit = async () => {
        if (!validate())
            return;
        setSaving(true);
        try {
            const res = await authFetch('/api/scoring/bank/clients/create/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                // Afficher les erreurs de validation Django
                const msgs = {};
                Object.entries(data).forEach(([k, v]) => {
                    msgs[k] = Array.isArray(v) ? v.join(', ') : String(v);
                });
                setErrors(msgs);
                return;
            }
            setCreated(data);
        }
        catch (e) {
            setErrors({ email: e.message });
        }
        finally {
            setSaving(false);
        }
    };
    // ── Succès — afficher les identifiants ──────────────────────────────────
    if (created) {
        const acct = created.teras_account || {};
        return (_jsxs("div", { className: "max-w-2xl mx-auto p-6 space-y-6", children: [_jsxs("div", { className: "bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center", children: [_jsx(CheckCircle, { className: "w-16 h-16 text-emerald-400 mx-auto mb-4" }), _jsx("h2", { className: "text-white text-2xl font-bold mb-2", children: "Client cr\u00E9\u00E9 avec succ\u00E8s !" }), _jsxs("p", { className: "text-slate-400 text-sm", children: [created.first_name, " ", created.last_name, " a \u00E9t\u00E9 ajout\u00E9 au portefeuille bancaire."] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center", children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: "Score TERAS" }), _jsx("p", { className: "text-white font-bold text-2xl", children: created.teras_score ?? '—' })] }), _jsxs("div", { className: "bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 text-center", children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: "CRM (30% revenus)" }), _jsx("p", { className: "text-sky-400 font-bold text-2xl", children: created.crm_limit
                                        ? `${Number(created.crm_limit).toLocaleString('fr-FR')} FCFA`
                                        : '—' })] })] }), acct.email && (_jsxs("div", { className: "bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(Shield, { className: "w-5 h-5 text-blue-400" }), _jsx("h3", { className: "text-white font-semibold", children: "Identifiants TERAS G\u00E9n\u00E9r\u00E9s Automatiquement" })] }), _jsx("p", { className: "text-slate-400 text-sm mb-4", children: "Remettez ces identifiants au client. Il pourra les modifier apr\u00E8s sa premi\u00E8re connexion." }), _jsxs("div", { className: "space-y-3", children: [_jsx(CredentialRow, { label: "Email de connexion", value: acct.email }), _jsx(CredentialRow, { label: "Mot de passe initial", value: acct.password, secret: true, showPass: showPass, onToggle: () => setShowPass(p => !p) })] }), _jsx("div", { className: "mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl", children: _jsxs("p", { className: "text-amber-400 text-xs flex items-start gap-2", children: [_jsx(AlertCircle, { className: "w-4 h-4 shrink-0 mt-0.5" }), "Le client doit changer son mot de passe d\u00E8s la premi\u00E8re connexion sur l'application TERAS."] }) })] })), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => navigate(`/bank/clients/${created.id}`), className: "flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors", children: "Voir la fiche client" }), _jsx("button", { onClick: () => { setForm(EMPTY); setCreated(null); setErrors({}); }, className: "flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors", children: "Cr\u00E9er un autre client" })] })] }));
    }
    // ── Formulaire ───────────────────────────────────────────────────────────
    return (_jsxs("div", { className: "max-w-3xl mx-auto p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: () => navigate('/bank/clients'), className: "p-2 hover:bg-slate-800 rounded-lg transition-colors", children: _jsx(ArrowLeft, { className: "w-5 h-5 text-slate-400" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "Nouveau Client" }), _jsx("p", { className: "text-slate-400 text-sm mt-0.5", children: "Cr\u00E9er un profil client particulier \u2014 Congo Brazzaville" })] })] }), _jsx(Section, { icon: _jsx(User, { className: "w-5 h-5 text-blue-400" }), title: "Informations Personnelles", children: _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsx(Field, { label: "Pr\u00E9nom *", error: errors.first_name, children: _jsx("input", { value: form.first_name, onChange: set('first_name'), placeholder: "Pr\u00E9nom du client", className: Input(errors.first_name) }) }), _jsx(Field, { label: "Nom *", error: errors.last_name, children: _jsx("input", { value: form.last_name, onChange: set('last_name'), placeholder: "Nom de famille", className: Input(errors.last_name) }) }), _jsx(Field, { label: "Date de naissance *", error: errors.date_of_birth, children: _jsx("input", { type: "date", value: form.date_of_birth, onChange: set('date_of_birth'), max: new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().slice(0, 10), className: Input(errors.date_of_birth) }) }), _jsx(Field, { label: "NIU \u2014 Num\u00E9ro d'Identification Universel *", error: errors.niu, hint: "Document officiel d\u00E9livr\u00E9 par l'\u00C9tat congolais", children: _jsxs("div", { className: "relative", children: [_jsx(CreditCard, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { value: form.niu, onChange: set('niu'), placeholder: "Ex : CG-NIU-1990-00123", className: `pl-10 ${Input(errors.niu)}` })] }) })] }) }), _jsx(Section, { icon: _jsx(Phone, { className: "w-5 h-5 text-green-400" }), title: "Informations de Contact", children: _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsx(Field, { label: "Email *", error: errors.email, children: _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { type: "email", value: form.email, onChange: set('email'), placeholder: "email@exemple.cg", className: `pl-10 ${Input(errors.email)}` })] }) }), _jsx(Field, { label: "T\u00E9l\u00E9phone *", error: errors.phone, hint: "Format : +242 06 XXX XXXX", children: _jsxs("div", { className: "relative", children: [_jsx(Phone, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { type: "tel", value: form.phone, onChange: set('phone'), placeholder: "+242 06 000 0000", className: `pl-10 ${Input(errors.phone)}` })] }) }), _jsx(Field, { label: "Adresse *", error: errors.address, className: "md:col-span-2", children: _jsxs("div", { className: "relative", children: [_jsx(MapPin, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { value: form.address, onChange: set('address'), placeholder: "Quartier, avenue, num\u00E9ro\u2026 ex: Av. de l'Ind\u00E9pendance, Bacongo", className: `pl-10 ${Input(errors.address)}` })] }) }), _jsx(Field, { label: "Ville *", error: errors.city, children: _jsx("select", { value: form.city, onChange: set('city'), className: Input(errors.city), children: VILLES_CG.map(v => _jsx("option", { value: v, children: v }, v)) }) }), _jsx(Field, { label: "Pays", children: _jsxs("select", { value: form.country, onChange: set('country'), className: Input(), children: [_jsx("option", { value: "CG", children: "Congo Brazzaville (CG)" }), _jsx("option", { value: "CD", children: "RD Congo (CD)" }), _jsx("option", { value: "CM", children: "Cameroun (CM)" }), _jsx("option", { value: "GA", children: "Gabon (GA)" }), _jsx("option", { value: "CF", children: "Centrafrique (CF)" }), _jsx("option", { value: "TD", children: "Tchad (TD)" }), _jsx("option", { value: "GQ", children: "Guin\u00E9e \u00C9quatoriale (GQ)" })] }) })] }) }), _jsx(Section, { icon: _jsx(Briefcase, { className: "w-5 h-5 text-purple-400" }), title: "Informations Professionnelles", children: _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsx(Field, { label: "Profession *", error: errors.occupation, children: _jsxs("select", { value: form.occupation, onChange: set('occupation'), className: Input(errors.occupation), children: [_jsx("option", { value: "", children: "S\u00E9lectionner une profession" }), PROFESSIONS.map(p => _jsx("option", { value: p, children: p }, p))] }) }), _jsxs(Field, { label: "Revenu mensuel net (FCFA) *", error: errors.monthly_income, hint: "Salaire net, CA mensuel, ou revenus informels estim\u00E9s", children: [_jsxs("div", { className: "relative", children: [_jsx(DollarSign, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { type: "number", value: form.monthly_income, onChange: set('monthly_income'), placeholder: "Ex : 250000", min: "0", step: "5000", className: `pl-10 ${Input(errors.monthly_income)}` })] }), form.monthly_income && !isNaN(Number(form.monthly_income)) && (_jsxs("div", { className: "mt-2 p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg text-xs", children: [_jsx("span", { className: "text-slate-400", children: "CRM (30% = capacit\u00E9 de remboursement) : " }), _jsxs("span", { className: "text-sky-400 font-bold", children: [Math.round(Number(form.monthly_income) * 0.30).toLocaleString('fr-FR'), " FCFA/mois"] })] }))] })] }) }), _jsxs("div", { className: "bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3", children: [_jsx(Shield, { className: "w-5 h-5 text-blue-400 shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-blue-400 font-medium text-sm", children: "Cr\u00E9ation automatique d'un compte TERAS" }), _jsx("p", { className: "text-slate-400 text-xs mt-0.5", children: "Un compte utilisateur TERAS sera g\u00E9n\u00E9r\u00E9 automatiquement avec un email et un mot de passe bas\u00E9s sur le NIU. Les identifiants seront affich\u00E9s apr\u00E8s la cr\u00E9ation pour \u00EAtre remis au client." })] })] }), _jsxs("div", { className: "flex gap-4 pt-2", children: [_jsx("button", { onClick: () => navigate('/bank/clients'), className: "px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors", children: "Annuler" }), _jsx("button", { onClick: handleSubmit, disabled: saving, className: "flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all", children: saving
                            ? _jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), " Cr\u00E9ation en cours\u2026"] })
                            : _jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "w-4 h-4" }), " Cr\u00E9er le client & g\u00E9n\u00E9rer le compte TERAS"] }) })] })] }));
}
// ── Sous-composants ────────────────────────────────────────────────────────────
function Section({ icon, title, children }) {
    return (_jsxs("div", { className: "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("h2", { className: "text-white font-semibold text-base mb-5 flex items-center gap-2", children: [icon, " ", title] }), children] }));
}
function Field({ label, error, hint, children, className = '' }) {
    return (_jsxs("div", { className: className, children: [_jsx("label", { className: "text-slate-300 text-xs font-medium mb-1.5 block", children: label }), children, hint && !error && _jsx("p", { className: "text-slate-500 text-xs mt-1", children: hint }), error && _jsxs("p", { className: "text-red-400 text-xs mt-1 flex items-center gap-1", children: [_jsx(AlertCircle, { className: "w-3 h-3" }), error] })] }));
}
function Input(error) {
    return `w-full px-3 py-2.5 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-sm transition-colors ${error ? 'border-red-500/50 bg-red-900/10' : 'border-slate-700/50 hover:border-slate-600/50'}`;
}
function CredentialRow({ label, value, secret = false, showPass, onToggle }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-3 flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-slate-400 text-xs mb-0.5", children: label }), _jsx("p", { className: "text-white font-mono text-sm truncate", children: secret && !showPass ? '••••••••••••' : value })] }), _jsxs("div", { className: "flex gap-2 shrink-0", children: [secret && (_jsx("button", { onClick: onToggle, className: "p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors", children: showPass ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })), _jsx("button", { onClick: copy, className: "p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors", children: copied ? _jsx(CheckCircle, { className: "w-4 h-4 text-emerald-400" }) : _jsx(Copy, { className: "w-4 h-4" }) })] })] }));
}
