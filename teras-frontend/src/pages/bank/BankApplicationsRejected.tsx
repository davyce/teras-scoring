import { authFetch } from '../../utils/authFetch';
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  XCircle,
  Eye,
  Search,
  AlertTriangle,
  TrendingDown,
  Users,
  User,
  Bell,
  Lightbulb,
  X,
  RefreshCw,
  AlertCircle,
  Download,
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

// ── Config raisons (dupliquée ici pour autonomie du fichier) ──────────────────
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

const fmt = (v: number) => new Intl.NumberFormat('fr-FR').format(v);

// ── Modal notification de rejet ───────────────────────────────────────────────
function RejectionNotificationModal({ app, onClose }: { app: any; onClose: () => void }) {
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendError, setResendError] = useState('');

  // Détecter le code raison depuis le champ reason ou comments
  const reasonCode = app.reason_code || app.reason || 'score_insufficient';
  const cfg = REJECTION_REASONS[reasonCode] || REJECTION_REASONS.score_insufficient;
  const clientName = app.clientName || app.client_name || 'Client';

  const handleResend = async () => {
    setResending(true); setResendError('');
    try {
      const res = await authFetch(`/api/scoring/bank/applications/${app.id}/resend-rejection-notification/`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setResendDone(true);
    } catch (e: any) {
      setResendError(e.message || 'Impossible de renvoyer la notification.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-400" />
            Notification de rejet — {app.id}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* En-tête notif simulée */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-white font-semibold text-sm">Décision sur votre demande de crédit</p>
            <p className="text-slate-400 text-xs mt-0.5">Réf. {app.id} · Rejetée le {app.rejectedAt ? new Date(app.rejectedAt).toLocaleDateString('fr-FR') : '—'}</p>
          </div>

          {/* Corps */}
          <div className="space-y-3 text-sm text-slate-300">
            <p>Bonjour <span className="text-white font-medium">{clientName}</span>,</p>
            <p>
              Après analyse de votre dossier, nous ne sommes pas en mesure de donner suite à votre demande de{' '}
              <span className="text-white font-medium">{fmt(app.amount)} FCFA</span> ({app.productType}).
            </p>

            {/* Motif */}
            <div className="bg-slate-800/60 rounded-lg px-3 py-2.5 border border-slate-700/50 space-y-1">
              <p className="text-xs text-slate-500">Motif officiel</p>
              <p className="text-amber-300 font-medium">{cfg.label}</p>
              {app.comments && (
                <p className="text-slate-400 text-xs italic">"{app.comments}"</p>
              )}
            </div>

            {/* Score */}
            {app.score && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Score TERAS à la demande :</span>
                <span className={`font-bold ${app.score >= 600 ? 'text-amber-400' : 'text-red-400'}`}>
                  {app.score}/1000
                </span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-500">{app.band}</span>
              </div>
            )}
          </div>

          {/* Étapes suivantes */}
          <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl px-4 py-3">
            <p className="text-sky-400 text-xs font-semibold flex items-center gap-1.5 mb-2.5">
              <Lightbulb className="w-3.5 h-3.5" /> Prochaines étapes recommandées
            </p>
            <ol className="space-y-1.5">
              {cfg.nextSteps.map((step, i) => (
                <li key={i} className="text-slate-300 text-xs flex items-start gap-2">
                  <span className="text-sky-500 font-bold shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <p className="text-xs text-slate-500">
            Par : {app.rejectedBy || '—'} · TERAS Banque
          </p>

          {resendError && (
            <p className="text-red-400 text-xs flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {resendError}
            </p>
          )}
          {resendDone && (
            <p className="text-emerald-400 text-xs flex items-center gap-1">
              ✓ Notification renvoyée avec succès.
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors">
              Fermer
            </button>
            {!resendDone && (
              <button onClick={handleResend} disabled={resending}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                {resending
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Envoi…</>
                  : <><Bell className="w-4 h-4" /> Renvoyer la notification</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const exportCSV = (apps: any[]) => {
  const headers = ['ID', 'Client', 'Produit', 'Montant', 'Score', 'Bande', 'Raison', 'Rejeté le', 'Par'];
  const rows = apps.map(a => [
    a.id, a.clientName, a.productType, a.amount, a.score, a.band,
    a.reason, a.rejectedAt ? new Date(a.rejectedAt).toLocaleDateString('fr-FR') : '', a.rejectedBy,
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `rejets-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
};

export default function BankApplicationsRejected() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReason, setFilterReason] = useState('all');
  const [applications, setApplications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notifApp, setNotifApp] = React.useState<any | null>(null);
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const debouncedSearch = useDebounce(searchTerm, 300);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/scoring/bank/applications/rejected/');
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const json = await res.json();
        setApplications(Array.isArray(json) ? json : (json.applications ?? json.data ?? []));
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  React.useEffect(() => { setPage(1); }, [debouncedSearch, filterReason]);


  const reasons = {
    score_insufficient: 'Score TERAS insuffisant',
    capacity_exceeded: 'Capacité de remboursement dépassée',
    documents_incomplete: 'Documents incomplets',
    credit_history: 'Historique crédit négatif',
    fraud_suspicion: 'Suspicion de fraude',
  };

  const getReasonColor = (reason: string) => {
    const colors = {
      score_insufficient: 'orange',
      capacity_exceeded: 'red',
      documents_incomplete: 'amber',
      credit_history: 'red',
      fraud_suspicion: 'red',
    };
    return colors[reason as keyof typeof colors] || 'slate';
  };

  const getBandColor = (band: string) => {
    const colors = {
      'A+': 'emerald',
      'A': 'green',
      'B': 'blue',
      'C': 'amber',
      'D': 'orange',
      'E': 'red',
    };
    return colors[band as keyof typeof colors] || 'slate';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredApplications = useMemo(() => applications.filter(app => {
    const matchSearch = !debouncedSearch ||
      (app.clientName || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      String(app.id).toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchReason = filterReason === 'all' || app.reason === filterReason;
    return matchSearch && matchReason;
  }), [applications, debouncedSearch, filterReason]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const pagedApplications = filteredApplications.slice((safePage - 1) * pageSize, safePage * pageSize);

  const stats = {
    total: applications.length,
    totalAmount: applications.reduce((sum, a) => sum + a.amount, 0),
    avgScore: Math.round(applications.reduce((sum, a) => sum + a.score, 0) / applications.length),
    mainReason: 'score_insufficient',
  };

  return (
    <div className="space-y-6">
      {notifApp && <RejectionNotificationModal app={notifApp} onClose={() => setNotifApp(null)} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Demandes Rejetées</h1>
          <p className="text-slate-400 mt-1">{stats.total} demandes rejetées</p>
        </div>
        {!loading && applications.length > 0 && (
          <button
            onClick={() => exportCSV(filteredApplications)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-300 rounded-xl text-sm transition-all shrink-0">
            <Download className="w-3.5 h-3.5" /> Exporter CSV
          </button>
        )}
      </div>

      {/* Stats KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Rejetées</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Score Moyen</p>
              <p className="text-2xl font-bold text-white">{stats.avgScore}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Montant Refusé</p>
              <p className="text-2xl font-bold text-white">{(stats.totalAmount / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Raison Principale</p>
              <p className="text-sm font-semibold text-white">Score insuffisant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom ou numéro..."
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Toutes les raisons</option>
              {Object.entries(reasons).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left p-4 text-slate-400 font-medium">Demande</th>
                <th className="text-left p-4 text-slate-400 font-medium">Client</th>
                <th className="text-left p-4 text-slate-400 font-medium">Produit</th>
                <th className="text-right p-4 text-slate-400 font-medium">Montant</th>
                <th className="text-center p-4 text-slate-400 font-medium">Score</th>
                <th className="text-left p-4 text-slate-400 font-medium">Raison</th>
                <th className="text-left p-4 text-slate-400 font-medium">Rejeté Le</th>
                <th className="text-center p-4 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50 animate-pulse">
                    <td className="p-4"><div className="h-4 bg-slate-800 rounded w-20" /></td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-full shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-4 bg-slate-800 rounded w-32" />
                          <div className="h-3 bg-slate-800/60 rounded w-20" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4"><div className="h-4 bg-slate-800 rounded w-24" /></td>
                    <td className="p-4 text-right"><div className="h-4 bg-slate-800 rounded w-20 ml-auto" /></td>
                    <td className="p-4"><div className="h-6 bg-slate-800 rounded w-12 mx-auto" /></td>
                    <td className="p-4"><div className="h-6 bg-slate-800 rounded-lg w-28" /></td>
                    <td className="p-4"><div className="h-4 bg-slate-800 rounded w-24" /></td>
                    <td className="p-4"><div className="flex gap-2 justify-center"><div className="h-8 w-8 bg-slate-800 rounded-lg" /><div className="h-8 w-8 bg-slate-800 rounded-lg" /></div></td>
                  </tr>
                ))
              ) : pagedApplications.map((app) => (
                <tr
                  key={app.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="p-4">
                    <p className="text-white font-medium">{app.id}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{app.clientName}</p>
                        <p className="text-slate-400 text-sm">{app.clientId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-white">{app.productType}</p>
                    <p className="text-slate-400 text-sm">{app.duration} mois</p>
                  </td>
                  <td className="p-4 text-right">
                    <p className="text-white font-semibold">{formatCurrency(app.amount)} CFA</p>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-white font-semibold">{app.score}</span>
                      <span className={`px-2 py-0.5 bg-${getBandColor(app.band)}-500/10 text-${getBandColor(app.band)}-400 text-xs rounded`}>
                        {app.band}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 bg-${getReasonColor(app.reason)}-500/10 text-${getReasonColor(app.reason)}-400 text-sm rounded-lg inline-block`}>
                      {reasons[app.reason as keyof typeof reasons]}
                    </span>
                    <p className="text-slate-400 text-xs mt-1">{app.comments}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-300 text-sm">{formatDate(app.rejectedAt)}</p>
                    <p className="text-slate-400 text-xs">Par {app.rejectedBy}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => navigate(`/bank/clients/${app.clientId}`)}
                        className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                        title="Voir le dossier client"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setNotifApp(app)}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        title="Voir / renvoyer la notification"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <XCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Aucune demande rejetée</p>
          </div>
        )}

        {/* Pagination footer */}
        {!loading && filteredApplications.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-xs text-slate-500">
              {filteredApplications.length} demande{filteredApplications.length > 1 ? 's' : ''}
              {(debouncedSearch || filterReason !== 'all') && ' · filtrées'}
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Par page :</span>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="text-xs bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-lg px-2 py-1 focus:outline-none">
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 disabled:opacity-30 hover:bg-slate-700 text-xs transition">
                  ‹
                </button>
                <span className="px-2.5 py-1 text-xs text-slate-400">
                  {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 disabled:opacity-30 hover:bg-slate-700 text-xs transition">
                  ›
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistiques par Raison */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Répartition par Raison de Rejet</h3>

        <div className="space-y-3">
          {Object.entries(reasons).map(([key, label]) => {
            const count = applications.filter(a => a.reason === key).length;
            const percentage = (count / applications.length) * 100;

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 text-sm">{label}</span>
                  <span className="text-white font-semibold">{count} ({percentage.toFixed(0)}%)</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-${getReasonColor(key)}-500 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}