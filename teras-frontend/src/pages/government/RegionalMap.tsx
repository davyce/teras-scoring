// src/pages/government/RegionalMap.tsx
// Cartographie des scores CEMAC — données réelles via API gouvernement

import { useState, useEffect, useCallback } from 'react';
import { MapPin, AlertCircle, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { governmentApi } from '../../services/governmentApi';

const SCORE_COLOR = (score: number) => {
  if (score >= 700) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', bar: 'bg-emerald-500', label: '> 700 — Excellent' };
  if (score >= 600) return { bg: 'bg-sky-500/20',     text: 'text-sky-400',     border: 'border-sky-500/40',     bar: 'bg-sky-500',     label: '600-700 — Bon'      };
  if (score >= 500) return { bg: 'bg-amber-500/20',   text: 'text-amber-400',   border: 'border-amber-500/40',   bar: 'bg-amber-500',   label: '500-600 — Moyen'    };
  return              { bg: 'bg-rose-500/20',     text: 'text-rose-400',    border: 'border-rose-500/40',    bar: 'bg-rose-500',    label: '< 500 — Faible'     };
};

const LEGEND = [
  { label: 'Score > 700', color: '#22c55e' },
  { label: 'Score 600–700', color: '#38bdf8' },
  { label: 'Score 500–600', color: '#facc15' },
  { label: 'Score < 500', color: '#f97316' },
];

export default function RegionalMap() {
  const [regions,  setRegions]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [period,   setPeriod]   = useState('month');
  const [selected, setSelected] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await governmentApi.getRegions();
      if (res.data) setRegions(res.data.regions ?? []);
      else setError(res.error || 'Données indisponibles');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4" />
        <p className="text-slate-400">Chargement de la cartographie...</p>
      </div>
    </div>
  );

  if (error && regions.length === 0) return (
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

  const maxPop = Math.max(...regions.map(r => r.population ?? 1), 1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">TERAS Régional</p>
            <h1 className="text-2xl md:text-3xl font-bold">Cartographie des scores</h1>
            <p className="text-sm text-slate-400">
              {regions.length} région(s) — données réelles TERAS
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select value={period} onChange={e => setPeriod(e.target.value)}
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:border-sky-500">
              <option value="month">Dernier mois</option>
              <option value="quarter">3 derniers mois</option>
              <option value="year">12 derniers mois</option>
            </select>
            <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">

          {/* Grille des régions — remplace la pseudo-carte */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Zones par score TERAS</h2>
            {regions.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                Aucune donnée régionale disponible.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {regions.map((r) => {
                  const col = SCORE_COLOR(r.avg_score);
                  const isSelected = selected?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelected(isSelected ? null : r)}
                      className={`text-left p-4 rounded-xl border transition-all ${col.bg} ${col.border} ${
                        isSelected ? 'ring-2 ring-sky-400 scale-[1.02]' : 'hover:scale-[1.01]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className={`w-4 h-4 ${col.text}`} />
                        <span className="font-semibold text-slate-100 text-sm">{r.name}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Score TERAS</span>
                        <span className={`text-lg font-bold ${col.text}`}>{r.avg_score}</span>
                      </div>
                      {/* Barre de score */}
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${col.bar} rounded-full`} style={{ width: `${(r.avg_score/1000)*100}%` }} />
                      </div>
                      {/* Population */}
                      {r.population && (
                        <div className="flex items-center gap-1 mt-2">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span className="text-xs text-slate-500">{r.population.toLocaleString('fr-FR')}</span>
                          {/* Barre relative */}
                          <div className="flex-1 h-1 bg-slate-800 rounded-full ml-1 overflow-hidden">
                            <div className="h-full bg-slate-600 rounded-full" style={{ width: `${(r.population/maxPop)*100}%` }} />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panneau latéral */}
          <div className="space-y-4">

            {/* Détail région sélectionnée */}
            {selected && (
              <div className="bg-slate-900/80 border border-sky-500/30 rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-400" /> {selected.name}
                </h3>
                {[
                  { label: 'Score moyen',     value: selected.avg_score,                          color: 'text-sky-400' },
                  { label: 'Population',       value: selected.population?.toLocaleString('fr-FR'), color: 'text-slate-200' },
                  { label: 'Taux d\'activité', value: `${((selected.active_rate ?? 0)*100).toFixed(1)}%`, color: 'text-emerald-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-sm border-t border-slate-800 pt-2">
                    <span className="text-slate-400">{label}</span>
                    <span className={`font-semibold ${color}`}>{value ?? '—'}</span>
                  </div>
                ))}
                <button onClick={() => setSelected(null)} className="w-full text-xs text-slate-500 hover:text-slate-300 pt-1">
                  Fermer
                </button>
              </div>
            )}

            {/* Légende */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-200">Légende des zones</h2>
              <ul className="space-y-2 text-sm">
                {LEGEND.map((item) => (
                  <li key={item.label} className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-sm border border-slate-700 shrink-0"
                      style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300">{item.label}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-800">
                Cliquez sur une zone pour voir le détail.
                Une carte SVG interactive sera intégrée en V2.
              </p>
            </div>

            {/* Stats globales */}
            {regions.length > 0 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" /> Synthèse CEMAC
                </h2>
                {[
                  { label: 'Score max',   value: Math.max(...regions.map(r => r.avg_score)), color: 'text-emerald-400' },
                  { label: 'Score min',   value: Math.min(...regions.map(r => r.avg_score)), color: 'text-rose-400'    },
                  { label: 'Score moyen', value: Math.round(regions.reduce((s, r) => s + r.avg_score, 0) / regions.length), color: 'text-sky-400' },
                  { label: 'Régions',     value: regions.length,                              color: 'text-slate-200'  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-400">{label}</span>
                    <span className={`font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
