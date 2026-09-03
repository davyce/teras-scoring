// teras-frontend/src/pages/bank/BankApplicationsApproved.tsx
import { authFetch } from '../../utils/authFetch';
import DossierModal from '../../components/bank/DossierModal';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, DollarSign, FileText, RefreshCw, Eye, User,
  Building2, Calendar, TrendingUp, AlertCircle,
  Search, Edit2, Save, X, Shield, Wallet,
  BarChart3, Clock, Package,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(val: string | number): string {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (!n || isNaN(n)) return '0 FCFA';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}k FCFA`;
  return `${n.toLocaleString('fr-FR')} FCFA`;
}
function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  approved:  { label: 'En attente client', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'   },
  disbursed: { label: 'Actif / Décaissé',  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20'},
};

// ── Modal : Modifier montant réservé ─────────────────────────────────────────
function EditAmountModal({ app, onClose, onSave }: { app: any; onClose: () => void; onSave: () => void }) {
  const [amount, setAmount]   = useState(app.requested_amount);
  const [duration, setDuration] = useState(app.duration_months);
  const [reason, setReason]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  // Calcul mensualité temps réel
  const rate    = parseFloat(app.interest_rate || '10') / 100 / 12;
  const n       = parseInt(duration);
  const amt     = parseFloat(amount);
  const monthly = !isNaN(amt) && !isNaN(n) && n > 0
    ? (rate > 0 ? amt * (rate * Math.pow(1+rate,n)) / (Math.pow(1+rate,n)-1) : amt/n)
    : 0;

  const handleSave = async () => {
    if (!reason.trim()) { setError('Le motif de modification est requis.'); return; }
    setSaving(true); setError('');
    try {
      const res = await authFetch(`/api/scoring/bank/applications/${app.id}/update-amount/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requested_amount: parseFloat(amount),
          duration_months:  parseInt(duration),
          reason,
        }),
      });
      if (res.ok) { setSuccess(true); setTimeout(() => { onSave(); onClose(); }, 1200); }
      else { const d = await res.json(); setError(d.error || 'Erreur lors de la mise à jour'); }
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (success) return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full text-center">
        <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-white font-bold text-lg">Montant mis à jour !</h3>
        <p className="text-slate-400 text-sm mt-1">Le client sera notifié du changement.</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-sky-400" /> Modifier le montant réservé
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {/* Infos actuelles */}
          <div className="bg-slate-800/40 rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Dossier</span>
              <span className="text-white">{app.application_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Client</span>
              <span className="text-white">{app.client_name || app.enterprise_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Montant actuel</span>
              <span className="text-amber-400 font-bold">{fmt(app.requested_amount)}</span>
            </div>
          </div>

          {/* Nouveau montant */}
          <div>
            <label className="text-slate-300 text-xs font-medium mb-1.5 block">
              Nouveau montant accordé (FCFA) *
            </label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500" />
          </div>

          {/* Durée */}
          <div>
            <label className="text-slate-300 text-xs font-medium mb-1.5 block">Durée (mois) *</label>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} min={1} max={120}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500" />
          </div>

          {/* Simulation temps réel */}
          {monthly > 0 && (
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-slate-400 mb-0.5">Mensualité</p>
                <p className="text-sky-400 font-bold">{fmt(Math.round(monthly))}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Total</p>
                <p className="text-white font-semibold">{fmt(Math.round(monthly * n))}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Intérêts</p>
                <p className="text-amber-400">{fmt(Math.round(monthly * n - amt))}</p>
              </div>
            </div>
          )}

          {/* Motif */}
          <div>
            <label className="text-slate-300 text-xs font-medium mb-1.5 block">Motif de modification *</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
              placeholder="Ex: Ajustement selon politique crédit Q2 2026, capacité CRM réévaluée..."
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 resize-none" />
          </div>

          {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{error}</p>}

          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm">Annuler</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
              {saving ? <><RefreshCw className="w-4 h-4 animate-spin"/>Mise à jour…</> : <><Save className="w-4 h-4"/>Enregistrer</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function BankApplicationsApproved() {
  const navigate  = useNavigate();
  const [apps, setApps]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<'all' | 'approved' | 'disbursed'>('all');
  const [editing, setEditing]   = useState<any | null>(null);
  const [dossierApp, setDossierApp] = useState<any | null>(null);
  // Stats réserve
  const [reserve, setReserve]   = useState<number>(50_000_000);
  const [editReserve, setEditReserve] = useState(false);
  const [newReserve, setNewReserve]   = useState('');

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res  = await authFetch('/api/scoring/bank/applications/approved/');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      setApps(Array.isArray(json) ? json : json.results ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = apps.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !search || (a.client_name||'').toLowerCase().includes(q) ||
      (a.enterprise_name||'').toLowerCase().includes(q) || (a.application_id||'').includes(q);
    const matchFilter = filter === 'all' || a.status === filter;
    return matchSearch && matchFilter;
  });

  // Stats
  const totalEngaged  = apps.filter(a => a.status === 'disbursed').reduce((s,a) => s + parseFloat(a.requested_amount||'0'), 0);
  const totalApproved = apps.filter(a => a.status === 'approved').reduce((s,a)  => s + parseFloat(a.requested_amount||'0'), 0);
  const used          = totalEngaged + totalApproved;
  const reservePct    = reserve > 0 ? Math.min(Math.round((used / reserve) * 100), 100) : 0;
  const available     = Math.max(reserve - used, 0);

  return (
    <div className="p-6 space-y-6">
      {dossierApp && <DossierModal app={dossierApp} onClose={() => setDossierApp(null)} />}
      {editing && <EditAmountModal app={editing} onClose={() => setEditing(null)} onSave={load} />}

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400" /> Portefeuille Crédits
          </h1>
          <p className="text-slate-400 text-sm mt-1">Crédits approuvés en attente d'acceptation + crédits actifs</p>
        </div>
        <button onClick={load} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* ── Gestion réserve crédit ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-sky-400" /> Réserve de Crédit Bancaire
          </h3>
          {!editReserve ? (
            <button onClick={() => { setEditReserve(true); setNewReserve(String(reserve)); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg text-xs font-medium transition-colors">
              <Edit2 className="w-3.5 h-3.5" /> Modifier le montant
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input type="number" value={newReserve} onChange={e => setNewReserve(e.target.value)}
                className="w-40 px-3 py-1.5 bg-slate-800 border border-sky-500/50 rounded-lg text-white text-xs focus:outline-none" />
              <button onClick={() => { setReserve(parseFloat(newReserve)||reserve); setEditReserve(false); }}
                className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors">
                <Save className="w-4 h-4" />
              </button>
              <button onClick={() => setEditReserve(false)} className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Jauge */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-400">Utilisé</span>
            <span className={`font-semibold ${reservePct > 80 ? 'text-red-400' : reservePct > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {reservePct}% — {fmt(used)}
            </span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${reservePct > 80 ? 'bg-red-500' : reservePct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${reservePct}%` }} />
          </div>
          {reservePct > 80 && (
            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Attention : réserve utilisée à plus de 80%
            </p>
          )}
        </div>

        {/* Chiffres */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-3">
            <p className="text-slate-400 text-xs mb-1">Réserve totale</p>
            <p className="text-white font-bold">{fmt(reserve)}</p>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
            <p className="text-slate-400 text-xs mb-1">Disponible</p>
            <p className="text-emerald-400 font-bold">{fmt(available)}</p>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
            <p className="text-slate-400 text-xs mb-1">Engagé</p>
            <p className="text-amber-400 font-bold">{fmt(used)}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total dossiers',  val: apps.length,                                                color: 'slate',   icon: BarChart3   },
          { label: 'En attente client',val: apps.filter(a=>a.status==='approved').length,              color: 'amber',   icon: Clock       },
          { label: 'Actifs / Décaissés',val: apps.filter(a=>a.status==='disbursed').length,            color: 'emerald', icon: CheckCircle },
          { label: 'Encours total',   val: fmt(totalEngaged),                                          color: 'sky',     icon: DollarSign  },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label} className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 text-${color}-400`} />
            </div>
            <div>
              <p className="text-slate-400 text-xs">{label}</p>
              <p className="text-white font-bold text-lg">{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres + Recherche */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher client, dossier…"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 text-sm" />
        </div>
        <div className="flex gap-2">
          {([['all', 'Tous'], ['approved', 'En attente client'], ['disbursed', 'Actifs']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === val ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-transparent'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" /> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-16 text-center">
          <Package className="w-14 h-14 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">
            {apps.length === 0 ? 'Aucun crédit approuvé' : 'Aucun résultat'}
          </h3>
          <p className="text-slate-400 text-sm">
            {apps.length === 0 ? 'Les crédits approuvés apparaîtront ici.' : 'Modifiez votre recherche.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const st = STATUS_CFG[app.status] || STATUS_CFG.approved;
            const isIndividual = app.applicant_type === 'individual';
            const score = app.teras_score_at_application;

            return (
              <div key={app.id}
                className={`border rounded-2xl p-5 transition-all ${app.status === 'disbursed' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900/50 border-slate-800/50 hover:border-amber-500/20'}`}>

                <div className="flex items-start justify-between gap-4 mb-4">
                  {/* Demandeur */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isIndividual ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                      {isIndividual ? <User className="w-5 h-5 text-blue-400"/> : <Building2 className="w-5 h-5 text-purple-400"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold text-sm">{app.client_name || app.enterprise_name || '—'}</p>
                        <span className="text-slate-500 text-xs">{app.application_id}</span>
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">{app.product_name} · {fmtDate(app.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {score && (
                      <div className="text-center">
                        <p className="text-slate-500 text-xs">Score</p>
                        <p className={`font-bold text-sm ${score>=700?'text-emerald-400':score>=500?'text-amber-400':'text-red-400'}`}>{score}</p>
                      </div>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${st.bg} ${st.color}`}>{st.label}</span>
                  </div>
                </div>

                {/* Montants */}
                <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                  <div className="bg-slate-800/40 rounded-xl p-3">
                    <p className="text-slate-500 text-xs mb-0.5">Montant accordé</p>
                    <p className="text-white font-bold text-base">{fmt(app.requested_amount)}</p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3">
                    <p className="text-slate-500 text-xs mb-0.5">Mensualité</p>
                    <p className={`font-semibold ${app.status==='disbursed'?'text-emerald-400':'text-white'}`}>
                      {app.monthly_payment && parseFloat(app.monthly_payment) > 0 ? fmt(app.monthly_payment) : '—'}
                    </p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3">
                    <p className="text-slate-500 text-xs mb-0.5">Durée</p>
                    <p className="text-white font-semibold">{app.duration_months} mois</p>
                  </div>
                </div>

                {/* Timeline si disbursed */}
                {app.status === 'disbursed' && (
                  <div className="bg-emerald-500/10 rounded-xl p-3 mb-4 flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="text-xs">
                      <span className="text-emerald-400 font-semibold">Crédit actif</span>
                      <span className="text-slate-400"> · Accepté le {fmtDate(app.reviewed_at || app.created_at)}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setDossierApp(app)}
                    className="px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-xl text-xs flex items-center gap-1.5 transition-colors font-medium">
                    <FileText className="w-3.5 h-3.5" /> Dossier complet
                  </button>

                  {/* Modifier montant (seulement si approved — client pas encore accepté) */}
                  {app.status === 'approved' && (
                    <button onClick={() => setEditing({ ...app, interest_rate: app.product?.interest_rate || '10' })}
                      className="px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-sky-500/20">
                      <Edit2 className="w-3.5 h-3.5" /> Modifier le montant
                    </button>
                  )}

                  {app.status === 'disbursed' && (
                    <div className="flex-1 flex items-center justify-end">
                      <span className="text-emerald-400 text-xs flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Remboursement en cours · {fmt(app.monthly_payment)}/mois
                      </span>
                    </div>
                  )}

                  {app.status === 'approved' && (
                    <div className="flex-1 flex items-center justify-end">
                      <span className="text-amber-400 text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        En attente d'acceptation par le client
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
