import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Dashboard utilisateur TERAS - Style corrigé
 * @module pages/user/UserDashboard
 */
import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../../utils/authFetch';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, Activity, FileText, Bell, ChevronRight, Clock, AlertCircle, CheckCircle, Shield, Wallet, Users, Target, Award, ArrowUpRight, ArrowDownRight, Download, RefreshCw, Eye, Sparkles } from 'lucide-react';
const formatXaf = (value) => {
    const amount = Number(value || 0);
    if (!amount)
        return '0 FCFA';
    if (amount >= 1000000)
        return `${(amount / 1000000).toFixed(1)} M FCFA`;
    if (amount >= 1000)
        return `${Math.round(amount / 1000)} k FCFA`;
    return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
};
const strengthLabel = (strength) => {
    if (strength === 'strong')
        return 'Dossier mobilisable';
    if (strength === 'medium')
        return 'Preuves solides';
    if (strength === 'light')
        return 'Base presente';
    return 'A completer';
};
const strengthColor = (strength) => {
    if (strength === 'strong')
        return 'emerald';
    if (strength === 'medium')
        return 'sky';
    if (strength === 'light')
        return 'amber';
    return 'slate';
};
// Composant Score Card Principal
const MainScoreCard = ({ score, previousScore, band }) => {
    const [animatedScore, setAnimatedScore] = useState(0);
    const change = score - previousScore;
    const isPositive = change >= 0;
    useEffect(() => {
        const duration = 1500;
        const steps = 60;
        const increment = score / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= score) {
                setAnimatedScore(score);
                clearInterval(timer);
            }
            else {
                setAnimatedScore(Math.round(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [score]);
    const getScoreColor = (s) => {
        if (s >= 900)
            return '#10b981';
        if (s >= 750)
            return '#0ea5e9';
        if (s >= 600)
            return '#eab308';
        if (s >= 400)
            return '#f97316';
        return '#ef4444';
    };
    const circumference = 2 * Math.PI * 90;
    const strokeDashoffset = circumference - (animatedScore / 1000) * circumference;
    const color = getScoreColor(animatedScore);
    return (_jsxs("div", { className: "bg-gradient-to-br from-sky-500/20 to-blue-500/20 rounded-2xl p-8 border border-sky-500/30 relative overflow-hidden", children: [_jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" }), _jsx("div", { className: "absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" }), _jsxs("div", { className: "relative z-10", children: [_jsxs("div", { className: "flex items-start justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-white", children: "Score TERAS" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Mis \u00E0 jour il y a 2 heures" })] }), _jsx("button", { className: "p-2 hover:bg-white/10 rounded-lg transition-colors", children: _jsx(RefreshCw, { className: "w-5 h-5 text-slate-400" }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "relative", children: [_jsxs("svg", { width: "200", height: "200", className: "transform -rotate-90", children: [_jsx("circle", { cx: "100", cy: "100", r: "90", fill: "none", stroke: "rgba(255,255,255,0.1)", strokeWidth: "12" }), _jsx("circle", { cx: "100", cy: "100", r: "90", fill: "none", stroke: color, strokeWidth: "12", strokeLinecap: "round", strokeDasharray: circumference, strokeDashoffset: strokeDashoffset, className: "transition-all duration-1000", style: { filter: `drop-shadow(0 0 10px ${color}40)` } })] }), _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [_jsx("div", { className: "text-5xl font-bold", style: { color }, children: animatedScore }), _jsx("div", { className: "text-slate-400 text-sm", children: "sur 1000" })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-4", children: [_jsx("div", { className: "text-sm text-slate-400 mb-1", children: "Variation" }), _jsxs("div", { className: `flex items-center gap-2 text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`, children: [isPositive ? _jsx(ArrowUpRight, { className: "w-6 h-6" }) : _jsx(ArrowDownRight, { className: "w-6 h-6" }), isPositive ? '+' : '', change] }), _jsx("div", { className: "text-xs text-slate-500", children: "vs mois dernier" })] }), _jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-4", children: [_jsx("div", { className: "text-sm text-slate-400 mb-1", children: "Bande" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-2xl font-bold text-sky-400", children: band }), _jsx("span", { className: "px-2 py-1 bg-sky-500/20 text-sky-400 text-xs rounded-full", children: "Tr\u00E8s bon" })] })] })] })] })] })] }));
};
// Composant Mini Chart
const MiniChart = ({ data }) => {
    const maxScore = Math.max(...data.map(d => d.score));
    const minScore = Math.min(...data.map(d => d.score));
    const range = maxScore - minScore || 1;
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d.score - minScore) / range) * 80 - 10;
        return `${x},${y}`;
    }).join(' ');
    return (_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "font-semibold text-white flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-5 h-5 text-sky-400" }), "\u00C9volution"] }), _jsxs("span", { className: "text-green-400 text-sm font-medium", children: ["+", data[data.length - 1].score - data[0].score, " pts"] })] }), _jsxs("svg", { viewBox: "0 0 100 60", className: "w-full h-24", children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "chartGradient", x1: "0%", y1: "0%", x2: "0%", y2: "100%", children: [_jsx("stop", { offset: "0%", stopColor: "rgba(14, 165, 233, 0.3)" }), _jsx("stop", { offset: "100%", stopColor: "rgba(14, 165, 233, 0)" })] }) }), _jsx("polygon", { points: `0,60 ${points} 100,60`, fill: "url(#chartGradient)" }), _jsx("polyline", { points: points, fill: "none", stroke: "#0ea5e9", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), data.map((d, i) => {
                        const x = (i / (data.length - 1)) * 100;
                        const y = 100 - ((d.score - minScore) / range) * 80 - 10;
                        return (_jsx("circle", { cx: x, cy: y, r: i === data.length - 1 ? 3 : 2, fill: i === data.length - 1 ? '#0ea5e9' : '#fff', stroke: "#0ea5e9", strokeWidth: "1" }, i));
                    })] }), _jsx("div", { className: "flex justify-between text-xs text-slate-500 mt-2", children: data.map((d, i) => (_jsx("span", { children: d.date.split('-')[1] }, i))) })] }));
};
// Composant Piliers TERAS
const PillarsWidget = ({ pillars }) => {
    return (_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6", children: [_jsxs("h3", { className: "font-semibold mb-6 text-white flex items-center gap-2", children: [_jsx(Target, { className: "w-5 h-5 text-sky-400" }), "Piliers TERAS"] }), _jsx("div", { className: "space-y-4", children: pillars.map(pillar => {
                    const change = pillar.value - pillar.previousValue;
                    const percentage = (pillar.value / 100) * 100;
                    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold", style: { backgroundColor: pillar.color }, children: pillar.id }), _jsx("span", { className: "text-sm text-slate-300", children: pillar.name })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-bold text-white", children: pillar.value }), change !== 0 && (_jsxs("span", { className: `text-xs ${change > 0 ? 'text-green-400' : 'text-red-400'}`, children: [change > 0 ? '+' : '', change] }))] })] }), _jsx("div", { className: "h-2 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all duration-500", style: {
                                        width: `${percentage}%`,
                                        backgroundColor: pillar.color,
                                        boxShadow: `0 0 8px ${pillar.color}40`
                                    } }) })] }, pillar.id));
                }) })] }));
};
// Composant Notifications
const NotificationsWidget = ({ notifications }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'score_change': return TrendingUp;
            case 'document': return FileText;
            case 'achievement': return Award;
            case 'alert': return AlertCircle;
        }
    };
    const getColor = (type) => {
        switch (type) {
            case 'score_change': return 'bg-sky-500/20 text-sky-400';
            case 'document': return 'bg-green-500/20 text-green-400';
            case 'achievement': return 'bg-yellow-500/20 text-yellow-400';
            case 'alert': return 'bg-orange-500/20 text-orange-400';
        }
    };
    return (_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("h3", { className: "font-semibold text-white flex items-center gap-2", children: [_jsx(Bell, { className: "w-5 h-5 text-sky-400" }), "Notifications", _jsx("span", { className: "px-2 py-0.5 bg-sky-500 text-xs rounded-full text-slate-900", children: notifications.filter(n => !n.read).length })] }), _jsx("button", { className: "text-sky-400 text-sm hover:text-sky-300", children: "Tout voir" })] }), _jsx("div", { className: "space-y-3", children: notifications.slice(0, 4).map(notif => {
                    const Icon = getIcon(notif.type);
                    const colorClass = getColor(notif.type);
                    return (_jsxs("div", { className: `flex items-start gap-3 p-3 rounded-xl transition-colors ${!notif.read ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'}`, children: [_jsx("div", { className: `w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`, children: _jsx(Icon, { className: "w-5 h-5" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium text-sm text-white", children: notif.title }), !notif.read && (_jsx("span", { className: "w-2 h-2 bg-sky-500 rounded-full" }))] }), _jsx("p", { className: "text-slate-400 text-sm truncate", children: notif.message }), _jsx("span", { className: "text-xs text-slate-500", children: notif.time })] })] }, notif.id));
                }) })] }));
};
// Composant Activité Récente
const RecentActivityWidget = ({ activities }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'text-green-400';
            case 'pending': return 'text-yellow-400';
            case 'failed': return 'text-red-400';
            default: return 'text-slate-400';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'success': return CheckCircle;
            case 'pending': return Clock;
            case 'failed': return AlertCircle;
            default: return Activity;
        }
    };
    const formatTime = (date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        if (hours < 1)
            return 'Il y a moins d\'1h';
        if (hours < 24)
            return `Il y a ${hours}h`;
        return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    };
    return (_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("h3", { className: "font-semibold text-white flex items-center gap-2", children: [_jsx(Activity, { className: "w-5 h-5 text-sky-400" }), "Activit\u00E9 r\u00E9cente"] }), _jsx("button", { className: "text-sky-400 text-sm hover:text-sky-300", children: "Historique" })] }), _jsx("div", { className: "space-y-4", children: activities.map((activity, index) => {
                    const StatusIcon = getStatusIcon(activity.status);
                    const statusColor = getStatusColor(activity.status);
                    return (_jsxs("div", { className: "flex items-start gap-3", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: `w-10 h-10 rounded-lg bg-slate-800/50 border border-white/10 flex items-center justify-center ${statusColor}`, children: _jsx(StatusIcon, { className: "w-5 h-5" }) }), index < activities.length - 1 && (_jsx("div", { className: "absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-slate-800" }))] }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm text-white", children: activity.description }), _jsx("span", { className: "text-xs text-slate-500", children: formatTime(activity.timestamp) })] })] }, activity.id));
                }) })] }));
};
const AssetEvidenceWidget = ({ intelligence }) => {
    if (!intelligence)
        return null;
    const color = strengthColor(intelligence.asset_proof_strength);
    return (_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-start justify-between gap-4 mb-6", children: [_jsxs("div", { children: [_jsxs("h3", { className: "font-semibold text-white flex items-center gap-2", children: [_jsx(Shield, { className: "w-5 h-5 text-sky-400" }), "Actifs Documentes"] }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Les preuves d'actifs renforcees par l'analyse alimentent votre pilier A et votre capacite de garantie." })] }), _jsx("span", { className: `px-3 py-1 rounded-full text-xs font-semibold bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`, children: strengthLabel(intelligence.asset_proof_strength) })] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
                    { label: "Preuves d'actifs", value: intelligence.proof_asset_docs, color: 'sky' },
                    { label: 'Actifs appliques', value: intelligence.proof_assets_applied, color: 'emerald' },
                    { label: 'Valeur estimee', value: formatXaf(intelligence.documented_assets_total_xaf || intelligence.verified_assets_total_xaf), color: 'purple' },
                    { label: 'Garantie potentielle', value: formatXaf(intelligence.collateral_candidate_value_xaf), color: 'amber' },
                ].map((item) => (_jsxs("div", { className: `bg-${item.color}-500/10 border border-${item.color}-500/20 rounded-xl p-4`, children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: item.label }), _jsx("p", { className: `text-${item.color}-400 font-bold`, children: item.value })] }, item.label))) }), _jsxs("div", { className: "mt-5 grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-slate-800/40 rounded-xl p-4 border border-slate-700/60", children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: "Derniere preuve exploitee" }), _jsx("p", { className: "text-white font-medium", children: intelligence.latest_proof_label || 'Aucune preuve appliquee' }), _jsx("p", { className: "text-slate-500 text-xs mt-1 truncate", children: intelligence.latest_proof_filename || 'Ajoutez une facture, une carte grise ou un titre pour renforcer le dossier.' })] }), _jsxs("div", { className: "bg-slate-800/40 rounded-xl p-4 border border-slate-700/60", children: [_jsx("p", { className: "text-slate-400 text-xs mb-1", children: "Derniere valeur detectee" }), _jsx("p", { className: "text-white font-medium", children: formatXaf(intelligence.latest_asset_value_xaf) }), _jsx("p", { className: "text-slate-500 text-xs mt-1", children: intelligence.latest_processed_at
                                    ? `Analysee le ${new Date(intelligence.latest_processed_at).toLocaleDateString('fr-FR')}`
                                    : "Aucune preuve d'actif analysee pour le moment." })] })] }), !!intelligence.alerts?.length && (_jsx("div", { className: "mt-5 space-y-2", children: intelligence.alerts.slice(0, 2).map((alert, index) => (_jsxs("div", { className: "flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-amber-400 mt-0.5 shrink-0" }), _jsx("p", { className: "text-sm text-slate-300", children: alert })] }, `${alert}-${index}`))) }))] }));
};
// Composant Actions Rapides
const QuickActions = () => {
    const actions = [
        { icon: FileText, label: 'Uploader document', color: 'from-sky-500 to-cyan-500' },
        { icon: Target, label: 'Calculer score', color: 'from-purple-500 to-pink-500' },
        { icon: Download, label: 'Exporter rapport', color: 'from-green-500 to-emerald-500' },
        { icon: Eye, label: 'Voir profil public', color: 'from-orange-500 to-red-500' }
    ];
    return (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: actions.map((action, index) => (_jsxs("button", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group hover:-translate-y-1", children: [_jsx("div", { className: `w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`, children: _jsx(action.icon, { className: "w-6 h-6 text-white" }) }), _jsx("span", { className: "text-sm font-medium text-white", children: action.label })] }, index))) }));
};
// ── Composant Principal — connecté à l'API ─────────────────────────────────────
const UserDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentScore, setCurrentScore] = useState(0);
    const [previousScore, setPreviousScore] = useState(0);
    const [band, setBand] = useState('—');
    const [history, setHistory] = useState([]);
    const [pillars, setPillars] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [activities, setActivities] = useState([]);
    const [documentIntelligence, setDocumentIntelligence] = useState(null);
    const PILLAR_META = {
        T: { color: '#0ea5e9', icon: TrendingUp },
        E: { color: '#22c55e', icon: Wallet },
        R: { color: '#eab308', icon: Activity },
        A: { color: '#a855f7', icon: Shield },
        S: { color: '#f97316', icon: Users },
    };
    const PILLAR_NAMES = {
        T: 'Transactions', E: 'Épargne', R: 'Revenus', A: 'Actifs', S: 'Social',
    };
    const PILLAR_MAX = {
        T: 300, E: 150, R: 200, A: 150, S: 200,
    };
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch('/api/scoring/user/dashboard/');
            if (!res.ok)
                throw new Error(`Erreur ${res.status}`);
            const data = await res.json();
            // Score
            const score = data.score?.current ?? data.score?.score ?? data.teras_score ?? 0;
            const prev = data.score?.previous ?? Math.max(0, score - (data.score?.change_month ?? 0));
            setCurrentScore(score);
            setPreviousScore(prev);
            // Bande
            const b = score >= 900 ? 'A' : score >= 750 ? 'B' : score >= 600 ? 'C' : score >= 400 ? 'D' : 'E';
            setBand(b);
            // Historique
            const hist = (data.score_history ?? data.evolution ?? data.history ?? []).map((h) => ({
                date: h.computed_at?.slice(0, 7) ?? h.date ?? '',
                score: h.score ?? 0,
            }));
            setHistory(hist);
            // Piliers
            const breakdown = data.score?.breakdown ?? data.breakdown ?? {};
            const p = Object.entries(breakdown).map(([id, val]) => ({
                id,
                name: PILLAR_NAMES[id] ?? id,
                value: Math.round((val?.score ?? val ?? 0) * 100),
                previousValue: Math.round((val?.score ?? val ?? 0) * 100),
                maxPoints: PILLAR_MAX[id] ?? 100,
                color: PILLAR_META[id]?.color ?? '#888',
                icon: PILLAR_META[id]?.icon ?? Activity,
            }));
            setPillars(p);
            // Notifications depuis les alertes/recommandations
            const recs = (data.recommendations ?? []).slice(0, 3).map((r, i) => ({
                id: String(i),
                type: 'alert',
                title: typeof r === 'string' ? 'Recommandation' : (r.title ?? 'Recommandation'),
                message: typeof r === 'string' ? r : (r.description ?? r.action ?? ''),
                time: "Aujourd'hui",
                read: false,
            }));
            setNotifications(recs);
            // Activités récentes
            const acts = (data.recent_activities ?? data.activities ?? []).slice(0, 4).map((a, i) => ({
                id: String(i),
                type: a.type ?? 'score',
                description: a.label ?? a.description ?? a.action ?? '',
                timestamp: new Date(a.timestamp ?? a.created_at ?? Date.now()),
                status: a.status ?? 'success',
            }));
            setActivities(acts);
            setDocumentIntelligence(data.document_intelligence ?? null);
        }
        catch (e) {
            setError(e.message || 'Impossible de charger le dashboard.');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const firstName = user?.first_name || user?.username || 'vous';
    if (loading)
        return (_jsx("div", { className: "min-h-screen bg-[#0b1220] flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(RefreshCw, { className: "w-10 h-10 text-sky-400 animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "Chargement de votre espace..." })] }) }));
    if (error)
        return (_jsx("div", { className: "min-h-screen bg-[#0b1220] flex items-center justify-center p-6", children: _jsxs("div", { className: "bg-slate-900/60 border border-rose-500/30 rounded-2xl p-8 max-w-md text-center space-y-4", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-rose-400 mx-auto" }), _jsx("p", { className: "text-white font-semibold", children: "Dashboard indisponible" }), _jsx("p", { className: "text-slate-400 text-sm", children: error }), _jsx("button", { onClick: load, className: "px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-semibold", children: "R\u00E9essayer" })] }) }));
    const pointsToNext = currentScore < 1000 ? (currentScore < 400 ? 400 - currentScore :
        currentScore < 600 ? 600 - currentScore :
            currentScore < 750 ? 750 - currentScore :
                currentScore < 900 ? 900 - currentScore : 0) : 0;
    return (_jsx("div", { className: "min-h-screen bg-[#0b1220] text-white p-6", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between mb-8", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold flex items-center gap-3 text-white", children: [_jsx(Sparkles, { className: "w-8 h-8 text-yellow-400" }), "Bonjour, ", firstName, " !"] }), _jsx("p", { className: "text-slate-400 mt-1", children: "Voici un aper\u00E7u de votre profil TERAS" })] }), _jsxs("button", { onClick: load, className: "flex items-center gap-2 mt-4 md:mt-0 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), " Actualiser"] })] }), _jsx("div", { className: "mb-8", children: _jsx(QuickActions, {}) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsx(MainScoreCard, { score: currentScore, previousScore: previousScore, band: band }), history.length > 0 && _jsx(MiniChart, { data: history })] }), _jsx("div", { children: pillars.length > 0
                                ? _jsx(PillarsWidget, { pillars: pillars })
                                : (_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center h-full min-h-48 text-slate-500 text-sm text-center gap-2", children: [_jsx(Target, { className: "w-8 h-8 opacity-40" }), _jsx("p", { children: "Piliers non disponibles" }), _jsx("p", { className: "text-xs", children: "Compl\u00E9tez votre profil pour activer l'analyse." })] })) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6", children: [_jsx(NotificationsWidget, { notifications: notifications }), _jsx(RecentActivityWidget, { activities: activities })] }), _jsx("div", { className: "mt-6", children: _jsx(AssetEvidenceWidget, { intelligence: documentIntelligence }) }), pointsToNext > 0 && (_jsx("div", { className: "mt-8 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-2xl p-6 border border-sky-500/30", children: _jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center", children: _jsx(Award, { className: "w-8 h-8 text-white" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-xl font-semibold text-white", children: "Passez au niveau sup\u00E9rieur !" }), _jsxs("p", { className: "text-slate-400", children: ["Plus que ", pointsToNext, " points pour atteindre la prochaine bande"] })] })] }), _jsxs("button", { className: "px-6 py-3 bg-sky-500 hover:bg-sky-400 rounded-xl font-medium flex items-center gap-2 transition-all text-slate-900", children: ["Am\u00E9liorer mon score ", _jsx(ChevronRight, { className: "w-5 h-5" })] })] }) }))] }) }));
};
export default UserDashboard;
