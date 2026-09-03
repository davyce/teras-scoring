import { authFetch } from '../../utils/authFetch';
import React, { useState, useEffect } from 'react';
import {
  TrendingUp, DollarSign, Users, Activity, Calendar,
  PieChart, BarChart3, Target, AlertCircle, CheckCircle,
  XCircle, Clock, RefreshCw, Wallet, Shield,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtM = (n: number) => {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}k`;
  return n.toLocaleString('fr-FR');
};
const fmtFCFA = (n: number) => `${fmtM(n)} FCFA`;

const BAND_COLORS = ['bg-emerald-500', 'bg-green-500', 'bg-blue-500', 'bg-amber-500', 'bg-red-500'];

// ── Composant principal ───────────────────────────────────────────────────────
export default function BankAnalytics() {
  const [period, setPeriod]   = useState('month');
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = async (p = period) => {
    setLoading(true); setError(null);
    try {
      const res = await authFetch(`/api/scoring/bank/analytics/?period=${p}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(period); }, [period]);

  if (loading) return (
    <div className="flex items-center justify-center h-96 gap-3 text-slate-400">
      <RefreshCw className="w-6 h-6 animate-spin text-sky-400" /> Chargement des analytics…
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <p className="text-red-400">{error || 'Données indisponibles'}</p>
      <button onClick={() => load()} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm">
        Réessayer
      </button>
    </div>
  );

  const overview  = data.overview  || {};
  const counts    = data.counts    || {};
  const risk      = data.riskMetrics || {};
  const trends    = data.trends    || {};
  const scoreD    = data.scoreDistribution  || [];
  const products  = data.productPerformance || [];
  const volumes   = data.volumesByMonth     || [];
  const totalVol  = products.reduce((s: number, p: any) => s + p.volume, 0) || 1;

  const kpis = [
    {
      label: 'Portefeuille Total', value: fmtFCFA(overview.portfolioValue || 0),
      sub: `${counts.active_loans || 0} crédits actifs`, color: 'emerald', icon: Wallet,
    },
    {
      label: 'Clients Enregistrés', value: counts.total_clients || 0,
      sub: `Score moyen : ${counts.avg_score || '—'}`, color: 'blue', icon: Users,
    },
    {
      label: 'Taux d\'Approbation', value: `${counts.approval_rate || 0}%`,
      sub: `${counts.approved_count || 0} approuvés / ${counts.rejected_count || 0} rejetés`, color: 'amber', icon: Target,
    },
    {
      label: 'En Attente', value: counts.pending_count || 0,
      sub: 'Dossiers à traiter', color: 'purple', icon: Clock,
    },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics & Rapports</h1>
          <p className="text-slate-400 text-sm mt-1">Données réelles du portefeuille bancaire TERAS</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500">
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Année</option>
          </select>
          <button onClick={() => load(period)}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── KPIs principaux ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${color}-400`} />
              </div>
            </div>
            <p className="text-slate-400 text-xs mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-slate-500 text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Évolution volume + Distribution score ─────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Volume par mois */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">Volume Mensuel</h3>
            <span className="ml-auto text-slate-500 text-xs">6 derniers mois</span>
          </div>

          {volumes.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
              Aucune donnée sur la période
            </div>
          ) : (
            <div className="space-y-3">
              {volumes.map((item: any, idx: number) => {
                const maxVol = Math.max(...volumes.map((v: any) => v.volume), 1);
                const pct    = Math.round((item.volume / maxVol) * 100);
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="text-slate-300 w-10">{item.month}</span>
                      <div className="flex-1 mx-3">
                        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right w-28">
                        <span className="text-white font-semibold">{fmtFCFA(item.volume)}</span>
                        {item.loans > 0 && <span className="text-slate-500 text-xs ml-1">({item.loans})</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {volumes.length === 0 && (
            <p className="text-slate-500 text-xs text-center mt-2">
              Les crédits approuvés alimenteront ce graphique
            </p>
          )}
        </div>

        {/* Distribution score TERAS */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <PieChart className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-semibold">Distribution Score TERAS</h3>
            <span className="ml-auto text-slate-500 text-xs">{counts.total_clients || 0} clients</span>
          </div>

          {scoreD.every((s: any) => s.count === 0) ? (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm flex-col gap-2">
              <Shield className="w-8 h-8 text-slate-700" />
              Aucun score calculé encore
            </div>
          ) : (
            <div className="space-y-3">
              {scoreD.map((item: any, idx: number) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="text-slate-300">{item.band}</span>
                    <span className="text-white font-semibold">
                      {item.count} <span className="text-slate-500 font-normal">({item.percentage}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${BAND_COLORS[idx] || 'bg-slate-500'} rounded-full transition-all duration-700`}
                      style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Performance par produit ──────────────────────────────── */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-semibold">Performance par Produit</h3>
        </div>

        {products.filter((p: any) => p.count > 0).length === 0 ? (
          <div className="flex items-center justify-center h-24 text-slate-500 text-sm flex-col gap-2">
            <Activity className="w-8 h-8 text-slate-700" />
            Aucun crédit accordé pour le moment
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Produit', 'Volume', 'Nb crédits', 'Ticket moyen', 'Taux', 'Part marché'].map(h => (
                    <th key={h} className={`p-3 text-slate-400 font-medium ${h === 'Produit' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p: any, idx: number) => {
                  const share = p.volume > 0 ? ((p.volume / totalVol) * 100).toFixed(1) : '0';
                  return (
                    <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <p className="text-white font-medium">{p.product}</p>
                      </td>
                      <td className="p-3 text-right">
                        <p className="text-white font-semibold">{fmtFCFA(p.volume)}</p>
                      </td>
                      <td className="p-3 text-right">
                        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg">{p.count}</span>
                      </td>
                      <td className="p-3 text-right">
                        <p className="text-slate-300">{fmtFCFA(p.avgTicket)}</p>
                      </td>
                      <td className="p-3 text-right">
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-lg">{p.rate}%</span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-white font-semibold">{share}%</span>
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              style={{ width: `${share}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Risque + Tendances ───────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Métriques risque */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h3 className="text-white font-semibold">Métriques de Risque</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Santé du Portefeuille',   val: `${risk.portfolioHealth || 0}%`,  icon: CheckCircle, color: 'emerald' },
              { label: 'Taux de Défaut',           val: `${risk.defaultRate || 0}%`,      icon: XCircle,     color: 'red'     },
              { label: 'Taux de Collecte estimé',  val: `${risk.collectionRate || 0}%`,   icon: DollarSign,  color: 'blue'    },
              { label: 'Délai moyen traitement',   val: `${risk.avgDelay || 0}j`,         icon: Clock,       color: 'amber'   },
              { label: 'Provisions (5%)',           val: fmtFCFA(risk.provisions || 0),   icon: AlertCircle, color: 'orange'  },
            ].map(({ label, val, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 text-${color}-400`} />
                  <span className="text-slate-300 text-sm">{label}</span>
                </div>
                <span className="text-white font-bold">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tendances */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-semibold">Indicateurs Clés</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Taux d\'Approbation',       val: `${trends.approvalRate || 0}%`,            icon: CheckCircle, color: 'emerald' },
              { label: 'Délai traitement moyen',    val: `${trends.avgProcessingTime || 0}j`,        icon: Clock,       color: 'blue'    },
              { label: 'Satisfaction estimée',      val: `${trends.customerSatisfaction || 0}/5`,    icon: Target,      color: 'amber'   },
              { label: 'Score TERAS moyen',         val: counts.avg_score || '—',                    icon: Shield,      color: 'purple'  },
              { label: 'Clients avec score',        val: counts.total_clients || 0,                  icon: Users,       color: 'sky'     },
            ].map(({ label, val, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 text-${color}-400`} />
                  <span className="text-slate-300 text-sm">{label}</span>
                </div>
                <span className="text-white font-bold">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
