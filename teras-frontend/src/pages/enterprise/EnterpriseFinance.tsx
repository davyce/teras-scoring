// teras-frontend/src/pages/enterprise/EnterpriseFinance.tsx
import React, { useState, useEffect } from 'react';
import { authFetch } from '../../services/authFetch';
import {
  Bell, MessageCircle, DollarSign, Package, Calculator,
  CheckCircle, XCircle, Clock, RefreshCw, AlertCircle,
  Send, Info, ChevronDown, ChevronUp, MailOpen,
  TrendingUp, Shield, Calendar, Star, ArrowRight, Zap,
} from 'lucide-react';

const fmt = (v: string | number) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (!n || isNaN(n)) return '0 FCFA';
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M FCFA`;
  if (n >= 1_000)     return `${Math.round(n/1_000)}k FCFA`;
  return `${n.toLocaleString('fr-FR')} FCFA`;
};
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'}) : '—';
const addDays = (d: string, n: number) => { const dt=new Date(d); dt.setDate(dt.getDate()+n); return dt.toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'}); };
async function readApiPayload(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
    return {
      error: isHtml
        ? `Le serveur a renvoyé une page HTML (${res.status}).`
        : text.slice(0, 300),
    };
  }
}
function apiErrorMessage(payload: any, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (payload.error) return String(payload.error);
  if (payload.detail) return String(payload.detail);
  if (payload.message) return String(payload.message);
  return fallback;
}
const TYPE_ICON: Record<string,string> = { microcredit:'💰',personal:'💳',salary:'🏛',auto:'🚗',immobilier:'🏠',pme:'🏢',agricole:'🌾',education:'📚',other:'📦' };
const MSG_CFG: Record<string,{color:string;bg:string;Icon:React.ElementType}> = {
  info:    {color:'text-blue-400',   bg:'bg-blue-500/10 border-blue-500/20',      Icon:Info       },
  offer:   {color:'text-emerald-400',bg:'bg-emerald-500/10 border-emerald-500/20',Icon:Package    },
  reminder:{color:'text-amber-400',  bg:'bg-amber-500/10 border-amber-500/20',    Icon:Clock      },
  alert:   {color:'text-red-400',    bg:'bg-red-500/10 border-red-500/20',        Icon:AlertCircle},
};

function ApplyModal({product,onClose,onDone}:{product:any;onClose:()=>void;onDone:()=>void}) {
  const [amount,setAmount]=useState('');
  const [duration,setDuration]=useState('');
  const [purpose,setPurpose]=useState('');
  const [sim,setSim]=useState<any>(null);
  const [sending,setSending]=useState(false);
  const [success,setSuccess]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{
    if (!amount||!duration){setSim(null);return;}
    const rate=parseFloat(product.interest_rate)/100/12;
    const n=parseInt(duration); const amt=parseFloat(amount);
    if(isNaN(amt)||isNaN(n)||n<=0)return;
    const monthly=rate>0?amt*(rate*Math.pow(1+rate,n))/(Math.pow(1+rate,n)-1):amt/n;
    setSim({monthly:Math.round(monthly),total:Math.round(monthly*n),interest:Math.round(monthly*n-amt)});
  },[amount,duration,product]);

  const submit=async()=>{
    if(!amount||!duration||!purpose){setError('Tous les champs sont requis');return;}
    setSending(true);setError('');
    try{
      const res=await authFetch('/api/scoring/enterprise/my-applications/request/',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({product_id:product.id,requested_amount:amount,duration_months:parseInt(duration),purpose}),
      });
      const payload = await readApiPayload(res);
      if(!res.ok){throw new Error(apiErrorMessage(payload, `Erreur ${res.status}`));}
      setSuccess(true);
    }catch(e:any){setError(e.message);}
    finally{setSending(false);}
  };

  if(success)return(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1829] border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center">
        <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4"/>
        <h3 className="text-white font-bold text-xl mb-2">Demande envoyée !</h3>
        <p className="text-slate-400 text-sm mb-6">Votre demande de <strong className="text-white">{product.name}</strong> a été transmise. Réponse sous 24–48h.</p>
        <button onClick={()=>{onDone();onClose();}} className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm">Fermer</button>
      </div>
    </div>
  );

  return(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="bg-[#0d1829] border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-[#0d1829]">
          <div><p className="text-slate-400 text-xs">Demande de financement</p><h3 className="text-white font-bold">{product.name}</h3></div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-slate-800/40 rounded-xl p-3 grid grid-cols-3 gap-2 text-xs">
            <div><p className="text-slate-500 mb-0.5">Taux</p><p className="text-white font-semibold">{product.interest_rate}%/an</p></div>
            <div><p className="text-slate-500 mb-0.5">Montant</p><p className="text-white font-semibold">{fmt(product.min_amount)}–{fmt(product.max_amount)}</p></div>
            <div><p className="text-slate-500 mb-0.5">Durée</p><p className="text-white font-semibold">{product.min_duration_months}–{product.max_duration_months} mois</p></div>
          </div>
          <div>
            <label className="text-slate-300 text-xs font-medium mb-1 block">Montant (FCFA) *</label>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder={`Max: ${fmt(product.max_amount)}`}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"/>
          </div>
          <div>
            <label className="text-slate-300 text-xs font-medium mb-1 block">Durée (mois) *</label>
            <select value={duration} onChange={e=>setDuration(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500">
              <option value="">Choisir</option>
              {Array.from({length:product.max_duration_months-product.min_duration_months+1},(_,i)=>product.min_duration_months+i)
                .filter(m=>m<=6||m%3===0||m===product.max_duration_months).slice(0,10)
                .map(m=><option key={m} value={m}>{m} mois</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-300 text-xs font-medium mb-1 block">Objet du financement *</label>
            <textarea value={purpose} onChange={e=>setPurpose(e.target.value)} rows={2}
              placeholder="Ex: Achat d'équipements, extension des locaux, fonds de roulement..."
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 resize-none"/>
          </div>
          {sim&&(
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 grid grid-cols-3 gap-2 text-xs">
              <div><p className="text-slate-400 mb-0.5">Mensualité</p><p className="text-white font-bold text-base">{fmt(sim.monthly)}</p></div>
              <div><p className="text-slate-400 mb-0.5">Total</p><p className="text-white">{fmt(sim.total)}</p></div>
              <div><p className="text-slate-400 mb-0.5">Intérêts</p><p className="text-amber-400">{fmt(sim.interest)}</p></div>
            </div>
          )}
          {error&&<p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm">Annuler</button>
            <button onClick={submit} disabled={sending}
              className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
              {sending?<><RefreshCw className="w-4 h-4 animate-spin"/>Envoi…</>:<><Send className="w-4 h-4"/>Envoyer</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EnterpriseFinance() {
  const [tab,setTab]=useState<'credits'|'produits'|'simulator'|'messages'>('credits');
  const [messages,setMessages]=useState<any[]>([]);
  const [applications,setApps]=useState<any[]>([]);
  const [summary,setSummary]=useState<any>({});
  const [products,setProducts]=useState<any[]>([]);
  const [profile,setProfile]=useState<any>(null);
  const [unread,setUnread]=useState(0);
  const [loading,setLoading]=useState(true);
  const [expanded,setExpanded]=useState<number|null>(null);
  const [applying,setApplying]=useState<any|null>(null);
  const [accepting,setAccepting]=useState<number|null>(null);
  const [declining,setDeclining]=useState<number|null>(null);
  const [actionMsg,setActionMsg]=useState<{text:string;ok:boolean}|null>(null);
  const [simProduct,setSimProduct]=useState('');
  const [simAmount,setSimAmount]=useState('');
  const [simDuration,setSimDuration]=useState('');
  const [simResult,setSimResult]=useState<any>(null);

  const load=async()=>{
    setLoading(true);
    await Promise.all([
      authFetch('/api/scoring/enterprise/bank-messages/').then(r=>r.json()).then(d=>{setMessages(d.messages||[]);setUnread(d.unread_count||0);}).catch(()=>{}),
      authFetch('/api/scoring/enterprise/my-applications/').then(r=>r.json()).then(d=>{setApps(d.applications||[]);setSummary(d.summary||{});}).catch(()=>{}),
      authFetch('/api/scoring/enterprise/products/').then(r=>r.json()).then(d=>setProducts(Array.isArray(d)?d:[])).catch(()=>{}),
      authFetch('/api/scoring/enterprise/bank-profile/').then(r=>r.json()).then(d=>setProfile(d)).catch(()=>{}),
    ]);
    setLoading(false);
  };
  useEffect(()=>{load();},[]);

  const markRead=async(id:number)=>{
    await authFetch(`/api/scoring/enterprise/bank-messages/${id}/read/`,{method:'POST'});
    setMessages(p=>p.map(m=>m.id===id?{...m,is_read:true}:m));
    setUnread(p=>Math.max(0,p-1));
  };
  const handleAccept=async(appId:number)=>{
    setAccepting(appId);setActionMsg(null);
    try{
      const res=await authFetch(`/api/scoring/enterprise/my-applications/${appId}/accept/`,{method:'POST'});
      const payload = await readApiPayload(res);
      if(res.ok){
        setActionMsg({text:apiErrorMessage(payload,'✅ Financement accepté ! Virement sous 24–48h.'),ok:true});
        load();
      } else {
        setActionMsg({text:`❌ ${apiErrorMessage(payload, `Erreur ${res.status}`)}`,ok:false});
      }
    }catch(e:any){setActionMsg({text:`❌ ${e.message}`,ok:false});}
    finally{setAccepting(null);}
  };
  const handleDecline=async(appId:number)=>{
    setDeclining(appId);
    try{
      const res = await authFetch(`/api/scoring/enterprise/my-applications/${appId}/decline/`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason:"Refus entreprise"})});
      const payload = await readApiPayload(res);
      if(!res.ok) throw new Error(apiErrorMessage(payload, `Erreur ${res.status}`));
      setActionMsg({text:apiErrorMessage(payload,'Demande annulée.'),ok:true});
      load();
    }catch(e:any){
      setActionMsg({text:`❌ ${e.message}`,ok:false});
    }
    finally{setDeclining(null);}
  };

  const selectedProduct=products.find(p=>String(p.id)===simProduct);
  const runSim=()=>{
    if(!selectedProduct||!simAmount||!simDuration)return;
    const rate=parseFloat(selectedProduct.interest_rate)/100/12;
    const n=parseInt(simDuration);const amt=parseFloat(simAmount);
    const fees=amt*(parseFloat(selectedProduct.origination_fee||'1.5')/100);
    const monthly=rate>0?amt*(rate*Math.pow(1+rate,n))/(Math.pow(1+rate,n)-1):amt/n;
    setSimResult({monthly:Math.round(monthly),total:Math.round(monthly*n),interest:Math.round(monthly*n-amt),fees:Math.round(fees)});
  };

  const approvedApps=applications.filter(a=>a.status==='approved');
  const activeApps=applications.filter(a=>a.status==='disbursed');
  const pendingApps=applications.filter(a=>['pending','review'].includes(a.status));

  return(
    <div className="min-h-screen bg-[#0b1220] p-4 md:p-6">
      {applying&&<ApplyModal product={applying} onClose={()=>setApplying(null)} onDone={load}/>}
      <div className="max-w-3xl mx-auto space-y-5">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3"><DollarSign className="w-6 h-6 text-sky-400"/>Financement Entreprise</h1>
            <p className="text-slate-400 text-sm mt-0.5">Crédits, produits financiers et communications bancaires</p>
          </div>
          <button onClick={load} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"><RefreshCw className="w-4 h-4"/></button>
        </div>

        {profile?.has_bank_profile&&(
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 flex items-center gap-4">
            <Shield className="w-8 h-8 text-sky-400 shrink-0"/>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{profile.name}</p>
              <p className="text-slate-400 text-xs">{profile.legal_name} · Score : <span className="text-sky-400 font-bold">{profile.teras_score||'—'}</span> · CRM : <span className="text-emerald-400 font-bold">{fmt(profile.crm_limit)}/mois</span></p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${(profile.teras_score||0)>=600?'bg-emerald-500/10 text-emerald-400':'bg-amber-500/10 text-amber-400'}`}>{profile.teras_band||'N/A'}</span>
          </div>
        )}
        {profile&&!profile.has_bank_profile&&(
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5"/>
            <p className="text-amber-400 text-sm">Pas encore de profil bancaire. Contactez votre conseiller TERAS Banque pour créer votre dossier.</p>
          </div>
        )}

        {actionMsg&&(
          <div className={`rounded-xl p-3 text-sm border flex items-center gap-2 ${actionMsg.ok?'bg-emerald-500/10 border-emerald-500/30 text-emerald-300':'bg-red-500/10 border-red-500/30 text-red-300'}`}>
            {actionMsg.text}<button onClick={()=>setActionMsg(null)} className="ml-auto text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        <div className="flex gap-1 bg-slate-900/50 border border-slate-800/50 rounded-2xl p-1.5">
          {([
            {id:'credits',  label:'Mes Financements',badge:approvedApps.length||undefined,color:'emerald'},
            {id:'produits', label:'Demander',        badge:null,                           color:'blue'  },
            {id:'simulator',label:'Simulateur',      badge:null,                           color:'purple'},
            {id:'messages', label:'Messages',        badge:unread||undefined,              color:'sky'   },
          ] as const).map(({id,label,badge,color})=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${tab===id?`bg-${color}-500/20 text-${color}-400`:'text-slate-400 hover:text-white'}`}>
              {label}
              {badge!=null&&badge>0&&<span className={`bg-${color}-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}>{badge}</span>}
            </button>
          ))}
        </div>

        {loading?(
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400"><RefreshCw className="w-5 h-5 animate-spin text-sky-400"/>Chargement…</div>
        ):(
          <>
          {tab==='credits'&&(
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-3">
                {[
                  {label:'Total',     val:summary.total||0,    color:'slate'  },
                  {label:'En attente',val:summary.pending||0,  color:'amber'  },
                  {label:'Approuvés', val:approvedApps.length, color:'emerald'},
                  {label:'Actifs',    val:activeApps.length,   color:'sky'    },
                ].map(({label,val,color})=>(
                  <div key={label} className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-3 text-center">
                    <p className={`text-${color}-400 font-bold text-2xl`}>{val}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {approvedApps.length>0&&(
                <div className="space-y-3">
                  <h3 className="text-white font-semibold flex items-center gap-2"><Star className="w-4 h-4 text-emerald-400"/>Offres à accepter<span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">{approvedApps.length}</span></h3>
                  {approvedApps.map(app=>(
                    <div key={app.id} className="bg-emerald-500/5 border-2 border-emerald-500/30 rounded-2xl p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-white font-bold text-lg">{TYPE_ICON[app.product_type]||'💳'} {app.product_name}</p>
                          <p className="text-slate-400 text-xs">{app.application_id}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-semibold">✓ Approuvé</span>
                          {app.reviewed_at&&<p className="text-amber-400 text-xs mt-1 flex items-center gap-1 justify-end"><Calendar className="w-3 h-3"/>Expire le {addDays(app.reviewed_at,7)}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {[
                          {l:'Montant',    v:fmt(app.requested_amount),  c:'emerald'},
                          {l:'Mensualité', v:fmt(app.monthly_payment),   c:'white'  },
                          {l:'Durée',      v:`${app.duration_months} mois`, c:'white'},
                          {l:'Taux',       v:`${app.interest_rate}%/an`,    c:'white'},
                        ].map(({l,v,c})=>(
                          <div key={l} className="bg-slate-800/50 rounded-lg p-2.5 text-center">
                            <p className="text-slate-500 text-xs mb-0.5">{l}</p>
                            <p className={`${c==='emerald'?'text-emerald-400':'text-white'} font-bold text-sm`}>{v}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button onClick={()=>handleDecline(app.id)} disabled={!!declining}
                          className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 rounded-xl text-sm flex items-center gap-2">
                          {declining===app.id?<RefreshCw className="w-4 h-4 animate-spin"/>:<XCircle className="w-4 h-4"/>}Décliner
                        </button>
                        <button onClick={()=>handleAccept(app.id)} disabled={!!accepting}
                          className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                          {accepting===app.id?<><RefreshCw className="w-4 h-4 animate-spin"/>Traitement…</>:<><CheckCircle className="w-4 h-4"/>Accepter et encaisser</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeApps.map(app=>(
                <div key={app.id} className="bg-slate-900/50 border border-sky-500/20 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div><p className="text-white font-semibold">{app.product_name}</p><p className="text-slate-400 text-xs">{app.application_id}</p></div>
                    <span className="px-2.5 py-1 bg-sky-500/10 text-sky-400 text-xs rounded-full font-semibold">🟢 Actif</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-800/40 rounded-lg p-3"><p className="text-slate-500 text-xs mb-0.5">Montant</p><p className="text-white font-bold">{fmt(app.requested_amount)}</p></div>
                    <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-3"><p className="text-slate-500 text-xs mb-0.5">Mensualité</p><p className="text-sky-400 font-bold">{fmt(app.monthly_payment)}</p></div>
                    <div className="bg-slate-800/40 rounded-lg p-3"><p className="text-slate-500 text-xs mb-0.5">Durée</p><p className="text-white font-bold">{app.duration_months} mois</p></div>
                  </div>
                </div>
              ))}

              {pendingApps.map(app=>(
                <div key={app.id} className="bg-slate-900/50 border border-amber-500/20 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-white font-medium text-sm">{app.product_name}</p><p className="text-slate-400 text-xs">{fmt(app.requested_amount)} · {app.duration_months} mois · {fmtDate(app.created_at)}</p></div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">{[1,2,3].map(i=><div key={i} className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" style={{animationDelay:`${i*0.2}s`}}/>)}</div>
                      <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full">En attente banque</span>
                    </div>
                  </div>
                </div>
              ))}

              {applications.length===0&&(
                <div className="text-center py-14">
                  <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3"/>
                  <p className="text-white font-medium mb-1">Aucune demande de financement</p>
                  <button onClick={()=>setTab('produits')} className="mt-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm flex items-center gap-2 mx-auto"><Package className="w-4 h-4"/>Découvrir les produits</button>
                </div>
              )}
            </div>
          )}

          {tab==='produits'&&(
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5"/>
                <div><p className="text-blue-400 font-medium text-sm">Financements pour votre entreprise</p><p className="text-slate-400 text-xs mt-0.5">Soumettez votre demande en ligne. Réponse de votre conseiller sous 24–48h.</p></div>
              </div>
              {products.filter(p=>p.is_active&&['pme','immobilier','agricole','education'].includes(p.product_type)).map(p=>(
                <div key={p.id} className="bg-slate-900/50 border border-slate-800/50 hover:border-sky-500/30 rounded-2xl p-5 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{TYPE_ICON[p.product_type]||'💳'}</span>
                      <div><p className="text-white font-semibold">{p.name}</p><p className="text-slate-400 text-xs">{p.description?.slice(0,70)}…</p></div>
                    </div>
                    <div className="text-right shrink-0 ml-3"><p className="text-white font-bold">{p.interest_rate}%<span className="text-slate-400 text-xs">/an</span></p><p className="text-slate-500 text-xs">Score ≥ {p.min_score_required}</p></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-4"><span>{fmt(p.min_amount)} → {fmt(p.max_amount)}</span><span>{p.min_duration_months}–{p.max_duration_months} mois</span></div>
                  {p.features?.length>0&&<div className="flex flex-wrap gap-1 mb-4">{p.features.slice(0,3).map((f:string,i:number)=><span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full">✓ {f}</span>)}</div>}
                  <button onClick={()=>setApplying(p)} className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"><Send className="w-4 h-4"/>Faire une demande</button>
                </div>
              ))}
              {products.length===0&&<div className="text-center py-10 text-slate-500">Aucun produit disponible.</div>}
            </div>
          )}

          {tab==='simulator'&&(
            <div className="space-y-5">
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 space-y-4">
                <h3 className="text-white font-bold flex items-center gap-2"><Calculator className="w-5 h-5 text-purple-400"/>Simuler un financement</h3>
                <div>
                  <label className="text-slate-300 text-xs font-medium mb-1.5 block">Produit</label>
                  <select value={simProduct} onChange={e=>{setSimProduct(e.target.value);setSimResult(null);}}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500">
                    <option value="">Choisir un produit</option>
                    {products.filter(p=>p.is_active).map(p=><option key={p.id} value={p.id}>{p.name} — {p.interest_rate}%/an</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 text-xs font-medium mb-1.5 block">Montant (FCFA)</label>
                    <input type="number" value={simAmount} onChange={e=>{setSimAmount(e.target.value);setSimResult(null);}}
                      placeholder={selectedProduct?`Max: ${fmt(selectedProduct.max_amount)}`:'Montant'}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"/>
                  </div>
                  <div>
                    <label className="text-slate-300 text-xs font-medium mb-1.5 block">Durée (mois)</label>
                    <input type="number" value={simDuration} onChange={e=>{setSimDuration(e.target.value);setSimResult(null);}}
                      placeholder={selectedProduct?`${selectedProduct.max_duration_months}`:'Durée'}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"/>
                  </div>
                </div>
                <button onClick={runSim} disabled={!simProduct||!simAmount||!simDuration}
                  className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4"/>Calculer
                </button>
              </div>
              {simResult&&(
                <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6 space-y-4">
                  <div className="text-center py-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <p className="text-slate-400 text-sm mb-1">Mensualité estimée</p>
                    <p className="text-5xl font-black text-white">{fmt(simResult.monthly)}</p>
                    <p className="text-purple-400 text-sm mt-1">pendant {simDuration} mois</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[{l:'Total',v:fmt(simResult.total),c:'white'},{l:'Intérêts',v:fmt(simResult.interest),c:'amber-400'},{l:'Frais',v:fmt(simResult.fees),c:'slate-400'}].map(({l,v,c})=>(
                      <div key={l} className="bg-slate-800/50 rounded-xl p-3 text-center"><p className="text-slate-500 text-xs mb-1">{l}</p><p className={`text-${c} font-bold text-sm`}>{v}</p></div>
                    ))}
                  </div>
                  <button onClick={()=>{setTab('produits');if(selectedProduct)setApplying(selectedProduct);}}
                    className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                    <Send className="w-4 h-4"/>Faire une demande<ArrowRight className="w-4 h-4"/>
                  </button>
                </div>
              )}
            </div>
          )}

          {tab==='messages'&&(
            <div className="space-y-3">
              {unread>0&&(
                <div className="flex justify-end">
                  <button onClick={async()=>{await authFetch('/api/scoring/enterprise/bank-messages/read-all/',{method:'POST'});setMessages(p=>p.map(m=>({...m,is_read:true})));setUnread(0);}}
                    className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1.5">
                    <MailOpen className="w-3.5 h-3.5"/>Tout marquer lu
                  </button>
                </div>
              )}
              {messages.length===0?(
                <div className="text-center py-14"><MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-3"/><p className="text-slate-400 text-sm">Aucun message de votre conseiller.</p></div>
              ):messages.map(msg=>{
                const cfg=MSG_CFG[msg.type]||MSG_CFG.info;
                const isOpen=expanded===msg.id;
                return(
                  <div key={msg.id} onClick={()=>{setExpanded(isOpen?null:msg.id);if(!msg.is_read)markRead(msg.id);}}
                    className={`border rounded-2xl overflow-hidden cursor-pointer transition-all ${!msg.is_read?'border-sky-500/30 bg-sky-500/5':'border-slate-800/50 bg-slate-900/50'}`}>
                    <div className="flex items-start gap-3 p-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border`}><cfg.Icon className={`w-4 h-4 ${cfg.color}`}/></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><p className={`text-sm font-semibold ${!msg.is_read?'text-white':'text-slate-300'}`}>{msg.subject}</p>{!msg.is_read&&<span className="w-2 h-2 bg-sky-400 rounded-full shrink-0"/>}</div>
                        <p className="text-slate-500 text-xs mt-0.5">{msg.sender_name} · {new Date(msg.created_at).toLocaleDateString('fr-FR')}</p>
                        {!isOpen&&<p className="text-slate-400 text-xs mt-1 truncate">{msg.body?.slice(0,80)}…</p>}
                      </div>
                      {isOpen?<ChevronUp className="w-4 h-4 text-slate-500 shrink-0"/>:<ChevronDown className="w-4 h-4 text-slate-500 shrink-0"/>}
                    </div>
                    {isOpen&&(
                      <div className="px-4 pb-4 border-t border-slate-800/50 pt-3">
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{msg.body}</p>
                        {msg.type==='offer'&&<button onClick={e=>{e.stopPropagation();setTab('credits');}} className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-medium flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5"/>Voir et accepter l'offre →</button>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
