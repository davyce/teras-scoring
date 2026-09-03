import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * MonEspace - VERSION FINALE SOPHISTIQUÉE
 * ✅ Volume COMPLET (pas abrégé)
 * ✅ Recommandations IA INTERACTIVES avec modal détaillé
 * ✅ Animation jauge PREMIUM avec gradient animé
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, FileText, Calculator, History, MessageSquare, X, Sparkles, ChevronRight, Zap, Loader2, Download, CheckCircle, Clock, ArrowRight, Target, Lightbulb, TrendingDown, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authFetch } from '../../utils/authFetch';
// ============================================
// COMPOSANT: Jauge Circulaire PREMIUM ⭐
// ============================================
const CircularGauge = ({ value, maxValue = 1000 }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const percentage = (value / maxValue) * 100;
    const radius = 90;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;
    const getColor = (s) => {
        if (s >= 900)
            return ['#10b981', '#059669']; // Vert
        if (s >= 750)
            return ['#0ea5e9', '#0284c7']; // Bleu
        if (s >= 600)
            return ['#eab308', '#ca8a04']; // Jaune
        if (s >= 400)
            return ['#f97316', '#ea580c']; // Orange
        return ['#ef4444', '#dc2626']; // Rouge
    };
    const [color1, color2] = getColor(value);
    // Animation compteur
    useEffect(() => {
        let start = 0;
        const duration = 2000;
        const increment = value / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            }
            else {
                setDisplayValue(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [value]);
    return (_jsxs("div", { className: "relative inline-flex items-center justify-center", children: [_jsxs("svg", { width: "200", height: "200", className: "transform -rotate-90", children: [_jsx("circle", { cx: "100", cy: "100", r: radius, stroke: "rgba(255,255,255,0.05)", strokeWidth: "16", fill: "none" }), _jsx("defs", { children: _jsxs("linearGradient", { id: `gradient-${value}`, x1: "0%", y1: "0%", x2: "100%", y2: "100%", children: [_jsx("stop", { offset: "0%", style: { stopColor: color1, stopOpacity: 1 } }), _jsx("stop", { offset: "100%", style: { stopColor: color2, stopOpacity: 1 } })] }) }), _jsx("circle", { cx: "100", cy: "100", r: radius, stroke: `url(#gradient-${value})`, strokeWidth: "16", fill: "none", strokeLinecap: "round", strokeDasharray: circumference, strokeDashoffset: offset, className: "transition-all duration-2000 ease-out", style: {
                            filter: `drop-shadow(0 0 20px ${color1}80)`,
                            animation: 'pulse 2s infinite'
                        } })] }), _jsxs("div", { className: "absolute text-center", children: [_jsx("div", { className: "text-5xl font-bold mb-1 transition-all duration-300", style: { color: color1 }, children: displayValue }), _jsxs("div", { className: "text-slate-500 text-sm", children: ["/ ", maxValue] })] }), _jsx("style", { children: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      ` })] }));
};
// ============================================
// COMPOSANT: Stat Card avec VOLUME COMPLET ⭐
// ============================================
const StatCard = ({ icon: Icon, label, value, subtitle, color, isVolume }) => {
    // Formater le volume sans abréviation
    const formatVolume = (val) => {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    };
    const displayValue = isVolume ? formatVolume(value) : value;
    return (_jsxs("div", { className: "bg-slate-900/50 border border-white/5 rounded-xl p-4 hover:border-white/10 transition", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(Icon, { className: "w-5 h-5", style: { color } }), _jsx("span", { className: "text-slate-400 text-sm", children: label })] }), _jsx("div", { className: "text-2xl font-bold text-white mb-1", children: displayValue }), _jsx("div", { className: "text-xs text-slate-500", children: subtitle })] }));
};
// ============================================
// COMPOSANT: Pillar Bar
// ============================================
const PillarBar = ({ letter, label, value, max, color }) => {
    const percentage = (value / max) * 100;
    return (_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0", style: { backgroundColor: color }, children: letter }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "text-sm text-slate-300", children: label }), _jsxs("span", { className: "text-sm font-semibold text-white", children: [value, "/", max] })] }), _jsx("div", { className: "h-1.5 bg-slate-700/50 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all duration-1000 ease-out", style: { width: `${percentage}%`, backgroundColor: color } }) })] })] }));
};
// ============================================
// COMPOSANT: Recommendation Card INTERACTIVE ⭐
// ============================================
const RecommendationCard = ({ rec, onViewDetail }) => {
    const [isHovered, setIsHovered] = useState(false);
    const priorityConfig = {
        high: { icon: '🔥', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'Urgent' },
        medium: { icon: '⚡', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', badge: 'Important' },
        low: { icon: '💡', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'À considérer' }
    };
    const config = priorityConfig[rec.priority];
    return (_jsxs("div", { className: `${config.bg} border ${config.border} rounded-xl p-4 transition-all duration-300 cursor-pointer group ${isHovered ? 'scale-105 shadow-xl' : ''}`, onClick: () => onViewDetail(rec), onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false), children: [_jsxs("div", { className: "flex items-start justify-between gap-3 mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: config.icon }), _jsx("span", { className: `text-xs font-semibold ${config.text}`, children: config.badge }), _jsx("span", { className: "text-xs px-2 py-0.5 bg-white/5 rounded-full text-slate-400", children: rec.category })] }), _jsx("span", { className: "text-sm font-bold text-green-400", children: rec.impact })] }), _jsx("h4", { className: "text-white font-semibold text-sm mb-1 group-hover:text-sky-400 transition", children: rec.title }), _jsx("p", { className: "text-slate-400 text-xs mb-3 line-clamp-2", children: rec.description }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("button", { className: "text-xs text-purple-400 font-medium flex items-center gap-1 hover:gap-2 transition-all", children: [_jsx(Sparkles, { className: "w-3 h-3" }), "Voir le plan IA complet"] }), _jsx(ArrowRight, { className: `w-4 h-4 text-slate-600 group-hover:text-sky-400 transition-all ${isHovered ? 'translate-x-1' : ''}` })] })] }));
};
// ============================================
// COMPOSANT: Modal Recommandation Détaillée ⭐⭐⭐
// ============================================
const DetailedRecommendationModal = ({ isOpen, onClose, recommendation }) => {
    const [loading, setLoading] = useState(false);
    const [detail, setDetail] = useState(null);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [downloadError, setDownloadError] = useState('');
    const [downloadSuccess, setDownloadSuccess] = useState('');
    useEffect(() => {
        if (isOpen && recommendation) {
            loadDetail();
        }
    }, [isOpen, recommendation]);
    const loadDetail = async () => {
        if (!recommendation)
            return;
        setLoading(true);
        setDownloadError('');
        setDownloadSuccess('');
        try {
            const response = await authFetch('/api/scoring/user/recommendations/generate-detail/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recommendation_id: recommendation.id,
                    category: recommendation.category
                })
            });
            if (response.ok) {
                const data = await response.json();
                setDetail(data);
            }
        }
        catch (err) {
            console.error('Erreur chargement détail:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const filenameFromDisposition = (disposition) => {
        const match = disposition?.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
        const rawName = match?.[1] || match?.[2];
        return rawName ? decodeURIComponent(rawName) : '';
    };
    const downloadPDF = async () => {
        if (!detail)
            return;
        setDownloadingPDF(true);
        setDownloadError('');
        setDownloadSuccess('');
        try {
            const response = await authFetch('/api/scoring/user/recommendations/export-pdf/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    detail_data: detail
                })
            });
            if (!response.ok) {
                const contentType = response.headers.get('Content-Type') || '';
                let message = `Erreur ${response.status} pendant la génération du PDF.`;
                if (contentType.includes('application/json')) {
                    const data = await response.json().catch(() => ({}));
                    message = data.error || data.detail || message;
                }
                else {
                    const text = await response.text().catch(() => '');
                    if (text)
                        message = text.slice(0, 220);
                }
                throw new Error(message);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            const filename = filenameFromDisposition(response.headers.get('Content-Disposition'))
                || `TERAS_Plan_IA_${detail.category || 'personnalise'}_${date}.pdf`;
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setDownloadSuccess('Plan PDF téléchargé.');
        }
        catch (err) {
            console.error('Erreur téléchargement PDF:', err);
            setDownloadError(err instanceof Error ? err.message : 'Impossible de télécharger le PDF.');
        }
        finally {
            setDownloadingPDF(false);
        }
    };
    if (!isOpen || !recommendation)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200", children: _jsxs("div", { className: "bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl", children: [_jsx("div", { className: "sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl z-10", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-bold text-white flex items-center gap-3 mb-2", children: [_jsx(Sparkles, { className: "w-7 h-7 text-yellow-300 animate-pulse" }), "Plan IA Personnalis\u00E9"] }), _jsx("p", { className: "text-purple-100 text-sm", children: recommendation.title })] }), _jsxs("div", { className: "flex items-center gap-2", children: [detail && (_jsxs("button", { onClick: downloadPDF, disabled: downloadingPDF, title: "T\u00E9l\u00E9charger le plan en PDF", className: "px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-50 flex items-center gap-2 text-white text-sm font-semibold", children: [downloadingPDF ? (_jsx(Loader2, { className: "w-5 h-5 text-white animate-spin" })) : (_jsx(Download, { className: "w-5 h-5 text-white" })), _jsx("span", { className: "hidden sm:inline", children: "PDF" })] })), _jsx("button", { onClick: onClose, className: "p-2 rounded-lg bg-white/10 hover:bg-white/20 transition", children: _jsx(X, { className: "w-6 h-6 text-white" }) })] })] }) }), _jsxs("div", { className: "p-6 space-y-6", children: [downloadError && (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm", children: [_jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }), _jsx("span", { children: downloadError })] })), downloadSuccess && (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm", children: [_jsx(CheckCircle, { className: "w-4 h-4 shrink-0" }), _jsx("span", { children: downloadSuccess })] })), loading ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Loader2, { className: "w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "G\u00E9n\u00E9ration du plan par l'IA..." })] })) : detail ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-slate-800/50 border border-blue-500/30 rounded-xl p-5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-blue-400" }), _jsx("h3", { className: "text-lg font-bold text-white", children: "Diagnostic" })] }), _jsx("p", { className: "text-slate-300 leading-relaxed", children: detail.diagnostic })] }), _jsxs("div", { className: "bg-slate-800/50 border border-green-500/30 rounded-xl p-5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Target, { className: "w-5 h-5 text-green-400" }), _jsx("h3", { className: "text-lg font-bold text-white", children: "Objectif" })] }), _jsx("p", { className: "text-slate-300 text-lg font-medium", children: detail.objectif })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-purple-400" }), _jsx("h3", { className: "text-lg font-bold text-white", children: "Plan d'Action" })] }), _jsx("div", { className: "space-y-3", children: detail.plan_action.map((step, idx) => (_jsx("div", { className: "bg-slate-800/50 border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition group", children: _jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-purple-500 text-white font-bold flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition", children: step.etape }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "text-white font-semibold mb-1", children: step.titre }), _jsx("p", { className: "text-slate-400 text-sm", children: step.description })] })] }) }, idx))) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(TrendingUp, { className: "w-5 h-5 text-green-400" }), _jsx("span", { className: "text-sm text-slate-400", children: "Impact Estim\u00E9" })] }), _jsx("p", { className: "text-2xl font-bold text-green-400", children: detail.impact_points })] }), _jsxs("div", { className: "bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Clock, { className: "w-5 h-5 text-orange-400" }), _jsx("span", { className: "text-sm text-slate-400", children: "D\u00E9lai" })] }), _jsx("p", { className: "text-2xl font-bold text-orange-400", children: detail.delai })] })] }), _jsxs("div", { className: "bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Lightbulb, { className: "w-5 h-5 text-yellow-400" }), _jsx("h3", { className: "text-lg font-bold text-white", children: "Conseils Bonus" })] }), _jsx("ul", { className: "space-y-2", children: detail.conseils_bonus.map((conseil, idx) => (_jsxs("li", { className: "flex items-start gap-3 text-slate-300", children: [_jsx("span", { className: "text-yellow-400 mt-1", children: "\uD83D\uDCA1" }), _jsx("span", { children: conseil })] }, idx))) })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("button", { onClick: onClose, className: "flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-xl transition flex items-center justify-center gap-2", children: [_jsx(CheckCircle, { className: "w-5 h-5" }), "Commencer ce plan"] }), _jsx("button", { onClick: onClose, className: "px-6 py-3 bg-slate-800 border border-white/10 text-white rounded-xl font-semibold hover:bg-slate-700 transition", children: "Plus tard" })] })] })) : (_jsxs("div", { className: "text-center py-12", children: [_jsx(TrendingDown, { className: "w-16 h-16 text-slate-600 mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "Impossible de charger le d\u00E9tail" })] }))] })] }) }));
};
// ============================================
// COMPOSANT: Quick Action
// ============================================
const QuickAction = ({ icon: Icon, title, onClick, gradient }) => (_jsxs("button", { onClick: onClick, className: "relative overflow-hidden bg-slate-900/50 border border-white/5 rounded-xl p-4 hover:border-white/20 transition group text-left", children: [_jsx("div", { className: `absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition` }), _jsxs("div", { className: "relative z-10 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Icon, { className: "w-5 h-5 text-sky-400 group-hover:scale-110 transition" }), _jsx("span", { className: "text-white font-medium text-sm", children: title })] }), _jsx(ChevronRight, { className: "w-4 h-4 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-1 transition" })] })] }));
// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function MonEspace() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dashboard, setDashboard] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedRecommendation, setSelectedRecommendation] = useState(null);
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadData();
    }, [isAuthenticated, navigate]);
    const loadData = async () => {
        try {
            const response = await authFetch('/api/scoring/user/dashboard/');
            if (!response.ok)
                throw new Error('Erreur');
            const data = await response.json();
            setDashboard(data);
            const recResponse = await authFetch('/api/scoring/user/recommendations/');
            if (recResponse.ok) {
                const recData = await recResponse.json();
                setRecommendations(recData.slice(0, 3));
            }
        }
        catch (err) {
            console.error('Erreur:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleViewDetail = (rec) => {
        setSelectedRecommendation(rec);
        setShowDetailModal(true);
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-[#0b1220] flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(Loader2, { className: "w-12 h-12 text-sky-500 animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "Chargement..." })] }) }));
    }
    const score = dashboard?.score?.score || 0;
    const level = dashboard?.score?.level || 'Débutant';
    const breakdown = dashboard?.score?.breakdown || { T: 0, E: 0, R: 0, A: 0, S: 0 };
    const stats = dashboard?.stats_30j || { transactions_count: 0, total_volume: 0, documents_uploaded: 0, recommendations_completed: 0 };
    const pillars = [
        { letter: 'T', label: 'Transactions', value: breakdown.T, max: 100, color: '#0ea5e9' },
        { letter: 'E', label: 'Épargne', value: breakdown.E, max: 100, color: '#22c55e' },
        { letter: 'R', label: 'Revenus', value: breakdown.R, max: 100, color: '#eab308' },
        { letter: 'A', label: 'Actifs', value: breakdown.A, max: 100, color: '#f97316' },
        { letter: 'S', label: 'Social', value: breakdown.S, max: 100, color: '#a855f7' }
    ];
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "min-h-screen bg-[#0b1220] text-white p-6", children: [_jsx("div", { className: "max-w-7xl mx-auto mb-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold mb-1", children: ["Bonjour, ", user?.first_name || 'Jean', " \uD83D\uDC4B"] }), _jsxs("p", { className: "text-slate-400", children: ["Score ", _jsx("span", { className: "text-yellow-400 font-semibold", children: level })] })] }), _jsxs("button", { onClick: loadData, className: "px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg hover:border-white/20 transition text-sm flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-4 h-4" }), "Actualiser"] })] }) }), _jsxs("div", { className: "max-w-7xl mx-auto space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-4", children: [_jsxs("div", { className: "lg:col-span-2 bg-slate-900/50 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center", children: [_jsx(CircularGauge, { value: score }), _jsx("div", { className: "mt-4 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full", children: _jsxs("span", { className: "text-yellow-400 font-semibold text-sm", children: ["\uD83C\uDFC6 ", level] }) })] }), _jsxs("div", { className: "lg:col-span-3 grid grid-cols-2 gap-4", children: [_jsx(StatCard, { icon: TrendingUp, label: "Transactions", value: stats.transactions_count, subtitle: "30 derniers jours", color: "#0ea5e9" }), _jsx(StatCard, { icon: Zap, label: "Volume", value: stats.total_volume, subtitle: "FCFA \u00E9chang\u00E9s", color: "#22c55e", isVolume: true }), _jsx(StatCard, { icon: FileText, label: "Documents", value: stats.documents_uploaded, subtitle: "T\u00E9l\u00E9vers\u00E9s", color: "#a855f7" }), _jsx(StatCard, { icon: CheckCircle, label: "Actions", value: stats.recommendations_completed, subtitle: "Compl\u00E9t\u00E9es", color: "#f97316" })] })] }), recommendations.length > 0 && (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h2", { className: "text-xl font-bold flex items-center gap-2", children: [_jsx(Sparkles, { className: "w-5 h-5 text-purple-400 animate-pulse" }), "Recommandations IA"] }), _jsxs("span", { className: "text-sm text-slate-400", children: [recommendations.length, " actions sugg\u00E9r\u00E9es"] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: recommendations.map(rec => (_jsx(RecommendationCard, { rec: rec, onViewDetail: handleViewDetail }, rec.id))) })] })), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "D\u00E9tail par pilier" }), _jsx("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-6 space-y-4", children: pillars.map(p => _jsx(PillarBar, { ...p }, p.letter)) })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Actions rapides" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-3", children: [_jsx(QuickAction, { icon: History, title: "Historique", onClick: () => navigate('/historique'), gradient: "from-blue-500 to-cyan-500" }), _jsx(QuickAction, { icon: FileText, title: "Documents", onClick: () => navigate('/documents'), gradient: "from-purple-500 to-pink-500" }), _jsx(QuickAction, { icon: Calculator, title: "Simulateurs", onClick: () => navigate('/simulateurs'), gradient: "from-green-500 to-emerald-500" }), _jsx(QuickAction, { icon: MessageSquare, title: "Assistant IA", onClick: () => navigate('/ameliorer'), gradient: "from-orange-500 to-red-500" })] })] })] })] }), _jsx(DetailedRecommendationModal, { isOpen: showDetailModal, onClose: () => setShowDetailModal(false), recommendation: selectedRecommendation })] }));
}
