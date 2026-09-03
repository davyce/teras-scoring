/**
 * HistoryPage ULTRA-SOPHISTIQUÉE - Version Pro avec IA
 * ✅ Séparation Scores Simulés vs Réels
 * ✅ Analyses IA détaillées par score
 * ✅ Graphiques avancés avec comparaison
 * ✅ Timeline interactive améliorée
 * ✅ Export PDF + Partage
 */

import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, TrendingUp, TrendingDown, Calendar, BarChart3, 
  Loader2, ChevronDown, ChevronUp, AlertCircle, Sparkles,
  Brain, FileText, Download, Share2, Filter, Eye, EyeOff,
  Zap, Target, Award, CheckCircle, Clock, Activity, LineChart
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authFetch } from "../../utils/authFetch";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from 'recharts';

interface ScoreHistoryItem {
  id: number;
  score: number;
  level: string;
  breakdown: { T: number; E: number; R: number; A: number; S: number };
  created_at: string;
  model_version: string;
  ai_analysis?: string;  // ✅ NOUVEAU
  is_simulated?: boolean; // ✅ NOUVEAU
  source?: 'manual' | 'computed' | 'document_analysis';  // ✅ NOUVEAU
}

interface AIAnalysis {
  score_id: number;
  analysis: string;
  key_insights: string[];
  recommendations: string[];
  trend_prediction: string;
  loading?: boolean;
}

// ============================================
// COMPOSANTS VISUELS AVANCÉS
// ============================================

const AnimatedProgressBar = ({ letter, value, maxValue, color, label }: any) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  return (
    <div className="group hover:scale-[1.02] transition-transform">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
            <span className="text-white font-bold text-sm">{letter}</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{label}</div>
            <div className="text-xs text-slate-400">{value}/{maxValue}</div>
          </div>
        </div>
        <div className="text-lg font-bold text-white">{percentage.toFixed(0)}%</div>
      </div>
      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-700 relative"
          style={{ 
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${color.split(' ')[1]}, ${color.split(' ')[2]})`
          }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

const AdvancedCircularGauge = ({ value, maxValue = 1000, size = 120, showDetails = true }: any) => {
  const radius = (size - 12) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / maxValue) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;
  
  const getScoreInfo = (s: number) => {
    if (s >= 900) return { color: "#10b981", label: "Diamant", glow: "#10b98140" };
    if (s >= 750) return { color: "#0ea5e9", label: "Or", glow: "#0ea5e940" };
    if (s >= 600) return { color: "#eab308", label: "Argent", glow: "#eab30840" };
    if (s >= 400) return { color: "#f97316", label: "Bronze", glow: "#f9731640" };
    return { color: "#ef4444", label: "Fer", glow: "#ef444440" };
  };

  const info = getScoreInfo(value);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={radius} 
          stroke="rgba(255,255,255,0.05)" 
          strokeWidth="8" 
          fill="none" 
        />
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={radius} 
          stroke={info.color} 
          strokeWidth="8" 
          fill="none" 
          strokeLinecap="round" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          className="transition-all duration-1000"
          filter="url(#glow)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color: info.color }}>{value}</span>
        {showDetails && (
          <span className="text-xs font-semibold mt-1" style={{ color: info.color }}>
            {info.label}
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================
// GRAPHIQUE PROFESSIONNEL RECHARTS
// ============================================

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

const TIME_RANGES = {
  '7d': { label: '7 jours', days: 7 },
  '30d': { label: '30 jours', days: 30 },
  '90d': { label: '3 mois', days: 90 },
  '1y': { label: '1 an', days: 365 },
  'all': { label: 'Tout', days: null },
};

const ProfessionalChart = ({ history, showSimulated }: any) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');

  // Filtrer et préparer les données
  const chartData = useMemo(() => {
    const filtered = showSimulated ? history : history.filter((h: any) => !h.is_simulated);
    
    // Filtrer par période
    const now = new Date();
    const range = TIME_RANGES[timeRange];
    
    let data = filtered;
    if (range.days) {
      const cutoffDate = new Date(now.getTime() - range.days * 24 * 60 * 60 * 1000);
      data = filtered.filter((h: any) => new Date(h.created_at) >= cutoffDate);
    }

    return data
      .map((item: any) => ({
        date: new Date(item.created_at).toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: 'short' 
        }),
        score: item.score,
        fullDate: item.created_at,
        isSimulated: item.is_simulated,
        timestamp: new Date(item.created_at).getTime(),
      }))
      .sort((a: any, b: any) => a.timestamp - b.timestamp);
  }, [history, timeRange, showSimulated]);

  // Statistiques
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const scores = chartData.map((d: any) => d.score);
    const current = scores[scores.length - 1];
    const first = scores[0];
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
    const change = current - first;
    const changePercent = ((change / first) * 100).toFixed(1);

    return { current, first, min, max, avg, change, changePercent };
  }, [chartData]);

  // Export CSV
  const exportCSV = () => {
    const headers = ['Date', 'Score', 'Type'];
    const rows = chartData.map((d: any) => [
      d.fullDate,
      d.score,
      d.isSimulated ? 'Simulé' : 'Réel'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teras_scores_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-slate-900/95 backdrop-blur-sm border border-sky-500/30 rounded-lg p-4 shadow-xl">
        <p className="text-sky-400 font-semibold mb-2 text-sm">{data.date}</p>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-white font-bold text-2xl">{data.score}</span>
          <span className="text-xs text-slate-400">points</span>
        </div>
        {data.isSimulated && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700">
            <Zap className="w-3 h-3 text-purple-400" />
            <span className="text-purple-400 text-xs font-semibold">Score Simulé</span>
          </div>
        )}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-12 text-center mb-8">
        <LineChart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">Aucune donnée pour cette période</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden mb-8">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Titre */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
              <LineChart className="w-6 h-6 text-sky-400" />
              Vue d'ensemble
            </h2>
            <p className="text-slate-400 text-sm">
              {chartData.length} enregistrements
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filtres temporels */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              {Object.entries(TIME_RANGES).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => setTimeRange(key as TimeRange)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    timeRange === key
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Type de graphique */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  chartType === 'area'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Aire
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  chartType === 'line'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ligne
              </button>
            </div>

            {/* Export */}
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all border border-slate-700 hover:border-sky-500/50"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 p-6 bg-slate-900/30 border-b border-slate-700">
          <div className="text-center">
            <div className="text-slate-400 text-xs mb-1">Actuel</div>
            <div className="text-2xl font-bold text-sky-400">{stats.current}</div>
          </div>

          <div className="text-center">
            <div className="text-slate-400 text-xs mb-1">Variation</div>
            <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
              stats.change >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {stats.change >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              <span>{stats.change >= 0 ? '+' : ''}{stats.change}</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-slate-400 text-xs mb-1">Moyenne</div>
            <div className="text-2xl font-bold text-purple-400">{stats.avg}</div>
          </div>

          <div className="text-center">
            <div className="text-slate-400 text-xs mb-1">Maximum</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.max}</div>
          </div>

          <div className="text-center">
            <div className="text-slate-400 text-xs mb-1">Minimum</div>
            <div className="text-2xl font-bold text-orange-400">{stats.min}</div>
          </div>
        </div>
      )}

      {/* Graphique */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'area' ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                tickLine={false}
              />
              <YAxis 
                stroke="#94a3b8"
                domain={[0, 1000]}
                style={{ fontSize: '12px' }}
                tickLine={false}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={stats?.avg || 0} 
                stroke="#a78bfa" 
                strokeDasharray="5 5"
                label={{ value: 'Moyenne', fill: '#a78bfa', fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#0ea5e9"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorScore)"
              />
              <Brush 
                dataKey="date" 
                height={30} 
                stroke="#0ea5e9"
                fill="#1e293b"
              />
            </AreaChart>
          ) : (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                tickLine={false}
              />
              <YAxis 
                stroke="#94a3b8"
                domain={[0, 1000]}
                style={{ fontSize: '12px' }}
                tickLine={false}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={stats?.avg || 0} 
                stroke="#a78bfa" 
                strokeDasharray="5 5"
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#0ea5e9"
                strokeWidth={3}
                fill="none"
                dot={{ fill: '#0ea5e9', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>

        {/* Légende */}
        <div className="flex items-center justify-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-sky-500 rounded-full" />
            <span className="text-slate-400">Score</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-px bg-purple-400" style={{ width: '20px' }} />
            <span className="text-slate-400">Moyenne</span>
          </div>
          {showSimulated && (
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-purple-400" />
              <span className="text-slate-400">Simulé</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// CARTE SCORE AVEC IA
// ============================================

const AdvancedScoreCard = ({ 
  item, 
  trend, 
  isFirst, 
  isExpanded, 
  onToggle,
  aiAnalysis,
  onRequestAnalysis
}: any) => {
  const pillarConfig = [
    { key: 'T', label: 'Transactions', max: 300, color: 'from-sky-500 to-blue-600' },
    { key: 'E', label: 'Épargne', max: 150, color: 'from-green-500 to-emerald-600' },
    { key: 'R', label: 'Revenus', max: 200, color: 'from-yellow-500 to-amber-600' },
    { key: 'A', label: 'Actifs', max: 150, color: 'from-orange-500 to-red-600' },
    { key: 'S', label: 'Social', max: 200, color: 'from-purple-500 to-pink-600' }
  ];

  const getSourceBadge = () => {
    if (item.is_simulated) {
      return (
        <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold flex items-center gap-1.5">
          <Zap className="w-3 h-3" />
          Simulé
        </span>
      );
    }
    
    switch (item.source) {
      case 'document_analysis':
        return (
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold flex items-center gap-1.5">
            <FileText className="w-3 h-3" />
            Documents
          </span>
        );
      case 'computed':
        return (
          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold flex items-center gap-1.5">
            <Activity className="w-3 h-3" />
            Calculé
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3" />
            Réel
          </span>
        );
    }
  };

  return (
    <div className="relative group">
      {/* Timeline */}
      <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-sky-500/30 via-sky-500/10 to-transparent" />
      <div className={`absolute left-6 top-8 w-5 h-5 rounded-full border-2 z-10 transition-all ${
        isFirst 
          ? "bg-gradient-to-br from-sky-400 to-blue-600 border-sky-300 shadow-lg shadow-sky-500/50" 
          : item.is_simulated
          ? "bg-gradient-to-br from-purple-500 to-pink-600 border-purple-400"
          : "bg-slate-800 border-slate-600"
      }`}>
        {isFirst && (
          <div className="absolute inset-0 rounded-full bg-sky-400 animate-ping opacity-40" />
        )}
      </div>
      
      {/* Card */}
      <div className={`ml-16 bg-slate-900/70 backdrop-blur-sm border rounded-2xl overflow-hidden transition-all hover:border-sky-500/30 ${
        isFirst 
          ? "border-sky-500/50 shadow-lg shadow-sky-500/10" 
          : item.is_simulated
          ? "border-purple-500/30"
          : "border-white/10"
      }`}>
        {/* Header */}
        <button 
          onClick={onToggle} 
          className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition group"
        >
          <div className="flex items-center gap-6">
            <AdvancedCircularGauge value={item.score} size={100} />
            
            <div className="text-left space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                {getSourceBadge()}
                
                {trend !== null && trend !== 0 && (
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
                    trend > 0 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="text-sm font-bold">{trend > 0 ? "+" : ""}{trend}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>{new Date(item.created_at).toLocaleDateString("fr-FR", { 
                  day: "numeric", 
                  month: "long", 
                  year: "numeric", 
                  hour: "2-digit", 
                  minute: "2-digit" 
                })}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!item.is_simulated && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestAnalysis(item.id);
                }}
                className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/30 transition group"
                title="Analyse IA"
              >
                <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
              </button>
            )}
            
            <div className="text-slate-400 group-hover:text-white transition">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </button>
        
        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-white/10">
            {/* Piliers */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-4">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                Détail des piliers
              </div>
              
              {pillarConfig.map((pillar) => (
                <AnimatedProgressBar
                  key={pillar.key}
                  letter={pillar.key}
                  value={item.breakdown[pillar.key as keyof typeof item.breakdown]}
                  maxValue={pillar.max}
                  color={pillar.color}
                  label={pillar.label}
                />
              ))}
            </div>
            
            {/* Analyse IA */}
            {aiAnalysis && !item.is_simulated && (
              <div className="border-t border-white/10 bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-white">Analyse IA</span>
                  {aiAnalysis.loading && (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  )}
                </div>
                
                {aiAnalysis.loading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-800 rounded animate-pulse" />
                    <div className="h-4 bg-slate-800 rounded animate-pulse w-3/4" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Analyse principale */}
                    <div className="prose prose-invert prose-sm max-w-none">
                      <p className="text-slate-300 leading-relaxed">{aiAnalysis.analysis}</p>
                    </div>
                    
                    {/* Insights clés */}
                    {aiAnalysis.key_insights && aiAnalysis.key_insights.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-slate-400 mb-2">Points clés :</div>
                        <ul className="space-y-1">
                          {aiAnalysis.key_insights.map((insight: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                              <Target className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Recommandations */}
                    {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-slate-400 mb-2">Recommandations :</div>
                        <ul className="space-y-1">
                          {aiAnalysis.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-emerald-300">
                              <Award className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// PAGE PRINCIPALE
// ============================================

const HistoryPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [history, setHistory] = useState<ScoreHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showSimulated, setShowSimulated] = useState(true);
  const [aiAnalyses, setAiAnalyses] = useState<Record<number, AIAnalysis>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    loadHistory();
  }, [isAuthenticated, navigate]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authFetch('/api/scoring/user/history/');
      if (!response.ok) throw new Error('Erreur de chargement');
      const data = await response.json();
      setHistory(data);
      if (data.length > 0) setExpandedId(data[0].id);
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const requestAIAnalysis = async (scoreId: number) => {
    // Marquer comme en chargement
    setAiAnalyses(prev => ({
      ...prev,
      [scoreId]: { score_id: scoreId, analysis: '', key_insights: [], recommendations: [], trend_prediction: '', loading: true }
    }));

    try {
      const response = await authFetch(`/api/scoring/user/history/${scoreId}/analyze/`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Erreur analyse IA');
      
      const data = await response.json();
      
      setAiAnalyses(prev => ({
        ...prev,
        [scoreId]: { ...data, loading: false }
      }));
    } catch (err) {
      console.error('Erreur analyse IA:', err);
      // Fallback analyse basique
      const score = history.find(h => h.id === scoreId);
      if (score) {
        setAiAnalyses(prev => ({
          ...prev,
          [scoreId]: {
            score_id: scoreId,
            analysis: `Votre score de ${score.score} reflète votre situation financière actuelle. Continuez vos efforts pour l'améliorer.`,
            key_insights: ['Score en cours d\'analyse', 'Données en cours de traitement'],
            recommendations: ['Maintenez vos bonnes pratiques', 'Consultez vos recommandations personnalisées'],
            trend_prediction: 'Stable',
            loading: false
          }
        }));
      }
    }
  };

  const getTrend = (index: number) => {
    if (index >= history.length - 1) return null;
    return history[index].score - history[index + 1].score;
  };

  const filteredHistory = showSimulated 
    ? history 
    : history.filter(h => !h.is_simulated);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0f1729] to-[#0b1220] text-white p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/mon-espace" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Retour
        </Link>
        
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-3 flex items-center gap-3 text-white">
              <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              Historique des Scores
            </h1>
            <p className="text-slate-400 text-lg">Évolution détaillée de votre score TERAS</p>
          </div>
          
          {/* Filtres */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSimulated(!showSimulated)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                showSimulated
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "bg-slate-800 text-slate-400 border border-white/10"
              }`}
            >
              {showSimulated ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {showSimulated ? "Tout afficher" : "Scores réels uniquement"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-sky-500 mx-auto mb-4" />
            <p className="text-slate-400">Chargement de l'historique...</p>
          </div>
        </div>
      )}
      
      {/* Error */}
      {error && (
        <div className="text-center py-20 bg-slate-900/50 border border-red-500/30 rounded-2xl">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-white">Erreur de chargement</h3>
          <p className="text-red-400 mb-6">{error}</p>
          <button 
            onClick={loadHistory} 
            className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-semibold transition"
          >
            Réessayer
          </button>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && !error && history.length === 0 && (
        <div className="text-center py-32 bg-slate-900/50 border border-white/10 rounded-2xl">
          <div className="text-8xl mb-6">📊</div>
          <h3 className="text-2xl font-bold mb-3 text-white">Aucun historique disponible</h3>
          <p className="text-slate-400 mb-8">Vos scores apparaîtront ici une fois calculés</p>
          <Link 
            to="/calcul-score" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-sky-500/30 transition"
          >
            <Sparkles className="w-5 h-5" />
            Calculer mon score
          </Link>
        </div>
      )}
      
      {/* Content */}
      {!loading && !error && history.length > 0 && (
        <>
          {/* NOUVEAU: Graphique Professionnel */}
          <ProfessionalChart history={history} showSimulated={showSimulated} />
          
          {/* Info Badge */}
          {showSimulated && history.some(h => h.is_simulated) && (
            <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-purple-300 mb-1">Scores simulés inclus</div>
                <div className="text-xs text-purple-400/80">
                  Les scores simulés sont des projections basées sur vos ajustements manuels. 
                  Seuls les scores réels sont pris en compte pour votre profil TERAS officiel.
                </div>
              </div>
            </div>
          )}
          
          {/* Score Cards */}
          <div className="space-y-6">
            {filteredHistory.map((item, index) => (
              <AdvancedScoreCard
                key={item.id}
                item={item}
                trend={getTrend(history.indexOf(item))}
                isFirst={index === 0}
                isExpanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                aiAnalysis={aiAnalyses[item.id]}
                onRequestAnalysis={requestAIAnalysis}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HistoryPage;
