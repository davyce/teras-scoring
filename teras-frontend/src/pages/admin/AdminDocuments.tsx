import { authFetch } from '../../utils/authFetch';
import DocumentPreviewModal from '../../components/shared/DocumentPreviewModal';
/**
 * AdminDocuments.tsx - Liste de tous les documents + Gestion RAG
 * ✅ Vue globale tous utilisateurs (backend réel /admin/documents/all/)
 * ✅ Stats globales en temps réel
 * ✅ Upload documents RAG (base de connaissances IA Claude Sonnet 4)
 * ✅ Suppression documents RAG
 * ✅ Filtres par statut, type utilisateur, recherche
 * ✅ Barre d'authenticité parsing
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Search, Eye, Download, Trash2, CheckCircle,
  XCircle, Clock, User, Calendar, Database, BookOpen,
  RefreshCw, AlertCircle, X, Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserDocument {
  id: string;
  filename: string;
  display_name?: string;
  user?: { id: number; email: string; name: string; user_type: string };
  user_id?: number;
  source_kind?: 'user' | 'enterprise' | 'bank';
  source_label?: string;
  document_family?: string;
  parse_expected?: boolean;
  display_status?: string;
  size_bytes?: number;
  size_mb: number;
  format: string;
  status: 'uploaded' | 'processing' | 'parsed' | 'failed' | 'pending' | 'validated' | 'rejected';
  uploaded_at: string;
  transactions_count: number;
  authenticity_score: number;
  download_url?: string;
  doc_type?: string;
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
  user_documents: {
    total_users: number;
    total_docs: number;
    parsed: number;
    analyzable_docs?: number;
    informational_docs?: number;
    total_size_mb: number;
    by_source?: { user: number; enterprise: number; bank: number };
  };
  rag_documents:  { total: number; indexed: number };
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const USER_TYPE_LABELS: Record<string, string> = {
  individual: 'Individuel', enterprise: 'Entreprise',
  bank: 'Banque', government: 'Gouvernement', admin: 'Admin',
};

const USER_TYPE_COLORS: Record<string, string> = {
  individual: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  enterprise: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  bank:       'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  government: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  admin:      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

const SOURCE_LABELS: Record<string, string> = {
  user: 'Individuel',
  enterprise: 'Entreprise',
  bank: 'Banque',
};

const SOURCE_COLORS: Record<string, string> = {
  user: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
  enterprise: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400',
  bank: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
};

const FAMILY_LABELS: Record<string, string> = {
  financial: 'Financier',
  invoice: 'Facture',
  asset: 'Actif',
  identity: 'Identité',
  address: 'Adresse',
  income_support: 'Revenu',
  contract: 'Contrat',
  ocr_reference: 'Scan OCR',
  institutional: 'Institutionnel',
  enterprise_finance: 'Compta',
  other: 'Autre',
};

const STATUS_CONFIG = {
  uploaded:   { label: 'En attente',  color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400', icon: Clock },
  processing: { label: 'Parsing...',  color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',         icon: RefreshCw },
  parsed:     { label: 'Parsé',       color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',     icon: CheckCircle },
  failed:     { label: 'Échec',       color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',             icon: XCircle },
  pending:    { label: 'Stocké',      color: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300',     icon: Clock },
  validated:  { label: 'Validé',      color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',     icon: CheckCircle },
  rejected:   { label: 'Rejeté',      color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',             icon: XCircle },
  informational: { label: 'Informatif', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300', icon: FileText },
} as const;

const RAG_TYPES = [
  { value: 'legislation',     label: 'Législation fiscale' },
  { value: 'regulation',      label: 'Régulation CEMAC/COBAC' },
  { value: 'ohada',           label: 'Droit OHADA' },
  { value: 'economic_report', label: 'Rapport économique' },
  { value: 'banking_policy',  label: 'Politique bancaire' },
  { value: 'other',           label: 'Autre' },
];

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AdminDocuments() {
  const navigate = useNavigate();

  const [tab, setTab]               = useState<'users' | 'rag'>('users');
  const [userDocs, setUserDocs]     = useState<UserDocument[]>([]);
  const [ragDocs, setRagDocs]       = useState<RagDoc[]>([]);
  const [stats, setStats]           = useState<GlobalStats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [dragOver, setDragOver]     = useState(false);

  const [searchTerm, setSearchTerm]       = useState('');
  const [filterStatus, setFilterStatus]   = useState('all');
  const [filterType, setFilterType]       = useState('all');
  const [filterSource, setFilterSource]   = useState('all');
  const [filterRagType, setFilterRagType] = useState('all');

  const [ragDocType, setRagDocType] = useState('legislation');
  const [ragDesc, setRagDesc]       = useState('');
  const [ragLang, setRagLang]       = useState('fr');
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  const [error, setError]           = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Chargement ───────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, d, r] = await Promise.all([
        authFetch('/api/scoring/admin/documents/stats/'),
        authFetch('/api/scoring/admin/documents/all/'),
        authFetch('/api/scoring/admin/documents/rag-list/'),
      ]);
      const [sData, dData, rData] = await Promise.all([s.json(), d.json(), r.json()]);
      setStats(sData);
      setUserDocs(dData.documents || []);
      setRagDocs(rData.documents || []);
    } catch {
      setError('Erreur chargement documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Upload RAG ───────────────────────────────────────────────────────────────
  const handleRagUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    if (file.size > 50 * 1024 * 1024) { setError('Fichier trop volumineux (max 50 MB).'); return; }
    setUploading(true); setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('doc_type', ragDocType);
    fd.append('description', ragDesc);
    fd.append('language', ragLang);
    try {
      const res  = await authFetch('/api/scoring/admin/documents/rag-upload/', { method: 'POST', body: fd });
      const data = await res.json();
      setSuccessMsg(data.message || `✅ "${file.name}" ajouté au RAG.`);
      setTimeout(() => setSuccessMsg(''), 6000);
      setRagDesc('');
      loadAll();
    } catch { setError('Erreur upload RAG.'); }
    finally   { setUploading(false); }
  };

  const deleteRagDoc = async (id: string) => {
    if (!confirm('Supprimer ce document du RAG ? Il ne sera plus consultable par l\'IA.')) return;
    try {
      await authFetch(`/api/scoring/admin/documents/rag/${id}/delete/`, { method: 'DELETE' });
      setSuccessMsg('Document RAG supprimé.'); setTimeout(() => setSuccessMsg(''), 4000);
      loadAll();
    } catch { setError('Erreur suppression.'); }
  };

  const formatSize = (bytes = 0, fallbackMb = 0) => {
    if (bytes > 0) {
      if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (fallbackMb > 0) return fallbackMb < 1 ? `${Math.max(1, Math.round(fallbackMb * 1024))} KB` : `${fallbackMb.toFixed(1)} MB`;
    return '—';
  };

  const getDisplayStatus = (doc: UserDocument) => {
    if (doc.display_status && STATUS_CONFIG[doc.display_status as keyof typeof STATUS_CONFIG]) {
      return doc.display_status as keyof typeof STATUS_CONFIG;
    }
    if (doc.status === 'failed' && doc.parse_expected === false) return 'informational';
    if (doc.status in STATUS_CONFIG) return doc.status as keyof typeof STATUS_CONFIG;
    return 'uploaded';
  };

  const filteredUserDocs = userDocs.filter(d =>
    ((d.display_name || d.filename).toLowerCase().includes(searchTerm.toLowerCase()) ||
     (d.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
     (d.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'all' || getDisplayStatus(d) === filterStatus) &&
    (filterSource === 'all' || d.source_kind === filterSource) &&
    (filterType   === 'all' || d.user?.user_type === filterType)
  );

  const filteredRagDocs = ragDocs.filter(d =>
    (d.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
     d.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterRagType === 'all' || d.doc_type === filterRagType)
  );
  const previewDoc = userDocs.find(doc => doc.id === previewDocId) || null;

  const handleDocumentDownload = async (doc: UserDocument) => {
    if (!doc.download_url) {
      setError('Téléchargement indisponible pour ce document.');
      return;
    }
    try {
      const response = await authFetch(doc.download_url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = doc.filename || doc.display_name || 'document';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? `Erreur téléchargement: ${err.message}` : 'Erreur téléchargement.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"/>
          <p className="text-gray-600 dark:text-gray-400">Chargement des documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600"/> Documents
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Supervision unifiée des documents individuels, entreprise, banque et base de connaissances IA
          </p>
        </div>
        <button onClick={loadAll} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
          <RefreshCw className="w-5 h-5 text-gray-500"/>
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0"/>
          <p className="text-green-700 dark:text-green-300 text-sm">{successMsg}</p>
          <button onClick={() => setSuccessMsg('')} className="ml-auto"><X className="w-4 h-4 text-green-500"/></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0"/>
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4 text-red-500"/></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        {[
          { label: 'Total Documents',    value: stats?.user_documents.total_docs  ?? userDocs.length, icon: FileText,    color: 'text-blue-500' },
          { label: 'Comptes couverts',   value: stats?.user_documents.total_users ?? 0,               icon: User,        color: 'text-purple-500' },
          { label: 'Docs analysables',   value: stats?.user_documents.analyzable_docs ?? userDocs.filter(d => d.parse_expected).length, icon: Search, color: 'text-cyan-500' },
          { label: 'Docs parsés',        value: stats?.user_documents.parsed      ?? userDocs.filter(d => d.status === 'parsed').length, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Docs informatifs',   value: stats?.user_documents.informational_docs ?? userDocs.filter(d => d.parse_expected === false).length, icon: BookOpen, color: 'text-indigo-500' },
          { label: 'Docs RAG indexés',   value: stats?.rag_documents.indexed      ?? ragDocs.filter(d => d.indexed).length, icon: Database, color: 'text-amber-500' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{s.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{s.value}</p>
                </div>
                <Icon className={`w-12 h-12 ${s.color}`}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          {[
            { id: 'users', label: `Documents App (${userDocs.length})`, icon: FileText },
            { id: 'rag',   label: `Base RAG — IA (${ragDocs.length})`,           icon: Database },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id}
                onClick={() => { setTab(t.id as any); setSearchTerm(''); }}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition -mb-px ${
                  tab === t.id
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}>
                <Icon className="w-4 h-4"/>{t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════════════ TAB : Documents utilisateurs ════════════════════════ */}
      {tab === 'users' && (
        <>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                <input type="text" placeholder="Rechercher par fichier ou email..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"/>
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="all">Tous les statuts</option>
                <option value="uploaded">En attente</option>
                <option value="processing">Parsing...</option>
                <option value="parsed">Parsés</option>
                <option value="failed">Échec</option>
                <option value="informational">Informatifs</option>
                <option value="pending">Stockés</option>
                <option value="validated">Validés</option>
                <option value="rejected">Rejetés</option>
              </select>
              <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="all">Toutes les sources</option>
                {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="all">Tous les types</option>
                {Object.entries(USER_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-2.5 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                Individuel: {stats?.user_documents.by_source?.user ?? userDocs.filter(d => d.source_kind === 'user').length}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                Entreprise: {stats?.user_documents.by_source?.enterprise ?? userDocs.filter(d => d.source_kind === 'enterprise').length}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                Banque: {stats?.user_documents.by_source?.bank ?? userDocs.filter(d => d.source_kind === 'bank').length}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {filteredUserDocs.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"/>
                <p className="text-gray-500 dark:text-gray-400">Aucun document trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      {['Document', 'Compte', 'Source', 'Famille', 'Date', 'Taille', 'Statut', 'Authenticité', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUserDocs.map(doc => {
                      const displayStatus = getDisplayStatus(doc);
                      const cfg  = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.uploaded;
                      const Icon = cfg.icon;
                      const userBadge = USER_TYPE_COLORS[doc.user?.user_type || ''] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
                      const sourceBadge = SOURCE_COLORS[doc.source_kind || ''] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';

                      return (
                        <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">
                                {doc.format === 'pdf' ? '📄' : doc.format === 'excel' ? '📊' : doc.format === 'csv' ? '📋' : '📁'}
                              </span>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[180px]" title={doc.display_name || doc.filename}>
                                  {doc.display_name || doc.filename}
                                </p>
                                <p className="text-xs text-gray-400 truncate max-w-[180px]">{doc.filename}</p>
                                {doc.transactions_count > 0 ? (
                                  <p className="text-xs text-gray-400">{doc.transactions_count} transaction(s)</p>
                                ) : doc.parse_expected === false ? (
                                  <p className="text-xs text-indigo-500 dark:text-indigo-300">Document informatif</p>
                                ) : (
                                  <p className="text-xs text-gray-400">Aucune transaction extraite</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400 shrink-0"/>
                              <div>
                                {doc.user?.name && (
                                  <p className="text-sm text-gray-900 dark:text-white truncate max-w-[120px]">{doc.user.name}</p>
                                )}
                                <p className="text-xs text-gray-400 truncate max-w-[120px]">
                                  {doc.user?.email || `User #${doc.user_id}`}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sourceBadge}`}>
                              {SOURCE_LABELS[doc.source_kind || ''] || doc.source_label || doc.source_kind}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              {doc.user?.user_type && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${userBadge} w-fit`}>
                                  {USER_TYPE_LABELS[doc.user.user_type] || doc.user.user_type}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {FAMILY_LABELS[doc.document_family || 'other'] || doc.document_family || 'Autre'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400"/>
                              <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {formatSize(doc.size_bytes, doc.size_mb)}
                          </td>
                          <td className="px-4 py-4">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${cfg.color} w-fit`}>
                              <Icon className={`w-3.5 h-3.5 ${displayStatus === 'processing' ? 'animate-spin' : ''}`}/>
                              <span className="text-xs font-medium">{cfg.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {doc.parse_expected === false ? (
                              <span className="text-xs text-gray-400">N/A</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${
                                    (doc.authenticity_score || 0) >= 0.8 ? 'bg-green-500'
                                    : (doc.authenticity_score || 0) >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
                                  }`} style={{ width: `${(doc.authenticity_score || 0) * 100}%` }}/>
                                </div>
                                <span className="text-xs text-gray-500">{Math.round((doc.authenticity_score || 0) * 100)}%</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setPreviewDocId(doc.id)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition"
                                title="Visualiser le document">
                                <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400"/>
                              </button>
                              {doc.user?.id && (
                                <button
                                  onClick={() => navigate(`/admin/users/${doc.user?.id}`)}
                                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition"
                                  title="Voir le compte"
                                >
                                  <User className="w-4 h-4 text-violet-600 dark:text-violet-400"/>
                                </button>
                              )}
                              {doc.download_url && (
                                <button
                                  onClick={() => handleDocumentDownload(doc)}
                                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition"
                                  title="Télécharger">
                                  <Download className="w-4 h-4 text-green-600 dark:text-green-400"/>
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
            )}
          </div>

          {filteredUserDocs.length > 0 && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Affichage de {filteredUserDocs.length} document(s) sur {userDocs.length} au total
            </div>
          )}
        </>
      )}

      {/* ════════════════ TAB : Base RAG ════════════════════════════════════ */}
      {tab === 'rag' && (
        <div className="space-y-6">
          {/* Zone upload */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500"/>
              Ajouter un document à la base de connaissances IA
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
              Ces documents sont indexés dans le RAG et consultés par Claude Sonnet 4 pour répondre
              aux questions sur la législation, la régulation CEMAC et le droit OHADA.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
                <select value={ragDocType} onChange={e => setRagDocType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  {RAG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <input value={ragDesc} onChange={e => setRagDesc(e.target.value)}
                  placeholder="Ex: Loi de finances Congo 2026"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Langue</label>
                <select value={ragLang} onChange={e => setRagLang(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="fr">🇫🇷 Français</option>
                  <option value="en">🇬🇧 Anglais</option>
                  <option value="ar">🇸🇦 Arabe</option>
                </select>
              </div>
            </div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleRagUpload(e.dataTransfer.files); }}
              onClick={() => !uploading && fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10'
                  : 'border-gray-300 dark:border-gray-600 hover:border-amber-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}>
              <input ref={fileRef} type="file" accept=".pdf,.txt,.docx,.xlsx,.csv" className="hidden"
                onChange={e => handleRagUpload(e.target.files)}/>
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
                  <Loader2 className="w-5 h-5 animate-spin"/> Upload et indexation RAG en cours...
                </div>
              ) : (
                <div>
                  <Database className="w-10 h-10 text-amber-500 mx-auto mb-3"/>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    Glissez ou cliquez pour ajouter un document RAG
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    PDF · TXT · DOCX · Excel — Max 50 MB · Indexation automatique
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Filtres RAG */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                <input type="text" placeholder="Rechercher dans la base RAG..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"/>
              </div>
              <select value={filterRagType} onChange={e => setFilterRagType(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="all">Tous les types</option>
                {RAG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Tableau RAG */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {filteredRagDocs.length === 0 ? (
              <div className="p-12 text-center">
                <Database className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"/>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Base RAG vide</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                  Ajoutez des documents législatifs pour enrichir les réponses de l'IA TERAS
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      {['Document', 'Type', 'Description', 'Langue', 'Taille', 'Statut', 'Date', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredRagDocs.map(doc => (
                      <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-amber-500 shrink-0"/>
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[160px]" title={doc.original || doc.filename}>
                              {doc.original || doc.filename}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full">
                            {RAG_TYPES.find(t => t.value === doc.doc_type)?.label || doc.doc_type}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                            {doc.description || '—'}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {doc.language === 'fr' ? '🇫🇷 FR' : doc.language === 'en' ? '🇬🇧 EN' : doc.language}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {formatSize(0, doc.size_mb)}
                        </td>
                        <td className="px-4 py-4">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg w-fit ${
                            doc.indexed
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {doc.indexed ? <CheckCircle className="w-3.5 h-3.5"/> : <Clock className="w-3.5 h-3.5"/>}
                            <span className="text-xs font-medium">{doc.indexed ? 'Indexé' : 'Non indexé'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400"/>
                            <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <button onClick={() => deleteRagDoc(doc.id)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition"
                            title="Supprimer du RAG">
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400"/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {filteredRagDocs.length > 0 && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {filteredRagDocs.length} document(s) · {ragDocs.filter(d => d.indexed).length} indexés dans le RAG
            </div>
          )}
        </div>
      )}

      <DocumentPreviewModal
        isOpen={!!previewDoc}
        title={previewDoc ? `Admin — ${previewDoc.display_name || previewDoc.filename}` : ''}
        fileName={previewDoc?.filename || ''}
        sourceUrl={previewDoc?.download_url || ''}
        mode="auth-fetch"
        onClose={() => setPreviewDocId(null)}
        onDownload={() => {
          if (previewDoc) handleDocumentDownload(previewDoc);
        }}
      />
    </div>
  );
}
