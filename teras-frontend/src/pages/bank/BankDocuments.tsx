// src/pages/bank/BankDocuments.tsx
// Interface documents banque — Upload, analyse risque crédit IA

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, FileText, Download, Trash2, Brain, CheckCircle,
  AlertCircle, Loader2, ChevronDown, ChevronUp, RefreshCw,
  TrendingUp, Wallet, BarChart3, Shield, X, Eye, Users,
  Search, Filter, FileSpreadsheet, Sparkles, CreditCard,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import DocumentPreviewModal from '../../components/shared/DocumentPreviewModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocItem {
  id: string;
  filename: string;
  client_id: string | null;
  size_mb: number;
  format: string;
  status: 'uploaded' | 'processing' | 'parsed' | 'failed';
  uploaded_at: string;
  doc_type: string;
  transactions_count: number;
  authenticity_score: number;
  crm_estimated: number;
  months_covered: number;
}

interface ParseResult {
  transactions_count: number;
  authenticity_score: number;
  quality_stats: {
    total_credits_xaf: number;
    total_debits_xaf: number;
    net_cashflow_xaf: number;
    months_covered: number;
  };
  teras_signals: {
    crm_estimated_xaf: number;
    net_income_monthly_xaf: number;
    income_signal: { monthly_avg_xaf: number; income_stability: number };
  };
  recommendations: { type: string; message: string }[];
  transactions?: { date: string; description: string; amount: number; type: 'credit' | 'debit' }[];
}

interface CreditAnalysis {
  analysis: string;
  risk_signals: {
    crm: number;
    income_stability: number;
    cashflow_net: number;
    anomalies: number;
    authenticity: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FCFA = (n: number) => {
  if (!n || isNaN(n)) return '0 FCFA';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M FCFA`;
  return `${Math.round(n).toLocaleString('fr-FR')} FCFA`;
};

const DOC_TYPES = [
  { value: 'bank_document',     label: 'Document interne',    icon: '📋' },
  { value: 'client_statement',  label: 'Relevé client',        icon: '📄' },
  { value: 'loan_agreement',    label: 'Contrat crédit',       icon: '📝' },
  { value: 'credit_analysis',   label: 'Analyse crédit',       icon: '📊' },
  { value: 'kyc_document',      label: 'Document KYC',         icon: '🪪' },
  { value: 'other',             label: 'Autre',                icon: '📁' },
];

const ACCEPTED_UPLOAD_STATUSES = new Set(['parsed', 'processing', 'uploaded']);

const getUploadFeedback = (status: string, fileName: string, transactionsCount = 0, message = '') => {
  if (status === 'parsed') {
    return transactionsCount > 0
      ? `✅ ${transactionsCount} lignes extraites de "${fileName}"`
      : '✅ Document enregistré et analysé.';
  }
  if (status === 'processing') {
    return message || '📤 Document enregistré, analyse en cours...';
  }
  if (status === 'uploaded') {
    return message || '✅ Document enregistré. Analyse structurée non applicable à ce type de pièce.';
  }
  return message || 'Document enregistré.';
};

const FORMAT_ICONS: Record<string, string> = {
  pdf: '📄', excel: '📊', csv: '📋', ofx: '🏦', mt940: '🏦',
};

const getRiskColor = (stability: number) => {
  if (stability >= 0.8) return 'text-emerald-400';
  if (stability >= 0.5) return 'text-amber-400';
  return 'text-rose-400';
};

const getRiskLabel = (stability: number) => {
  if (stability >= 0.8) return 'Faible risque';
  if (stability >= 0.5) return 'Risque modéré';
  return 'Risque élevé';
};

// ─── Composant principal ──────────────────────────────────────────────────────

export default function BankDocuments() {
  const [documents, setDocuments]         = useState<DocItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const [uploading, setUploading]         = useState(false);
  const [dragOver, setDragOver]           = useState(false);
  const [docType, setDocType]             = useState('client_statement');
  const [clientId, setClientId]           = useState('');
  const [filterClient, setFilterClient]   = useState('');
  const [filterType, setFilterType]       = useState('all');
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedDoc, setSelectedDoc]     = useState<string | null>(null);
  const [previewDocId, setPreviewDocId]   = useState<string | null>(null);
  const [parseResult, setParseResult]     = useState<ParseResult | null>(null);
  const [creditAnalysis, setCreditAnalysis] = useState<CreditAnalysis | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);
  const [analyzingDoc, setAnalyzingDoc]   = useState<string | null>(null);
  const [showTxns, setShowTxns]           = useState(false);
  const [error, setError]                 = useState('');
  const [successMsg, setSuccessMsg]       = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const url = filterClient
        ? `/api/scoring/bank/documents/list/?client_id=${filterClient}`
        : '/api/scoring/bank/documents/list/';
      const res  = await authFetch(url);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch { setError('Erreur chargement documents.'); }
    finally { setLoading(false); }
  }, [filterClient]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // Polling processing
  useEffect(() => {
    const processing = documents.filter(d => d.status === 'processing');
    if (!processing.length) return;
    const interval = setInterval(() => fetchDocs(), 3000);
    return () => clearInterval(interval);
  }, [documents, fetchDocs]);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    if (file.size > 20 * 1024 * 1024) { setError('Fichier trop volumineux (max 20 MB).'); return; }
    setUploading(true); setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('doc_type', docType);
    if (clientId) fd.append('client_id', clientId);
    try {
      const res  = await authFetch('/api/scoring/bank/documents/upload/', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur upload document.');
        return;
      }
      if (ACCEPTED_UPLOAD_STATUSES.has(data.status)) {
        setSuccessMsg(getUploadFeedback(data.status, file.name, data.transactions_count, data.message));
        setTimeout(() => setSuccessMsg(''), 5000);
        fetchDocs();
      } else {
        setError(data.message || data.error || 'Document enregistré mais analyse impossible.');
        fetchDocs();
      }
    } catch { setError('Erreur upload.'); }
    finally { setUploading(false); }
  };

  const loadDetail = async (docId: string) => {
    if (selectedDoc === docId) { setSelectedDoc(null); setParseResult(null); setCreditAnalysis(null); return; }
    setSelectedDoc(docId); setLoadingResult(true); setShowTxns(false); setCreditAnalysis(null);
    try {
      const res  = await authFetch(`/api/scoring/bank/documents/${docId}/?include_transactions=1`);
      const data = await res.json();
      setParseResult(data);
    } catch { setError('Erreur chargement détails.'); }
    finally { setLoadingResult(false); }
  };

  const analyzeCredit = async (docId: string) => {
    setAnalyzingDoc(docId); setError(''); setCreditAnalysis(null);
    if (selectedDoc !== docId) { setSelectedDoc(docId); }
    try {
      const res  = await authFetch(`/api/scoring/bank/documents/${docId}/analyze-credit/`, { method: 'POST' });
      const data = await res.json();
      if (data.analysis) setCreditAnalysis(data);
      else setError(data.error || 'Analyse IA indisponible.');
    } catch { setError('Erreur analyse crédit IA.'); }
    finally { setAnalyzingDoc(null); }
  };

  const handleDownload = async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    const res = await authFetch(`/api/scoring/bank/documents/${docId}/download/`);
    if (!res.ok) { setError('Erreur téléchargement.'); return; }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = doc?.filename || docId;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Supprimer ce document ?')) return;
    await authFetch(`/api/scoring/bank/documents/${docId}/delete/`, { method: 'DELETE' });
    if (selectedDoc === docId) { setSelectedDoc(null); setParseResult(null); }
    fetchDocs();
  };

  const filtered = documents.filter(d => {
    const q = d.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const t = filterType === 'all' || d.doc_type === filterType;
    return q && t;
  });

  const renderAnalysis = (text: string) =>
    text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-bold text-sky-300 mt-3 mb-1">{line.slice(3)}</h3>;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-sm font-bold text-white mt-2">{line.replace(/\*\*/g,'')}</p>;
      if (line.match(/^[-•]\s/)) return <div key={i} className="flex gap-2 ml-2 mt-0.5 text-sm text-slate-300"><span className="text-sky-400 shrink-0">▸</span>{line.slice(2)}</div>;
      if (line.trim() === '') return <div key={i} className="h-1.5"/>;
      return <p key={i} className="text-sm text-slate-300 leading-relaxed">{line}</p>;
    });

  const previewDoc = documents.find(d => d.id === previewDocId) || null;

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-6">

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">TERAS Banque</p>
        <h1 className="text-3xl font-black text-white">Documents Clients</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Uploadez et analysez les documents financiers de vos clients — Analyse risque crédit par IA
        </p>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-900/30 border border-emerald-700/50 rounded-xl mb-4">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0"/>
          <p className="text-emerald-300 text-sm">{successMsg}</p>
          <button onClick={() => setSuccessMsg('')} className="ml-auto"><X className="w-4 h-4 text-emerald-500"/></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-rose-900/20 border border-rose-700/40 rounded-xl mb-4">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0"/>
          <p className="text-rose-300 text-sm">{error}</p>
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4 text-rose-500"/></button>
        </div>
      )}

      {/* Upload section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-6">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-400"/> Uploader un document client
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Type de document</label>
            <select value={docType} onChange={e => setDocType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500">
              {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">ID Client (optionnel)</label>
            <input value={clientId} onChange={e => setClientId(e.target.value)}
              placeholder="Ex: 1234"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-600"/>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
          onClick={() => !uploading && fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragOver ? 'border-emerald-400 bg-emerald-900/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
          }`}
        >
          <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls,.csv,.ofx,.qif,.sta,.mt940,.jpg,.jpeg,.png,.doc,.docx" className="hidden"
            onChange={e => handleUpload(e.target.files)}/>
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <Loader2 className="w-5 h-5 animate-spin"/> Upload et parsing en cours...
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-emerald-400 mx-auto"/>
              <p className="text-white text-sm font-medium">Glissez ou cliquez pour uploader</p>
              <p className="text-slate-500 text-xs">PDF · Excel · CSV · OFX/QIF/STA/MT940 · Images · DOC/DOCX · Max 20 MB</p>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-1">
                <Brain className="w-3.5 h-3.5 text-purple-400"/>
                Analyse risque crédit automatique par Claude Sonnet 4
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total docs',       value: documents.length,                                  color: 'text-sky-400' },
          { label: 'Analysés',         value: documents.filter(d => d.status === 'parsed').length, color: 'text-emerald-400' },
          { label: 'En traitement',    value: documents.filter(d => d.status === 'processing').length, color: 'text-amber-400' },
          { label: 'Clients distincts',value: new Set(documents.map(d => d.client_id).filter(Boolean)).size, color: 'text-violet-400' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher un document..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600"/>
        </div>
        <input value={filterClient} onChange={e => setFilterClient(e.target.value)}
          placeholder="Filtrer par client ID..."
          className="px-3 py-2.5 bg-slate-900/60 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600 w-48"/>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2.5 bg-slate-900/60 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:border-sky-500">
          <option value="all">Tous types</option>
          {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button onClick={fetchDocs} className="p-2.5 bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition">
          <RefreshCw className="w-4 h-4"/>
        </button>
      </div>

      {/* Liste documents */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-sky-400 animate-spin mr-2"/><span className="text-slate-400">Chargement...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <CreditCard className="w-12 h-12 text-slate-700 mx-auto mb-3"/>
          <p className="text-slate-500 font-medium">Aucun document</p>
          <p className="text-slate-600 text-sm mt-1">Uploadez des relevés clients pour l'analyse de risque crédit</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => {
            const isOpen = selectedDoc === doc.id;
            return (
              <div key={doc.id} className={`border rounded-2xl overflow-hidden bg-slate-900/60 transition-all ${
                isOpen ? 'border-emerald-500/40' : 'border-slate-800 hover:border-slate-700'
              }`}>
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <span className="text-xl shrink-0">{FORMAT_ICONS[doc.format] || '📁'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-sm font-medium truncate">{doc.filename}</p>
                      {doc.client_id && (
                        <span className="px-2 py-0.5 bg-sky-900/40 border border-sky-700/40 text-sky-400 text-xs rounded-lg">
                          Client #{doc.client_id}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className={`text-xs ${
                        doc.status === 'parsed' ? 'text-emerald-400'
                        : doc.status === 'processing' ? 'text-amber-400'
                        : doc.status === 'failed' ? 'text-rose-400' : 'text-sky-400'
                      }`}>
                        {doc.status === 'processing' ? '⏳ Traitement...'
                          : doc.status === 'parsed' ? `✅ ${doc.transactions_count} lignes`
                          : doc.status === 'failed' ? '❌ Analyse échouée' : '📁 Enregistré'}
                      </span>
                      <span className="text-slate-600 text-xs">{doc.size_mb} MB</span>
                      {doc.months_covered > 0 && <span className="text-slate-600 text-xs">{doc.months_covered} mois</span>}
                      <span className="text-slate-700 text-xs">{new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {doc.status === 'parsed' && (
                      <>
                        <button onClick={() => analyzeCredit(doc.id)} disabled={!!analyzingDoc}
                          title="Analyser risque crédit"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition">
                          {analyzingDoc === doc.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin"/>
                            : <Brain className="w-3.5 h-3.5"/>}
                          {analyzingDoc === doc.id ? '' : 'Risque crédit'}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setPreviewDocId(doc.id)}
                      title="Visualiser le document"
                      className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    >
                      <Eye className="w-4 h-4"/>
                    </button>
                    <button onClick={() => handleDownload(doc.id)} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition">
                      <Download className="w-4 h-4"/>
                    </button>
                    <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                    {doc.status === 'parsed' && (
                      <button onClick={() => loadDetail(doc.id)} className="p-1.5 text-slate-500 hover:text-white transition">
                        {isOpen ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                      </button>
                    )}
                  </div>
                </div>

                {/* Résultats */}
                {isOpen && (
                  <div className="border-t border-slate-800 px-4 py-4 space-y-4">
                    {loadingResult ? (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin"/> Chargement...
                      </div>
                    ) : parseResult && (
                      <>
                        {/* KPIs */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: 'Revenu mensuel', value: FCFA(parseResult.teras_signals?.income_signal?.monthly_avg_xaf || 0), color: 'emerald' },
                            { label: 'CRM estimé',     value: FCFA(parseResult.teras_signals?.crm_estimated_xaf || 0),              color: 'sky'     },
                            { label: 'Cashflow net',   value: FCFA(parseResult.quality_stats?.net_cashflow_xaf || 0),               color: 'violet'  },
                            { label: 'Authenticité',   value: `${Math.round((parseResult.authenticity_score || 0) * 100)}%`,        color: 'amber'   },
                          ].map((k, i) => (
                            <div key={i} className="bg-slate-800/60 rounded-xl p-3">
                              <p className="text-slate-500 text-xs mb-1">{k.label}</p>
                              <p className={`text-${k.color}-400 font-bold text-base`}>{k.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Stabilité revenus */}
                        {parseResult.teras_signals?.income_signal && (
                          <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/40 rounded-xl">
                            <Shield className="w-5 h-5 text-slate-400 shrink-0"/>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-xs">Stabilité des revenus</span>
                                <span className={`text-xs font-medium ${getRiskColor(parseResult.teras_signals.income_signal.income_stability || 0)}`}>
                                  {getRiskLabel(parseResult.teras_signals.income_signal.income_stability || 0)}
                                </span>
                              </div>
                              <div className="mt-1.5 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${
                                  (parseResult.teras_signals.income_signal.income_stability || 0) >= 0.8 ? 'bg-emerald-400'
                                  : (parseResult.teras_signals.income_signal.income_stability || 0) >= 0.5 ? 'bg-amber-400' : 'bg-rose-400'
                                }`} style={{ width: `${(parseResult.teras_signals.income_signal.income_stability || 0) * 100}%` }}/>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Transactions */}
                        {parseResult.transactions && parseResult.transactions.length > 0 && (
                          <div>
                            <button onClick={() => setShowTxns(!showTxns)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
                              {showTxns ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                              {showTxns ? 'Masquer' : 'Voir'} les {parseResult.transactions.length} transactions
                            </button>
                            {showTxns && (
                              <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-slate-800">
                                <table className="w-full text-xs">
                                  <thead className="bg-slate-800/80 sticky top-0">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-slate-400">Date</th>
                                      <th className="px-3 py-2 text-left text-slate-400">Description</th>
                                      <th className="px-3 py-2 text-right text-slate-400">Montant</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {parseResult.transactions.slice(0, 50).map((t, i) => (
                                      <tr key={i} className={`border-t border-slate-800/60 ${i % 2 ? 'bg-slate-900/30' : ''}`}>
                                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{t.date}</td>
                                        <td className="px-3 py-2 text-slate-300 max-w-[200px] truncate">{t.description}</td>
                                        <td className={`px-3 py-2 text-right font-medium ${t.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                          {t.type === 'credit' ? '+' : '-'}{t.amount.toLocaleString('fr-FR')}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Analyse crédit IA */}
                    {analyzingDoc === doc.id && !creditAnalysis && (
                      <div className="flex items-center gap-2 text-emerald-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin"/>
                        Claude Sonnet 4 analyse le risque crédit...
                      </div>
                    )}

                    {creditAnalysis && selectedDoc === doc.id && (
                      <div className="bg-slate-900/60 border border-emerald-700/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-800">
                          <Brain className="w-5 h-5 text-emerald-400"/>
                          <div>
                            <p className="text-white text-sm font-bold">Analyse Risque Crédit — Claude Sonnet 4</p>
                            <p className="text-emerald-400/70 text-xs">Évaluation professionnelle basée sur les données parsées</p>
                          </div>
                          {/* Mini dashboard risque */}
                          <div className={`ml-auto px-2.5 py-1 rounded-lg text-xs font-bold ${
                            (creditAnalysis.risk_signals?.income_stability || 0) >= 0.8 ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40'
                            : (creditAnalysis.risk_signals?.income_stability || 0) >= 0.5 ? 'bg-amber-900/40 text-amber-400 border border-amber-700/40'
                            : 'bg-rose-900/40 text-rose-400 border border-rose-700/40'
                          }`}>
                            {getRiskLabel(creditAnalysis.risk_signals?.income_stability || 0)}
                          </div>
                        </div>
                        <div className="space-y-1 max-h-80 overflow-y-auto">
                          {renderAnalysis(creditAnalysis.analysis)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DocumentPreviewModal
        isOpen={!!previewDoc}
        title={previewDoc ? `Document banque — ${previewDoc.filename}` : ''}
        fileName={previewDoc?.filename || ''}
        sourceUrl={previewDoc ? `/api/scoring/bank/documents/${previewDoc.id}/download/` : ''}
        mode="auth-fetch"
        onClose={() => setPreviewDocId(null)}
        onDownload={() => {
          if (previewDoc) handleDownload(previewDoc.id);
        }}
      />
    </div>
  );
}
