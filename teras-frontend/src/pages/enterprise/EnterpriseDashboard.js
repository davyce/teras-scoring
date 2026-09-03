import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
/**
 * EnterpriseDashboard.tsx
 * Dashboard TERAS Entreprise — 100% connecté à l'API
 * Zéro mock — données réelles via enterpriseApi.getDashboard()
 */
import { TrendingUp, TrendingDown, Minus, Users, ShieldCheck, AlertCircle, CheckCircle, Clock, Target, Award, BarChart3, RefreshCw, Brain, Loader2, FileText, } from "lucide-react";
import enterpriseApi from "../../services/enterpriseApi";
function formatXaf(value) {
    const amount = Number(value || 0);
    if (!amount)
        return "0 FCFA";
    return `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;
}
function dossierQualityLabel(value) {
    const labels = {
        robuste: "Robuste",
        exploitable: "Exploitable",
        partiel: "Partiel",
        a_structurer: "A structurer",
    };
    return labels[value || ""] || "A structurer";
}
function documentRoleLabel(value) {
    const labels = {
        asset_register: "Registre d'actifs",
        asset_statement: "État des actifs",
        vehicle_title: "Carte grise",
        property_or_lease: "Titre / bail",
        invoice_evidence: "Facture",
        bank_statement: "Relevé bancaire",
        balance_sheet: "Bilan",
        tax_filing: "Fiscal",
        payroll: "Paie",
        contract: "Contrat",
        supporting: "Pièce métier",
    };
    return labels[value || ""] || String(value || "").replace(/_/g, " ");
}
// ─── ScoreGauge ───────────────────────────────────────────────────────────────
const ScoreGauge = ({ score, change }) => {
    const [animated, setAnimated] = useState(0);
    useEffect(() => { const t = setTimeout(() => setAnimated(score), 100); return () => clearTimeout(t); }, [score]);
    const pct = (animated / 1000) * 100;
    const circ = 2 * Math.PI * 80;
    const off = circ - (pct / 100) * circ;
    const color = score >= 800 ? { stroke: '#10b981', text: 'text-emerald-400', label: 'Excellent', bg: 'bg-emerald-500/20' } :
        score >= 650 ? { stroke: '#a855f7', text: 'text-purple-400', label: 'Bon', bg: 'bg-purple-500/20' } :
            score >= 500 ? { stroke: '#eab308', text: 'text-yellow-400', label: 'Moyen', bg: 'bg-yellow-500/20' } :
                score >= 350 ? { stroke: '#f97316', text: 'text-orange-400', label: 'Faible', bg: 'bg-orange-500/20' } :
                    { stroke: '#ef4444', text: 'text-red-400', label: 'À améliorer', bg: 'bg-red-500/20' };
    return (_jsxs("div", { className: "flex flex-col items-center", children: [_jsxs("div", { className: "relative", children: [_jsxs("svg", { width: "200", height: "200", className: "transform -rotate-90", children: [_jsx("circle", { cx: "100", cy: "100", r: "80", fill: "none", stroke: "rgba(255,255,255,0.1)", strokeWidth: "12" }), _jsx("circle", { cx: "100", cy: "100", r: "80", fill: "none", stroke: color.stroke, strokeWidth: "12", strokeLinecap: "round", strokeDasharray: circ, strokeDashoffset: off, className: "transition-all duration-1000 ease-out", style: { filter: `drop-shadow(0 0 10px ${color.stroke})` } })] }), _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [_jsx("span", { className: `text-5xl font-bold ${color.text}`, children: animated }), _jsx("span", { className: "text-slate-400 text-sm", children: "/1000" }), _jsx("span", { className: `text-xs font-medium mt-1 px-2 py-0.5 rounded-full ${color.bg} ${color.text}`, children: color.label })] })] }), change !== 0 && (_jsxs("div", { className: `flex items-center gap-1 mt-3 text-sm ${change > 0 ? 'text-emerald-400' : 'text-rose-400'}`, children: [change > 0 ? _jsx(TrendingUp, { className: "w-4 h-4" }) : _jsx(TrendingDown, { className: "w-4 h-4" }), _jsxs("span", { children: [change > 0 ? '+' : '', change, " pts ce mois"] })] }))] }));
};
// ─── PillarBar ────────────────────────────────────────────────────────────────
const PillarBar = ({ pillar }) => {
    const [w, setW] = useState(0);
    const pct = Math.min((pillar.value / pillar.maxValue) * 100, 100);
    useEffect(() => { const t = setTimeout(() => setW(pct), 200); return () => clearTimeout(t); }, [pct]);
    const cols = {
        purple: { bg: 'bg-purple-500', text: 'text-purple-400' },
        blue: { bg: 'bg-blue-500', text: 'text-blue-400' },
        green: { bg: 'bg-green-500', text: 'text-green-400' },
        amber: { bg: 'bg-amber-500', text: 'text-amber-400' },
        cyan: { bg: 'bg-cyan-500', text: 'text-cyan-400' },
    };
    const c = cols[pillar.color] || cols.purple;
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-8 h-8 rounded-lg ${c.bg}/20 flex items-center justify-center`, children: _jsx("span", { className: `font-bold ${c.text}`, children: pillar.letter }) }), _jsxs("div", { children: [_jsx("span", { className: "text-sm font-medium text-white", children: pillar.name }), _jsx("span", { className: "text-xs text-slate-500 block", children: pillar.fullName })] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: `text-lg font-bold ${c.text}`, children: Math.round(pillar.value) }), _jsxs("span", { className: "text-xs text-slate-500", children: ["/", pillar.maxValue] })] })] }), _jsx("div", { className: "h-2.5 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full ${c.bg} rounded-full transition-all duration-1000 ease-out`, style: { width: `${w}%` } }) }), _jsxs("div", { className: "flex justify-between mt-1", children: [_jsxs("span", { className: "text-xs text-slate-500", children: ["Pond\u00E9ration: ", pillar.weight] }), _jsxs("span", { className: "text-xs text-slate-500", children: [Math.round(pct), "%"] })] })] }));
};
// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, suffix, trend, trendLabel, color = 'purple', }) => {
    const iconCols = {
        purple: 'bg-purple-500/20 text-purple-400', blue: 'bg-blue-500/20 text-blue-400',
        green: 'bg-green-500/20 text-green-400', amber: 'bg-amber-500/20 text-amber-400',
        cyan: 'bg-cyan-500/20 text-cyan-400',
    };
    const trendCols = { up: 'text-emerald-400', down: 'text-rose-400', stable: 'text-slate-400' };
    const trendIcons = {
        up: _jsx(TrendingUp, { className: "w-3 h-3" }),
        down: _jsx(TrendingDown, { className: "w-3 h-3" }),
        stable: _jsx(Minus, { className: "w-3 h-3" }),
    };
    return (_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("div", { className: `w-10 h-10 rounded-lg ${iconCols[color] || iconCols.purple} flex items-center justify-center`, children: _jsx(Icon, { className: "w-5 h-5" }) }), trend && (_jsxs("div", { className: `flex items-center gap-1 text-xs ${trendCols[trend]}`, children: [trendIcons[trend], _jsx("span", { children: trendLabel })] }))] }), _jsxs("div", { className: "flex items-end gap-1", children: [_jsx("span", { className: "text-2xl font-bold text-white", children: value ?? '—' }), suffix && _jsx("span", { className: "text-slate-400 text-sm mb-1", children: suffix })] }), _jsx("p", { className: "text-sm text-slate-400 mt-1", children: label })] }));
};
// ─── DASHBOARD PRINCIPAL ──────────────────────────────────────────────────────
const EnterpriseDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await enterpriseApi.getDashboard();
            setData(res);
        }
        catch (e) {
            setError(e.message || 'Impossible de charger le tableau de bord.');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);
    // ── Piliers depuis l'API ──────────────────────────────────────────────────
    const pillars = [
        { letter: 'T', name: 'Transparence', fullName: 'Transparence fiscale',
            value: (data?.breakdown?.T ?? 0) * 250, maxValue: 250, weight: '30%', color: 'purple' },
        { letter: 'E', name: 'Emploi', fullName: 'Emploi local',
            value: (data?.breakdown?.E ?? 0) * 150, maxValue: 150, weight: '25%', color: 'blue' },
        { letter: 'R', name: 'Rétention', fullName: 'Fidélité clients',
            value: (data?.breakdown?.R ?? 0) * 200, maxValue: 200, weight: '15%', color: 'green' },
        { letter: 'A', name: 'Activité', fullName: 'Activité économique',
            value: (data?.breakdown?.A ?? 0) * 250, maxValue: 250, weight: '20%', color: 'amber' },
        { letter: 'S', name: 'Stabilité', fullName: 'Stabilité sociale',
            value: (data?.breakdown?.S ?? 0) * 150, maxValue: 150, weight: '10%', color: 'cyan' },
    ];
    const score = data?.current_score ?? 0;
    const change = data?.score_change ?? 0;
    const employees = data?.total_employees ?? 0;
    const localEmp = data?.local_employees ?? 0;
    const compliance = data?.compliance_rate ?? 0;
    const recommendations = data?.recommendations ?? [];
    const alerts = data?.active_alerts ?? [];
    const docIntelligence = data?.document_intelligence;
    if (loading)
        return (_jsx("div", { className: "flex items-center justify-center h-96", children: _jsxs("div", { className: "text-center", children: [_jsx(Loader2, { className: "w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "Chargement du tableau de bord..." })] }) }));
    if (error)
        return (_jsx("div", { className: "flex items-center justify-center h-96", children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-rose-400 mx-auto" }), _jsx("p", { className: "text-white font-semibold", children: "Tableau de bord indisponible" }), _jsx("p", { className: "text-slate-400 text-sm", children: error }), _jsxs("button", { onClick: load, className: "flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-all mx-auto", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), " R\u00E9essayer"] })] }) }));
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1", children: "TERAS Entreprise" }), _jsx("h1", { className: "text-2xl font-bold text-white", children: "Tableau de bord" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Aper\u00E7u de votre performance TERAS" })] }), _jsxs("button", { onClick: load, className: "flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white hover:bg-slate-700 transition", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), " Actualiser"] })] }), alerts.length > 0 && (_jsx("div", { className: "space-y-2", children: alerts.map((alert, i) => (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-800/40 rounded-xl text-amber-300 text-sm", children: [_jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }), typeof alert === 'string' ? alert : alert?.message || alert?.title || JSON.stringify(alert)] }, i))) })), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsx(StatCard, { icon: Users, label: "Employ\u00E9s", value: employees, suffix: "", trend: employees > 0 ? 'up' : undefined, trendLabel: `${localEmp} locaux`, color: "blue" }), _jsx(StatCard, { icon: BarChart3, label: "Clients actifs", value: data?.active_clients ?? 0, suffix: "", color: "green" }), _jsx(StatCard, { icon: ShieldCheck, label: "Conformit\u00E9", value: Math.round(Number(compliance)), suffix: "%", trend: Number(compliance) >= 80 ? 'up' : Number(compliance) >= 60 ? 'stable' : 'down', color: "amber" }), _jsx(StatCard, { icon: Award, label: "Score TERAS", value: score, suffix: "pts", color: "purple" })] }), _jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between gap-4 mb-5", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-semibold text-white flex items-center gap-2", children: [_jsx(FileText, { className: "w-5 h-5 text-cyan-400" }), " Intelligence documentaire"] }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Les documents n\u2019alimentent TERAS que lorsqu\u2019ils ont ete analyses puis appliques." })] }), _jsx("span", { className: "px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-semibold", children: dossierQualityLabel(docIntelligence?.dossier_quality) })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-5", children: [_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: "Documents" }), _jsx("p", { className: "text-2xl font-bold text-white", children: docIntelligence?.documents_total ?? 0 }), _jsxs("p", { className: "text-slate-400 text-xs mt-1", children: [docIntelligence?.categories?.length ?? 0, " categories couvertes"] })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: "Analyses / appliques" }), _jsxs("p", { className: "text-2xl font-bold text-emerald-400", children: [docIntelligence?.documents_analyzed ?? 0, " / ", docIntelligence?.documents_applied ?? 0] }), _jsx("p", { className: "text-slate-400 text-xs mt-1", children: "Pipeline IA a la demande" })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: "Completeness" }), _jsxs("p", { className: "text-2xl font-bold text-white", children: [Math.round(Number(docIntelligence?.completeness_ratio || 0) * 100), "%"] }), _jsx("p", { className: "text-slate-400 text-xs mt-1", children: "Maturite du dossier" })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: "Cashflow moyen doc" }), _jsx("p", { className: `text-2xl font-bold ${Number(docIntelligence?.avg_monthly_cashflow_xaf || 0) >= 0 ? 'text-cyan-400' : 'text-rose-400'}`, children: formatXaf(docIntelligence?.avg_monthly_cashflow_xaf) }), _jsxs("p", { className: "text-slate-400 text-xs mt-1", children: ["Dernier traitement ", docIntelligence?.latest_processed_at ? new Date(docIntelligence.latest_processed_at).toLocaleDateString('fr-FR') : '—'] })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: "Actifs document\u00E9s" }), _jsx("p", { className: "text-2xl font-bold text-amber-300", children: docIntelligence?.assets_verified_count ?? 0 }), _jsxs("p", { className: "text-slate-400 text-xs mt-1", children: [formatXaf(docIntelligence?.assets_documented_total_xaf), " estim\u00E9s"] })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: "Factures analys\u00E9es" }), _jsx("p", { className: "text-2xl font-bold text-blue-300", children: docIntelligence?.invoices_analyzed_count ?? 0 }), _jsxs("p", { className: "text-slate-400 text-xs mt-1", children: [formatXaf(docIntelligence?.invoice_amount_total_xaf), " objectiv\u00E9s"] })] })] }), _jsxs("div", { className: "grid lg:grid-cols-3 gap-4", children: [_jsxs("div", { className: "rounded-xl bg-slate-800/40 p-4 border border-slate-700/60", children: [_jsx("p", { className: "text-slate-400 text-xs mb-2", children: "Revenue mensuel objectiv\u00E9" }), _jsx("p", { className: "text-white font-semibold", children: formatXaf(docIntelligence?.avg_monthly_revenue_xaf) }), _jsxs("p", { className: "text-slate-500 text-xs mt-2", children: ["Authenticite moyenne : ", Math.round(Number(docIntelligence?.avg_authenticity || 0) * 100), "%"] })] }), _jsxs("div", { className: "rounded-xl bg-slate-800/40 p-4 border border-slate-700/60", children: [_jsx("p", { className: "text-slate-400 text-xs mb-2", children: "Categories detectees" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [(docIntelligence?.categories || []).slice(0, 6).map((category) => (_jsx("span", { className: "px-2 py-1 rounded-full bg-slate-700 text-slate-200 text-xs", children: documentRoleLabel(category) }, category))), (!docIntelligence?.categories || docIntelligence.categories.length === 0) && (_jsx("span", { className: "text-slate-500 text-sm", children: "Aucune categorie appliquee pour le moment." }))] })] }), _jsxs("div", { className: "rounded-xl bg-slate-800/40 p-4 border border-slate-700/60", children: [_jsx("p", { className: "text-slate-400 text-xs mb-2", children: "Derniere lecture utile" }), docIntelligence?.latest_summary?.recommended_actions?.length ? (_jsx("p", { className: "text-slate-200 text-sm", children: docIntelligence.latest_summary.recommended_actions[0] })) : (_jsx("p", { className: "text-slate-500 text-sm", children: "Analyse appliquee non encore disponible." }))] })] }), _jsxs("div", { className: "grid lg:grid-cols-3 gap-4 mt-4", children: [_jsxs("div", { className: "rounded-xl bg-slate-800/40 p-4 border border-slate-700/60", children: [_jsx("p", { className: "text-slate-400 text-xs mb-2", children: "Valeur d'actifs document\u00E9e" }), _jsx("p", { className: "text-white font-semibold", children: formatXaf(docIntelligence?.assets_documented_total_xaf) }), _jsx("p", { className: "text-slate-500 text-xs mt-2", children: "Inclut biens d\u00E9clar\u00E9s, titres et registres d'actifs reconnus." })] }), _jsxs("div", { className: "rounded-xl bg-slate-800/40 p-4 border border-slate-700/60", children: [_jsx("p", { className: "text-slate-400 text-xs mb-2", children: "Facturation objectiv\u00E9e" }), _jsx("p", { className: "text-white font-semibold", children: formatXaf(docIntelligence?.invoice_amount_total_xaf) }), _jsxs("p", { className: "text-slate-500 text-xs mt-2", children: [docIntelligence?.invoices_analyzed_count ?? 0, " facture(s) exploit\u00E9es dans le moteur."] })] }), _jsxs("div", { className: "rounded-xl bg-slate-800/40 p-4 border border-slate-700/60", children: [_jsx("p", { className: "text-slate-400 text-xs mb-2", children: "Force de collat\u00E9ral" }), _jsx("p", { className: "text-white font-semibold", children: docIntelligence?.collateral_strength === 'high'
                                            ? 'Forte'
                                            : docIntelligence?.collateral_strength === 'medium'
                                                ? 'Moyenne'
                                                : 'Faible' }), _jsxs("p", { className: "text-slate-500 text-xs mt-2", children: [formatXaf(docIntelligence?.collateral_value_xaf), " mobilisables estim\u00E9s."] })] })] }), (docIntelligence?.asset_proof_types || []).length > 0 && (_jsxs("div", { className: "mt-4 rounded-xl bg-slate-800/40 p-4 border border-slate-700/60", children: [_jsx("p", { className: "text-slate-400 text-xs mb-2", children: "Types de preuves d'actifs d\u00E9tect\u00E9s" }), _jsx("div", { className: "flex flex-wrap gap-2", children: (docIntelligence?.asset_proof_types || []).map((proofType) => (_jsx("span", { className: "px-2 py-1 rounded-full bg-amber-500/10 text-amber-200 text-xs border border-amber-500/20", children: proofType }, proofType))) })] }))] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("h2", { className: "text-lg font-semibold text-white flex items-center gap-2", children: [_jsx(Award, { className: "w-5 h-5 text-purple-400" }), " Score TERAS Entreprise"] }), _jsx("span", { className: "text-xs text-slate-500", children: data?.score_trend === 'up' ? '↑ Progression' : data?.score_trend === 'down' ? '↓ Baisse' : '→ Stable' })] }), _jsx(ScoreGauge, { score: score, change: change }), _jsx("div", { className: "mt-6 p-3 bg-slate-800/60 rounded-xl", children: _jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-300", children: [_jsx(Target, { className: "w-4 h-4 text-cyan-400" }), "Secteur moyen :", ' ', _jsxs("strong", { className: "text-white", children: [data?.sector_comparison?.sector_average ?? data?.sector_comparison?.your_score ?? '—', " pts"] }), _jsxs("span", { className: "text-slate-500 text-xs ml-auto", children: ["Percentile ", data?.sector_comparison?.percentile ?? '—'] })] }) })] }), _jsxs("div", { className: "lg:col-span-2 bg-slate-900/50 border border-white/10 rounded-2xl p-6", children: [_jsxs("h2", { className: "text-lg font-semibold text-white flex items-center gap-2 mb-6", children: [_jsx(Brain, { className: "w-5 h-5 text-purple-400" }), " D\u00E9tail des Piliers TERAS"] }), score === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-slate-500", children: [_jsx(BarChart3, { className: "w-10 h-10 mb-3 opacity-40" }), _jsx("p", { className: "text-sm", children: "Score non encore calcul\u00E9." }), _jsx("p", { className: "text-xs mt-1", children: "Compl\u00E9tez votre profil et ajoutez des documents pour lancer l'analyse." })] })) : (_jsx("div", { className: "space-y-5", children: pillars.map(p => _jsx(PillarBar, { pillar: p }, p.letter)) })), _jsx("p", { className: "mt-4 text-xs text-slate-600 text-center", children: "Formule TERAS Entreprise = 0.30T + 0.25E + 0.15R + 0.20A + 0.10S" })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6", children: [_jsxs("h2", { className: "text-lg font-semibold text-white flex items-center gap-2 mb-4", children: [_jsx(Brain, { className: "w-5 h-5 text-purple-400" }), " Recommandations"] }), recommendations.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-10 text-slate-500", children: [_jsx(CheckCircle, { className: "w-8 h-8 mb-2 text-emerald-500/40" }), _jsx("p", { className: "text-sm", children: "Aucune recommandation pour le moment." })] })) : (_jsx("div", { className: "space-y-3", children: recommendations.map((rec, i) => {
                                    const title = rec?.title || rec?.action || (typeof rec === 'string' ? rec : '');
                                    const detail = rec?.description || '';
                                    const pillar = rec?.pillar || '';
                                    const impact = rec?.impact || '';
                                    return (_jsxs("div", { className: "p-4 bg-slate-800/50 rounded-xl border-l-4 border-purple-500", children: [title && _jsx("p", { className: "text-sm font-semibold text-white mb-1", children: title }), detail && _jsx("p", { className: "text-xs text-slate-400", children: detail }), (pillar || impact) && (_jsxs("div", { className: "flex gap-3 mt-2", children: [pillar && _jsxs("span", { className: "text-xs text-purple-400", children: ["Pilier: ", pillar] }), impact && _jsx("span", { className: `text-xs font-medium px-2 py-0.5 rounded-full ${impact === 'high' ? 'bg-rose-500/20 text-rose-400' :
                                                            impact === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                                                'bg-blue-500/20 text-blue-400'}`, children: impact })] }))] }, i));
                                }) }))] }), _jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6", children: [_jsxs("h2", { className: "text-lg font-semibold text-white flex items-center gap-2 mb-4", children: [_jsx(TrendingUp, { className: "w-5 h-5 text-cyan-400" }), " Historique des scores"] }), !data?.score_history || data.score_history.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-10 text-slate-500", children: [_jsx(Clock, { className: "w-8 h-8 mb-2 opacity-40" }), _jsx("p", { className: "text-sm", children: "Aucun historique disponible." })] })) : (_jsx("div", { className: "space-y-2 max-h-64 overflow-y-auto", children: data.score_history.slice(-8).reverse().map((entry) => (_jsxs("div", { className: "flex items-center justify-between px-3 py-2 bg-slate-800/40 rounded-lg", children: [_jsx("span", { className: "text-xs text-slate-400", children: entry.score_label }), _jsxs("span", { className: "text-sm font-bold text-cyan-400", children: [entry.score, " pts"] })] }, entry.id))) }))] })] }), (data?.total_clients !== undefined || data?.total_employees !== undefined) && (_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-4", children: [_jsx("p", { className: "text-xs text-slate-500 mb-1", children: "Total clients" }), _jsx("p", { className: "text-2xl font-bold text-white", children: data?.total_clients ?? '—' })] }), _jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-4", children: [_jsx("p", { className: "text-xs text-slate-500 mb-1", children: "Clients actifs" }), _jsx("p", { className: "text-2xl font-bold text-emerald-400", children: data?.active_clients ?? '—' })] }), _jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-4", children: [_jsx("p", { className: "text-xs text-slate-500 mb-1", children: "Employ\u00E9s totaux" }), _jsx("p", { className: "text-2xl font-bold text-white", children: data?.total_employees ?? '—' })] }), _jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-4", children: [_jsx("p", { className: "text-xs text-slate-500 mb-1", children: "Emploi local" }), _jsx("p", { className: "text-2xl font-bold text-cyan-400", children: data?.local_employees ?? '—' })] })] }))] }));
};
export default EnterpriseDashboard;
