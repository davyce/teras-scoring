// @ts-nocheck
// teras-frontend/src/pages/government/GovernmentRegions.tsx
import React, { useState, useEffect } from 'react';
import { authFetch } from '../../services/authFetch';
import {
  MapPin, Building2, Users, DollarSign, TrendingUp,
  RefreshCw, ChevronDown, ChevronUp, BarChart3,
  Briefcase, Activity, Shield,
} from 'lucide-react';

const fmtB = (n: number) => {
  if (!n) return '0';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}Md FCFA`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M FCFA`;
  if (n >= 1_000)         return `${Math.round(n / 1_000)}k FCFA`;
  return `${n.toLocaleString('fr-FR')} FCFA`;
};
const fmtN = (n: number) => n?.toLocaleString('fr-FR') || '0';
const SC   = (s: number) => s >= 700 ? 'text-emerald-400' : s >= 500 ? 'text-amber-400' : s >= 300 ? 'text-orange-400' : 'text-red-400';
const SBG  = (s: number) => s >= 700 ? 'bg-emerald-500' : s >= 500 ? 'bg-amber-500' : s >= 300 ? 'bg-orange-400' : 'bg-red-500';
const BANDS = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-red-400'];

const REGION_STYLE: Record<string, string> = {
  'Sud':    'bg-sky-500/10 border-sky-500/30 text-sky-400',
  'Centre': 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  'Nord':   'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
};

function Bar({ pct, color = 'bg-sky-500' }: { pct: number; color?: string }) {
  return (
    <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export default function GovernmentRegions() {
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tabs, setTabs]         = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    authFetch('/api/scoring/government/regions/')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggle = (dept: string) => setExpanded(p => p === dept ? null : dept);
  const setTab = (dept: string, t: string) => setTabs(p => ({ ...p, [dept]: t }));

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-slate-400">
      <RefreshCw className="w-5 h-5 animate-spin text-sky-400" /> Chargement données régionales…
    </div>
  );

  const sum    = data?.summary    || {};
  const depts  = data?.departments || [];
  const maxRev = Math.max(...depts.map((d: any) => d.annual_revenue), 1);

  // Grouper par région géographique
  const regions: Record<string, any[]> = {};
  depts.forEach((d: any) => {
    const r = d.region || 'Autre';
    if (!regions[r]) regions[r] = [];
    regions[r].push(d);
  });

  return (
    <div className="p-6 space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MapPin className="w-6 h-6 text-sky-400" />
            Départements — {data?.country?.name || 'Congo Brazzaville'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {sum.total_departments} départements · données économiques réelles TERAS
          </p>
        </div>
        <button onClick={load}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPIs nationaux */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { l: 'Départements',      v: sum.total_departments || 0,       c: 'slate',  i: MapPin     },
          { l: 'Entreprises',       v: fmtN(sum.total_enterprises),      c: 'blue',   i: Building2  },
          { l: 'CA national',       v: fmtB(sum.total_revenue),          c: 'purple', i: DollarSign },
          { l: 'Emplois formels',   v: fmtN(sum.total_employees),        c: 'emerald',i: Briefcase  },
          { l: 'Score TERAS moyen', v: sum.avg_score || '—',             c: 'amber',  i: TrendingUp },
        ].map(({ l, v, c, i: Icon }) => (
          <div key={l} className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-${c}-500/20 flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 text-${c === 'slate' ? 'slate-400' : c + '-400'}`} />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{v}</p>
              <p className="text-slate-500 text-xs">{l}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Graphique CA par département */}
      {depts.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" /> Répartition du CA par département
          </h3>
          <div className="space-y-2.5">
            {[...depts].sort((a, b) => b.annual_revenue - a.annual_revenue).map((d: any) => {
              const pct = Math.round((d.annual_revenue / maxRev) * 100);
              return (
                <div key={d.dept}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium w-28 truncate">{d.dept}</span>
                      {d.region && (
                        <span className={`px-1.5 py-0.5 rounded text-xs border ${REGION_STYLE[d.region] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                          {d.region}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{d.enterprises} entr.</span>
                      <span className={`font-semibold ${SC(d.avg_score)}`}>{d.avg_score || '—'}</span>
                      <span className="text-white font-semibold w-24 text-right">{fmtB(d.annual_revenue)}</span>
                    </div>
                  </div>
                  <Bar pct={pct} color={SBG(d.avg_score)} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Liste par région géographique */}
      {Object.entries(regions).map(([region, deptList]) => (
        <div key={region} className="space-y-3">
          <h2 className="text-white font-bold flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-sm border ${REGION_STYLE[region] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
              {region}
            </span>
            <span className="text-slate-500 text-sm font-normal">
              {deptList.length} département{deptList.length > 1 ? 's' : ''}
            </span>
          </h2>

          <div className="grid md:grid-cols-2 gap-3">
            {deptList.map((dept: any) => {
              const isOpen = expanded === dept.dept;
              const tab    = tabs[dept.dept] || 'overview';
              return (
                <div key={dept.dept} className="bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden">

                  {/* Header */}
                  <button onClick={() => toggle(dept.dept)}
                    className="w-full p-4 text-left hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-bold text-base flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                          {dept.dept}
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          Chef-lieu : {dept.capital}
                          {dept.cities.length > 1 && ` · ${dept.cities.slice(1).join(', ')}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`font-bold text-lg ${SC(dept.avg_score)}`}>{dept.avg_score || '—'}</p>
                          <p className="text-slate-500 text-xs">Score TERAS</p>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{dept.enterprises} entr.</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{dept.individuals} ind.</span>
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{dept.employees} emplois</span>
                      <span className="flex items-center gap-1 text-white font-medium ml-auto"><DollarSign className="w-3 h-3" />{fmtB(dept.annual_revenue)}</span>
                    </div>
                  </button>

                  {/* Détail */}
                  {isOpen && (
                    <div className="border-t border-slate-800/50 p-4 space-y-4">
                      {/* Tabs */}
                      <div className="flex gap-2 text-xs">
                        {[{ id: 'overview', l: 'Aperçu' }, { id: 'enterprises', l: 'Entreprises' }, { id: 'loans', l: 'Crédits' }].map(({ id, l }) => (
                          <button key={id} onClick={() => setTab(dept.dept, id)}
                            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${tab === id ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                            {l}
                          </button>
                        ))}
                      </div>

                      {/* Aperçu */}
                      {tab === 'overview' && (
                        <div className="space-y-4">
                          {dept.score_distribution && (
                            <div>
                              <p className="text-slate-400 text-xs font-semibold mb-2">Distribution Scores TERAS</p>
                              <div className="space-y-1.5">
                                {Object.entries(dept.score_distribution).map(([band, count]: any, i) => {
                                  const tot = Object.values(dept.score_distribution).reduce((a: any, b: any) => a + b, 0) || 1;
                                  const p   = Math.round((count / tot) * 100);
                                  return (
                                    <div key={band}>
                                      <div className="flex justify-between text-xs mb-0.5">
                                        <span className="text-slate-400">{band}</span>
                                        <span className="text-white">{count} ({p}%)</span>
                                      </div>
                                      <Bar pct={p} color={BANDS[i] || 'bg-slate-500'} />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {dept.top_sectors?.length > 0 && (
                            <div>
                              <p className="text-slate-400 text-xs font-semibold mb-2">Secteurs dominants</p>
                              <div className="flex flex-wrap gap-2">
                                {dept.top_sectors.map((s: any) => (
                                  <span key={s.sector} className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg">
                                    {s.sector} <span className="text-sky-400 font-bold">({s.count})</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {[
                              { l: 'CA annuel',      v: fmtB(dept.annual_revenue) },
                              { l: 'Emplois',        v: fmtN(dept.employees)      },
                              { l: 'Crédits actifs', v: dept.loans_active || 0   },
                              { l: 'Volume crédit',  v: fmtB(dept.loans_volume)   },
                            ].map(({ l, v }) => (
                              <div key={l} className="bg-slate-800/40 rounded-lg p-2.5">
                                <p className="text-slate-500 mb-0.5">{l}</p>
                                <p className="text-white font-semibold">{v}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Entreprises */}
                      {tab === 'enterprises' && (
                        <div className="space-y-2">
                          {dept.enterprises === 0 ? (
                            <div className="text-center py-6">
                              <Building2 className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                              <p className="text-slate-500 text-sm">Aucune entreprise enregistrée dans ce département.</p>
                            </div>
                          ) : dept.top_enterprises?.length > 0 ? (
                            <>
                              <p className="text-slate-400 text-xs font-semibold">Top entreprises — Score TERAS</p>
                              {dept.top_enterprises.map((e: any, i: number) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/30">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-slate-600 text-xs w-4 font-bold shrink-0">{i + 1}</span>
                                    <div className="min-w-0">
                                      <p className="text-white text-sm font-medium truncate">{e.name}</p>
                                      <p className="text-slate-500 text-xs">{e.sector} · {e.city}</p>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0 ml-2">
                                    <p className={`font-bold text-sm ${SC(e.teras_score)}`}>{e.teras_score}</p>
                                    <p className="text-slate-500 text-xs">{fmtB(e.annual_revenue)}</p>
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            <p className="text-slate-500 text-xs text-center py-4">Scores en cours de calcul.</p>
                          )}
                        </div>
                      )}

                      {/* Crédits */}
                      {tab === 'loans' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {[
                              { l: 'Total',          v: dept.loans_total || 0,          c: 'white'      },
                              { l: 'Actifs',         v: dept.loans_active || 0,         c: 'emerald-400'},
                              { l: 'Volume décaissé',v: fmtB(dept.loans_volume || 0),   c: 'sky-400'    },
                            ].map(({ l, v, c }) => (
                              <div key={l} className="bg-slate-800/40 rounded-xl p-3 text-center">
                                <p className="text-slate-500 mb-0.5">{l}</p>
                                <p className={`font-bold text-base text-${c}`}>{v}</p>
                              </div>
                            ))}
                          </div>
                          {dept.loans_total === 0 && (
                            <div className="text-center py-4">
                              <Activity className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                              <p className="text-slate-500 text-sm">Aucun crédit enregistré dans ce département.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {depts.length === 0 && (
        <div className="text-center py-16">
          <Shield className="w-14 h-14 text-slate-700 mx-auto mb-4" />
          <p className="text-white font-semibold mb-2">Aucune donnée régionale</p>
          <p className="text-slate-400 text-sm">Les données apparaîtront dès que des entreprises seront enregistrées.</p>
        </div>
      )}
    </div>
  );
}