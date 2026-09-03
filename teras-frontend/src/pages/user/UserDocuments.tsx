// @ts-nocheck
/**
 * Page Documents TERAS - VERSION PIPELINE COMPLÈTE
 * ✅ Upload drag & drop multi-fichiers
 * ✅ Parsing automatique (PDF/Excel/CSV/OFX/MT940/OCR)
 * ✅ Analyse IA automatique (Claude Sonnet 4)
 * ✅ Affichage transactions parsées
 * ✅ KPIs revenus, CRM, cashflow
 * ✅ Application au score TERAS
 * ✅ Download/Delete fonctionnels
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { authFetch } from '../../utils/authFetch';
import DocumentPreviewModal from '../../components/shared/DocumentPreviewModal';
import {
  FileText, Upload, Download, Trash2, Eye, Search, Grid, List, RefreshCw,
  AlertCircle, X, Sparkles, Brain, TrendingUp, DollarSign, CreditCard,
  CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, Zap, Shield,
  Loader2, Wallet, BarChart3,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocItem {
  id: string;
  filename: string;
  size_mb: number;
  format: string;
  status: 'uploaded' | 'processing' | 'parsed' | 'failed';
  uploaded_at: string;
  transactions_count: number;
  authenticity_score: number;
  crm_estimated: number;
  months_covered: number;
  errors_count: number;
  doc_type?: string;
  parse_expected?: boolean;
  message?: string;
}

interface ParseResult {
  status: string;
  transactions_count: number;
  authenticity_score: number;
  quality_stats: {
    total_credits_xaf: number;
    total_debits_xaf: number;
    net_cashflow_xaf: number;
    monthly_avg_income_xaf: number;
    months_covered: number;
    date_from: string;
    date_to: string;
  };
  teras_signals: {
    crm_estimated_xaf: number;
    net_income_monthly_xaf: number;
    months_analyzed: number;
    tontine_transactions: number;
    transactions_signal: { frequency_monthly: number; regularity_score: number };
    savings_signal: { streak_months: number; monthly_deposit_avg_xaf: number };
    income_signal: { monthly_avg_xaf: number; income_stability: number };
  };
  recommendations: { type: string; message: string }[];
  errors: string[];
  analysis_summary?: {
    recommended_actions?: string[];
    score_impact?: { estimated_change?: number };
  };
  generated_score?: {
    id: number;
    score: number;
    level: string;
    breakdown: Record<string, number>;
  };
  processed_at?: string;
  transactions?: {
    date: string; description: string; amount: number;
    type: 'credit' | 'debit'; category: string; is_income: boolean;
  }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FCFA = (n: number) => {
  if (!n || isNaN(n)) return '0 FCFA';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M FCFA`;
  return `${Math.round(n).toLocaleString('fr-FR')} FCFA`;
};

const FORMAT_ICONS: Record<string, string> = {
  pdf: '📄', excel: '📊', csv: '📋', ofx: '🏦',
  qif: '🏦', mt940: '🏦', image_ocr: '🖼️', unknown: '📁',
};

const USER_DOC_TYPES = [
  { value: 'other', label: 'Détection automatique' },
  { value: 'invoice', label: 'Facture / reçu' },
  { value: 'salary_slip', label: 'Bulletin de salaire' },
  { value: 'proof_asset', label: "Preuve d'actif / garantie" },
  { value: 'identity', label: "Pièce d'identité" },
  { value: 'tax_document', label: 'Document fiscal / conformité' },
  { value: 'bank_statement', label: 'Relevé bancaire' },
];

const getFileType = (filename: string): 'pdf' | 'excel' | 'image' | 'ofx' | 'other' => {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'excel';
  if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image';
  if (['ofx', 'qif', 'sta', 'mt940'].includes(ext)) return 'ofx';
  return 'other';
};

// ─── Sous-composants ──────────────────────────────────────────────────────────

const StatusBadge = ({ status, count }: { status: DocItem['status']; count?: number }) => {
  const configs = {
    uploaded:   { icon: Clock,      color: 'text-sky-400',     bg: 'bg-sky-400/10',    label: 'Enregistré' },
    processing: { icon: RefreshCw,  color: 'text-yellow-400',  bg: 'bg-yellow-400/10', label: 'Parsing...' },
    parsed:     { icon: CheckCircle,color: 'text-green-400',   bg: 'bg-green-400/10',  label: count ? `${count} txn` : 'Analysé' },
    failed:     { icon: XCircle,    color: 'text-red-400',     bg: 'bg-red-400/10',    label: 'Échec' },
  };
  const cfg  = configs[status];
  const Icon = cfg.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${cfg.bg}`}>
      <Icon className={`w-3.5 h-3.5 ${cfg.color} ${status === 'processing' ? 'animate-spin' : ''}`}/>
      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
    </div>
  );
};

const FileTypeIcon = ({ filename, size = 40 }: { filename: string; size?: number }) => {
  const type = getFileType(filename);
  const configs = {
    pdf:   { gradient: 'from-red-500 to-red-600',     icon: FileText },
    excel: { gradient: 'from-green-500 to-green-600', icon: FileText },
    image: { gradient: 'from-purple-500 to-purple-600', icon: FileText },
    ofx:   { gradient: 'from-sky-500 to-sky-600',     icon: FileText },
    other: { gradient: 'from-slate-500 to-slate-600', icon: FileText },
  };
  const cfg  = configs[type];
  const Icon = cfg.icon;
  return (
    <div className={`rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shrink-0`}
      style={{ width: size, height: size }}>
      <Icon className="text-white" style={{ width: size * 0.5, height: size * 0.5 }}/>
    </div>
  );
};

// ─── Composant Parse Results ───────────────────────────────────────────────────

const ParseResultsPanel = ({
  result, docId, onAnalyze, onApply, analyzing, applying
}: {
  result: ParseResult;
  docId: string;
  onAnalyze: (id: string) => void;
  onApply: (id: string) => void;
  analyzing: boolean;
  applying: boolean;
}) => {
  const [showTxns, setShowTxns] = useState(false);
  const signals = result.teras_signals || {};
  const stats   = result.quality_stats || {};

  return (
    <div className="mt-4 space-y-3">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Revenu/mois',  value: FCFA(signals.income_signal?.monthly_avg_xaf || 0),   icon: DollarSign, color: 'text-emerald-400' },
          { label: 'CRM estimé',   value: FCFA(signals.crm_estimated_xaf || 0),                 icon: Wallet,     color: 'text-sky-400' },
          { label: 'Cashflow net', value: FCFA(stats.net_cashflow_xaf || 0),                    icon: BarChart3,  color: 'text-violet-400' },
          { label: 'Authenticité', value: `${Math.round((result.authenticity_score || 0) * 100)}%`, icon: Shield, color: 'text-amber-400' },
        ].map((k, i) => (
          <div key={i} className="bg-slate-800/50 border border-white/5 rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-1">{k.label}</p>
            <p className={`${k.color} font-bold text-sm`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Recommandations */}
      {result.recommendations?.length > 0 && (
        <div className="space-y-1.5">
          {result.recommendations.map((r, i) => (
            <div key={i} className={`flex gap-2 px-3 py-2 rounded-lg text-xs ${
              r.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              : r.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
              : 'bg-slate-800/60 border border-white/5 text-slate-400'
            }`}>
              <span className="shrink-0">{r.type === 'success' ? '✅' : r.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
              {r.message}
            </div>
          ))}
        </div>
      )}

      {/* Transactions */}
      {result.transactions && result.transactions.length > 0 && (
        <div>
          <button onClick={() => setShowTxns(!showTxns)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            {showTxns ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
            {showTxns ? 'Masquer' : 'Voir'} les {result.transactions.length} transactions
          </button>
          {showTxns && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/50">
              {result.transactions.slice(0, 50).map((t, i) => (
                <div key={i} className={`flex items-center gap-2 px-3 py-2 text-xs border-b border-white/5 ${i % 2 ? 'bg-white/2' : ''}`}>
                  <span className="text-slate-500 whitespace-nowrap">{t.date}</span>
                  <span className="text-slate-300 flex-1 truncate">{t.description}</span>
                  <span className={`font-medium whitespace-nowrap ${t.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                    {t.type === 'credit' ? '+' : '-'}{t.amount.toLocaleString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex gap-2 pt-1">
        <button onClick={() => onAnalyze(docId)} disabled={analyzing}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all">
          {analyzing ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/> Analyse...</>
            : <><Sparkles className="w-3.5 h-3.5"/> Analyser avec Claude Sonnet 4</>}
        </button>
        <button onClick={() => onApply(docId)} disabled={applying}
          className="flex items-center gap-1.5 px-3 py-2 bg-violet-600/80 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all">
          {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <TrendingUp className="w-3.5 h-3.5"/>}
          {applying ? '' : 'Score'}
        </button>
      </div>

      {result.generated_score && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          Score TERAS généré : <span className="font-semibold">{result.generated_score.score}/1000</span> · Niveau {result.generated_score.level}
        </div>
      )}
    </div>
  );
};

// ─── Composant Analyse IA ─────────────────────────────────────────────────────

const AIAnalysisPanel = ({ analysis }: { analysis: string }) => {
  const [expanded, setExpanded] = useState(true);
  if (!analysis) return null;

  const renderLines = (text: string) => text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-bold text-purple-300 mt-3 mb-1">{line.slice(3)}</h3>;
    if (line.startsWith('### ')) return <h4 key={i} className="text-xs font-bold text-sky-300 mt-2 mb-0.5">{line.slice(4)}</h4>;
    if (line.match(/^[-•]\s/)) return (
      <div key={i} className="flex gap-2 ml-2 mt-0.5">
        <Zap className="w-3 h-3 text-purple-400 shrink-0 mt-0.5"/>
        <span className="text-xs text-slate-300">{line.slice(2)}</span>
      </div>
    );
    if (line.trim() === '') return <div key={i} className="h-1"/>;
    return <p key={i} className="text-xs text-slate-300 leading-relaxed">{line}</p>;
  });

  return (
    <div className="mt-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse"/>
          <span className="text-sm font-semibold text-purple-300">Analyse IA Claude Sonnet 4</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-1 max-h-72 overflow-y-auto">
          {renderLines(analysis)}
        </div>
      )}
    </div>
  );
};

// ─── Composant Document Card ──────────────────────────────────────────────────

const DocumentCard = ({
  doc, onDelete, onDownload, onPreview, onView, onAnalyze, onApply,
  isOpen, parseResult, analysis, analyzing, applying,
}: {
  doc: DocItem;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onPreview: (id: string) => void;
  onView: (id: string) => void;
  onAnalyze: (id: string) => void;
  onApply: (id: string) => void;
  isOpen: boolean;
  parseResult: ParseResult | null;
  analysis: string;
  analyzing: boolean;
  applying: boolean;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const canAnalyze = doc.status !== 'processing' && doc.status !== 'failed';
  const canApply = doc.status === 'parsed' || Boolean(parseResult?.analysis_summary || parseResult?.generated_score);

  return (
    <div className={`bg-slate-900/30 border rounded-2xl p-5 transition-all ${
      isOpen ? 'border-sky-500/40' : 'border-white/10 hover:border-sky-500/30'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <FileTypeIcon filename={doc.filename}/>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-white/5 rounded-lg transition text-slate-400">
            ⋮
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-20 min-w-[160px]" onClick={() => setShowMenu(false)}>
              <button onClick={() => onPreview(doc.id)} className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2">
                <Eye className="w-4 h-4"/> Visualiser
              </button>
              {doc.status === 'parsed' && (
                <>
                  <button onClick={() => onView(doc.id)} className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2">
                    <Eye className="w-4 h-4"/> Voir résultats
                  </button>
                </>
              )}
              {canAnalyze && (
                <>
                  <button onClick={() => onAnalyze(doc.id)} className="w-full px-3 py-2 text-left text-sm text-purple-400 hover:bg-purple-500/10 flex items-center gap-2">
                    <Sparkles className="w-4 h-4"/> Analyser IA
                  </button>
                </>
              )}
              {canApply && (
                <>
                  <button onClick={() => onApply(doc.id)} className="w-full px-3 py-2 text-left text-sm text-violet-400 hover:bg-violet-500/10 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4"/> Appliquer au score
                  </button>
                </>
              )}
              <button onClick={() => onDownload(doc.id)} className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2">
                <Download className="w-4 h-4"/> Télécharger
              </button>
              <button onClick={() => onDelete(doc.id)} className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                <Trash2 className="w-4 h-4"/> Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nom & Status */}
      <h3 className="font-semibold text-white mb-2 truncate text-sm" title={doc.filename}>{doc.filename}</h3>
      {doc.doc_type && (
        <div className="mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300 border border-white/10">
            {USER_DOC_TYPES.find(option => option.value === doc.doc_type)?.label || doc.doc_type}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">{doc.size_mb} MB</span>
        <StatusBadge status={doc.status} count={doc.transactions_count || undefined}/>
      </div>
      <div className="text-xs text-slate-600 mb-3">
        {new Date(doc.uploaded_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>

      {/* Résultats si ouvert */}
      {isOpen && parseResult && (
        <ParseResultsPanel
          result={parseResult} docId={doc.id}
          onAnalyze={onAnalyze} onApply={onApply}
          analyzing={analyzing} applying={applying}
        />
      )}
      {analysis && isOpen && <AIAnalysisPanel analysis={analysis}/>}

      {/* Bouton voir si parsé et pas ouvert */}
      {doc.status === 'parsed' && !isOpen && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button onClick={() => onPreview(doc.id)}
            className="px-3 py-2 bg-slate-800/70 hover:bg-slate-800 border border-white/10 text-slate-200 text-xs rounded-lg transition flex items-center justify-center gap-2">
            <Eye className="w-3.5 h-3.5"/> Visualiser
          </button>
          <button onClick={() => onView(doc.id)}
            className="px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 text-xs rounded-lg transition flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5"/> Voir les résultats
          </button>
        </div>
      )}

      {doc.status !== 'parsed' && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button onClick={() => onPreview(doc.id)}
            className="px-3 py-2 bg-slate-800/70 hover:bg-slate-800 border border-white/10 text-slate-200 text-xs rounded-lg transition flex items-center justify-center gap-2">
            <Eye className="w-3.5 h-3.5"/> Visualiser
          </button>
          <button onClick={() => onAnalyze(doc.id)} disabled={!canAnalyze || analyzing}
            className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 disabled:opacity-50 text-purple-300 text-xs rounded-lg transition flex items-center justify-center gap-2">
            {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5"/>}
            {analyzing ? 'Analyse...' : 'Analyser IA'}
          </button>
        </div>
      )}

      {/* Uploading */}
      {doc.status === 'processing' && (
        <div className="flex items-center gap-2 mt-2 text-xs text-amber-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin"/> Parsing en cours...
        </div>
      )}
      {doc.status === 'uploaded' && (
        <div className="flex items-center gap-2 mt-2 text-xs text-sky-400">
          <CheckCircle className="w-3.5 h-3.5"/>
          {doc.doc_type === 'proof_asset'
            ? "Document enregistré. Lancez l'analyse pour extraire les actifs et garanties."
            : 'Document enregistré. Vous pouvez lancer une analyse structurée.'}
        </div>
      )}
    </div>
  );
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export default function UserDocuments() {
  const [documents, setDocuments]         = useState<DocItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const [isDragging, setIsDragging]       = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ id: string; name: string; progress: number; status: string }[]>([]);
  const [docType, setDocType]             = useState('other');
  const [viewMode, setViewMode]           = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery]     = useState('');
  const [error, setError]                 = useState('');
  const [successMsg, setSuccessMsg]       = useState('');

  const [openDocId, setOpenDocId]         = useState<string | null>(null);
  const [previewDocId, setPreviewDocId]   = useState<string | null>(null);
  const [parseResults, setParseResults]   = useState<Record<string, ParseResult>>({});
  const [analyses, setAnalyses]           = useState<Record<string, string>>({});
  const [analyzingId, setAnalyzingId]     = useState<string | null>(null);
  const [applyingId, setApplyingId]       = useState<string | null>(null);
  const [loadingId, setLoadingId]         = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Chargement ──────────────────────────────────────────────────────────────
  const loadDocuments = useCallback(async () => {
    try {
      const res  = await authFetch('/api/scoring/user/documents/list/');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      setError('Erreur chargement documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  // Polling processing
  useEffect(() => {
    const processing = documents.filter(d => d.status === 'processing');
    if (!processing.length) return;
    const interval = setInterval(() => loadDocuments(), 3000);
    return () => clearInterval(interval);
  }, [documents, loadDocuments]);

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleUpload = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file   = files[i];
      const pid    = `${file.name}-${Date.now()}`;
      if (file.size > 15 * 1024 * 1024) { setError(`${file.name} trop volumineux (max 15 MB).`); continue; }

      setUploadProgress(prev => [...prev, { id: pid, name: file.name, progress: 0, status: 'uploading' }]);

      const fd = new FormData();
      fd.append('file', file);
      fd.append('doc_type', docType);

      const ticker = setInterval(() => {
        setUploadProgress(prev => prev.map(p => p.id === pid ? { ...p, progress: Math.min(p.progress + 8, 85) } : p));
      }, 250);

      try {
        const res  = await authFetch('/api/scoring/user/documents/upload/', { method: 'POST', body: fd });
        const data = await res.json();
        clearInterval(ticker);

        if (!res.ok) {
          setUploadProgress(prev => prev.map(p => p.id === pid ? { ...p, status: 'error', progress: 100 } : p));
          setError(data.error || `Erreur upload : ${file.name}`);
          continue;
        }

        const progressStatus = data.status === 'failed' ? 'error' : 'complete';
        setUploadProgress(prev => prev.map(p => p.id === pid ? { ...p, progress: 100, status: progressStatus } : p));

        if (data.status === 'parsed') {
          setSuccessMsg(data.transactions_count > 0
            ? `✅ ${data.transactions_count} transactions extraites de "${file.name}"`
            : '✅ Document enregistré et analysé.');
        } else if (data.status === 'processing') {
          setSuccessMsg(data.message || '📤 Document enregistré, analyse en cours...');
        } else if (data.status === 'uploaded') {
          setSuccessMsg(data.message || '✅ Document enregistré. Analyse structurée non applicable à ce type de pièce.');
        } else {
          setError(data.message || data.error || `Analyse impossible pour "${file.name}"`);
        }
        setTimeout(() => setSuccessMsg(''), 5000);
        await loadDocuments();
      } catch {
        clearInterval(ticker);
        setUploadProgress(prev => prev.map(p => p.id === pid ? { ...p, status: 'error' } : p));
        setError(`Erreur upload : ${file.name}`);
      } finally {
        setTimeout(() => setUploadProgress(prev => prev.filter(p => p.id !== pid)), 4000);
      }
    }
  };

  // ── View (charger détails) ──────────────────────────────────────────────────
  const handleView = async (id: string) => {
    if (openDocId === id) { setOpenDocId(null); return; }
    setOpenDocId(id);
    if (parseResults[id]) return;
    setLoadingId(id);
    try {
      const res  = await authFetch(`/api/scoring/user/documents/${id}/?include_transactions=1`);
      const data = await res.json();
      setParseResults(prev => ({ ...prev, [id]: data }));
      if (data.analysis_text) setAnalyses(prev => ({ ...prev, [id]: data.analysis_text }));
    } catch { setError('Erreur chargement détails.'); }
    finally { setLoadingId(null); }
  };

  // ── Analyse IA ──────────────────────────────────────────────────────────────
  const handleAnalyze = async (id: string) => {
    setAnalyzingId(id);
    if (openDocId !== id) setOpenDocId(id);
    try {
      const res  = await authFetch(`/api/scoring/user/documents/${id}/analyze/`, { method: 'POST' });
      const data = await res.json();
      if (data.analysis) setAnalyses(prev => ({ ...prev, [id]: data.analysis }));
      if (data.analysis_summary) {
        setParseResults(prev => ({
          ...prev,
          [id]: {
            ...((prev[id] || {}) as ParseResult),
            analysis_summary: data.analysis_summary,
            processed_at: data.analyzed_at,
          },
        }));
      } else if (!data.analysis) {
        setError(data.error || 'Analyse IA indisponible.');
      }
      await loadDocuments();
    } catch { setError('Erreur analyse IA.'); }
    finally { setAnalyzingId(null); }
  };

  // ── Appliquer au score ──────────────────────────────────────────────────────
  const handleApply = async (id: string) => {
    setApplyingId(id);
    try {
      const res  = await authFetch(`/api/scoring/user/documents/${id}/apply/`, { method: 'POST' });
      const data = await res.json();
      if (data.score) {
        setParseResults(prev => ({
          ...prev,
          [id]: {
            ...(prev[id] || {} as ParseResult),
            generated_score: {
              id: data.score.id,
              score: data.score.value,
              level: data.score.level,
              breakdown: data.score.breakdown || {},
            },
          },
        }));
      }
      const scoreMsg = data.score?.value ? ` Nouveau score : ${data.score.value}/1000.` : '';
      setSuccessMsg(`${data.message || '✅ Signaux appliqués à votre score TERAS.'}${scoreMsg}`);
      setTimeout(() => setSuccessMsg(''), 6000);
      await loadDocuments();
    } catch { setError('Erreur application au score.'); }
    finally { setApplyingId(null); }
  };

  // ── Télécharger ─────────────────────────────────────────────────────────────
  const handleDownload = async (id: string) => {
    const doc = documents.find(d => d.id === id);
    const res = await authFetch(`/api/scoring/user/documents/${id}/download/`);
    if (!res.ok) { setError('Erreur téléchargement.'); return; }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = doc?.filename || `document-${id}`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Supprimer ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce document ? Les données extraites seront également supprimées.')) return;
    await authFetch(`/api/scoring/user/documents/${id}/delete/`, { method: 'DELETE' });
    if (openDocId === id) setOpenDocId(null);
    loadDocuments();
  };

  const handleDrop    = useCallback((files: FileList) => { setIsDragging(false); handleUpload(files); }, []);
  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const previewDoc = documents.find(d => d.id === previewDocId) || null;

  const filtered = documents.filter(d =>
    d.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-sky-400 animate-spin mx-auto mb-4"/>
          <p className="text-slate-400">Chargement des documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <FileText className="w-7 h-7 text-white"/>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Mes Documents</h1>
              <p className="text-slate-400">Upload, parsing automatique et analyse IA Claude Sonnet 4</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
            <div className="flex bg-slate-900/50 border border-white/10 rounded-lg p-1">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded transition ${viewMode === 'grid' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                <Grid className="w-4 h-4"/>
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded transition ${viewMode === 'list' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                <List className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0"/>
            <p className="text-emerald-300 text-sm">{successMsg}</p>
            <button onClick={() => setSuccessMsg('')} className="ml-auto"><X className="w-4 h-4 text-emerald-500"/></button>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0"/>
            <p className="text-red-300 text-sm">{error}</p>
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4 text-red-500"/></button>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="mb-5 space-y-2">
            {uploadProgress.map(p => (
              <div key={p.id} className="bg-slate-900/50 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <span className="text-white truncate flex-1 mr-3">{p.name}</span>
                  <span className="text-slate-400 shrink-0">
                    {p.status === 'complete' ? '✓' : p.status === 'error' ? '✗' : `${p.progress}%`}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${
                    p.status === 'complete' ? 'bg-green-500'
                    : p.status === 'error'  ? 'bg-red-500'
                    : 'bg-gradient-to-r from-sky-500 to-blue-600'
                  }`} style={{ width: `${p.progress}%` }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4 max-w-sm">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Type de document à uploader</label>
          <select
            value={docType}
            onChange={e => setDocType(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"
          >
            {USER_DOC_TYPES.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={e => { e.preventDefault(); handleDrop(e.dataTransfer.files); }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all mb-6 ${
            isDragging
              ? 'border-sky-500 bg-sky-500/10 scale-[1.01]'
              : 'border-white/10 hover:border-white/20 bg-slate-900/30'
          }`}
        >
          <input ref={fileRef} type="file" multiple
            accept=".pdf,.xlsx,.xls,.csv,.ofx,.qif,.sta,.mt940,.jpg,.jpeg,.png"
            onChange={e => e.target.files && handleUpload(e.target.files)}
            className="hidden"/>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30 flex items-center justify-center">
            <Upload className="w-8 h-8 text-sky-400"/>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {isDragging ? 'Déposez vos fichiers ici' : 'Glissez-déposez vos documents'}
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            ou{' '}
            <button onClick={() => fileRef.current?.click()} className="text-sky-400 hover:text-sky-300 underline font-semibold">
              parcourez
            </button>
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {['PDF', 'Excel', 'CSV', 'OFX', 'MT940', 'Images'].map(f => (
              <span key={f} className="px-2.5 py-1 bg-slate-800/60 border border-white/10 rounded-full text-xs text-slate-400">{f}</span>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Sparkles className="w-4 h-4 text-purple-400"/>
            <span>Parsing automatique · Analyse IA Claude Sonnet 4 · Max 15 MB</span>
          </div>
        </div>

        {/* Recherche */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input type="text" placeholder="Rechercher un document..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"/>
        </div>

        {/* Documents */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 border border-white/10 rounded-2xl">
            <FileText className="w-14 h-14 text-slate-600 mx-auto mb-4"/>
            <h3 className="text-xl font-semibold text-white mb-2">Aucun document</h3>
            <p className="text-slate-400 text-sm">
              {searchQuery ? 'Aucun document ne correspond à votre recherche'
                : 'Ajoutez vos documents financiers, pièces d’identité et preuves d’actifs pour enrichir votre score TERAS'}
            </p>
          </div>
        ) : (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
            {filtered.map(doc => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onDelete={handleDelete}
                onDownload={handleDownload}
                onPreview={setPreviewDocId}
                onView={handleView}
                onAnalyze={handleAnalyze}
                onApply={handleApply}
                isOpen={openDocId === doc.id}
                parseResult={parseResults[doc.id] || null}
                analysis={analyses[doc.id] || ''}
                analyzing={analyzingId === doc.id}
                applying={applyingId === doc.id}
              />
            ))}
          </div>
        )}
      </div>

      <DocumentPreviewModal
        isOpen={!!previewDoc}
        title={previewDoc ? `Document utilisateur — ${previewDoc.filename}` : ''}
        fileName={previewDoc?.filename || ''}
        sourceUrl={previewDoc ? `/api/scoring/user/documents/${previewDoc.id}/download/` : ''}
        mode="auth-fetch"
        onClose={() => setPreviewDocId(null)}
        onDownload={() => {
          if (previewDoc) handleDownload(previewDoc.id);
        }}
      />
    </div>
  );
}
