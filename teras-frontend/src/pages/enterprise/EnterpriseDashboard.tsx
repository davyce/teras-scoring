import { useState, useEffect } from "react";
/**
 * EnterpriseDashboard.tsx
 * Dashboard TERAS Entreprise — 100% connecté à l'API
 * Zéro mock — données réelles via enterpriseApi.getDashboard()
 */

import {
  TrendingUp, TrendingDown, Minus,
  Users, ShieldCheck,
  AlertCircle, CheckCircle, Clock,
  Target, Award, BarChart3,
  RefreshCw, Brain, Loader2, FileText,
} from "lucide-react";
import enterpriseApi from "../../services/enterpriseApi";

// Type local pour le dashboard (évite conflit de nom avec le composant)
type DashboardData = Awaited<ReturnType<typeof enterpriseApi.getDashboard>>;

// ─── Types locaux ─────────────────────────────────────────────────────────────

interface TerasPillar {
  letter: string;
  name: string;
  fullName: string;
  value: number;
  maxValue: number;
  weight: string;
  color: string;
}

function formatXaf(value?: number | null) {
  const amount = Number(value || 0);
  if (!amount) return "0 FCFA";
  return `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;
}

function dossierQualityLabel(value?: string) {
  const labels: Record<string, string> = {
    robuste: "Robuste",
    exploitable: "Exploitable",
    partiel: "Partiel",
    a_structurer: "A structurer",
  };
  return labels[value || ""] || "A structurer";
}

function documentRoleLabel(value?: string) {
  const labels: Record<string, string> = {
    asset_register: "Registre d'actifs",
    asset_statement: "État des actifs",
    vehicle_title: "Carte grise",
    property_or_lease: "Titre / bail",
    invoice_evidence: "Facture",
    bank_statement: "Relevé bancaire",
    balance_sheet: "Bilan",
    tax_filing: "Fiscal",
    payroll: "Paie",
    contract: "Contrat",
    supporting: "Pièce métier",
  };
  return labels[value || ""] || String(value || "").replace(/_/g, " ");
}

// ─── ScoreGauge ───────────────────────────────────────────────────────────────

const ScoreGauge = ({ score, change }: { score: number; change: number }) => {
  const [animated, setAnimated] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(score), 100); return () => clearTimeout(t); }, [score]);

  const pct  = (animated / 1000) * 100;
  const circ = 2 * Math.PI * 80;
  const off  = circ - (pct / 100) * circ;

  const color =
    score >= 800 ? { stroke:'#10b981', text:'text-emerald-400', label:'Excellent',    bg:'bg-emerald-500/20' } :
    score >= 650 ? { stroke:'#a855f7', text:'text-purple-400',  label:'Bon',          bg:'bg-purple-500/20'  } :
    score >= 500 ? { stroke:'#eab308', text:'text-yellow-400',  label:'Moyen',        bg:'bg-yellow-500/20'  } :
    score >= 350 ? { stroke:'#f97316', text:'text-orange-400',  label:'Faible',       bg:'bg-orange-500/20'  } :
                   { stroke:'#ef4444', text:'text-red-400',      label:'À améliorer', bg:'bg-red-500/20'     };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="200" height="200" className="transform -rotate-90">
          <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12"/>
          <circle cx="100" cy="100" r="80" fill="none" stroke={color.stroke} strokeWidth="12"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
            className="transition-all duration-1000 ease-out"
            style={{ filter:`drop-shadow(0 0 10px ${color.stroke})` }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-bold ${color.text}`}>{animated}</span>
          <span className="text-slate-400 text-sm">/1000</span>
          <span className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
            {color.label}
          </span>
        </div>
      </div>
      {change !== 0 && (
        <div className={`flex items-center gap-1 mt-3 text-sm ${change > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {change > 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
          <span>{change > 0 ? '+' : ''}{change} pts ce mois</span>
        </div>
      )}
    </div>
  );
};

// ─── PillarBar ────────────────────────────────────────────────────────────────

const PillarBar = ({ pillar }: { pillar: TerasPillar }) => {
  const [w, setW] = useState(0);
  const pct = Math.min((pillar.value / pillar.maxValue) * 100, 100);
  useEffect(() => { const t = setTimeout(() => setW(pct), 200); return () => clearTimeout(t); }, [pct]);

  const cols: Record<string,{bg:string;text:string}> = {
    purple: { bg:'bg-purple-500', text:'text-purple-400' },
    blue:   { bg:'bg-blue-500',   text:'text-blue-400'   },
    green:  { bg:'bg-green-500',  text:'text-green-400'  },
    amber:  { bg:'bg-amber-500',  text:'text-amber-400'  },
    cyan:   { bg:'bg-cyan-500',   text:'text-cyan-400'   },
  };
  const c = cols[pillar.color] || cols.purple;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${c.bg}/20 flex items-center justify-center`}>
            <span className={`font-bold ${c.text}`}>{pillar.letter}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-white">{pillar.name}</span>
            <span className="text-xs text-slate-500 block">{pillar.fullName}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-lg font-bold ${c.text}`}>{Math.round(pillar.value)}</span>
          <span className="text-xs text-slate-500">/{pillar.maxValue}</span>
        </div>
      </div>
      <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${c.bg} rounded-full transition-all duration-1000 ease-out`} style={{ width:`${w}%` }}/>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-slate-500">Pondération: {pillar.weight}</span>
        <span className="text-xs text-slate-500">{Math.round(pct)}%</span>
      </div>
    </div>
  );
};

// ─── StatCard ─────────────────────────────────────────────────────────────────

const StatCard = ({
  icon: Icon, label, value, suffix, trend, trendLabel, color = 'purple',
}: {
  icon: typeof Users; label: string; value: string|number; suffix?: string;
  trend?: 'up'|'down'|'stable'; trendLabel?: string; color?: string;
}) => {
  const iconCols: Record<string,string> = {
    purple:'bg-purple-500/20 text-purple-400', blue:'bg-blue-500/20 text-blue-400',
    green:'bg-green-500/20 text-green-400',    amber:'bg-amber-500/20 text-amber-400',
    cyan:'bg-cyan-500/20 text-cyan-400',
  };
  const trendCols = { up:'text-emerald-400', down:'text-rose-400', stable:'text-slate-400' };
  const trendIcons = {
    up:     <TrendingUp className="w-3 h-3"/>,
    down:   <TrendingDown className="w-3 h-3"/>,
    stable: <Minus className="w-3 h-3"/>,
  };
  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${iconCols[color] || iconCols.purple} flex items-center justify-center`}>
          <Icon className="w-5 h-5"/>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trendCols[trend]}`}>
            {trendIcons[trend]}<span>{trendLabel}</span>
          </div>
        )}
      </div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-bold text-white">{value ?? '—'}</span>
        {suffix && <span className="text-slate-400 text-sm mb-1">{suffix}</span>}
      </div>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </div>
  );
};

// ─── DASHBOARD PRINCIPAL ──────────────────────────────────────────────────────

const EnterpriseDashboard = () => {
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await enterpriseApi.getDashboard();
      setData(res);
    } catch (e: any) {
      setError(e.message || 'Impossible de charger le tableau de bord.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Piliers depuis l'API ──────────────────────────────────────────────────
  const pillars: TerasPillar[] = [
    { letter:'T', name:'Transparence', fullName:'Transparence fiscale',
      value: (data?.breakdown?.T ?? 0) * 250, maxValue:250, weight:'30%', color:'purple' },
    { letter:'E', name:'Emploi',       fullName:'Emploi local',
      value: (data?.breakdown?.E ?? 0) * 150, maxValue:150, weight:'25%', color:'blue'   },
    { letter:'R', name:'Rétention',    fullName:'Fidélité clients',
      value: (data?.breakdown?.R ?? 0) * 200, maxValue:200, weight:'15%', color:'green'  },
    { letter:'A', name:'Activité',     fullName:'Activité économique',
      value: (data?.breakdown?.A ?? 0) * 250, maxValue:250, weight:'20%', color:'amber'  },
    { letter:'S', name:'Stabilité',    fullName:'Stabilité sociale',
      value: (data?.breakdown?.S ?? 0) * 150, maxValue:150, weight:'10%', color:'cyan'   },
  ];

  const score       = data?.current_score  ?? 0;
  const change      = data?.score_change   ?? 0;
  const employees   = data?.total_employees ?? 0;
  const localEmp    = data?.local_employees ?? 0;
  const compliance  = data?.compliance_rate ?? 0;
  const recommendations = data?.recommendations ?? [];
  const alerts      = data?.active_alerts    ?? [];
  const docIntelligence = data?.document_intelligence;

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4"/>
        <p className="text-slate-400">Chargement du tableau de bord...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto"/>
        <p className="text-white font-semibold">Tableau de bord indisponible</p>
        <p className="text-slate-400 text-sm">{error}</p>
        <button onClick={load} className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-all mx-auto">
          <RefreshCw className="w-4 h-4"/> Réessayer
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">TERAS Entreprise</p>
          <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
          <p className="text-slate-400 text-sm">Aperçu de votre performance TERAS</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white hover:bg-slate-700 transition">
          <RefreshCw className="w-4 h-4"/> Actualiser
        </button>
      </div>

      {/* ── Alertes actives ── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert: any, i: number) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-800/40 rounded-xl text-amber-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0"/>
              {typeof alert === 'string' ? alert : alert?.message || alert?.title || JSON.stringify(alert)}
            </div>
          ))}
        </div>
      )}

      {/* ── Stats rapides ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users}      label="Employés"          value={employees}
          suffix=""  trend={employees>0?'up':undefined}  trendLabel={`${localEmp} locaux`} color="blue"/>
        <StatCard icon={BarChart3}   label="Clients actifs"   value={data?.active_clients ?? 0}
          suffix=""  color="green"/>
        <StatCard icon={ShieldCheck} label="Conformité"        value={Math.round(Number(compliance))}
          suffix="%"
          trend={Number(compliance)>=80?'up':Number(compliance)>=60?'stable':'down'}
          color="amber"/>
        <StatCard icon={Award}       label="Score TERAS"       value={score}
          suffix="pts" color="purple"/>
      </div>

      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400"/> Intelligence documentaire
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Les documents n’alimentent TERAS que lorsqu’ils ont ete analyses puis appliques.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-semibold">
            {dossierQualityLabel(docIntelligence?.dossier_quality)}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-5">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">Documents</p>
            <p className="text-2xl font-bold text-white">{docIntelligence?.documents_total ?? 0}</p>
            <p className="text-slate-400 text-xs mt-1">{docIntelligence?.categories?.length ?? 0} categories couvertes</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">Analyses / appliques</p>
            <p className="text-2xl font-bold text-emerald-400">
              {docIntelligence?.documents_analyzed ?? 0} / {docIntelligence?.documents_applied ?? 0}
            </p>
            <p className="text-slate-400 text-xs mt-1">Pipeline IA a la demande</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">Completeness</p>
            <p className="text-2xl font-bold text-white">{Math.round(Number(docIntelligence?.completeness_ratio || 0) * 100)}%</p>
            <p className="text-slate-400 text-xs mt-1">Maturite du dossier</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">Cashflow moyen doc</p>
            <p className={`text-2xl font-bold ${Number(docIntelligence?.avg_monthly_cashflow_xaf || 0) >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
              {formatXaf(docIntelligence?.avg_monthly_cashflow_xaf)}
            </p>
            <p className="text-slate-400 text-xs mt-1">Dernier traitement {docIntelligence?.latest_processed_at ? new Date(docIntelligence.latest_processed_at).toLocaleDateString('fr-FR') : '—'}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">Actifs documentés</p>
            <p className="text-2xl font-bold text-amber-300">{docIntelligence?.assets_verified_count ?? 0}</p>
            <p className="text-slate-400 text-xs mt-1">{formatXaf(docIntelligence?.assets_documented_total_xaf)} estimés</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">Factures analysées</p>
            <p className="text-2xl font-bold text-blue-300">{docIntelligence?.invoices_analyzed_count ?? 0}</p>
            <p className="text-slate-400 text-xs mt-1">{formatXaf(docIntelligence?.invoice_amount_total_xaf)} objectivés</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="rounded-xl bg-slate-800/40 p-4 border border-slate-700/60">
            <p className="text-slate-400 text-xs mb-2">Revenue mensuel objectivé</p>
            <p className="text-white font-semibold">{formatXaf(docIntelligence?.avg_monthly_revenue_xaf)}</p>
            <p className="text-slate-500 text-xs mt-2">
              Authenticite moyenne : {Math.round(Number(docIntelligence?.avg_authenticity || 0) * 100)}%
            </p>
          </div>
          <div className="rounded-xl bg-slate-800/40 p-4 border border-slate-700/60">
            <p className="text-slate-400 text-xs mb-2">Categories detectees</p>
            <div className="flex flex-wrap gap-2">
              {(docIntelligence?.categories || []).slice(0, 6).map((category) => (
                <span key={category} className="px-2 py-1 rounded-full bg-slate-700 text-slate-200 text-xs">
                  {documentRoleLabel(category)}
                </span>
              ))}
              {(!docIntelligence?.categories || docIntelligence.categories.length === 0) && (
                <span className="text-slate-500 text-sm">Aucune categorie appliquee pour le moment.</span>
              )}
            </div>
          </div>
          <div className="rounded-xl bg-slate-800/40 p-4 border border-slate-700/60">
            <p className="text-slate-400 text-xs mb-2">Derniere lecture utile</p>
            {docIntelligence?.latest_summary?.recommended_actions?.length ? (
              <p className="text-slate-200 text-sm">{docIntelligence.latest_summary.recommended_actions[0]}</p>
            ) : (
              <p className="text-slate-500 text-sm">Analyse appliquee non encore disponible.</p>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mt-4">
          <div className="rounded-xl bg-slate-800/40 p-4 border border-slate-700/60">
            <p className="text-slate-400 text-xs mb-2">Valeur d'actifs documentée</p>
            <p className="text-white font-semibold">{formatXaf(docIntelligence?.assets_documented_total_xaf)}</p>
            <p className="text-slate-500 text-xs mt-2">Inclut biens déclarés, titres et registres d'actifs reconnus.</p>
          </div>
          <div className="rounded-xl bg-slate-800/40 p-4 border border-slate-700/60">
            <p className="text-slate-400 text-xs mb-2">Facturation objectivée</p>
            <p className="text-white font-semibold">{formatXaf(docIntelligence?.invoice_amount_total_xaf)}</p>
            <p className="text-slate-500 text-xs mt-2">{docIntelligence?.invoices_analyzed_count ?? 0} facture(s) exploitées dans le moteur.</p>
          </div>
          <div className="rounded-xl bg-slate-800/40 p-4 border border-slate-700/60">
            <p className="text-slate-400 text-xs mb-2">Force de collatéral</p>
            <p className="text-white font-semibold">
              {docIntelligence?.collateral_strength === 'high'
                ? 'Forte'
                : docIntelligence?.collateral_strength === 'medium'
                  ? 'Moyenne'
                  : 'Faible'}
            </p>
            <p className="text-slate-500 text-xs mt-2">{formatXaf(docIntelligence?.collateral_value_xaf)} mobilisables estimés.</p>
          </div>
        </div>

        {(docIntelligence?.asset_proof_types || []).length > 0 && (
          <div className="mt-4 rounded-xl bg-slate-800/40 p-4 border border-slate-700/60">
            <p className="text-slate-400 text-xs mb-2">Types de preuves d'actifs détectés</p>
            <div className="flex flex-wrap gap-2">
              {(docIntelligence?.asset_proof_types || []).map((proofType) => (
                <span key={proofType} className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-200 text-xs border border-amber-500/20">
                  {proofType}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Score + Piliers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Jauge */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400"/> Score TERAS Entreprise
            </h2>
            <span className="text-xs text-slate-500">
              {data?.score_trend === 'up' ? '↑ Progression' : data?.score_trend === 'down' ? '↓ Baisse' : '→ Stable'}
            </span>
          </div>
          <ScoreGauge score={score} change={change}/>
          <div className="mt-6 p-3 bg-slate-800/60 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Target className="w-4 h-4 text-cyan-400"/>
              Secteur moyen :{' '}
              <strong className="text-white">{data?.sector_comparison?.sector_average ?? data?.sector_comparison?.your_score ?? '—'} pts</strong>
              <span className="text-slate-500 text-xs ml-auto">
                Percentile {data?.sector_comparison?.percentile ?? '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Piliers */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
            <Brain className="w-5 h-5 text-purple-400"/> Détail des Piliers TERAS
          </h2>
          {score === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <BarChart3 className="w-10 h-10 mb-3 opacity-40"/>
              <p className="text-sm">Score non encore calculé.</p>
              <p className="text-xs mt-1">Complétez votre profil et ajoutez des documents pour lancer l'analyse.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {pillars.map(p => <PillarBar key={p.letter} pillar={p}/>)}
            </div>
          )}
          <p className="mt-4 text-xs text-slate-600 text-center">
            Formule TERAS Entreprise = 0.30T + 0.25E + 0.15R + 0.20A + 0.10S
          </p>
        </div>
      </div>

      {/* ── Recommandations IA + Historique scores ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recommandations depuis l'API */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-400"/> Recommandations
          </h2>
          {recommendations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <CheckCircle className="w-8 h-8 mb-2 text-emerald-500/40"/>
              <p className="text-sm">Aucune recommandation pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec: any, i: number) => {
                const title  = rec?.title  || rec?.action || (typeof rec === 'string' ? rec : '');
                const detail = rec?.description || '';
                const pillar = rec?.pillar || '';
                const impact = rec?.impact || '';
                return (
                  <div key={i} className="p-4 bg-slate-800/50 rounded-xl border-l-4 border-purple-500">
                    {title && <p className="text-sm font-semibold text-white mb-1">{title}</p>}
                    {detail && <p className="text-xs text-slate-400">{detail}</p>}
                    {(pillar || impact) && (
                      <div className="flex gap-3 mt-2">
                        {pillar && <span className="text-xs text-purple-400">Pilier: {pillar}</span>}
                        {impact && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          impact === 'high' ? 'bg-rose-500/20 text-rose-400' :
                          impact === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'}`}>{impact}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Historique scores */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-cyan-400"/> Historique des scores
          </h2>
          {!data?.score_history || data.score_history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <Clock className="w-8 h-8 mb-2 opacity-40"/>
              <p className="text-sm">Aucun historique disponible.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.score_history.slice(-8).reverse().map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-3 py-2 bg-slate-800/40 rounded-lg">
                  <span className="text-xs text-slate-400">{entry.score_label}</span>
                  <span className="text-sm font-bold text-cyan-400">{entry.score} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── KPIs supplémentaires ── */}
      {(data?.total_clients !== undefined || data?.total_employees !== undefined) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Total clients</p>
            <p className="text-2xl font-bold text-white">{data?.total_clients ?? '—'}</p>
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Clients actifs</p>
            <p className="text-2xl font-bold text-emerald-400">{data?.active_clients ?? '—'}</p>
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Employés totaux</p>
            <p className="text-2xl font-bold text-white">{data?.total_employees ?? '—'}</p>
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Emploi local</p>
            <p className="text-2xl font-bold text-cyan-400">{data?.local_employees ?? '—'}</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default EnterpriseDashboard;
