//teras-frontend/src/pages/bank/BankApplicationsPending.tsx

import { authFetch } from '../../utils/authFetch';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, CheckCircle, XCircle, Eye, RefreshCw,
  User, Building2, DollarSign, Calendar, AlertCircle,
  Filter, Search, ChevronDown, FileText, Bell, ChevronRight,
  Lightbulb, MessageSquare,
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

// ── Config raisons de rejet ───────────────────────────────────────────────────
const REJECTION_REASONS: Record<string, { label: string; nextSteps: string[] }> = {
  score_insufficient: {
    label: 'Score TERAS insuffisant',
    nextSteps: [
      'Augmentez la fréquence de vos transactions mobiles',
      'Uploadez vos bulletins de salaire et relevés bancaires',
      'Diversifiez vos sources de revenus déclarées',
      'Repostulez dans 3 mois après amélioration du score',
    ],
  },
  capacity_exceeded: {
    label: 'Capacité de remboursement dépassée',
    nextSteps: [
      'Réduisez le montant demandé ou allongez la durée',
      'Déclarez des revenus supplémentaires vérifiables',
      'Réduisez vos charges fixes existantes',
      'Proposez une garantie ou co-emprunteur',
    ],
  },
  documents_incomplete: {
    label: 'Documents incomplets',
    nextSteps: [
      'Complétez votre dossier KYC (pièce d\'identité valide)',
      'Ajoutez 3 mois de relevés bancaires récents',
      'Fournissez une preuve de domicile de moins de 3 mois',
      'Resoumettez votre dossier une fois complet',
    ],
  },
  credit_history: {
    label: 'Historique crédit négatif',
    nextSteps: [
      'Régularisez tout impayé ou incident de paiement',
      'Maintenez une activité financière régulière pendant 6 mois',
      'Consultez l\'assistant TERAS pour un plan de remédiation',
      'Repostulez après 6 mois de comportement exemplaire',
    ],
  },
  fraud_suspicion: {
    label: 'Incohérence dans le dossier',
    nextSteps: [
      'Contactez votre conseiller bancaire pour clarification',
      'Fournissez des justificatifs supplémentaires à votre agence',
      'Mettez à jour vos informations personnelles sur la plateforme',
    ],
  },
  income_unverified: {
    label: 'Revenus non vérifiables',
    nextSteps: [
      'Téléversez vos fiches de paie des 3 derniers mois',
      'Fournissez une attestation d\'employeur ou avis d\'imposition',
      'Déclarez vos revenus informels avec des preuves de transaction',
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(val: string | number): string {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (!n) return '0 FCFA';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}k FCFA`;
  return `${n.toLocaleString('fr-FR')} FCFA`;
}
function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Aperçu notification client ────────────────────────────────────────────────
function RejectionNotificationPreview({ app, reasonCode, customMsg }: {
  app: any; reasonCode: string; customMsg: string;
}) {
  const cfg = REJECTION_REASONS[reasonCode];
  const clientName = app.client_name || app.enterprise_name || 'Client';
  const score = app.teras_score_at_application;

  return (
    <div className="bg-slate-950 border border-red-500/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-4 h-4 text-red-400" />
        <span className="text-xs font-bold text-red-400 uppercase tracking-wide">Aperçu — Notification client</span>
      </div>

      {/* En-tête notif */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
        <p className="text-white font-semibold text-sm">Décision sur votre demande de crédit</p>
        <p className="text-slate-400 text-xs mt-0.5">Réf. {app.application_id}</p>
      </div>

      {/* Corps */}
      <div className="space-y-2 text-sm text-slate-300">
        <p>Bonjour <span className="text-white font-medium">{clientName}</span>,</p>
        <p>
          Après analyse de votre dossier, nous ne sommes pas en mesure de donner suite à votre demande de{' '}
          <span className="text-white font-medium">{fmt(app.requested_amount)}</span> ({app.product_name}).
        </p>

        {/* Motif */}
        <div className="bg-slate-800/60 rounded-lg px-3 py-2 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-0.5">Motif principal</p>
          <p className="text-amber-300 font-medium">{cfg?.label || reasonCode}</p>
          {customMsg && <p className="text-slate-400 text-xs mt-1 italic">"{customMsg}"</p>}
        </div>

        {/* Score */}
        {score && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Score TERAS au moment de la demande :</span>
            <span className={`font-bold ${score >= 600 ? 'text-amber-400' : 'text-red-400'}`}>{score}/1000</span>
          </div>
        )}
      </div>

      {/* Étapes suivantes */}
      {cfg && (
        <div className="bg-sky-500/5 border border-sky-500/20 rounded-lg px-4 py-3">
          <p className="text-sky-400 text-xs font-semibold flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3.5 h-3.5" /> Prochaines étapes recommandées
          </p>
          <ol className="space-y-1">
            {cfg.nextSteps.map((step, i) => (
              <li key={i} className="text-slate-300 text-xs flex items-start gap-2">
                <span className="text-sky-500 font-bold shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="text-xs text-slate-500 pt-1">
        Vous pouvez améliorer votre dossier et soumettre une nouvelle demande via la plateforme TERAS.
      </p>
    </div>
  );
}

// ── Modal de décision ─────────────────────────────────────────────────────────
function DecisionModal({
  app, onClose, onDone,
}: { app: any; onClose: () => void; onDone: () => void }) {
  const [decision, setDecision]    = useState<'approved' | 'rejected' | null>(null);
  const [reasonCode, setReasonCode] = useState('score_insufficient');
  const [customMsg, setCustomMsg]  = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving]        = useState(false);
  const [done, setDone]            = useState(false);
  const [error, setError]          = useState('');

  const handleSubmit = async () => {
    if (!decision) return;
    setSaving(true); setError('');
    const rejectionReason = decision === 'rejected'
      ? `${REJECTION_REASONS[reasonCode]?.label}${customMsg ? ` — ${customMsg}` : ''}`
      : '';
    try {
      const res = await authFetch(`/api/scoring/bank/applications/${app.id}/review/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: decision,
          rejection_reason: rejectionReason,
          rejection_reason_code: reasonCode,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(JSON.stringify(d)); }
      setDone(true);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (done) return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center">
        {decision === 'approved'
          ? <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          : <Bell className="w-16 h-16 text-red-400 mx-auto mb-4" />
        }
        <h3 className="text-white font-bold text-xl mb-2">
          Demande {decision === 'approved' ? 'approuvée' : 'rejetée'}
        </h3>
        <p className="text-slate-400 text-sm mb-2">
          {app.client_name || app.enterprise_name} a été notifié(e) de la décision.
        </p>
        {decision === 'rejected' && (
          <p className="text-xs text-sky-400 mb-6">
            Les étapes de remédiation ont été incluses dans la notification.
          </p>
        )}
        <button onClick={() => { onDone(); onClose(); }}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm">
          Fermer
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-white font-bold">Décision — {app.application_id}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Récapitulatif */}
          <div className="bg-slate-800/50 rounded-xl p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between col-span-2 border-b border-slate-700/50 pb-2 mb-1">
              <span className="text-slate-400">Client</span>
              <span className="text-white font-medium">{app.client_name || app.enterprise_name}</span>
            </div>
            <div className="flex justify-between"><span className="text-slate-400">Produit</span><span className="text-white">{app.product_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Montant</span><span className="text-white font-bold">{fmt(app.requested_amount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Durée</span><span className="text-white">{app.duration_months} mois</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Score TERAS</span>
              <span className={`font-medium ${(app.teras_score_at_application ?? 0) >= 600 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {app.teras_score_at_application ?? '—'}
              </span>
            </div>
          </div>

          {/* Choix approuver / rejeter */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { setDecision('approved'); setShowPreview(false); }}
              className={`py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all border ${decision === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-emerald-500/30'}`}>
              <CheckCircle className="w-4 h-4" /> Approuver
            </button>
            <button onClick={() => setDecision('rejected')}
              className={`py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all border ${decision === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-red-500/30'}`}>
              <XCircle className="w-4 h-4" /> Rejeter
            </button>
          </div>

          {/* Section rejet structurée */}
          {decision === 'rejected' && (
            <div className="space-y-4">
              {/* Code raison */}
              <div>
                <label className="text-slate-300 text-xs font-medium mb-1.5 block">Motif officiel *</label>
                <select
                  value={reasonCode}
                  onChange={e => setReasonCode(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50">
                  {Object.entries(REJECTION_REASONS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Message complémentaire */}
              <div>
                <label className="text-slate-300 text-xs font-medium mb-1.5 block flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> Message complémentaire (optionnel)
                </label>
                <textarea
                  value={customMsg}
                  onChange={e => setCustomMsg(e.target.value)}
                  rows={2}
                  placeholder="Précisions supplémentaires pour le client…"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 resize-none placeholder-slate-500"
                />
              </div>

              {/* Toggle aperçu */}
              <button
                onClick={() => setShowPreview(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-sm text-slate-300 transition">
                <span className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-sky-400" />
                  Aperçu notification client
                </span>
                <ChevronRight className={`w-4 h-4 transition-transform ${showPreview ? 'rotate-90' : ''}`} />
              </button>

              {showPreview && (
                <RejectionNotificationPreview
                  app={app}
                  reasonCode={reasonCode}
                  customMsg={customMsg}
                />
              )}
            </div>
          )}

          {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}

          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm">Annuler</button>
            <button onClick={handleSubmit} disabled={!decision || saving}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${
                decision === 'approved' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                decision === 'rejected' ? 'bg-red-500 hover:bg-red-600 text-white' :
                'bg-slate-700 text-slate-400'
              }`}>
              {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Traitement…</> :
               decision === 'approved' ? <><CheckCircle className="w-4 h-4" /> Confirmer l'approbation</> :
               decision === 'rejected' ? <><Bell className="w-4 h-4" /> Confirmer & notifier le client</> :
               'Choisir une décision'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function BankApplicationsPending() {
  const navigate = useNavigate();
  const [apps, setApps]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<any | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res  = await authFetch('/api/scoring/bank/applications/pending/');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      setApps(Array.isArray(json) ? json : json.results ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => apps.filter(a => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (a.client_name || '').toLowerCase().includes(q) ||
           (a.enterprise_name || '').toLowerCase().includes(q) ||
           (a.application_id || '').toLowerCase().includes(q) ||
           (a.product_name || '').toLowerCase().includes(q);
  }), [apps, debouncedSearch]);

  const stats = {
    total:   apps.length,
    volume:  apps.reduce((s, a) => s + parseFloat(a.requested_amount || '0'), 0),
    avgScore: apps.length ? Math.round(apps.filter(a => a.teras_score_at_application).reduce((s, a) => s + (a.teras_score_at_application || 0), 0) / Math.max(apps.filter(a => a.teras_score_at_application).length, 1)) : 0,
  };

  return (
    <div className="p-6 space-y-6">
      {selected && <DecisionModal app={selected} onClose={() => setSelected(null)} onDone={load} />}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-400" />
            Demandes En Attente
          </h1>
          <p className="text-slate-400 mt-1 text-sm">{stats.total} demandes à traiter · Volume : {fmt(stats.volume)}</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'En attente',    val: stats.total,           color: 'amber',   icon: Clock       },
          { label: 'Volume total',  val: fmt(stats.volume),     color: 'blue',    icon: DollarSign  },
          { label: 'Score moyen',   val: stats.avgScore || '—', color: 'emerald', icon: FileText    },
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

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par client, produit, ID…"
          className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-slate-800/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-sm" />
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={load} className="ml-auto flex items-center gap-1 hover:text-red-100"><RefreshCw className="w-3.5 h-3.5" /> Réessayer</button>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-800 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-800 rounded w-40" />
                  <div className="h-3 bg-slate-800/60 rounded w-28" />
                </div>
                <div className="h-6 bg-slate-800 rounded-full w-20" />
              </div>
              <div className="mt-3 h-3 bg-slate-800/40 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-16 text-center">
          <CheckCircle className="w-14 h-14 text-emerald-400/50 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">
            {apps.length === 0 ? 'Aucune demande en attente' : 'Aucun résultat'}
          </h3>
          <p className="text-slate-400 text-sm">
            {apps.length === 0 ? 'Toutes les demandes ont été traitées.' : 'Modifiez votre recherche.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const isIndividual = app.applicant_type === 'individual';
            const score = app.teras_score_at_application;
            const scoreColor = !score ? 'slate' : score >= 700 ? 'emerald' : score >= 500 ? 'amber' : 'red';

            return (
              <div key={app.id}
                className="bg-slate-900/50 border border-slate-800/50 hover:border-amber-500/20 rounded-2xl p-5 transition-all">
                <div className="flex items-start justify-between gap-4">

                  {/* Infos demandeur */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isIndividual ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                      {isIndividual
                        ? <User className={`w-5 h-5 text-blue-400`} />
                        : <Building2 className={`w-5 h-5 text-purple-400`} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold text-sm">
                          {app.client_name || app.enterprise_name || '—'}
                        </p>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${isIndividual ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                          {isIndividual ? 'Particulier' : 'Entreprise'}
                        </span>
                        <span className="text-slate-500 text-xs">{app.application_id}</span>
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">{app.product_name} · Déposée le {fmtDate(app.created_at)}</p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-center shrink-0">
                    <p className="text-slate-400 text-xs mb-0.5">Score</p>
                    <span className={`text-${scoreColor}-400 font-bold text-base`}>{score ?? '—'}</span>
                  </div>
                </div>

                {/* Montants */}
                <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-0.5">Montant demandé</p>
                    <p className="text-white font-bold">{fmt(app.requested_amount)}</p>
                  </div>
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-0.5">Mensualité</p>
                    <p className="text-white font-semibold">{app.monthly_payment ? fmt(app.monthly_payment) : '—'}</p>
                  </div>
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-0.5">Durée</p>
                    <p className="text-white font-semibold">{app.duration_months} mois</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      if (isIndividual && app.client) navigate(`/bank/clients/${app.client}`);
                      else if (app.enterprise) navigate(`/bank/enterprises/${app.enterprise}`);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> Voir le dossier
                  </button>
                  <button
                    onClick={() => setSelected(app)}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                    <Clock className="w-4 h-4" /> Traiter la demande
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
