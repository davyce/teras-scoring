import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
// AdminUserReport.tsx - Rapport complet utilisateur avec IA insights
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, FileText, Download, Shield, Activity, } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, } from 'recharts';
import AdminLayout from '../../components/AdminLayout';
export default function AdminUserReport() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (userId) {
            loadReport();
        }
    }, [userId]);
    const loadReport = async () => {
        try {
            setLoading(true);
            // TODO: API call
            // const data = await validationApi.getUserReport(parseInt(userId!));
            // Mock data
            const mockReport = {
                user: {
                    id: parseInt(userId),
                    username: 'jean.mbemba',
                    email: 'jean.mbemba@email.com',
                    full_name: 'Jean Mbemba',
                    user_type: 'individual',
                    country: 'CG',
                    region: 'Brazzaville',
                    is_active: true,
                    date_joined: '2024-11-15T10:00:00Z',
                    last_login: '2025-12-18T14:30:00Z',
                },
                teras_score: {
                    current_score: 785,
                    breakdown: {
                        T: 0.82,
                        E: 0.75,
                        R: 0.80,
                        A: 0.78,
                        S: 0.79,
                    },
                    history: [
                        { score: 720, created_at: '2024-11-20T10:00:00Z' },
                        { score: 745, created_at: '2024-12-01T10:00:00Z' },
                        { score: 765, created_at: '2024-12-10T10:00:00Z' },
                        { score: 785, created_at: '2025-12-18T10:00:00Z' },
                    ],
                },
                kyc: {
                    status: 'approved',
                    completion_percentage: 100,
                    verified_at: '2024-12-05T12:00:00Z',
                    can_apply_for_credit: true,
                    required_documents: ['national_id', 'residence_proof', 'bank_statement'],
                    uploaded_documents: ['national_id', 'residence_proof', 'bank_statement'],
                    approved_documents: ['national_id', 'residence_proof', 'bank_statement'],
                    missing_documents: [],
                },
                documents: {
                    total: 3,
                    pending: 0,
                    approved: 3,
                    rejected: 0,
                    flagged: 0,
                    recent: [],
                },
                ai_insights: {
                    risk_assessment: {
                        level: 'low',
                        score: 18,
                        factors: ['Score TERAS élevé', 'KYC vérifié', 'Historique positif'],
                    },
                    creditworthiness: {
                        score: 785,
                        max_loan_amount: 2500000,
                        recommended_rate: 7.5,
                        reasoning: 'Bon profil, risque modéré',
                    },
                    recommendations: [
                        {
                            type: 'credit',
                            priority: 'medium',
                            message: 'Utilisateur éligible pour crédit standard',
                            action: 'Proposer produits crédit adaptés',
                        },
                    ],
                },
                statistics: {
                    total_calculations: 4,
                    average_score: 753.75,
                    min_score: 720,
                    max_score: 785,
                    account_age_days: 33,
                },
            };
            setReport(mockReport);
            setLoading(false);
        }
        catch (error) {
            console.error('Erreur:', error);
            setLoading(false);
        }
    };
    if (loading) {
        return (_jsx(AdminLayout, { children: _jsx("div", { className: "flex items-center justify-center h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "G\u00E9n\u00E9ration du rapport..." })] }) }) }));
    }
    if (!report) {
        return (_jsx(AdminLayout, { children: _jsx("div", { className: "p-6", children: _jsx("p", { className: "text-red-600", children: "Rapport introuvable" }) }) }));
    }
    // Préparer données pour graphiques
    const radarData = report.teras_score.breakdown
        ? [
            { subject: 'Transparence', value: report.teras_score.breakdown.T * 100, fullMark: 100 },
            { subject: 'Engagement', value: report.teras_score.breakdown.E * 100, fullMark: 100 },
            { subject: 'Réputation', value: report.teras_score.breakdown.R * 100, fullMark: 100 },
            { subject: 'Activité', value: report.teras_score.breakdown.A * 100, fullMark: 100 },
            { subject: 'Stabilité', value: report.teras_score.breakdown.S * 100, fullMark: 100 },
        ]
        : [];
    const scoreHistory = report.teras_score.history.map((h) => ({
        date: new Date(h.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        score: h.score,
    }));
    const riskColor = report.ai_insights?.risk_assessment.level === 'low'
        ? 'text-green-600 dark:text-green-400'
        : report.ai_insights?.risk_assessment.level === 'medium'
            ? 'text-orange-600 dark:text-orange-400'
            : 'text-red-600 dark:text-red-400';
    return (_jsx(AdminLayout, { children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsxs("button", { onClick: () => navigate('/admin/users'), className: "flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2", children: [_jsx(ArrowLeft, { className: "w-5 h-5" }), "Retour aux utilisateurs"] }), _jsxs("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: ["Rapport Utilisateur - ", report.user.full_name] }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mt-1", children: "Analyse compl\u00E8te g\u00E9n\u00E9r\u00E9e par IA" })] }), _jsxs("button", { className: "flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600", children: [_jsx(Download, { className: "w-5 h-5" }), "Exporter PDF"] })] }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6", children: _jsxs("div", { className: "flex items-start gap-6", children: [_jsx("div", { className: "w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold", children: report.user.username.charAt(0).toUpperCase() }), _jsxs("div", { className: "flex-1 grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Email" }), _jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: report.user.email })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Type" }), _jsx("p", { className: "font-medium text-gray-900 dark:text-white capitalize", children: report.user.user_type })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Pays" }), _jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: report.user.country })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Statut" }), _jsx("span", { className: `inline-flex px-2 py-1 rounded text-xs font-medium ${report.user.is_active
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`, children: report.user.is_active ? 'Actif' : 'Inactif' })] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-6 h-6 text-blue-600 dark:text-blue-400" }), "Score TERAS"] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-4xl font-bold text-blue-600 dark:text-blue-400", children: report.teras_score.current_score || 'N/A' }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "/ 1000" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [radarData.length > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-3", children: "Breakdown T.E.R.A.S" }), _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(RadarChart, { data: radarData, children: [_jsx(PolarGrid, { stroke: "#374151" }), _jsx(PolarAngleAxis, { dataKey: "subject", stroke: "#9ca3af", style: { fontSize: '12px' } }), _jsx(PolarRadiusAxis, { angle: 90, domain: [0, 100], stroke: "#9ca3af" }), _jsx(Radar, { name: "Score", dataKey: "value", stroke: "#3b82f6", fill: "#3b82f6", fillOpacity: 0.3 })] }) })] })), scoreHistory.length > 0 && (_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-3", children: ["\u00C9volution (", report.teras_score.history.length, " calculs)"] }), _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(LineChart, { data: scoreHistory, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#374151" }), _jsx(XAxis, { dataKey: "date", stroke: "#9ca3af", style: { fontSize: '12px' } }), _jsx(YAxis, { stroke: "#9ca3af", style: { fontSize: '12px' }, domain: [650, 850] }), _jsx(Tooltip, { contentStyle: {
                                                                            backgroundColor: '#1f2937',
                                                                            border: '1px solid #374151',
                                                                            borderRadius: '8px',
                                                                        } }), _jsx(Line, { type: "monotone", dataKey: "score", stroke: "#3b82f6", strokeWidth: 2, dot: { fill: '#3b82f6', r: 4 } })] }) })] }))] })] }), report.ai_insights && (_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: [_jsxs("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2", children: [_jsx(Activity, { className: "w-6 h-6 text-purple-600 dark:text-purple-400" }), "IA Insights"] }), _jsxs("div", { className: "mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg", children: [_jsx("h3", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-3", children: "\u00C9valuation du Risque" }), _jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Niveau" }), _jsx("span", { className: `font-bold uppercase ${riskColor}`, children: report.ai_insights.risk_assessment.level })] }), _jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Score Risque" }), _jsxs("span", { className: `font-bold ${riskColor}`, children: [report.ai_insights.risk_assessment.score, "/100"] })] }), _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-2", children: "Facteurs:" }), _jsx("ul", { className: "space-y-1", children: report.ai_insights.risk_assessment.factors.map((factor, idx) => (_jsxs("li", { className: "flex items-start gap-2 text-gray-700 dark:text-gray-300", children: [_jsx("span", { className: "text-blue-600 dark:text-blue-400", children: "\u2022" }), factor] }, idx))) })] })] }), _jsxs("div", { className: "mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg", children: [_jsx("h3", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-3", children: "Solvabilit\u00E9" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 mb-1", children: "Montant Max" }), _jsxs("p", { className: "text-lg font-bold text-blue-600 dark:text-blue-400", children: [report.ai_insights.creditworthiness.max_loan_amount.toLocaleString(), " FCFA"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 mb-1", children: "Taux Recommand\u00E9" }), _jsxs("p", { className: "text-lg font-bold text-blue-600 dark:text-blue-400", children: [report.ai_insights.creditworthiness.recommended_rate, "%"] })] })] }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mt-3", children: report.ai_insights.creditworthiness.reasoning })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-3", children: "Recommandations" }), _jsx("div", { className: "space-y-3", children: report.ai_insights.recommendations.map((rec, idx) => (_jsxs("div", { className: `p-3 rounded-lg border-l-4 ${rec.priority === 'high'
                                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                                                            : rec.priority === 'medium'
                                                                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                                                                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'}`, children: [_jsxs("div", { className: "flex items-start justify-between mb-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: rec.message }), _jsx("span", { className: "text-xs font-medium uppercase px-2 py-0.5 rounded bg-white dark:bg-gray-800", children: rec.priority })] }), _jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: rec.action })] }, idx))) })] })] }))] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [_jsx(Shield, { className: "w-5 h-5 text-green-600 dark:text-green-400" }), "KYC Status"] }), _jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Completion" }), _jsxs("span", { className: "font-bold text-gray-900 dark:text-white", children: [report.kyc.completion_percentage, "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2", children: _jsx("div", { className: "bg-green-600 dark:bg-green-500 h-2 rounded-full", style: { width: `${report.kyc.completion_percentage}%` } }) })] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Statut" }), _jsx("span", { className: `px-2 py-1 rounded text-xs font-medium ${report.kyc.status === 'approved'
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`, children: report.kyc.status })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Peut demander cr\u00E9dit" }), report.kyc.can_apply_for_credit ? (_jsx(CheckCircle, { className: "w-5 h-5 text-green-600 dark:text-green-400" })) : (_jsx(AlertTriangle, { className: "w-5 h-5 text-orange-600 dark:text-orange-400" }))] })] }), report.kyc.missing_documents.length > 0 && (_jsxs("div", { className: "mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg", children: [_jsx("p", { className: "text-xs font-medium text-orange-700 dark:text-orange-400 mb-2", children: "Documents manquants:" }), _jsx("ul", { className: "text-xs space-y-1", children: report.kyc.missing_documents.map((doc, idx) => (_jsxs("li", { className: "text-gray-700 dark:text-gray-300", children: ["\u2022 ", doc] }, idx))) })] }))] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [_jsx(FileText, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }), "Documents"] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-center", children: [_jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: report.documents.total }), _jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: "Total" })] }), _jsxs("div", { className: "p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center", children: [_jsx("p", { className: "text-2xl font-bold text-green-600 dark:text-green-400", children: report.documents.approved }), _jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: "Approuv\u00E9s" })] }), _jsxs("div", { className: "p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center", children: [_jsx("p", { className: "text-2xl font-bold text-yellow-600 dark:text-yellow-400", children: report.documents.pending }), _jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: "En attente" })] }), _jsxs("div", { className: "p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center", children: [_jsx("p", { className: "text-2xl font-bold text-red-600 dark:text-red-400", children: report.documents.rejected }), _jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: "Rejet\u00E9s" })] })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Statistiques" }), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Calculs totaux" }), _jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: report.statistics.total_calculations })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Score moyen" }), _jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: report.statistics.average_score.toFixed(0) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Score min/max" }), _jsxs("span", { className: "font-medium text-gray-900 dark:text-white", children: [report.statistics.min_score, " / ", report.statistics.max_score] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "\u00C2ge du compte" }), _jsxs("span", { className: "font-medium text-gray-900 dark:text-white", children: [report.statistics.account_age_days, " jours"] })] })] })] })] })] })] }) }));
}
