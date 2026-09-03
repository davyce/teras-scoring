import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Page d'inscription TERAS - Multi-rôles — VERSION CORRIGÉE
 * ✅ Tous les types envoyés au backend (individual, enterprise, government, bank)
 * ✅ Tous les champs transmis (phone, country, company_name, etc.)
 * ✅ Redirection correcte selon le rôle après inscription
 * ✅ API appelée pour tous les types (pas de fake timeout)
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, UserPlus, ArrowLeft, ArrowRight, User, Building2, Landmark, Handshake, Check, Mail, Phone, Lock, MapPin, Briefcase, FileText, Shield, } from "lucide-react";
import { authFetch } from "../../utils/authFetch";
import LocationPickerMap from "../../components/shared/LocationPickerMap";
// Import du logo TERAS
import terasLogoUrl from "../../assets/logo-teras.svg";
// ─── Mapping type → backend user_type ─────────────────────────────────────────
// 'partner' dans l'ancienne version = 'bank' dans le backend
const TYPE_TO_BACKEND = {
    individual: 'individual',
    enterprise: 'enterprise',
    government: 'government',
    bank: 'bank',
    partner: 'bank', // alias
};
// ─── Redirection après inscription selon rôle ────────────────────────────────
const TYPE_TO_REDIRECT = {
    individual: '/mon-espace',
    enterprise: '/enterprise/dashboard',
    government: '/government/dashboard',
    bank: '/bank/dashboard',
};
// ─── Config des types de compte ───────────────────────────────────────────────
const ACCOUNT_TYPES_CONFIG = [
    {
        type: 'individual',
        label: 'Particulier',
        description: 'Accédez à votre score TERAS, demandez un crédit, gérez vos finances personnelles.',
        icon: User,
        gradient: 'from-sky-500 to-blue-600',
        features: ['Score TERAS personnel', 'Demande de crédit', 'Historique transactions'],
        requires_approval: false,
    },
    {
        type: 'enterprise',
        label: 'Entreprise',
        description: 'Gérez la santé financière de votre entreprise, accédez aux crédits professionnels.',
        icon: Building2,
        gradient: 'from-violet-500 to-purple-600',
        features: ['Score TERAS entreprise', 'Financement professionnel', 'Gestion équipe'],
        requires_approval: true,
    },
    {
        type: 'government',
        label: 'Gouvernement / Institution',
        description: 'Tableau de bord présidentiel, données économiques CEMAC, rapports ministériels.',
        icon: Landmark,
        gradient: 'from-amber-500 to-orange-600',
        features: ['Dashboard CEMAC', 'Rapports économiques IA', 'Données fiscales'],
        requires_approval: true,
    },
    {
        type: 'bank',
        label: 'Banque / Partenaire financier',
        description: 'Proposez des crédits à vos clients, analysez les risques, gérez votre portefeuille.',
        icon: Handshake,
        gradient: 'from-emerald-500 to-teal-600',
        features: ['Analyse risque crédit IA', 'Gestion clients', 'Produits financiers'],
        requires_approval: true,
    },
];
const COUNTRIES = [
    { value: 'CG', label: '🇨🇬 Congo Brazzaville' },
    { value: 'CD', label: '🇨🇩 RD Congo (Kinshasa)' },
    { value: 'CM', label: '🇨🇲 Cameroun' },
    { value: 'GA', label: '🇬🇦 Gabon' },
    { value: 'CF', label: '🇨🇫 Centrafrique' },
    { value: 'TD', label: '🇹🇩 Tchad' },
    { value: 'GQ', label: '🇬🇶 Guinée Équatoriale' },
    { value: 'CI', label: '🇨🇮 Côte d\'Ivoire' },
    { value: 'SN', label: '🇸🇳 Sénégal' },
    { value: 'FR', label: '🇫🇷 France' },
];
const BUSINESS_SECTORS = [
    { value: 'commerce', label: 'Commerce & Distribution' },
    { value: 'agriculture', label: 'Agriculture & Élevage' },
    { value: 'transport', label: 'Transport & Logistique' },
    { value: 'construction', label: 'Construction & BTP' },
    { value: 'telecom', label: 'Télécommunications' },
    { value: 'finance', label: 'Finance & Assurance' },
    { value: 'sante', label: 'Santé & Pharmacie' },
    { value: 'education', label: 'Éducation & Formation' },
    { value: 'restauration', label: 'Restauration & Hôtellerie' },
    { value: 'technologie', label: 'Technologies & Numérique' },
    { value: 'energie', label: 'Énergie & Mines' },
    { value: 'autre', label: 'Autre' },
];
// ─── Helpers ──────────────────────────────────────────────────────────────────
function computePasswordStrength(pwd) {
    if (!pwd)
        return 0;
    let score = Math.min(40, pwd.length * 4);
    if (/[a-z]/.test(pwd))
        score += 10;
    if (/[A-Z]/.test(pwd))
        score += 10;
    if (/[0-9]/.test(pwd))
        score += 10;
    if (/[^A-Za-z0-9]/.test(pwd))
        score += 15;
    const classes = +/[a-z]/.test(pwd) + +/[A-Z]/.test(pwd) + +/[0-9]/.test(pwd) + +/[^A-Za-z0-9]/.test(pwd);
    score += (classes - 1) * 5;
    return Math.min(100, score);
}
// ─── Composants UI ────────────────────────────────────────────────────────────
const AccountTypeCard = ({ config, selected, onSelect }) => {
    const Icon = config.icon;
    return (_jsxs("button", { type: "button", onClick: onSelect, className: `relative p-5 rounded-xl border-2 transition-all text-left w-full ${selected ? 'border-sky-500 bg-sky-500/10' : 'border-white/10 bg-slate-900/50 hover:border-white/20'}`, children: [config.requires_approval && (_jsx("span", { className: "absolute top-3 right-3 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full", children: "Validation requise" })), _jsxs("div", { className: "flex items-start gap-3 mb-3", children: [_jsx("div", { className: `w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0`, children: _jsx(Icon, { className: "w-6 h-6 text-white" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-white", children: config.label }), _jsx("p", { className: "text-xs text-slate-400", children: config.description })] })] }), _jsx("ul", { className: "space-y-1", children: config.features.map((f, i) => (_jsxs("li", { className: "flex items-center gap-2 text-xs text-slate-400", children: [_jsx(Check, { className: `w-3 h-3 ${selected ? 'text-sky-400' : 'text-slate-600'}` }), f] }, i))) }), selected && (_jsx("div", { className: "absolute top-3 right-3", children: _jsx("div", { className: "w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center", children: _jsx(Check, { className: "w-3 h-3 text-white" }) }) }))] }));
};
const InputField = ({ label, name, type = "text", value, onChange, placeholder, icon, error, required }) => {
    const [showPwd, setShowPwd] = useState(false);
    const isPassword = type === "password";
    return (_jsxs("div", { children: [_jsxs("label", { className: "block mb-1 text-sm text-gray-300", children: [label, " ", required && _jsx("span", { className: "text-red-400", children: "*" })] }), _jsxs("div", { className: "relative", children: [icon && _jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400", children: icon }), _jsx("input", { type: isPassword ? (showPwd ? "text" : "password") : type, name: name, value: value, onChange: onChange, placeholder: placeholder, className: `w-full rounded-lg border bg-slate-900/50 px-3 py-2 text-sm text-white outline-none
            focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition
            ${icon ? 'pl-10' : ''} ${isPassword ? 'pr-10' : ''}
            ${error ? 'border-red-500' : 'border-white/10'}` }), isPassword && (_jsx("button", { type: "button", onClick: () => setShowPwd(!showPwd), className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white", children: showPwd ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) }))] }), error && _jsx("p", { className: "mt-1 text-xs text-red-400", children: error })] }));
};
const SelectField = ({ label, name, value, onChange, options, icon, error, required, placeholder = "Sélectionner..." }) => (_jsxs("div", { children: [_jsxs("label", { className: "block mb-1 text-sm text-gray-300", children: [label, " ", required && _jsx("span", { className: "text-red-400", children: "*" })] }), _jsxs("div", { className: "relative", children: [icon && _jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10", children: icon }), _jsxs("select", { name: name, value: value, onChange: onChange, className: `w-full rounded-lg border bg-slate-900/50 px-3 py-2 text-sm text-white outline-none
          focus:border-sky-500 transition appearance-none
          ${icon ? 'pl-10' : ''} ${error ? 'border-red-500' : 'border-white/10'}`, children: [_jsx("option", { value: "", children: placeholder }), options.map(o => _jsx("option", { value: o.value, children: o.label }, o.value))] })] }), error && _jsx("p", { className: "mt-1 text-xs text-red-400", children: error })] }));
const PwdStrength = ({ pwd }) => {
    const strength = computePasswordStrength(pwd);
    const label = strength < 30 ? 'Faible' : strength < 60 ? 'Moyen' : strength < 85 ? 'Fort' : 'Très fort';
    const color = strength < 30 ? 'bg-red-500' : strength < 60 ? 'bg-yellow-500' : strength < 85 ? 'bg-green-500' : 'bg-emerald-400';
    if (!pwd)
        return null;
    return (_jsxs("div", { className: "mt-2 flex items-center gap-2", children: [_jsx("div", { className: "h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden", children: _jsx("div", { className: `h-full rounded-full transition-all ${color}`, style: { width: `${strength}%` } }) }), _jsx("span", { className: "text-xs text-slate-400 min-w-[60px]", children: label })] }));
};
// ─── Formulaires par type ─────────────────────────────────────────────────────
const CommonPwdField = ({ data, onChange, errors }) => (_jsxs("div", { children: [_jsx(InputField, { label: "Mot de passe", name: "password", type: "password", value: data.password || '', onChange: e => onChange('password', e.target.value), placeholder: "Minimum 8 caract\u00E8res", icon: _jsx(Lock, { className: "w-4 h-4" }), error: errors.password, required: true }), _jsx(PwdStrength, { pwd: data.password || '' }), data.password && (_jsxs("div", { className: "mt-2", children: [_jsx(InputField, { label: "Confirmer le mot de passe", name: "password2", type: "password", value: data.password2 || '', onChange: e => onChange('password2', e.target.value), placeholder: "R\u00E9p\u00E9ter le mot de passe", icon: _jsx(Lock, { className: "w-4 h-4" }), error: errors.password2 }), data.password2 && data.password !== data.password2 && (_jsx("p", { className: "text-xs text-rose-400 mt-1", children: "\u26A0\uFE0F Les mots de passe ne correspondent pas" })), data.password2 && data.password === data.password2 && (_jsx("p", { className: "text-xs text-emerald-400 mt-1", children: "\u2705 Mots de passe identiques" }))] }))] }));
const IndividualForm = ({ data, onChange, errors }) => (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(InputField, { label: "Pr\u00E9nom", name: "first_name", value: data.first_name || '', onChange: e => onChange('first_name', e.target.value), placeholder: "Jean", icon: _jsx(User, { className: "w-4 h-4" }), error: errors.first_name, required: true }), _jsx(InputField, { label: "Nom", name: "last_name", value: data.last_name || '', onChange: e => onChange('last_name', e.target.value), placeholder: "Mbemba", icon: _jsx(User, { className: "w-4 h-4" }), error: errors.last_name, required: true })] }), _jsx(InputField, { label: "Email", name: "email", type: "email", value: data.email || '', onChange: e => onChange('email', e.target.value), placeholder: "vous@exemple.com", icon: _jsx(Mail, { className: "w-4 h-4" }), error: errors.email, required: true }), _jsx(InputField, { label: "T\u00E9l\u00E9phone", name: "phone_number", type: "tel", value: data.phone_number || '', onChange: e => onChange('phone_number', e.target.value), placeholder: "+242 06 XXX XXXX", icon: _jsx(Phone, { className: "w-4 h-4" }), error: errors.phone_number }), _jsx(SelectField, { label: "Pays", name: "country", value: data.country || '', onChange: e => onChange('country', e.target.value), options: COUNTRIES, icon: _jsx(MapPin, { className: "w-4 h-4" }), error: errors.country, required: true }), _jsx(CommonPwdField, { data: data, onChange: onChange, errors: errors })] }));
const LocationSection = ({ data, onChange }) => (_jsxs("div", { className: "space-y-4 rounded-xl border border-white/10 bg-slate-900/40 p-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-semibold text-sky-300", children: "Adresse et position GPS" }), _jsxs("p", { className: "mt-1 text-xs text-slate-400", children: ["Optionnel, mais pratique pour les utilisateurs locaux : utilisez ", _jsx("span", { className: "font-medium text-sky-300", children: "Me localiser" }), " ou cliquez sur la carte. Cette position aide l\u2019admin et les autorit\u00E9s autoris\u00E9es \u00E0 visualiser les utilisateurs sur la carte CEMAC."] })] }), _jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [_jsx(InputField, { label: "Ville / Localit\u00E9", name: "city", value: data.city || '', onChange: e => onChange('city', e.target.value), placeholder: "Ex: Brazzaville, Pointe-Noire...", icon: _jsx(MapPin, { className: "w-4 h-4" }) }), _jsx(InputField, { label: "Adresse / rep\u00E8re", name: "address", value: data.address || '', onChange: e => onChange('address', e.target.value), placeholder: "Rue, quartier, rep\u00E8re connu", icon: _jsx(MapPin, { className: "w-4 h-4" }) })] }), _jsx(LocationPickerMap, { editing: true, value: {
                latitude: data.latitude ? Number(data.latitude) : null,
                longitude: data.longitude ? Number(data.longitude) : null,
            }, resolvedAddress: data.address, resolvedCity: data.city, locationSource: data.location_source, onChange: ({ latitude, longitude, location_source, resolved_address, resolved_city }) => {
                onChange('latitude', latitude !== null ? latitude.toFixed(6) : '');
                onChange('longitude', longitude !== null ? longitude.toFixed(6) : '');
                onChange('location_source', location_source || '');
                if (resolved_city) {
                    onChange('city', resolved_city);
                }
                if (resolved_address) {
                    onChange('address', resolved_address);
                }
            } }), _jsx("p", { className: "text-xs text-slate-500", children: "Si la g\u00E9olocalisation du navigateur est refus\u00E9e ou indisponible, vous pouvez simplement cliquer sur la carte pour enregistrer votre position." })] }));
const EnterpriseForm = ({ data, onChange, errors }) => (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-3 bg-slate-800/30 rounded-lg border border-white/5", children: [_jsxs("h4", { className: "text-xs font-semibold text-violet-400 mb-3 flex items-center gap-2", children: [_jsx(Building2, { className: "w-3.5 h-3.5" }), " Informations entreprise"] }), _jsxs("div", { className: "space-y-3", children: [_jsx(InputField, { label: "Nom commercial", name: "company_name", value: data.company_name || '', onChange: e => onChange('company_name', e.target.value), placeholder: "Nom de votre entreprise", error: errors.company_name, required: true }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(InputField, { label: "N\u00B0 RCCM", name: "rccm", value: data.rccm || '', onChange: e => onChange('rccm', e.target.value), placeholder: "CG-BZV-...", error: errors.rccm }), _jsx(SelectField, { label: "Secteur", name: "sector", value: data.sector || '', onChange: e => onChange('sector', e.target.value), options: BUSINESS_SECTORS, error: errors.sector, required: true })] }), _jsx(SelectField, { label: "Pays", name: "country", value: data.country || '', onChange: e => onChange('country', e.target.value), options: COUNTRIES, icon: _jsx(MapPin, { className: "w-4 h-4" }), error: errors.country, required: true })] })] }), _jsxs("div", { className: "p-3 bg-slate-800/30 rounded-lg border border-white/5", children: [_jsxs("h4", { className: "text-xs font-semibold text-violet-400 mb-3 flex items-center gap-2", children: [_jsx(User, { className: "w-3.5 h-3.5" }), " Repr\u00E9sentant l\u00E9gal"] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(InputField, { label: "Pr\u00E9nom", name: "first_name", value: data.first_name || '', onChange: e => onChange('first_name', e.target.value), error: errors.first_name, required: true }), _jsx(InputField, { label: "Nom", name: "last_name", value: data.last_name || '', onChange: e => onChange('last_name', e.target.value), error: errors.last_name, required: true })] }), _jsx(InputField, { label: "Fonction", name: "position", value: data.position || '', onChange: e => onChange('position', e.target.value), placeholder: "Ex: Directeur G\u00E9n\u00E9ral", icon: _jsx(Briefcase, { className: "w-4 h-4" }) })] })] }), _jsx(InputField, { label: "Email professionnel", name: "email", type: "email", value: data.email || '', onChange: e => onChange('email', e.target.value), placeholder: "contact@entreprise.com", icon: _jsx(Mail, { className: "w-4 h-4" }), error: errors.email, required: true }), _jsx(InputField, { label: "T\u00E9l\u00E9phone", name: "phone_number", type: "tel", value: data.phone_number || '', onChange: e => onChange('phone_number', e.target.value), placeholder: "+242 06 XXX XXXX", icon: _jsx(Phone, { className: "w-4 h-4" }) }), _jsx(CommonPwdField, { data: data, onChange: onChange, errors: errors }), _jsx("div", { className: "p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx(Shield, { className: "w-4 h-4 text-amber-400 mt-0.5 shrink-0" }), _jsx("p", { className: "text-xs text-amber-200", children: "Votre compte entreprise sera cr\u00E9\u00E9 imm\u00E9diatement. Un administrateur TERAS devra valider votre dossier pour l'acc\u00E8s complet aux fonctionnalit\u00E9s cr\u00E9dit." })] }) })] }));
const GovernmentForm = ({ data, onChange, errors }) => (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(InputField, { label: "Pr\u00E9nom", name: "first_name", value: data.first_name || '', onChange: e => onChange('first_name', e.target.value), error: errors.first_name, required: true }), _jsx(InputField, { label: "Nom", name: "last_name", value: data.last_name || '', onChange: e => onChange('last_name', e.target.value), error: errors.last_name, required: true })] }), _jsx(InputField, { label: "Matricule / N\u00B0 Agent", name: "employee_id", value: data.employee_id || '', onChange: e => onChange('employee_id', e.target.value), placeholder: "Votre num\u00E9ro matricule", icon: _jsx(FileText, { className: "w-4 h-4" }), error: errors.employee_id }), _jsx(InputField, { label: "Institution / Minist\u00E8re", name: "institution", value: data.institution || '', onChange: e => onChange('institution', e.target.value), placeholder: "Ex: Minist\u00E8re des Finances", icon: _jsx(Landmark, { className: "w-4 h-4" }), error: errors.institution, required: true }), _jsx(InputField, { label: "Fonction", name: "position", value: data.position || '', onChange: e => onChange('position', e.target.value), placeholder: "Ex: Directeur des Imp\u00F4ts", icon: _jsx(Briefcase, { className: "w-4 h-4" }), error: errors.position, required: true }), _jsx(SelectField, { label: "Pays (zone CEMAC)", name: "country", value: data.country || '', onChange: e => onChange('country', e.target.value), options: COUNTRIES, icon: _jsx(MapPin, { className: "w-4 h-4" }), error: errors.country, required: true }), _jsx(InputField, { label: "Email institutionnel", name: "email", type: "email", value: data.email || '', onChange: e => onChange('email', e.target.value), placeholder: "prenom.nom@gouv.cg", icon: _jsx(Mail, { className: "w-4 h-4" }), error: errors.email, required: true }), _jsx(InputField, { label: "T\u00E9l\u00E9phone", name: "phone_number", type: "tel", value: data.phone_number || '', onChange: e => onChange('phone_number', e.target.value), placeholder: "+242 06 XXX XXXX", icon: _jsx(Phone, { className: "w-4 h-4" }) }), _jsx(CommonPwdField, { data: data, onChange: onChange, errors: errors }), _jsx("div", { className: "p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx(Shield, { className: "w-4 h-4 text-amber-400 mt-0.5 shrink-0" }), _jsx("p", { className: "text-xs text-amber-200", children: "Compte gouvernemental \u2014 acc\u00E8s au tableau de bord pr\u00E9sidentiel CEMAC et aux rapports minist\u00E9riels IA." })] }) })] }));
const BankForm = ({ data, onChange, errors }) => (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-3 bg-slate-800/30 rounded-lg border border-white/5", children: [_jsxs("h4", { className: "text-xs font-semibold text-emerald-400 mb-3 flex items-center gap-2", children: [_jsx(Handshake, { className: "w-3.5 h-3.5" }), " Informations de l'institution"] }), _jsxs("div", { className: "space-y-3", children: [_jsx(InputField, { label: "Nom de l'institution", name: "bank_name", value: data.bank_name || '', onChange: e => onChange('bank_name', e.target.value), placeholder: "Ex: Afriland First Bank, MTN Money Congo...", error: errors.bank_name, required: true }), _jsx(InputField, { label: "Code institution (optionnel)", name: "institution_code", value: data.institution_code || '', onChange: e => onChange('institution_code', e.target.value), placeholder: "Ex: AFB-001" }), _jsx(SelectField, { label: "Pays", name: "country", value: data.country || '', onChange: e => onChange('country', e.target.value), options: COUNTRIES, icon: _jsx(MapPin, { className: "w-4 h-4" }), error: errors.country, required: true })] })] }), _jsxs("div", { className: "p-3 bg-slate-800/30 rounded-lg border border-white/5", children: [_jsxs("h4", { className: "text-xs font-semibold text-emerald-400 mb-3 flex items-center gap-2", children: [_jsx(User, { className: "w-3.5 h-3.5" }), " Responsable du compte"] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(InputField, { label: "Pr\u00E9nom", name: "first_name", value: data.first_name || '', onChange: e => onChange('first_name', e.target.value), error: errors.first_name, required: true }), _jsx(InputField, { label: "Nom", name: "last_name", value: data.last_name || '', onChange: e => onChange('last_name', e.target.value), error: errors.last_name, required: true })] }), _jsx(InputField, { label: "Fonction", name: "position", value: data.position || '', onChange: e => onChange('position', e.target.value), placeholder: "Ex: Directeur des Cr\u00E9dits", icon: _jsx(Briefcase, { className: "w-4 h-4" }) })] })] }), _jsx(InputField, { label: "Email professionnel", name: "email", type: "email", value: data.email || '', onChange: e => onChange('email', e.target.value), placeholder: "contact@banque.cd", icon: _jsx(Mail, { className: "w-4 h-4" }), error: errors.email, required: true }), _jsx(InputField, { label: "T\u00E9l\u00E9phone", name: "phone_number", type: "tel", value: data.phone_number || '', onChange: e => onChange('phone_number', e.target.value), placeholder: "+242 06 XXX XXXX", icon: _jsx(Phone, { className: "w-4 h-4" }) }), _jsx(CommonPwdField, { data: data, onChange: onChange, errors: errors }), _jsx("div", { className: "p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx(Shield, { className: "w-4 h-4 text-emerald-400 mt-0.5 shrink-0" }), _jsxs("p", { className: "text-xs text-emerald-200", children: ["Acc\u00E8s \u00E0 l'interface banque : gestion clients, dossiers cr\u00E9dit, analyse risque IA, contrats PDF.", _jsx("br", {}), "Ceci inclut les op\u00E9rateurs t\u00E9l\u00E9coms (MTN Money, Airtel Money) proposant du cr\u00E9dit mobile."] })] }) })] }));
// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState('individual');
    const [formData, setFormData] = useState({});
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };
    const validateForm = () => {
        const errors = {};
        const d = formData;
        if (!d.email?.trim())
            errors.email = "Email requis.";
        else if (!d.email.includes("@"))
            errors.email = "Format d'email invalide.";
        if (!d.password)
            errors.password = "Mot de passe requis.";
        else if (d.password.length < 8)
            errors.password = "Minimum 8 caractères.";
        if (d.password && d.password2 && d.password !== d.password2)
            errors.password2 = "Les mots de passe ne correspondent pas.";
        if (!acceptTerms)
            errors.terms = "Vous devez accepter les conditions d'utilisation.";
        if (selectedType === 'individual') {
            if (!d.first_name?.trim())
                errors.first_name = "Prénom requis.";
            if (!d.last_name?.trim())
                errors.last_name = "Nom requis.";
            if (!d.country)
                errors.country = "Pays requis.";
        }
        if (selectedType === 'enterprise') {
            if (!d.company_name?.trim())
                errors.company_name = "Nom commercial requis.";
            if (!d.first_name?.trim())
                errors.first_name = "Prénom requis.";
            if (!d.last_name?.trim())
                errors.last_name = "Nom requis.";
            if (!d.country)
                errors.country = "Pays requis.";
        }
        if (selectedType === 'government') {
            if (!d.first_name?.trim())
                errors.first_name = "Prénom requis.";
            if (!d.last_name?.trim())
                errors.last_name = "Nom requis.";
            if (!d.institution?.trim())
                errors.institution = "Institution requise.";
            if (!d.country)
                errors.country = "Pays requis.";
        }
        if (selectedType === 'bank') {
            if (!d.bank_name?.trim())
                errors.bank_name = "Nom de l'institution requis.";
            if (!d.first_name?.trim())
                errors.first_name = "Prénom requis.";
            if (!d.last_name?.trim())
                errors.last_name = "Nom requis.";
            if (!d.country)
                errors.country = "Pays requis.";
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };
    // ── Soumission ─────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        if (!validateForm())
            return;
        setLoading(true);
        try {
            const backendUserType = TYPE_TO_BACKEND[selectedType] || selectedType;
            // ── Payload complet envoyé au backend ──────────────────────────────
            const payload = {
                email: formData.email.toLowerCase().trim(),
                password: formData.password,
                user_type: backendUserType,
                first_name: formData.first_name || '',
                last_name: formData.last_name || '',
                country: formData.country || 'CG',
                // Profil étendu
                phone_number: formData.phone_number || formData.phone || '',
                city: formData.city || '',
                address: formData.address || '',
                latitude: formData.latitude || '',
                longitude: formData.longitude || '',
                location_source: formData.location_source || '',
                // Entreprise
                company_name: formData.company_name || '',
                rccm: formData.rccm || '',
                sector: formData.sector || '',
                // Banque
                bank_name: formData.bank_name || formData.company_name || '',
                institution_code: formData.institution_code || '',
                // Gouvernement
                institution: formData.institution || '',
                position: formData.position || '',
            };
            // ── Appel API register ─────────────────────────────────────────────
            const res = await authFetch('/api/auth/register/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                // Erreurs de validation du serveur
                if (data.error) {
                    setFormError(data.error);
                }
                else {
                    // Erreurs par champ
                    const serverErrors = {};
                    for (const [key, val] of Object.entries(data)) {
                        serverErrors[key] = Array.isArray(val) ? String(val[0]) : String(val);
                    }
                    setFieldErrors(prev => ({ ...prev, ...serverErrors }));
                    setFormError("Veuillez corriger les erreurs ci-dessous.");
                }
                return;
            }
            // ── Succès — stocker les tokens ────────────────────────────────────
            if (data.access) {
                localStorage.setItem('teras_access_token', data.access);
                localStorage.setItem('teras_refresh_token', data.refresh);
                localStorage.setItem('teras_user', JSON.stringify(data.user));
            }
            // ── Redirection selon le rôle ──────────────────────────────────────
            const redirectPath = TYPE_TO_REDIRECT[backendUserType] || '/mon-espace';
            navigate(redirectPath, { replace: true });
        }
        catch (err) {
            setFormError(err?.message || "Erreur lors de l'inscription. Vérifiez votre connexion.");
        }
        finally {
            setLoading(false);
        }
    };
    const renderForm = () => {
        const props = { data: formData, onChange: handleFieldChange, errors: fieldErrors };
        switch (selectedType) {
            case 'enterprise': return _jsx(EnterpriseForm, { ...props });
            case 'government': return _jsx(GovernmentForm, { ...props });
            case 'bank': return _jsx(BankForm, { ...props });
            default: return _jsx(IndividualForm, { ...props });
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-[#0b1220] text-white px-4 py-8", children: _jsxs("div", { className: "w-full max-w-lg rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-white/10 shadow-xl p-8", children: [_jsxs("button", { type: "button", onClick: () => step === 2 ? (setStep(1), setFormError(null), setFieldErrors({})) : navigate('/'), className: "inline-flex items-center gap-2 text-sm text-slate-400 hover:text-sky-400 transition mb-6", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), step === 2 ? "Changer le type de compte" : "Retour à l'accueil"] }), _jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx(Link, { to: "/", children: _jsx("img", { src: terasLogoUrl, alt: "TERAS", className: "h-10 w-auto rounded-xl bg-[#020617] border border-sky-500/40 shadow-[0_0_18px_rgba(56,189,248,0.45)] p-1.5" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold", children: step === 1 ? "Créer un compte TERAS"
                                        : `Inscription — ${ACCOUNT_TYPES_CONFIG.find(c => c.type === selectedType)?.label}` }), _jsx("p", { className: "text-sm text-slate-400", children: step === 1 ? "Choisissez votre type de compte" : "Complétez vos informations" })] })] }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2 text-xs text-slate-400", children: [_jsxs("span", { children: ["\u00C9tape ", step, " sur 2"] }), _jsx("span", { children: step === 1 ? 'Type de compte' : 'Informations' })] }), _jsx("div", { className: "h-1.5 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-sky-500 transition-all duration-300", style: { width: step === 1 ? '50%' : '100%' } }) })] }), formError && (_jsxs("div", { className: "mb-4 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200", children: [_jsx(AlertCircle, { className: "mt-0.5 h-4 w-4 shrink-0" }), _jsx("span", { children: formError })] })), _jsxs("form", { onSubmit: handleSubmit, children: [step === 1 && (_jsxs("div", { className: "space-y-3", children: [ACCOUNT_TYPES_CONFIG.map(config => (_jsx(AccountTypeCard, { config: config, selected: selectedType === config.type, onSelect: () => setSelectedType(config.type) }, config.type))), _jsxs("button", { type: "button", onClick: () => setStep(2), className: "mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-sky-400 transition-all", children: ["Continuer ", _jsx(ArrowRight, { className: "h-4 w-4" })] })] })), step === 2 && (_jsxs("div", { className: "space-y-4", children: [renderForm(), _jsx(LocationSection, { data: formData, onChange: handleFieldChange }), _jsxs("div", { className: "pt-2", children: [_jsxs("label", { className: "inline-flex items-start gap-2 text-xs text-slate-400 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: acceptTerms, onChange: e => setAcceptTerms(e.target.checked), className: "mt-0.5 h-4 w-4 rounded border border-white/20 bg-slate-900/50 accent-sky-500" }), _jsxs("span", { children: ["J'accepte les", " ", _jsx(Link, { to: "/terms", className: "text-sky-400 hover:underline", children: "Conditions d'utilisation" }), " ", "et la", " ", _jsx(Link, { to: "/privacy", className: "text-sky-400 hover:underline", children: "Politique de confidentialit\u00E9" })] })] }), fieldErrors.terms && _jsx("p", { className: "mt-1 text-xs text-red-400", children: fieldErrors.terms })] }), _jsxs("div", { className: "flex gap-3 pt-2", children: [_jsxs("button", { type: "button", onClick: () => { setStep(1); setFormError(null); setFieldErrors({}); }, className: "flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5 transition", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), " Retour"] }), _jsxs("button", { type: "submit", disabled: loading, className: "flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-sky-400 disabled:opacity-60 transition-all", children: [_jsx(UserPlus, { className: "h-4 w-4" }), loading ? "Création du compte..." : "Créer le compte"] })] })] }))] }), _jsxs("p", { className: "text-center text-sm mt-6 text-gray-400", children: ["D\u00E9j\u00E0 un compte ?", " ", _jsx(Link, { to: "/login", className: "text-sky-400 hover:text-sky-300 hover:underline transition", children: "Se connecter" })] })] }) }));
};
export default Register;
