// @ts-nocheck
// AdminUserReport.tsx - Rapport complet utilisateur avec IA insights
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileText,
  Download,
  Shield,
  Activity,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import AdminLayout from '../../components/AdminLayout';

interface UserReport {
  user: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    user_type: string;
    country: string;
    region: string;
    is_active: boolean;
    date_joined: string;
    last_login: string | null;
  };
  teras_score: {
    current_score: number | null;
    breakdown: {
      T: number;
      E: number;
      R: number;
      A: number;
      S: number;
    } | null;
    history: Array<{
      score: number;
      created_at: string;
    }>;
  };
  kyc: {
    status: string;
    completion_percentage: number;
    verified_at: string | null;
    can_apply_for_credit: boolean;
    required_documents: string[];
    uploaded_documents: string[];
    approved_documents: string[];
    missing_documents: string[];
  };
  documents: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    flagged: number;
    recent: any[];
  };
  ai_insights: {
    risk_assessment: {
      level: string;
      score: number;
      factors: string[];
    };
    creditworthiness: {
      score: number;
      max_loan_amount: number;
      recommended_rate: number;
      reasoning: string;
    };
    recommendations: Array<{
      type: string;
      priority: string;
      message: string;
      action: string;
    }>;
  } | null;
  statistics: {
    total_calculations: number;
    average_score: number;
    min_score: number;
    max_score: number;
    account_age_days: number;
  };
}

export default function AdminUserReport() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<UserReport | null>(null);
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
      const mockReport: UserReport = {
        user: {
          id: parseInt(userId!),
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
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Génération du rapport...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!report) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-red-600">Rapport introuvable</p>
        </div>
      </AdminLayout>
    );
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

  const riskColor =
    report.ai_insights?.risk_assessment.level === 'low'
      ? 'text-green-600 dark:text-green-400'
      : report.ai_insights?.risk_assessment.level === 'medium'
      ? 'text-orange-600 dark:text-orange-400'
      : 'text-red-600 dark:text-red-400';

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => navigate('/admin/users')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour aux utilisateurs
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Rapport Utilisateur - {report.user.full_name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Analyse complète générée par IA
            </p>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600">
            <Download className="w-5 h-5" />
            Exporter PDF
          </button>
        </div>

        {/* User Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
              {report.user.username.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{report.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">
                  {report.user.user_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pays</p>
                <p className="font-medium text-gray-900 dark:text-white">{report.user.country}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Statut</p>
                <span
                  className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                    report.user.is_active
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}
                >
                  {report.user.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score TERAS */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Score TERAS
                </h2>
                <div className="text-right">
                  <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {report.teras_score.current_score || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">/ 1000</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Radar Chart */}
                {radarData.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Breakdown T.E.R.A.S
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#374151" />
                        <PolarAngleAxis dataKey="subject" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
                        <Radar
                          name="Score"
                          dataKey="value"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Line Chart - Evolution */}
                {scoreHistory.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Évolution ({report.teras_score.history.length} calculs)
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={scoreHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} domain={[650, 850]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* AI Insights */}
            {report.ai_insights && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  IA Insights
                </h2>

                {/* Risk Assessment */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Évaluation du Risque
                  </h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Niveau</span>
                    <span className={`font-bold uppercase ${riskColor}`}>
                      {report.ai_insights.risk_assessment.level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Score Risque</span>
                    <span className={`font-bold ${riskColor}`}>
                      {report.ai_insights.risk_assessment.score}/100
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-600 dark:text-gray-400 mb-2">Facteurs:</p>
                    <ul className="space-y-1">
                      {report.ai_insights.risk_assessment.factors.map((factor, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                          <span className="text-blue-600 dark:text-blue-400">•</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Creditworthiness */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Solvabilité
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Montant Max</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {report.ai_insights.creditworthiness.max_loan_amount.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Taux Recommandé</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {report.ai_insights.creditworthiness.recommended_rate}%
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                    {report.ai_insights.creditworthiness.reasoning}
                  </p>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Recommandations
                  </h3>
                  <div className="space-y-3">
                    {report.ai_insights.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border-l-4 ${
                          rec.priority === 'high'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                            : rec.priority === 'medium'
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {rec.message}
                          </p>
                          <span className="text-xs font-medium uppercase px-2 py-0.5 rounded bg-white dark:bg-gray-800">
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{rec.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            {/* KYC Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                KYC Status
              </h3>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Completion</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {report.kyc.completion_percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
                    style={{ width: `${report.kyc.completion_percentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Statut</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      report.kyc.status === 'approved'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    }`}
                  >
                    {report.kyc.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Peut demander crédit</span>
                  {report.kyc.can_apply_for_credit ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  )}
                </div>
              </div>

              {report.kyc.missing_documents.length > 0 && (
                <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-2">
                    Documents manquants:
                  </p>
                  <ul className="text-xs space-y-1">
                    {report.kyc.missing_documents.map((doc, idx) => (
                      <li key={idx} className="text-gray-700 dark:text-gray-300">
                        • {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Documents Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Documents
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {report.documents.total}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {report.documents.approved}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Approuvés</p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {report.documents.pending}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">En attente</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {report.documents.rejected}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Rejetés</p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Statistiques
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Calculs totaux</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {report.statistics.total_calculations}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Score moyen</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {report.statistics.average_score.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Score min/max</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {report.statistics.min_score} / {report.statistics.max_score}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Âge du compte</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {report.statistics.account_age_days} jours
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
