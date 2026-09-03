import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/public/PreviewDashboard.tsx
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, TrendingUp, AlertCircle, FileText, BarChart3, Clock, Target, Lock, } from "lucide-react";
import PublicNavbar from "../../components/PublicNavbar";
function ScoreLineChart({ data }) {
    const padding = { top: 30, right: 30, bottom: 40, left: 50 };
    const width = 800;
    const height = 250;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    // Calcul des min/max pour l'échelle
    const scores = data.map((d) => d.score);
    const minScore = Math.min(...scores) - 20;
    const maxScore = Math.max(...scores) + 20;
    const scoreRange = maxScore - minScore;
    // Génération des points
    const points = data.map((d, i) => ({
        x: padding.left + (i / (data.length - 1)) * chartWidth,
        y: padding.top + chartHeight - ((d.score - minScore) / scoreRange) * chartHeight,
        score: d.score,
        label: d.label,
    }));
    // Création du path pour la ligne
    const linePath = points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");
    // Création du path pour l'aire sous la courbe
    const areaPath = `
    ${linePath}
    L ${points[points.length - 1].x} ${padding.top + chartHeight}
    L ${points[0].x} ${padding.top + chartHeight}
    Z
  `;
    // Lignes de grille horizontales
    const gridLines = [];
    const numGridLines = 5;
    for (let i = 0; i <= numGridLines; i++) {
        const y = padding.top + (i / numGridLines) * chartHeight;
        const scoreValue = Math.round(maxScore - (i / numGridLines) * scoreRange);
        gridLines.push({ y, score: scoreValue });
    }
    return (_jsxs("svg", { viewBox: `0 0 ${width} ${height}`, className: "w-full h-auto", children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "areaGradient", x1: "0%", y1: "0%", x2: "0%", y2: "100%", children: [_jsx("stop", { offset: "0%", stopColor: "rgba(56, 189, 248, 0.3)" }), _jsx("stop", { offset: "100%", stopColor: "rgba(56, 189, 248, 0)" })] }), _jsxs("linearGradient", { id: "lineGradient", x1: "0%", y1: "0%", x2: "100%", y2: "0%", children: [_jsx("stop", { offset: "0%", stopColor: "#38bdf8" }), _jsx("stop", { offset: "100%", stopColor: "#3b82f6" })] }), _jsxs("filter", { id: "glow", children: [_jsx("feGaussianBlur", { stdDeviation: "3", result: "coloredBlur" }), _jsxs("feMerge", { children: [_jsx("feMergeNode", { in: "coloredBlur" }), _jsx("feMergeNode", { in: "SourceGraphic" })] })] })] }), gridLines.map((line, i) => (_jsxs("g", { children: [_jsx("line", { x1: padding.left, y1: line.y, x2: width - padding.right, y2: line.y, stroke: "rgba(255,255,255,0.1)", strokeDasharray: "4 4" }), _jsx("text", { x: padding.left - 10, y: line.y + 4, textAnchor: "end", fill: "rgba(148, 163, 184, 0.8)", fontSize: "12", children: line.score })] }, i))), _jsx("path", { d: areaPath, fill: "url(#areaGradient)" }), _jsx("path", { d: linePath, fill: "none", stroke: "url(#lineGradient)", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", filter: "url(#glow)" }), points.map((point, i) => (_jsxs("g", { children: [_jsx("line", { x1: point.x, y1: padding.top, x2: point.x, y2: padding.top + chartHeight, stroke: "rgba(255,255,255,0.05)" }), _jsx("circle", { cx: point.x, cy: point.y, r: "8", fill: "rgba(56, 189, 248, 0.2)" }), _jsx("circle", { cx: point.x, cy: point.y, r: "5", fill: "#0f172a", stroke: "url(#lineGradient)", strokeWidth: "2" }), _jsx("text", { x: point.x, y: point.y - 15, textAnchor: "middle", fill: "#38bdf8", fontSize: "13", fontWeight: "600", children: point.score }), _jsx("text", { x: point.x, y: height - 10, textAnchor: "middle", fill: "rgba(148, 163, 184, 0.8)", fontSize: "12", children: point.label })] }, i)))] }));
}
/**
 * Page d'aperçu du dashboard pour les visiteurs non connectés.
 * Affiche des données fictives pour montrer les fonctionnalités.
 */
export default function PreviewDashboard() {
    const navigate = useNavigate();
    // Données fictives pour l'aperçu
    const demoScore = 742;
    const demoScoreLabel = "Très bon";
    const demoHistory = [
        { label: "Jan", score: 680 },
        { label: "Fév", score: 695 },
        { label: "Mar", score: 710 },
        { label: "Avr", score: 725 },
        { label: "Mai", score: 738 },
        { label: "Juin", score: 742 },
    ];
    const demoRecommendations = [
        {
            id: 1,
            title: "Augmentez votre épargne mensuelle",
            description: "Une épargne régulière de 50,000 FCFA/mois pourrait augmenter votre score de 30 points.",
            impactLabel: "+30 pts",
        },
        {
            id: 2,
            title: "Diversifiez vos revenus",
            description: "Ajoutez une source de revenus secondaire pour améliorer votre profil.",
            impactLabel: "+25 pts",
        },
        {
            id: 3,
            title: "Maintenez vos paiements à temps",
            description: "Continuez à payer vos factures avant échéance pour maintenir un bon historique.",
            impactLabel: "+15 pts",
        },
    ];
    return (_jsxs("div", { className: "min-h-screen bg-[#0b1220] text-white", children: [_jsx(PublicNavbar, {}), _jsx("div", { className: "bg-sky-500/10 border-b border-sky-500/30", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3", children: _jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-sky-200", children: [_jsx(Lock, { className: "h-4 w-4" }), _jsx("span", { className: "text-sm", children: "Ceci est un aper\u00E7u avec des donn\u00E9es fictives. Cr\u00E9ez un compte pour voir votre vrai score." })] }), _jsxs("button", { onClick: () => navigate("/register"), className: "inline-flex items-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 px-4 py-2 text-sm font-medium text-slate-900 transition", children: ["Cr\u00E9er un compte", _jsx(ArrowRight, { className: "h-4 w-4" })] })] }) }) }), _jsxs("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("button", { onClick: () => navigate("/"), className: "inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-6", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), "Retour \u00E0 l'accueil"] }), _jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-3xl font-bold text-white mb-2", children: "Aper\u00E7u du Tableau de Bord \uD83D\uDC4B" }), _jsx("p", { className: "text-slate-400", children: "Voici \u00E0 quoi ressemble votre espace TERAS (donn\u00E9es de d\u00E9monstration)" })] }), _jsx("div", { className: "mb-6", children: _jsxs("div", { className: "flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg", children: [_jsx(AlertCircle, { className: "h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-sm text-yellow-200", children: "Aucun document r\u00E9cent. Ajoutez des relev\u00E9s et bulletins pour am\u00E9liorer la pr\u00E9cision du score." })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [_jsxs("div", { className: "md:col-span-2 bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-transparent to-transparent pointer-events-none" }), _jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-lg font-semibold mb-1 flex items-center gap-2 text-white", children: [_jsx(BarChart3, { className: "h-5 w-5" }), "Votre Score TERAS"] }), _jsx("span", { className: "text-sm text-sky-300", children: demoScoreLabel })] }), _jsx("div", { className: "px-3 py-1 bg-sky-500/20 border border-sky-500/30 rounded-full text-xs text-sky-300", children: "D\u00E9mo" })] }), _jsxs("div", { className: "flex items-baseline gap-2 mb-4", children: [_jsx("div", { className: "text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500", children: demoScore }), _jsx("span", { className: "text-2xl text-slate-400", children: "/1000" })] }), _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(Target, { className: "h-4 w-4 text-green-400" }), _jsxs("span", { className: "text-slate-300", children: ["Score potentiel :", " ", _jsx("span", { className: "font-semibold text-green-400", children: "812" })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-4", children: [_jsx("div", { className: "text-sm text-slate-400 mb-1", children: "Utilisation cr\u00E9dit" }), _jsx("div", { className: "text-2xl font-bold text-white", children: "32%" })] }), _jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-4", children: [_jsx("div", { className: "text-sm text-slate-400 mb-1", children: "Paiements \u00E0 temps" }), _jsx("div", { className: "text-2xl font-bold text-green-400", children: "98%" })] }), _jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-4", children: [_jsx("div", { className: "text-sm text-slate-400 mb-1", children: "Anciennet\u00E9 cr\u00E9dit" }), _jsx("div", { className: "text-2xl font-bold text-white", children: "4 ans" })] })] })] }), _jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6 mb-8", children: [_jsxs("h3", { className: "text-lg font-semibold mb-6 flex items-center gap-2 text-white", children: [_jsx(TrendingUp, { className: "h-5 w-5 text-sky-400" }), "\u00C9volution du Score", _jsx("span", { className: "ml-auto text-sm font-normal text-green-400", children: "+62 pts sur 6 mois" })] }), _jsx("div", { className: "w-full", children: _jsx(ScoreLineChart, { data: demoHistory }) }), _jsxs("div", { className: "mt-4 flex items-center justify-center gap-6 text-sm text-slate-400", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-gradient-to-r from-sky-400 to-blue-500" }), _jsx("span", { children: "Score mensuel" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-4 w-4 text-green-400" }), _jsx("span", { children: "Tendance haussi\u00E8re" })] })] })] }), _jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6 mb-8", children: [_jsxs("h3", { className: "text-lg font-semibold mb-6 flex items-center gap-2 text-white", children: [_jsx(Target, { className: "h-5 w-5 text-green-400" }), "Recommandations IA"] }), _jsx("div", { className: "space-y-4", children: demoRecommendations.map((rec) => (_jsxs("div", { className: "p-4 bg-slate-800/50 rounded-lg border-l-4 border-green-500 hover:bg-slate-800 transition", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx("h4", { className: "font-semibold text-white", children: rec.title }), _jsx("span", { className: "text-xs font-semibold text-green-400 px-2 py-1 bg-green-500/20 rounded", children: rec.impactLabel })] }), _jsx("p", { className: "text-sm text-slate-400", children: rec.description })] }, rec.id))) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6", children: [_jsxs("h3", { className: "text-lg font-semibold mb-4 flex items-center gap-2 text-white", children: [_jsx(Clock, { className: "h-5 w-5 text-blue-400" }), "Activit\u00E9 R\u00E9cente"] }), _jsx("div", { className: "space-y-3", children: [
                                            { label: "Score recalculé", detail: "Nouveau score: 742", time: "Il y a 2h" },
                                            { label: "Document analysé", detail: "Relevé bancaire Mai 2025", time: "Il y a 1j" },
                                            { label: "Recommandation suivie", detail: "Épargne augmentée", time: "Il y a 3j" },
                                        ].map((activity, i) => (_jsxs("div", { className: "flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-white", children: activity.label }), _jsx("p", { className: "text-xs text-slate-400", children: activity.detail })] }), _jsx("span", { className: "text-xs text-slate-500", children: activity.time })] }, i))) })] }), _jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6", children: [_jsxs("h3", { className: "text-lg font-semibold mb-4 flex items-center gap-2 text-white", children: [_jsx(FileText, { className: "h-5 w-5 text-purple-400" }), "Documents R\u00E9cents"] }), _jsx("div", { className: "space-y-3", children: [
                                            { name: "releve_bancaire_mai_2025.pdf", date: "15 mai 2025" },
                                            { name: "bulletin_salaire_avril.pdf", date: "30 avril 2025" },
                                            { name: "attestation_domicile.pdf", date: "12 avril 2025" },
                                        ].map((doc, i) => (_jsx("div", { className: "flex items-center justify-between p-3 bg-slate-800/50 rounded-lg", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(FileText, { className: "h-4 w-4 text-purple-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-white truncate max-w-xs", children: doc.name }), _jsx("p", { className: "text-xs text-slate-400", children: doc.date })] })] }) }, i))) })] })] }), _jsxs("div", { className: "mt-12 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-transparent p-8 text-center", children: [_jsx("h3", { className: "text-2xl font-bold text-white mb-2", children: "Pr\u00EAt \u00E0 d\u00E9couvrir votre vrai score ?" }), _jsx("p", { className: "text-slate-300 mb-6 max-w-2xl mx-auto", children: "Cr\u00E9ez votre compte gratuitement et obtenez votre score TERAS personnalis\u00E9, calcul\u00E9 \u00E0 partir de vos vraies donn\u00E9es financi\u00E8res." }), _jsxs("div", { className: "flex flex-wrap justify-center gap-4", children: [_jsxs("button", { onClick: () => navigate("/register"), className: "inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-6 py-3 font-semibold text-slate-900 transition", children: ["Cr\u00E9er mon compte gratuitement", _jsx(ArrowRight, { className: "h-4 w-4" })] }), _jsx("button", { onClick: () => navigate("/login"), className: "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-6 py-3 font-medium transition", children: "J'ai d\u00E9j\u00E0 un compte" })] })] })] })] }));
}
