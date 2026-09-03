import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// AdminUserDetails.tsx - VERSION AMÉLIORÉE TERAS
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Mail, Calendar, Activity, Ban, Edit, Shield, AlertCircle, ArrowLeft, CheckCircle, Clock, Award, BarChart2, FileText, RefreshCw, TrendingUp } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
const PILLAR_COLORS = { T: '#38bdf8', E: '#34d399', R: '#a78bfa', A: '#fb923c', S: '#f472b6' };
const PILLAR_LABELS = { T: 'Transactions', E: 'Épargne', R: 'Revenus', A: 'Actifs', S: 'Social' };
const TYPE_LABELS = { individual: 'Individu', enterprise: 'Entreprise', government: 'Gouvernement', bank: 'Banque', admin: 'Admin' };
function ScoreRing({ score }) {
    const pct = Math.min(score / 1000, 1);
    const r = 54;
    const circ = 2 * Math.PI * r;
    const color = score >= 750 ? '#34d399' : score >= 500 ? '#38bdf8' : '#f87171';
    return (_jsxs("div", { className: "relative flex items-center justify-center", style: { width: 140, height: 140 }, children: [_jsxs("svg", { width: "140", height: "140", style: { transform: 'rotate(-90deg)' }, children: [_jsx("circle", { cx: "70", cy: "70", r: r, fill: "none", stroke: "rgba(255,255,255,0.06)", strokeWidth: "10" }), _jsx("circle", { cx: "70", cy: "70", r: r, fill: "none", stroke: color, strokeWidth: "10", strokeDasharray: circ, strokeDashoffset: circ * (1 - pct), strokeLinecap: "round", style: { transition: 'stroke-dashoffset 1s ease' } })] }), _jsxs("div", { className: "absolute text-center", children: [_jsx("p", { className: "text-3xl font-black", style: { color }, children: score }), _jsx("p", { className: "text-xs text-slate-500", children: "/ 1000" })] })] }));
}
export default function AdminUserDetails() {
    const { id: userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [actionLoading, setActionLoading] = useState(false);
    const [notice, setNotice] = useState(null);
    useEffect(() => { if (userId)
        loadUser(); }, [userId]);
    const loadUser = async () => {
        if (!userId)
            return;
        try {
            setLoading(true);
            setError(null);
            const r = await adminApi.getUserDetail(parseInt(userId));
            if (r.data)
                setUser(r.data);
            else
                setError(r.error || 'Introuvable');
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSuspend = async () => {
        if (!userId || !confirm('Suspendre cet utilisateur ?'))
            return;
        try {
            setActionLoading(true);
            const r = await adminApi.suspendUser(parseInt(userId));
            if (r.data) {
                setNotice({ type: 'success', text: 'Utilisateur suspendu.' });
                loadUser();
            }
            else {
                setNotice({ type: 'error', text: r.error || 'Suspension impossible.' });
            }
        }
        catch (e) {
            setNotice({ type: 'error', text: e?.message || 'Suspension impossible.' });
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleRestore = async () => {
        if (!userId || !confirm('Réactiver cet utilisateur ?'))
            return;
        try {
            setActionLoading(true);
            const r = await adminApi.restoreUser(parseInt(userId));
            if (r.data) {
                setNotice({ type: 'success', text: 'Utilisateur réactivé.' });
                loadUser();
            }
            else {
                setNotice({ type: 'error', text: r.error || 'Réactivation impossible.' });
            }
        }
        catch (e) {
            setNotice({ type: 'error', text: e?.message || 'Réactivation impossible.' });
        }
        finally {
            setActionLoading(false);
        }
    };
    if (loading)
        return (_jsx("div", { className: "flex items-center justify-center h-96", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-10 h-10 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mx-auto mb-3" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Chargement..." })] }) }));
    if (error)
        return (_jsx("div", { className: "flex items-center justify-center h-96", children: _jsxs("div", { className: "text-center", children: [_jsx(AlertCircle, { className: "w-10 h-10 text-red-400 mx-auto mb-3" }), _jsx("p", { className: "text-slate-300 font-medium mb-1", children: "Erreur" }), _jsx("p", { className: "text-slate-500 text-sm mb-4", children: error }), _jsx("button", { onClick: () => navigate('/admin/users'), className: "px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm", children: "\u2190 Retour" })] }) }));
    if (!user)
        return null;
    const score = user.last_score?.score || 0;
    const breakdown = user.last_score?.breakdown || {};
    const scoreHistory = (user.score_history || []).map((h) => ({
        date: new Date(h.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        score: h.score,
    })).reverse();
    const pillarsData = Object.entries(PILLAR_LABELS).map(([key, name]) => ({
        name, score: Math.round((breakdown[key] || 0) * 100), key
    }));
    const riskColor = score < 450 ? '#f87171' : score < 650 ? '#fb923c' : '#34d399';
    const riskLabel = score < 450 ? 'Élevé' : score < 650 ? 'Moyen' : 'Faible';
    const stats = user.statistics || {};
    const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
    return (_jsxs("div", { className: "min-h-screen p-6", style: { background: '#0b1220' }, children: [_jsxs("div", { className: "flex items-center gap-2 mb-6 text-sm", children: [_jsxs("button", { onClick: () => navigate('/admin/users'), className: "text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), " Utilisateurs"] }), _jsx("span", { className: "text-slate-600", children: "/" }), _jsx("span", { className: "text-slate-300", children: user.email })] }), notice && (_jsxs("div", { className: `flex items-center gap-3 rounded-xl border px-4 py-3 mb-6 ${notice.type === 'success'
                    ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
                    : 'border-red-400/25 bg-red-400/10 text-red-300'}`, children: [notice.type === 'success' ? _jsx(CheckCircle, { className: "w-5 h-5" }) : _jsx(AlertCircle, { className: "w-5 h-5" }), _jsx("p", { className: "text-sm font-medium", children: notice.text })] })), _jsx("div", { className: "rounded-2xl p-6 mb-6", style: cardStyle, children: _jsxs("div", { className: "flex flex-col lg:flex-row gap-6", children: [_jsxs("div", { className: "flex items-start gap-5 flex-1", children: [_jsxs("div", { className: "relative flex-shrink-0", children: [_jsx("div", { className: "w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold", style: { background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' }, children: (user.first_name || user.username || user.email || '?').charAt(0).toUpperCase() }), _jsx("div", { className: `absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${user.is_active ? 'bg-emerald-400' : 'bg-red-400'}` })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h1", { className: "text-xl font-bold text-white truncate", children: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username || user.email }), _jsx("p", { className: "text-slate-400 text-sm mb-3", children: user.email }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs("span", { className: `px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${user.is_active ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`, children: [user.is_active ? _jsx(CheckCircle, { className: "w-3 h-3" }) : _jsx(Ban, { className: "w-3 h-3" }), user.is_active ? 'Actif' : 'Suspendu'] }), _jsx("span", { className: "px-2.5 py-1 rounded-full text-xs font-medium text-sky-400 bg-sky-400/10", children: TYPE_LABELS[user.user_type] || user.user_type }), _jsxs("span", { className: `px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${user.kyc_status === 'approved' ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10'}`, children: [_jsx(Shield, { className: "w-3 h-3" }), " KYC ", user.kyc_status || 'N/A'] }), _jsxs("span", { className: "px-2.5 py-1 rounded-full text-xs font-medium", style: { color: riskColor, background: `${riskColor}18` }, children: ["Risque ", riskLabel] })] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4", children: [
                                                { icon: Mail, label: 'Email', value: user.email },
                                                { icon: Calendar, label: 'Depuis', value: new Date(user.date_joined).toLocaleDateString('fr-FR') },
                                                { icon: Clock, label: 'Dernière co.', value: user.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : 'Jamais' },
                                                { icon: Activity, label: 'Région', value: user.region || 'N/A' },
                                            ].map(({ icon: Icon, label, value }) => (_jsxs("div", { className: "p-3 rounded-xl", style: { background: 'rgba(255,255,255,0.03)' }, children: [_jsxs("div", { className: "flex items-center gap-1.5 mb-1", children: [_jsx(Icon, { className: "w-3 h-3 text-sky-400" }), _jsx("span", { className: "text-xs text-slate-500", children: label })] }), _jsx("p", { className: "text-sm text-slate-200 font-medium truncate", children: value })] }, label))) })] })] }), _jsxs("div", { className: "flex flex-col items-center lg:items-end gap-4", children: [score > 0 && _jsx(ScoreRing, { score: score }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: loadUser, className: "p-2 rounded-lg text-slate-400 hover:text-white transition-colors", style: { background: 'rgba(255,255,255,0.06)' }, children: _jsx(RefreshCw, { className: "w-4 h-4" }) }), _jsxs("button", { onClick: () => navigate(`/admin/users/${userId}/edit`), className: "flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95", style: { background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }, children: [_jsx(Edit, { className: "w-4 h-4" }), " Modifier"] }), user.is_active ? (_jsxs("button", { onClick: handleSuspend, disabled: actionLoading, className: "flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 text-sm font-medium border border-red-400/25 hover:bg-red-400/10 transition-all", children: [_jsx(Ban, { className: "w-4 h-4" }), " Suspendre"] })) : (_jsxs("button", { onClick: handleRestore, disabled: actionLoading, className: "flex items-center gap-2 px-4 py-2 rounded-xl text-emerald-400 text-sm font-medium border border-emerald-400/25 hover:bg-emerald-400/10 transition-all", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), " R\u00E9activer"] }))] })] })] }) }), _jsx("div", { className: "flex gap-1 mb-6 p-1 rounded-xl w-fit", style: { background: 'rgba(255,255,255,0.04)' }, children: [
                    { id: 'overview', label: 'Statistiques', icon: BarChart2 },
                    { id: 'scores', label: 'Scores TERAS', icon: TrendingUp },
                    { id: 'kyc', label: 'KYC & Docs', icon: FileText },
                ].map(({ id, label, icon: Icon }) => (_jsxs("button", { onClick: () => setActiveTab(id), className: "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all", style: activeTab === id ? { background: 'rgba(14,165,233,0.15)', color: '#38bdf8' } : { color: '#64748b' }, children: [_jsx(Icon, { className: "w-4 h-4" }), label] }, id))) }), activeTab === 'overview' && (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
                    { label: 'Calculs Totaux', value: stats.total_calculations ?? 0, icon: BarChart2, color: '#38bdf8' },
                    { label: 'Score Moyen', value: typeof stats.average_score === 'number' ? stats.average_score.toFixed(0) : 0, icon: TrendingUp, color: '#a78bfa' },
                    { label: 'Score Min', value: stats.min_score ?? 0, icon: Activity, color: '#fb923c' },
                    { label: 'Score Max', value: stats.max_score ?? 0, icon: Award, color: '#34d399' },
                ].map(({ label, value, icon: Icon, color }) => (_jsxs("div", { className: "rounded-2xl p-5", style: cardStyle, children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center", style: { background: `${color}18` }, children: _jsx(Icon, { className: "w-4 h-4", style: { color } }) }), _jsx("span", { className: "text-xs text-slate-400", children: label })] }), _jsx("p", { className: "text-3xl font-black", style: { color }, children: value })] }, label))) })), activeTab === 'scores' && (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "rounded-2xl p-5", style: cardStyle, children: [_jsx("h3", { className: "text-white font-semibold mb-4", children: "\u00C9volution du score" }), scoreHistory.length > 0 ? (_jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(LineChart, { data: scoreHistory, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)" }), _jsx(XAxis, { dataKey: "date", stroke: "#475569", style: { fontSize: '11px' } }), _jsx(YAxis, { stroke: "#475569", style: { fontSize: '11px' }, domain: [0, 1000] }), _jsx(Tooltip, { contentStyle: { background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' } }), _jsx(Line, { type: "monotone", dataKey: "score", stroke: "#38bdf8", strokeWidth: 2, dot: { fill: '#38bdf8', r: 3 } })] }) })) : (_jsx("div", { className: "h-48 flex items-center justify-center text-slate-500 text-sm", children: "Aucun historique" }))] }), _jsxs("div", { className: "rounded-2xl p-5", style: cardStyle, children: [_jsx("h3", { className: "text-white font-semibold mb-4", children: "D\u00E9tail T.E.R.A.S" }), pillarsData.some(p => p.score > 0) ? (_jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(BarChart, { data: pillarsData, layout: "vertical", children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)" }), _jsx(XAxis, { type: "number", domain: [0, 100], stroke: "#475569", style: { fontSize: '11px' } }), _jsx(YAxis, { dataKey: "name", type: "category", stroke: "#475569", style: { fontSize: '11px' }, width: 90 }), _jsx(Tooltip, { contentStyle: { background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' } }), _jsx(Bar, { dataKey: "score", radius: [0, 4, 4, 0], children: pillarsData.map((entry) => (_jsx(Cell, { fill: PILLAR_COLORS[entry.key] }, entry.key))) })] }) })) : (_jsx("div", { className: "h-48 flex items-center justify-center text-slate-500 text-sm", children: "Aucun score calcul\u00E9" }))] })] })), activeTab === 'kyc' && (_jsxs("div", { className: "rounded-2xl p-5", style: cardStyle, children: [_jsx("h3", { className: "text-white font-semibold mb-4", children: "Demandes KYC" }), !(user.kyc_requests?.length) ? (_jsx("div", { className: "text-center py-12 text-slate-500 text-sm", children: "Aucune demande KYC" })) : (_jsx("div", { className: "space-y-3", children: user.kyc_requests.map((k) => (_jsxs("div", { className: "flex items-center justify-between p-4 rounded-xl", style: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(FileText, { className: "w-4 h-4 text-sky-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-white font-medium capitalize", children: k.document_type?.replace(/_/g, ' ') }), _jsx("p", { className: "text-xs text-slate-500", children: new Date(k.submitted_at).toLocaleDateString('fr-FR') })] })] }), _jsx("span", { className: `px-2.5 py-1 rounded-full text-xs font-semibold ${k.status === 'approved' ? 'text-emerald-400 bg-emerald-400/10' : k.status === 'pending' ? 'text-amber-400 bg-amber-400/10' : 'text-red-400 bg-red-400/10'}`, children: k.status })] }, k.id))) }))] }))] }));
}
