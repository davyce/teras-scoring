import { authFetch } from '../../utils/authFetch';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Clock,
  DollarSign,
  Eye,
  FileText,
  Percent,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';

type LoanItem = {
  id: number;
  application_id: string;
  applicant_type: 'individual' | 'enterprise';
  client?: number | null;
  enterprise?: number | null;
  client_name?: string | null;
  enterprise_name?: string | null;
  product_name?: string;
  product_type?: string;
  requested_amount?: number | string;
  monthly_payment?: number | string;
  total_repayment?: number | string;
  duration_months?: number;
  interest_rate?: number | string;
  teras_score_at_application?: number | null;
  risk_level?: string | null;
  status?: string;
  created_at?: string;
};

type AnalyticsData = {
  overview?: {
    portfolioValue?: number;
    totalLoans?: number;
    avgTicket?: number;
  };
  riskMetrics?: {
    portfolioHealth?: number;
    defaultRate?: number;
    collectionRate?: number;
    provisions?: number;
  };
  counts?: {
    pendingApplications?: number;
    approvedApplications?: number;
    rejectedApplications?: number;
  };
};

function toNumber(value: unknown): number {
  const parsed = typeof value === 'string' ? parseFloat(value) : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(amount: number): string {
  return `${Math.round(amount || 0).toLocaleString('fr-FR')} FCFA`;
}

function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} Md FCFA`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} M FCFA`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)} k FCFA`;
  return formatCurrency(amount);
}

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getRiskMeta(risk?: string | null) {
  const normalized = (risk || '').toLowerCase();
  if (normalized === 'low') return { label: 'Faible', color: 'emerald' };
  if (normalized === 'medium') return { label: 'Moyen', color: 'amber' };
  if (normalized === 'high' || normalized === 'critical') return { label: 'Élevé', color: 'rose' };
  return { label: 'À calculer', color: 'slate' };
}

function getStatusMeta(status?: string) {
  switch ((status || '').toLowerCase()) {
    case 'disbursed':
      return { label: 'Actif', color: 'emerald', bucket: 'active' };
    case 'approved':
      return { label: 'Approuvé', color: 'green', bucket: 'approved' };
    case 'review':
      return { label: 'En revue', color: 'sky', bucket: 'review' };
    case 'pending':
      return { label: 'En attente', color: 'amber', bucket: 'pending' };
    case 'rejected':
      return { label: 'Rejeté', color: 'rose', bucket: 'closed' };
    case 'cancelled':
      return { label: 'Annulé', color: 'slate', bucket: 'closed' };
    default:
      return { label: status || '—', color: 'slate', bucket: 'other' };
  }
}

export default function BankPortfolio() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolio = async () => {
    setLoading(true);
    setError(null);
    try {
      const [loansRes, analyticsRes] = await Promise.all([
        authFetch('/api/scoring/bank/applications/?page_size=200'),
        authFetch('/api/scoring/bank/analytics/'),
      ]);

      const loansPayload = await loansRes.json().catch(() => ({}));
      const analyticsPayload = await analyticsRes.json().catch(() => ({}));

      if (!loansRes.ok) throw new Error(loansPayload.error || `Erreur ${loansRes.status}`);
      if (!analyticsRes.ok) throw new Error(analyticsPayload.error || `Erreur ${analyticsRes.status}`);

      setLoans(Array.isArray(loansPayload) ? loansPayload : (loansPayload.results ?? []));
      setAnalytics(analyticsPayload);
    } catch (e: any) {
      setError(e.message || 'Impossible de charger le portefeuille.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const searchValue = search.trim().toLowerCase();
      const riskValue = (loan.risk_level || '').toLowerCase();

      const matchesSearch = !searchValue || [
        loan.application_id,
        loan.client_name,
        loan.enterprise_name,
        loan.product_name,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(searchValue));

      const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;
      const matchesRisk = filterRisk === 'all' || riskValue === filterRisk;
      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [filterRisk, filterStatus, loans, search]);

  const statusCounts = useMemo(() => {
    const counts = { active: 0, approved: 0, pending: 0, review: 0, closed: 0, other: 0 };
    for (const loan of filteredLoans) {
      const meta = getStatusMeta(loan.status);
      counts[meta.bucket as keyof typeof counts] += 1;
    }
    return counts;
  }, [filteredLoans]);

  const riskCounts = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, unknown: 0 };
    for (const loan of filteredLoans) {
      const risk = (loan.risk_level || '').toLowerCase();
      if (risk === 'low') counts.low += 1;
      else if (risk === 'medium') counts.medium += 1;
      else if (risk === 'high' || risk === 'critical') counts.high += 1;
      else counts.unknown += 1;
    }
    return counts;
  }, [filteredLoans]);

  const totalFilteredVolume = filteredLoans.reduce((sum, loan) => sum + toNumber(loan.requested_amount), 0);
  const avgFilteredScore = filteredLoans.length
    ? Math.round(
        filteredLoans
          .filter((loan) => loan.teras_score_at_application != null)
          .reduce((sum, loan, _, arr) => sum + (loan.teras_score_at_application || 0) / Math.max(arr.length, 1), 0),
      )
    : 0;

  const portfolioValue = toNumber(analytics?.overview?.portfolioValue);
  const avgTicket = toNumber(analytics?.overview?.avgTicket);
  const totalLoans = toNumber(analytics?.overview?.totalLoans || loans.length);
  const portfolioHealth = toNumber(analytics?.riskMetrics?.portfolioHealth);
  const defaultRate = toNumber(analytics?.riskMetrics?.defaultRate);
  const collectionRate = toNumber(analytics?.riskMetrics?.collectionRate);
  const provisions = toNumber(analytics?.riskMetrics?.provisions);

  const ratio = (value: number, total: number) => (total > 0 ? (value / total) * 100 : 0);

  const openDossier = (loan: LoanItem) => {
    if (loan.applicant_type === 'individual' && loan.client) {
      navigate(`/bank/clients/${loan.client}`);
      return;
    }
    if (loan.applicant_type === 'enterprise' && loan.enterprise) {
      navigate(`/bank/enterprises/${loan.enterprise}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 gap-3 text-slate-300">
        <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
        Chargement du portefeuille…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Portefeuille de Crédits</h1>
          <p className="text-slate-400 mt-1">
            Suivi consolidé des demandes, offres validées et crédits actifs de la banque.
          </p>
        </div>
        <button
          onClick={loadPortfolio}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="bg-rose-900/30 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3 text-rose-200 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
        {[
          { label: 'Encours actif', value: formatCompactCurrency(portfolioValue), icon: DollarSign, color: 'blue' },
          { label: 'Santé portefeuille', value: `${portfolioHealth.toFixed(1)}%`, icon: ShieldCheck, color: 'emerald' },
          { label: 'Taux de retard', value: `${defaultRate.toFixed(1)}%`, icon: Clock, color: 'amber' },
          { label: 'Taux de collecte', value: `${collectionRate.toFixed(1)}%`, icon: TrendingUp, color: 'cyan' },
          { label: 'Ticket moyen', value: formatCompactCurrency(avgTicket), icon: Percent, color: 'violet' },
          { label: 'Crédits suivis', value: totalLoans.toLocaleString('fr-FR'), icon: Users, color: 'purple' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl bg-${color}-500/15 flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${color}-300`} />
              </div>
              <div>
                <p className="text-slate-400 text-xs">{label}</p>
                <p className="text-white text-2xl font-bold">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-300" />
              Répartition par statut
            </h2>
            <span className="text-slate-500 text-xs">{filteredLoans.length} dossier(s) filtré(s)</span>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Actifs', value: statusCounts.active, color: 'bg-emerald-500' },
              { label: 'Approuvés', value: statusCounts.approved, color: 'bg-green-500' },
              { label: 'En instruction', value: statusCounts.pending + statusCounts.review, color: 'bg-amber-500' },
              { label: 'Clôturés', value: statusCounts.closed, color: 'bg-slate-500' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="text-white font-semibold">
                    {item.value} ({ratio(item.value, filteredLoans.length).toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${ratio(item.value, filteredLoans.length)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-300" />
              Lecture risque & pilotage
            </h2>
            <span className="text-slate-500 text-xs">Provision recommandée : {formatCompactCurrency(provisions)}</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-slate-500 text-xs mb-1">Volume filtré</p>
              <p className="text-white text-xl font-bold">{formatCompactCurrency(totalFilteredVolume)}</p>
              <p className="text-slate-400 text-xs mt-3">Score moyen filtré</p>
              <p className="text-cyan-300 text-lg font-semibold">{avgFilteredScore || '—'}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              {[
                { label: 'Risque faible', value: riskCounts.low, color: 'text-emerald-300' },
                { label: 'Risque moyen', value: riskCounts.medium, color: 'text-amber-300' },
                { label: 'Risque élevé', value: riskCounts.high, color: 'text-rose-300' },
              ].map((risk) => (
                <div key={risk.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{risk.label}</span>
                  <span className={`${risk.color} font-semibold`}>{risk.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-800 text-xs text-slate-500">
                En attente : {toNumber(analytics?.counts?.pendingApplications)} • Rejetées : {toNumber(analytics?.counts?.rejectedApplications)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <label className="text-slate-400 text-xs block mb-2">Recherche dossier</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Client, produit, identifiant…"
              className="w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-2">Filtrer par statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="review">En revue</option>
              <option value="approved">Approuvés</option>
              <option value="disbursed">Actifs</option>
              <option value="rejected">Rejetés</option>
              <option value="cancelled">Annulés</option>
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-2">Filtrer par risque</label>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">Tous les niveaux</option>
              <option value="low">Faible</option>
              <option value="medium">Moyen</option>
              <option value="high">Élevé</option>
              <option value="critical">Critique</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left p-4 text-slate-400 font-medium">Dossier</th>
                <th className="text-left p-4 text-slate-400 font-medium">Client</th>
                <th className="text-left p-4 text-slate-400 font-medium">Produit</th>
                <th className="text-right p-4 text-slate-400 font-medium">Montant</th>
                <th className="text-right p-4 text-slate-400 font-medium">Mensualité</th>
                <th className="text-center p-4 text-slate-400 font-medium">Score</th>
                <th className="text-center p-4 text-slate-400 font-medium">Statut</th>
                <th className="text-center p-4 text-slate-400 font-medium">Risque</th>
                <th className="text-left p-4 text-slate-400 font-medium">Déposé le</th>
                <th className="text-center p-4 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => {
                const statusMeta = getStatusMeta(loan.status);
                const riskMeta = getRiskMeta(loan.risk_level);
                const isEnterprise = loan.applicant_type === 'enterprise';
                const hasDossier = Boolean((isEnterprise && loan.enterprise) || (!isEnterprise && loan.client));

                return (
                  <tr key={loan.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <p className="text-white font-medium">{loan.application_id}</p>
                      <p className="text-slate-400 text-xs mt-1">
                        {toNumber(loan.interest_rate).toFixed(1)}% • {loan.duration_months || 0} mois
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isEnterprise ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
                          {isEnterprise ? (
                            <Building2 className="w-5 h-5 text-purple-300" />
                          ) : (
                            <User className="w-5 h-5 text-blue-300" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{loan.client_name || loan.enterprise_name || '—'}</p>
                          <p className="text-slate-500 text-xs">{isEnterprise ? 'Entreprise' : 'Particulier'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-white">{loan.product_name || '—'}</p>
                      <p className="text-slate-400 text-xs mt-1">{loan.product_type || 'Produit crédit'}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-white font-semibold">{formatCurrency(toNumber(loan.requested_amount))}</p>
                      <p className="text-slate-500 text-xs mt-1">
                        Total théorique: {formatCompactCurrency(toNumber(loan.total_repayment))}
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-cyan-300 font-semibold">{formatCurrency(toNumber(loan.monthly_payment))}</p>
                      <p className="text-slate-500 text-xs mt-1">mensualité estimée</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-white font-semibold">{loan.teras_score_at_application ?? '—'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-sm bg-${statusMeta.color}-500/10 text-${statusMeta.color}-300`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-sm bg-${riskMeta.color}-500/10 text-${riskMeta.color}-300`}>
                        {riskMeta.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-300 text-sm">{formatDate(loan.created_at)}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openDossier(loan)}
                          disabled={!hasDossier}
                          className="p-2 hover:bg-cyan-500/20 text-cyan-300 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Voir le dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(loan.status === 'pending' || loan.status === 'review') && (
                          <button
                            onClick={() => navigate('/bank/applications/pending')}
                            className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg text-xs transition-colors"
                          >
                            Traiter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLoans.length === 0 && (
          <div className="text-center py-14">
            <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Aucun dossier ne correspond aux filtres actuels.</p>
          </div>
        )}
      </div>
    </div>
  );
}
