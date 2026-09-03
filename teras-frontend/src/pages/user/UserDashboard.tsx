/**
 * Dashboard utilisateur TERAS - Style corrigé
 * @module pages/user/UserDashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../utils/authFetch';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  Bell,
  ChevronRight,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Shield,
  Wallet,
  Users,
  Target,
  Award,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
  Eye,
  Star,
  Sparkles,
  X,
  Info,
  Upload,
  Lightbulb,
  XCircle
} from 'lucide-react';

// Types
interface ScoreHistory {
  date: string;
  score: number;
}

interface TerasPillar {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  maxPoints: number;
  color: string;
  icon: React.ElementType;
}

interface Notification {
  id: string;
  type: 'score_change' | 'document' | 'alert' | 'achievement';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface RecentActivity {
  id: string;
  type: 'document' | 'score' | 'login' | 'verification';
  description: string;
  timestamp: Date;
  status?: 'success' | 'pending' | 'failed';
}

interface DocumentIntelligence {
  total_docs: number;
  analyzed_docs: number;
  applied_docs: number;
  proof_asset_docs: number;
  proof_assets_applied: number;
  documented_assets_total_xaf: number;
  verified_assets_total_xaf: number;
  latest_asset_value_xaf: number;
  collateral_candidate_value_xaf: number;
  latest_proof_label?: string | null;
  latest_proof_filename?: string | null;
  latest_processed_at?: string | null;
  asset_proof_strength: 'none' | 'light' | 'medium' | 'strong' | string;
  alerts: string[];
}

interface DossierAlert {
  id: string;
  severity: 'danger' | 'warning' | 'info';
  message: string;
  actionLabel?: string;
  actionPath?: string;
}

const formatXaf = (value: number) => {
  const amount = Number(value || 0);
  if (!amount) return '0 FCFA';
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} M FCFA`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)} k FCFA`;
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
};

const strengthLabel = (strength: string) => {
  if (strength === 'strong') return 'Dossier mobilisable';
  if (strength === 'medium') return 'Preuves solides';
  if (strength === 'light') return 'Base presente';
  return 'A completer';
};

const strengthColor = (strength: string) => {
  if (strength === 'strong') return 'emerald';
  if (strength === 'medium') return 'sky';
  if (strength === 'light') return 'amber';
  return 'slate';
};


// ── Alertes dossier ───────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  danger:  { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-300',    icon: XCircle,      iconColor: 'text-red-400'    },
  warning: { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-200',  icon: AlertCircle,  iconColor: 'text-amber-400'  },
  info:    { bg: 'bg-sky-500/10',    border: 'border-sky-500/30',    text: 'text-sky-200',    icon: Info,         iconColor: 'text-sky-400'    },
};

const DossierAlertsWidget: React.FC<{
  alerts: DossierAlert[];
  onDismiss: (id: string) => void;
}> = ({ alerts, onDismiss }) => {
  const navigate = useNavigate();

  if (!alerts.length) return null;

  const counts = { danger: 0, warning: 0, info: 0 };
  alerts.forEach(a => counts[a.severity]++);

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-400" />
          Alertes dossier
          <span className="ml-1 flex items-center gap-1">
            {counts.danger  > 0 && <span className="px-1.5 py-0.5 text-xs font-bold bg-red-500/20 text-red-400 rounded-full">{counts.danger}</span>}
            {counts.warning > 0 && <span className="px-1.5 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-400 rounded-full">{counts.warning}</span>}
            {counts.info    > 0 && <span className="px-1.5 py-0.5 text-xs font-bold bg-sky-500/20 text-sky-400 rounded-full">{counts.info}</span>}
          </span>
        </h3>
        <span className="text-xs text-slate-500">{alerts.length} alerte{alerts.length > 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-2">
        {alerts.map(alert => {
          const cfg = SEVERITY_CONFIG[alert.severity];
          const Icon = cfg.icon;
          return (
            <div key={alert.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl ${cfg.bg} border ${cfg.border}`}>
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.iconColor}`} />
              <p className={`flex-1 text-sm ${cfg.text}`}>{alert.message}</p>
              <div className="flex items-center gap-2 shrink-0">
                {alert.actionLabel && alert.actionPath && (
                  <button
                    onClick={() => navigate(alert.actionPath!)}
                    className={`text-xs font-semibold underline underline-offset-2 ${cfg.iconColor} hover:opacity-80 transition`}>
                    {alert.actionLabel}
                  </button>
                )}
                <button
                  onClick={() => onDismiss(alert.id)}
                  className="text-slate-500 hover:text-slate-300 transition"
                  title="Ignorer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Composant Score Card Principal
const MainScoreCard: React.FC<{ score: number; previousScore: number; band: string }> = ({ score, previousScore, band }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const change = score - previousScore;
  const isPositive = change >= 0;

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 900) return '#10b981';
    if (s >= 750) return '#0ea5e9';
    if (s >= 600) return '#eab308';
    if (s >= 400) return '#f97316';
    return '#ef4444';
  };

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (animatedScore / 1000) * circumference;
  const color = getScoreColor(animatedScore);

  return (
    <div className="bg-gradient-to-br from-sky-500/20 to-blue-500/20 rounded-2xl p-8 border border-sky-500/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Score TERAS</h2>
            <p className="text-slate-400 text-sm">Mis à jour il y a 2 heures</p>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <RefreshCw className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          {/* Jauge circulaire */}
          <div className="relative">
            <svg width="200" height="200" className="transform -rotate-90">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="12"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
                style={{ filter: `drop-shadow(0 0 10px ${color}40)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-bold" style={{ color }}>{animatedScore}</div>
              <div className="text-slate-400 text-sm">sur 1000</div>
            </div>
          </div>

          {/* Stats à droite */}
          <div className="space-y-4">
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
              <div className="text-sm text-slate-400 mb-1">Variation</div>
              <div className={`flex items-center gap-2 text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                {isPositive ? '+' : ''}{change}
              </div>
              <div className="text-xs text-slate-500">vs mois dernier</div>
            </div>

            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
              <div className="text-sm text-slate-400 mb-1">Bande</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-sky-400">{band}</span>
                <span className="px-2 py-1 bg-sky-500/20 text-sky-400 text-xs rounded-full">Très bon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant Mini Chart
const MiniChart: React.FC<{ data: ScoreHistory[] }> = ({ data }) => {
  const maxScore = Math.max(...data.map(d => d.score));
  const minScore = Math.min(...data.map(d => d.score));
  const range = maxScore - minScore || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.score - minScore) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-sky-400" />
          Évolution
        </h3>
        <span className="text-green-400 text-sm font-medium">
          +{data[data.length - 1].score - data[0].score} pts
        </span>
      </div>

      <svg viewBox="0 0 100 60" className="w-full h-24">
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(14, 165, 233, 0.3)" />
            <stop offset="100%" stopColor="rgba(14, 165, 233, 0)" />
          </linearGradient>
        </defs>

        <polygon
          points={`0,60 ${points} 100,60`}
          fill="url(#chartGradient)"
        />

        <polyline
          points={points}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - ((d.score - minScore) / range) * 80 - 10;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={i === data.length - 1 ? 3 : 2}
              fill={i === data.length - 1 ? '#0ea5e9' : '#fff'}
              stroke="#0ea5e9"
              strokeWidth="1"
            />
          );
        })}
      </svg>

      <div className="flex justify-between text-xs text-slate-500 mt-2">
        {data.map((d, i) => (
          <span key={i}>{d.date.split('-')[1]}</span>
        ))}
      </div>
    </div>
  );
};

// Composant Piliers TERAS
const PillarsWidget: React.FC<{ pillars: TerasPillar[] }> = ({ pillars }) => {
  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
      <h3 className="font-semibold mb-6 text-white flex items-center gap-2">
        <Target className="w-5 h-5 text-sky-400" />
        Piliers TERAS
      </h3>

      <div className="space-y-4">
        {pillars.map(pillar => {
          const change = pillar.value - pillar.previousValue;
          const percentage = (pillar.value / 100) * 100;

          return (
            <div key={pillar.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: pillar.color }}
                  >
                    {pillar.id}
                  </div>
                  <span className="text-sm text-slate-300">{pillar.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{pillar.value}</span>
                  {change !== 0 && (
                    <span className={`text-xs ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {change > 0 ? '+' : ''}{change}
                    </span>
                  )}
                </div>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: pillar.color,
                    boxShadow: `0 0 8px ${pillar.color}40`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Composant Notifications
const NotificationsWidget: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'score_change': return TrendingUp;
      case 'document': return FileText;
      case 'achievement': return Award;
      case 'alert': return AlertCircle;
    }
  };

  const getColor = (type: Notification['type']) => {
    switch (type) {
      case 'score_change': return 'bg-sky-500/20 text-sky-400';
      case 'document': return 'bg-green-500/20 text-green-400';
      case 'achievement': return 'bg-yellow-500/20 text-yellow-400';
      case 'alert': return 'bg-orange-500/20 text-orange-400';
    }
  };

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-sky-400" />
          Notifications
          <span className="px-2 py-0.5 bg-sky-500 text-xs rounded-full text-slate-900">
            {notifications.filter(n => !n.read).length}
          </span>
        </h3>
        <button className="text-sky-400 text-sm hover:text-sky-300">
          Tout voir
        </button>
      </div>

      <div className="space-y-3">
        {notifications.slice(0, 4).map(notif => {
          const Icon = getIcon(notif.type);
          const colorClass = getColor(notif.type);

          return (
            <div 
              key={notif.id}
              className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                !notif.read ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-white">{notif.title}</span>
                  {!notif.read && (
                    <span className="w-2 h-2 bg-sky-500 rounded-full" />
                  )}
                </div>
                <p className="text-slate-400 text-sm truncate">{notif.message}</p>
                <span className="text-xs text-slate-500">{notif.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Composant Activité Récente
const RecentActivityWidget: React.FC<{ activities: RecentActivity[] }> = ({ activities }) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success': return CheckCircle;
      case 'pending': return Clock;
      case 'failed': return AlertCircle;
      default: return Activity;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Il y a moins d\'1h';
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  };

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-sky-400" />
          Activité récente
        </h3>
        <button className="text-sky-400 text-sm hover:text-sky-300">
          Historique
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const StatusIcon = getStatusIcon(activity.status);
          const statusColor = getStatusColor(activity.status);

          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="relative">
                <div className={`w-10 h-10 rounded-lg bg-slate-800/50 border border-white/10 flex items-center justify-center ${statusColor}`}>
                  <StatusIcon className="w-5 h-5" />
                </div>
                {index < activities.length - 1 && (
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-slate-800" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">{activity.description}</p>
                <span className="text-xs text-slate-500">{formatTime(activity.timestamp)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AssetEvidenceWidget: React.FC<{ intelligence: DocumentIntelligence | null }> = ({ intelligence }) => {
  if (!intelligence) return null;

  const color = strengthColor(intelligence.asset_proof_strength);

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-400" />
            Actifs Documentes
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Les preuves d&apos;actifs renforcees par l&apos;analyse alimentent votre pilier A et votre capacite de garantie.
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
          {strengthLabel(intelligence.asset_proof_strength)}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Preuves d'actifs", value: intelligence.proof_asset_docs, color: 'sky' },
          { label: 'Actifs appliques', value: intelligence.proof_assets_applied, color: 'emerald' },
          { label: 'Valeur estimee', value: formatXaf(intelligence.documented_assets_total_xaf || intelligence.verified_assets_total_xaf), color: 'purple' },
          { label: 'Garantie potentielle', value: formatXaf(intelligence.collateral_candidate_value_xaf), color: 'amber' },
        ].map((item) => (
          <div key={item.label} className={`bg-${item.color}-500/10 border border-${item.color}-500/20 rounded-xl p-4`}>
            <p className="text-slate-400 text-xs mb-1">{item.label}</p>
            <p className={`text-${item.color}-400 font-bold`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid md:grid-cols-2 gap-4">
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
          <p className="text-slate-400 text-xs mb-1">Derniere preuve exploitee</p>
          <p className="text-white font-medium">{intelligence.latest_proof_label || 'Aucune preuve appliquee'}</p>
          <p className="text-slate-500 text-xs mt-1 truncate">
            {intelligence.latest_proof_filename || 'Ajoutez une facture, une carte grise ou un titre pour renforcer le dossier.'}
          </p>
        </div>
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
          <p className="text-slate-400 text-xs mb-1">Derniere valeur detectee</p>
          <p className="text-white font-medium">{formatXaf(intelligence.latest_asset_value_xaf)}</p>
          <p className="text-slate-500 text-xs mt-1">
            {intelligence.latest_processed_at
              ? `Analysee le ${new Date(intelligence.latest_processed_at).toLocaleDateString('fr-FR')}`
              : "Aucune preuve d'actif analysee pour le moment."}
          </p>
        </div>
      </div>

    </div>
  );
};

// Composant Actions Rapides
const QuickActions: React.FC = () => {
  const actions = [
    { icon: FileText, label: 'Uploader document', color: 'from-sky-500 to-cyan-500' },
    { icon: Target, label: 'Calculer score', color: 'from-purple-500 to-pink-500' },
    { icon: Download, label: 'Exporter rapport', color: 'from-green-500 to-emerald-500' },
    { icon: Eye, label: 'Voir profil public', color: 'from-orange-500 to-red-500' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <button
          key={index}
          className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group hover:-translate-y-1"
        >
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <action.icon className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

// ── Indicateur de complétude du profil ────────────────────────────────────────
interface ProfileStep {
  id: string;
  label: string;
  done: boolean;
  actionPath?: string;
  actionLabel?: string;
}

const ProfileCompletenessWidget: React.FC<{
  score: number;
  docIntelligence: DocumentIntelligence | null;
  pillars: TerasPillar[];
  navigate: (path: string) => void;
}> = ({ score, docIntelligence, pillars, navigate }) => {
  const steps: ProfileStep[] = [
    {
      id: 'score',
      label: 'Score TERAS calculé',
      done: score > 0,
      actionPath: '/compute-score',
      actionLabel: 'Calculer',
    },
    {
      id: 'docs',
      label: 'Documents uploadés',
      done: (docIntelligence?.total_docs ?? 0) > 0,
      actionPath: '/documents',
      actionLabel: 'Uploader',
    },
    {
      id: 'analyzed',
      label: 'Documents analysés',
      done: (docIntelligence?.analyzed_docs ?? 0) > 0,
      actionPath: '/documents',
      actionLabel: 'Voir',
    },
    {
      id: 'assets',
      label: 'Preuve d\'actifs fournie',
      done: docIntelligence?.asset_proof_strength !== 'none' && docIntelligence?.asset_proof_strength != null,
      actionPath: '/documents',
      actionLabel: 'Ajouter',
    },
    {
      id: 'pillars',
      label: 'Piliers TERAS activés',
      done: pillars.length >= 3,
      actionPath: '/mon-espace',
      actionLabel: 'Compléter',
    },
  ];

  const doneCount = steps.filter(s => s.done).length;
  const percent   = Math.round((doneCount / steps.length) * 100);

  const barColor = percent === 100 ? 'bg-emerald-500' : percent >= 60 ? 'bg-sky-500' : percent >= 40 ? 'bg-amber-500' : 'bg-rose-500';
  const textColor = percent === 100 ? 'text-emerald-400' : percent >= 60 ? 'text-sky-400' : percent >= 40 ? 'text-amber-400' : 'text-rose-400';

  if (percent === 100) return null;

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-sky-400" />
          Complétude du profil
        </h3>
        <span className={`text-lg font-bold ${textColor}`}>{percent}%</span>
      </div>

      <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="space-y-2">
        {steps.map(step => (
          <div key={step.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                step.done
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-slate-600'
              }`}>
                {step.done && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${step.done ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                {step.label}
              </span>
            </div>
            {!step.done && step.actionPath && (
              <button
                onClick={() => navigate(step.actionPath!)}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors shrink-0">
                {step.actionLabel} →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Composant Principal — connecté à l'API ─────────────────────────────────────
const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [previousScore,setPreviousScore]= useState(0);
  const [band,         setBand]         = useState('—');
  const [history,      setHistory]      = useState<ScoreHistory[]>([]);
  const [pillars,      setPillars]      = useState<TerasPillar[]>([]);
  const [notifications,setNotifications]= useState<Notification[]>([]);
  const [activities,   setActivities]   = useState<RecentActivity[]>([]);
  const [documentIntelligence, setDocumentIntelligence] = useState<DocumentIntelligence | null>(null);
  const [dossierAlerts, setDossierAlerts] = useState<DossierAlert[]>([]);
  const [dismissedIds,  setDismissedIds]  = useState<Set<string>>(new Set());

  const PILLAR_META: Record<string, { color: string; icon: React.ElementType }> = {
    T: { color: '#0ea5e9', icon: TrendingUp },
    E: { color: '#22c55e', icon: Wallet     },
    R: { color: '#eab308', icon: Activity   },
    A: { color: '#a855f7', icon: Shield     },
    S: { color: '#f97316', icon: Users      },
  };
  const PILLAR_NAMES: Record<string, string> = {
    T: 'Transactions', E: 'Épargne', R: 'Revenus', A: 'Actifs', S: 'Social',
  };
  const PILLAR_MAX: Record<string, number> = {
    T: 300, E: 150, R: 200, A: 150, S: 200,
  };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await authFetch('/api/scoring/user/dashboard/');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();

      // Score
      const score = data.score?.current ?? data.score?.score ?? data.teras_score ?? 0;
      const prev  = data.score?.previous ?? Math.max(0, score - (data.score?.change_month ?? 0));
      setCurrentScore(score);
      setPreviousScore(prev);

      // Bande
      const b = score >= 900 ? 'A' : score >= 750 ? 'B' : score >= 600 ? 'C' : score >= 400 ? 'D' : 'E';
      setBand(b);

      // Historique
      const hist = (data.score_history ?? data.evolution ?? data.history ?? []).map((h: any) => ({
        date:  h.computed_at?.slice(0, 7) ?? h.date ?? '',
        score: h.score ?? 0,
      }));
      setHistory(hist);

      // Piliers
      const breakdown = data.score?.breakdown ?? data.breakdown ?? {};
      // Calcul de previousValue : utilise previous_score du backend si dispo,
      // sinon estime depuis score_history (score_history[-2] / score_history[-1] * valeur courante)
      const histArr = (data.score_history ?? data.evolution ?? data.history ?? []);
      const prevRatio = histArr.length >= 2
        ? (histArr[histArr.length - 2]?.score ?? 0) / Math.max(histArr[histArr.length - 1]?.score ?? 1, 1)
        : null;

      const p: TerasPillar[] = Object.entries(breakdown).map(([id, val]: any) => {
        const currentVal = Math.round((val?.score ?? val ?? 0) * 100);
        let previousVal: number;
        if (val?.previous_score != null) {
          previousVal = Math.round(val.previous_score * 100);
        } else if (prevRatio != null) {
          previousVal = Math.round(currentVal * prevRatio);
        } else {
          previousVal = currentVal;
        }
        return {
          id,
          name:          PILLAR_NAMES[id] ?? id,
          value:         currentVal,
          previousValue: previousVal,
          maxPoints:     PILLAR_MAX[id] ?? 100,
          color:         PILLAR_META[id]?.color ?? '#888',
          icon:          PILLAR_META[id]?.icon ?? Activity,
        };
      });
      setPillars(p);

      // Notifications depuis les alertes/recommandations
      const recs = (data.recommendations ?? []).slice(0, 3).map((r: any, i: number) => ({
        id:      String(i),
        type:    'alert' as const,
        title:   typeof r === 'string' ? 'Recommandation' : (r.title ?? 'Recommandation'),
        message: typeof r === 'string' ? r : (r.description ?? r.action ?? ''),
        time:    "Aujourd'hui",
        read:    false,
      }));
      setNotifications(recs);

      // Activités récentes
      const acts = (data.recent_activities ?? data.activities ?? []).slice(0, 4).map((a: any, i: number) => ({
        id:          String(i),
        type:        a.type ?? 'score',
        description: a.label ?? a.description ?? a.action ?? '',
        timestamp:   new Date(a.timestamp ?? a.created_at ?? Date.now()),
        status:      a.status ?? 'success',
      }));
      setActivities(acts);
      const docInt = data.document_intelligence ?? null;
      setDocumentIntelligence(docInt);

      // ── Calcul des alertes dossier ──────────────────────────────────────────
      const builtAlerts: DossierAlert[] = [];

      if (score === 0) {
        builtAlerts.push({ id: 'score-zero', severity: 'info', message: "Votre score n'a pas encore été calculé. Complétez votre profil et uploadez vos documents.", actionLabel: 'Mes documents', actionPath: '/documents' });
      } else if (score < 400) {
        builtAlerts.push({ id: 'score-low', severity: 'danger', message: `Votre score (${score}/1000) est insuffisant pour accéder au crédit. Consultez vos recommandations IA.`, actionLabel: 'Voir recommandations', actionPath: '/mon-espace' });
      }

      if ((docInt?.total_docs ?? 0) === 0) {
        builtAlerts.push({ id: 'no-docs', severity: 'danger', message: 'Votre dossier est vide. Uploadez au moins un document pour démarrer l\'évaluation TERAS.', actionLabel: 'Uploader', actionPath: '/documents' });
      } else if ((docInt?.analyzed_docs ?? 0) === 0) {
        builtAlerts.push({ id: 'no-analyzed', severity: 'warning', message: `${docInt?.total_docs} document(s) présent(s) mais aucun n'a encore été analysé.`, actionLabel: 'Voir dossier', actionPath: '/documents' });
      }

      if (docInt?.asset_proof_strength === 'none' && (docInt?.total_docs ?? 0) > 0) {
        builtAlerts.push({ id: 'no-asset-proof', severity: 'warning', message: 'Aucune preuve d\'actif dans votre dossier. Ajoutez une carte grise, facture ou titre de propriété pour renforcer votre pilier A.', actionLabel: 'Ajouter', actionPath: '/documents' });
      }

      if (data.credit_capacity && !data.credit_capacity.eligible && score >= 400) {
        builtAlerts.push({ id: 'no-credit-capacity', severity: 'warning', message: 'Capacité de crédit nulle. Déclarez vos revenus pour débloquer votre capacité d\'emprunt.', actionLabel: 'Mon espace', actionPath: '/mon-espace' });
      }

      // Alertes backend (document_intelligence.alerts)
      (docInt?.alerts ?? []).forEach((msg: string, i: number) => {
        builtAlerts.push({ id: `backend-alert-${i}`, severity: 'warning', message: msg });
      });

      const pendingRecs = (data.recommendations ?? []).filter((r: any) => !r.completed).length;
      if (pendingRecs > 0) {
        builtAlerts.push({ id: 'pending-recs', severity: 'info', message: `${pendingRecs} recommandation${pendingRecs > 1 ? 's' : ''} IA en attente d'action.`, actionLabel: 'Consulter', actionPath: '/mon-espace' });
      }

      setDossierAlerts(builtAlerts);
      setDismissedIds(new Set()); // reset at each reload

    } catch (e: any) {
      setError(e.message || 'Impossible de charger le dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dismissAlert = (id: string) => setDismissedIds(prev => new Set([...prev, id]));
  const visibleAlerts = dossierAlerts.filter(a => !dismissedIds.has(a.id));

  const firstName = user?.first_name || user?.username || 'vous';

  if (loading) return (
    <div className="min-h-screen bg-[#0b1220] p-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-slate-800 rounded w-64" />
            <div className="h-4 bg-slate-800/60 rounded w-48" />
          </div>
          <div className="h-9 bg-slate-800 rounded-xl w-28" />
        </div>
        {/* Quick actions skeleton */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-900/50 border border-white/5 rounded-2xl" />
          ))}
        </div>
        {/* Main grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-slate-900/50 border border-white/5 rounded-2xl" />
            <div className="h-40 bg-slate-900/50 border border-white/5 rounded-2xl" />
          </div>
          <div className="h-80 bg-slate-900/50 border border-white/5 rounded-2xl" />
        </div>
        {/* Bottom row skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-900/50 border border-white/5 rounded-2xl" />
          <div className="h-48 bg-slate-900/50 border border-white/5 rounded-2xl" />
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center p-6">
      <div className="bg-slate-900/60 border border-rose-500/30 rounded-2xl p-8 max-w-md text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <p className="text-white font-semibold">Dashboard indisponible</p>
        <p className="text-slate-400 text-sm">{error}</p>
        <button onClick={load} className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-semibold">
          Réessayer
        </button>
      </div>
    </div>
  );

  const pointsToNext = currentScore < 1000 ? (
    currentScore < 400 ? 400 - currentScore :
    currentScore < 600 ? 600 - currentScore :
    currentScore < 750 ? 750 - currentScore :
    currentScore < 900 ? 900 - currentScore : 0
  ) : 0;

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
              <Sparkles className="w-8 h-8 text-yellow-400" />
              Bonjour, {firstName} !
            </h1>
            <p className="text-slate-400 mt-1">Voici un aperçu de votre profil TERAS</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 mt-4 md:mt-0 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </div>

        {/* Alertes dossier */}
        {visibleAlerts.length > 0 && (
          <div className="mb-6">
            <DossierAlertsWidget alerts={visibleAlerts} onDismiss={dismissAlert} />
          </div>
        )}

        {/* Complétude profil */}
        <div className="mb-6">
          <ProfileCompletenessWidget
            score={currentScore}
            docIntelligence={documentIntelligence}
            pillars={pillars}
            navigate={navigate}
          />
        </div>

        {/* Actions rapides */}
        <div className="mb-8"><QuickActions /></div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <MainScoreCard score={currentScore} previousScore={previousScore} band={band} />
            {history.length > 0 && <MiniChart data={history} />}
          </div>
          <div>
            {pillars.length > 0
              ? <PillarsWidget pillars={pillars} />
              : (
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center h-full min-h-48 text-slate-500 text-sm text-center gap-2">
                  <Target className="w-8 h-8 opacity-40" />
                  <p>Piliers non disponibles</p>
                  <p className="text-xs">Complétez votre profil pour activer l'analyse.</p>
                </div>
              )
            }
          </div>
        </div>

        {/* Deuxième rangée */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <NotificationsWidget notifications={notifications} />
          <RecentActivityWidget activities={activities} />
        </div>

        <div className="mt-6">
          <AssetEvidenceWidget intelligence={documentIntelligence} />
        </div>

        {/* Bannière progression */}
        {pointsToNext > 0 && (
          <div className="mt-8 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-2xl p-6 border border-sky-500/30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Passez au niveau supérieur !</h3>
                  <p className="text-slate-400">Plus que {pointsToNext} points pour atteindre la prochaine bande</p>
                </div>
              </div>
              <button className="px-6 py-3 bg-sky-500 hover:bg-sky-400 rounded-xl font-medium flex items-center gap-2 transition-all text-slate-900">
                Améliorer mon score <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserDashboard;
