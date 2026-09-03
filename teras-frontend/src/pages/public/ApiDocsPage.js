import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/public/ApiDocsPage.tsx
import { useNavigate } from "react-router-dom";
import { ArrowRight, Server, Key, Globe, Shield, Zap, BookOpen, Terminal, Copy, CheckCircle, Building2, Landmark, User, Sparkles, Database, } from "lucide-react";
import { useState } from "react";
import PublicNavbar from "../../components/PublicNavbar";
export default function ApiDocsPage() {
    const navigate = useNavigate();
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };
    const endpoints = [
        {
            method: "POST",
            path: "/api/v1/scoring/score/",
            description: "Calculer un nouveau score TERAS",
            auth: true,
        },
        {
            method: "GET",
            path: "/api/v1/scoring/history/",
            description: "Récupérer l'historique des scores",
            auth: true,
        },
        {
            method: "POST",
            path: "/api/token/",
            description: "Obtenir un token JWT (authentification)",
            auth: false,
        },
        {
            method: "POST",
            path: "/api/token/refresh/",
            description: "Rafraîchir un token JWT",
            auth: false,
        },
        {
            method: "GET",
            path: "/api/me/",
            description: "Informations de l'utilisateur connecté",
            auth: true,
        },
        {
            method: "GET",
            path: "/api/teras/dashboard/",
            description: "Données complètes du dashboard",
            auth: true,
        },
        {
            method: "POST",
            path: "/api/v1/enterprise/score/",
            description: "Calculer score TERAS Entreprise",
            auth: true,
        },
        {
            method: "POST",
            path: "/api/v1/ai/analyze/",
            description: "Analyse IA avec recommandations",
            auth: true,
        },
        {
            method: "POST",
            path: "/api/v1/documents/upload/",
            description: "Upload de documents (PDF, Excel)",
            auth: true,
        },
        {
            method: "GET",
            path: "/api/v1/analytics/portfolio/",
            description: "Analytics portefeuille (Banque)",
            auth: true,
        },
    ];
    const codeExamples = [
        {
            title: "Authentification",
            language: "bash",
            code: `curl -X POST https://api.teras.io/api/token/ \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "votre@email.com",
    "password": "votre_mot_de_passe"
  }'`,
        },
        {
            title: "Calculer un score",
            language: "bash",
            code: `curl -X POST https://api.teras.io/api/v1/scoring/score/ \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "transactions": 150000,
    "epargne": 500000,
    "revenus": 1200000,
    "actifs": 2500000,
    "social": 70
  }'`,
        },
        {
            title: "Analyse IA",
            language: "bash",
            code: `curl -X POST https://api.teras.io/api/v1/ai/analyze/ \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "score": 742,
    "context": "demande_credit",
    "amount": 5000000
  }'`,
        },
    ];
    const features = [
        {
            icon: _jsx(Zap, { className: "h-6 w-6" }),
            title: "Haute performance",
            description: "Temps de réponse < 100ms pour le calcul de score.",
        },
        {
            icon: _jsx(Shield, { className: "h-6 w-6" }),
            title: "Sécurisé",
            description: "Authentification JWT, HTTPS obligatoire, rate limiting.",
        },
        {
            icon: _jsx(Globe, { className: "h-6 w-6" }),
            title: "RESTful",
            description: "API REST standard avec JSON, facile à intégrer.",
        },
        {
            icon: _jsx(Sparkles, { className: "h-6 w-6" }),
            title: "IA Intégrée",
            description: "Assistant Claude Sonnet 4 pour analyses avancées.",
        },
        {
            icon: _jsx(Database, { className: "h-6 w-6" }),
            title: "Multi-format",
            description: "Supporte PDF, Excel, OFX, MT940, CAMT.053.",
        },
        {
            icon: _jsx(BookOpen, { className: "h-6 w-6" }),
            title: "Documenté",
            description: "Documentation OpenAPI/Swagger complète disponible.",
        },
    ];
    // Prix adaptés par type d'utilisateur
    const pricing = [
        {
            name: "Individuel",
            icon: _jsx(User, { className: "h-6 w-6" }),
            monthlyPrice: "10 000",
            annualPrice: "100 000",
            requests: "50 requêtes/mois",
            color: "blue",
            features: [
                "Calcul score TERAS Basic",
                "Historique 3 mois",
                "Dashboard personnel",
                "Support communauté",
                "Export PDF",
            ],
            popular: false,
        },
        {
            name: "Entreprise",
            icon: _jsx(Building2, { className: "h-6 w-6" }),
            monthlyPrice: "700 000",
            annualPrice: "7 000 000",
            requests: "1 000 requêtes/mois",
            color: "purple",
            features: [
                "Score TERAS Entreprise",
                "Historique illimité",
                "Gestion employés",
                "Analytics avancés",
                "Assistant IA inclus",
                "Rapports personnalisés",
                "API complète",
                "Support prioritaire",
            ],
            popular: true,
        },
        {
            name: "Gouvernement",
            icon: _jsx(Landmark, { className: "h-6 w-6" }),
            monthlyPrice: "50 000 000",
            annualPrice: "500 000 000",
            requests: "Illimité",
            color: "green",
            features: [
                "Données agrégées régionales",
                "Analytics sectoriels",
                "Tableaux de bord macro",
                "Alertes économiques",
                "Assistant IA stratégique",
                "Exports massifs",
                "API temps réel",
                "SLA 99.9%",
                "Account manager dédié",
            ],
            popular: false,
        },
        {
            name: "Banque",
            icon: _jsx(Landmark, { className: "h-6 w-6" }),
            monthlyPrice: "20 000 000",
            annualPrice: "200 000 000",
            requests: "Illimité",
            color: "cyan",
            features: [
                "✨ Toutes fonctionnalités",
                "Scoring individuel & entreprise",
                "Gestion portefeuille complet",
                "Analytics temps réel",
                "Assistant IA Claude Sonnet 4",
                "Simulateur de crédit avancé",
                "Gestion risques & provisions",
                "Détection fraude IA",
                "Webhooks personnalisés",
                "White label disponible",
                "API illimitée",
                "SLA 99.99%",
                "Support 24/7",
                "Intégration dédiée",
                "Formation équipe incluse",
            ],
            premium: true,
        },
    ];
    // Calculer l'économie annuelle
    const getSavings = (monthly, annual) => {
        const monthlyTotal = parseInt(monthly.replace(/\s/g, '')) * 12;
        const annualTotal = parseInt(annual.replace(/\s/g, ''));
        const savings = monthlyTotal - annualTotal;
        const percentage = Math.round((savings / monthlyTotal) * 100);
        return { savings, percentage };
    };
    return (_jsxs("div", { className: "min-h-screen bg-[#0B1220] text-white", children: [_jsx(PublicNavbar, {}), _jsxs("main", { children: [_jsx("section", { className: "mx-auto max-w-7xl px-6 pt-16 pb-12", children: _jsxs("div", { className: "text-center max-w-3xl mx-auto", children: [_jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-sky-200/90 mb-6", children: [_jsx(Server, { className: "h-4 w-4" }), "API REST + IA"] }), _jsxs("h1", { className: "text-4xl sm:text-5xl font-bold mb-6", children: ["API", " ", _jsx("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500", children: "TERAS" })] }), _jsx("p", { className: "text-lg text-slate-300 leading-relaxed", children: "Int\u00E9grez le scoring TERAS dans vos applications. API REST compl\u00E8te avec IA int\u00E9gr\u00E9e, s\u00E9curis\u00E9e et performante pour calculer et g\u00E9rer les scores de cr\u00E9dit." }), _jsxs("div", { className: "mt-8 flex flex-wrap justify-center gap-4", children: [_jsxs("button", { onClick: () => window.open("/api/docs/", "_blank"), className: "inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-6 py-3 font-semibold text-slate-900 transition", children: [_jsx(BookOpen, { className: "h-4 w-4" }), "Documentation Swagger"] }), _jsx("button", { onClick: () => navigate("/register"), className: "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-6 py-3 font-medium transition", children: "Obtenir une cl\u00E9 API" })] })] }) }), _jsx("section", { className: "mx-auto max-w-7xl px-6 pb-16", children: _jsx("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: features.map((feature, i) => (_jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all", children: [_jsx("div", { className: "mb-4 inline-flex items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-300", children: feature.icon }), _jsx("h3", { className: "font-semibold mb-2", children: feature.title }), _jsx("p", { className: "text-sm text-slate-400", children: feature.description })] }, i))) }) }), _jsxs("section", { className: "mx-auto max-w-7xl px-6 pb-16", children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-semibold mb-8", children: "Endpoints Disponibles" }), _jsx("div", { className: "rounded-2xl border border-white/10 bg-white/5 overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left", children: [_jsx("thead", { className: "border-b border-white/10 bg-slate-900/50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-4 text-sm font-semibold text-slate-300", children: "M\u00E9thode" }), _jsx("th", { className: "px-6 py-4 text-sm font-semibold text-slate-300", children: "Endpoint" }), _jsx("th", { className: "px-6 py-4 text-sm font-semibold text-slate-300", children: "Description" }), _jsx("th", { className: "px-6 py-4 text-sm font-semibold text-slate-300", children: "Auth" })] }) }), _jsx("tbody", { className: "divide-y divide-white/5", children: endpoints.map((endpoint, i) => (_jsxs("tr", { className: "hover:bg-white/5 transition", children: [_jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `inline-block px-2 py-1 text-xs font-semibold rounded ${endpoint.method === "GET"
                                                                    ? "bg-green-500/20 text-green-400"
                                                                    : "bg-sky-500/20 text-sky-400"}`, children: endpoint.method }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("code", { className: "text-sm text-sky-300 bg-slate-800/50 px-2 py-1 rounded", children: endpoint.path }) }), _jsx("td", { className: "px-6 py-4 text-sm text-slate-400", children: endpoint.description }), _jsx("td", { className: "px-6 py-4", children: endpoint.auth ? (_jsx(Key, { className: "h-4 w-4 text-yellow-400" })) : (_jsx("span", { className: "text-slate-500", children: "-" })) })] }, i))) })] }) }) })] }), _jsxs("section", { className: "mx-auto max-w-7xl px-6 pb-16", children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-semibold mb-8", children: "Exemples de Code" }), _jsx("div", { className: "grid gap-6 lg:grid-cols-3", children: codeExamples.map((example, i) => (_jsxs("div", { className: "rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-800/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Terminal, { className: "h-4 w-4 text-slate-400" }), _jsx("span", { className: "text-sm font-medium", children: example.title })] }), _jsx("button", { onClick: () => handleCopy(example.code, i), className: "p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition", children: copiedIndex === i ? (_jsx(CheckCircle, { className: "h-4 w-4 text-green-400" })) : (_jsx(Copy, { className: "h-4 w-4" })) })] }), _jsx("pre", { className: "p-4 text-sm overflow-x-auto", children: _jsx("code", { className: "text-slate-300", children: example.code }) })] }, i))) })] }), _jsxs("section", { className: "mx-auto max-w-7xl px-6 pb-20", children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-semibold mb-4 text-center", children: "Tarifs API par Type d'Utilisateur" }), _jsx("p", { className: "text-slate-400 text-center mb-8 max-w-2xl mx-auto", children: "Choisissez le plan adapt\u00E9 \u00E0 votre profil. \u00C9conomisez jusqu'\u00E0 17% avec la facturation annuelle." }), _jsx("div", { className: "flex justify-center mb-12", children: _jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1", children: [_jsx("button", { onClick: () => setBillingCycle('monthly'), className: `px-6 py-2 rounded-full font-medium transition-all ${billingCycle === 'monthly'
                                                ? 'bg-sky-500 text-white'
                                                : 'text-slate-400 hover:text-white'}`, children: "Mensuel" }), _jsxs("button", { onClick: () => setBillingCycle('annual'), className: `px-6 py-2 rounded-full font-medium transition-all ${billingCycle === 'annual'
                                                ? 'bg-sky-500 text-white'
                                                : 'text-slate-400 hover:text-white'}`, children: ["Annuel", _jsx("span", { className: "ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full", children: "-17%" })] })] }) }), _jsx("div", { className: "grid gap-6 lg:grid-cols-4", children: pricing.map((plan, i) => {
                                    const savings = getSavings(plan.monthlyPrice, plan.annualPrice);
                                    const displayPrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
                                    const priceLabel = billingCycle === 'monthly' ? '/mois' : '/an';
                                    return (_jsxs("div", { className: `rounded-2xl border p-6 relative ${plan.premium
                                            ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-500/20 to-blue-500/10'
                                            : plan.popular
                                                ? 'border-purple-500/50 bg-purple-500/10'
                                                : 'border-white/10 bg-white/5'} hover:scale-105 transition-transform`, children: [(plan.popular || plan.premium) && (_jsx("div", { className: `absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full ${plan.premium
                                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                                    : 'bg-purple-500 text-white'}`, children: plan.premium ? '⭐ PREMIUM' : '⭐ POPULAIRE' })), _jsx("div", { className: `mb-4 inline-flex items-center justify-center rounded-lg border p-2 ${plan.premium
                                                    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                                                    : `border-${plan.color}-500/30 bg-${plan.color}-500/10 text-${plan.color}-300`}`, children: plan.icon }), _jsx("h3", { className: "text-xl font-bold mb-2", children: plan.name }), _jsxs("div", { className: "mb-4", children: [_jsx("span", { className: "text-3xl font-bold", children: displayPrice }), _jsxs("span", { className: "text-slate-400", children: [" FCFA", priceLabel] }), billingCycle === 'annual' && savings.percentage > 0 && (_jsxs("div", { className: "text-xs text-green-400 mt-1", children: ["\u00C9conomie de ", savings.savings.toLocaleString(), " FCFA (", savings.percentage, "%)"] }))] }), _jsxs("p", { className: "text-sm text-slate-400 mb-6 flex items-center gap-2", children: [_jsx(Zap, { className: "h-4 w-4" }), plan.requests] }), _jsx("ul", { className: "space-y-3 mb-6", children: plan.features.map((feature, j) => (_jsxs("li", { className: "flex items-start gap-2 text-sm", children: [_jsx(CheckCircle, { className: "h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" }), _jsx("span", { className: "text-slate-300", children: feature })] }, j))) }), _jsx("button", { onClick: () => navigate("/register"), className: `w-full py-3 rounded-lg font-medium transition-all ${plan.premium
                                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/30'
                                                    : plan.popular
                                                        ? 'bg-purple-500 hover:bg-purple-400 text-white'
                                                        : 'bg-slate-800 hover:bg-slate-700 text-white'}`, children: "Commencer" })] }, i));
                                }) }), _jsx("div", { className: "mt-8 text-center", children: _jsx("p", { className: "text-slate-400 text-sm", children: "\uD83D\uDCB3 Paiement s\u00E9curis\u00E9 \u2022 \uD83D\uDCDE Support client \u2022 \uD83D\uDD04 Annulation \u00E0 tout moment" }) })] }), _jsx("section", { className: "mx-auto max-w-7xl px-6 pb-24", children: _jsxs("div", { className: "rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-transparent p-8 text-center", children: [_jsx("h3", { className: "text-2xl font-bold mb-2", children: "Pr\u00EAt \u00E0 int\u00E9grer TERAS ?" }), _jsx("p", { className: "text-slate-300 mb-6 max-w-2xl mx-auto", children: "Cr\u00E9ez votre compte d\u00E9veloppeur et obtenez votre cl\u00E9 API gratuite en quelques minutes. Essai gratuit 14 jours." }), _jsxs("div", { className: "flex flex-wrap justify-center gap-4", children: [_jsxs("button", { onClick: () => navigate("/register"), className: "inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-6 py-3 font-semibold text-slate-900 transition", children: ["Obtenir ma cl\u00E9 API", _jsx(ArrowRight, { className: "h-4 w-4" })] }), _jsx("button", { onClick: () => navigate("/contact"), className: "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-6 py-3 font-medium transition", children: "Contacter l'\u00E9quipe" })] })] }) })] }), _jsx("footer", { className: "border-t border-white/10 bg-slate-900/50 py-8", children: _jsxs("div", { className: "mx-auto max-w-7xl px-6 text-center text-sm text-slate-400", children: ["\u00A9 ", new Date().getFullYear(), " TERAS. Tous droits r\u00E9serv\u00E9s."] }) })] }));
}
