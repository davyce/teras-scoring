import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/public/HomePage.tsx
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Star, Shield, Lock, Globe, Clock, LineChart, Bot, Server, KeyRound, } from "lucide-react";
import ScoreSimulator from "../../components/ScoreSimulator";
import PublicNavbar from "../../components/PublicNavbar";
/** Logo animé T (anneau qui tourne) */
function TerasTSpinner() {
    return (_jsxs("div", { className: "relative h-12 w-12 select-none", "aria-hidden": "true", children: [_jsx("svg", { viewBox: "0 0 120 120", className: "absolute inset-0 h-full w-full animate-spin [animation-duration:5s]", children: _jsx("circle", { cx: "60", cy: "60", r: "52", fill: "none", stroke: "rgba(56,189,248,0.35)", strokeWidth: "6", strokeDasharray: "60 30 10 20", strokeLinecap: "round" }) }), _jsx("svg", { viewBox: "0 0 120 120", className: "absolute inset-0 h-full w-full", children: _jsx("circle", { cx: "60", cy: "60", r: "40", fill: "none", stroke: "rgba(56,189,248,0.15)", strokeWidth: "2" }) }), _jsx("div", { className: "absolute inset-0 grid place-items-center", children: _jsx("span", { className: "font-extrabold text-2xl tracking-wider text-sky-300", children: "T" }) })] }));
}
export default function HomePage() {
    const navigate = useNavigate();
    const previewScore = 765;
    const previewLabel = previewScore >= 800
        ? "Excellent"
        : previewScore >= 740
            ? "Très bon"
            : previewScore >= 670
                ? "Bon"
                : previewScore >= 580
                    ? "Moyen"
                    : "Faible";
    return (_jsxs("div", { className: "min-h-screen bg-[#0B1220] text-white", children: [_jsx(PublicNavbar, {}), _jsxs("main", { children: [_jsxs("section", { className: "mx-auto max-w-7xl px-6 pt-16 pb-10", children: [_jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-sky-200/90", children: [_jsx("span", { className: "inline-block h-[6px] w-[6px] rounded-full bg-sky-300" }), "Propuls\u00E9 par l'IA"] }), _jsxs("div", { className: "mt-8 grid gap-10 md:grid-cols-2 md:items-center", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(TerasTSpinner, {}), _jsx("h1", { className: "text-4xl sm:text-5xl font-bold tracking-tight", children: "TERAS" })] }), _jsxs("p", { className: "mt-6 max-w-2xl text-slate-300 leading-relaxed", children: ["Bienvenue sur", " ", _jsx("span", { className: "font-semibold text-sky-200", children: "TERAS" }), ", la plateforme de r\u00E9f\u00E9rence pour \u00E9valuer et am\u00E9liorer votre score de cr\u00E9dit. Vision claire, score en temps r\u00E9el, analyse IA et recommandations personnalis\u00E9es. Simulez ci-dessous, puis cr\u00E9ez votre compte pour acc\u00E9der \u00E0 votre analyse compl\u00E8te."] }), _jsxs("div", { className: "mt-8 flex flex-wrap items-center gap-3", children: [_jsxs("button", { onClick: () => navigate("/register"), className: "inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-5 py-3 font-medium text-slate-900 transition", children: ["Commencer gratuitement", _jsx(ArrowRight, { className: "h-4 w-4" })] }), _jsx("button", { onClick: () => navigate("/login"), className: "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-5 py-3 font-medium transition", children: "Se connecter" }), _jsx("button", { onClick: () => navigate("/apercu"), className: "inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 px-5 py-3 font-medium text-sky-200 transition", title: "Voir un aper\u00E7u du tableau de bord", children: "Aper\u00E7u" })] }), _jsxs("div", { className: "mt-6 flex items-center gap-4 text-slate-400", children: [_jsx("div", { className: "flex items-center gap-1", children: Array.from({ length: 5 }).map((_, i) => (_jsx(Star, { className: "h-4 w-4 fill-yellow-400 text-yellow-400" }, i))) }), _jsx("span", { className: "text-sm", children: "4.9/5" }), _jsx("span", { className: "text-slate-500", children: "\u2022" }), _jsx("span", { className: "text-sm", children: "50,000+ utilisateurs actifs" })] })] }), _jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [_jsx("h3", { className: "text-slate-300 mb-4", children: "Aper\u00E7u instantan\u00E9" }), _jsx("div", { className: "text-6xl font-semibold", children: previewScore }), _jsx("div", { className: "mt-1 text-sky-200", children: previewLabel }), _jsxs("div", { className: "mt-6", children: [_jsx("div", { className: "h-2 w-full rounded-full bg-gradient-to-r from-red-400 via-yellow-300 via-40% to-sky-400" }), _jsx("div", { className: "mt-3 flex justify-between text-xs text-slate-400", children: ["T", "E", "R", "A", "S"].map((k) => (_jsx("span", { className: "w-6 text-center", children: k }, k))) })] })] })] })] }), _jsxs("section", { className: "mx-auto max-w-7xl px-6 pb-20", children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-semibold", children: "Simulez votre score TERAS" }), _jsx("p", { className: "mt-3 max-w-3xl text-slate-300", children: "Ajustez les curseurs pour visualiser l'impact de vos comportements financiers (Transactions, \u00C9pargne, Revenus, Actifs, Social). Le score r\u00E9el s'affiche apr\u00E8s connexion, \u00E0 partir de vos donn\u00E9es s\u00E9curis\u00E9es." }), _jsx("div", { className: "mt-8", children: _jsx(ScoreSimulator, {}) })] }), _jsxs("section", { className: "mx-auto max-w-7xl px-6 pb-20", children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-semibold mb-6", children: "Comment \u00E7a fonctionne ?" }), _jsx("div", { className: "grid gap-6 sm:grid-cols-3", children: [
                                    {
                                        n: "1",
                                        t: "Créez votre compte",
                                        d: "Inscription rapide et sécurisée. Aucune carte de crédit requise pour commencer.",
                                    },
                                    {
                                        n: "2",
                                        t: "Connectez vos données",
                                        d: "Import sécurisé de vos informations financières. Chiffrement de niveau bancaire.",
                                    },
                                    {
                                        n: "3",
                                        t: "Obtenez votre score",
                                        d: "Visualisez votre score et recevez des recommandations personnalisées.",
                                    },
                                ].map((step, i) => (_jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [_jsx("div", { className: "mb-3 inline-flex items-center justify-center h-10 w-10 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 font-bold", children: step.n }), _jsx("h3", { className: "font-semibold mb-1", children: step.t }), _jsx("p", { className: "text-slate-300", children: step.d })] }, i))) })] }), _jsxs("section", { className: "mx-auto max-w-7xl px-6 pb-20", children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-semibold mb-6", children: "Fonctionnalit\u00E9s principales" }), _jsx("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-4", children: [
                                    {
                                        icon: _jsx(LineChart, { className: "h-5 w-5" }),
                                        t: "Score en temps réel",
                                        d: "Visualisez votre score instantanément après chaque mise à jour.",
                                    },
                                    {
                                        icon: _jsx(Bot, { className: "h-5 w-5" }),
                                        t: "Recommandations IA",
                                        d: "Conseils personnalisés pour améliorer votre profil financier.",
                                    },
                                    {
                                        icon: _jsx(Clock, { className: "h-5 w-5" }),
                                        t: "Historique complet",
                                        d: "Suivez l'évolution de votre score dans le temps.",
                                    },
                                    {
                                        icon: _jsx(Shield, { className: "h-5 w-5" }),
                                        t: "Sécurité maximale",
                                        d: "Architecture zéro confiance, audits et monitoring continu.",
                                    },
                                ].map((item, i) => (_jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [_jsx("div", { className: "mb-3 inline-flex items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-300", children: item.icon }), _jsx("h3", { className: "font-semibold mb-1", children: item.t }), _jsx("p", { className: "text-slate-300", children: item.d })] }, i))) })] }), _jsxs("section", { className: "mx-auto max-w-7xl px-6 pb-20", children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-semibold mb-6", children: "S\u00E9curit\u00E9 & conformit\u00E9" }), _jsx("div", { className: "grid gap-6 md:grid-cols-4", children: [
                                    {
                                        icon: _jsx(Shield, { className: "h-5 w-5" }),
                                        t: "ISO 27001",
                                        d: "Cadre de sécurité reconnu pour la gestion de l'information.",
                                    },
                                    {
                                        icon: _jsx(Lock, { className: "h-5 w-5" }),
                                        t: "Chiffrement AES-256",
                                        d: "Protection de bout en bout de vos données sensibles.",
                                    },
                                    {
                                        icon: _jsx(KeyRound, { className: "h-5 w-5" }),
                                        t: "RGPD",
                                        d: "Respect strict de la vie privée et gestion du consentement.",
                                    },
                                    {
                                        icon: _jsx(Globe, { className: "h-5 w-5" }),
                                        t: "SOC 2 Type II",
                                        d: "Contrôles, journaux et audits réguliers.",
                                    },
                                ].map((sec, i) => (_jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [_jsx("div", { className: "mb-3 inline-flex items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-300", children: sec.icon }), _jsx("h3", { className: "font-semibold mb-1", children: sec.t }), _jsx("p", { className: "text-slate-300", children: sec.d })] }, i))) })] }), _jsxs("section", { className: "mx-auto max-w-7xl px-6 pb-20", children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-semibold mb-6", children: "API TERAS" }), _jsx("p", { className: "text-slate-300 max-w-3xl", children: "Int\u00E9grez TERAS dans vos syst\u00E8mes (ZOLA, SFEC, banques, ERP, etc). API REST compl\u00E8te, webhooks et futur SDK pour les principales plateformes." }), _jsx("div", { className: "mt-6 grid gap-6 md:grid-cols-3", children: [
                                    {
                                        icon: _jsx(Server, { className: "h-5 w-5" }),
                                        t: "REST API",
                                        d: "Endpoints pour calculer, consulter et auditer les scores.",
                                    },
                                    {
                                        icon: _jsx(Globe, { className: "h-5 w-5" }),
                                        t: "Webhooks",
                                        d: "Notifications en temps réel lorsqu'un score change.",
                                    },
                                    {
                                        icon: _jsx(KeyRound, { className: "h-5 w-5" }),
                                        t: "Auth sécurisée",
                                        d: "JWT, OAuth2 et clés API avec scopes granularisés.",
                                    },
                                ].map((api, i) => (_jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [_jsx("div", { className: "mb-3 inline-flex items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-300", children: api.icon }), _jsx("h3", { className: "font-semibold mb-1", children: api.t }), _jsx("p", { className: "text-slate-300", children: api.d })] }, i))) })] }), _jsxs("section", { className: "mx-auto max-w-7xl px-6 pb-20", children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-semibold mb-6", children: "Ils nous font confiance" }), _jsx("div", { className: "grid gap-6 md:grid-cols-3", children: [
                                    {
                                        q: "TERAS m'a permis d'augmenter mon score de 120 points en 6 mois avec des actions concrètes.",
                                        a: "Sophie Lemaire — Particulier",
                                    },
                                    {
                                        q: "L'API TERAS s'intègre parfaitement. Nous évaluons la solvabilité de nos clients en temps réel.",
                                        a: "Marc Dubois — CTO, FinTech Pro",
                                    },
                                    {
                                        q: "Interface intuitive, données claires et support pro. Indispensable pour nos décisions.",
                                        a: "Alice Bernard — Dirigeante PME",
                                    },
                                ].map((testi, i) => (_jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [_jsxs("p", { className: "text-slate-200", children: ["\"", testi.q, "\""] }), _jsx("p", { className: "mt-4 text-sm text-slate-400", children: testi.a })] }, i))) })] }), _jsxs("section", { className: "mx-auto max-w-7xl px-6 pb-20", children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-semibold mb-6", children: "Questions fr\u00E9quentes" }), _jsx("div", { className: "grid gap-6", children: [
                                    {
                                        q: "Qu'est-ce qu'un score de crédit TERAS ?",
                                        a: "Une évaluation numérique (0–1000) de votre solvabilité, calculée à partir de vos données réelles via la méthode T-E-R-A-S.",
                                    },
                                    {
                                        q: "Comment TERAS calcule-t-il mon score ?",
                                        a: "Notre méthode T-E-R-A-S analyse Transactions, Épargne, Revenus, Actifs & Social. L'IA permet d'ajuster les pondérations selon le contexte.",
                                    },
                                    {
                                        q: "Mes données sont-elles sécurisées ?",
                                        a: "Oui. Chiffrement de niveau bancaire, anonymisation lorsque c'est possible et stockage sur des infrastructures certifiées.",
                                    },
                                ].map((faq, i) => (_jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [_jsx("h3", { className: "font-semibold mb-1", children: faq.q }), _jsx("p", { className: "text-slate-300", children: faq.a })] }, i))) }), _jsx(Link, { to: "/score-credit", className: "mt-6 inline-block rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium transition", children: "En savoir plus sur le score de cr\u00E9dit" })] }), _jsx("section", { className: "mx-auto max-w-7xl px-6 pb-24", children: _jsxs("div", { className: "rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-transparent p-8", children: [_jsx("h3", { className: "text-xl font-semibold", children: "Pr\u00EAt \u00E0 d\u00E9marrer ?" }), _jsx("p", { className: "text-slate-300 mt-1", children: "Cr\u00E9ez votre compte en quelques secondes et obtenez votre score TERAS, calcul\u00E9 \u00E0 partir de vos vraies donn\u00E9es." }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-3", children: [_jsxs("button", { onClick: () => navigate("/register"), className: "inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-5 py-3 font-medium text-slate-900 transition", children: ["Commencer gratuitement", _jsx(ArrowRight, { className: "h-4 w-4" })] }), _jsx("button", { onClick: () => navigate("/login"), className: "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-5 py-3 font-medium transition", children: "Se connecter" }), _jsx("button", { onClick: () => navigate("/apercu"), className: "inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-transparent hover:bg-sky-500/10 px-5 py-3 font-medium text-sky-200 transition", children: "Voir l'aper\u00E7u" })] })] }) }), _jsx("footer", { className: "border-t border-white/10 bg-slate-900/50", children: _jsxs("div", { className: "mx-auto max-w-7xl px-6 py-12", children: [_jsxs("div", { className: "grid gap-8 md:grid-cols-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-white mb-4", children: "TERAS" }), _jsx("p", { className: "text-sm text-slate-400", children: "La plateforme de r\u00E9f\u00E9rence pour \u00E9valuer et am\u00E9liorer votre score de cr\u00E9dit en Afrique." })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-white mb-4", children: "Produit" }), _jsxs("ul", { className: "space-y-2 text-sm text-slate-400", children: [_jsx("li", { children: _jsx(Link, { to: "/score-credit", className: "hover:text-white transition", children: "Score de cr\u00E9dit" }) }), _jsx("li", { children: _jsx(Link, { to: "/api-docs", className: "hover:text-white transition", children: "API" }) }), _jsx("li", { children: _jsx(Link, { to: "/tarifs", className: "hover:text-white transition", children: "Tarifs" }) })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-white mb-4", children: "Entreprise" }), _jsxs("ul", { className: "space-y-2 text-sm text-slate-400", children: [_jsx("li", { children: _jsx(Link, { to: "/a-propos", className: "hover:text-white transition", children: "\u00C0 propos" }) }), _jsx("li", { children: _jsx(Link, { to: "/contact", className: "hover:text-white transition", children: "Contact" }) }), _jsx("li", { children: _jsx(Link, { to: "/carri\u00E8res", className: "hover:text-white transition", children: "Carri\u00E8res" }) })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-white mb-4", children: "L\u00E9gal" }), _jsxs("ul", { className: "space-y-2 text-sm text-slate-400", children: [_jsx("li", { children: _jsx(Link, { to: "/confidentialite", className: "hover:text-white transition", children: "Confidentialit\u00E9" }) }), _jsx("li", { children: _jsx(Link, { to: "/conditions", className: "hover:text-white transition", children: "Conditions" }) }), _jsx("li", { children: _jsx(Link, { to: "/securite", className: "hover:text-white transition", children: "S\u00E9curit\u00E9" }) })] })] })] }), _jsxs("div", { className: "mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4", children: [_jsxs("p", { className: "text-sm text-slate-400", children: ["\u00A9 ", new Date().getFullYear(), " TERAS. Tous droits r\u00E9serv\u00E9s."] }), _jsxs("div", { className: "flex items-center gap-4 text-slate-400", children: [_jsx("a", { href: "#", className: "hover:text-white transition", children: "Twitter" }), _jsx("a", { href: "#", className: "hover:text-white transition", children: "LinkedIn" }), _jsx("a", { href: "#", className: "hover:text-white transition", children: "GitHub" })] })] })] }) })] })] }));
}
