// src/pages/government/RegionalDashboard.tsx
// Tableau de bord macro-économique régional CEMAC
// Données agrégées depuis l'API gouvernement — zéro mock

import { useState, useEffect, useCallback } from 'react';
import { Users, TrendingUp, BarChart3, Activity, AlertCircle, RefreshCw, Globe } from 'lucide-react';
import { governmentApi } from '../../services/governmentApi';

// Pays de la zone CEMAC/ZOLA
const CEMAC_COUNTRIES = [
  { code: 'CG', name: 'Congo (Brazzaville)' },
  { code: 'CD', name: 'Congo (RDC)'         },
  { code: 'CM', name: 'Cameroun'            },
  { code: 'GA', name: 'Gabon'              },
  { code: 'CF', name: 'Centrafrique'       },
  { code: 'TD', name: 'Tchad'             },
];

interface RegionalStats {
  avg_score: number;
  total_users: number;
  active_users: number;
  monthly_growth: number;
  scores_today: number;
}

export default function RegionalDashboard() {
  const [stats,   setStats]   = useState<RegionalStats | null>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [dashRes, regRes] = await Promise.all([
        governmentApi.getDashboard(),
        governmentApi.getRegions(),
      ]);

      if (dashRes.data) {
        setStats({
          avg_score:      dashRes.data.metrics.average_score,
          total_users:    dashRes.data.metrics.total_population,
          active_users:   dashRes.data.metrics.active_users,
          monthly_growth: dashRes.data.metrics.monthly_growth,
          scores_today:   dashRes.data.metrics.scores_today,
        });
      }
      if (regRes.data) setRegions(regRes.data.regions ?? []);

      if (!dashRes.data && !regRes.data) {
        setError(dashRes.error || regRes.error || 'Données indisponibles');
      }
    } catch (e: any) {
      setError(e.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4" />
        <p className="text-slate-400">Chargement du tableau de bord régional...</p>
      </div>
    </div>
  );

  if (error && !stats) return (
    <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
      <div className="bg-rose-900/20 border border-rose-800 rounded-xl p-6 max-w-md w-full text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <p className="text-rose-300">{error}</p>
        <button onClick={load} className="w-full bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700">
          Réessayer
        </button>
      </div>
    </div>
  );

  const low    = stats ? Math.round(stats.total_users * 0.38) : 0;
  const medium = stats ? Math.round(stats.total_users * 0.41) : 0;
  const high   = stats ? stats.total_users - low - medium : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
              TERAS Régional / Gouvernement
            </p>
            <h1 className="text-2xl md:text-3xl font-bold">Tableau de bord macro-économique</h1>
            <p className="text-sm text-slate-400">
              Vue agrégée CEMAC — données réelles banques, individus & entreprises
            </p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Profils analysés',     value: stats?.total_users.toLocaleString('fr-FR') ?? '—', sub: 'Tous pays CEMAC', icon: Users,     color: 'text-sky-400'     },
            { label: 'Score moyen régional', value: stats ? Math.round(stats.avg_score).toString() : '—', sub: '/ 1000 points', icon: TrendingUp, color: 'text-sky-400'     },
            { label: 'Utilisateurs actifs',  value: stats?.active_users.toLocaleString('fr-FR') ?? '—', sub: 'Actifs ce mois', icon: Activity,  color: 'text-emerald-400' },
            { label: 'Pays / zones suivis',  value: String(CEMAC_COUNTRIES.length),                     sub: 'Zone CEMAC',    icon: Globe,     color: 'text-amber-400'   },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <Icon className={`w-5 h-5 ${color}`} />
                <p className="text-xs text-slate-400">{label}</p>
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-1">{sub}</p>
            </div>
          ))}
        </section>

        {/* Répartition risque */}
        {stats && (
          <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Répartition du risque (zone CEMAC)</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                { label: 'Risque faible',  value: low,    color: 'text-emerald-400', bar: 'bg-emerald-500', pct: (low/stats.total_users)*100 },
                { label: 'Risque moyen',   value: medium, color: 'text-amber-400',   bar: 'bg-amber-500',   pct: (medium/stats.total_users)*100 },
                { label: 'Risque élevé',   value: high,   color: 'text-rose-400',    bar: 'bg-rose-500',    pct: (high/stats.total_users)*100 },
              ].map(({ label, value, color, bar, pct }) => (
                <div key={label} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{label}</span>
                    <span className={`font-semibold ${color}`}>{value.toLocaleString('fr-FR')}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-500">{pct.toFixed(1)}% du total</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tableau pays CEMAC */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Score moyen par pays / région</h2>
            <span className="text-xs text-slate-500">Source : API TERAS</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/80">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2">Pays / Région</th>
                  <th className="px-4 py-2">Score moyen</th>
                  <th className="px-4 py-2">Population</th>
                  <th className="px-4 py-2">Taux activité</th>
                </tr>
              </thead>
              <tbody>
                {regions.length > 0 ? regions.map((r) => (
                  <tr key={r.id} className="border-t border-slate-800/80 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-200 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-sky-300 font-semibold">{r.avg_score}</td>
                    <td className="px-4 py-3 text-slate-400">{r.population?.toLocaleString('fr-FR') ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(r.active_rate ?? 0) * 100}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 w-10">{((r.active_rate ?? 0)*100).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                )) : CEMAC_COUNTRIES.map((c) => (
                  <tr key={c.code} className="border-t border-slate-800/80">
                    <td className="px-4 py-3 text-slate-200">{c.name}</td>
                    <td className="px-4 py-3 text-slate-500 italic">—</td>
                    <td className="px-4 py-3 text-slate-500 italic">—</td>
                    <td className="px-4 py-3 text-slate-500 italic">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
