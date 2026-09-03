// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Brain,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Eye,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import DocumentPreviewModal from '../../components/shared/DocumentPreviewModal';

interface EnterpriseDoc {
  id: number;
  category: string;
  category_display: string;
  title: string;
  file: string;
  file_url: string | null;
  file_size: number | null;
  period?: string;
  status: 'pending' | 'processing' | 'validated' | 'rejected';
  status_display: string;
  uploaded_at: string;
  processed_at?: string | null;
  analysis_summary?: {
    document_role?: string;
    document_role_label?: string;
    analysis_text?: string;
    strengths?: string[];
    risks?: string[];
    recommended_actions?: string[];
    applied_to_teras?: boolean;
    applied_at?: string;
    extracted_metrics?: {
      monthly_revenue_xaf?: number;
      monthly_cashflow_xaf?: number;
      crm_estimated_xaf?: number;
      transactions_count?: number;
      asset_value_xaf?: number;
      asset_items_count?: number;
      invoice_amount_xaf?: number;
      invoice_count?: number;
      collateral_value_xaf?: number;
    };
    score_impact?: {
      estimated_change?: number;
      pillar_hints?: Record<string, number>;
    };
    dashboard_updates?: {
      avg_monthly_revenue_xaf?: number;
      avg_monthly_cashflow_xaf?: number;
      documents_analyzed?: number;
    };
    document_signals?: {
      document_role?: string;
      document_role_label?: string;
      asset_proof_types?: string[];
      proof_modes?: string[];
      collateral_eligible?: boolean;
    };
  } | null;
}

const CATEGORY_OPTIONS = [
  { value: 'tax_filing', label: 'Déclaration fiscale' },
  { value: 'balance_sheet', label: 'Bilan comptable' },
  { value: 'invoice', label: 'Facture' },
  { value: 'payroll', label: 'Fiche de paie' },
  { value: 'bank_statement', label: 'Relevé bancaire' },
  { value: 'contract', label: 'Contrat' },
  { value: 'other', label: 'Autre / actif / titre' },
];

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  processing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  validated: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const formatBytes = (value?: number | null) => {
  if (!value) return '0 KB';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
};

const normalizeListPayload = (data: any): EnterpriseDoc[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.documents)) return data.documents;
  return [];
};

export default function EnterpriseDocuments() {
  const [documents, setDocuments] = useState<EnterpriseDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [category, setCategory] = useState('bank_statement');
  const [period, setPeriod] = useState('');
  const [title, setTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAnalysis, setFilterAnalysis] = useState('all');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [previewDocId, setPreviewDocId] = useState<number | null>(null);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [expandedAnalysisIds, setExpandedAnalysisIds] = useState<number[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const res = await authFetch('/api/scoring/enterprise/documents/');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setDocuments(normalizeListPayload(data));
    } catch (err: any) {
      setError(err?.message || 'Erreur chargement documents entreprise.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;

    setUploading(true);
    setError('');
    let uploadedCount = 0;

    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append('file', file);
        form.append('category', category);
        form.append('title', title.trim() || file.name.replace(/\.[^.]+$/, ''));
        if (period.trim()) form.append('period', period.trim());

        const res = await authFetch('/api/scoring/enterprise/documents/upload/', {
          method: 'POST',
          body: form,
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || `Erreur ${res.status}`);
        }
        uploadedCount += 1;
      }

      setSuccessMsg(
        uploadedCount > 1
          ? `✅ ${uploadedCount} documents entreprise enregistrés.`
          : '✅ Document entreprise enregistré.'
      );
      setTitle('');
      await loadDocuments();
    } catch (err: any) {
      setError(err?.message || 'Erreur upload document entreprise.');
    } finally {
      setUploading(false);
      setTimeout(() => setSuccessMsg(''), 5000);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDownload = (doc: EnterpriseDoc) => {
    if (!doc.file_url) {
      setError('Téléchargement indisponible pour ce document.');
      return;
    }
    window.open(doc.file_url, '_blank', 'noopener,noreferrer');
  };

  const handleAnalyze = async (doc: EnterpriseDoc) => {
    setAnalyzingId(doc.id);
    setError('');
    try {
      const res = await authFetch(`/api/scoring/enterprise/documents/${doc.id}/analyze/`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setSuccessMsg(data.message || `✅ Analyse prête pour ${doc.title}.`);
      setExpandedAnalysisIds(prev => (prev.includes(doc.id) ? prev : [doc.id, ...prev]));
      await loadDocuments();
    } catch (err: any) {
      setError(err?.message || 'Erreur analyse document entreprise.');
    } finally {
      setAnalyzingId(null);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  const handleApply = async (doc: EnterpriseDoc) => {
    setApplyingId(doc.id);
    setError('');
    try {
      const res = await authFetch(`/api/scoring/enterprise/documents/${doc.id}/apply/`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      const scoreValue = data.score?.value ? ` Score: ${data.score.value}/1000.` : '';
      setSuccessMsg(`${data.message || '✅ Analyse appliquée au moteur TERAS.'}${scoreValue}`);
      setExpandedAnalysisIds(prev => (prev.includes(doc.id) ? prev : [doc.id, ...prev]));
      await loadDocuments();
    } catch (err: any) {
      setError(err?.message || 'Erreur application au moteur TERAS.');
    } finally {
      setApplyingId(null);
      setTimeout(() => setSuccessMsg(''), 6000);
    }
  };

  const filtered = documents.filter(doc => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.period || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category_display.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const matchesAnalysis =
      filterAnalysis === 'all' ||
      (filterAnalysis === 'not_analyzed' && !doc.analysis_summary) ||
      (filterAnalysis === 'analyzed' && !!doc.analysis_summary) ||
      (filterAnalysis === 'applied' && !!doc.analysis_summary?.applied_to_teras);
    return matchesSearch && matchesCategory && matchesStatus && matchesAnalysis;
  });

  const toggleAnalysis = (docId: number) => {
    setExpandedAnalysisIds(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [docId, ...prev]
    );
  };

  const validatedCount = documents.filter(doc => doc.status === 'validated').length;
  const processingCount = documents.filter(doc => doc.status === 'processing').length;
  const analyzedCount = documents.filter(doc => !!doc.analysis_summary).length;
  const appliedCount = documents.filter(doc => !!doc.analysis_summary?.applied_to_teras).length;
  const previewDoc = documents.find(doc => doc.id === previewDocId) || null;

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">TERAS Entreprise</p>
          <h1 className="text-3xl font-black">Documents Entreprise</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Déposez vos pièces métier réelles. Cette interface enregistre et suit les documents entreprise sans forcer le pipeline bancaire.
          </p>
        </div>

        {successMsg && (
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-900/30 border border-emerald-700/40 rounded-xl">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-emerald-300 text-sm">{successMsg}</p>
            <button onClick={() => setSuccessMsg('')} className="ml-auto">
              <X className="w-4 h-4 text-emerald-500" />
            </button>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-rose-900/20 border border-rose-700/40 rounded-xl">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="text-rose-300 text-sm">{error}</p>
            <button onClick={() => setError('')} className="ml-auto">
              <X className="w-4 h-4 text-rose-500" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { label: 'Total docs', value: documents.length, color: 'text-sky-400' },
            { label: 'Validés', value: validatedCount, color: 'text-emerald-400' },
            { label: 'Analysés IA', value: analyzedCount, color: 'text-violet-400' },
            { label: 'Appliqués TERAS', value: appliedCount, color: 'text-cyan-400' },
            { label: 'En traitement', value: processingCount, color: 'text-amber-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-slate-500 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Catégorie</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                {CATEGORY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Titre personnalisé</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Bilan T1 2026"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Période</label>
              <input
                value={period}
                onChange={e => setPeriod(e.target.value)}
                placeholder="Ex: 2026-Q1"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-600"
              />
            </div>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files); }}
            onClick={() => !uploading && fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
              isDragging ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={e => handleUpload(e.target.files)}
            />
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-cyan-400">
                <Loader2 className="w-5 h-5 animate-spin" /> Upload en cours...
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
                <p className="text-white text-sm font-medium">Glissez-déposez ou cliquez pour uploader</p>
                <p className="text-slate-500 text-xs">PDF · Excel · CSV · DOC/DOCX · Images</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 text-sm text-sky-200">
          Les documents entreprise sont stockés sans coût IA automatique. L’analyse ne part que quand vous cliquez sur <span className="font-semibold">Analyser avec IA</span>, puis <span className="font-semibold">Appliquer au moteur TERAS</span> envoie les signaux utiles vers le score et le dashboard, y compris les <span className="font-semibold">biens déclarés</span>, les <span className="font-semibold">titres</span> et les <span className="font-semibold">factures</span>.
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher un document..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-600"
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Toutes catégories</option>
            {CATEGORY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Tous statuts</option>
            <option value="pending">En attente</option>
            <option value="processing">En traitement</option>
            <option value="validated">Validé</option>
            <option value="rejected">Rejeté</option>
          </select>
          <select
            value={filterAnalysis}
            onChange={e => setFilterAnalysis(e.target.value)}
            className="px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Toutes analyses</option>
            <option value="not_analyzed">À analyser</option>
            <option value="analyzed">Analysés</option>
            <option value="applied">Appliqués TERAS</option>
          </select>
          {analyzedCount > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpandedAnalysisIds([])}
                className="px-3 py-2.5 bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition text-sm whitespace-nowrap"
              >
                Réduire
              </button>
              <button
                onClick={() => setExpandedAnalysisIds(filtered.filter(doc => doc.analysis_summary).map(doc => doc.id))}
                className="px-3 py-2.5 bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition text-sm whitespace-nowrap"
              >
                Déployer
              </button>
            </div>
          )}
          <button
            onClick={loadDocuments}
            className="p-2.5 bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin mr-2" />
            <span className="text-slate-400">Chargement...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Aucun document entreprise</p>
            <p className="text-slate-600 text-sm mt-1">Ajoute un bilan, une facture, un contrat ou un relevé bancaire.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(doc => {
              const metrics = doc.analysis_summary?.extracted_metrics || {};
              const signals = doc.analysis_summary?.document_signals || {};
              const roleLabel = doc.analysis_summary?.document_role_label || signals.document_role_label;
              const metricCards = [
                ...(metrics.monthly_revenue_xaf
                  ? [{
                      label: 'Revenu mensuel détecté',
                      value: `${Math.round(metrics.monthly_revenue_xaf || 0).toLocaleString('fr-FR')} FCFA`,
                      className: 'text-emerald-300',
                    }]
                  : []),
                ...((metrics.monthly_cashflow_xaf || doc.category === 'bank_statement')
                  ? [{
                      label: 'Cashflow mensuel',
                      value: `${Math.round(metrics.monthly_cashflow_xaf || 0).toLocaleString('fr-FR')} FCFA`,
                      className: 'text-cyan-300',
                    }]
                  : []),
                ...(metrics.asset_value_xaf
                  ? [{
                      label: "Valeur d'actifs détectée",
                      value: `${Math.round(metrics.asset_value_xaf || 0).toLocaleString('fr-FR')} FCFA`,
                      className: 'text-amber-300',
                    }]
                  : []),
                ...(metrics.invoice_amount_xaf
                  ? [{
                      label: 'Montant facture détecté',
                      value: `${Math.round(metrics.invoice_amount_xaf || 0).toLocaleString('fr-FR')} FCFA`,
                      className: 'text-blue-300',
                    }]
                  : []),
                {
                  label: 'Impact estimé',
                  value: `+${doc.analysis_summary?.score_impact?.estimated_change || 0} pts`,
                  className: 'text-violet-300',
                },
              ];
              const isAnalysisOpen = expandedAnalysisIds.includes(doc.id);
              const visibleMetricCards = isAnalysisOpen ? metricCards : metricCards.slice(0, 3);

              return (
              <div key={doc.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    {doc.file?.endsWith('.xlsx') || doc.file?.endsWith('.xls') || doc.file?.endsWith('.csv')
                      ? <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                      : <FileText className="w-5 h-5 text-cyan-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-sm font-semibold truncate">{doc.title}</p>
                      <span className="px-2 py-0.5 rounded-lg text-[11px] bg-slate-800 text-slate-300 border border-white/10">
                        {doc.category_display}
                      </span>
                      {roleLabel && (
                        <span className="px-2 py-0.5 rounded-lg text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {roleLabel}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-lg text-[11px] border ${STATUS_CLASSES[doc.status] || STATUS_CLASSES.pending}`}>
                        {doc.status_display}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                      <span>{formatBytes(doc.file_size)}</span>
                      {doc.period && <span>Période: {doc.period}</span>}
                      <span>{new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAnalyze(doc)}
                      disabled={analyzingId === doc.id}
                      className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 hover:bg-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed border border-violet-500/20 rounded-xl text-violet-300 text-sm transition"
                    >
                      {analyzingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                      Analyser
                    </button>
                    <button
                      onClick={() => handleApply(doc)}
                      disabled={!doc.analysis_summary || applyingId === doc.id}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-500/20 rounded-xl text-emerald-300 text-sm transition"
                    >
                      {applyingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                      Appliquer
                    </button>
                    <button
                      onClick={() => setPreviewDocId(doc.id)}
                      disabled={!doc.file_url}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-xl text-slate-200 text-sm transition"
                    >
                      <Eye className="w-4 h-4" /> Visualiser
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl text-cyan-400 text-sm transition"
                    >
                      <Download className="w-4 h-4" /> Télécharger
                    </button>
                  </div>
                </div>

                {doc.analysis_summary && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-1 rounded-lg text-[11px] bg-violet-500/10 text-violet-300 border border-violet-500/20">
                          Analyse prête
                        </span>
                        {doc.analysis_summary.applied_to_teras && (
                          <span className="px-2 py-1 rounded-lg text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            Appliqué au moteur TERAS
                          </span>
                        )}
                        {doc.processed_at && (
                          <span className="text-[11px] text-slate-500">
                            Traité le {new Date(doc.processed_at).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleAnalysis(doc.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/40 transition text-xs"
                      >
                        {isAnalysisOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {isAnalysisOpen ? 'Réduire' : 'Voir détails'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {visibleMetricCards.map(card => (
                        <div key={`${doc.id}-${card.label}`} className="bg-slate-900/70 border border-white/5 rounded-xl p-3">
                          <p className="text-slate-500 text-[11px] mb-1">{card.label}</p>
                          <p className={`${card.className} text-sm font-semibold`}>
                            {card.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {isAnalysisOpen && (
                      <>
                    {((metrics.asset_items_count || 0) > 0 || (metrics.collateral_value_xaf || 0) > 0 || (signals.asset_proof_types || []).length > 0) && (
                      <div className="rounded-xl bg-slate-900/70 border border-white/5 p-3 space-y-2">
                        <p className="text-slate-500 text-[11px] uppercase tracking-wider">Lecture actifs</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <p className="text-slate-200">Actifs recensés : <span className="font-semibold text-white">{metrics.asset_items_count || 0}</span></p>
                          <p className="text-slate-200">Garantie mobilisable : <span className="font-semibold text-white">{`${Math.round(metrics.collateral_value_xaf || 0).toLocaleString('fr-FR')} FCFA`}</span></p>
                          <p className="text-slate-200">Preuve forte : <span className="font-semibold text-white">{signals.collateral_eligible ? 'Oui' : 'À confirmer'}</span></p>
                        </div>
                        {(signals.asset_proof_types || []).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {(signals.asset_proof_types || []).map((proofType) => (
                              <span key={`${doc.id}-${proofType}`} className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px]">
                                {proofType}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {metrics.invoice_amount_xaf ? (
                      <div className="rounded-xl bg-slate-900/70 border border-white/5 p-3">
                        <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-2">Lecture facturation</p>
                        <p className="text-sm text-slate-200">
                          Cette pièce documente au moins <span className="font-semibold text-white">{`${Math.round(metrics.invoice_amount_xaf || 0).toLocaleString('fr-FR')} FCFA`}</span> de chiffre d’affaires brut sur la facture analysée.
                        </p>
                      </div>
                    ) : null}

                    {doc.analysis_summary.analysis_text && (
                      <div className="rounded-xl bg-slate-900/70 border border-white/5 p-3">
                        <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-2">Synthèse IA</p>
                        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                          {doc.analysis_summary.analysis_text}
                        </p>
                      </div>
                    )}

                    {(doc.analysis_summary.recommended_actions || []).length > 0 && (
                      <div className="space-y-1">
                        <p className="text-slate-500 text-[11px] uppercase tracking-wider">Actions recommandées</p>
                        {(doc.analysis_summary.recommended_actions || []).slice(0, 3).map((action, index) => (
                          <div key={`${doc.id}-action-${index}`} className="text-sm text-slate-300 flex gap-2">
                            <span className="text-cyan-400 shrink-0">•</span>
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )})}
          </div>
        )}
      </div>

      <DocumentPreviewModal
        isOpen={!!previewDoc}
        title={previewDoc ? `Document entreprise — ${previewDoc.title}` : ''}
        fileName={previewDoc?.file ? previewDoc.file.split('/').pop() || previewDoc.title : previewDoc?.title || ''}
        sourceUrl={previewDoc?.file_url || ''}
        mode="direct-url"
        onClose={() => setPreviewDocId(null)}
        onDownload={() => {
          if (previewDoc) handleDownload(previewDoc);
        }}
      />
    </div>
  );
}
