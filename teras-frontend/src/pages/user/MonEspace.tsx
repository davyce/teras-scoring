/**
 * MonEspace - VERSION FINALE SOPHISTIQUÉE
 * ✅ Volume COMPLET (pas abrégé)
 * ✅ Recommandations IA INTERACTIVES avec modal détaillé
 * ✅ Animation jauge PREMIUM avec gradient animé
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Bot, FileText, Calculator, History, User as UserIcon, MessageSquare, 
  X, Send, Sparkles, ChevronRight, Zap, Loader2, Download, CheckCircle, 
  Clock, BookOpen, ArrowRight, Plus, Target, Lightbulb, TrendingDown, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authFetch } from '../../utils/authFetch';

// ============================================
// TYPES
// ============================================
interface Recommendation {
  id: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  completed: boolean;
}

interface DetailedRecommendation {
  diagnostic: string;
  objectif: string;
  plan_action: Array<{
    etape: number;
    titre: string;
    description: string;
  }>;
  impact_points: string;
  delai: string;
  conseils_bonus: string[];
  user_name?: string;
  current_score?: number;
  category?: string;
}

// ============================================
// COMPOSANT: Jauge Circulaire PREMIUM ⭐
// ============================================
const CircularGauge = ({ value, maxValue = 1000 }: { value: number; maxValue?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = (value / maxValue) * 100;
  const radius = 90;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 900) return ['#10b981', '#059669']; // Vert
    if (s >= 750) return ['#0ea5e9', '#0284c7']; // Bleu
    if (s >= 600) return ['#eab308', '#ca8a04']; // Jaune
    if (s >= 400) return ['#f97316', '#ea580c']; // Orange
    return ['#ef4444', '#dc2626']; // Rouge
  };
  
  const [color1, color2] = getColor(value);

  // Animation compteur
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="200" height="200" className="transform -rotate-90">
        {/* Background circle */}
        <circle cx="100" cy="100" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="16" fill="none" />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${value}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: color1, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: color2, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        {/* Animated progress circle */}
        <circle 
          cx="100" 
          cy="100" 
          r={radius} 
          stroke={`url(#gradient-${value})`}
          strokeWidth="16" 
          fill="none" 
          strokeLinecap="round"
          strokeDasharray={circumference} 
          strokeDashoffset={offset}
          className="transition-all duration-2000 ease-out"
          style={{ 
            filter: `drop-shadow(0 0 20px ${color1}80)`,
            animation: 'pulse 2s infinite'
          }} 
        />
      </svg>
      
      <div className="absolute text-center">
        <div className="text-5xl font-bold mb-1 transition-all duration-300" 
          style={{ color: color1 }}>
          {displayValue}
        </div>
        <div className="text-slate-500 text-sm">/ {maxValue}</div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

// ============================================
// COMPOSANT: Stat Card avec VOLUME COMPLET ⭐
// ============================================
const StatCard = ({ icon: Icon, label, value, subtitle, color, isVolume }: any) => {
  // Formater le volume sans abréviation
  const formatVolume = (val: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const displayValue = isVolume ? formatVolume(value) : value;

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 hover:border-white/10 transition">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5" style={{ color }} />
        <span className="text-slate-400 text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{displayValue}</div>
      <div className="text-xs text-slate-500">{subtitle}</div>
    </div>
  );
};

// ============================================
// COMPOSANT: Pillar Bar
// ============================================
const PillarBar = ({ letter, label, value, max, color }: any) => {
  const percentage = (value / max) * 100;
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0" 
        style={{ backgroundColor: color }}>
        {letter}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-slate-300">{label}</span>
          <span className="text-sm font-semibold text-white">{value}/{max}</span>
        </div>
        <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${percentage}%`, backgroundColor: color }} />
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPOSANT: Recommendation Card INTERACTIVE ⭐
// ============================================
const RecommendationCard = ({ 
  rec, 
  onViewDetail 
}: { 
  rec: Recommendation; 
  onViewDetail: (rec: Recommendation) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const priorityConfig = {
    high: { icon: '🔥', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'Urgent' },
    medium: { icon: '⚡', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', badge: 'Important' },
    low: { icon: '💡', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'À considérer' }
  };

  const config = priorityConfig[rec.priority];

  return (
    <div
      className={`${config.bg} border ${rec.completed ? 'border-green-500/50' : config.border} rounded-xl p-4 transition-all duration-300 cursor-pointer group ${isHovered ? 'scale-105 shadow-xl' : ''} relative`}
      onClick={() => onViewDetail(rec)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>

      {rec.completed && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/40 rounded-full">
          <CheckCircle className="w-3 h-3 text-green-400" />
          <span className="text-xs text-green-400 font-semibold">Complété</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className={`text-xs font-semibold ${config.text}`}>{config.badge}</span>
          <span className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-slate-400">{rec.category}</span>
        </div>
        <span className="text-sm font-bold text-green-400">{rec.impact}</span>
      </div>
      
      <h4 className="text-white font-semibold text-sm mb-1 group-hover:text-sky-400 transition">
        {rec.title}
      </h4>
      
      <p className="text-slate-400 text-xs mb-3 line-clamp-2">{rec.description}</p>
      
      <div className="flex items-center justify-between">
        <button className="text-xs text-purple-400 font-medium flex items-center gap-1 hover:gap-2 transition-all">
          <Sparkles className="w-3 h-3" />
          Voir le plan IA complet
        </button>
        <ArrowRight className={`w-4 h-4 text-slate-600 group-hover:text-sky-400 transition-all ${isHovered ? 'translate-x-1' : ''}`} />
      </div>
    </div>
  );
};

// ============================================
// COMPOSANT: Modal Recommandation Détaillée ⭐⭐⭐
// ============================================
const DetailedRecommendationModal = ({
  isOpen,
  onClose,
  recommendation,
  onComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  recommendation: Recommendation | null;
  onComplete: (recId: number) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<DetailedRecommendation | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState('');
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');

  useEffect(() => {
    if (isOpen && recommendation) {
      setCompletedSteps(new Set());
      setCompleteError('');
      loadDetail();
    }
  }, [isOpen, recommendation]);

  const loadDetail = async () => {
    if (!recommendation) return;
    
    setLoading(true);
    setDownloadError('');
    setDownloadSuccess('');
    try {
      const response = await authFetch('/api/scoring/user/recommendations/generate-detail/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation_id: recommendation.id,
          category: recommendation.category
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDetail(data);
      }
    } catch (err) {
      console.error('Erreur chargement détail:', err);
    } finally {
      setLoading(false);
    }
  };

  const filenameFromDisposition = (disposition: string | null) => {
    const match = disposition?.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
    const rawName = match?.[1] || match?.[2];
    return rawName ? decodeURIComponent(rawName) : '';
  };

  const downloadPDF = async () => {
    if (!detail) return;
    
    setDownloadingPDF(true);
    setDownloadError('');
    setDownloadSuccess('');
    try {
      const response = await authFetch('/api/scoring/user/recommendations/export-pdf/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          detail_data: detail
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get('Content-Type') || '';
        let message = `Erreur ${response.status} pendant la génération du PDF.`;
        if (contentType.includes('application/json')) {
          const data = await response.json().catch(() => ({}));
          message = data.error || data.detail || message;
        } else {
          const text = await response.text().catch(() => '');
          if (text) message = text.slice(0, 220);
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      const filename = filenameFromDisposition(response.headers.get('Content-Disposition'))
        || `TERAS_Plan_IA_${detail.category || 'personnalise'}_${date}.pdf`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setDownloadSuccess('Plan PDF téléchargé.');
    } catch (err) {
      console.error('Erreur téléchargement PDF:', err);
      setDownloadError(err instanceof Error ? err.message : 'Impossible de télécharger le PDF.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const toggleStep = (etape: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(etape)) next.delete(etape);
      else next.add(etape);
      return next;
    });
  };

  const allStepsCount = detail?.plan_action?.length ?? 0;
  const doneStepsCount = completedSteps.size;
  const allStepsDone = allStepsCount > 0 && doneStepsCount >= allStepsCount;

  const markComplete = async () => {
    if (!recommendation) return;
    setCompleting(true);
    setCompleteError('');
    try {
      const res = await authFetch(`/api/scoring/user/recommendations/${recommendation.id}/complete/`, {
        method: 'POST',
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Erreur ${res.status}`);
      }
      onComplete(recommendation.id);
      onClose();
    } catch (err) {
      setCompleteError(err instanceof Error ? err.message : 'Impossible de marquer comme complété.');
    } finally {
      setCompleting(false);
    }
  };

  if (!isOpen || !recommendation) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
        
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
                <Sparkles className="w-7 h-7 text-yellow-300 animate-pulse" />
                Plan IA Personnalisé
              </h2>
              <p className="text-purple-100 text-sm">{recommendation.title}</p>
            </div>
            <div className="flex items-center gap-2">
              {detail && (
                <button 
                  onClick={downloadPDF}
                  disabled={downloadingPDF}
                  title="Télécharger le plan en PDF"
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-50 flex items-center gap-2 text-white text-sm font-semibold">
                  {downloadingPDF ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Download className="w-5 h-5 text-white" />
                  )}
                  <span className="hidden sm:inline">PDF</span>
                </button>
              )}
              <button onClick={onClose} 
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {downloadError && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{downloadError}</span>
            </div>
          )}
          {downloadSuccess && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Génération du plan par l'IA...</p>
            </div>
          ) : detail ? (
            <>
              {/* Diagnostic */}
              <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Diagnostic</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">{detail.diagnostic}</p>
              </div>

              {/* Objectif */}
              <div className="bg-slate-800/50 border border-green-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-bold text-white">Objectif</h3>
                </div>
                <p className="text-slate-300 text-lg font-medium">{detail.objectif}</p>
              </div>

              {/* Plan d'action */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-white">Plan d'Action</h3>
                  </div>
                  <span className="text-sm text-slate-400">
                    {doneStepsCount}/{allStepsCount} étapes
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-slate-700/60 rounded-full mb-4 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: allStepsCount > 0 ? `${(doneStepsCount / allStepsCount) * 100}%` : '0%' }}
                  />
                </div>
                <div className="space-y-3">
                  {detail.plan_action.map((step, idx) => {
                    const done = completedSteps.has(step.etape);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleStep(step.etape)}
                        className={`bg-slate-800/50 border rounded-xl p-4 transition-all cursor-pointer group select-none ${
                          done
                            ? 'border-green-500/40 bg-green-500/5'
                            : 'border-white/10 hover:border-purple-500/30'
                        }`}>
                        <div className="flex gap-4">
                          <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center flex-shrink-0 transition ${
                            done ? 'bg-green-500 text-white' : 'bg-purple-500 text-white group-hover:scale-110'
                          }`}>
                            {done ? <CheckCircle className="w-4 h-4" /> : step.etape}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-semibold mb-1 transition ${done ? 'text-green-300 line-through decoration-green-500/50' : 'text-white'}`}>
                              {step.titre}
                            </h4>
                            <p className="text-slate-400 text-sm">{step.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Impact & Délai */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-slate-400">Impact Estimé</span>
                  </div>
                  <p className="text-2xl font-bold text-green-400">{detail.impact_points}</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-orange-400" />
                    <span className="text-sm text-slate-400">Délai</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-400">{detail.delai}</p>
                </div>
              </div>

              {/* Conseils Bonus */}
              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-bold text-white">Conseils Bonus</h3>
                </div>
                <ul className="space-y-2">
                  {detail.conseils_bonus.map((conseil, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-300">
                      <span className="text-yellow-400 mt-1">💡</span>
                      <span>{conseil}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              {completeError && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{completeError}</span>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={markComplete}
                  disabled={completing || (allStepsCount > 0 && !allStepsDone)}
                  title={allStepsCount > 0 && !allStepsDone ? 'Cochez toutes les étapes pour valider' : ''}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {completing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  {allStepsCount > 0 && !allStepsDone
                    ? `Encore ${allStepsCount - doneStepsCount} étape${allStepsCount - doneStepsCount > 1 ? 's' : ''}`
                    : 'Marquer comme terminé'}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-800 border border-white/10 text-white rounded-xl font-semibold hover:bg-slate-700 transition">
                  Plus tard
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <TrendingDown className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Impossible de charger le détail</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPOSANT: Quick Action
// ============================================
const QuickAction = ({ icon: Icon, title, onClick, gradient }: any) => (
  <button onClick={onClick} 
    className="relative overflow-hidden bg-slate-900/50 border border-white/5 rounded-xl p-4 hover:border-white/20 transition group text-left">
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition`} />
    <div className="relative z-10 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-sky-400 group-hover:scale-110 transition" />
        <span className="text-white font-medium text-sm">{title}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-1 transition" />
    </div>
  </button>
);

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function MonEspace() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

  const loadData = async () => {
    try {
      const response = await authFetch('/api/scoring/user/dashboard/');
      if (!response.ok) throw new Error('Erreur');
      const data = await response.json();
      setDashboard(data);
      
      const recResponse = await authFetch('/api/scoring/user/recommendations/');
      if (recResponse.ok) {
        const recData = await recResponse.json();
        setRecommendations(recData.slice(0, 3));
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (rec: Recommendation) => {
    setSelectedRecommendation(rec);
    setShowDetailModal(true);
  };

  const handleCompleteRecommendation = (recId: number) => {
    setRecommendations(prev =>
      prev.map(r => r.id === recId ? { ...r, completed: true } : r)
    );
    setDashboard((prev: any) => {
      if (!prev) return prev;
      const stats = prev.stats_30j ?? {};
      return {
        ...prev,
        stats_30j: {
          ...stats,
          recommendations_completed: (stats.recommendations_completed ?? 0) + 1,
        },
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-sky-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  const score = dashboard?.score?.score || 0;
  const level = dashboard?.score?.level || 'Débutant';
  const breakdown = dashboard?.score?.breakdown || { T: 0, E: 0, R: 0, A: 0, S: 0 };
  const stats = dashboard?.stats_30j || { transactions_count: 0, total_volume: 0, documents_uploaded: 0, recommendations_completed: 0 };

  const pillars = [
    { letter: 'T', label: 'Transactions', value: breakdown.T, max: 100, color: '#0ea5e9' },
    { letter: 'E', label: 'Épargne', value: breakdown.E, max: 100, color: '#22c55e' },
    { letter: 'R', label: 'Revenus', value: breakdown.R, max: 100, color: '#eab308' },
    { letter: 'A', label: 'Actifs', value: breakdown.A, max: 100, color: '#f97316' },
    { letter: 'S', label: 'Social', value: breakdown.S, max: 100, color: '#a855f7' }
  ];

  return (
    <>
      <div className="min-h-screen bg-[#0b1220] text-white p-6">
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">
                Bonjour, {user?.first_name || 'Jean'} 👋
              </h1>
              <p className="text-slate-400">
                Score <span className="text-yellow-400 font-semibold">{level}</span>
              </p>
            </div>
            <button onClick={loadData}
              className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg hover:border-white/20 transition text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Score + Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 bg-slate-900/50 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center">
              <CircularGauge value={score} />
              <div className="mt-4 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
                <span className="text-yellow-400 font-semibold text-sm">🏆 {level}</span>
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-2 gap-4">
              <StatCard icon={TrendingUp} label="Transactions" value={stats.transactions_count} subtitle="30 derniers jours" color="#0ea5e9" />
              <StatCard icon={Zap} label="Volume" value={stats.total_volume} subtitle="FCFA échangés" color="#22c55e" isVolume={true} />
              <StatCard icon={FileText} label="Documents" value={stats.documents_uploaded} subtitle="Téléversés" color="#a855f7" />
              <StatCard icon={CheckCircle} label="Actions" value={stats.recommendations_completed} subtitle="Complétées" color="#f97316" />
            </div>
          </div>

          {/* Recommandations IA */}
          {recommendations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                  Recommandations IA
                </h2>
                <span className="text-sm text-slate-400">{recommendations.length} actions suggérées</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.map(rec => (
                  <RecommendationCard key={rec.id} rec={rec} onViewDetail={handleViewDetail} />
                ))}
              </div>
            </div>
          )}

          {/* Piliers */}
          <div>
            <h2 className="text-xl font-bold mb-4">Détail par pilier</h2>
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 space-y-4">
              {pillars.map(p => <PillarBar key={p.letter} {...p} />)}
            </div>
          </div>

          {/* Actions */}
          <div>
            <h2 className="text-xl font-bold mb-4">Actions rapides</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <QuickAction icon={History} title="Historique" onClick={() => navigate('/historique')} gradient="from-blue-500 to-cyan-500" />
              <QuickAction icon={FileText} title="Documents" onClick={() => navigate('/documents')} gradient="from-purple-500 to-pink-500" />
              <QuickAction icon={Calculator} title="Simulateurs" onClick={() => navigate('/simulateurs')} gradient="from-green-500 to-emerald-500" />
              <QuickAction icon={MessageSquare} title="Assistant IA" onClick={() => navigate('/ameliorer')} gradient="from-orange-500 to-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Modal Recommandation Détaillée */}
      <DetailedRecommendationModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        recommendation={selectedRecommendation}
        onComplete={handleCompleteRecommendation}
      />
    </>
  );
}
