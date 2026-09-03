/**
 * Simulateurs TERAS — VERSION AMÉLIORÉE
 * ✅ Calcul en temps réel (pas besoin de cliquer)
 * ✅ Produits bancaires réels intégrés
 * ✅ Amortissement visuel
 * ✅ CTA "Faire une demande" post-simulation
 * ✅ Design FCFA / Congo Brazzaville
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator, PiggyBank, Target, TrendingUp, AlertCircle, CheckCircle,
  DollarSign, Calendar, Percent, ArrowRight, BarChart3, Zap,
  RefreshCw, Send, ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => {
  if (!n || isNaN(n)) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}k`;
  return n.toLocaleString('fr-FR');
};
const fmtFull = (n: number) => `${fmt(n)} FCFA`;

// ── Composant Slider enrichi ──────────────────────────────────────────────────
function Slider({ label, value, min, max, step, onChange, format, color = '#0ea5e9' }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string; color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-slate-300 text-sm font-medium">{label}</label>
        <span className="text-white font-bold text-sm bg-slate-800 px-3 py-1 rounded-lg">{format(value)}</span>
      </div>
      <div className="relative">
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-2 appearance-none rounded-full cursor-pointer"
          style={{ background: `linear-gradient(to right, ${color} ${pct}%, #1e293b ${pct}%)` }}
        />
        <div className="flex justify-between text-slate-600 text-xs mt-1">
          <span>{format(min)}</span>
          <span>{format(max)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Mini barre de progression ─────────────────────────────────────────────────
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 1. SIMULATEUR CRÉDIT
// ═══════════════════════════════════════════════════════════════════════
function CreditSimulator() {
  const navigate = useNavigate();
  const [amount, setAmount]     = useState(500000);
  const [duration, setDuration] = useState(12);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<any>(null);
  const [showTable, setShowTable] = useState(false);
  const [useBank, setUseBank]   = useState(false); // mode: taux banque vs taux backend

  // Charger les produits bancaires
  useEffect(() => {
    authFetch('/api/scoring/bank/products/').then(r => r.json())
      .then(d => { const list = Array.isArray(d) ? d : (d.results || []); setProducts(list.filter((p:any)=>p.is_active)); })
      .catch(() => {});
  }, []);

  // Calcul temps réel avec produit banque
  const calcWithProduct = useCallback(() => {
    if (!selectedProduct) return;
    const rate    = parseFloat(selectedProduct.interest_rate) / 100 / 12;
    const n       = duration;
    const amt     = amount;
    const fees    = amt * (parseFloat(selectedProduct.origination_fee || '1.5') / 100);
    const monthly = rate > 0 ? amt * (rate * Math.pow(1+rate,n)) / (Math.pow(1+rate,n)-1) : amt/n;
    const total   = monthly * n;
    setResult({
      is_feasible:   true,
      monthly_payment: Math.round(monthly),
      total_cost:    Math.round(total + fees),
      total_interest: Math.round(total - amt),
      fees:          Math.round(fees),
      interest_rate: `${selectedProduct.interest_rate}%/an`,
      from_bank:     true,
      product_name:  selectedProduct.name,
      amortization:  buildAmortization(amt, rate, monthly, n),
    });
  }, [selectedProduct, amount, duration]);

  useEffect(() => { if (useBank && selectedProduct) calcWithProduct(); }, [amount, duration, selectedProduct, useBank, calcWithProduct]);

  const buildAmortization = (amt: number, rate: number, monthly: number, n: number) => {
    let balance = amt; const rows = [];
    for (let i = 1; i <= Math.min(n, 24); i++) {
      const interest   = balance * rate;
      const principal  = monthly - interest;
      balance         -= principal;
      rows.push({ month: i, monthly: Math.round(monthly), principal: Math.round(principal), interest: Math.round(interest), balance: Math.max(0, Math.round(balance)) });
    }
    return rows;
  };

  // Simulation via backend
  const simulate = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/scoring/user/simulators/credit/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, duration }),
      });
      if (res.ok) {
        const data = await res.json();
        // Enrichir avec amortissement
        if (data.monthly_payment) {
          const rate = (parseFloat(data.interest_rate) || 10) / 100 / 12;
          data.amortization = buildAmortization(amount, rate, data.monthly_payment, duration);
        }
        setResult(data);
      }
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Mode : Taux TERAS ou Produit Banque */}
      <div className="flex gap-2 bg-slate-800/50 rounded-xl p-1.5">
        <button onClick={() => setUseBank(false)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!useBank ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-white'}`}>
          Taux TERAS auto
        </button>
        <button onClick={() => { setUseBank(true); if (products.length) setSelectedProduct(products[0]); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${useBank ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-white'}`}>
          Choisir un produit banque
        </button>
      </div>

      {/* Sélection produit */}
      {useBank && (
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">Produit financier</label>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
            {products.map(p => (
              <button key={p.id} onClick={() => setSelectedProduct(p)}
                className={`w-full p-3 rounded-xl border text-left transition-all ${selectedProduct?.id === p.id ? 'border-sky-500/50 bg-sky-500/10' : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-white text-sm font-medium">{p.name}</span>
                  <span className="text-sky-400 text-sm font-bold">{p.interest_rate}%/an</span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">{fmt(p.min_amount)}–{fmt(p.max_amount)} FCFA · {p.min_duration_months}–{p.max_duration_months} mois</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sliders */}
      <div className="space-y-5">
        <Slider label="Montant souhaité" value={amount} min={50000} max={5000000} step={50000}
          onChange={v => { setAmount(v); if (!useBank) setResult(null); }}
          format={v => `${fmt(v)} FCFA`} color="#0ea5e9" />
        <Slider label="Durée" value={duration} min={3} max={60} step={1}
          onChange={v => { setDuration(v); if (!useBank) setResult(null); }}
          format={v => `${v} mois`} color="#8b5cf6" />
      </div>

      {!useBank && (
        <button onClick={simulate} disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-sky-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><RefreshCw className="w-5 h-5 animate-spin"/>Calcul en cours…</> : <><Calculator className="w-5 h-5"/>Simuler avec mon profil TERAS</>}
        </button>
      )}

      {/* Résultat */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Statut */}
          <div className={`p-4 rounded-xl border ${result.is_feasible ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="flex items-center gap-3">
              {result.is_feasible ? <CheckCircle className="w-6 h-6 text-emerald-400"/> : <AlertCircle className="w-6 h-6 text-red-400"/>}
              <div>
                <h3 className="text-white font-bold">{result.is_feasible ? '✅ Simulation réalisable' : '⚠️ Attention'}</h3>
                {result.product_name && <p className="text-slate-400 text-xs">Produit : {result.product_name}</p>}
              </div>
            </div>
          </div>

          {/* Chiffres clés */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Mensualité',  value: fmtFull(result.monthly_payment), color: 'sky',    icon: Calendar, big: true },
              { label: 'Coût total',  value: fmtFull(result.total_cost),       color: 'white',  icon: DollarSign },
              { label: 'Intérêts',    value: fmtFull(result.total_interest),   color: 'amber',  icon: Percent },
              { label: 'Taux',        value: result.interest_rate,             color: 'purple', icon: TrendingUp },
            ].map(({ label, value, color, icon: Icon, big }) => (
              <div key={label} className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 text-${color === 'white' ? 'slate-400' : color + '-400'}`} />
                  <span className="text-slate-400 text-xs">{label}</span>
                </div>
                <div className={`font-bold ${big ? 'text-xl text-sky-400' : 'text-base text-white'}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Warnings backend */}
          {result.warnings?.map((w: any, i: number) => (
            <div key={i} className={`p-3 rounded-xl border text-sm ${w.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
              {w.message}
            </div>
          ))}

          {/* Tableau amortissement */}
          {result.amortization?.length > 0 && (
            <div className="bg-slate-800/30 border border-white/5 rounded-xl overflow-hidden">
              <button onClick={() => setShowTable(p => !p)}
                className="w-full flex items-center justify-between p-4 text-white hover:bg-slate-800/50 transition-colors">
                <span className="font-medium text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-sky-400"/>Tableau d'amortissement</span>
                {showTable ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
              </button>
              {showTable && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-800/70">
                      <tr>
                        {['Mois', 'Mensualité', 'Capital', 'Intérêts', 'Capital restant'].map(h => (
                          <th key={h} className="px-3 py-2 text-slate-400 font-medium text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.amortization.slice(0, showTable ? result.amortization.length : 6).map((row: any) => (
                        <tr key={row.month} className="border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="px-3 py-2 text-slate-400">{row.month}</td>
                          <td className="px-3 py-2 text-white font-medium">{fmt(row.monthly)}</td>
                          <td className="px-3 py-2 text-emerald-400">{fmt(row.principal)}</td>
                          <td className="px-3 py-2 text-amber-400">{fmt(row.interest)}</td>
                          <td className="px-3 py-2 text-slate-300">{fmt(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Scénarios alternatifs */}
          {result.alternative_scenarios?.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">💡 Scénarios alternatifs</h4>
              <div className="space-y-2">
                {result.alternative_scenarios.map((s: any, i: number) => (
                  <div key={i} className="bg-slate-800/50 border border-white/10 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white font-medium text-sm">{s.label}</span>
                      <CheckCircle className="w-4 h-4 text-emerald-400"/>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-400">
                      <span>Montant: <span className="text-white">{fmt(s.amount)} FCFA</span></span>
                      <span>Durée: <span className="text-white">{s.duration} mois</span></span>
                      <span>Mensualité: <span className="text-white">{fmt(s.monthly_payment)} FCFA</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {result.is_feasible && (
            <button onClick={() => navigate('/mes-messages', { state: { openTab: 'produits' } })}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/20 transition flex items-center justify-center gap-2">
              <Send className="w-5 h-5"/> Faire une demande de crédit →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 2. SIMULATEUR ÉPARGNE
// ═══════════════════════════════════════════════════════════════════════
function SavingsSimulator() {
  const [monthly, setMonthly]   = useState(50000);
  const [duration, setDuration] = useState(12);
  const [rate, setRate]         = useState(5); // taux annuel épargne %
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<any>(null);

  // Calcul temps réel
  useEffect(() => {
    const monthlyRate = rate / 100 / 12;
    const n = duration;
    let balance = 0;
    const breakdown = [];
    for (let i = 1; i <= n; i++) {
      const interest = balance * monthlyRate;
      balance += monthly + interest;
      breakdown.push({ month: i, deposit: monthly, interest: Math.round(interest), cumulative: Math.round(balance) });
    }
    const totalDeposited = monthly * n;
    const totalInterest  = Math.round(balance - totalDeposited);
    setResult({
      total_saved:   totalDeposited,
      interest_earned: totalInterest,
      future_value:  Math.round(balance),
      rate_pct:      rate,
      monthly_breakdown: breakdown,
    });
  }, [monthly, duration, rate]);

  const simulate = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/scoring/user/simulators/savings/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthly_amount: monthly, duration }),
      });
      if (res.ok) { const data = await res.json(); setResult(prev => ({ ...prev, ...data })); }
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <Slider label="Épargne mensuelle" value={monthly} min={10000} max={500000} step={5000}
          onChange={setMonthly} format={v => `${fmt(v)} FCFA`} color="#22c55e" />
        <Slider label="Durée" value={duration} min={3} max={60} step={1}
          onChange={setDuration} format={v => `${v} mois`} color="#0ea5e9" />
        <Slider label="Taux d'intérêt annuel" value={rate} min={1} max={15} step={0.5}
          onChange={setRate} format={v => `${v}%`} color="#a855f7" />
      </div>

      {result && (
        <div className="space-y-4">
          {/* Résumé visuel */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5">
            <p className="text-slate-400 text-sm mb-1">Valeur finale après {duration} mois</p>
            <p className="text-4xl font-black text-emerald-400 mb-4">{fmtFull(result.future_value)}</p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              {[
                { l: 'Versements',    v: fmtFull(result.total_saved),    c: 'text-white'      },
                { l: '+ Intérêts',    v: fmtFull(result.interest_earned), c: 'text-emerald-400'},
                { l: 'Rendement',     v: `${result.rate_pct}%/an`,        c: 'text-purple-400' },
              ].map(({ l, v, c }) => (
                <div key={l} className="bg-slate-800/50 rounded-xl p-3 text-center">
                  <p className="text-slate-500 mb-0.5">{l}</p>
                  <p className={`font-bold ${c}`}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progression graphique simplifié */}
          {result.monthly_breakdown?.length > 0 && (
            <div className="bg-slate-800/30 border border-white/5 rounded-xl p-4">
              <h4 className="text-white text-sm font-semibold mb-4">📈 Progression du solde</h4>
              <div className="flex items-end gap-1 h-24">
                {result.monthly_breakdown.filter((_:any, i:number) => i % Math.ceil(result.monthly_breakdown.length / 12) === 0 || i === result.monthly_breakdown.length - 1)
                  .map((m: any, i: number, arr: any[]) => {
                    const maxVal = arr[arr.length - 1].cumulative;
                    const h = Math.round((m.cumulative / maxVal) * 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <p className="text-slate-500 text-xs" style={{ fontSize: '9px' }}>{fmt(m.cumulative)}</p>
                        <div className="w-full bg-emerald-500 rounded-sm transition-all" style={{ height: `${h}%` }} />
                        <p className="text-slate-600" style={{ fontSize: '8px' }}>M{m.month}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Tableau compact */}
          <div className="bg-slate-800/30 border border-white/5 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-slate-700/50">
              <h4 className="text-white text-sm font-medium">Progression mensuelle (6 premiers mois)</h4>
            </div>
            <div className="divide-y divide-slate-800/50">
              {result.monthly_breakdown?.slice(0, 6).map((m: any) => (
                <div key={m.month} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-400 w-12">Mois {m.month}</span>
                  <span className="text-slate-300">+{fmt(m.deposit)} FCFA</span>
                  <span className="text-emerald-400 text-xs">+{fmt(m.interest)} intérêts</span>
                  <span className="text-white font-semibold">{fmt(m.cumulative)} FCFA</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5"/>
            <p className="text-slate-400 text-xs">
              Épargner <strong className="text-white">{fmt(monthly)} FCFA/mois</strong> améliore votre pilier <strong className="text-emerald-400">E (Épargne)</strong> TERAS et augmente votre score.
              <button onClick={simulate} className="text-blue-400 ml-1 hover:text-blue-300 underline" disabled={loading}>
                {loading ? 'Calcul…' : 'Vérifier avec mon profil →'}
              </button>
            </p>
          </div>

          {result.recommendations?.map((r: string, i: number) => (
            <div key={i} className="bg-slate-800/50 border border-white/10 rounded-lg p-3 text-sm text-slate-300">{r}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 3. SIMULATEUR IMPACT SCORE
// ═══════════════════════════════════════════════════════════════════════
function ScoreImpactSimulator() {
  const [actions, setActions] = useState({
    increase_transactions: false,
    start_savings:         false,
    increase_income:       false,
    add_asset:             false,
    improve_social:        false,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<any>(null);

  const actionConfig = [
    { key: 'increase_transactions', label: 'Augmenter mes transactions ZOLA', desc: 'Utiliser ZOLA 20+ fois/mois',              gain: '+40 pts', icon: '📱', color: 'sky'     },
    { key: 'start_savings',         label: 'Commencer à épargner',             desc: 'Dépôt mensuel régulier',                   gain: '+30 pts', icon: '🏦', color: 'emerald' },
    { key: 'increase_income',       label: 'Augmenter mes revenus',            desc: 'Déclarer des revenus supplémentaires',     gain: '+25 pts', icon: '💰', color: 'amber'   },
    { key: 'add_asset',             label: 'Déclarer un actif',                desc: 'Moto, terrain, équipement…',               gain: '+35 pts', icon: '🏠', color: 'purple'  },
    { key: 'improve_social',        label: 'Améliorer ma réputation',          desc: 'Rejoindre une tontine ou coopérative',     gain: '+20 pts', icon: '🤝', color: 'pink'    },
  ];

  const simulate = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/scoring/user/simulators/score-impact/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions }),
      });
      if (res.ok) setResult(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  const hasSelection = Object.values(actions).some(v => v);
  const estimatedGain = actionConfig.filter(a => actions[a.key as keyof typeof actions]).reduce((sum, a) => sum + parseInt(a.gain), 0);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {actionConfig.map(({ key, label, desc, gain, icon, color }) => {
          const isSelected = actions[key as keyof typeof actions];
          return (
            <button key={key} onClick={() => setActions(p => ({ ...p, [key]: !p[key] }))}
              className={`w-full p-4 rounded-xl border transition-all text-left ${isSelected ? `bg-${color}-500/10 border-${color}-500/40` : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${isSelected ? `bg-${color}-500/20` : 'bg-slate-700/50'}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>{label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`font-bold text-sm ${isSelected ? `text-${color}-400` : 'text-slate-500'}`}>{gain}</span>
                  <div className={`w-5 h-5 rounded-full border-2 ml-auto mt-1 flex items-center justify-center ${isSelected ? `border-${color}-500 bg-${color}-500` : 'border-slate-600'}`}>
                    {isSelected && <CheckCircle className="w-3 h-3 text-white"/>}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Aperçu gain estimé */}
      {hasSelection && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between">
          <span className="text-slate-300 text-sm">Gain estimé avec ces actions</span>
          <span className="text-purple-400 font-bold text-xl">+{estimatedGain} pts</span>
        </div>
      )}

      <button onClick={simulate} disabled={loading || !hasSelection}
        className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/20 transition disabled:opacity-40 flex items-center justify-center gap-2">
        {loading ? <><RefreshCw className="w-5 h-5 animate-spin"/>Calcul en cours…</> : <><Zap className="w-5 h-5"/>Calculer l'impact précis</>}
      </button>

      {result && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Score avant / après */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <p className="text-slate-400 text-xs mb-1">Score actuel</p>
                <p className="text-4xl font-black text-white">{result.current_score}</p>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <ArrowRight className="w-8 h-8 text-purple-400"/>
                <span className="text-emerald-400 font-bold text-xl">+{result.total_gain}</span>
                <span className="text-slate-400 text-xs">pts</span>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-xs mb-1">Score projeté</p>
                <p className="text-4xl font-black text-emerald-400">{result.projected_score}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-white/20 rounded-full" style={{ width: `${result.current_score / 10}%` }}/>
              </div>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${result.projected_score / 10}%` }}/>
              </div>
            </div>
            <p className="text-slate-400 text-xs text-center mt-3">
              Résultat estimé en <strong className="text-white">{result.estimated_weeks} semaines</strong>
            </p>
          </div>

          {/* Piliers */}
          {result.projected_breakdown && (
            <div className="bg-slate-800/30 border border-white/5 rounded-xl p-5">
              <h4 className="text-white font-semibold text-sm mb-4">Impact par pilier</h4>
              <div className="space-y-3">
                {Object.entries({ T: 'Transactions', E: 'Épargne', R: 'Revenus', A: 'Actifs', S: 'Social' }).map(([key, label]) => {
                  const curr = result.current_breakdown?.[key]  || 0;
                  const proj = result.projected_breakdown?.[key] || curr;
                  const gain = proj - curr;
                  const max  = { T: 300, E: 150, R: 200, A: 150, S: 200 }[key] || 200;
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300"><span className="text-slate-500 font-bold">{key}</span> {label}</span>
                        <span className="text-white">{curr} → <span className="text-emerald-400 font-bold">{proj}</span> {gain > 0 && <span className="text-emerald-400">(+{gain})</span>}</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden relative">
                        <div className="h-full bg-slate-600 rounded-full" style={{ width: `${(curr/max)*100}%` }}/>
                        {gain > 0 && <div className="h-full bg-emerald-500 rounded-full absolute top-0" style={{ left: `${(curr/max)*100}%`, width: `${(gain/max)*100}%` }}/>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Impact par action */}
          {result.impacts && Object.values(result.impacts).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-white font-semibold text-sm">Détail par action</h4>
              {(Object.values(result.impacts) as any[]).map((impact, i) => (
                <div key={i} className="bg-slate-800/50 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{impact.action}</p>
                    <p className="text-slate-400 text-xs">{impact.current}/100 → {impact.potential}/100</p>
                    <MiniBar value={impact.potential} max={100} color="bg-emerald-500"/>
                  </div>
                  <span className="text-emerald-400 font-bold text-lg ml-4">+{impact.gain}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════
export default function Simulateurs() {
  const [activeTab, setActiveTab] = useState<'credit' | 'savings' | 'score'>('credit');

  const tabs = [
    { id: 'credit'  as const, label: 'Crédit',       icon: Calculator, desc: 'Capacité d\'emprunt',        color: 'sky'    },
    { id: 'savings' as const, label: 'Épargne',       icon: PiggyBank,  desc: 'Plan d\'épargne FCFA',       color: 'emerald'},
    { id: 'score'   as const, label: 'Impact Score',  icon: Target,     desc: 'Améliorer mon score TERAS',  color: 'purple' },
  ];

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-4 md:p-6">
      <div className="max-w-3xl mx-auto">

        {/* En-tête */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center">
            <Calculator className="w-7 h-7 text-sky-400"/>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Simulateurs Financiers</h1>
            <p className="text-slate-400 text-sm">Planifiez vos finances avec vos données réelles TERAS</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-2xl border transition-all text-left ${active ? `bg-${tab.color}-500/10 border-${tab.color}-500/40` : 'bg-slate-900/50 border-white/10 hover:border-white/20'}`}>
                <Icon className={`w-6 h-6 mb-2 ${active ? `text-${tab.color}-400` : 'text-slate-400'}`}/>
                <p className={`font-semibold text-sm ${active ? 'text-white' : 'text-slate-300'}`}>{tab.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{tab.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Contenu */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          {activeTab === 'credit'  && <CreditSimulator/>}
          {activeTab === 'savings' && <SavingsSimulator/>}
          {activeTab === 'score'   && <ScoreImpactSimulator/>}
        </div>

        {/* Infos bas de page */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4 flex gap-3">
            <Zap className="w-5 h-5 text-yellow-400 shrink-0"/>
            <div>
              <h4 className="text-white font-semibold text-sm mb-1">Simulations illimitées</h4>
              <p className="text-slate-400 text-xs">Testez autant de scénarios que vous voulez, sans engagement.</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-4 flex gap-3">
            <BarChart3 className="w-5 h-5 text-emerald-400 shrink-0"/>
            <div>
              <h4 className="text-white font-semibold text-sm mb-1">Données réelles TERAS</h4>
              <p className="text-slate-400 text-xs">Les simulations utilisent votre score et revenus actuels.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}