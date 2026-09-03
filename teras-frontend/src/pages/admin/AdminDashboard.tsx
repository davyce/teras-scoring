// AdminDashboard.tsx - VERSION CONNECTÉE API CONGO
import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  Activity,
  ArrowUp,
  ArrowDown,
  BarChart3,
  UserX,
  Building2,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

type DashboardData = Record<string, any>;

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000); // Refresh toutes les 30s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    try {
      setError(null);
      const response = await authFetch('/api/scoring/admin/dashboard/');
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.detail || payload?.error || `Erreur ${response.status}`);
      }
      setData(payload);
    } catch (err: any) {
      setError(err?.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2 text-center">Erreur</h3>
          <p className="text-red-700 dark:text-red-300 mb-4 text-center">{error || 'Aucune donnée'}</p>
          <button
            onClick={loadDashboard}
            className="w-full bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ✅ SAFEGUARDS: évite les crashs si l'API renvoie des champs manquants
  const metrics = (data as any)?.metrics ?? {};
  const regionsStats: Record<string, any> =
    (data as any)?.regions_stats && typeof (data as any).regions_stats === 'object' ? (data as any).regions_stats : {};
  const sectorsStats: Record<string, any> =
    (data as any)?.sectors_stats && typeof (data as any).sectors_stats === 'object' ? (data as any).sectors_stats : {};
  const riskDistribution = (data as any)?.risk_distribution ?? { low: 0, medium: 0, high: 0 };
  const systemHealth = (data as any)?.system_health ?? {};
  const recentActivities = Array.isArray((data as any)?.recent_activities) ? (data as any).recent_activities : [];
  const fraudAlertsRecent = Array.isArray((data as any)?.fraud_alerts_recent) ? (data as any).fraud_alerts_recent : [];
  const topRegion = Object.entries(regionsStats).sort((a: any, b: any) => Number(b?.[1]?.count ?? 0) - Number(a?.[1]?.count ?? 0))[0];
  const topSector = Object.entries(sectorsStats).sort((a: any, b: any) => Number(b?.[1] ?? 0) - Number(a?.[1] ?? 0))[0];
  const kycBacklogRate = Number(metrics.total_users ?? 0) > 0
    ? Math.round((Number(metrics.kyc_pending ?? 0) / Number(metrics.total_users ?? 1)) * 100)
    : 0;

  const kpiCards = [
    {
      title: 'Utilisateurs Totaux',
      value: metrics.total_users,
      icon: Users,
      lightBg: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      title: 'Utilisateurs Actifs',
      value: metrics.active_users,
      icon: UserCheck,
      lightBg: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      title: 'En attente KYC',
      value: metrics.kyc_pending,
      icon: Clock,
      lightBg: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    {
      title: 'Suspendus',
      value: metrics.suspended_users,
      icon: UserX,
      lightBg: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    {
      title: 'Entreprises',
      value: metrics.enterprise_users,
      icon: Building2,
      lightBg: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    {
      title: 'Nouveaux (7j)',
      value: metrics.new_users_week,
      icon: TrendingUp,
      lightBg: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
    },
    {
      title: 'Score Moyen',
      value: Math.round(Number(metrics.avg_score ?? 0)),
      icon: BarChart3,
      lightBg: 'bg-cyan-50 dark:bg-cyan-900/20',
      textColor: 'text-cyan-600 dark:text-cyan-400',
      borderColor: 'border-cyan-200 dark:border-cyan-800',
    },
    {
      title: 'Tendance',
      value: metrics.score_trend ?? 0,
      icon: (metrics.score_trend ?? 0) >= 0 ? ArrowUp : ArrowDown,
      lightBg: (metrics.score_trend ?? 0) >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20',
      textColor: (metrics.score_trend ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      borderColor: (metrics.score_trend ?? 0) >= 0 ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Admin 🇨🇬</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Vue d'ensemble TERAS Congo-Brazzaville</p>
        </div>
        <button
          onClick={loadDashboard}
          className="px-6 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium shadow-sm"
        >
          Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          const val = Number(kpi.value ?? 0);
          return (
            <div
              key={index}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 ${kpi.borderColor} border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${kpi.lightBg}`}>
                  <Icon className={`w-5 h-5 ${kpi.textColor}`} />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{kpi.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Number.isFinite(val) ? val.toLocaleString() : '0'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Régions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Utilisateurs par Région
          </h2>

          {Object.keys(regionsStats).length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              <p>Aucune donnée région</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(regionsStats).slice(0, 5).map(([region, stats]: any) => (
                <div
                  key={region}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{region}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {Number(stats?.active ?? 0)} actifs / {Number(stats?.count ?? 0)} total
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{Number(stats?.count ?? 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Secteurs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            Utilisateurs par Secteur
          </h2>

          {Object.keys(sectorsStats).length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              <p>Aucune donnée secteur</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(sectorsStats).slice(0, 5).map(([sector, count]: any) => (
                <div
                  key={sector}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <p className="font-medium text-gray-900 dark:text-white">{sector}</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{Number(count ?? 0)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          {
            title: 'Zone la plus couverte',
            value: topRegion?.[0] || '—',
            detail: `${Number((topRegion as any)?.[1]?.count ?? 0)} utilisateurs suivis`,
            tone: 'text-blue-600 dark:text-blue-400',
          },
          {
            title: 'Secteur le plus représenté',
            value: topSector?.[0] || '—',
            detail: `${Number((topSector as any)?.[1] ?? 0)} comptes qualifiés`,
            tone: 'text-green-600 dark:text-green-400',
          },
          {
            title: 'Backlog KYC',
            value: `${kycBacklogRate}%`,
            detail: `${Number(metrics.kyc_pending ?? 0)} dossier(s) à traiter`,
            tone: 'text-orange-600 dark:text-orange-400',
          },
        ].map((item) => (
          <div key={item.title} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">{item.title}</p>
            <p className={`text-2xl font-bold mt-2 ${item.tone}`}>{item.value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{item.detail}</p>
          </div>
        ))}
      </div>

      {/* Distribution Risques & Santé Système */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Risques */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            Distribution des Risques
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{Number(riskDistribution.low ?? 0)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Risque Faible</p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{Number(riskDistribution.medium ?? 0)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Risque Moyen</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{Number(riskDistribution.high ?? 0)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Risque Élevé</p>
            </div>
          </div>
        </div>

        {/* Santé Système */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Santé du Système
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">API Status</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400 capitalize">
                {String(systemHealth.api_status ?? 'unknown')}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">Uptime</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{Number(systemHealth.uptime_percentage ?? 0)}%</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">Temps Réponse</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{Number(systemHealth.response_time_avg ?? 0)}ms</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">Connexions</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{Number(systemHealth.active_connections ?? 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activités Récentes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Activités Récentes</h2>
          <Activity className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>

        {recentActivities.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>Aucune activité récente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.slice(0, 5).map((activity: any) => (
              <div
                key={activity?.id ?? `${activity?.username ?? 'u'}-${activity?.timestamp ?? Math.random()}`}
                className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-gray-100 dark:border-gray-700"
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    activity?.status === 'success'
                      ? 'bg-green-500 dark:bg-green-400'
                      : activity?.status === 'warning'
                      ? 'bg-orange-500 dark:bg-orange-400'
                      : 'bg-red-500 dark:bg-red-400'
                  }`}
                ></div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {activity?.username ?? 'Utilisateur'}
                    </p>
                    {activity?.region && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                        {activity.region}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{activity?.details ?? ''}</p>
                  {activity?.ip_address && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">IP: {activity.ip_address}</p>
                  )}
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 text-right flex-shrink-0">
                  {activity?.timestamp ?? ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alertes Fraude */}
      {fraudAlertsRecent.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-bold text-red-900 dark:text-red-200">
              Alertes Fraude Récentes ({fraudAlertsRecent.length})
            </h2>
          </div>
          <div className="space-y-3">
            {fraudAlertsRecent.map((alert: any) => (
              <div
                key={alert?.id ?? `${alert?.username ?? 'u'}-${alert?.detected_at ?? Math.random()}`}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-red-200 dark:border-red-800"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">{alert?.username ?? 'Utilisateur'}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        alert?.severity === 'critical'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                      }`}
                    >
                      {String(alert?.severity ?? 'unknown')}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{alert?.detected_at ?? ''}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{alert?.description ?? ''}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Action: {alert?.auto_action ?? ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
