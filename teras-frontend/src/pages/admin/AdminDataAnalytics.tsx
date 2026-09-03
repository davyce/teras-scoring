// @ts-nocheck
import { adminApi } from '../../services/adminApi';
import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Activity,
  BarChart3,
  Download,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Analytics {
  kpis: {
    total_users: number;
    active_users: number;
    avg_score: number;
    recent_scores: number;
    suspended_users: number;
    kyc_completion_rate?: number;
  };
  score_distribution: Record<string, number>;
  recent_registrations: Array<{ date: string; count: number }>;
  users_by_type: Array<{ user_type: string; count: number }>;
  regions?: Array<{ region: string; users: number; avg_score: number; growth: number }>;
  sectors?: Array<{ sector: string; users: number; avg_score: number; volume: number }>;
}

export default function AdminDataAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminApi.getAnalytics();
      if (!response.data) throw new Error(response.error || 'Erreur analytics');

      const d = response.data as any;
      const normalizedKpis = {
        total_users: d.kpis?.total_users ?? d.summary?.total_users ?? d.total_users ?? 0,
        active_users: d.kpis?.active_users ?? d.summary?.active_users ?? d.active_users ?? 0,
        avg_score: d.kpis?.avg_score ?? d.summary?.avg_score ?? d.avg_score ?? 0,
        recent_scores: d.kpis?.recent_scores ?? d.summary?.total_scores ?? d.recent_scores ?? 0,
        suspended_users: d.kpis?.suspended_users ?? d.summary?.suspended_users ?? d.suspended_users ?? 0,
        kyc_completion_rate: d.kpis?.kyc_completion_rate ?? d.summary?.kyc_completion_rate ?? 0,
      };

      setAnalytics({
        kpis: normalizedKpis,
        score_distribution: d.score_distribution ?? {},
        recent_registrations: d.recent_registrations ?? d.score_evolution?.map((item: any) => ({
          date: item.date,
          count: item.new_users ?? 0,
        })) ?? [],
        users_by_type: d.users_by_type ?? [],
        regions: d.regions ?? [],
        sectors: d.sectors ?? [],
      });
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!analytics) return;

    const rows = [
      ['metrique', 'valeur'],
      ['total_users', analytics.kpis.total_users],
      ['active_users', analytics.kpis.active_users],
      ['avg_score', analytics.kpis.avg_score],
      ['recent_scores', analytics.kpis.recent_scores],
      ['suspended_users', analytics.kpis.suspended_users],
      ['kyc_completion_rate', analytics.kpis.kyc_completion_rate ?? 0],
      [],
      ['distribution_score', 'count'],
      ...Object.entries(analytics.score_distribution).map(([band, count]) => [band, count]),
      [],
      ['date_inscription', 'count'],
      ...(analytics.recent_registrations ?? []).map((item) => [item.date, item.count]),
      [],
      ['type_utilisateur', 'count'],
      ...(analytics.users_by_type ?? []).map((item) => [item.user_type, item.count]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement des analytics...</p>
          </div>
        </div>
      
    );
  }

  if (error || !analytics) {
    return (
      
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2 text-center">Erreur</h3>
            <p className="text-red-700 dark:text-red-300 mb-4 text-center">{error}</p>
            <button
              onClick={loadAnalytics}
              className="w-full bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600"
            >
              Réessayer
            </button>
          </div>
        </div>
      
    );
  }

  const scoreDistributionData = Object.entries(analytics.score_distribution ?? analytics.kpis?.score_distribution ?? {}).map(([range, count]) => ({
    range,
    count,
  }));

  const registrationsData = (analytics.recent_registrations ?? []).map((reg) => ({
    date: new Date(reg.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    count: reg.count,
  }));

  return (
    
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics & Données</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Statistiques détaillées du système</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAnalytics}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              Actualiser
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Utilisateurs</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {(analytics.kpis?.total_users ?? analytics.total_users ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Utilisateurs Actifs</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {(analytics.kpis?.active_users ?? analytics.active_users ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Score Moyen</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {(analytics.kpis?.avg_score ?? analytics.avg_score ?? 0).toFixed(0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Scores Récents</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {(analytics.kpis?.recent_scores ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution des scores */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Distribution des Scores TERAS
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="range" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Évolution des inscriptions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Nouvelles Inscriptions (7 derniers jours)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={registrationsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Inscriptions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Utilisateurs par type */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Utilisateurs par Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(analytics.users_by_type ?? []).map((type, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {type.user_type === 'individual'
                    ? 'Individus'
                    : type.user_type === 'enterprise'
                    ? 'Entreprises'
                    : type.user_type === 'admin'
                    ? 'Administrateurs'
                    : type.user_type}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{type.count}</p>
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${(type.count / Math.max(analytics.kpis.total_users || 0, 1)) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {((type.count / Math.max(analytics.kpis.total_users || 0, 1)) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    
  );
}
