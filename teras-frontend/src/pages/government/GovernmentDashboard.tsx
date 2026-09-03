// teras-frontend/src/pages/government/GovernmentDashboard.tsx
// Dashboard présidentiel TERAS — données réelles CEMAC
import React, { useState, useEffect } from 'react';
import { authFetch } from '../../services/authFetch';
import {
  Globe2, TrendingUp, Building2, Users, DollarSign,
  BarChart3, Shield, AlertCircle, RefreshCw, ChevronRight,
  Briefcase, Percent, Activity, MapPin, Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GovernmentUsersMap from '../../components/government/GovernmentUsersMap';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtB = (n: number) => {
  if (!n) return '0 FCFA';
  if (n >= 1_000_000_000_000) return `${(n/1_000_000_000_000).toFixed(2)}T FCFA`;
  if (n >= 1_000_000_000)     return `${(n/1_000_000_000).toFixed(1)}Md FCFA`;
  if (n >= 1_000_000)         return `${(n/1_000_000).toFixed(1)}M FCFA`;
  if (n >= 1_000)             return `${Math.round(n/1_000)}k FCFA`;
  return `${n.toLocaleString('fr-FR')} FCFA`;
};
const fmtN = (n: number) => n?.toLocaleString('fr-FR') || '0';
const SCORE_COLOR = (s: number) =>
  s >= 700 ? 'text-emerald-400' : s >= 500 ? 'text-amber-400' : s >= 300 ? 'text-orange-400' : 'text-red-400';
const SCORE_BG = (s: number) =>
  s >= 700 ? 'bg-emerald-500/10 border-emerald-500/20' : s >= 500 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';
const BAND_COLORS = ['bg-emerald-500', 'bg-green-500', 'bg-blue-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500'];

const FLAG: Record<string,string> = {
  CG:'🇨🇬', CM:'🇨🇲', GA:'🇬🇦', CF:'🇨🇫', TD:'🇹🇩', GQ:'🇬🇶', CD:'🇨🇩',
};

// ── Mini barre ────────────────────────────────────────────────────────────────
const Bar = ({ pct, color='bg-sky-500' }: { pct: number; color?: string }) => (
  <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
    <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width:`${Math.min(pct,100)}%` }}/>
  </div>
);

// ── Composant principal ───────────────────────────────────────────────────────
export default function GovernmentDashboard() {
  const navigate = useNavigate();
  const [overview, setOverview]   = useState<any>(null);
  const [macro, setMacro]         = useState<any>(null);
  const [sectors, setSectors]     = useState<any>(null);
  const [compliance, setCompliance] = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string|null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string|null>(null);
  const [countryDetail, setCountryDetail]     = useState<any>(null);
  const [loadingDetail, setLoadingDetail]     = useState(false);
  const [countryError, setCountryError]       = useState<string|null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, mc, sc, co] = await Promise.all([
        authFetch('/api/scoring/government/overview/').then(r=>r.json()),
        authFetch('/api/scoring/government/macro/').then(r=>r.json()),
        authFetch('/api/scoring/government/sectors/').then(r=>r.json()),
        authFetch('/api/scoring/government/compliance/').then(r=>r.json()),
      ]);
      setOverview(ov);
      setMacro(mc);
      setSectors(sc);
      setCompliance(co);
    } catch(e) {
      console.error(e);
      setError('Impossible de charger les données. Vérifiez votre connexion et réessayez.');
    }
    finally { setLoading(false); }
  };

  const loadCountry = async (code: string) => {
    if (selectedCountry === code) { setSelectedCountry(null); setCountryDetail(null); return; }
    setSelectedCountry(code);
    setCountryError(null);
    setLoadingDetail(true);
    try {
      const d = await authFetch(`/api/scoring/government/countries/${code}/`).then(r=>r.json());
      setCountryDetail(d);
    } catch(e) {
      console.error(e);
      setCountryError('Impossible de charger les données de ce pays.');
    }
    finally { setLoadingDetail(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96 gap-3 text-slate-400">
      <RefreshCw className="w-6 h-6 animate-spin text-sky-400"/> Chargement des données CEMAC…
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
      <AlertCircle className="w-12 h-12 text-red-400"/>
      <p className="text-red-300 font-medium">{error}</p>
      <button onClick={load} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm transition-colors flex items-center gap-2">
        <RefreshCw className="w-4 h-4"/> Réessayer
      </button>
    </div>
  );

  const sum  = overview?.summary || {};
  const countries = overview?.by_country || [];
  const maxRev = Math.max(...countries.map((c:any)=>c.annual_revenue), 1);

  return (
    <div className="p-6 space-y-8 text-white">

      {/* ── En-tête ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <Globe2 className="w-8 h-8 text-sky-400"/> Tableau de Bord CEMAC
          </h1>
          <p className="text-slate-400 mt-1">Données économiques réelles de la zone franc — {new Date().toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors">
          <RefreshCw className="w-4 h-4"/> Actualiser
        </button>
      </div>

      {/* ── KPIs principaux ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Entreprises enregistrées', val:fmtN(sum.enterprises),    sub:`${sum.enterprises_active||0} actives`,      color:'blue',   icon:Building2  },
          { label:'Individus TERAS',           val:fmtN(sum.individuals),    sub:`Score moyen: ${sum.avg_individual_score}`,  color:'emerald',icon:Users      },
          { label:'Revenus agrégés annuels',   val:fmtB(sum.total_annual_revenue), sub:'Entreprises formelles',              color:'purple', icon:DollarSign },
          { label:'Volume crédits actifs',     val:fmtB(sum.loans_volume),   sub:`Taux approbation: ${sum.loan_approval_rate}%`, color:'amber',icon:Activity },
        ].map(({label,val,sub,color,icon:Icon})=>(
          <div key={label} className={`bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5`}>
            <div className={`w-11 h-11 rounded-xl bg-${color}-500/20 flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 text-${color}-400`}/>
            </div>
            <p className="text-2xl font-bold text-white">{val}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
            <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Indicateurs macro ────────────────────────────────────────── */}
      {macro && (
        <div className="bg-gradient-to-br from-slate-900/80 to-blue-900/20 border border-blue-500/20 rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400"/> Indicateurs Macroéconomiques CEMAC
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label:'PIB Proxy TERAS',         val:fmtB(macro.gdp_proxy),          color:'sky'    },
              { label:'Emplois formels déclarés', val:fmtN(macro.formal_jobs),        color:'emerald'},
              { label:'Inclusion financière',     val:`${macro.inclusion_rate}%`,     color:'purple' },
              { label:'Score TERAS moyen global', val:macro.avg_enterprise_score,     color:'amber'  },
              { label:'Volume crédits total',     val:fmtB(macro.loan_total_volume),  color:'blue'   },
              { label:'Taux d\'approbation',      val:`${macro.approval_rate}%`,      color:'green'  },
              { label:'Taux défaut',              val:`${macro.default_rate}%`,       color:'red'    },
              { label:'Acteurs économiques',      val:fmtN(macro.total_actors),       color:'white'  },
            ].map(({label,val,color})=>(
              <div key={label} className="bg-slate-800/40 rounded-xl p-4">
                <p className="text-slate-400 text-xs mb-1">{label}</p>
                <p className={`text-${color==='white'?'white':color+'-400'} font-bold text-xl`}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Carte pays CEMAC ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-sky-400"/> Répartition par Pays
          <span className="text-slate-500 text-sm font-normal ml-2">Cliquez sur un pays pour l'analyse détaillée</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {countries.map((c: any) => {
            const isSelected = selectedCountry === c.code;
            const pct = maxRev > 0 ? Math.round((c.annual_revenue / maxRev) * 100) : 0;
            return (
              <div key={c.code}>
                <button onClick={() => loadCountry(c.code)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-500/40 shadow-lg shadow-sky-500/10'
                      : c.is_own_country
                        ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50'
                        : 'bg-slate-900/50 border-slate-800/50 hover:border-slate-600/50'
                  }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{FLAG[c.code]||'🌍'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold text-sm">{c.name}</p>
                          {c.is_own_country && <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-medium">Votre pays</span>}
                          {!c.is_own_country && <span className="px-1.5 py-0.5 bg-slate-700/50 text-slate-500 text-xs rounded-full">Données agrégées</span>}
                        </div>
                        <p className="text-slate-400 text-xs">{c.code} · {c.enterprises} entreprises · {c.individuals} individus</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isSelected?'rotate-90':''}`}/>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div><p className="text-slate-500 mb-0.5">Score moyen</p><p className={`font-bold ${SCORE_COLOR(c.avg_score)}`}>{c.avg_score||'—'}</p></div>
                    <div><p className="text-slate-500 mb-0.5">CA annuel</p><p className="text-white font-semibold">{fmtB(c.annual_revenue)}</p></div>
                    <div><p className="text-slate-500 mb-0.5">Emplois</p><p className="text-white font-semibold">{fmtN(c.employees)}</p></div>
                  </div>

                  <Bar pct={pct} color={c.avg_score>=600?'bg-emerald-500':c.avg_score>=400?'bg-amber-500':'bg-red-400'}/>
                  <p className="text-slate-600 text-xs mt-1">{pct}% du revenu total CEMAC</p>
                </button>

                {/* Détail pays expandé */}
                {isSelected && (
                  <div className="mt-2 bg-slate-900/80 border border-sky-500/20 rounded-2xl p-5 space-y-5">
                    {loadingDetail ? (
                      <div className="flex items-center justify-center py-6 gap-2 text-slate-400">
                        <RefreshCw className="w-4 h-4 animate-spin"/> Chargement…
                      </div>
                    ) : countryDetail ? (
                      <>
                        {/* Résumé crédits */}
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            {l:'Crédits totaux',   v:countryDetail.loans?.total||0,          c:'slate'},
                            {l:'Volume actif',     v:fmtB(countryDetail.loans?.active_volume||0), c:'emerald'},
                            {l:'Taux approbation', v:`${Math.round((countryDetail.loans?.approved||0)/Math.max(countryDetail.loans?.total||1,1)*100)}%`, c:'blue'},
                          ].map(({l,v,c})=>(
                            <div key={l} className="bg-slate-800/50 rounded-xl p-3 text-center">
                              <p className="text-slate-500 text-xs mb-0.5">{l}</p>
                              <p className={`text-${c==='slate'?'white':c+'-400'} font-bold`}>{v}</p>
                            </div>
                          ))}
                        </div>

                        {/* Score distribution */}
                        <div>
                          <p className="text-slate-400 text-xs font-semibold mb-2">Distribution Scores TERAS — Entreprises</p>
                          <div className="space-y-1.5">
                            {Object.entries(countryDetail.enterprises?.score_distribution||{}).map(([band,rawCount],i)=>{
                              const count = Number(rawCount);
                              const total = Object.values(countryDetail.enterprises?.score_distribution||{}).reduce<number>((sum,value)=>sum+Number(value),0)||1;
                              const pct   = Math.round((count/total)*100);
                              return (
                                <div key={band}>
                                  <div className="flex justify-between text-xs mb-0.5">
                                    <span className="text-slate-400">{band}</span>
                                    <span className="text-white font-medium">{count} ({pct}%)</span>
                                  </div>
                                  <Bar pct={pct} color={BAND_COLORS[i]||'bg-slate-500'}/>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Top entreprises */}
                        {countryDetail.enterprises?.top_enterprises?.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs font-semibold mb-2">Top Entreprises par Score TERAS</p>
                            <div className="space-y-2">
                              {countryDetail.enterprises.top_enterprises.slice(0,5).map((e:any,i:number)=>(
                                <div key={e.id} className="flex items-center justify-between py-2 border-b border-slate-800/40">
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-600 text-xs w-5">{i+1}.</span>
                                    <div>
                                      <p className="text-white text-sm font-medium">{e.name}</p>
                                      <p className="text-slate-500 text-xs">{e.sector||e.enterprise_type} · {e.city}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className={`font-bold ${SCORE_COLOR(e.teras_score)}`}>{e.teras_score}</p>
                                    <p className="text-slate-500 text-xs">{fmtB(e.annual_revenue)}/an</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Villes */}
                        {countryDetail.enterprises?.by_city?.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs font-semibold mb-2">Activité par Ville</p>
                            <div className="grid grid-cols-2 gap-2">
                              {countryDetail.enterprises.by_city.slice(0,4).map((city:any)=>(
                                <div key={city.city} className="bg-slate-800/30 rounded-xl p-2.5">
                                  <p className="text-white text-xs font-medium">{city.city}</p>
                                  <p className="text-slate-400 text-xs">{city.count} entr. · Score: {Math.round(city.avg_score||0)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tendance crédit */}
                        {countryDetail.loans?.trend_6months?.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs font-semibold mb-2">Tendance Crédit (6 mois)</p>
                            <div className="flex items-end gap-2 h-16">
                              {countryDetail.loans.trend_6months.map((m:any)=>{
                                const maxVol = Math.max(...countryDetail.loans.trend_6months.map((x:any)=>x.volume),1);
                                const h = maxVol > 0 ? Math.round((m.volume/maxVol)*100) : 2;
                                return(
                                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="w-full bg-blue-500 rounded-sm" style={{height:`${Math.max(h,4)}%`,minHeight:4}}/>
                                    <p className="text-slate-600 text-xs" style={{fontSize:9}}>{m.month.slice(0,3)}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    ) : countryDetail?.restricted ? (
                      <div className="bg-slate-800/40 rounded-xl p-6 text-center">
                        <p className="text-3xl mb-2">🔒</p>
                        <p className="text-slate-300 font-medium text-sm">{countryDetail.message}</p>
                        <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
                          <div className="bg-slate-800/50 rounded-lg p-2.5"><p className="text-slate-500 mb-0.5">Entreprises</p><p className="text-white font-bold text-base">{countryDetail.enterprises?.total||0}</p></div>
                          <div className="bg-slate-800/50 rounded-lg p-2.5"><p className="text-slate-500 mb-0.5">Score moyen</p><p className="text-white font-bold text-base">{countryDetail.enterprises?.avg_score||'—'}</p></div>
                          <div className="bg-slate-800/50 rounded-lg p-2.5"><p className="text-slate-500 mb-0.5">CA annuel</p><p className="text-white font-bold text-base">{countryDetail.enterprises?.annual_revenue ? (countryDetail.enterprises.annual_revenue/1e9).toFixed(1)+'Md FCFA' : '—'}</p></div>
                        </div>
                      </div>
                    ) : <p className="text-slate-500 text-sm text-center py-4">Données non disponibles pour ce pays.</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Carte utilisateurs géolocalisés ───────────────────────── */}
      <GovernmentUsersMap />

      {/* ── Secteurs économiques ─────────────────────────────────────── */}
      {sectors?.sectors?.length > 0 && (
        <div>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-400"/> Secteurs Économiques CEMAC
          </h2>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Secteur','Entreprises','CA total','Emplois','Score moyen','Pays','Part du CA'].map(h=>(
                      <th key={h} className={`p-4 text-slate-400 font-medium ${h==='Secteur'?'text-left':'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sectors.sectors.slice(0,12).map((s:any,i:number)=>{
                    const totalRev = sectors.summary?.total_revenue||1;
                    const share    = Math.round((s.revenue/totalRev)*100);
                    return(
                      <tr key={s.sector} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-8 rounded-full ${BAND_COLORS[i%BAND_COLORS.length]}`}/>
                            <div>
                              <p className="text-white font-medium">{s.label}</p>
                              <p className="text-slate-500 text-xs">{s.country_count} pays</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right text-white">{fmtN(s.count)}</td>
                        <td className="p-4 text-right text-white font-semibold">{fmtB(s.revenue)}</td>
                        <td className="p-4 text-right text-slate-300">{fmtN(s.employees)}</td>
                        <td className="p-4 text-right">
                          <span className={`font-bold ${SCORE_COLOR(s.avg_score)}`}>{s.avg_score||'—'}</span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-1 justify-end">
                            {s.countries.map((c:string)=><span key={c} className="text-base">{FLAG[c]||'🌍'}</span>)}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-white font-semibold">{share}%</span>
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${BAND_COLORS[i%BAND_COLORS.length]} rounded-full`} style={{width:`${share}%`}}/>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Alertes conformité ───────────────────────────────────────── */}
      {compliance && (
        <div>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400"/> Alertes Conformité
            <span className="px-2.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{compliance.total_at_risk}</span>
            <span className="text-slate-500 text-sm font-normal">Entreprises actives score &lt; {compliance.threshold}</span>
          </h2>
          {compliance.total_at_risk === 0 ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
              <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-3"/>
              <p className="text-white font-semibold">Aucune alerte — Tous les acteurs au-dessus du seuil</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Résumé par pays */}
              {compliance.by_country?.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {compliance.by_country.map((c:any)=>(
                    <div key={c.country} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <p className="text-white font-semibold text-sm">{c.country}</p>
                      <p className="text-red-400 font-bold text-xl">{c.count}</p>
                      <p className="text-slate-500 text-xs">Score moyen: {c.avg_score}</p>
                    </div>
                  ))}
                </div>
              )}
              {/* Liste top 10 alertes */}
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        {['Entreprise','Pays','Secteur','Score TERAS','CA annuel','Risque'].map(h=>(
                          <th key={h} className={`p-3 text-slate-400 font-medium ${h==='Entreprise'?'text-left':'text-center'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {compliance.alerts?.slice(0,10).map((a:any)=>(
                        <tr key={a.id} className="border-b border-slate-800/40 hover:bg-red-500/5 transition-colors">
                          <td className="p-3">
                            <p className="text-white font-medium">{a.name}</p>
                            <p className="text-slate-500 text-xs">{a.city}</p>
                          </td>
                          <td className="p-3 text-center"><span className="text-xl">{FLAG[a.country]||'🌍'}</span></td>
                          <td className="p-3 text-center text-slate-300 text-xs">{a.sector||'—'}</td>
                          <td className="p-3 text-center">
                            <span className={`font-bold ${SCORE_COLOR(a.teras_score)}`}>{a.teras_score}</span>
                          </td>
                          <td className="p-3 text-center text-slate-300">{fmtB(a.annual_revenue)}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              a.risk_level==='critique'?'bg-red-500/20 text-red-400':
                              a.risk_level==='élevé'   ?'bg-orange-500/20 text-orange-400':
                              'bg-amber-500/20 text-amber-400'
                            }`}>{a.risk_level}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bouton rapport IA ────────────────────────────────────────── */}
      <div className="flex justify-center pb-4">
        <button onClick={() => navigate('/government/reports')}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-sky-500/20">
          <BarChart3 className="w-5 h-5"/> Générer un rapport IA complet →
        </button>
      </div>
    </div>
  );
}
