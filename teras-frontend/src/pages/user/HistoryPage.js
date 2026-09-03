import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * HistoryPage ULTRA-SOPHISTIQUÉE - Version Pro avec IA
 * ✅ Séparation Scores Simulés vs Réels
 * ✅ Analyses IA détaillées par score
 * ✅ Graphiques avancés avec comparaison
 * ✅ Timeline interactive améliorée
 * ✅ Export PDF + Partage
 */
import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, BarChart3, Loader2, ChevronDown, ChevronUp, AlertCircle, Sparkles, Brain, FileText, Download, Eye, EyeOff, Zap, Target, Award, CheckCircle, Activity, LineChart } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authFetch } from "../../utils/authFetch";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Brush, } from 'recharts';
// ============================================
// COMPOSANTS VISUELS AVANCÉS
// ============================================
const AnimatedProgressBar = ({ letter, value, maxValue, color, label }) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    return (_jsxs("div", { className: "group hover:scale-[1.02] transition-transform", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`, children: _jsx("span", { className: "text-white font-bold text-sm", children: letter }) }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold text-white", children: label }), _jsxs("div", { className: "text-xs text-slate-400", children: [value, "/", maxValue] })] })] }), _jsxs("div", { className: "text-lg font-bold text-white", children: [percentage.toFixed(0), "%"] })] }), _jsx("div", { className: "h-3 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all duration-700 relative", style: {
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, ${color.split(' ')[1]}, ${color.split(' ')[2]})`
                    }, children: _jsx("div", { className: "absolute inset-0 bg-white/20 animate-pulse" }) }) })] }));
};
const AdvancedCircularGauge = ({ value, maxValue = 1000, size = 120, showDetails = true }) => {
    const radius = (size - 12) / 2;
    const circumference = radius * 2 * Math.PI;
    const percentage = Math.min((value / maxValue) * 100, 100);
    const offset = circumference - (percentage / 100) * circumference;
    const getScoreInfo = (s) => {
        if (s >= 900)
            return { color: "#10b981", label: "Diamant", glow: "#10b98140" };
        if (s >= 750)
            return { color: "#0ea5e9", label: "Or", glow: "#0ea5e940" };
        if (s >= 600)
            return { color: "#eab308", label: "Argent", glow: "#eab30840" };
        if (s >= 400)
            return { color: "#f97316", label: "Bronze", glow: "#f9731640" };
        return { color: "#ef4444", label: "Fer", glow: "#ef444440" };
    };
    const info = getScoreInfo(value);
    return (_jsxs("div", { className: "relative inline-flex items-center justify-center", children: [_jsxs("svg", { width: size, height: size, className: "transform -rotate-90", children: [_jsx("defs", { children: _jsxs("filter", { id: "glow", children: [_jsx("feGaussianBlur", { stdDeviation: "4", result: "coloredBlur" }), _jsxs("feMerge", { children: [_jsx("feMergeNode", { in: "coloredBlur" }), _jsx("feMergeNode", { in: "SourceGraphic" })] })] }) }), _jsx("circle", { cx: size / 2, cy: size / 2, r: radius, stroke: "rgba(255,255,255,0.05)", strokeWidth: "8", fill: "none" }), _jsx("circle", { cx: size / 2, cy: size / 2, r: radius, stroke: info.color, strokeWidth: "8", fill: "none", strokeLinecap: "round", strokeDasharray: circumference, strokeDashoffset: offset, className: "transition-all duration-1000", filter: "url(#glow)" })] }), _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [_jsx("span", { className: "text-3xl font-bold", style: { color: info.color }, children: value }), showDetails && (_jsx("span", { className: "text-xs font-semibold mt-1", style: { color: info.color }, children: info.label }))] })] }));
};
const TIME_RANGES = {
    '7d': { label: '7 jours', days: 7 },
    '30d': { label: '30 jours', days: 30 },
    '90d': { label: '3 mois', days: 90 },
    '1y': { label: '1 an', days: 365 },
    'all': { label: 'Tout', days: null },
};
const ProfessionalChart = ({ history, showSimulated }) => {
    const [timeRange, setTimeRange] = useState('all');
    const [chartType, setChartType] = useState('area');
    // Filtrer et préparer les données
    const chartData = useMemo(() => {
        const filtered = showSimulated ? history : history.filter((h) => !h.is_simulated);
        // Filtrer par période
        const now = new Date();
        const range = TIME_RANGES[timeRange];
        let data = filtered;
        if (range.days) {
            const cutoffDate = new Date(now.getTime() - range.days * 24 * 60 * 60 * 1000);
            data = filtered.filter((h) => new Date(h.created_at) >= cutoffDate);
        }
        return data
            .map((item) => ({
            date: new Date(item.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short'
            }),
            score: item.score,
            fullDate: item.created_at,
            isSimulated: item.is_simulated,
            timestamp: new Date(item.created_at).getTime(),
        }))
            .sort((a, b) => a.timestamp - b.timestamp);
    }, [history, timeRange, showSimulated]);
    // Statistiques
    const stats = useMemo(() => {
        if (chartData.length === 0)
            return null;
        const scores = chartData.map((d) => d.score);
        const current = scores[scores.length - 1];
        const first = scores[0];
        const min = Math.min(...scores);
        const max = Math.max(...scores);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const change = current - first;
        const changePercent = ((change / first) * 100).toFixed(1);
        return { current, first, min, max, avg, change, changePercent };
    }, [chartData]);
    // Export CSV
    const exportCSV = () => {
        const headers = ['Date', 'Score', 'Type'];
        const rows = chartData.map((d) => [
            d.fullDate,
            d.score,
            d.isSimulated ? 'Simulé' : 'Réel'
        ]);
        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(',')),
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `teras_scores_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };
    // Tooltip personnalisé
    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload[0])
            return null;
        const data = payload[0].payload;
        return (_jsxs("div", { className: "bg-slate-900/95 backdrop-blur-sm border border-sky-500/30 rounded-lg p-4 shadow-xl", children: [_jsx("p", { className: "text-sky-400 font-semibold mb-2 text-sm", children: data.date }), _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("span", { className: "text-white font-bold text-2xl", children: data.score }), _jsx("span", { className: "text-xs text-slate-400", children: "points" })] }), data.isSimulated && (_jsxs("div", { className: "flex items-center gap-2 mt-2 pt-2 border-t border-slate-700", children: [_jsx(Zap, { className: "w-3 h-3 text-purple-400" }), _jsx("span", { className: "text-purple-400 text-xs font-semibold", children: "Score Simul\u00E9" })] }))] }));
    };
    if (chartData.length === 0) {
        return (_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-12 text-center mb-8", children: [_jsx(LineChart, { className: "w-16 h-16 text-slate-600 mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "Aucune donn\u00E9e pour cette p\u00E9riode" })] }));
    }
    return (_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden mb-8", children: [_jsx("div", { className: "p-6 border-b border-slate-700", children: _jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-bold text-white mb-1 flex items-center gap-3", children: [_jsx(LineChart, { className: "w-6 h-6 text-sky-400" }), "Vue d'ensemble"] }), _jsxs("p", { className: "text-slate-400 text-sm", children: [chartData.length, " enregistrements"] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("div", { className: "flex items-center gap-1 bg-slate-800 rounded-lg p-1", children: Object.entries(TIME_RANGES).map(([key, { label }]) => (_jsx("button", { onClick: () => setTimeRange(key), className: `px-3 py-1.5 rounded-md text-sm font-medium transition-all ${timeRange === key
                                            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-700'}`, children: label }, key))) }), _jsxs("div", { className: "flex items-center gap-1 bg-slate-800 rounded-lg p-1", children: [_jsx("button", { onClick: () => setChartType('area'), className: `px-3 py-1.5 rounded-md text-sm font-medium transition-all ${chartType === 'area'
                                                ? 'bg-sky-500 text-white'
                                                : 'text-slate-400 hover:text-white'}`, children: "Aire" }), _jsx("button", { onClick: () => setChartType('line'), className: `px-3 py-1.5 rounded-md text-sm font-medium transition-all ${chartType === 'line'
                                                ? 'bg-sky-500 text-white'
                                                : 'text-slate-400 hover:text-white'}`, children: "Ligne" })] }), _jsxs("button", { onClick: exportCSV, className: "flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all border border-slate-700 hover:border-sky-500/50", children: [_jsx(Download, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm font-medium", children: "Export" })] })] })] }) }), stats && (_jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-5 gap-4 p-6 bg-slate-900/30 border-b border-slate-700", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-slate-400 text-xs mb-1", children: "Actuel" }), _jsx("div", { className: "text-2xl font-bold text-sky-400", children: stats.current })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-slate-400 text-xs mb-1", children: "Variation" }), _jsxs("div", { className: `text-2xl font-bold flex items-center justify-center gap-1 ${stats.change >= 0 ? 'text-green-400' : 'text-red-400'}`, children: [stats.change >= 0 ? (_jsx(TrendingUp, { className: "w-5 h-5" })) : (_jsx(TrendingDown, { className: "w-5 h-5" })), _jsxs("span", { children: [stats.change >= 0 ? '+' : '', stats.change] })] })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-slate-400 text-xs mb-1", children: "Moyenne" }), _jsx("div", { className: "text-2xl font-bold text-purple-400", children: stats.avg })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-slate-400 text-xs mb-1", children: "Maximum" }), _jsx("div", { className: "text-2xl font-bold text-emerald-400", children: stats.max })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-slate-400 text-xs mb-1", children: "Minimum" }), _jsx("div", { className: "text-2xl font-bold text-orange-400", children: stats.min })] })] })), _jsxs("div", { className: "p-6", children: [_jsx(ResponsiveContainer, { width: "100%", height: 400, children: chartType === 'area' ? (_jsxs(AreaChart, { data: chartData, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "colorScore", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#0ea5e9", stopOpacity: 0.8 }), _jsx("stop", { offset: "95%", stopColor: "#0ea5e9", stopOpacity: 0.1 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#334155", opacity: 0.3 }), _jsx(XAxis, { dataKey: "date", stroke: "#94a3b8", style: { fontSize: '12px' }, tickLine: false }), _jsx(YAxis, { stroke: "#94a3b8", domain: [0, 1000], style: { fontSize: '12px' }, tickLine: false }), _jsx(RechartsTooltip, { content: _jsx(CustomTooltip, {}) }), _jsx(ReferenceLine, { y: stats?.avg || 0, stroke: "#a78bfa", strokeDasharray: "5 5", label: { value: 'Moyenne', fill: '#a78bfa', fontSize: 12 } }), _jsx(Area, { type: "monotone", dataKey: "score", stroke: "#0ea5e9", strokeWidth: 3, fillOpacity: 1, fill: "url(#colorScore)" }), _jsx(Brush, { dataKey: "date", height: 30, stroke: "#0ea5e9", fill: "#1e293b" })] })) : (_jsxs(AreaChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#334155", opacity: 0.3 }), _jsx(XAxis, { dataKey: "date", stroke: "#94a3b8", style: { fontSize: '12px' }, tickLine: false }), _jsx(YAxis, { stroke: "#94a3b8", domain: [0, 1000], style: { fontSize: '12px' }, tickLine: false }), _jsx(RechartsTooltip, { content: _jsx(CustomTooltip, {}) }), _jsx(ReferenceLine, { y: stats?.avg || 0, stroke: "#a78bfa", strokeDasharray: "5 5" }), _jsx(Area, { type: "monotone", dataKey: "score", stroke: "#0ea5e9", strokeWidth: 3, fill: "none", dot: { fill: '#0ea5e9', r: 4 }, activeDot: { r: 6 } })] })) }), _jsxs("div", { className: "flex items-center justify-center gap-6 mt-6 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 bg-sky-500 rounded-full" }), _jsx("span", { className: "text-slate-400", children: "Score" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-px bg-purple-400", style: { width: '20px' } }), _jsx("span", { className: "text-slate-400", children: "Moyenne" })] }), showSimulated && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Zap, { className: "w-3 h-3 text-purple-400" }), _jsx("span", { className: "text-slate-400", children: "Simul\u00E9" })] }))] })] })] }));
};
// ============================================
// CARTE SCORE AVEC IA
// ============================================
const AdvancedScoreCard = ({ item, trend, isFirst, isExpanded, onToggle, aiAnalysis, onRequestAnalysis }) => {
    const pillarConfig = [
        { key: 'T', label: 'Transactions', max: 300, color: 'from-sky-500 to-blue-600' },
        { key: 'E', label: 'Épargne', max: 150, color: 'from-green-500 to-emerald-600' },
        { key: 'R', label: 'Revenus', max: 200, color: 'from-yellow-500 to-amber-600' },
        { key: 'A', label: 'Actifs', max: 150, color: 'from-orange-500 to-red-600' },
        { key: 'S', label: 'Social', max: 200, color: 'from-purple-500 to-pink-600' }
    ];
    const getSourceBadge = () => {
        if (item.is_simulated) {
            return (_jsxs("span", { className: "px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold flex items-center gap-1.5", children: [_jsx(Zap, { className: "w-3 h-3" }), "Simul\u00E9"] }));
        }
        switch (item.source) {
            case 'document_analysis':
                return (_jsxs("span", { className: "px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold flex items-center gap-1.5", children: [_jsx(FileText, { className: "w-3 h-3" }), "Documents"] }));
            case 'computed':
                return (_jsxs("span", { className: "px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold flex items-center gap-1.5", children: [_jsx(Activity, { className: "w-3 h-3" }), "Calcul\u00E9"] }));
            default:
                return (_jsxs("span", { className: "px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5", children: [_jsx(CheckCircle, { className: "w-3 h-3" }), "R\u00E9el"] }));
        }
    };
    return (_jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-sky-500/30 via-sky-500/10 to-transparent" }), _jsx("div", { className: `absolute left-6 top-8 w-5 h-5 rounded-full border-2 z-10 transition-all ${isFirst
                    ? "bg-gradient-to-br from-sky-400 to-blue-600 border-sky-300 shadow-lg shadow-sky-500/50"
                    : item.is_simulated
                        ? "bg-gradient-to-br from-purple-500 to-pink-600 border-purple-400"
                        : "bg-slate-800 border-slate-600"}`, children: isFirst && (_jsx("div", { className: "absolute inset-0 rounded-full bg-sky-400 animate-ping opacity-40" })) }), _jsxs("div", { className: `ml-16 bg-slate-900/70 backdrop-blur-sm border rounded-2xl overflow-hidden transition-all hover:border-sky-500/30 ${isFirst
                    ? "border-sky-500/50 shadow-lg shadow-sky-500/10"
                    : item.is_simulated
                        ? "border-purple-500/30"
                        : "border-white/10"}`, children: [_jsxs("button", { onClick: onToggle, className: "w-full p-6 flex items-center justify-between hover:bg-white/5 transition group", children: [_jsxs("div", { className: "flex items-center gap-6", children: [_jsx(AdvancedCircularGauge, { value: item.score, size: 100 }), _jsxs("div", { className: "text-left space-y-3", children: [_jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [getSourceBadge(), trend !== null && trend !== 0 && (_jsxs("div", { className: `flex items-center gap-1.5 px-3 py-1 rounded-full ${trend > 0
                                                            ? "bg-green-500/20 text-green-400"
                                                            : "bg-red-500/20 text-red-400"}`, children: [trend > 0 ? _jsx(TrendingUp, { className: "w-4 h-4" }) : _jsx(TrendingDown, { className: "w-4 h-4" }), _jsxs("span", { className: "text-sm font-bold", children: [trend > 0 ? "+" : "", trend] })] }))] }), _jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-400", children: [_jsx(Calendar, { className: "w-4 h-4" }), _jsx("span", { children: new Date(item.created_at).toLocaleDateString("fr-FR", {
                                                            day: "numeric",
                                                            month: "long",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        }) })] })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [!item.is_simulated && (_jsx("button", { onClick: (e) => {
                                            e.stopPropagation();
                                            onRequestAnalysis(item.id);
                                        }, className: "p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/30 transition group", title: "Analyse IA", children: _jsx(Sparkles, { className: "w-4 h-4 group-hover:animate-pulse" }) })), _jsx("div", { className: "text-slate-400 group-hover:text-white transition", children: isExpanded ? _jsx(ChevronUp, { className: "w-5 h-5" }) : _jsx(ChevronDown, { className: "w-5 h-5" }) })] })] }), isExpanded && (_jsxs("div", { className: "border-t border-white/10", children: [_jsxs("div", { className: "p-6 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold text-slate-300 mb-4", children: [_jsx(BarChart3, { className: "w-4 h-4 text-sky-400" }), "D\u00E9tail des piliers"] }), pillarConfig.map((pillar) => (_jsx(AnimatedProgressBar, { letter: pillar.key, value: item.breakdown[pillar.key], maxValue: pillar.max, color: pillar.color, label: pillar.label }, pillar.key)))] }), aiAnalysis && !item.is_simulated && (_jsxs("div", { className: "border-t border-white/10 bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("div", { className: "p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600", children: _jsx(Brain, { className: "w-4 h-4 text-white" }) }), _jsx("span", { className: "text-sm font-semibold text-white", children: "Analyse IA" }), aiAnalysis.loading && (_jsx(Loader2, { className: "w-4 h-4 animate-spin text-purple-400" }))] }), aiAnalysis.loading ? (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "h-4 bg-slate-800 rounded animate-pulse" }), _jsx("div", { className: "h-4 bg-slate-800 rounded animate-pulse w-3/4" })] })) : (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "prose prose-invert prose-sm max-w-none", children: _jsx("p", { className: "text-slate-300 leading-relaxed", children: aiAnalysis.analysis }) }), aiAnalysis.key_insights && aiAnalysis.key_insights.length > 0 && (_jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold text-slate-400 mb-2", children: "Points cl\u00E9s :" }), _jsx("ul", { className: "space-y-1", children: aiAnalysis.key_insights.map((insight, idx) => (_jsxs("li", { className: "flex items-start gap-2 text-sm text-slate-300", children: [_jsx(Target, { className: "w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" }), _jsx("span", { children: insight })] }, idx))) })] })), aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (_jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold text-slate-400 mb-2", children: "Recommandations :" }), _jsx("ul", { className: "space-y-1", children: aiAnalysis.recommendations.map((rec, idx) => (_jsxs("li", { className: "flex items-start gap-2 text-sm text-emerald-300", children: [_jsx(Award, { className: "w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" }), _jsx("span", { children: rec })] }, idx))) })] }))] }))] }))] }))] })] }));
};
// ============================================
// PAGE PRINCIPALE
// ============================================
const HistoryPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [showSimulated, setShowSimulated] = useState(true);
    const [aiAnalyses, setAiAnalyses] = useState({});
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }
        loadHistory();
    }, [isAuthenticated, navigate]);
    const loadHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await authFetch('/api/scoring/user/history/');
            if (!response.ok)
                throw new Error('Erreur de chargement');
            const data = await response.json();
            setHistory(data);
            if (data.length > 0)
                setExpandedId(data[0].id);
        }
        catch (err) {
            setError(err.message || "Erreur");
        }
        finally {
            setLoading(false);
        }
    };
    const requestAIAnalysis = async (scoreId) => {
        // Marquer comme en chargement
        setAiAnalyses(prev => ({
            ...prev,
            [scoreId]: { score_id: scoreId, analysis: '', key_insights: [], recommendations: [], trend_prediction: '', loading: true }
        }));
        try {
            const response = await authFetch(`/api/scoring/user/history/${scoreId}/analyze/`, {
                method: 'POST'
            });
            if (!response.ok)
                throw new Error('Erreur analyse IA');
            const data = await response.json();
            setAiAnalyses(prev => ({
                ...prev,
                [scoreId]: { ...data, loading: false }
            }));
        }
        catch (err) {
            console.error('Erreur analyse IA:', err);
            // Fallback analyse basique
            const score = history.find(h => h.id === scoreId);
            if (score) {
                setAiAnalyses(prev => ({
                    ...prev,
                    [scoreId]: {
                        score_id: scoreId,
                        analysis: `Votre score de ${score.score} reflète votre situation financière actuelle. Continuez vos efforts pour l'améliorer.`,
                        key_insights: ['Score en cours d\'analyse', 'Données en cours de traitement'],
                        recommendations: ['Maintenez vos bonnes pratiques', 'Consultez vos recommandations personnalisées'],
                        trend_prediction: 'Stable',
                        loading: false
                    }
                }));
            }
        }
    };
    const getTrend = (index) => {
        if (index >= history.length - 1)
            return null;
        return history[index].score - history[index + 1].score;
    };
    const filteredHistory = showSimulated
        ? history
        : history.filter(h => !h.is_simulated);
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0f1729] to-[#0b1220] text-white p-6 lg:p-8", children: [_jsxs("div", { className: "mb-8", children: [_jsxs(Link, { to: "/mon-espace", className: "inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-6 group", children: [_jsx(ArrowLeft, { className: "w-4 h-4 group-hover:-translate-x-1 transition-transform" }), "Retour"] }), _jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-4xl font-bold mb-3 flex items-center gap-3 text-white", children: [_jsx("div", { className: "p-3 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600", children: _jsx(BarChart3, { className: "w-8 h-8 text-white" }) }), "Historique des Scores"] }), _jsx("p", { className: "text-slate-400 text-lg", children: "\u00C9volution d\u00E9taill\u00E9e de votre score TERAS" })] }), _jsx("div", { className: "flex items-center gap-3", children: _jsxs("button", { onClick: () => setShowSimulated(!showSimulated), className: `flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${showSimulated
                                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                        : "bg-slate-800 text-slate-400 border border-white/10"}`, children: [showSimulated ? _jsx(Eye, { className: "w-4 h-4" }) : _jsx(EyeOff, { className: "w-4 h-4" }), showSimulated ? "Tout afficher" : "Scores réels uniquement"] }) })] })] }), loading && (_jsx("div", { className: "flex items-center justify-center py-32", children: _jsxs("div", { className: "text-center", children: [_jsx(Loader2, { className: "w-12 h-12 animate-spin text-sky-500 mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "Chargement de l'historique..." })] }) })), error && (_jsxs("div", { className: "text-center py-20 bg-slate-900/50 border border-red-500/30 rounded-2xl", children: [_jsx(AlertCircle, { className: "w-16 h-16 text-red-400 mx-auto mb-4" }), _jsx("h3", { className: "text-xl font-semibold mb-2 text-white", children: "Erreur de chargement" }), _jsx("p", { className: "text-red-400 mb-6", children: error }), _jsx("button", { onClick: loadHistory, className: "px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-semibold transition", children: "R\u00E9essayer" })] })), !loading && !error && history.length === 0 && (_jsxs("div", { className: "text-center py-32 bg-slate-900/50 border border-white/10 rounded-2xl", children: [_jsx("div", { className: "text-8xl mb-6", children: "\uD83D\uDCCA" }), _jsx("h3", { className: "text-2xl font-bold mb-3 text-white", children: "Aucun historique disponible" }), _jsx("p", { className: "text-slate-400 mb-8", children: "Vos scores appara\u00EEtront ici une fois calcul\u00E9s" }), _jsxs(Link, { to: "/calcul-score", className: "inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-sky-500/30 transition", children: [_jsx(Sparkles, { className: "w-5 h-5" }), "Calculer mon score"] })] })), !loading && !error && history.length > 0 && (_jsxs(_Fragment, { children: [_jsx(ProfessionalChart, { history: history, showSimulated: showSimulated }), showSimulated && history.some(h => h.is_simulated) && (_jsxs("div", { className: "mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-start gap-3", children: [_jsx(Sparkles, { className: "w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold text-purple-300 mb-1", children: "Scores simul\u00E9s inclus" }), _jsx("div", { className: "text-xs text-purple-400/80", children: "Les scores simul\u00E9s sont des projections bas\u00E9es sur vos ajustements manuels. Seuls les scores r\u00E9els sont pris en compte pour votre profil TERAS officiel." })] })] })), _jsx("div", { className: "space-y-6", children: filteredHistory.map((item, index) => (_jsx(AdvancedScoreCard, { item: item, trend: getTrend(history.indexOf(item)), isFirst: index === 0, isExpanded: expandedId === item.id, onToggle: () => setExpandedId(expandedId === item.id ? null : item.id), aiAnalysis: aiAnalyses[item.id], onRequestAnalysis: requestAIAnalysis }, item.id))) })] }))] }));
};
export default HistoryPage;
