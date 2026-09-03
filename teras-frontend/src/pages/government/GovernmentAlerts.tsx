// teras-frontend/src/pages/government/GovernmentAlerts.tsx
import React, { useState, useEffect } from 'react';
import { authFetch } from '../../services/authFetch';
import {
  AlertCircle, Shield, RefreshCw, Building2,
  TrendingDown, Globe2, Filter, BarChart3,
} from 'lucide-react';

const FLAG: Record<string,string> = {
  CG:'🇨🇬',CM:'🇨🇲',GA:'🇬🇦',CF:'🇨🇫',TD:'🇹🇩',GQ:'🇬🇶',CD:'🇨🇩',
};
const fmtB = (n:number) => {
  if(!n)return'0 FCFA';
  if(n>=1_000_000)return`${(n/1_000_000).toFixed(1)}M FCFA`;
  if(n>=1_000)return`${Math.round(n/1_000)}k FCFA`;
  return`${n.toLocaleString('fr-FR')} FCFA`;
};
const RISK_CFG: Record<string,{color:string;bg:string}> = {
  'critique':{ color:'text-red-400',    bg:'bg-red-500/10 border-red-500/20'    },
  'élevé':   { color:'text-orange-400', bg:'bg-orange-500/10 border-orange-500/20'},
  'moyen':   { color:'text-amber-400',  bg:'bg-amber-500/10 border-amber-500/20' },
};

export default function GovernmentAlerts() {
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [country, setCountry]   = useState('');
  const [threshold, setThreshold] = useState(500);
  const [search, setSearch]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (country)   params.set('country', country);
      params.set('threshold', String(threshold));
      const d = await authFetch(`/api/scoring/government/compliance/?${params}`).then(r=>r.json());
      setData(d);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [country, threshold]);

  const alerts: any[] = (data?.alerts || []).filter((a:any)=>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.city?.toLowerCase().includes(search.toLowerCase())
  );

  return(
    <div className="p-6 space-y-6">

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400"/> Alertes de Conformité
          </h1>
          <p className="text-slate-400 text-sm mt-1">Entreprises à risque — score TERAS insuffisant</p>
        </div>
        <button onClick={load} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors">
          <RefreshCw className="w-4 h-4"/>
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <select value={country} onChange={e=>setCountry(e.target.value)}
          className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none">
          <option value="">Tous pays CEMAC</option>
          {[['CG','Congo Brazza'],['CM','Cameroun'],['GA','Gabon'],['CF','Centrafrique'],['TD','Tchad'],['GQ','Guinée Éq.'],['CD','RD Congo']].map(([c,n])=>(
            <option key={c} value={c}>{FLAG[c]} {n}</option>
          ))}
        </select>
        <select value={threshold} onChange={e=>setThreshold(Number(e.target.value))}
          className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none">
          <option value={300}>Critique &lt; 300</option>
          <option value={400}>Élevé &lt; 400</option>
          <option value={500}>Moyen &lt; 500</option>
          <option value={600}>Surveillance &lt; 600</option>
        </select>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Rechercher une entreprise…"
          className="flex-1 min-w-48 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none placeholder-slate-500"/>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin text-red-400"/> Chargement…
        </div>
      ) : (
        <>
          {/* Stats */}
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {l:'Total à risque',   v:data.total_at_risk||0,                              c:'red',   i:AlertCircle },
                {l:'Critique (<300)',  v:(data.alerts||[]).filter((a:any)=>a.teras_score<300).length, c:'orange',i:TrendingDown},
                {l:'Pays concernés',  v:(data.by_country||[]).length,                        c:'amber', i:Globe2      },
                {l:'Seuil appliqué',  v:`< ${threshold} pts`,                               c:'slate', i:Filter      },
              ].map(({l,v,c,i:Icon})=>(
                <div key={l} className={`bg-${c==='slate'?'slate-900/50':`${c}-500/10 border-${c}-500/20`} border border-slate-800/50 rounded-2xl p-4 flex items-center gap-3`}>
                  <div className={`w-10 h-10 rounded-xl bg-${c}-500/20 flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 text-${c}-400`}/>
                  </div>
                  <div>
                    <p className={`text-xl font-bold text-${c==='slate'?'white':c+'-400'}`}>{v}</p>
                    <p className="text-slate-400 text-xs">{l}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Résumé par pays */}
          {data?.by_country?.length > 0 && (
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-red-400"/> Répartition par pays
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data.by_country.map((c:any)=>(
                  <div key={c.country} className="bg-red-500/5 border border-red-500/15 rounded-xl p-3 text-center">
                    <p className="text-2xl mb-1">{FLAG[c.country.split(' ')[0]]||'🌍'}</p>
                    <p className="text-white font-semibold text-sm">{c.country}</p>
                    <p className="text-red-400 font-bold text-xl">{c.count}</p>
                    <p className="text-slate-500 text-xs">Score moy: {c.avg_score}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liste alertes */}
          {alerts.length === 0 ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-12 text-center">
              <Shield className="w-14 h-14 text-emerald-400 mx-auto mb-4"/>
              <h3 className="text-white font-bold text-lg mb-2">Aucune alerte détectée</h3>
              <p className="text-slate-400 text-sm">Tous les acteurs sont au-dessus du seuil de {threshold} points.</p>
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
                <h3 className="text-white font-semibold">{alerts.length} entreprises à surveiller</h3>
                <span className="text-slate-500 text-xs">Score &lt; {threshold} pts · actives</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {['Entreprise','Pays','Secteur','Score','CA annuel','Emplois','Crédits actifs','Risque'].map(h=>(
                        <th key={h} className={`p-3 text-slate-400 font-medium ${h==='Entreprise'?'text-left':'text-center'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((a:any)=>{
                      const r = RISK_CFG[a.risk_level]||RISK_CFG['moyen'];
                      return(
                        <tr key={a.id} className="border-b border-slate-800/40 hover:bg-red-500/5 transition-colors">
                          <td className="p-3">
                            <p className="text-white font-medium">{a.name}</p>
                            <p className="text-slate-500 text-xs">{a.city}</p>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-xl" title={a.country_name}>{FLAG[a.country]||'🌍'}</span>
                          </td>
                          <td className="p-3 text-center text-slate-300 text-xs">{a.sector||'—'}</td>
                          <td className="p-3 text-center">
                            <span className="font-bold text-red-400 text-base">{a.teras_score}</span>
                          </td>
                          <td className="p-3 text-center text-slate-300">{fmtB(a.annual_revenue)}</td>
                          <td className="p-3 text-center text-slate-300">{a.employees_count||0}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${a.active_loans>0?'bg-amber-500/10 text-amber-400':'text-slate-500'}`}>
                              {a.active_loans||0}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${r.bg} ${r.color}`}>
                              {a.risk_level}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
