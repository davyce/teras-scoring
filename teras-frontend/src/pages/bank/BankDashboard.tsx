// src/pages/bank/BankDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, Users, TrendingUp, Activity, Clock, CheckCircle,
  ArrowUpRight, ArrowDownRight, BarChart3, CreditCard,
  AlertCircle, RefreshCw, Bell, XCircle, AlertTriangle, Info,
  ChevronRight, PhoneCall, FileSearch,
} from 'lucide-react';

// ─── authFetch inline (compatible avec les deux chemins du projet) ─────────────
async function apiFetch(url: string): Promise<Response> {
  const token =
    localStorage.getItem('teras_access_token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token');
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface AppSummary {
  id: number;
  application_id: string;
  client_name: string | null;
  enterprise_name: string | null;
  requested_amount: number;
  status: string;
}

interface TopProduct { name: string; volume: number; count: number; color?: string; }
interface PortfolioHealth { on_time_rate: number; late_rate: number; collection_rate: number; avg_roi: number; }

interface DashboardData {
  total_clients: number;    clients_growth: number;
  active_loans: number;     loans_growth: number;
  portfolio_value: number;  portfolio_growth: number;
  avg_score: number;        score_growth: number;
  recent_applications: AppSummary[];
  top_products: TopProduct[];
  portfolio_health: PortfolioHealth;
}

// ─── Données mock (fallback si backend indisponible) ─────────────────────────
const MOCK: DashboardData = {
  total_clients: 1247,   clients_growth: 15.8,
  active_loans: 156,     loans_growth: 18.2,
  portfolio_value: 145_000_000, portfolio_growth: 23.5,
  avg_score: 704,        score_growth: 12.3,
  recent_applications: [
    { id: 1, application_id: 'APP-001', client_name: 'Marie Kanda',           enterprise_name: null, requested_amount: 1_200_000, status: 'pending'  },
    { id: 2, application_id: 'APP-002', client_name: 'Jean Mukendi',          enterprise_name: null, requested_amount: 2_500_000, status: 'approved' },
    { id: 3, application_id: 'APP-003', client_name: 'Paul Nzambi',           enterprise_name: null, requested_amount: 4_200_000, status: 'pending'  },
    { id: 4, application_id: 'APP-004', client_name: null, enterprise_name: 'Restaurant Le Fleuve',  requested_amount: 3_500_000, status: 'approved' },
    { id: 5, application_id: 'APP-005', client_name: 'Alice Mbemba',          enterprise_name: null, requested_amount: 800_000,   status: 'review'   },
  ],
  top_products: [
    { name: 'Crédit Immobilier', volume: 45_000_000, count: 12, color: 'blue'   },
    { name: 'Crédit PME',        volume: 38_000_000, count: 24, color: 'green'  },
    { name: 'Crédit Auto',       volume: 28_000_000, count: 35, color: 'purple' },
  ],
  portfolio_health: { on_time_rate: 87.2, late_rate: 4.5, collection_rate: 94.8, avg_roi: 11.5 },
};

// ─── Seuils alertes portefeuille ─────────────────────────────────────────────
type AlertLevel = 'critical' | 'warning' | 'watch';

interface PortfolioAlert {
  id: string;
  level: AlertLevel;
  metric: string;
  value: string;
  message: string;
  action?: { label: string; path: string };
}

const ALERT_CFG: Record<AlertLevel, {
  bg: string; border: string; text: string; iconColor: string;
  Icon: React.ElementType; badge: string; badgeBg: string;
}> = {
  critical: { bg: 'bg-red-500/10',   border: 'border-red-500/30',   text: 'text-red-200',   iconColor: 'text-red-400',   Icon: XCircle,       badge: 'CRITIQUE', badgeBg: 'bg-red-500/20 text-red-400'   },
  warning:  { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-200', iconColor: 'text-amber-400', Icon: AlertTriangle, badge: 'ATTENTION', badgeBg: 'bg-amber-500/20 text-amber-400' },
  watch:    { bg: 'bg-sky-500/10',   border: 'border-sky-500/30',   text: 'text-sky-200',   iconColor: 'text-sky-400',   Icon: Info,          badge: 'SURVEILLER', badgeBg: 'bg-sky-500/20 text-sky-400'   },
};

function buildPortfolioAlerts(h: PortfolioHealth): PortfolioAlert[] {
  const alerts: PortfolioAlert[] = [];

  // ── late_rate ──────────────────────────────────────────────────────────────
  if (h.late_rate >= 10) {
    alerts.push({
      id: 'late-critical',
      level: 'critical',
      metric: 'Taux de retard',
      value: `${h.late_rate}%`,
      message: `Le taux de retard atteint ${h.late_rate}% — seuil critique dépassé. Une revue immédiate du portefeuille est requise.`,
      action: { label: 'Voir les dossiers en retard', path: '/bank/applications/rejected' },
    });
  } else if (h.late_rate >= 5) {
    alerts.push({
      id: 'late-warning',
      level: 'warning',
      metric: 'Taux de retard',
      value: `${h.late_rate}%`,
      message: `Taux de retard élevé (${h.late_rate}%). Identifiez et contactez les clients en défaut de paiement.`,
      action: { label: 'Analyser le portefeuille', path: '/bank/analytics' },
    });
  } else if (h.late_rate >= 2) {
    alerts.push({
      id: 'late-watch',
      level: 'watch',
      metric: 'Taux de retard',
      value: `${h.late_rate}%`,
      message: `Taux de retard à surveiller (${h.late_rate}%). Restez vigilant pour éviter une hausse.`,
      action: { label: 'Voir le portefeuille', path: '/bank/portfolio' },
    });
  }

  // ── on_time_rate ───────────────────────────────────────────────────────────
  if (h.on_time_rate < 80) {
    alerts.push({
      id: 'ontime-critical',
      level: 'critical',
      metric: 'Taux à jour',
      value: `${h.on_time_rate}%`,
      message: `Seulement ${h.on_time_rate}% des crédits sont à jour — risque systémique. Déclenchez une procédure de recouvrement.`,
      action: { label: 'Recouvrement', path: '/bank/analytics' },
    });
  } else if (h.on_time_rate < 85) {
    alerts.push({
      id: 'ontime-warning',
      level: 'warning',
      metric: 'Taux à jour',
      value: `${h.on_time_rate}%`,
      message: `Taux à jour en baisse (${h.on_time_rate}%). Renforcez le suivi des clients à risque.`,
    });
  }

  // ── collection_rate ────────────────────────────────────────────────────────
  if (h.collection_rate < 85) {
    alerts.push({
      id: 'collection-critical',
      level: 'critical',
      metric: 'Taux de collecte',
      value: `${h.collection_rate}%`,
      message: `Taux de collecte critique (${h.collection_rate}%). Revue urgente des procédures de recouvrement nécessaire.`,
      action: { label: 'Analyser', path: '/bank/analytics' },
    });
  } else if (h.collection_rate < 90) {
    alerts.push({
      id: 'collection-warning',
      level: 'warning',
      metric: 'Taux de collecte',
      value: `${h.collection_rate}%`,
      message: `Taux de collecte inférieur à la cible (${h.collection_rate}% < 90%). Vérifiez les relances automatiques.`,
      action: { label: 'Voir analytics', path: '/bank/analytics' },
    });
  }

  // Trier : critical d'abord, puis warning, puis watch
  const order: AlertLevel[] = ['critical', 'warning', 'watch'];
  return alerts.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level));
}

// ─── Widget alertes portefeuille ──────────────────────────────────────────────
function PortfolioAlertsWidget({
  alerts, onDismiss,
}: {
  alerts: PortfolioAlert[];
  onDismiss: (id: string) => void;
}) {
  const navigate = useNavigate();
  if (!alerts.length) return null;

  const counts = { critical: 0, warning: 0, watch: 0 };
  alerts.forEach(a => counts[a.level]++);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-400" />
          Alertes portefeuille
          <span className="flex items-center gap-1 ml-1">
            {counts.critical > 0 && <span className="px-1.5 py-0.5 text-xs font-bold bg-red-500/20 text-red-400 rounded-full">{counts.critical}</span>}
            {counts.warning  > 0 && <span className="px-1.5 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-400 rounded-full">{counts.warning}</span>}
            {counts.watch    > 0 && <span className="px-1.5 py-0.5 text-xs font-bold bg-sky-500/20 text-sky-400 rounded-full">{counts.watch}</span>}
          </span>
        </h2>
        <span className="text-xs text-slate-500">{alerts.length} alerte{alerts.length > 1 ? 's' : ''} actives</span>
      </div>

      <div className="space-y-3">
        {alerts.map(alert => {
          const cfg = ALERT_CFG[alert.level];
          const Icon = cfg.Icon;
          return (
            <div key={alert.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl ${cfg.bg} border ${cfg.border}`}>
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.iconColor}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${cfg.badgeBg}`}>{cfg.badge}</span>
                  <span className="text-xs text-slate-400">{alert.metric}</span>
                  <span className={`text-xs font-bold ${cfg.iconColor}`}>{alert.value}</span>
                </div>
                <p className={`text-sm ${cfg.text}`}>{alert.message}</p>
                {alert.action && (
                  <button
                    onClick={() => navigate(alert.action!.path)}
                    className={`mt-1.5 text-xs font-semibold flex items-center gap-1 ${cfg.iconColor} hover:opacity-80 transition`}>
                    {alert.id.startsWith('late') ? <FileSearch className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    {alert.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => onDismiss(alert.id)}
                className="text-slate-600 hover:text-slate-300 transition shrink-0 mt-0.5"
                title="Ignorer">
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {counts.critical > 0 && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => navigate('/bank/analytics')}
            className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition">
            <AlertCircle className="w-4 h-4" /> Revue urgente du portefeuille
          </button>
          <button
            onClick={() => navigate('/bank/applications/pending')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium flex items-center gap-2 transition">
            <PhoneCall className="w-4 h-4" /> Relances
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  pending: 'orange', approved: 'green', review: 'blue', rejected: 'red', disbursed: 'emerald',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente', approved: 'Approuvé', review: 'En révision',
  rejected: 'Rejeté',   disbursed: 'Décaissé',
};

function fmtCFA(n: number) { return new Intl.NumberFormat('fr-FR').format(n) + ' CFA'; }
function fmtM(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M CFA';
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'k CFA';
  return fmtCFA(n);
}

// ─── Composant ───────────────────────────────────────────────────────────────
export default function BankDashboard() {
  const navigate = useNavigate();
  const [data, setData]           = useState<DashboardData>(MOCK);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [isMock, setIsMock]       = useState(false);
  const [lastSync, setLastSync]   = useState(new Date());
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/scoring/bank/dashboard/');
      if (res.ok) {
        const d: DashboardData = await res.json();
        setData({ ...MOCK, ...d });
        setIsMock(false);
      } else {
        // Backend répond mais erreur (403, 404…) → mock + message
        setData(MOCK);
        setIsMock(true);
        if (res.status === 403) setError('Accès refusé — connectez-vous avec un compte banque.');
        else setError(`Backend: erreur ${res.status} — données de démonstration affichées.`);
      }
    } catch {
      // Pas de réseau → mock silencieux
      setData(MOCK);
      setIsMock(true);
    }
    setLastSync(new Date());
    setDismissedAlerts(new Set()); // reset à chaque actualisation
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const allAlerts = buildPortfolioAlerts(data.portfolio_health);
  const visibleAlerts = allAlerts.filter(a => !dismissedAlerts.has(a.id));
  const dismissAlert = (id: string) => setDismissedAlerts(prev => new Set([...prev, id]));

  const kpis = [
    { label: 'Total Clients',       value: data.total_clients.toLocaleString('fr-FR'), growth: data.clients_growth,   icon: Users,      color: 'blue',    path: '/bank/clients'              },
    { label: 'Crédits Actifs',      value: String(data.active_loans),                  growth: data.loans_growth,     icon: Activity,   color: 'green',   path: '/bank/applications/pending' },
    { label: 'Valeur Portefeuille', value: fmtM(data.portfolio_value),                 growth: data.portfolio_growth, icon: DollarSign, color: 'emerald', path: '/bank/portfolio'            },
    { label: 'Score TERAS Moyen',   value: String(data.avg_score),                     growth: data.score_growth,     icon: TrendingUp, color: 'amber',   path: '/bank/analytics'            },
  ];

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Banque</h1>
          <p className="text-slate-400 mt-1">
            Vue d'ensemble du portefeuille TERAS
            {isMock && <span className="ml-2 px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs rounded-full border border-amber-500/20">Démo</span>}
            {!isMock && <span className="ml-2 text-slate-500 text-xs">· {lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:text-white rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Bandeau erreur */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            onClick={() => navigate(k.path)}
            className={`bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 hover:border-${k.color}-500/30 transition-all cursor-pointer ${loading ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl bg-${k.color}-500/20 flex items-center justify-center`}>
                <k.icon className={`w-6 h-6 text-${k.color}-400`} />
              </div>
              {k.growth !== 0 && (
                <div className={`flex items-center gap-1 text-sm ${k.growth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {k.growth > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  <span className="font-semibold">{Math.abs(k.growth).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-1">{k.label}</p>
            <p className="text-3xl font-bold text-white">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Alertes portefeuille */}
      {visibleAlerts.length > 0 && (
        <PortfolioAlertsWidget alerts={visibleAlerts} onDismiss={dismissAlert} />
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Nouveau Client',      sub: 'Créer un profil',   icon: Users,      color: 'blue',   path: '/bank/clients/new'          },
          { label: 'Demandes en Attente', sub: 'À traiter',          icon: Clock,      color: 'orange', path: '/bank/applications/pending' },
          { label: 'Simulateur Crédit',   sub: 'Calculer une offre', icon: CreditCard, color: 'purple', path: '/bank/simulator'            },
          { label: 'Analytics',           sub: 'Rapports & stats',   icon: BarChart3,  color: 'cyan',   path: '/bank/analytics'            },
        ].map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            className={`bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-4 hover:border-${a.color}-500/50 hover:bg-slate-800/50 transition-all group text-left`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-${a.color}-500/20 group-hover:bg-${a.color}-500/30 flex items-center justify-center transition-all`}>
                <a.icon className={`w-5 h-5 text-${a.color}-400`} />
              </div>
              <div>
                <p className="text-white font-medium">{a.label}</p>
                <p className="text-slate-400 text-sm">{a.sub}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Contenu principal */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Demandes récentes */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-xl">Demandes Récentes</h2>
            <button onClick={() => navigate('/bank/applications/pending')} className="text-sky-400 hover:text-sky-300 text-sm font-medium">
              Voir tout →
            </button>
          </div>
          <div className="space-y-3">
            {data.recent_applications.map((app) => {
              const sc   = STATUS_COLOR[app.status] ?? 'slate';
              const name = app.client_name ?? app.enterprise_name ?? '—';
              return (
                <div
                  key={app.id}
                  onClick={() => navigate('/bank/applications/pending')}
                  className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full bg-${sc}-400`} />
                    <div>
                      <p className="text-white font-medium">{name}</p>
                      <p className="text-slate-400 text-sm">{fmtCFA(app.requested_amount)} · {app.application_id}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 bg-${sc}-500/10 text-${sc}-400 text-xs rounded-lg`}>
                    {STATUS_LABEL[app.status] ?? app.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Produits performants */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-xl">Produits Performants</h2>
            <button onClick={() => navigate('/bank/products')} className="text-sky-400 hover:text-sky-300 text-sm font-medium">
              Voir tout →
            </button>
          </div>
          <div className="space-y-4">
            {data.top_products.map((p, idx) => {
              const total = data.top_products.reduce((s, x) => s + x.volume, 0);
              const pct   = total > 0 ? ((p.volume / total) * 100).toFixed(1) : '0';
              const color = p.color ?? ['blue','green','purple','amber'][idx % 4];
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-${color}-500`} />
                      <span className="text-white font-medium">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{fmtM(p.volume)}</p>
                      <p className="text-slate-400 text-xs">{p.count} crédits</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full bg-${color}-500 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-slate-400 text-sm w-12 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => navigate('/bank/products/create')}
            className="w-full mt-4 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Créer un Nouveau Produit
          </button>
        </div>
      </div>

      {/* Santé portefeuille */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-xl">Santé du Portefeuille</h2>
          {allAlerts.length > 0 && (
            <span className="text-xs text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {allAlerts.length} indicateur{allAlerts.length > 1 ? 's' : ''} hors seuil
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {(() => {
            const h = data.portfolio_health;

            // Couleur dynamique selon seuils
            const lateColor  = h.late_rate >= 10 ? 'red' : h.late_rate >= 5 ? 'amber' : h.late_rate >= 2 ? 'orange' : 'green';
            const onTimeColor = h.on_time_rate < 80 ? 'red' : h.on_time_rate < 85 ? 'amber' : h.on_time_rate < 90 ? 'orange' : 'green';
            const collectColor = h.collection_rate < 85 ? 'red' : h.collection_rate < 90 ? 'amber' : 'green';

            const lateAlert  = h.late_rate >= 2;
            const onTimeAlert = h.on_time_rate < 90;
            const collectAlert = h.collection_rate < 90;

            return [
              {
                icon: CheckCircle,
                color: onTimeColor,
                value: `${h.on_time_rate}%`,
                label: 'À jour',
                alert: onTimeAlert,
                threshold: onTimeColor !== 'green' ? `Cible ≥ 90%` : null,
              },
              {
                icon: Clock,
                color: lateColor,
                value: `${h.late_rate}%`,
                label: 'En retard',
                alert: lateAlert,
                threshold: lateColor !== 'green' ? `Seuil max 2%` : null,
              },
              {
                icon: DollarSign,
                color: collectColor,
                value: `${h.collection_rate}%`,
                label: 'Taux collecte',
                alert: collectAlert,
                threshold: collectColor !== 'green' ? `Cible ≥ 90%` : null,
              },
              {
                icon: TrendingUp,
                color: 'amber',
                value: `${h.avg_roi}%`,
                label: 'ROI moyen',
                alert: false,
                threshold: null,
              },
            ].map((item, i) => (
              <div key={i} className={`text-center p-4 rounded-xl transition-all ${
                item.alert
                  ? `bg-${item.color}-500/10 border border-${item.color}-500/30`
                  : 'bg-slate-800/30 border border-transparent'
              }`}>
                <div className={`w-12 h-12 rounded-full bg-${item.color}-500/20 flex items-center justify-center mx-auto mb-2 relative`}>
                  <item.icon className={`w-6 h-6 text-${item.color}-400`} />
                  {item.alert && (
                    <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-${item.color}-500 border-2 border-slate-900`} />
                  )}
                </div>
                <p className={`text-2xl font-bold mb-0.5 text-${item.color === 'green' ? 'white' : item.color + '-400'}`}>
                  {item.value}
                </p>
                <p className="text-slate-400 text-sm">{item.label}</p>
                {item.threshold && (
                  <p className={`text-xs mt-1 text-${item.color}-500`}>{item.threshold}</p>
                )}
              </div>
            ));
          })()}
        </div>
      </div>

    </div>
  );
}