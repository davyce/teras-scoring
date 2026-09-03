// teras-frontend/src/pages/government/GovernmentSectors.tsx
import React, { useState, useEffect } from 'react';
import { authFetch } from '../../services/authFetch';
import {
  Briefcase, RefreshCw, TrendingUp, Users,
  DollarSign, BarChart3, Filter, Globe2,
} from 'lucide-react';

const FLAG: Record<string,string> = {
  CG:'🇨🇬',CM:'🇨🇲',GA:'🇬🇦',CF:'🇨🇫',TD:'🇹🇩',GQ:'🇬🇶',CD:'🇨🇩',
};
const CEMAC = ['','CG','CM','GA','CF','TD','GQ','CD'];
const COLORS = [
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-indigo-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-cyan-500 to-sky-600',
  'from-violet-500 to-purple-600',
  'from-green-500 to-emerald-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
  'from-teal-500 to-cyan-600',
  'from-indigo-500 to-violet-600',
];
const fmtB = (n:number) => {
  if(!n)return'0 FCFA';
  if(n>=1_000_000_000)return`${(n/1_000_000_000).toFixed(1)}Md FCFA`;
  if(n>=1_000_000)return`${(n/1_000_000).toFixed(1)}M FCFA`;
  if(n>=1_000)return`${Math.round(n/1_000)}k FCFA`;
  return`${n.toLocaleString('fr-FR')} FCFA`;
};
const fmtN = (n:number) => n?.toLocaleString('fr-FR')||'0';
const SC   = (s:number) => s>=700?'text-emerald-400':s>=500?'text-amber-400':s>=300?'text-orange-400':'text-red-400';

export default function GovernmentSectors() {
  const [data, setData]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [country, setCountry]     = useState('');
  const [sortBy, setSortBy]       = useState<'revenue'|'count'|'avg_score'>('revenue');

  const load = async (c = country) => {
    setLoading(true);
    try {
      const url = `/api/scoring/government/sectors/${c?`?country=${c}`:''}`;
      const d   = await authFetch(url).then(r=>r.json());
      setData(d);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const sectors: any[] = data?.sectors || [];
  const sorted  = [...sectors].sort((a,b)=>b[sortBy]-a[sortBy]);
  const sum     = data?.summary || {};
  const maxRev  = Math.max(...sectors.map(s=>s.revenue), 1);

  return(
    <div className="p-6 space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-purple-400"/> Secteurs Économiques CEMAC
          </h1>
          <p className="text-slate-400 text-sm mt-1">Analyse sectorielle — données entreprises TERAS</p>
        </div>
        <button onClick={()=>load(country)} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors">
          <RefreshCw className="w-4 h-4"/>
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800/50 rounded-xl px-3 py-2">
          <Globe2 className="w-4 h-4 text-slate-400"/>
          <select value={country} onChange={e=>{setCountry(e.target.value);load(e.target.value);}}
            className="bg-transparent text-white text-sm focus:outline-none">
            <option value="">Zone CEMAC complète</option>
            {[['CG','Congo Brazza'],['CM','Cameroun'],['GA','Gabon'],['CF','Centrafrique'],['TD','Tchad'],['GQ','Guinée Éq.'],['CD','RD Congo']].map(([c,n])=>(
              <option key={c} value={c}>{FLAG[c]} {n}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800/50 rounded-xl px-3 py-2">
          <Filter className="w-4 h-4 text-slate-400"/>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)}
            className="bg-transparent text-white text-sm focus:outline-none">
            <option value="revenue">Trier par CA</option>
            <option value="count">Trier par nombre</option>
            <option value="avg_score">Trier par score</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      {!loading && sum && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {l:'Entreprises analysées',v:fmtN(sum.total_enterprises),   c:'blue',   i:Users     },
            {l:'CA total',             v:fmtB(sum.total_revenue),        c:'emerald',i:DollarSign},
            {l:'Emplois formels',      v:fmtN(sum.total_employees),      c:'purple', i:Briefcase },
            {l:'Secteurs identifiés',  v:sum.sectors_count||0,           c:'amber',  i:BarChart3 },
          ].map(({l,v,c,i:Icon})=>(
            <div key={l} className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-${c}-500/20 flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 text-${c}-400`}/>
              </div>
              <div>
                <p className="text-xl font-bold text-white">{v}</p>
                <p className="text-slate-400 text-xs">{l}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-400"/> Chargement…
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-14 text-slate-500">
          <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-700"/>
          <p>Aucune donnée sectorielle disponible.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Graphique à barres horizontal */}
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400"/> Répartition du CA par secteur
            </h3>
            <div className="space-y-3">
              {sorted.slice(0,10).map((s,i)=>{
                const pct = Math.round((s.revenue/maxRev)*100);
                return(
                  <div key={s.sector}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-white font-medium">{s.label}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-400">{s.count} entr.</span>
                        <span className={`font-semibold ${SC(s.avg_score)}`}>{s.avg_score||'—'} pts</span>
                        <span className="text-white font-semibold">{fmtB(s.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${COLORS[i%COLORS.length]} rounded-full transition-all duration-700`}
                        style={{width:`${pct}%`}}/>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {s.countries?.map((c:string)=><span key={c} className="text-sm">{FLAG[c]||'🌍'}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tableau détaillé */}
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800/50">
              <h3 className="text-white font-semibold">Analyse détaillée par secteur</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Secteur','Entreprises','CA annuel','Emplois','Score moy.','Présence','Poids CA'].map(h=>(
                      <th key={h} className={`p-4 text-slate-400 font-medium ${h==='Secteur'?'text-left':'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s,i)=>{
                    const totalRev = sum.total_revenue||1;
                    const share    = Math.round((s.revenue/totalRev)*100);
                    return(
                      <tr key={s.sector} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-8 rounded-full bg-gradient-to-b ${COLORS[i%COLORS.length]}`}/>
                            <div>
                              <p className="text-white font-medium">{s.label}</p>
                              <p className="text-slate-500 text-xs">{s.country_count} pays</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right text-white">{fmtN(s.count)}</td>
                        <td className="p-4 text-right">
                          <span className="text-white font-semibold">{fmtB(s.revenue)}</span>
                        </td>
                        <td className="p-4 text-right text-slate-300">{fmtN(s.employees)}</td>
                        <td className="p-4 text-right">
                          <span className={`font-bold ${SC(s.avg_score)}`}>{s.avg_score||'—'}</span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-1 justify-end flex-wrap">
                            {s.countries?.map((c:string)=><span key={c}>{FLAG[c]||'🌍'}</span>)}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-white font-semibold">{share}%</span>
                            <div className="w-14 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full bg-gradient-to-r ${COLORS[i%COLORS.length]} rounded-full`}
                                style={{width:`${share}%`}}/>
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
    </div>
  );
}
