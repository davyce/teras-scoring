import { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Users,
  AlertCircle,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';

interface ActivityLog {
  id: string;
  user_id: string | number;
  username: string;
  action: string;
  details: string;
  status: 'success' | 'warning' | 'error';
  timestamp: string;
  region?: string;
  ip_address?: string | null;
}

export default function AdminActivityMonitor() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => loadActivities(true), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadActivities = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await adminApi.getActivities({ limit: 100 });
      if (response.error) throw new Error(response.error);
      setActivities(response.data ?? []);
      setError(null);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Impossible de charger les activités.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      success: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      warning: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      error: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700';
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    if (action.includes('LOGOUT')) return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    if (action.includes('FAILED')) return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    if (action.includes('UPDATE')) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
    if (action.includes('COMPUTE') || action.includes('SCORE')) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: activities.length,
    success: activities.filter((a) => a.status === 'success').length,
    warnings: activities.filter((a) => a.status === 'warning').length,
    errors: activities.filter((a) => a.status === 'error').length,
    uniqueUsers: new Set(activities.map((a) => a.user_id)).size,
  };

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement des activités...</p>
          </div>
        </div>
      
    );
  }

  return (
    
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Surveillance des Activités</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Monitoring en temps réel des actions utilisateurs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <RefreshCw
                className={`w-4 h-4 ${autoRefresh ? 'text-blue-600 dark:text-blue-400 animate-spin' : 'text-gray-600 dark:text-gray-400'}`}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto-refresh (30s)
              </span>
            </label>
            <button
              onClick={() => loadActivities()}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-blue-600 dark:border-blue-400 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Activités</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-green-600 dark:border-green-400 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Succès</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.success}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-orange-600 dark:border-orange-400 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avertissements</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.warnings}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-red-600 dark:border-red-400 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Erreurs</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.errors}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-purple-600 dark:border-purple-400 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Utilisateurs actifs</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.uniqueUsers}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher activités..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white"
            >
              <option value="all">Tous statuts</option>
              <option value="success">Succès</option>
              <option value="warning">Avertissement</option>
              <option value="error">Erreur</option>
            </select>
          </div>
        </div>

        {/* Journal d'activités */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          {filteredActivities.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>Aucune activité trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Horodatage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Détails
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredActivities.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{log.username}</p>
                            {log.region && (
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                {log.region}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">ID: {log.user_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${getStatusColor(log.status)} w-fit`}
                        >
                          {getStatusIcon(log.status)}
                          <span className="text-sm font-medium capitalize">{log.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-md">
                        <div>
                          <p>{log.details}</p>
                          {log.ip_address && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">IP: {log.ip_address}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filteredActivities.length > 0 && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Affichage de {filteredActivities.length} activité(s) sur {activities.length} au total
          </div>
        )}
      </div>
    
  );
}
