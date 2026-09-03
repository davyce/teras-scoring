import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Page d'attente de validation du compte
 * Pour les comptes Entreprise, Gouvernement et Partenaire
 * @module pages/auth/RegisterPendingPage
 */
import { Link, useLocation } from "react-router-dom";
import { Clock, Mail, FileText, Building2, Landmark, Handshake, ArrowLeft, HelpCircle } from "lucide-react";
// Configuration par type de compte
const PENDING_CONFIGS = {
    enterprise: {
        icon: Building2,
        title: 'Entreprise',
        description: 'Votre demande de compte entreprise est en cours de vérification',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        steps: [
            'Vérification des informations de l\'entreprise',
            'Validation du numéro d\'identification fiscale (NIF)',
            'Contrôle du représentant légal',
            'Activation du compte'
        ],
        delay: '24 à 48 heures'
    },
    government: {
        icon: Landmark,
        title: 'Opérateur Gouvernemental',
        description: 'Votre demande d\'accès gouvernemental est en cours de validation',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        steps: [
            'Vérification de votre matricule',
            'Confirmation auprès de votre institution',
            'Attribution des niveaux d\'accès',
            'Activation du compte'
        ],
        delay: '2 à 5 jours ouvrables'
    },
    partner: {
        icon: Handshake,
        title: 'Partenaire Financier',
        description: 'Votre demande de partenariat est en cours d\'examen',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        steps: [
            'Vérification de la licence / agrément',
            'Validation de l\'organisation',
            'Configuration des accès API',
            'Activation du compte partenaire'
        ],
        delay: '3 à 7 jours ouvrables'
    }
};
const RegisterPendingPage = () => {
    const location = useLocation();
    const state = location.state;
    const accountType = state?.account_type || 'enterprise';
    const email = state?.email || 'votre adresse email';
    const config = PENDING_CONFIGS[accountType] || PENDING_CONFIGS.enterprise;
    const IconComponent = config.icon;
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-[#0b1220] text-white px-4 py-8", children: _jsxs("div", { className: "w-full max-w-lg", children: [_jsxs("div", { className: "rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-white/10 shadow-xl overflow-hidden", children: [_jsxs("div", { className: `${config.bgColor} ${config.borderColor} border-b p-8 text-center`, children: [_jsx("div", { className: `w-20 h-20 ${config.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4 border ${config.borderColor}`, children: _jsx(IconComponent, { className: `w-10 h-10 ${config.color}` }) }), _jsx("h1", { className: "text-2xl font-bold text-white mb-2", children: "Demande enregistr\u00E9e !" }), _jsxs("p", { className: `${config.color} font-medium`, children: ["Compte ", config.title] })] }), _jsxs("div", { className: "p-8", children: [_jsxs("div", { className: "flex items-center gap-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-6", children: [_jsx("div", { className: "w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0", children: _jsx(Clock, { className: "w-6 h-6 text-amber-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-amber-400", children: "En attente de validation" }), _jsxs("p", { className: "text-sm text-slate-400", children: ["D\u00E9lai estim\u00E9 : ", config.delay] })] })] }), _jsxs("p", { className: "text-slate-400 mb-6", children: [config.description, ". Nous vous enverrons un email \u00E0", ' ', _jsx("span", { className: "text-white font-medium", children: email }), ' ', "d\u00E8s que votre compte sera activ\u00E9."] }), _jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-300 mb-4", children: "Processus de validation :" }), _jsx("div", { className: "space-y-3", children: config.steps.map((step, index) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `
                      w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold
                      ${index === 0
                                                            ? `${config.bgColor} ${config.color} border ${config.borderColor}`
                                                            : 'bg-slate-800/50 text-slate-500 border border-white/5'}
                    `, children: index === 0 ? (_jsx(Clock, { className: "w-4 h-4" })) : (index + 1) }), _jsx("span", { className: `text-sm ${index === 0 ? 'text-white' : 'text-slate-500'}`, children: step })] }, index))) })] }), _jsx("div", { className: "p-4 bg-slate-800/50 border border-white/5 rounded-xl mb-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Mail, { className: "w-5 h-5 text-sky-400 mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-white", children: "V\u00E9rifiez votre bo\u00EEte mail" }), _jsx("p", { className: "text-sm text-slate-400 mt-1", children: "Un email de confirmation a \u00E9t\u00E9 envoy\u00E9. Pensez \u00E0 v\u00E9rifier vos spams." })] })] }) }), _jsx("div", { className: "p-4 bg-slate-800/50 border border-white/5 rounded-xl mb-6", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(FileText, { className: "w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-white", children: "Documents \u00E9ventuels" }), _jsx("p", { className: "text-sm text-slate-400 mt-1", children: "Notre \u00E9quipe pourrait vous contacter pour des documents compl\u00E9mentaires (attestation d'immatriculation, pi\u00E8ce d'identit\u00E9, etc.)" })] })] }) }), _jsxs("div", { className: "space-y-3", children: [_jsx(Link, { to: "/", className: "w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg hover:bg-sky-400 transition-all", children: "Retour \u00E0 l'accueil" }), _jsxs(Link, { to: "/help", className: "w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/5 transition-all", children: [_jsx(HelpCircle, { className: "w-4 h-4" }), "Besoin d'aide ?"] })] })] })] }), _jsx("div", { className: "mt-6 text-center", children: _jsxs("p", { className: "text-sm text-slate-500", children: ["Une question ?", ' ', _jsx("a", { href: "mailto:support@teras.ai", className: "text-sky-400 hover:underline", children: "support@teras.ai" })] }) }), _jsx("div", { className: "mt-4 text-center", children: _jsxs(Link, { to: "/login", className: "inline-flex items-center gap-2 text-sm text-slate-500 hover:text-sky-400 transition", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), "Retour \u00E0 la connexion"] }) })] }) }));
};
export default RegisterPendingPage;
