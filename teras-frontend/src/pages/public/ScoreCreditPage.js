import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/pages/public/ScoreCreditPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, TrendingUp, PiggyBank, Wallet, Building2, Users, CheckCircle, AlertTriangle, Lightbulb, BarChart3, Briefcase, FileText, UserCheck, Handshake, Activity, Shield, Brain, } from "lucide-react";
import PublicNavbar from "../../components/PublicNavbar";
export default function ScoreCreditPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("basic");
    // TERAS Basic (ZOLA) - Pour les individus - Pondérations officielles
    const terasBasicComponents = [
        {
            letter: "T",
            name: "Transactions",
            icon: _jsx(TrendingUp, { className: "h-6 w-6" }),
            color: "sky",
            description: "Volume, régularité et diversité des transactions financières.",
            examples: "Paiements ZOLA, transferts, factures SFEC.",
            weight: "25%",
            weightValue: 0.25,
            tips: [
                "Maintenez des transactions régulières",
                "Diversifiez vos sources de paiement",
                "Évitez les découverts fréquents",
            ],
        },
        {
            letter: "E",
            name: "Épargne",
            icon: _jsx(PiggyBank, { className: "h-6 w-6" }),
            color: "green",
            description: "Capacité à épargner et stabilité de la réserve financière.",
            examples: "Solde moyen, historique d'épargne, retraits.",
            weight: "20%",
            weightValue: 0.20,
            tips: [
                "Épargnez régulièrement",
                "Constituez un fonds d'urgence",
                "Utilisez l'épargne automatique ZOLA",
            ],
        },
        {
            letter: "R",
            name: "Revenus",
            icon: _jsx(Wallet, { className: "h-6 w-6" }),
            color: "yellow",
            description: "Flux entrants mensuels, stabilité et origine des revenus.",
            examples: "Revenus ZOLA, versements employeur.",
            weight: "20%",
            weightValue: 0.20,
            tips: [
                "Documentez tous vos revenus",
                "Développez des revenus complémentaires",
                "Maintenez une stabilité professionnelle",
            ],
        },
        {
            letter: "A",
            name: "Actifs",
            icon: _jsx(Building2, { className: "h-6 w-6" }),
            color: "purple",
            description: "Patrimoine déclaré ou détecté, équipements, biens durables.",
            examples: "Immobilier, véhicule, POS, équipements de travail.",
            weight: "20%",
            weightValue: 0.20,
            tips: [
                "Investissez dans des actifs tangibles",
                "Déclarez vos biens et équipements",
                "Entretenez et valorisez vos biens",
            ],
        },
        {
            letter: "S",
            name: "Social",
            icon: _jsx(Users, { className: "h-6 w-6" }),
            color: "orange",
            description: "Réputation, participation communautaire, conformité civique.",
            examples: "Notes, historique Sounga, comportement réseau.",
            weight: "15%",
            weightValue: 0.15,
            tips: [
                "Payez toujours à temps",
                "Participez aux activités communautaires",
                "Maintenez un bon historique Sounga",
            ],
        },
    ];
    // TERAS Entreprise - Pondérations officielles
    const terasEntrepriseComponents = [
        {
            letter: "T",
            name: "Transparence fiscale",
            icon: _jsx(FileText, { className: "h-6 w-6" }),
            color: "sky",
            description: "Cohérence entre ventes SFEC et déclarations fiscales.",
            examples: "Factures SFEC, TVA, audits.",
            weight: "30%",
            weightValue: 0.30,
            tips: [
                "Déclarez toutes vos factures SFEC",
                "Maintenez une cohérence TVA",
                "Préparez-vous aux audits",
            ],
        },
        {
            letter: "E",
            name: "Emploi local",
            icon: _jsx(UserCheck, { className: "h-6 w-6" }),
            color: "green",
            description: "Création et stabilité de l'emploi.",
            examples: "Registre salarié, déclarations CNSS, turnover.",
            weight: "25%",
            weightValue: 0.25,
            tips: [
                "Créez des emplois stables",
                "Déclarez tous vos salariés à la CNSS",
                "Réduisez le turnover",
            ],
        },
        {
            letter: "R",
            name: "Rétention / Fidélité",
            icon: _jsx(Handshake, { className: "h-6 w-6" }),
            color: "yellow",
            description: "Fidélité clients et fournisseurs.",
            examples: "Taux de récurrence, contrats, réputation.",
            weight: "15%",
            weightValue: 0.15,
            tips: [
                "Fidélisez vos clients",
                "Maintenez des relations fournisseurs stables",
                "Honorez vos contrats",
            ],
        },
        {
            letter: "A",
            name: "Activité économique",
            icon: _jsx(Activity, { className: "h-6 w-6" }),
            color: "purple",
            description: "Volume, diversité et stabilité du chiffre d'affaires.",
            examples: "Ventes, POS, exportations.",
            weight: "20%",
            weightValue: 0.20,
            tips: [
                "Diversifiez vos sources de revenus",
                "Utilisez les POS ZOLA",
                "Développez vos exportations",
            ],
        },
        {
            letter: "S",
            name: "Stabilité sociale",
            icon: _jsx(Shield, { className: "h-6 w-6" }),
            color: "orange",
            description: "Responsabilité sociale, conformité légale, environnement.",
            examples: "RSE, sécurité, contribution locale.",
            weight: "10%",
            weightValue: 0.10,
            tips: [
                "Investissez dans la RSE",
                "Respectez les normes de sécurité",
                "Contribuez à la communauté locale",
            ],
        },
    ];
    const activeComponents = activeTab === "basic" ? terasBasicComponents : terasEntrepriseComponents;
    const scoreRanges = [
        { range: "800-1000", label: "Excellent", color: "green", descBasic: "Accès premium, taux préférentiels", descEntreprise: "Label TERAS+, avantages fiscaux max" },
        { range: "650-799", label: "Bon", color: "sky", descBasic: "Accès complet aux services", descEntreprise: "Crédit entreprise facilité" },
        { range: "500-649", label: "Moyen", color: "yellow", descBasic: "Services standard", descEntreprise: "Accompagnement recommandé" },
        { range: "350-499", label: "Faible", color: "orange", descBasic: "Accès limité, amélioration nécessaire", descEntreprise: "Audit recommandé" },
        { range: "0-349", label: "Très faible", color: "red", descBasic: "Accompagnement prioritaire", descEntreprise: "Plan d'action requis" },
    ];
    const getColorClasses = (color) => {
        const colors = {
            sky: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/30" },
            green: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" },
            yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30" },
            purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
            orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
            red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
        };
        return colors[color] || colors.sky;
    };
    return (_jsxs("div", { className: "min-h-screen bg-[#0B1220] text-white", children: [_jsx(PublicNavbar, {}), _jsxs("main", { children: [_jsx("section", { className: "mx-auto max-w-7xl px-6 pt-16 pb-12", children: _jsxs("div", { className: "text-center max-w-3xl mx-auto", children: [_jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-sky-200/90 mb-6", children: [_jsx(BarChart3, { className: "h-4 w-4" }), "Score de cr\u00E9dit alternatif"] }), _jsxs("h1", { className: "text-4xl sm:text-5xl font-bold mb-6", children: ["Comprendre le", " ", _jsx("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500", children: "Score TERAS" })] }), _jsx("p", { className: "text-lg text-slate-300 leading-relaxed", children: "TERAS est un score de cr\u00E9dit alternatif bas\u00E9 sur 5 piliers fondamentaux, adapt\u00E9 aux r\u00E9alit\u00E9s \u00E9conomiques africaines. D\u00E9couvrez comment il fonctionne et comment l'am\u00E9liorer." })] }) }), _jsxs("section", { className: "mx-auto max-w-7xl px-6 pb-8", children: [_jsx("div", { className: "flex justify-center", children: _jsxs("div", { className: "inline-flex rounded-xl border border-white/10 bg-white/5 p-1", children: [_jsxs("button", { onClick: () => setActiveTab("basic"), className: `flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition ${activeTab === "basic"
                                                ? "bg-sky-500 text-slate-900"
                                                : "text-slate-400 hover:text-white"}`, children: [_jsx(Users, { className: "h-4 w-4" }), "TERAS Basic"] }), _jsxs("button", { onClick: () => setActiveTab("entreprise"), className: `flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition ${activeTab === "entreprise"
                                                ? "bg-purple-500 text-slate-900"
                                                : "text-slate-400 hover:text-white"}`, children: [_jsx(Briefcase, { className: "h-4 w-4" }), "TERAS Entreprise"] })] }) }), _jsx("p", { className: "text-center text-sm text-slate-400 mt-4", children: activeTab === "basic"
                                    ? "Score destiné aux individus et travailleurs indépendants"
                                    : "Score destiné aux entreprises et structures formelles" })] }), _jsxs("section", { className: "mx-auto max-w-7xl px-6 pb-16", children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-semibold mb-8", children: "Les 5 Piliers TERAS" }), _jsx("div", { className: "grid gap-6", children: activeComponents.map((comp, i) => {
                                    const colors = getColorClasses(comp.color);
                                    return (_jsx("div", { className: `rounded-2xl border ${colors.border} bg-white/5 p-6 transition hover:bg-white/10`, children: _jsxs("div", { className: "flex flex-col lg:flex-row lg:items-start gap-6", children: [_jsxs("div", { className: "flex items-center gap-4 lg:w-48 flex-shrink-0", children: [_jsx("div", { className: `h-14 w-14 rounded-xl ${colors.bg} flex items-center justify-center`, children: _jsx("span", { className: `text-2xl font-bold ${colors.text}`, children: comp.letter }) }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold text-lg", children: comp.name }), _jsx("div", { className: `text-sm ${colors.text}`, children: comp.weight })] })] }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-slate-300 mb-3", children: comp.description }), _jsxs("p", { className: "text-sm text-slate-500", children: [_jsx("span", { className: "text-slate-400", children: "Exemples : " }), comp.examples] })] }), _jsxs("div", { className: "lg:w-64 flex-shrink-0", children: [_jsxs("div", { className: "text-sm font-medium text-slate-400 mb-2 flex items-center gap-1", children: [_jsx(Lightbulb, { className: "h-4 w-4" }), "Conseils"] }), _jsx("ul", { className: "space-y-1", children: comp.tips.map((tip, j) => (_jsxs("li", { className: "text-sm text-slate-400 flex items-start gap-2", children: [_jsx(CheckCircle, { className: "h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" }), _jsx("span", { children: tip })] }, j))) })] })] }) }, i));
                                }) })] }), _jsxs("section", { className: "mx-auto max-w-7xl px-6 pb-16", children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-semibold mb-8", children: "Sources de Donn\u00E9es" }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: activeTab === "basic" ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-5", children: [_jsx("div", { className: "text-sky-400 font-semibold mb-2", children: "ZOLA Wallet" }), _jsx("p", { className: "text-sm text-slate-400", children: "Transactions, \u00E9pargne, revenus mobiles." })] }), _jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-5", children: [_jsx("div", { className: "text-green-400 font-semibold mb-2", children: "SFEC" }), _jsx("p", { className: "text-sm text-slate-400", children: "Factures num\u00E9riques, achats d\u00E9clar\u00E9s." })] }), _jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-5", children: [_jsx("div", { className: "text-yellow-400 font-semibold mb-2", children: "D\u00E9clarations" }), _jsx("p", { className: "text-sm text-slate-400", children: "Actifs, revenus compl\u00E9mentaires." })] }), _jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-5", children: [_jsx("div", { className: "text-purple-400 font-semibold mb-2", children: "Sounga" }), _jsx("p", { className: "text-sm text-slate-400", children: "Notes communautaires, micro-cr\u00E9dit." })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-5", children: [_jsx("div", { className: "text-sky-400 font-semibold mb-2", children: "SFEC Entreprise" }), _jsx("p", { className: "text-sm text-slate-400", children: "Ventes B2B, TVA, coh\u00E9rence fiscale." })] }), _jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-5", children: [_jsx("div", { className: "text-green-400 font-semibold mb-2", children: "ZOLA Business" }), _jsx("p", { className: "text-sm text-slate-400", children: "Flux financiers, POS, tr\u00E9sorerie." })] }), _jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-5", children: [_jsx("div", { className: "text-yellow-400 font-semibold mb-2", children: "CNSS" }), _jsx("p", { className: "text-sm text-slate-400", children: "Emploi d\u00E9clar\u00E9, cotisations CNSS." })] }), _jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-5", children: [_jsx("div", { className: "text-purple-400 font-semibold mb-2", children: "Rapports RSE" }), _jsx("p", { className: "text-sm text-slate-400", children: "Sounga Entreprise, responsabilit\u00E9 sociale." })] })] })) })] }), _jsxs("section", { className: "mx-auto max-w-7xl px-6 pb-16", children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-semibold mb-8", children: "Interpr\u00E9tation du Score" }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-5", children: scoreRanges.map((range, i) => {
                                    const colors = getColorClasses(range.color);
                                    return (_jsxs("div", { className: `rounded-2xl border ${colors.border} bg-white/5 p-5 text-center`, children: [_jsx("div", { className: `text-2xl font-bold ${colors.text} mb-1`, children: range.range }), _jsx("div", { className: "font-semibold mb-2", children: range.label }), _jsx("p", { className: "text-sm text-slate-400", children: activeTab === "basic" ? range.descBasic : range.descEntreprise })] }, i));
                                }) })] }), _jsxs("section", { className: "mx-auto max-w-7xl px-6 pb-16", children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-semibold mb-8", children: "Utilisations" }), _jsx("div", { className: "grid gap-4 md:grid-cols-2", children: activeTab === "basic" ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-white/5", children: [_jsx(CheckCircle, { className: "h-6 w-6 text-green-400 flex-shrink-0" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold mb-1", children: "\u00C9ligibilit\u00E9 au micro-cr\u00E9dit" }), _jsx("p", { className: "text-sm text-slate-400", children: "Acc\u00E8s \u00E0 l'\u00E9pargne automatis\u00E9e et aux pr\u00EAts ZOLA." })] })] }), _jsxs("div", { className: "flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-white/5", children: [_jsx(CheckCircle, { className: "h-6 w-6 text-green-400 flex-shrink-0" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold mb-1", children: "Limites et avantages" }), _jsx("p", { className: "text-sm text-slate-400", children: "D\u00E9termination des limites de transaction, taux d'int\u00E9r\u00EAt et cashback." })] })] }), _jsxs("div", { className: "flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-white/5", children: [_jsx(CheckCircle, { className: "h-6 w-6 text-green-400 flex-shrink-0" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold mb-1", children: "Tokenisation citoyenne" }), _jsx("p", { className: "text-sm text-slate-400", children: "Acc\u00E8s \u00E0 la bourse simplifi\u00E9e ZOLA." })] })] }), _jsxs("div", { className: "flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-white/5", children: [_jsx(CheckCircle, { className: "h-6 w-6 text-green-400 flex-shrink-0" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold mb-1", children: "Inclusion financi\u00E8re" }), _jsx("p", { className: "text-sm text-slate-400", children: "Analyse comportementale via TERAS IA." })] })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-white/5", children: [_jsx(CheckCircle, { className: "h-6 w-6 text-green-400 flex-shrink-0" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold mb-1", children: "\u00C9valuation du risque cr\u00E9dit" }), _jsx("p", { className: "text-sm text-slate-400", children: "Pour le cr\u00E9dit entreprise ou la fiscalit\u00E9 dynamique." })] })] }), _jsxs("div", { className: "flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-white/5", children: [_jsx(CheckCircle, { className: "h-6 w-6 text-green-400 flex-shrink-0" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold mb-1", children: "Label TERAS+" }), _jsx("p", { className: "text-sm text-slate-400", children: "Acc\u00E8s aux avantages fiscaux et ZOLA Points." })] })] }), _jsxs("div", { className: "flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-white/5", children: [_jsx(CheckCircle, { className: "h-6 w-6 text-green-400 flex-shrink-0" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold mb-1", children: "Tokenisation entreprise" }), _jsx("p", { className: "text-sm text-slate-400", children: "Base dans la bourse simplifi\u00E9e ZOLA." })] })] }), _jsxs("div", { className: "flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-white/5", children: [_jsx(CheckCircle, { className: "h-6 w-6 text-green-400 flex-shrink-0" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold mb-1", children: "Support analytique" }), _jsx("p", { className: "text-sm text-slate-400", children: "Pour les autorit\u00E9s fiscales et bancaires." })] })] })] })) })] }), _jsxs("section", { className: "mx-auto max-w-7xl px-6 pb-16", children: [_jsxs("h2", { className: "text-2xl sm:text-3xl font-semibold mb-8 flex items-center gap-3", children: [_jsx(Brain, { className: "h-8 w-8 text-sky-400" }), "IA Pr\u00E9dictive (TERAS IA)"] }), _jsxs("div", { className: "grid gap-6 md:grid-cols-3", children: [_jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [_jsx("div", { className: "mb-4 inline-flex items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-300", children: _jsx(TrendingUp, { className: "h-6 w-6" }) }), _jsx("h3", { className: "font-semibold mb-2", children: "Analyse des variations" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Suivi des variations TERAS sur 6\u201312 mois pour d\u00E9tecter les tendances." })] }), _jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [_jsx("div", { className: "mb-4 inline-flex items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-300", children: _jsx(BarChart3, { className: "h-6 w-6" }) }), _jsx("h3", { className: "font-semibold mb-2", children: "Mod\u00E8les ML" }), _jsx("p", { className: "text-slate-400 text-sm", children: "R\u00E9gression et XGBoost pour pr\u00E9dire d\u00E9faut ou croissance." })] }), _jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-6", children: [_jsx("div", { className: "mb-4 inline-flex items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-300", children: _jsx(Lightbulb, { className: "h-6 w-6" }) }), _jsx("h3", { className: "font-semibold mb-2", children: "Assistant IA" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Chat explicatif pour comprendre votre score et recevoir des recommandations." })] })] })] }), _jsxs("section", { className: "mx-auto max-w-7xl px-6 pb-16", children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-semibold mb-8", children: "D\u00E9tection d'Anomalies" }), _jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [_jsxs("div", { className: "flex items-start gap-3 p-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10", children: [_jsx(AlertTriangle, { className: "h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold mb-1 text-yellow-200", children: "\u00C9cart de comportement" }), _jsx("p", { className: "text-sm text-slate-400", children: ">3\u03C3 sur flux transactions ou revenus" })] })] }), _jsxs("div", { className: "flex items-start gap-3 p-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10", children: [_jsx(AlertTriangle, { className: "h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold mb-1 text-yellow-200", children: "Chute brutale" }), _jsx("p", { className: "text-sm text-slate-400", children: ">20% de baisse mensuelle du score" })] })] }), _jsxs("div", { className: "flex items-start gap-3 p-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10", children: [_jsx(AlertTriangle, { className: "h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold mb-1 text-yellow-200", children: "Incoh\u00E9rence" }), _jsx("p", { className: "text-sm text-slate-400", children: "D\u00E9claration SFEC \u2194 ZOLA Wallet" })] })] })] })] }), _jsx("section", { className: "mx-auto max-w-7xl px-6 pb-24", children: _jsxs("div", { className: `rounded-2xl border p-8 text-center ${activeTab === "basic" ? "border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-transparent" : "border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-transparent"}`, children: [_jsxs("h3", { className: "text-2xl font-bold mb-2", children: ["Pr\u00EAt \u00E0 d\u00E9couvrir votre score ", activeTab === "basic" ? "TERAS Basic" : "TERAS Entreprise", " ?"] }), _jsx("p", { className: "text-slate-300 mb-6 max-w-2xl mx-auto", children: "Cr\u00E9ez votre compte gratuitement et obtenez une analyse compl\u00E8te avec des recommandations TERAS IA personnalis\u00E9es." }), _jsxs("div", { className: "flex flex-wrap justify-center gap-4", children: [_jsxs("button", { onClick: () => navigate("/register"), className: `inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition ${activeTab === "basic" ? "bg-sky-500 hover:bg-sky-400 text-slate-900" : "bg-purple-500 hover:bg-purple-400 text-slate-900"}`, children: ["Calculer mon score gratuitement", _jsx(ArrowRight, { className: "h-4 w-4" })] }), _jsx("button", { onClick: () => navigate("/apercu"), className: "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-6 py-3 font-medium transition", children: "Voir un aper\u00E7u" })] })] }) })] }), _jsx("footer", { className: "border-t border-white/10 bg-slate-900/50 py-8", children: _jsxs("div", { className: "mx-auto max-w-7xl px-6 text-center text-sm text-slate-400", children: ["\u00A9 ", new Date().getFullYear(), " TERAS. Tous droits r\u00E9serv\u00E9s."] }) })] }));
}
