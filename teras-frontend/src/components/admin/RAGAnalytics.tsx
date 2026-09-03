// teras-frontend/src/components/admin/RAGAnalytics.tsx - AVEC FILTRES
import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Users, 
  Clock, 
  Download,
  RefreshCw,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import RAGAnalyticsFilters from './RAGAnalyticsFilters';
import './RAGAnalytics.css';

interface AnalyticsMetrics {
  total_queries: number;
  avg_response_time_ms: number;
  avg_documents_found: number;
  avg_documents_used: number;
  active_users: number;
  total_tokens: number;
  estimated_cost_usd: number;
}

interface DailyStat {
  date: string;
  count: number;
  avg_time: number;
}

interface TopQuery {
  query: string;
  count: number;
}

interface TopDocument {
  title: string;
  count: number;
}

interface FilterValues {
  days?: number;
  start_date?: string;
  end_date?: string;
  user_id?: number;
  user_type?: string;
  response_time_min?: number;
  response_time_max?: number;
  docs_used_min?: number;
  docs_used_max?: number;
  doc_type?: string;
}

export default function RAGAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [topQueries, setTopQueries] = useState<TopQuery[]>([]);
  const [topDocuments, setTopDocuments] = useState<TopDocument[]>([]);
  const [queriesByHour, setQueriesByHour] = useState<number[]>([]);
  const [filters, setFilters] = useState<FilterValues>({ days: 365 });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const buildQueryString = (filterValues: FilterValues) => {
    const params = new URLSearchParams();
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    return params.toString();
  };

  const loadAnalytics = async (filterValues: FilterValues = filters) => {
    setLoading(true);
    try {
      setError(null);
      const queryString = buildQueryString(filterValues);

      const [overviewRes, queriesRes, docsRes] = await Promise.all([
        authFetch(`/api/ai/analytics/overview/?${queryString}`),
        authFetch(`/api/ai/analytics/queries/?${queryString}`),
        authFetch(`/api/ai/analytics/documents/?${queryString}`),
      ]);

      if (!overviewRes.ok) throw new Error(`Erreur overview RAG (${overviewRes.status})`);
      if (!queriesRes.ok) throw new Error(`Erreur requêtes RAG (${queriesRes.status})`);
      if (!docsRes.ok) throw new Error(`Erreur documents RAG (${docsRes.status})`);

      const overviewData = await overviewRes.json();
      setMetrics(overviewData.metrics);
      setDailyStats(overviewData.daily_stats || []);

      const queriesData = await queriesRes.json();
      setTopQueries(queriesData.top_queries || []);
      setQueriesByHour(queriesData.queries_by_hour || []);

      const docsData = await docsRes.json();
      setTopDocuments(docsData.top_documents || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError(error instanceof Error ? error.message : 'Impossible de charger les analytics RAG.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    loadAnalytics(newFilters);
  };

  const handleFilterReset = () => {
    const defaultFilters = { days: 365 };
    setFilters(defaultFilters);
    loadAnalytics(defaultFilters);
  };

  const exportData = async () => {
    try {
      const queryString = buildQueryString(filters);
      const res = await authFetch(`/api/ai/analytics/export/?${queryString}&format=json`);
      const data = await res.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rag-analytics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (loading) {
    return (
      <div className="rag-analytics-loading">
        <div className="spinner"></div>
        <p>Chargement des analytics...</p>
      </div>
    );
  }

  return (
    <div className="rag-analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1>
            <BarChart3 size={32} style={{ color: '#667eea' }} />
            Analytics RAG TERAS
          </h1>
          <p className="subtitle">Tableau de bord d'utilisation du Chat RAG avec filtres avancés</p>
        </div>
        
        <div className="header-actions">
          {/* Filtres avancés */}
          <RAGAnalyticsFilters 
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
          />

          <button onClick={() => loadAnalytics(filters)} className="btn-refresh">
            <RefreshCw size={18} />
            Actualiser
          </button>

          <button onClick={exportData} className="btn-export">
            <Download size={18} />
            Exporter
          </button>
        </div>
      </div>

      {error && (
        <div className="empty-state" style={{ marginBottom: '24px' }}>
          <p>{error}</p>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon blue">
            <BarChart3 size={24} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Requêtes</p>
            <h2 className="metric-value">{metrics?.total_queries || 0}</h2>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon green">
            <Clock size={24} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Temps Moyen</p>
            <h2 className="metric-value">{metrics?.avg_response_time_ms || 0}ms</h2>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon purple">
            <FileText size={24} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Docs Utilisés</p>
            <h2 className="metric-value">{metrics?.avg_documents_used?.toFixed(1) || 0}</h2>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon orange">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Utilisateurs Actifs</p>
            <h2 className="metric-value">{metrics?.active_users || 0}</h2>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon pink">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Tokens Utilisés</p>
            <h2 className="metric-value">{(metrics?.total_tokens || 0).toLocaleString()}</h2>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon emerald">
            <FileText size={24} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Coût Estimé</p>
            <h2 className="metric-value">${metrics?.estimated_cost_usd?.toFixed(2) || 0}</h2>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Daily Activity Chart */}
        <div className="chart-card">
          <h3>Activité Quotidienne</h3>
          <div className="chart-content">
            {dailyStats.length > 0 ? (
              <div className="bar-chart">
                {dailyStats.map((stat, i) => {
                  const maxCount = Math.max(...dailyStats.map(s => s.count), 1);
                  const height = (stat.count / maxCount) * 100;
                  return (
                    <div key={i} className="bar-wrapper">
                      <div 
                        className="bar" 
                        style={{ height: `${height}%` }}
                        title={`${stat.date}: ${stat.count} requêtes`}
                      />
                      <span className="bar-label">
                        {new Date(stat.date).getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <p>Aucune donnée disponible pour cette période</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Queries */}
        <div className="chart-card">
          <h3>Top Requêtes</h3>
          <div className="list-content">
            {topQueries.length > 0 ? (
              topQueries.slice(0, 8).map((item, i) => (
                <div key={i} className="list-item">
                  <span className="rank">#{i + 1}</span>
                  <span className="query-text">{item.query}</span>
                  <span className="count-badge">{item.count}</span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>Aucune requête trouvée</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Documents */}
        <div className="chart-card">
          <h3>Documents Populaires</h3>
          <div className="list-content">
            {topDocuments.length > 0 ? (
              topDocuments.slice(0, 8).map((item, i) => (
                <div key={i} className="list-item">
                  <span className="rank">#{i + 1}</span>
                  <span className="doc-title">{item.title}</span>
                  <span className="count-badge">{item.count}</span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>Aucun document trouvé</p>
              </div>
            )}
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="chart-card">
          <h3>Répartition Horaire</h3>
          <div className="chart-content">
            {queriesByHour.some(count => count > 0) ? (
              <div className="bar-chart horizontal">
                {queriesByHour.map((count, hour) => {
                  const maxCount = Math.max(...queriesByHour, 1);
                  const width = (count / maxCount) * 100;
                  return (
                    <div key={hour} className="bar-wrapper-horizontal">
                      <span className="hour-label">{hour}h</span>
                      <div 
                        className="bar-horizontal" 
                        style={{ width: `${width}%` }}
                        title={`${hour}h: ${count} requêtes`}
                      />
                      <span className="count-text">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <p>Aucune donnée horaire disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
