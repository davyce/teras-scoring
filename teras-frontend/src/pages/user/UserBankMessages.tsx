// teras-frontend/src/pages/user/UserBankMessages.tsx
// teras-frontend/src/pages/user/UserBankMessages.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { authFetch } from '../../services/authFetch';
import {
  Bell, MessageCircle, CheckCircle, XCircle, Clock,
  RefreshCw, DollarSign, AlertCircle, Info, Package,
  ChevronRight, MailOpen, ChevronDown, ChevronUp,
  Calculator, TrendingUp, Calendar, Send, Zap,
  ArrowRight, Shield, Star,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(val: string | number): string {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (!n || isNaN(n)) return '0 FCFA';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}k FCFA`;
  return `${n.toLocaleString('fr-FR')} FCFA`;
}
function fmtDate(d?: string, short = false) {
  if (!d) return '—';
  const date = new Date(d);
  if (short) return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  const now  = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diff < 1)    return "À l'instant";
  if (diff < 60)   return `Il y a ${diff} min`;
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function addDays(d: string, days: number) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + days);
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
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
function daysUntil(d: string) {
  const dt   = new Date(d);
  const now  = new Date();
  const diff = Math.ceil((dt.getTime() - now.getTime()) / (1000 * 3600 * 24));
  return diff;
}

const MSG_CFG: Record<string, { color: string; bg: string; Icon: React.ElementType }> = {
  info:     { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',      Icon: Info        },
  offer:    { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20',Icon: Package     },
  reminder: { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',    Icon: Clock       },
  alert:    { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',        Icon: AlertCircle },
};
const APP_ST: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  pending:  { label: 'En attente',  color: 'text-amber-400',   bg: 'bg-amber-500/10',   Icon: Clock       },
  review:   { label: 'En révision', color: 'text-blue-400',    bg: 'bg-blue-500/10',    Icon: RefreshCw   },
  approved: { label: 'Approuvé ✓',  color: 'text-emerald-400', bg: 'bg-emerald-500/10', Icon: CheckCircle },
  rejected: { label: 'Rejeté',      color: 'text-red-400',     bg: 'bg-red-500/10',     Icon: XCircle     },
  disbursed:{ label: 'Actif 🟢',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', Icon: CheckCircle },
  cancelled:{ label: 'Annulé',      color: 'text-slate-400',   bg: 'bg-slate-700/50',   Icon: XCircle     },
};
const TYPE_ICON: Record<string, string> = {
  microcredit:'💰', personal:'💳', salary:'🏛', auto:'🚗',
  immobilier:'🏠', pme:'🏢', agricole:'🌾', education:'📚', other:'📦',
};
type BankMessagesTab = 'messages' | 'credits' | 'produits' | 'simulator';
const VALID_TABS: BankMessagesTab[] = ['messages', 'credits', 'produits', 'simulator'];

function isBankMessagesTab(value: unknown): value is BankMessagesTab {
  return typeof value === 'string' && VALID_TABS.includes(value as BankMessagesTab);
}

// ── Modal : Demander un crédit ────────────────────────────────────────────────
function ApplyModal({ product, onClose, onDone }: { product: any; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount]   = useState('');
  const [duration, setDuration] = useState('');
  const [purpose, setPurpose] = useState('');
  const [sim, setSim]         = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  // Calcul temps réel
  useEffect(() => {
    if (!amount || !duration || !product) { setSim(null); return; }
    const rate = parseFloat(product.interest_rate) / 100 / 12;
    const n    = parseInt(duration);
    const amt  = parseFloat(amount);
    if (isNaN(amt) || isNaN(n) || n <= 0) return;
    const monthly = rate > 0 ? amt * (rate * Math.pow(1+rate,n)) / (Math.pow(1+rate,n)-1) : amt/n;
    setSim({ monthly: Math.round(monthly), total: Math.round(monthly*n), interest: Math.round(monthly*n - amt) });
  }, [amount, duration, product]);

  const handleSubmit = async () => {
    if (!amount || !duration || !purpose) { setError('Tous les champs sont requis'); return; }
    const amt = parseFloat(amount);
    if (amt < parseFloat(product.min_amount) || amt > parseFloat(product.max_amount)) {
      setError(`Montant entre ${fmt(product.min_amount)} et ${fmt(product.max_amount)}`); return;
    }
    setSending(true); setError('');
    try {
      const res = await authFetch('/api/scoring/user/my-applications/request/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, requested_amount: amount, duration_months: parseInt(duration), purpose }),
      });
      const payload = await readApiPayload(res);
      if (!res.ok) throw new Error(apiErrorMessage(payload, `Erreur ${res.status}`));
      setSuccess(true);
    } catch (e: any) { setError(e.message); }
    finally { setSending(false); }
  };

  if (success) return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center">
        <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h3 className="text-white font-bold text-xl mb-2">Demande envoyée !</h3>
        <p className="text-slate-400 text-sm mb-2">Votre demande de <strong className="text-white">{product.name}</strong> a été transmise à votre conseiller bancaire.</p>
        <p className="text-slate-500 text-xs mb-6">Délai de réponse habituel : 24–48h. Vous serez notifié ici.</p>
        <button onClick={() => { onDone(); onClose(); }} className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm">Fermer</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Demande de crédit</p>
            <h3 className="text-white font-bold">{product.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {/* Infos produit */}
          <div className="bg-slate-800/40 rounded-xl p-3 grid grid-cols-3 gap-3 text-xs">
            <div><p className="text-slate-500 mb-0.5">Taux</p><p className="text-white font-semibold">{product.interest_rate}%/an</p></div>
            <div><p className="text-slate-500 mb-0.5">Montant</p><p className="text-white font-semibold">{fmt(product.min_amount)}–{fmt(product.max_amount)}</p></div>
            <div><p className="text-slate-500 mb-0.5">Durée</p><p className="text-white font-semibold">{product.min_duration_months}–{product.max_duration_months} mois</p></div>
          </div>
          {/* Formulaire */}
          <div>
            <label className="text-slate-300 text-xs font-medium mb-1 block">Montant souhaité (FCFA) *</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder={`Ex: ${Math.round(parseFloat(product.min_amount) * 2).toLocaleString()}`}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-slate-300 text-xs font-medium mb-1 block">Durée souhaitée (mois) *</label>
            <select value={duration} onChange={e => setDuration(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500">
              <option value="">Choisir une durée</option>
              {Array.from({ length: product.max_duration_months - product.min_duration_months + 1 },
                (_, i) => product.min_duration_months + i
              ).filter(m => m <= 6 || m % 3 === 0 || m === product.max_duration_months).slice(0, 10)
               .map(m => <option key={m} value={m}>{m} mois</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-300 text-xs font-medium mb-1 block">Objet du crédit *</label>
            <textarea value={purpose} onChange={e => setPurpose(e.target.value)}
              rows={2} placeholder="Ex: Achat d'équipement pour mon activité commerciale..."
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          {/* Simulation */}
          {sim && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <p className="text-emerald-400 text-xs font-semibold mb-2">📊 Simulation indicative</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><p className="text-slate-400 mb-0.5">Mensualité</p><p className="text-white font-bold text-base">{fmt(sim.monthly)}</p></div>
                <div><p className="text-slate-400 mb-0.5">Total</p><p className="text-white font-semibold">{fmt(sim.total)}</p></div>
                <div><p className="text-slate-400 mb-0.5">Intérêts</p><p className="text-amber-400">{fmt(sim.interest)}</p></div>
              </div>
            </div>
          )}
          {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm">Annuler</button>
            <button onClick={handleSubmit} disabled={sending}
              className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
              {sending ? <><RefreshCw className="w-4 h-4 animate-spin"/>Envoi…</> : <><Send className="w-4 h-4"/>Envoyer la demande</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function UserBankMessages() {
  const location = useLocation();
  const requestedTab = (location.state as { openTab?: unknown } | null)?.openTab;
  const [tab, setTab]             = useState<BankMessagesTab>(isBankMessagesTab(requestedTab) ? requestedTab : 'credits');
  const [messages, setMessages]   = useState<any[]>([]);
  const [applications, setApps]   = useState<any[]>([]);
  const [summary, setSummary]     = useState<any>({});
  const [products, setProducts]   = useState<any[]>([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<number|null>(null);
  const [applying, setApplying]   = useState<any|null>(null);
  const [accepting, setAccepting] = useState<number|null>(null);
  const [declining, setDeclining] = useState<number|null>(null);
  const [actionMsg, setActionMsg] = useState<{text:string;ok:boolean}|null>(null);
  // Simulator
  const [simProduct, setSimProduct] = useState('');
  const [simAmount, setSimAmount]   = useState('');
  const [simDuration, setSimDuration] = useState('');
  const [simResult, setSimResult]   = useState<any>(null);

  const load = async () => {
    setLoading(true);
    await Promise.all([
      authFetch('/api/scoring/user/bank-messages/').then(r=>r.json()).then(d=>{setMessages(d.messages||[]); setUnread(d.unread_count||0);}).catch(()=>{}),
      authFetch('/api/scoring/user/my-applications/').then(r=>r.json()).then(d=>{setApps(d.applications||[]); setSummary(d.summary||{});}).catch(()=>{}),
      authFetch('/api/scoring/user/products/').then(r=>r.json()).then(d=>setProducts(Array.isArray(d)?d:(d.results||[]))).catch(()=>{}),
    ]);
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);
  useEffect(() => {
    if (isBankMessagesTab(requestedTab)) {
      setTab(requestedTab);
    }
  }, [requestedTab]);

  const markRead = async (id:number) => {
    await authFetch(`/api/scoring/user/bank-messages/${id}/read/`,{method:'POST'});
    setMessages(p=>p.map(m=>m.id===id?{...m,is_read:true}:m));
    setUnread(p=>Math.max(0,p-1));
  };

  const handleAccept = async (appId:number) => {
    setAccepting(appId); setActionMsg(null);
    try {
      const res = await authFetch(`/api/scoring/user/my-applications/${appId}/accept/`,{method:'POST'});
      const payload = await readApiPayload(res);
      if (res.ok) {
        setActionMsg({text: apiErrorMessage(payload, '✅ Crédit accepté ! Les fonds vont être virés sur votre compte.'), ok: true});
        load();
      } else {
        setActionMsg({text:`❌ ${apiErrorMessage(payload, `Erreur ${res.status}`)}`,ok:false});
      }
    } catch(e:any){ setActionMsg({text:`❌ ${e.message}`,ok:false}); }
    finally{ setAccepting(null); }
  };
  const handleDecline = async (appId:number) => {
    setDeclining(appId);
    try {
      const res = await authFetch(`/api/scoring/user/my-applications/${appId}/decline/`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason:'Refus client'})});
      const payload = await readApiPayload(res);
      if (!res.ok) throw new Error(apiErrorMessage(payload, `Erreur ${res.status}`));
      setActionMsg({text: apiErrorMessage(payload, 'Demande annulée.'),ok:true});
      load();
    } catch(e:any){
      setActionMsg({text:`❌ ${e.message}`,ok:false});
    }
    finally{ setDeclining(null); }
  };

  // Simulateur
  const selectedProduct = products.find(p=>String(p.id)===simProduct);
  const runSim = () => {
    if (!selectedProduct||!simAmount||!simDuration) return;
    const rate=parseFloat(selectedProduct.interest_rate)/100/12;
    const n=parseInt(simDuration); const amt=parseFloat(simAmount);
    const fees=amt*(parseFloat(selectedProduct.origination_fee||'1.5')/100);
    const monthly=rate>0?amt*(rate*Math.pow(1+rate,n))/(Math.pow(1+rate,n)-1):amt/n;
    setSimResult({monthly:Math.round(monthly),total:Math.round(monthly*n),interest:Math.round(monthly*n-amt),fees:Math.round(fees),rate:selectedProduct.interest_rate});
  };

  const pendingApps  = applications.filter(a=>a.status==='pending'||a.status==='review');
  const approvedApps = applications.filter(a=>a.status==='approved');
  const activeApps   = applications.filter(a=>a.status==='disbursed');
  const closedApps   = applications.filter(a=>['rejected','cancelled'].includes(a.status));

  return (
    <div className="min-h-screen bg-[#0b1220]">
      {/* Modal demande */}
      {applying && <ApplyModal product={applying} onClose={()=>setApplying(null)} onDone={load}/>}

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Bell className="w-6 h-6 text-sky-400"/> Banque & Crédits
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Messages, suivi de vos demandes et produits disponibles</p>
          </div>
          <button onClick={load} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4"/>
          </button>
        </div>

        {/* Message action */}
        {actionMsg && (
          <div className={`rounded-xl p-3 text-sm border flex items-center gap-2 ${actionMsg.ok?'bg-emerald-500/10 border-emerald-500/30 text-emerald-300':'bg-red-500/10 border-red-500/30 text-red-300'}`}>
            {actionMsg.text}
            <button onClick={()=>setActionMsg(null)} className="ml-auto text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900/50 border border-slate-800/50 rounded-2xl p-1.5">
          {([
            {id:'credits',    label:'Mes Crédits',   badge: approvedApps.length||undefined, color:'emerald'},
            {id:'produits',   label:'Demander',       badge: null,                           color:'blue'  },
            {id:'simulator',  label:'Simulateur',     badge: null,                           color:'purple'},
            {id:'messages',   label:'Messages',       badge: unread||undefined,              color:'sky'   },
          ] as const).map(({id,label,badge,color})=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${tab===id?`bg-${color}-500/20 text-${color}-400`:'text-slate-400 hover:text-white'}`}>
              {label}
              {badge!=null && badge>0 && <span className={`bg-${color}-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}>{badge}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-400"/> Chargement…
          </div>
        ) : (
          <>

          {/* ── MES CRÉDITS ─────────────────────────────────────────────── */}
          {tab==='credits' && (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  {label:'Total',     val:summary.total||0,   color:'slate'  },
                  {label:'En attente',val:summary.pending||0, color:'amber'  },
                  {label:'Approuvés', val:approvedApps.length,color:'emerald'},
                  {label:'Actifs',    val:activeApps.length,  color:'sky'    },
                ].map(({label,val,color})=>(
                  <div key={label} className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-3 text-center">
                    <p className={`text-${color}-400 font-bold text-2xl`}>{val}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* ── Offres à accepter (priorité) */}
              {approvedApps.length>0 && (
                <div className="space-y-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Star className="w-4 h-4 text-emerald-400"/> Offres à accepter
                    <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">{approvedApps.length}</span>
                  </h3>
                  {approvedApps.map(app=>{
                    const deadline = addDays(app.reviewed_at||app.created_at, 7);
                    const daysLeft = daysUntil(new Date(app.reviewed_at||app.created_at).toISOString().split('T')[0].replace(/-/g, '/'));
                    return (
                      <div key={app.id} className="bg-emerald-500/5 border-2 border-emerald-500/30 rounded-2xl p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">{TYPE_ICON[app.product_type]||'💳'}</span>
                              <p className="text-white font-bold text-lg">{app.product_name}</p>
                            </div>
                            <p className="text-slate-400 text-xs">{app.application_id}</p>
                          </div>
                          <div className="text-right">
                            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-semibold">✓ Approuvé</span>
                            <p className="text-amber-400 text-xs mt-1 flex items-center gap-1 justify-end">
                              <Calendar className="w-3 h-3"/> Expire le {deadline}
                            </p>
                          </div>
                        </div>

                        {/* Détails offre */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          {[
                            {l:'Montant accordé', v:fmt(app.requested_amount), c:'emerald'},
                            {l:'Mensualité',       v:fmt(app.monthly_payment),  c:'white'  },
                            {l:'Durée',           v:`${app.duration_months} mois`, c:'white'},
                            {l:'Taux',            v:`${app.interest_rate}%/an`,   c:'white' },
                          ].map(({l,v,c})=>(
                            <div key={l} className="bg-slate-800/50 rounded-lg p-2.5 text-center">
                              <p className="text-slate-500 text-xs mb-0.5">{l}</p>
                              <p className={`text-${c==='emerald'?'emerald-400':'white'} font-bold text-sm`}>{v}</p>
                            </div>
                          ))}
                        </div>

                        {/* Timeline remboursement */}
                        <div className="bg-slate-800/30 rounded-xl p-3 mb-4">
                          <p className="text-slate-400 text-xs mb-2 font-medium">📅 Calendrier de remboursement</p>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {[1,2,3,4,5,6].map(i=>{
                              const d = new Date(); d.setMonth(d.getMonth()+i);
                              return (
                                <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                    <span className="text-emerald-400 text-xs font-bold">{i}</span>
                                  </div>
                                  <p className="text-slate-500 text-xs">{d.toLocaleDateString('fr-FR',{month:'short'})}</p>
                                  <p className="text-white text-xs font-medium">{fmt(app.monthly_payment)}</p>
                                </div>
                              );
                            })}
                            {app.duration_months > 6 && (
                              <div className="flex flex-col items-center gap-1 shrink-0 opacity-40">
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                  <span className="text-slate-400 text-xs">…</span>
                                </div>
                                <p className="text-slate-500 text-xs">+{app.duration_months-6}</p>
                              </div>
                            )}
                          </div>
                          <p className="text-slate-500 text-xs mt-2">
                            Total à rembourser : <span className="text-white font-medium">{fmt(parseFloat(app.monthly_payment)*app.duration_months)}</span>
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <button onClick={()=>handleDecline(app.id)} disabled={!!declining}
                            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 rounded-xl text-sm flex items-center gap-2 transition-colors">
                            {declining===app.id?<RefreshCw className="w-4 h-4 animate-spin"/>:<XCircle className="w-4 h-4"/>} Décliner
                          </button>
                          <button onClick={()=>handleAccept(app.id)} disabled={!!accepting}
                            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20">
                            {accepting===app.id?<><RefreshCw className="w-4 h-4 animate-spin"/>Traitement…</>:<><CheckCircle className="w-4 h-4"/>Accepter et encaisser</>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Crédits actifs */}
              {activeApps.length>0 && (
                <div className="space-y-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-sky-400"/> Crédits actifs
                  </h3>
                  {activeApps.map(app=>{
                    const paid  = Math.min(3, app.duration_months); // simulé
                    const pct   = Math.round((paid/app.duration_months)*100);
                    const nextDate = new Date(); nextDate.setMonth(nextDate.getMonth()+1);
                    return (
                      <div key={app.id} className="bg-slate-900/50 border border-sky-500/20 rounded-2xl p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-white font-semibold">{app.product_name}</p>
                            <p className="text-slate-400 text-xs mt-0.5">{app.application_id}</p>
                          </div>
                          <span className="px-2.5 py-1 bg-sky-500/10 text-sky-400 text-xs rounded-full font-semibold">🟢 Actif</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                          <div className="bg-slate-800/40 rounded-lg p-3"><p className="text-slate-500 text-xs mb-0.5">Montant initial</p><p className="text-white font-bold">{fmt(app.requested_amount)}</p></div>
                          <div className="bg-sky-500/10 rounded-lg p-3 border border-sky-500/20"><p className="text-slate-500 text-xs mb-0.5">Prochain paiement</p><p className="text-sky-400 font-bold">{fmt(app.monthly_payment)}</p><p className="text-slate-500 text-xs">le {nextDate.toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</p></div>
                          <div className="bg-slate-800/40 rounded-lg p-3"><p className="text-slate-500 text-xs mb-0.5">Durée restante</p><p className="text-white font-bold">{app.duration_months - paid} mois</p></div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-400">Progression remboursement</span>
                            <span className="text-white font-medium">{paid}/{app.duration_months} mois — {pct}%</span>
                          </div>
                          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all" style={{width:`${pct}%`}}/>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── En attente */}
              {pendingApps.length>0 && (
                <div className="space-y-3">
                  <h3 className="text-white font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400"/> En cours d'examen</h3>
                  {pendingApps.map(app=>(
                    <div key={app.id} className="bg-slate-900/50 border border-amber-500/20 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium text-sm">{app.product_name}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{fmt(app.requested_amount)} · {app.duration_months} mois · {fmtDate(app.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[1,2,3].map(i=><div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" style={{animationDelay:`${i*0.2}s`}}/>)}
                          </div>
                          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full">En attente banque</span>
                        </div>
                      </div>
                      <p className="text-slate-500 text-xs mt-3 flex items-center gap-1"><Shield className="w-3 h-3"/> Délai habituel : 24–48h après dépôt</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Historique */}
              {closedApps.length>0 && (
                <div className="space-y-2">
                  <h3 className="text-slate-400 font-medium text-sm">Historique</h3>
                  {closedApps.map(app=>{
                    const st=APP_ST[app.status]||APP_ST.cancelled;
                    return (
                      <div key={app.id} className="bg-slate-900/30 border border-slate-800/30 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-slate-300 text-sm">{app.product_name} — {fmt(app.requested_amount)}</p>
                          {app.rejection_reason && <p className="text-slate-500 text-xs mt-0.5">Motif : {app.rejection_reason}</p>}
                        </div>
                        <span className={`px-2.5 py-1 ${st.bg} ${st.color} text-xs rounded-full`}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {applications.length===0 && (
                <div className="text-center py-14">
                  <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3"/>
                  <p className="text-white font-medium mb-1">Aucune demande de crédit</p>
                  <p className="text-slate-400 text-sm mb-4">Explorez les produits disponibles pour vous.</p>
                  <button onClick={()=>setTab('produits')} className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm flex items-center gap-2 mx-auto transition-colors">
                    <Package className="w-4 h-4"/> Voir les produits disponibles
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── DEMANDER UN CRÉDIT ────────────────────────────────────────── */}
          {tab==='produits' && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5"/>
                <div>
                  <p className="text-blue-400 font-medium text-sm">Comment ça marche ?</p>
                  <p className="text-slate-400 text-xs mt-0.5">Choisissez un produit, soumettez votre demande. Votre conseiller bancaire l'examinera sous 24–48h et vous notifiera ici.</p>
                </div>
              </div>

              <div className="space-y-3">
                {products.filter(p=>p.is_active).map(p=>(
                  <div key={p.id} className="bg-slate-900/50 border border-slate-800/50 hover:border-blue-500/30 rounded-2xl p-5 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{TYPE_ICON[p.product_type]||'💳'}</span>
                        <div>
                          <p className="text-white font-semibold">{p.name}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{p.description?.slice(0,70)}…</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-white font-bold">{p.interest_rate}%<span className="text-slate-400 text-xs">/an</span></p>
                        <p className="text-slate-500 text-xs">Score ≥ {p.min_score_required}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                      <span>{fmt(p.min_amount)} → {fmt(p.max_amount)}</span>
                      <span>{p.min_duration_months}–{p.max_duration_months} mois</span>
                    </div>
                    {p.features?.length>0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {p.features.slice(0,3).map((f:string,i:number)=>(
                          <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full">✓ {f}</span>
                        ))}
                      </div>
                    )}
                    <button onClick={()=>setApplying(p)}
                      className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                      <Send className="w-4 h-4"/> Faire une demande
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SIMULATEUR ───────────────────────────────────────────────── */}
          {tab==='simulator' && (
            <div className="space-y-5">
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 space-y-4">
                <h3 className="text-white font-bold flex items-center gap-2"><Calculator className="w-5 h-5 text-purple-400"/> Simuler mon crédit</h3>

                <div>
                  <label className="text-slate-300 text-xs font-medium mb-1.5 block">Produit</label>
                  <select value={simProduct} onChange={e=>{setSimProduct(e.target.value);setSimResult(null);}}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500">
                    <option value="">Choisir un produit</option>
                    {products.filter(p=>p.is_active).map(p=><option key={p.id} value={p.id}>{p.name} — {p.interest_rate}%/an</option>)}
                  </select>
                </div>

                {selectedProduct && (
                  <div className="bg-slate-800/30 rounded-xl p-3 grid grid-cols-3 gap-3 text-xs">
                    <div><p className="text-slate-500 mb-0.5">Taux annuel</p><p className="text-white font-semibold">{selectedProduct.interest_rate}%</p></div>
                    <div><p className="text-slate-500 mb-0.5">Frais dossier</p><p className="text-white font-semibold">{selectedProduct.origination_fee}%</p></div>
                    <div><p className="text-slate-500 mb-0.5">Montant max</p><p className="text-white font-semibold">{fmt(selectedProduct.max_amount)}</p></div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 text-xs font-medium mb-1.5 block">Montant (FCFA)</label>
                    <input type="number" value={simAmount} onChange={e=>{setSimAmount(e.target.value);setSimResult(null);}}
                      placeholder={selectedProduct?`${fmt(selectedProduct.min_amount)}`:'Montant'}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"/>
                  </div>
                  <div>
                    <label className="text-slate-300 text-xs font-medium mb-1.5 block">Durée (mois)</label>
                    <input type="number" value={simDuration} onChange={e=>{setSimDuration(e.target.value);setSimResult(null);}}
                      placeholder={selectedProduct?`${selectedProduct.min_duration_months}–${selectedProduct.max_duration_months}`:'Durée'}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"/>
                  </div>
                </div>

                <button onClick={runSim} disabled={!simProduct||!simAmount||!simDuration}
                  className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                  <Calculator className="w-4 h-4"/> Calculer
                </button>
              </div>

              {simResult && (
                <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6 space-y-5">
                  <h3 className="text-white font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-purple-400"/> Résultat de la simulation</h3>

                  {/* Mensualité principale */}
                  <div className="text-center py-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <p className="text-slate-400 text-sm mb-1">Mensualité estimée</p>
                    <p className="text-5xl font-black text-white">{fmt(simResult.monthly)}</p>
                    <p className="text-purple-400 text-sm mt-1">par mois pendant {simDuration} mois</p>
                  </div>

                  {/* Détails */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {l:'Total à rembourser', v:fmt(simResult.total),    c:'white'  },
                      {l:'Coût des intérêts',  v:fmt(simResult.interest), c:'amber-400'},
                      {l:'Frais de dossier',   v:fmt(simResult.fees),     c:'slate-300'},
                    ].map(({l,v,c})=>(
                      <div key={l} className="bg-slate-800/50 rounded-xl p-3 text-center">
                        <p className="text-slate-500 text-xs mb-1">{l}</p>
                        <p className={`text-${c} font-bold text-sm`}>{v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Échéancier simplifié */}
                  <div>
                    <p className="text-slate-400 text-xs font-medium mb-3">📅 Premiers remboursements</p>
                    <div className="space-y-2">
                      {Array.from({length:Math.min(4,parseInt(simDuration))},(_,i)=>{
                        const d=new Date(); d.setMonth(d.getMonth()+i+1);
                        return (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/50">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 font-bold">{i+1}</div>
                              <span className="text-slate-300 text-sm">{d.toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}</span>
                            </div>
                            <span className="text-white font-semibold text-sm">{fmt(simResult.monthly)}</span>
                          </div>
                        );
                      })}
                      {parseInt(simDuration)>4 && <p className="text-slate-500 text-xs text-center pt-1">… et {parseInt(simDuration)-4} mensualités supplémentaires</p>}
                    </div>
                  </div>

                  <button onClick={()=>{setTab('produits'); setApplying(selectedProduct);}}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                    <Send className="w-4 h-4"/> Faire une demande pour ce produit <ArrowRight className="w-4 h-4"/>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── MESSAGES ─────────────────────────────────────────────────── */}
          {tab==='messages' && (
            <div className="space-y-3">
              {unread>0 && (
                <div className="flex justify-end">
                  <button onClick={async()=>{await authFetch('/api/scoring/user/bank-messages/read-all/',{method:'POST'});setMessages(p=>p.map(m=>({...m,is_read:true})));setUnread(0);}}
                    className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1.5">
                    <MailOpen className="w-3.5 h-3.5"/> Tout marquer lu
                  </button>
                </div>
              )}
              {messages.length===0 ? (
                <div className="text-center py-14">
                  <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-3"/>
                  <p className="text-slate-400 text-sm">Aucun message de votre conseiller.</p>
                </div>
              ) : messages.map(msg=>{
                const cfg=MSG_CFG[msg.type]||MSG_CFG.info;
                const isOpen=expanded===msg.id;
                return (
                  <div key={msg.id} onClick={()=>{setExpanded(isOpen?null:msg.id); if(!msg.is_read)markRead(msg.id);}}
                    className={`border rounded-2xl overflow-hidden cursor-pointer transition-all ${!msg.is_read?'border-sky-500/30 bg-sky-500/5':'border-slate-800/50 bg-slate-900/50'}`}>
                    <div className="flex items-start gap-3 p-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border`}>
                        <cfg.Icon className={`w-4 h-4 ${cfg.color}`}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${!msg.is_read?'text-white':'text-slate-300'}`}>{msg.subject}</p>
                          {!msg.is_read && <span className="w-2 h-2 bg-sky-400 rounded-full shrink-0"/>}
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">{msg.sender_name} · {fmtDate(msg.created_at)}</p>
                        {!isOpen && <p className="text-slate-400 text-xs mt-1 truncate">{msg.body.slice(0,80)}…</p>}
                      </div>
                      {isOpen?<ChevronUp className="w-4 h-4 text-slate-500 shrink-0"/>:<ChevronDown className="w-4 h-4 text-slate-500 shrink-0"/>}
                    </div>
                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-slate-800/50 pt-3">
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{msg.body}</p>
                        {msg.type==='offer' && (
                          <button onClick={e=>{e.stopPropagation();setTab('credits');}}
                            className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors">
                            <DollarSign className="w-3.5 h-3.5"/> Voir et accepter l'offre →
                          </button>
                        )}
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
