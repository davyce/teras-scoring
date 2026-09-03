import { authFetch } from '../../utils/authFetch';
import DocumentPreviewModal from '../../components/shared/DocumentPreviewModal';
import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, TrendingUp,
  DollarSign, FileText, RefreshCw, MessageCircle, Zap,
  CheckCircle, AlertCircle, Package, Clock, BarChart3,
  Upload, User, CreditCard, Shield, Copy, ExternalLink,
  X, Send, Calculator, ChevronDown, Eye, EyeOff, Download, Trash2,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
const BAND_COLOR: Record<string, string> = {
  A: 'emerald', B: 'green', C: 'blue', D: 'amber', E: 'red',
};
const PILLAR_CONFIG: Record<string, { label: string; max: number; color: string }> = {
  T: { label: 'Transactions', max: 300, color: 'sky'    },
  E: { label: 'Épargne',      max: 150, color: 'green'  },
  R: { label: 'Revenus',      max: 200, color: 'blue'   },
  A: { label: 'Actifs',       max: 150, color: 'purple' },
  S: { label: 'Social',       max: 200, color: 'amber'  },
};
function fmt(val: string | number): string {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (!n) return '0 FCFA';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}k FCFA`;
  return `${n.toLocaleString('fr-FR')} FCFA`;
}
function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

const REQUIRED_CLIENT_DOCS = [
  { name: 'NIU / Carte Nationale', type: 'Identité', required: true, keywords: ['identity', 'carte', 'national', 'niu'] },
  { name: 'Justificatif de domicile', type: 'Adresse', required: true, keywords: ['domicile', 'adresse', 'residence', 'proof'] },
  { name: 'Bulletins de salaire (3 mois)', type: 'Revenus', required: true, keywords: ['payslip', 'salaire', 'paie'] },
  { name: 'Relevés ZOLA / banque (6 mois)', type: 'Financier', required: true, keywords: ['bank_statement', 'statement', 'releve', 'relevé', 'zola'] },
  { name: "Photos ou justificatifs d'actifs", type: 'Actifs', required: false, keywords: ['proof_asset', 'asset', 'actif'] },
];

function matchesRequiredDoc(requiredDoc: { keywords: string[] }, document: any): boolean {
  const haystack = [
    document.category,
    document.category_label,
    document.doc_type,
    document.filename,
  ].filter(Boolean).join(' ').toLowerCase();
  return requiredDoc.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function getReviewTone(status?: string) {
  if (status === 'approved') return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20';
  if (status === 'rejected') return 'bg-rose-500/10 text-rose-300 border border-rose-500/20';
  return 'bg-amber-500/10 text-amber-300 border border-amber-500/20';
}

function getDocStatusTone(status?: string) {
  if (status === 'parsed' || status === 'validated') return 'bg-emerald-500/10 text-emerald-300';
  if (status === 'processing') return 'bg-sky-500/10 text-sky-300';
  if (status === 'failed' || status === 'rejected') return 'bg-rose-500/10 text-rose-300';
  return 'bg-slate-700/70 text-slate-300';
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h3 className="text-white font-bold text-base">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Modal 1: Proposer un crédit ───────────────────────────────────────────────
function ProposeCredit({ client, onClose }: { client: any; onClose: () => void }) {
  const [products, setProducts]     = useState<any[]>([]);
  const [loadingP, setLoadingP]     = useState(true);
  const [form, setForm]             = useState({ product: '', amount: '', duration: '', purpose: '' });
  const [sim, setSim]               = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');

  React.useEffect(() => {
    (async () => {
      try {
        const res  = await authFetch('/api/scoring/bank/products/');
        const json = await res.json();
        const list = (Array.isArray(json) ? json : json.results ?? [])
          .filter((p: any) => p.is_active && (!client.teras_score || p.min_score_required <= client.teras_score));
        setProducts(list);
      } catch { setProducts([]); } finally { setLoadingP(false); }
    })();
  }, []);

  // Calcul simulation mensualité
  const selectedProduct = products.find(p => String(p.id) === form.product);
  React.useEffect(() => {
    if (!selectedProduct || !form.amount || !form.duration) { setSim(null); return; }
    const rate    = parseFloat(selectedProduct.interest_rate) / 100 / 12;
    const n       = parseInt(form.duration);
    const amount  = parseFloat(form.amount);
    const monthly = rate > 0 ? amount * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1) : amount / n;
    const total   = monthly * n;
    const crm     = client.crm_limit || 0;
    setSim({
      monthly: Math.round(monthly),
      total:   Math.round(total),
      interest: Math.round(total - amount),
      eligible: monthly <= crm,
      effort:   crm > 0 ? Math.round((monthly / crm) * 100) : 0,
    });
  }, [form.amount, form.duration, form.product, selectedProduct]);

  const handleSubmit = async () => {
    if (!form.product || !form.amount || !form.duration || !form.purpose) {
      setError('Tous les champs sont requis.'); return;
    }
    setSubmitting(true); setError('');
    try {
      const res = await authFetch('/api/scoring/bank/applications/submit/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant_type:   'individual',
          client:           client.id,
          product:          parseInt(form.product),
          requested_amount: parseFloat(form.amount),
          duration_months:  parseInt(form.duration),
          purpose:          form.purpose,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(JSON.stringify(d)); return;
      }
      setSuccess(true);
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  if (success) return (
    <div className="text-center py-6">
      <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
      <h3 className="text-white font-bold text-lg mb-2">Demande soumise !</h3>
      <p className="text-slate-400 text-sm mb-6">La demande de crédit de {client.first_name} est en attente de validation.</p>
      <button onClick={onClose} className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm">Fermer</button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Info client */}
      <div className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
          <span className="text-white text-sm font-bold">{client.first_name[0]}{client.last_name[0]}</span>
        </div>
        <div className="flex-1">
          <p className="text-white font-medium text-sm">{client.first_name} {client.last_name}</p>
          <p className="text-slate-400 text-xs">Score : {client.teras_score ?? '—'} · CRM : {fmt(client.crm_limit)}/mois</p>
        </div>
        {client.teras_score && (
          <span className={`px-2.5 py-1 text-xs rounded-full font-medium bg-${BAND_COLOR[client.teras_band||'E']}-500/10 text-${BAND_COLOR[client.teras_band||'E']}-400`}>
            {client.teras_band || 'E'}
          </span>
        )}
      </div>

      {/* Produit */}
      <div>
        <label className="text-slate-300 text-xs font-medium mb-1.5 block">Produit financier *</label>
        {loadingP ? <p className="text-slate-500 text-sm">Chargement…</p> : (
          <select value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value, amount: '', duration: '' }))}
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500">
            <option value="">Sélectionner un produit</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.interest_rate}%/an ({fmt(p.min_amount)}–{fmt(p.max_amount)})
              </option>
            ))}
          </select>
        )}
        {products.length === 0 && !loadingP && (
          <p className="text-amber-400 text-xs mt-1">⚠ Aucun produit éligible pour ce score.</p>
        )}
      </div>

      {selectedProduct && (
        <div className="bg-slate-800/30 rounded-xl p-3 text-xs text-slate-400 space-y-1">
          <div className="flex justify-between"><span>Montant</span><span className="text-white">{fmt(selectedProduct.min_amount)} → {fmt(selectedProduct.max_amount)}</span></div>
          <div className="flex justify-between"><span>Durée</span><span className="text-white">{selectedProduct.min_duration_months}–{selectedProduct.max_duration_months} mois</span></div>
          <div className="flex justify-between"><span>Taux</span><span className="text-white">{selectedProduct.interest_rate}%/an</span></div>
          <div className="flex justify-between"><span>Score min requis</span><span className="text-white">{selectedProduct.min_score_required}</span></div>
        </div>
      )}

      {/* Montant + durée */}
      {selectedProduct && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-300 text-xs font-medium mb-1.5 block">Montant (FCFA) *</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder={`${selectedProduct.min_amount}–${selectedProduct.max_amount}`}
              min={selectedProduct.min_amount} max={selectedProduct.max_amount}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-slate-300 text-xs font-medium mb-1.5 block">Durée (mois) *</label>
            <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500">
              <option value="">—</option>
              {Array.from({ length: selectedProduct.max_duration_months - selectedProduct.min_duration_months + 1 },
                (_, i) => selectedProduct.min_duration_months + i
              ).filter(m => m % (selectedProduct.min_duration_months <= 3 ? 1 : 3) === 0 || m === selectedProduct.min_duration_months || m === selectedProduct.max_duration_months)
               .slice(0, 12)
               .map(m => <option key={m} value={m}>{m} mois</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Simulation résultat */}
      {sim && (
        <div className={`rounded-xl p-4 border ${sim.eligible ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-4 h-4 text-slate-400" />
            <p className="text-white font-semibold text-sm">Simulation</p>
            <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${sim.eligible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {sim.eligible ? '✓ Éligible' : '✗ Dépasse le CRM'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div><p className="text-slate-400 mb-0.5">Mensualité</p><p className="text-white font-bold text-base">{fmt(sim.monthly)}</p></div>
            <div><p className="text-slate-400 mb-0.5">Total remboursé</p><p className="text-white font-semibold">{fmt(sim.total)}</p></div>
            <div><p className="text-slate-400 mb-0.5">Intérêts</p><p className="text-amber-400 font-semibold">{fmt(sim.interest)}</p></div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Effort (mensualité / CRM)</span>
              <span className={sim.eligible ? 'text-emerald-400' : 'text-red-400'}>{sim.effort}% {sim.eligible ? '≤ 100% ✓' : '> 100% ✗'}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${sim.eligible ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(sim.effort, 100)}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Objet */}
      <div>
        <label className="text-slate-300 text-xs font-medium mb-1.5 block">Objet du crédit *</label>
        <textarea value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
          placeholder="Ex: Achat d'une moto-taxi pour l'activité commerciale…"
          rows={3}
          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
      </div>

      {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}

      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors">Annuler</button>
        <button onClick={handleSubmit} disabled={submitting || !sim?.eligible}
          className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
          {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Envoi…</> : <><Send className="w-4 h-4" /> Soumettre la demande</>}
        </button>
      </div>
    </div>
  );
}

// ── Modal 2: Simulateur crédit ────────────────────────────────────────────────
function SimulatorModal({ client, onClose }: { client: any; onClose: () => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm]         = useState({ product: '', amount: '', duration: '' });
  const [result, setResult]     = useState<any>(null);

  React.useEffect(() => {
    authFetch('/api/scoring/bank/products/')
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : d.results ?? []));
  }, []);

  const product = products.find(p => String(p.id) === form.product);

  const calculate = () => {
    if (!product || !form.amount || !form.duration) return;
    const rate   = parseFloat(product.interest_rate) / 100 / 12;
    const n      = parseInt(form.duration);
    const amount = parseFloat(form.amount);
    const fees   = amount * (parseFloat(product.origination_fee) / 100);
    const monthly = rate > 0 ? amount * (rate * Math.pow(1+rate,n)) / (Math.pow(1+rate,n) - 1) : amount / n;
    const total  = monthly * n;
    const crm    = client.crm_limit || 0;
    setResult({
      monthly: Math.round(monthly),
      total:   Math.round(total),
      interest: Math.round(total - amount),
      fees:    Math.round(fees),
      eligible: !client.teras_score || product.min_score_required <= client.teras_score,
      affordable: crm === 0 || monthly <= crm,
      effort: crm > 0 ? Math.round((monthly / crm) * 100) : 0,
      rate:    product.interest_rate,
    });
  };

  return (
    <div className="space-y-5">
      <div className="bg-slate-800/50 rounded-xl p-4 text-sm">
        <p className="text-slate-400 text-xs mb-2">Client simulé</p>
        <p className="text-white font-medium">{client.first_name} {client.last_name}</p>
        <p className="text-slate-400 text-xs">Score : {client.teras_score ?? '—'} · CRM : {fmt(client.crm_limit)}/mois</p>
      </div>

      <div>
        <label className="text-slate-300 text-xs font-medium mb-1.5 block">Produit</label>
        <select value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500">
          <option value="">Choisir un produit</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name} — {p.interest_rate}%</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-300 text-xs font-medium mb-1.5 block">Montant (FCFA)</label>
          <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            placeholder={product ? `${fmt(product.min_amount)} – ${fmt(product.max_amount)}` : 'Montant'}
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="text-slate-300 text-xs font-medium mb-1.5 block">Durée (mois)</label>
          <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
            placeholder={product ? `${product.min_duration_months}–${product.max_duration_months}` : 'Durée'}
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      <button onClick={calculate}
        className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
        <Calculator className="w-4 h-4" /> Calculer
      </button>

      {result && (
        <div className="bg-slate-800/40 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Mensualité',     val: fmt(result.monthly),  color: 'white',   big: true  },
              { label: 'Total à rembourser', val: fmt(result.total), color: 'slate-300', big: false },
              { label: 'Intérêts totaux',val: fmt(result.interest), color: 'amber-400', big: false },
              { label: 'Frais dossier',  val: fmt(result.fees),     color: 'slate-400', big: false },
            ].map(({ label, val, color, big }) => (
              <div key={label} className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-500 text-xs mb-0.5">{label}</p>
                <p className={`text-${color} font-${big ? 'bold text-lg' : 'semibold text-sm'}`}>{val}</p>
              </div>
            ))}
          </div>

          {/* Éligibilité */}
          <div className="space-y-2">
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${result.eligible ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {result.eligible ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              Score {result.eligible ? `≥ ${product?.min_score_required} ✓ Éligible` : `< score requis ✗`}
            </div>
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${result.affordable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {result.affordable ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              Effort budgétaire : {result.effort}% du CRM {result.affordable ? '✓ Acceptable' : '⚠ Dépasse le CRM'}
            </div>
          </div>

          <p className="text-slate-500 text-xs">
            Taux annuel fixe : {result.rate}% · Calcul indicatif, conditions définitives selon dossier.
          </p>
        </div>
      )}

      <button onClick={onClose} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors">Fermer</button>
    </div>
  );
}

// ── Modal 3: Envoyer un message ───────────────────────────────────────────────
function MessageModal({ client, onClose }: { client: any; onClose: () => void }) {
  const [type, setType]       = useState<'info' | 'reminder' | 'offer' | 'alert'>('info');
  const [subject, setSubject] = useState('');
  const [body, setBody]       = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const TEMPLATES = {
    info:     { subject: 'Information sur votre compte TERAS', body: `Bonjour ${client.first_name},\n\nNous vous contactons au sujet de votre compte TERAS.\n\n` },
    reminder: { subject: 'Rappel échéance de remboursement', body: `Bonjour ${client.first_name},\n\nNous vous rappelons que votre prochaine échéance de remboursement approche.\n\nMontant dû : \nDate limite : \n\nEn cas de difficulté, contactez-nous.\n\nCordialement,\nL'équipe TERAS Banque` },
    offer:    { subject: 'Offre de crédit personnalisée pour vous', body: `Bonjour ${client.first_name},\n\nSuite à l'analyse de votre profil TERAS (Score : ${client.teras_score ?? '—'}), nous avons le plaisir de vous proposer :\n\n• Produit : \n• Montant : jusqu'à ${fmt(client.crm_limit * 12)} FCFA\n• Taux préférentiel\n\nContactez votre conseiller pour plus d'informations.\n\nCordialement,\nL'équipe TERAS Banque` },
    alert:    { subject: 'Action requise sur votre compte', body: `Bonjour ${client.first_name},\n\nVotre attention est requise concernant votre compte TERAS.\n\n` },
  };

  const applyTemplate = (t: typeof type) => {
    setType(t);
    setSubject(TEMPLATES[t].subject);
    setBody(TEMPLATES[t].body);
  };

  const handleSend = async () => {
    if (!subject || !body) return;
    setSending(true);
    setError('');
    try {
      const res = await authFetch('/api/scoring/bank/send-message/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_email: client.email,
          subject,
          body,
          type,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setSent(true);
    } catch (e: any) {
      setError(e.message || "Impossible d'envoyer le message.");
    } finally {
      setSending(false);
    }
  };

  if (sent) return (
    <div className="text-center py-8">
      <Send className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
      <h3 className="text-white font-bold text-lg mb-2">Message envoyé !</h3>
      <p className="text-slate-400 text-sm mb-6">
        {client.first_name} {client.last_name} recevra le message sur <span className="text-white">{client.email}</span>
      </p>
      <button onClick={onClose} className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm">Fermer</button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Destinataire */}
      <div className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold">{client.first_name[0]}{client.last_name[0]}</span>
        </div>
        <div>
          <p className="text-white font-medium text-sm">{client.first_name} {client.last_name}</p>
          <p className="text-slate-400 text-xs">{client.email} · {client.phone}</p>
        </div>
      </div>

      {/* Type de message */}
      <div>
        <label className="text-slate-300 text-xs font-medium mb-2 block">Type de message</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: 'info',     label: '📋 Information',        color: 'blue'    },
            { id: 'offer',    label: '🎁 Offre commerciale',   color: 'emerald' },
            { id: 'reminder', label: '⏰ Rappel échéance',     color: 'amber'   },
            { id: 'alert',    label: '⚠️ Alerte compte',       color: 'red'     },
          ] as const).map(({ id, label, color }) => (
            <button key={id} onClick={() => applyTemplate(id)}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                type === id
                  ? `bg-${color}-500/20 text-${color}-400 border border-${color}-500/30`
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sujet */}
      <div>
        <label className="text-slate-300 text-xs font-medium mb-1.5 block">Sujet</label>
        <input value={subject} onChange={e => setSubject(e.target.value)}
          placeholder="Sujet du message"
          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
      </div>

      {/* Corps */}
      <div>
        <label className="text-slate-300 text-xs font-medium mb-1.5 block">Message</label>
        <textarea value={body} onChange={e => setBody(e.target.value)}
          rows={8}
          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 resize-none font-mono text-xs leading-relaxed" />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-3">
        <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors">Annuler</button>
        <button onClick={handleSend} disabled={sending || !subject || !body}
          className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
          {sending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Envoi…</> : <><Send className="w-4 h-4" /> Envoyer</>}
        </button>
      </div>
    </div>
  );
}

// ── Sous-composant produits éligibles ─────────────────────────────────────────
function ProductSuggestions({ score }: { score: number | null }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        const res  = await authFetch('/api/scoring/bank/products/');
        const json = await res.json();
        setProducts((Array.isArray(json) ? json : json.results ?? [])
          .filter((p: any) => !score || p.min_score_required <= score).slice(0, 4));
      } catch { setProducts([]); } finally { setLoading(false); }
    })();
  }, [score]);
  if (loading) return <p className="text-slate-500 text-xs text-center py-4">Chargement…</p>;
  if (!products.length) return <p className="text-slate-500 text-xs text-center py-4">Aucun produit éligible.</p>;
  return (
    <div className="space-y-3">
      {products.map(p => (
        <div key={p.id} className="bg-slate-800/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">{p.name}</p>
            <p className="text-slate-400 text-xs">{p.interest_rate}%/an · Score ≥ {p.min_score_required} · jusqu'à {fmt(p.max_amount)}</p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full shrink-0">Éligible</span>
        </div>
      ))}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function BankClientDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const fileRef   = useRef<HTMLInputElement>(null);

  const [client, setClient]         = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState('overview');
  const [uploading, setUploading]   = useState(false);
  const [uploadMsg, setUploadMsg]   = useState<string | null>(null);
  const [clientOwnedDocs, setClientOwnedDocs] = useState<any[]>([]);
  const [bankSideDocs, setBankSideDocs] = useState<any[]>([]);
  const [docsSummary, setDocsSummary] = useState<Record<string, number>>({});
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [copied, setCopied]         = useState(false);
  const [aiRecs, setAiRecs]         = useState<string[]>([]);
  const [aiLoading, setAiLoading]   = useState(false);
  const [refreshingPassport, setRefreshingPassport] = useState(false);
  // Modals
  const [modal, setModal] = useState<'credit' | 'simulator' | 'message' | null>(null);
  const [showPass, setShowPass] = useState(false);

  const loadClient = async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const res = await authFetch(`/api/scoring/bank/clients/${id}/`);
      if (!res.ok) throw new Error(`Client introuvable (${res.status})`);
      setClient(await res.json());
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  React.useEffect(() => { loadClient(); }, [id]);

  const loadClientDocs = React.useCallback(async () => {
    if (!id) return;
    setLoadingDocs(true);
    try {
      const res = await authFetch(`/api/scoring/bank/clients/${id}/documents/`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setClientOwnedDocs(data.client_documents || []);
      setBankSideDocs(data.bank_documents || []);
      setDocsSummary(data.summary || {});
    } catch (e: any) {
      setUploadMsg(`❌ ${e.message || 'Erreur chargement documents client.'}`);
    } finally {
      setLoadingDocs(false);
    }
  }, [id]);

  React.useEffect(() => {
    if (activeTab === 'documents') {
      loadClientDocs();
    }
  }, [activeTab, loadClientDocs]);

  const refreshPassport = async () => {
    if (!id) return;
    setRefreshingPassport(true);
    setError(null);
    try {
      const res = await authFetch(`/api/scoring/bank/clients/${id}/refresh-passport/`, { method: 'POST' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || `Erreur ${res.status}`);
      setClient(payload);
    } catch (e: any) {
      setError(e.message || 'Impossible de rafraichir le passeport client.');
    } finally {
      setRefreshingPassport(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !client) return;
    setUploading(true); setUploadMsg(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('doc_type', 'bank_document');
      form.append('notes', `Document banque — ${client.first_name} ${client.last_name}`);
      form.append('client_id', String(client.id));
      const res = await authFetch('/api/scoring/bank/documents/upload/', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      if (data.status === 'parsed') {
        setUploadMsg(`✅ Document client uploadé et analysé${data.transactions_count ? ` (${data.transactions_count} lignes)` : ''}`);
      } else if (data.status === 'processing') {
        setUploadMsg('✅ Document client enregistré. Analyse en arrière-plan en cours.');
      } else {
        setUploadMsg(data.message || '✅ Document client enregistré.');
      }
      loadClientDocs();
    } catch (e: any) { setUploadMsg(`❌ ${e.message}`); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleClientDocDownload = async (doc: any) => {
    try {
      const endpoint = doc.source === 'client'
        ? `/api/scoring/bank/client-documents/${doc.document_id}/download/`
        : `/api/scoring/bank/documents/${doc.id}/download/`;
      const res = await authFetch(endpoint);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = doc.filename || doc.id;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setUploadMsg(`❌ ${e.message || 'Téléchargement impossible.'}`);
    }
  };

  const handleBankDocDelete = async (doc: any) => {
    if (!confirm('Supprimer ce document banque ?')) return;
    try {
      const res = await authFetch(`/api/scoring/bank/documents/${doc.id}/delete/`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setUploadMsg('✅ Document supprimé.');
      if (previewDocId === doc.id) setPreviewDocId(null);
      loadClientDocs();
    } catch (e: any) {
      setUploadMsg(`❌ ${e.message || 'Suppression impossible.'}`);
    }
  };

  const handleClientDocReview = async (doc: any, reviewStatus: 'approved' | 'rejected') => {
    const defaultNote = reviewStatus === 'approved'
      ? 'Document vérifié par la banque.'
      : 'Document incomplet, illisible ou non conforme.';
    const note = window.prompt(
      reviewStatus === 'approved'
        ? 'Commentaire de validation (optionnel)'
        : 'Motif du rejet du document',
      defaultNote,
    );
    if (note === null) return;
    if (reviewStatus === 'rejected' && !note.trim()) {
      setUploadMsg('❌ Le motif du rejet est obligatoire.');
      return;
    }
    try {
      const res = await authFetch(`/api/scoring/bank/client-documents/${doc.document_id}/review/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: reviewStatus, notes: note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setUploadMsg(`✅ ${data.message || 'Document mis à jour.'}`);
      loadClientDocs();
    } catch (e: any) {
      setUploadMsg(`❌ ${e.message || 'Revue du document impossible.'}`);
    }
  };

  const allDocs = [...clientOwnedDocs, ...bankSideDocs];
  const previewDoc = allDocs.find(doc => doc.id === previewDocId) || null;
  const uploadedCoverage = REQUIRED_CLIENT_DOCS.map((requiredDoc) => {
    const matches = clientOwnedDocs.filter((doc) => matchesRequiredDoc(requiredDoc, doc));
    const approved = matches.some((doc) => doc.bank_review?.status === 'approved');
    return {
      ...requiredDoc,
      count: matches.length,
      approved,
    };
  });

  const generateAIRecs = async () => {
    if (!client) return;
    setAiLoading(true); setAiRecs([]);
    try {
      const bd = client.score_breakdown || {};
      const res = await authFetch('/api/scoring/user/recommendations/generate-from-simulation/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: client.teras_score || 0,
          breakdown: { T: bd.T||0, E: bd.E||0, R: bd.R||0, A: bd.A||0, S: bd.S||0 },
        }),
      });
      const data = await res.json();
      setAiRecs(data.recommendations || []);
    } catch { setAiRecs(['Augmente tes dépôts ZOLA régulièrement', 'Déclare tes actifs pour +30 pts', 'Maintiens 0 défaut de paiement']); }
    finally { setAiLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (error || !client) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <p className="text-rose-400">{error || 'Données indisponibles'}</p>
      <button onClick={() => navigate('/bank/clients')} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm">← Retour</button>
    </div>
  );

  const band      = client.teras_band || 'E';
  const bandCol   = BAND_COLOR[band] || 'slate';
  const breakdown = client.score_breakdown || {};
  const apps      = client.applications || [];
  const passport  = client.financial_passport || {};
  const docPassport = passport.documents || {};
  const analysisPassport = passport.analysis || {};
  const metricPassport = passport.metrics || {};
  const assetPassport = analysisPassport.asset_intelligence || {};

  const tabs = [
    { id: 'overview',        label: "Vue d'ensemble",  icon: BarChart3  },
    { id: 'scoring',         label: 'Score Détaillé',  icon: TrendingUp },
    { id: 'credits',         label: `Crédits (${apps.length})`, icon: DollarSign },
    { id: 'documents',       label: 'Documents',       icon: FileText   },
    { id: 'recommendations', label: 'IA Conseils',     icon: Zap        },
  ];

  return (
    <div className="space-y-6 p-1">

      {/* Modals */}
      {modal === 'credit'    && <Modal title="Proposer un crédit" onClose={() => setModal(null)}><ProposeCredit client={client} onClose={() => { setModal(null); loadClient(); }} /></Modal>}
      {modal === 'simulator' && <Modal title="Simulateur de crédit" onClose={() => setModal(null)}><SimulatorModal client={client} onClose={() => setModal(null)} /></Modal>}
      {modal === 'message'   && <Modal title="Envoyer un message" onClose={() => setModal(null)}><MessageModal client={client} onClose={() => setModal(null)} /></Modal>}

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/bank/clients')} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <span className="text-white text-xl font-bold">{client.first_name?.[0]}{client.last_name?.[0]}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{client.first_name} {client.last_name}</h1>
              <p className="text-slate-400 text-sm">NIU : {client.niu} · {client.city}, Congo (CG)</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-slate-400 text-xs mb-1">Score TERAS</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-white">{client.teras_score ?? '—'}</span>
              <span className={`px-2.5 py-1 bg-${bandCol}-500/10 text-${bandCol}-400 text-sm rounded-full font-semibold`}>{band}</span>
            </div>
          </div>
          <button onClick={refreshPassport} className="px-4 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 rounded-xl flex items-center gap-2 text-sm">
            <Zap className={`w-4 h-4 ${refreshingPassport ? 'animate-pulse' : ''}`} /> Rafraîchir le passeport
          </button>
          <button onClick={loadClient} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap text-sm ${activeTab === tab.id ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* VUE D'ENSEMBLE */}
          {activeTab === 'overview' && (
            <>
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
                <h2 className="text-white font-bold text-lg mb-5">Informations Client</h2>
                <div className="grid md:grid-cols-2 gap-5">
                  {[
                    { icon: Mail,     label: 'Email',            val: client.email },
                    { icon: Phone,    label: 'Téléphone',        val: client.phone },
                    { icon: Calendar, label: 'Date de naissance',val: fmtDate(client.date_of_birth) },
                    { icon: MapPin,   label: 'Adresse',          val: `${client.address || '—'}, ${client.city}` },
                    { icon: User,     label: 'Profession',       val: client.occupation || '—' },
                    { icon: Clock,    label: 'Client depuis',    val: fmtDate(client.join_date) },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="flex items-start gap-3">
                      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-slate-400 text-xs">{label}</p>
                        <p className="text-white text-sm">{val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
                <h2 className="text-white font-bold text-lg mb-5">Passeport Financier</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Revenus/mois',  val: fmt(metricPassport.verified_income_total || client.monthly_income), color: 'emerald' },
                    { label: 'CRM (30%)',      val: fmt(client.crm_limit),      color: 'sky'     },
                    { label: 'Crédits actifs', val: client.active_loans_count,  color: 'blue'    },
                    { label: 'Actifs vérifiés', val: fmt(metricPassport.verified_assets_total || 0), color: 'purple'  },
                  ].map(({ label, val, color }) => (
                    <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4`}>
                      <p className="text-slate-400 text-xs mb-1">{label}</p>
                      <p className={`text-${color}-400 font-bold`}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-white font-bold text-lg">Actifs & Garanties</h2>
                    <p className="text-slate-400 text-sm mt-1">
                      Lecture bancaire des preuves d&apos;actifs appliquees au dossier individuel.
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    assetPassport.asset_proof_strength === 'strong'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : assetPassport.asset_proof_strength === 'medium'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : assetPassport.asset_proof_strength === 'light'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }`}>
                    {assetPassport.asset_proof_strength === 'strong'
                      ? 'Dossier mobilisable'
                      : assetPassport.asset_proof_strength === 'medium'
                        ? 'Preuves solides'
                        : assetPassport.asset_proof_strength === 'light'
                          ? 'Base presente'
                          : 'A completer'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Pièces d'actifs", val: docPassport.proof_asset_docs || 0, color: 'sky' },
                    { label: 'Actifs appliqués', val: docPassport.proof_asset_docs_applied || 0, color: 'emerald' },
                    { label: 'Valeur documentée', val: fmt(metricPassport.documented_assets_total_xaf || 0), color: 'purple' },
                    { label: 'Garantie potentielle', val: fmt(metricPassport.collateral_candidate_value_xaf || 0), color: 'amber' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4`}>
                      <p className="text-slate-400 text-xs mb-1">{label}</p>
                      <p className={`text-${color}-400 font-bold`}>{val}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
                    <p className="text-slate-500 text-xs mb-1">Dernière preuve</p>
                    <p className="text-white font-medium">{assetPassport.latest_proof_label || docPassport.latest_proof_label || 'Aucune preuve d’actif appliquée'}</p>
                    <p className="text-slate-500 text-xs mt-1 truncate">{assetPassport.latest_proof_filename || docPassport.latest_proof_filename || 'Ajoutez facture, carte grise ou titre pour enrichir le passeport.'}</p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
                    <p className="text-slate-500 text-xs mb-1">Dernière valeur détectée</p>
                    <p className="text-white font-medium">{fmt(assetPassport.latest_asset_value_xaf || 0)}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {docPassport.latest_processed_at
                        ? `Traitée le ${fmtDate(docPassport.latest_processed_at)}`
                        : 'Aucun traitement d’actif récent.'}
                    </p>
                  </div>
                </div>

                {!!assetPassport.alerts?.length && (
                  <div className="mt-5 space-y-2">
                    {(assetPassport.alerts || []).slice(0, 2).map((item: string, index: number) => (
                      <div key={`${item}-${index}`} className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                        <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-slate-300">{item}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
                <h2 className="text-white font-bold text-lg mb-5">Couverture documentaire</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Pièces totales', val: docPassport.total_docs || 0, color: 'sky' },
                    { label: 'Analysées IA', val: docPassport.analyzed_docs || 0, color: 'violet' },
                    { label: 'Appliquées TERAS', val: docPassport.applied_docs || 0, color: 'emerald' },
                    { label: 'Recommandations ouvertes', val: metricPassport.pending_recommendations || 0, color: 'amber' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4`}>
                      <p className="text-slate-400 text-xs mb-1">{label}</p>
                      <p className={`text-${color}-400 font-bold`}>{val}</p>
                    </div>
                  ))}
                </div>

                {(analysisPassport.latest_strengths?.length || analysisPassport.latest_risks?.length || analysisPassport.latest_recommendations?.length) ? (
                  <div className="mt-5 grid md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/40 rounded-xl p-4">
                      <p className="text-emerald-400 text-xs font-semibold mb-2">Forces détectées</p>
                      {(analysisPassport.latest_strengths || []).slice(0, 3).map((item: string, index: number) => (
                        <p key={`strength-${index}`} className="text-sm text-slate-300 mb-1">• {item}</p>
                      ))}
                    </div>
                    <div className="bg-slate-800/40 rounded-xl p-4">
                      <p className="text-amber-400 text-xs font-semibold mb-2">Vigilances</p>
                      {(analysisPassport.latest_risks || []).slice(0, 3).map((item: string, index: number) => (
                        <p key={`risk-${index}`} className="text-sm text-slate-300 mb-1">• {item}</p>
                      ))}
                    </div>
                    <div className="bg-slate-800/40 rounded-xl p-4">
                      <p className="text-sky-400 text-xs font-semibold mb-2">Actions recommandées</p>
                      {(analysisPassport.latest_recommendations || []).slice(0, 3).map((item: string, index: number) => (
                        <p key={`action-${index}`} className="text-sm text-slate-300 mb-1">• {item}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm mt-5">
                    Aucun signal documentaire applique pour ce client pour le moment.
                  </p>
                )}

                {analysisPassport.latest_summary_meta && (
                  <div className="mt-5 rounded-xl bg-slate-800/40 p-4 border border-slate-700/60">
                    <p className="text-cyan-400 text-xs font-semibold mb-2">Dernière analyse appliquée au dossier</p>
                    <div className="grid md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Type</p>
                        <p className="text-white">{analysisPassport.latest_summary_meta.document_type || '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Impact estimé</p>
                        <p className="text-white">+{analysisPassport.latest_summary_meta.estimated_change || 0} pts</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Confiance</p>
                        <p className="text-white">{Math.round(Number(analysisPassport.latest_summary_meta.confidence || 0) * 100)}%</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Analysé le</p>
                        <p className="text-white">{fmtDate(analysisPassport.latest_summary_meta.analyzed_at)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 text-xs text-slate-500">
                  Dernier traitement : {fmtDate(docPassport.latest_processed_at)} · Dernière catégorie : {docPassport.latest_category || '—'} · Couverture dossier : {Math.round(Number(docPassport.coverage_ratio || 0) * 100)}%
                </div>
              </div>

              {client.teras_account_email && (
                <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sky-400 font-semibold flex items-center gap-2"><Shield className="w-4 h-4" /> Compte TERAS Auto-Créé</h3>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">✓ Actif</span>
                  </div>
                  <div className="space-y-3">
                    {/* Email */}
                    <div className="bg-slate-800/40 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-400 text-xs mb-0.5">Email de connexion</p>
                        <p className="text-white font-mono text-xs truncate">{client.teras_account_email}</p>
                      </div>
                      <button onClick={async () => { await navigator.clipboard.writeText(client.teras_account_email); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors shrink-0">
                        {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5 text-slate-500 hover:text-sky-400"/>}
                      </button>
                    </div>
                    {/* Mot de passe */}
                    {client.teras_account_password && (
                      <div className="bg-slate-800/40 rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-400 text-xs mb-0.5">Mot de passe initial</p>
                          <p className="text-white font-mono text-xs">
                            {showPass ? client.teras_account_password : '••••••••••••'}
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => setShowPass(p => !p)}
                            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
                            {showPass ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
                          </button>
                          <button onClick={async () => { await navigator.clipboard.writeText(client.teras_account_password); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
                            {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5 text-slate-500 hover:text-sky-400"/>}
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Lien interface */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <p className="text-slate-500">Le client modifie son mot de passe à la 1ère connexion.</p>
                      <a href="/login" target="_blank" rel="noopener" className="text-sky-400 hover:text-sky-300 flex items-center gap-1 shrink-0 ml-3">
                        Interface TERAS <ExternalLink className="w-3 h-3"/>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* SCORE DÉTAILLÉ */}
          {activeTab === 'scoring' && (
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-bold text-lg">Décomposition TERAS</h2>
                <span className={`px-3 py-1 bg-${bandCol}-500/10 text-${bandCol}-400 text-sm rounded-full font-semibold`}>{client.teras_score ?? '—'} pts — Bande {band}</span>
              </div>
              {Object.entries(PILLAR_CONFIG).map(([key, cfg]) => {
                const score = breakdown[key] ?? 0;
                const pct   = Math.round((score / cfg.max) * 100);
                return (
                  <div key={key} className="mb-5">
                    <div className="flex justify-between mb-2">
                      <span className="text-white font-semibold text-sm">{key} — {cfg.label} <span className="text-slate-400 text-xs">({score}/{cfg.max} pts)</span></span>
                      <span className={`text-${cfg.color}-400 text-sm font-bold`}>{pct}%</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full bg-${cfg.color}-500 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {!client.score_breakdown && <p className="text-center text-slate-500 text-sm py-4">Score non encore calculé.</p>}
              <div className="mt-5 pt-5 border-t border-slate-800/50 bg-sky-500/10 rounded-xl p-4">
                <p className="text-sky-400 font-semibold mb-3">CRM — Capacité de Remboursement Mensuelle</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><p className="text-slate-400 text-xs mb-0.5">Revenus/mois</p><p className="text-white font-bold">{fmt(client.monthly_income)}</p></div>
                  <div><p className="text-slate-400 text-xs mb-0.5">CRM = 30%</p><p className="text-sky-400 font-bold">{fmt(client.crm_limit)}</p></div>
                  <div><p className="text-slate-400 text-xs mb-0.5">Protocole</p><p className="text-slate-400 text-xs">ZOLA / TERAS standard</p></div>
                </div>
              </div>
            </div>
          )}

          {/* CRÉDITS */}
          {activeTab === 'credits' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setModal('credit')}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm flex items-center gap-2 transition-colors">
                  <Package className="w-4 h-4" /> Nouvelle demande
                </button>
              </div>
              {apps.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-12 text-center">
                  <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Aucune demande de crédit pour ce client.</p>
                  <button onClick={() => setModal('credit')} className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm">Proposer un crédit</button>
                </div>
              ) : apps.map((app: any) => (
                <div key={app.id} className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div><p className="text-white font-semibold">{app.product_name}</p><p className="text-slate-400 text-xs">{app.application_id}</p></div>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                      app.status === 'disbursed' ? 'bg-emerald-500/10 text-emerald-400' :
                      app.status === 'approved'  ? 'bg-green-500/10 text-green-400' :
                      app.status === 'pending'   ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {app.status === 'disbursed' ? 'Décaissé' : app.status === 'approved' ? 'Approuvé' : app.status === 'pending' ? 'En attente' : 'Rejeté'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><p className="text-slate-400 text-xs mb-0.5">Montant</p><p className="text-white font-semibold">{fmt(app.requested_amount)}</p></div>
                    <div><p className="text-slate-400 text-xs mb-0.5">Mensualité</p><p className="text-white font-semibold">{app.monthly_payment ? fmt(app.monthly_payment) : '—'}</p></div>
                    <div><p className="text-slate-400 text-xs mb-0.5">Durée</p><p className="text-white font-semibold">{app.duration_months} mois</p></div>
                  </div>
                  <p className="text-slate-500 text-xs mt-3">Score au dépôt : {app.teras_score_at_application ?? '—'} · {fmtDate(app.created_at)}</p>
                </div>
              ))}
            </div>
          )}

          {/* DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { label: 'Dossier client TERAS', value: docsSummary.client_documents ?? clientOwnedDocs.length, color: 'sky' },
                  { label: 'Pièces banque', value: docsSummary.bank_documents ?? bankSideDocs.length, color: 'violet' },
                  { label: 'À vérifier', value: docsSummary.pending_review ?? 0, color: 'amber' },
                  { label: 'Validées banque', value: docsSummary.approved_review ?? 0, color: 'emerald' },
                ].map((item) => (
                  <div key={item.label} className={`rounded-2xl border border-${item.color}-500/20 bg-${item.color}-500/10 p-4`}>
                    <p className="text-slate-400 text-xs mb-1">{item.label}</p>
                    <p className={`text-${item.color}-300 text-2xl font-bold`}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Upload className="w-4 h-4 text-sky-400" /> Ajouter un Document</h3>
                <div onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-sky-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors group">
                  <Upload className="w-10 h-10 text-slate-600 group-hover:text-sky-400 mx-auto mb-3 transition-colors" />
                  <p className="text-slate-400 text-sm mb-1">Cliquer pour uploader</p>
                  <p className="text-slate-600 text-xs">PDF, JPG, PNG, XLSX — Relevés, contrats, justificatifs, actifs…</p>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv" className="hidden" onChange={handleUpload} />
                </div>
                {uploading && <div className="flex items-center gap-2 mt-3 text-sky-400 text-sm"><RefreshCw className="w-4 h-4 animate-spin" /> Analyse IA en cours…</div>}
                {uploadMsg && <p className={`mt-3 text-sm ${uploadMsg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>{uploadMsg}</p>}
              </div>
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-800/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold">Dossier TERAS du client</h3>
                    <p className="text-slate-500 text-xs mt-1">Pièces déjà téléversées par le client, avec revue banque et notification automatique.</p>
                  </div>
                  <button onClick={loadClientDocs} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
                    <RefreshCw className={`w-4 h-4 ${loadingDocs ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                {loadingDocs ? (
                  <div className="p-6 text-sm text-slate-400 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Chargement des documents client...
                  </div>
                ) : clientOwnedDocs.length === 0 ? (
                  <div className="p-6 text-sm text-slate-500">
                    Aucun document TERAS client récupéré pour le moment.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/30">
                    {clientOwnedDocs.map(doc => (
                      <div key={doc.id} className="flex items-start justify-between gap-4 p-4 hover:bg-slate-800/20 transition-colors">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-sky-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white text-sm truncate">{doc.filename}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                              <span>{doc.category_label || doc.category || 'document'}</span>
                              <span>{doc.size_mb} MB</span>
                              <span>{fmtDate(doc.uploaded_at)}</span>
                              {doc.summary?.transactions_count ? <span>{doc.summary.transactions_count} lignes détectées</span> : null}
                              {doc.confidence ? <span>Confiance {Math.round(doc.confidence)}%</span> : null}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className={`px-2 py-1 rounded-full text-[11px] ${getDocStatusTone(doc.status)}`}>
                                {doc.display_status || doc.status}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-[11px] ${getReviewTone(doc.bank_review?.status)}`}>
                                {doc.bank_review?.status_label || 'À vérifier'}
                              </span>
                              {doc.bank_review?.notes ? (
                                <span className="text-slate-500 text-[11px] truncate max-w-[360px]">
                                  {doc.bank_review.notes}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                          <button
                            onClick={() => setPreviewDocId(doc.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Visualiser"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleClientDocDownload(doc)}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleClientDocReview(doc, 'approved')}
                            className="px-3 py-2 rounded-lg text-emerald-300 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 transition text-xs"
                            title="Valider et notifier"
                          >
                            Valider
                          </button>
                          <button
                            onClick={() => handleClientDocReview(doc, 'rejected')}
                            className="px-3 py-2 rounded-lg text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 transition text-xs"
                            title="Rejeter et notifier"
                          >
                            Rejeter
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-800/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold">Pièces ajoutées par la banque</h3>
                    <p className="text-slate-500 text-xs mt-1">Contrats, analyses, pièces complémentaires et documents de travail internes.</p>
                  </div>
                </div>
                {bankSideDocs.length === 0 ? (
                  <div className="p-6 text-sm text-slate-500">
                    Aucun document banque stocké pour ce client pour le moment.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/30">
                    {bankSideDocs.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-800/20 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-violet-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm truncate">{doc.filename}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                              <span>{doc.doc_type || 'document banque'}</span>
                              <span>{doc.size_mb} MB</span>
                              <span>{fmtDate(doc.uploaded_at)}</span>
                            </div>
                            <div className="mt-2">
                              <span className={`px-2 py-1 rounded-full text-[11px] ${getDocStatusTone(doc.status)}`}>
                                {doc.message || doc.display_status || doc.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setPreviewDocId(doc.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Visualiser"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleClientDocDownload(doc)}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleBankDocDelete(doc)}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-800/50"><h3 className="text-white font-semibold">Documents KYC Requis</h3></div>
                <div className="divide-y divide-slate-800/30">
                  {uploadedCoverage.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-800/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-700/50 flex items-center justify-center"><FileText className="w-4 h-4 text-sky-400" /></div>
                        <div>
                          <p className="text-white text-sm">{doc.name}</p>
                          <p className="text-slate-500 text-xs">{doc.type} · {doc.required ? 'Obligatoire' : 'Optionnel'} · {doc.count > 0 ? `${doc.count} reçu(x)` : 'Aucun reçu'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] ${
                          doc.approved
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : doc.count > 0
                              ? 'bg-amber-500/10 text-amber-300'
                              : 'bg-slate-700/70 text-slate-300'
                        }`}>
                          {doc.approved ? 'Vérifié' : doc.count > 0 ? 'Reçu' : 'Manquant'}
                        </span>
                        <button onClick={() => fileRef.current?.click()}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg flex items-center gap-1.5 transition-colors">
                          <Upload className="w-3 h-3" /> Ajouter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RECOMMANDATIONS IA */}
          {activeTab === 'recommendations' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0"><Zap className="w-6 h-6 text-blue-400" /></div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-1">Conseils IA Personnalisés</h3>
                    <p className="text-slate-400 text-sm">Basé sur le score de {client.first_name} ({client.teras_score ?? '?'}/1000)</p>
                  </div>
                  <button onClick={generateAIRecs} disabled={aiLoading}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm flex items-center gap-2">
                    {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {aiLoading ? 'Génération…' : 'Générer'}
                  </button>
                </div>
                {aiRecs.length > 0 ? (
                  <div className="space-y-3">
                    {aiRecs.map((rec, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-xl p-4 flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${i===0?'bg-green-500/20':i===1?'bg-blue-500/20':'bg-purple-500/20'}`}>
                          <span className={`font-bold text-sm ${i===0?'text-green-400':i===1?'text-blue-400':'text-purple-400'}`}>{i+1}</span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                ) : !aiLoading && <p className="text-slate-500 text-sm text-center py-4">Cliquez sur "Générer" pour obtenir des recommandations personnalisées.</p>}
              </div>
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-amber-400" /> Produits Financiers Éligibles</h3>
                <ProductSuggestions score={client.teras_score} />
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Actions rapides */}
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Actions Rapides</h3>
            <div className="space-y-2.5">
              <button onClick={() => setModal('credit')}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20">
                <Package className="w-4 h-4" /> Proposer un crédit
              </button>
              <button onClick={() => setModal('simulator')}
                className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-slate-700">
                <Calculator className="w-4 h-4" /> Simuler un crédit
              </button>
              <button onClick={() => setModal('message')}
                className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-slate-700">
                <MessageCircle className="w-4 h-4" /> Envoyer un message
              </button>
              <button onClick={loadClient}
                className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors border border-slate-700">
                <RefreshCw className="w-4 h-4" /> Actualiser les données
              </button>
            </div>
          </div>

          {/* Statut */}
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Statut du Compte</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Statut', val: client.status === 'active' ? 'Actif' : client.status, color: client.status === 'active' ? 'emerald' : 'red' },
                { label: 'NIU',   val: client.niu,   color: 'slate' },
                { label: 'Pays',  val: 'Congo (CG)', color: 'slate' },
                { label: 'Ville', val: client.city,  color: 'slate' },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-400">{label}</span>
                  <span className={`text-${color}-400 font-medium text-xs`}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risque */}
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Évaluation Risque</h3>
            {client.teras_score ? (
              <>
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Niveau de risque</span>
                    <span className={`text-${client.teras_score>=700?'emerald':client.teras_score>=500?'amber':'red'}-400 font-medium`}>
                      {client.teras_score>=700?'Faible':client.teras_score>=500?'Moyen':'Élevé'}
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${client.teras_score>=700?'bg-emerald-500':client.teras_score>=500?'bg-amber-500':'bg-red-500'}`}
                      style={{ width: `${Math.round((client.teras_score/1000)*100)}%` }} />
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-400">
                  {client.teras_score>=600 && <p className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-400"/>Score ≥ 600 — crédit standard éligible</p>}
                  {client.active_loans_count===0 && <p className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-400"/>Aucun crédit en cours</p>}
                  {client.monthly_income && parseFloat(client.monthly_income)>0 && <p className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-400"/>Revenus déclarés</p>}
                  {client.teras_score<500 && <p className="flex items-center gap-1.5"><AlertCircle className="w-3 h-3 text-amber-400"/>Score insuffisant — microcrédit uniquement</p>}
                </div>
              </>
            ) : <p className="text-slate-500 text-xs">Score non encore calculé.</p>}
          </div>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={!!previewDoc}
        title={previewDoc ? `Document ${previewDoc.source === 'client' ? 'TERAS' : 'banque'} — ${previewDoc.filename}` : ''}
        fileName={previewDoc?.filename || ''}
        sourceUrl={previewDoc
          ? previewDoc.source === 'client'
            ? `/api/scoring/bank/client-documents/${previewDoc.document_id}/download/`
            : `/api/scoring/bank/documents/${previewDoc.id}/download/`
          : ''}
        mode="auth-fetch"
        onClose={() => setPreviewDocId(null)}
        onDownload={() => {
          if (previewDoc) handleClientDocDownload(previewDoc);
        }}
      />
    </div>
  );
}
