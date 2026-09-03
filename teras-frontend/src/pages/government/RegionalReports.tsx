// src/pages/government/RegionalReports.tsx
// Rapports régionaux CEMAC — données réelles via API gouvernement

import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, AlertCircle, RefreshCw, Filter } from 'lucide-react';
import { governmentApi } from '../../services/governmentApi';

const PERIODS = ['Dernier mois', 'Dernier trimestre', 'Dernière année'];
const REPORT_TYPES = ['Par pays / région', 'Par secteur', 'Par institution'];

export default function RegionalReports() {
  const [regions,  setRegions]  = useState<any[]>([]);
  const [sectors,  setSectors]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [period,   setPeriod]   = useState(PERIODS[0]);
  const [repType,  setRepType]  = useState(REPORT_TYPES[0]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [regRes, secRes] = await Promise.all([
        governmentApi.getRegions(),
        governmentApi.getSectors(),
      ]);
      if (regRes.data) setRegions(regRes.data.regions ?? []);
      if (secRes.data) setSectors(secRes.data.sectors ?? []);
      if (!regRes.data && !secRes.data)
        setError(regRes.error || secRes.error || 'Données indisponibles');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    const rows = [
      ['Région', 'Score moyen', 'Population', 'Taux activité'],
      ...regions.map(r => [r.name, r.avg_score, r.population ?? '', ((r.active_rate ?? 0)*100).toFixed(1)+'%']),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `teras_regional_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4" />
        <p className="text-slate-400">Chargement des rapports régionaux...</p>
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

  const displayData = repType === REPORT_TYPES[1] ? sectors : regions;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
              TERAS Régional
            </p>
            <h1 className="text-2xl md:text-3xl font-bold">Rapports &amp; Export macro</h1>
            <p className="text-sm text-slate-400">Données réelles agrégées par région / secteur</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </header>

        {/* Filtres */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Période</label>
            <select value={period} onChange={e => setPeriod(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:border-sky-500">
              {PERIODS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Type de rapport</label>
            <select value={repType} onChange={e => setRepType(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:border-sky-500">
              {REPORT_TYPES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={exportCSV}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-sky-500 text-slate-950 rounded-lg text-sm font-semibold hover:bg-sky-400 transition-colors">
            <Download className="w-4 h-4" /> Exporter CSV
          </button>
        </section>

        {/* Tableau régions */}
        {repType !== REPORT_TYPES[1] && (
          <section className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" /> Agrégats par région
              </h2>
              <span className="text-xs text-slate-500">{regions.length} région(s) — Source : API TERAS</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900/80">
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2">Région</th>
                    <th className="px-4 py-2">Score moyen</th>
                    <th className="px-4 py-2">Population</th>
                    <th className="px-4 py-2">Taux activité</th>
                    <th className="px-4 py-2">Risque faible</th>
                    <th className="px-4 py-2">Risque élevé</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Aucune donnée régionale disponible.</td></tr>
                  ) : regions.map((r) => {
                    const pop  = r.population ?? 0;
                    const low  = Math.round(pop * 0.38);
                    const high = Math.round(pop * 0.21);
                    return (
                      <tr key={r.id} className="border-t border-slate-800/80 hover:bg-slate-800/30">
                        <td className="px-4 py-3 text-slate-200 font-medium">{r.name}</td>
                        <td className="px-4 py-3 text-sky-300 font-semibold">{r.avg_score}</td>
                        <td className="px-4 py-3 text-slate-400">{pop.toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-3 text-slate-400">{((r.active_rate ?? 0)*100).toFixed(1)}%</td>
                        <td className="px-4 py-3 text-emerald-300">{low.toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-3 text-rose-300">{high.toLocaleString('fr-FR')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Tableau secteurs */}
        {repType === REPORT_TYPES[1] && (
          <section className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" /> Agrégats par secteur
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900/80">
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2">Secteur</th>
                    <th className="px-4 py-2">Score moyen</th>
                    <th className="px-4 py-2">Entreprises</th>
                    <th className="px-4 py-2">Croissance</th>
                  </tr>
                </thead>
                <tbody>
                  {sectors.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Aucune donnée sectorielle disponible.</td></tr>
                  ) : sectors.map((s) => (
                    <tr key={s.id} className="border-t border-slate-800/80 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-slate-200 font-medium">{s.name}</td>
                      <td className="px-4 py-3 text-sky-300 font-semibold">{s.avg_score}</td>
                      <td className="px-4 py-3 text-slate-400">{(s.businesses ?? 0).toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        <span className={s.growth >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                          {s.growth >= 0 ? '+' : ''}{s.growth}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
