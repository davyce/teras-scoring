import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// ═══════════════════════════════════════════════════════════
// FICHIER 1 : src/pages/admin/AdminDocuments.tsx
// ═══════════════════════════════════════════════════════════
// Copier-coller ce bloc dans AdminDocuments.tsx
/*
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText, Upload, Trash2, Download, Eye, Users, Database,
  CheckCircle, AlertCircle, Loader2, RefreshCw, X, Search,
  ChevronDown, ChevronUp, BookOpen, Brain, BarChart3, Shield,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

interface DocItem {
  id: string;
  filename: string;
  user?: { id: number; email: string; name: string; user_type: string };
  user_id?: number;
  size_mb: number;
  format: string;
  status: string;
  uploaded_at: string;
  transactions_count: number;
  authenticity_score: number;
}

interface RagDoc {
  id: string;
  filename: string;
  original: string;
  doc_type: string;
  description: string;
  language: string;
  indexed: boolean;
  uploaded_by: string;
  uploaded_at: string;
  size_mb: number;
}

interface GlobalStats {
  user_documents: { total_users: number; total_docs: number; parsed: number; total_size_mb: number };
  rag_documents:  { total: number; indexed: number };
}

const FCFA = (n: number) => !n ? '0' : n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : Math.round(n).toLocaleString('fr-FR');

const RAG_TYPES = [
  { value: 'legislation',     label: '⚖️ Législation fiscale' },
  { value: 'regulation',      label: '🏛️ Régulation CEMAC/COBAC' },
  { value: 'ohada',           label: '📜 Droit OHADA' },
  { value: 'economic_report', label: '📊 Rapport économique' },
  { value: 'banking_policy',  label: '🏦 Politique bancaire' },
  { value: 'other',           label: '📁 Autre' },
];

export default function AdminDocuments() {
  const [tab, setTab]           = useState<'users' | 'rag'>('users');
  const [userDocs, setUserDocs] = useState<DocItem[]>([]);
  const [ragDocs, setRagDocs]   = useState<RagDoc[]>([]);
  const [stats, setStats]       = useState<GlobalStats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType]   = useState('all');
  const [error, setError]       = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [ragDocType, setRagDocType] = useState('legislation');
  const [ragDesc, setRagDesc]   = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch('/api/scoring/admin/documents/stats/');
      setStats(await res.json());
    } catch {}
  }, []);

  const fetchUserDocs = useCallback(async () => {
    try {
      const res  = await authFetch('/api/scoring/admin/documents/all/');
      const data = await res.json();
      setUserDocs(data.documents || []);
    } catch { setError('Erreur chargement documents utilisateurs.'); }
    finally { setLoading(false); }
  }, []);

  const fetchRagDocs = useCallback(async () => {
    try {
      const res  = await authFetch('/api/scoring/admin/documents/rag-list/');
      const data = await res.json();
      setRagDocs(data.documents || []);
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchStats(), fetchUserDocs(), fetchRagDocs()]);
  }, [fetchStats, fetchUserDocs, fetchRagDocs]);

  const handleRagUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    if (file.size > 50 * 1024 * 1024) { setError('Fichier trop volumineux (max 50 MB).'); return; }
    setUploading(true); setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('doc_type', ragDocType);
    fd.append('description', ragDesc);
    try {
      const res  = await authFetch('/api/scoring/admin/documents/rag-upload/', { method: 'POST', body: fd });
      const data = await res.json();
      setSuccessMsg(data.message || `✅ "${file.name}" ajouté au RAG.`);
      setTimeout(() => setSuccessMsg(''), 6000);
      setRagDesc('');
      fetchRagDocs();
      fetchStats();
    } catch { setError('Erreur upload RAG.'); }
    finally { setUploading(false); }
  };

  const deleteRagDoc = async (id: string) => {
    if (!confirm('Supprimer ce document du RAG ? Il ne sera plus accessible par l\'IA.')) return;
    await authFetch(`/api/scoring/admin/documents/rag/${id}/delete/`, { method: 'DELETE' });
    fetchRagDocs();
    fetchStats();
  };

  const filteredUserDocs = userDocs.filter(d => {
    const q = d.filename.toLowerCase().includes(searchQuery.toLowerCase())
           || d.user?.email.toLowerCase().includes(searchQuery.toLowerCase());
    return q;
  });

  const filteredRagDocs = ragDocs.filter(d => {
    const q = d.filename.toLowerCase().includes(searchQuery.toLowerCase())
           || d.description.toLowerCase().includes(searchQuery.toLowerCase());
    const t = filterType === 'all' || d.doc_type === filterType;
    return q && t;
  });

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-6">
      <div className="mb-8">
        <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2">TERAS Admin</p>
        <h1 className="text-3xl font-black text-white">Gestion Documents</h1>
        <p className="text-slate-400 mt-1 text-sm">Documents utilisateurs + Base de connaissances RAG</p>
      </div>

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

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Utilisateurs avec docs', value: stats.user_documents.total_users,  color: 'text-sky-400' },
            { label: 'Total documents',         value: stats.user_documents.total_docs,   color: 'text-violet-400' },
            { label: 'Docs parsés',             value: stats.user_documents.parsed,       color: 'text-emerald-400' },
            { label: 'Docs RAG indexés',        value: stats.rag_documents.indexed,       color: 'text-amber-400' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-slate-800">
        {[
          { id: 'users', label: 'Documents Utilisateurs', icon: Users },
          { id: 'rag',   label: 'Base RAG (IA)',          icon: Database },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                tab === t.id ? 'border-sky-400 text-white' : 'border-transparent text-slate-400 hover:text-white'
              }`}>
              <Icon className="w-4 h-4"/>{t.label}
            </button>
          );
        })}
      </div>

      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom de fichier ou email..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600"/>
            </div>
            <button onClick={fetchUserDocs} className="p-2.5 bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition">
              <RefreshCw className="w-4 h-4"/>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-sky-400 animate-spin mr-2"/><span className="text-slate-400">Chargement...</span>
            </div>
          ) : filteredUserDocs.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <FileText className="w-10 h-10 text-slate-700 mx-auto mb-2"/>
              <p className="text-slate-500 text-sm">Aucun document utilisateur</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUserDocs.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition">
                  <span className="text-lg shrink-0">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{doc.filename}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                      {doc.user && (
                        <span className={`px-1.5 py-0.5 rounded ${
                          doc.user.user_type === 'individual' ? 'bg-sky-900/40 text-sky-400'
                          : doc.user.user_type === 'enterprise' ? 'bg-violet-900/40 text-violet-400'
                          : 'bg-slate-800 text-slate-400'
                        }`}>{doc.user.user_type}</span>
                      )}
                      <span>{doc.user?.email}</span>
                      <span>{doc.size_mb} MB</span>
                      <span className={doc.status === 'parsed' ? 'text-emerald-400' : doc.status === 'failed' ? 'text-rose-400' : 'text-amber-400'}>
                        {doc.status === 'parsed' ? `✅ ${doc.transactions_count} txn` : doc.status}
                      </span>
                      <span>{new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-xs text-slate-500">
                    {Math.round((doc.authenticity_score || 0) * 100)}% auth
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'rag' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400"/> Ajouter un document à la base RAG
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Type de document</label>
                <select value={ragDocType} onChange={e => setRagDocType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500">
                  {RAG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Description (optionnelle)</label>
                <input value={ragDesc} onChange={e => setRagDesc(e.target.value)}
                  placeholder="Ex: Loi de finances 2026 Congo"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 placeholder-slate-600"/>
              </div>
            </div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleRagUpload(e.dataTransfer.files); }}
              onClick={() => !uploading && fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver ? 'border-amber-400 bg-amber-900/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
              }`}>
              <input ref={fileRef} type="file" accept=".pdf,.txt,.docx,.xlsx,.csv" className="hidden"
                onChange={e => handleRagUpload(e.target.files)}/>
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-amber-400">
                  <Loader2 className="w-5 h-5 animate-spin"/> Upload et indexation RAG...
                </div>
              ) : (
                <div className="space-y-2">
                  <Database className="w-7 h-7 text-amber-400 mx-auto"/>
                  <p className="text-white text-sm font-medium">Glissez un document législatif ou réglementaire</p>
                  <p className="text-slate-500 text-xs">PDF · TXT · DOCX · Excel — Max 50 MB · Indexation automatique</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans le RAG..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600"/>
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2.5 bg-slate-900/60 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:border-sky-500">
              <option value="all">Tous types</option>
              {RAG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {filteredRagDocs.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <Database className="w-10 h-10 text-slate-700 mx-auto mb-2"/>
              <p className="text-slate-500 text-sm">Aucun document RAG — ajoutez de la législation pour enrichir l'IA</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRagDocs.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition">
                  <BookOpen className="w-5 h-5 text-amber-400 shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{doc.original || doc.filename}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-amber-900/40 text-amber-400 rounded">{doc.doc_type}</span>
                      {doc.description && <span className="text-slate-400 truncate max-w-[200px]">{doc.description}</span>}
                      <span>{doc.size_mb} MB</span>
                      <span className={doc.indexed ? 'text-emerald-400' : 'text-slate-500'}>
                        {doc.indexed ? '✅ Indexé' : '⏸ Non indexé'}
                      </span>
                      <span>{new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteRagDoc(doc.id)} className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
*/
// ═══════════════════════════════════════════════════════════
// FICHIER 2 : src/pages/government/GovernmentDocuments.tsx
// ═══════════════════════════════════════════════════════════
import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Trash2, Brain, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, RefreshCw, X, Eye, Sparkles, Globe, Search, } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import DocumentPreviewModal from '../../components/shared/DocumentPreviewModal';
const FCFA = (n) => {
    if (!n || isNaN(n))
        return '0 FCFA';
    if (n >= 1000000000)
        return `${(n / 1000000000).toFixed(1)} Md FCFA`;
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)} M FCFA`;
    return `${Math.round(n).toLocaleString('fr-FR')} FCFA`;
};
const DOC_TYPES = [
    { value: 'economic_data', label: '📊 Données économiques', desc: 'PIB, emplois, secteurs' },
    { value: 'budget', label: '💰 Budget national', desc: 'Recettes, dépenses État' },
    { value: 'tax_report', label: '🧾 Rapport fiscal', desc: 'Recettes DGI, conformité' },
    { value: 'census_data', label: '👥 Données démographiques', desc: 'Population, emploi' },
    { value: 'trade_data', label: '🌍 Commerce extérieur', desc: 'Exports, imports CEMAC' },
    { value: 'financial_report', label: '📈 Rapport financier', desc: 'Indicateurs macro-éco' },
    { value: 'other', label: '📁 Autre document', desc: '' },
];
const ACCEPTED_UPLOAD_STATUSES = new Set(['parsed', 'processing', 'uploaded']);
const getUploadFeedback = (status, fileName, transactionsCount = 0, message = '') => {
    if (status === 'parsed') {
        return transactionsCount > 0
            ? `✅ ${transactionsCount} lignes extraites de "${fileName}"`
            : '✅ Document gouvernemental enregistré et analysé.';
    }
    if (status === 'processing') {
        return message || '📤 Document enregistré, analyse en cours...';
    }
    if (status === 'uploaded') {
        return message || '✅ Document gouvernemental enregistré. Analyse structurée non applicable à ce type de fichier.';
    }
    return message || 'Document enregistré.';
};
const FORMAT_ICONS = {
    pdf: '📄', excel: '📊', csv: '📋', txt: '📝',
};
export default function GovernmentDocuments() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [docType, setDocType] = useState('economic_data');
    const [period, setPeriod] = useState('');
    const [description, setDescription] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [previewDocId, setPreviewDocId] = useState(null);
    const [parseResult, setParseResult] = useState(null);
    const [analysis, setAnalysis] = useState('');
    const [loadingResult, setLoadingResult] = useState(false);
    const [analyzingDoc, setAnalyzingDoc] = useState(null);
    const [showTxns, setShowTxns] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const fileRef = useRef(null);
    const fetchDocs = useCallback(async () => {
        try {
            const res = await authFetch('/api/scoring/government/documents/list/');
            const data = await res.json();
            setDocuments(data.documents || []);
        }
        catch {
            setError('Erreur chargement documents.');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { fetchDocs(); }, [fetchDocs]);
    useEffect(() => {
        const processing = documents.filter(d => d.status === 'processing');
        if (!processing.length)
            return;
        const interval = setInterval(() => fetchDocs(), 3000);
        return () => clearInterval(interval);
    }, [documents, fetchDocs]);
    const handleUpload = async (files) => {
        if (!files?.length)
            return;
        const file = files[0];
        if (file.size > 30 * 1024 * 1024) {
            setError('Fichier trop volumineux (max 30 MB).');
            return;
        }
        setUploading(true);
        setError('');
        const fd = new FormData();
        fd.append('file', file);
        fd.append('doc_type', docType);
        fd.append('period', period);
        fd.append('description', description);
        try {
            const res = await authFetch('/api/scoring/government/documents/upload/', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Erreur upload document.');
                return;
            }
            if (ACCEPTED_UPLOAD_STATUSES.has(data.status)) {
                setSuccessMsg(getUploadFeedback(data.status, file.name, data.transactions_count, data.message));
                setTimeout(() => setSuccessMsg(''), 5000);
                fetchDocs();
            }
            else {
                setError(data.message || data.error || 'Document enregistré mais analyse impossible.');
                fetchDocs();
            }
        }
        catch {
            setError('Erreur upload.');
        }
        finally {
            setUploading(false);
        }
    };
    const loadDetail = async (docId) => {
        if (selectedDoc === docId) {
            setSelectedDoc(null);
            setParseResult(null);
            setAnalysis('');
            return;
        }
        setSelectedDoc(docId);
        setLoadingResult(true);
        setAnalysis('');
        setShowTxns(false);
        try {
            const res = await authFetch(`/api/scoring/government/documents/${docId}/?include_transactions=1`);
            const data = await res.json();
            setParseResult(data);
        }
        catch {
            setError('Erreur chargement.');
        }
        finally {
            setLoadingResult(false);
        }
    };
    const analyzeWithAI = async (docId) => {
        setAnalyzingDoc(docId);
        setAnalysis('');
        setError('');
        if (selectedDoc !== docId)
            setSelectedDoc(docId);
        try {
            const res = await authFetch(`/api/scoring/government/documents/${docId}/analyze/`, { method: 'POST' });
            const data = await res.json();
            if (data.analysis)
                setAnalysis(data.analysis);
            else
                setError(data.error || 'Analyse IA indisponible.');
        }
        catch {
            setError('Erreur analyse IA.');
        }
        finally {
            setAnalyzingDoc(null);
        }
    };
    const handleDownload = async (docId) => {
        const doc = documents.find(d => d.id === docId);
        const res = await authFetch(`/api/scoring/government/documents/${docId}/download/`);
        if (!res.ok) {
            setError('Erreur téléchargement.');
            return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc?.filename || docId;
        a.click();
        URL.revokeObjectURL(url);
    };
    const handleDelete = async (docId) => {
        if (!confirm('Supprimer ce document gouvernemental ?'))
            return;
        await authFetch(`/api/scoring/government/documents/${docId}/delete/`, { method: 'DELETE' });
        if (selectedDoc === docId) {
            setSelectedDoc(null);
            setParseResult(null);
        }
        fetchDocs();
    };
    const renderAnalysis = (text) => text.split('\n').map((line, i) => {
        if (line.startsWith('## '))
            return _jsx("h3", { className: "text-sm font-bold text-sky-300 mt-4 mb-1.5", children: line.slice(3) }, i);
        if (line.startsWith('**') && line.endsWith('**'))
            return _jsx("p", { className: "text-sm font-bold text-white mt-2", children: line.replace(/\*\*/g, '') }, i);
        if (line.match(/^[-•]\s/))
            return _jsxs("div", { className: "flex gap-2 ml-2 mt-0.5", children: [_jsx("span", { className: "text-sky-400 text-xs mt-0.5", children: "\u25C6" }), _jsx("span", { className: "text-sm text-slate-200", children: line.slice(2) })] }, i);
        if (line.trim() === '')
            return _jsx("div", { className: "h-1.5" }, i);
        return _jsx("p", { className: "text-sm text-slate-200 leading-relaxed", children: line }, i);
    });
    const filtered = documents.filter(d => {
        const q = d.filename.toLowerCase().includes(searchQuery.toLowerCase());
        const t = filterType === 'all' || d.doc_type === filterType;
        return q && t;
    });
    const previewDoc = documents.find(d => d.id === previewDocId) || null;
    return (_jsxs("div", { className: "min-h-screen bg-[#0b1220] text-white p-6", children: [_jsxs("div", { className: "mb-8", children: [_jsx("p", { className: "text-xs font-bold text-violet-400 uppercase tracking-widest mb-2", children: "TERAS Gouvernement" }), _jsx("h1", { className: "text-3xl font-black text-white", children: "Documents \u00C9conomiques" }), _jsx("p", { className: "text-slate-400 mt-1 text-sm", children: "Importez vos donn\u00E9es nationales \u2014 L'IA TERAS les analyse et enrichit le tableau de bord CEMAC" })] }), successMsg && (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 bg-emerald-900/30 border border-emerald-700/50 rounded-xl mb-4", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-emerald-400 shrink-0" }), _jsx("p", { className: "text-emerald-300 text-sm", children: successMsg }), _jsx("button", { onClick: () => setSuccessMsg(''), className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-emerald-500" }) })] })), error && (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 bg-rose-900/20 border border-rose-700/40 rounded-xl mb-4", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-rose-400 shrink-0" }), _jsx("p", { className: "text-rose-300 text-sm", children: error }), _jsx("button", { onClick: () => setError(''), className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-rose-500" }) })] })), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-6", children: DOC_TYPES.slice(0, 4).map(t => (_jsxs("button", { onClick: () => setDocType(t.value), className: `p-3 rounded-xl border text-left transition-all ${docType === t.value
                        ? 'border-violet-500/60 bg-violet-900/20'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`, children: [_jsx("p", { className: "text-sm", children: t.label }), t.desc && _jsx("p", { className: "text-slate-500 text-xs mt-0.5", children: t.desc })] }, t.value))) }), _jsxs("div", { className: "bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs mb-1.5 block", children: "Type de document" }), _jsx("select", { value: docType, onChange: e => setDocType(e.target.value), className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500", children: DOC_TYPES.map(t => _jsx("option", { value: t.value, children: t.label }, t.value)) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs mb-1.5 block", children: "P\u00E9riode (ex: 2025-Q4)" }), _jsx("input", { value: period, onChange: e => setPeriod(e.target.value), placeholder: "Ex: 2025-Q4 ou 2025", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 placeholder-slate-600" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs mb-1.5 block", children: "Description (optionnelle)" }), _jsx("input", { value: description, onChange: e => setDescription(e.target.value), placeholder: "Ex: Recettes DGI d\u00E9cembre 2025", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 placeholder-slate-600" })] })] }), _jsxs("div", { onDragOver: e => { e.preventDefault(); setDragOver(true); }, onDragLeave: () => setDragOver(false), onDrop: e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }, onClick: () => !uploading && fileRef.current?.click(), className: `border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-violet-400 bg-violet-900/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'}`, children: [_jsx("input", { ref: fileRef, type: "file", accept: ".pdf,.xlsx,.xls,.csv,.txt,.doc,.docx", className: "hidden", onChange: e => handleUpload(e.target.files) }), uploading ? (_jsxs("div", { className: "flex items-center justify-center gap-2 text-violet-400", children: [_jsx(Loader2, { className: "w-5 h-5 animate-spin" }), " Upload et traitement en cours..."] })) : (_jsxs("div", { className: "space-y-2", children: [_jsx(Globe, { className: "w-8 h-8 text-violet-400 mx-auto" }), _jsx("p", { className: "text-white text-sm font-medium", children: "Glissez vos donn\u00E9es \u00E9conomiques ici" }), _jsx("p", { className: "text-slate-500 text-xs", children: "PDF \u00B7 Excel \u00B7 CSV \u00B7 TXT \u00B7 DOC/DOCX \u2014 Max 30 MB" }), _jsxs("div", { className: "flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-1", children: [_jsx(Sparkles, { className: "w-3.5 h-3.5 text-violet-400" }), "Analyse IA contexte gouvernement CEMAC \u2014 Claude Sonnet 4"] })] }))] })] }), _jsx("div", { className: "grid grid-cols-3 gap-3 mb-5", children: [
                    { label: 'Documents importés', value: documents.length, color: 'text-violet-400' },
                    { label: 'Analysés', value: documents.filter(d => d.status === 'parsed').length, color: 'text-emerald-400' },
                    { label: 'En traitement', value: documents.filter(d => d.status === 'processing').length, color: 'text-amber-400' },
                ].map((s, i) => (_jsxs("div", { className: "bg-slate-900/60 border border-slate-800 rounded-xl p-4", children: [_jsx("p", { className: `text-2xl font-black ${s.color}`, children: s.value }), _jsx("p", { className: "text-slate-500 text-xs mt-0.5", children: s.label })] }, i))) }), _jsxs("div", { className: "flex gap-3 mb-5", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { value: searchQuery, onChange: e => setSearchQuery(e.target.value), placeholder: "Rechercher un document...", className: "w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:border-violet-500 placeholder-slate-600" })] }), _jsxs("select", { value: filterType, onChange: e => setFilterType(e.target.value), className: "px-3 py-2.5 bg-slate-900/60 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:border-violet-500", children: [_jsx("option", { value: "all", children: "Tous types" }), DOC_TYPES.map(t => _jsx("option", { value: t.value, children: t.label }, t.value))] }), _jsx("button", { onClick: fetchDocs, className: "p-2.5 bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition", children: _jsx(RefreshCw, { className: "w-4 h-4" }) })] }), loading ? (_jsxs("div", { className: "flex items-center justify-center py-12", children: [_jsx(Loader2, { className: "w-5 h-5 text-violet-400 animate-spin mr-2" }), _jsx("span", { className: "text-slate-400", children: "Chargement..." })] })) : filtered.length === 0 ? (_jsxs("div", { className: "text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl", children: [_jsx(Globe, { className: "w-12 h-12 text-slate-700 mx-auto mb-3" }), _jsx("p", { className: "text-slate-500 font-medium", children: "Aucun document \u00E9conomique" }), _jsx("p", { className: "text-slate-600 text-sm mt-1", children: "Importez des donn\u00E9es CSV ou Excel pour enrichir le tableau de bord CEMAC" })] })) : (_jsx("div", { className: "space-y-3", children: filtered.map(doc => {
                    const isOpen = selectedDoc === doc.id;
                    return (_jsxs("div", { className: `border rounded-2xl overflow-hidden bg-slate-900/60 transition-all ${isOpen ? 'border-violet-500/40' : 'border-slate-800 hover:border-slate-700'}`, children: [_jsxs("div", { className: "flex items-center gap-3 px-4 py-3.5", children: [_jsx("span", { className: "text-xl shrink-0", children: FORMAT_ICONS[doc.format] || '📁' }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("p", { className: "text-white text-sm font-medium truncate", children: doc.filename }), _jsx("span", { className: "px-2 py-0.5 bg-violet-900/40 border border-violet-700/40 text-violet-400 text-xs rounded-lg", children: DOC_TYPES.find(t => t.value === doc.doc_type)?.label || doc.doc_type })] }), _jsxs("div", { className: "flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap", children: [_jsx("span", { className: doc.status === 'parsed' ? 'text-emerald-400' : doc.status === 'processing' ? 'text-amber-400' : 'text-slate-400', children: doc.status === 'parsed' ? `✅ ${doc.transactions_count} lignes`
                                                            : doc.status === 'processing' ? '⏳ Traitement...'
                                                                : doc.status === 'uploaded' ? '📁 Enregistré'
                                                                    : '❌ Analyse échouée' }), _jsxs("span", { children: [doc.size_mb, " MB"] }), _jsx("span", { children: new Date(doc.uploaded_at).toLocaleDateString('fr-FR') })] })] }), _jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [doc.status === 'parsed' && (_jsx(_Fragment, { children: _jsxs("button", { onClick: () => analyzeWithAI(doc.id), disabled: !!analyzingDoc, className: "flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition", children: [analyzingDoc === doc.id ? _jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : _jsx(Brain, { className: "w-3.5 h-3.5" }), analyzingDoc === doc.id ? '' : 'Analyser'] }) })), _jsx("button", { onClick: () => setPreviewDocId(doc.id), title: "Visualiser le document", className: "p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDownload(doc.id), className: "p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition", children: _jsx(Download, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDelete(doc.id), className: "p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition", children: _jsx(Trash2, { className: "w-4 h-4" }) }), doc.status === 'parsed' && (_jsx("button", { onClick: () => loadDetail(doc.id), className: "p-1.5 text-slate-500 hover:text-white transition", children: isOpen ? _jsx(ChevronUp, { className: "w-4 h-4" }) : _jsx(ChevronDown, { className: "w-4 h-4" }) }))] })] }), isOpen && (_jsxs("div", { className: "border-t border-slate-800 px-4 py-4 space-y-4", children: [loadingResult ? (_jsxs("div", { className: "flex items-center gap-2 text-slate-400 text-sm", children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), " Chargement..."] })) : parseResult && (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
                                                    { label: 'Flux total entrants', value: FCFA(parseResult.quality_stats?.total_credits_xaf || 0), color: 'emerald' },
                                                    { label: 'Flux total sortants', value: FCFA(parseResult.quality_stats?.total_debits_xaf || 0), color: 'rose' },
                                                    { label: 'Balance nette', value: FCFA(parseResult.quality_stats?.net_cashflow_xaf || 0), color: 'sky' },
                                                    { label: 'Authenticité', value: `${Math.round((parseResult.authenticity_score || 0) * 100)}%`, color: 'amber' },
                                                ].map((k, i) => (_jsxs("div", { className: "bg-slate-800/60 rounded-xl p-3", children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: k.label }), _jsx("p", { className: `text-${k.color}-400 font-bold text-sm`, children: k.value })] }, i))) }), parseResult.recommendations?.length > 0 && (_jsx("div", { className: "space-y-1.5", children: parseResult.recommendations.map((r, i) => (_jsxs("div", { className: `flex gap-2 px-3 py-2 rounded-xl text-xs ${r.type === 'success' ? 'bg-emerald-900/20 border border-emerald-700/30 text-emerald-300'
                                                        : 'bg-slate-800/60 border border-slate-700/50 text-slate-400'}`, children: [_jsx("span", { children: r.type === 'success' ? '✅' : 'ℹ️' }), r.message] }, i))) })), parseResult.transactions && parseResult.transactions.length > 0 && (_jsxs("div", { children: [_jsxs("button", { onClick: () => setShowTxns(!showTxns), className: "flex items-center gap-1.5 text-xs text-slate-400 hover:text-white", children: [showTxns ? _jsx(ChevronUp, { className: "w-4 h-4" }) : _jsx(ChevronDown, { className: "w-4 h-4" }), showTxns ? 'Masquer' : 'Voir', " les ", parseResult.transactions.length, " lignes de donn\u00E9es"] }), showTxns && (_jsx("div", { className: "mt-2 max-h-52 overflow-y-auto rounded-xl border border-slate-800", children: _jsxs("table", { className: "w-full text-xs", children: [_jsx("thead", { className: "bg-slate-800/80 sticky top-0", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2 text-left text-slate-400", children: "Date" }), _jsx("th", { className: "px-3 py-2 text-left text-slate-400", children: "Description" }), _jsx("th", { className: "px-3 py-2 text-right text-slate-400", children: "Montant" })] }) }), _jsx("tbody", { children: parseResult.transactions.slice(0, 50).map((t, i) => (_jsxs("tr", { className: `border-t border-slate-800/60 ${i % 2 ? 'bg-slate-900/30' : ''}`, children: [_jsx("td", { className: "px-3 py-2 text-slate-400 whitespace-nowrap", children: t.date }), _jsx("td", { className: "px-3 py-2 text-slate-300 max-w-[200px] truncate", children: t.description }), _jsxs("td", { className: `px-3 py-2 text-right font-medium ${t.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`, children: [t.type === 'credit' ? '+' : '-', t.amount.toLocaleString('fr-FR')] })] }, i))) })] }) }))] })), _jsx("button", { onClick: () => analyzeWithAI(doc.id), disabled: !!analyzingDoc, className: "flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition", children: analyzingDoc === doc.id
                                                    ? _jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), " Analyse en cours..."] })
                                                    : _jsxs(_Fragment, { children: [_jsx(Sparkles, { className: "w-4 h-4" }), " Analyse IA gouvernement"] }) })] })), analyzingDoc === doc.id && !analysis && (_jsxs("div", { className: "flex items-center gap-2 text-violet-400 text-sm", children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), "Claude Sonnet 4 analyse vos donn\u00E9es \u00E9conomiques..."] })), analysis && selectedDoc === doc.id && (_jsxs("div", { className: "bg-slate-900/60 border border-violet-700/30 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4 pb-3 border-b border-slate-800", children: [_jsx("div", { className: "w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center", children: _jsx(Brain, { className: "w-4 h-4 text-violet-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-white text-sm font-bold", children: "Analyse IA Gouvernement \u2014 Claude Sonnet 4" }), _jsx("p", { className: "text-violet-400/70 text-xs", children: "Analyse de niveau minist\u00E9riel \u00B7 CEMAC" })] }), _jsxs("div", { className: "ml-auto flex items-center gap-1.5 px-2 py-1 bg-violet-900/30 border border-violet-700/40 rounded-full", children: [_jsx("div", { className: "w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" }), _jsx("span", { className: "text-violet-400 text-xs", children: "Confidentiel" })] })] }), _jsx("div", { className: "space-y-1 max-h-96 overflow-y-auto", children: renderAnalysis(analysis) })] }))] }))] }, doc.id));
                }) })), _jsx(DocumentPreviewModal, { isOpen: !!previewDoc, title: previewDoc ? `Document gouvernemental — ${previewDoc.filename}` : '', fileName: previewDoc?.filename || '', sourceUrl: previewDoc ? `/api/scoring/government/documents/${previewDoc.id}/download/` : '', mode: "auth-fetch", onClose: () => setPreviewDocId(null), onDownload: () => {
                    if (previewDoc)
                        handleDownload(previewDoc.id);
                } })] }));
}
