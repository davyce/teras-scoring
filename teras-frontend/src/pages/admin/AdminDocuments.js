import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import { FileText, Search, Eye, Download, Trash2, CheckCircle, XCircle, Clock, User, Calendar, Database, BookOpen, RefreshCw, AlertCircle, X, Loader2, } from 'lucide-react';
// ─── Constantes ───────────────────────────────────────────────────────────────
const USER_TYPE_LABELS = {
    individual: 'Individuel', enterprise: 'Entreprise',
    bank: 'Banque', government: 'Gouvernement', admin: 'Admin',
};
const USER_TYPE_COLORS = {
    individual: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    enterprise: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    bank: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    government: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    admin: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};
const SOURCE_LABELS = {
    user: 'Individuel',
    enterprise: 'Entreprise',
    bank: 'Banque',
};
const SOURCE_COLORS = {
    user: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
    enterprise: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400',
    bank: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
};
const FAMILY_LABELS = {
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
    uploaded: { label: 'En attente', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400', icon: Clock },
    processing: { label: 'Parsing...', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', icon: RefreshCw },
    parsed: { label: 'Parsé', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: CheckCircle },
    failed: { label: 'Échec', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', icon: XCircle },
    pending: { label: 'Stocké', color: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300', icon: Clock },
    validated: { label: 'Validé', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: CheckCircle },
    rejected: { label: 'Rejeté', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', icon: XCircle },
    informational: { label: 'Informatif', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300', icon: FileText },
};
const RAG_TYPES = [
    { value: 'legislation', label: 'Législation fiscale' },
    { value: 'regulation', label: 'Régulation CEMAC/COBAC' },
    { value: 'ohada', label: 'Droit OHADA' },
    { value: 'economic_report', label: 'Rapport économique' },
    { value: 'banking_policy', label: 'Politique bancaire' },
    { value: 'other', label: 'Autre' },
];
// ─── Composant principal ──────────────────────────────────────────────────────
export default function AdminDocuments() {
    const navigate = useNavigate();
    const [tab, setTab] = useState('users');
    const [userDocs, setUserDocs] = useState([]);
    const [ragDocs, setRagDocs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterSource, setFilterSource] = useState('all');
    const [filterRagType, setFilterRagType] = useState('all');
    const [ragDocType, setRagDocType] = useState('legislation');
    const [ragDesc, setRagDesc] = useState('');
    const [ragLang, setRagLang] = useState('fr');
    const [previewDocId, setPreviewDocId] = useState(null);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const fileRef = useRef(null);
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
        }
        catch {
            setError('Erreur chargement documents.');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { loadAll(); }, [loadAll]);
    // ── Upload RAG ───────────────────────────────────────────────────────────────
    const handleRagUpload = async (files) => {
        if (!files?.length)
            return;
        const file = files[0];
        if (file.size > 50 * 1024 * 1024) {
            setError('Fichier trop volumineux (max 50 MB).');
            return;
        }
        setUploading(true);
        setError('');
        const fd = new FormData();
        fd.append('file', file);
        fd.append('doc_type', ragDocType);
        fd.append('description', ragDesc);
        fd.append('language', ragLang);
        try {
            const res = await authFetch('/api/scoring/admin/documents/rag-upload/', { method: 'POST', body: fd });
            const data = await res.json();
            setSuccessMsg(data.message || `✅ "${file.name}" ajouté au RAG.`);
            setTimeout(() => setSuccessMsg(''), 6000);
            setRagDesc('');
            loadAll();
        }
        catch {
            setError('Erreur upload RAG.');
        }
        finally {
            setUploading(false);
        }
    };
    const deleteRagDoc = async (id) => {
        if (!confirm('Supprimer ce document du RAG ? Il ne sera plus consultable par l\'IA.'))
            return;
        try {
            await authFetch(`/api/scoring/admin/documents/rag/${id}/delete/`, { method: 'DELETE' });
            setSuccessMsg('Document RAG supprimé.');
            setTimeout(() => setSuccessMsg(''), 4000);
            loadAll();
        }
        catch {
            setError('Erreur suppression.');
        }
    };
    const formatSize = (bytes = 0, fallbackMb = 0) => {
        if (bytes > 0) {
            if (bytes < 1024 * 1024)
                return `${Math.max(1, Math.round(bytes / 1024))} KB`;
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        }
        if (fallbackMb > 0)
            return fallbackMb < 1 ? `${Math.max(1, Math.round(fallbackMb * 1024))} KB` : `${fallbackMb.toFixed(1)} MB`;
        return '—';
    };
    const getDisplayStatus = (doc) => {
        if (doc.display_status && STATUS_CONFIG[doc.display_status]) {
            return doc.display_status;
        }
        if (doc.status === 'failed' && doc.parse_expected === false)
            return 'informational';
        if (doc.status in STATUS_CONFIG)
            return doc.status;
        return 'uploaded';
    };
    const filteredUserDocs = userDocs.filter(d => ((d.display_name || d.filename).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterStatus === 'all' || getDisplayStatus(d) === filterStatus) &&
        (filterSource === 'all' || d.source_kind === filterSource) &&
        (filterType === 'all' || d.user?.user_type === filterType));
    const filteredRagDocs = ragDocs.filter(d => (d.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterRagType === 'all' || d.doc_type === filterRagType));
    const previewDoc = userDocs.find(doc => doc.id === previewDocId) || null;
    const handleDocumentDownload = async (doc) => {
        if (!doc.download_url) {
            setError('Téléchargement indisponible pour ce document.');
            return;
        }
        try {
            const response = await authFetch(doc.download_url);
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = doc.filename || doc.display_name || 'document';
            anchor.click();
            URL.revokeObjectURL(url);
        }
        catch (err) {
            setError(err instanceof Error ? `Erreur téléchargement: ${err.message}` : 'Erreur téléchargement.');
        }
    };
    // ─────────────────────────────────────────────────────────────────────────────
    // RENDU
    // ─────────────────────────────────────────────────────────────────────────────
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Chargement des documents..." })] }) }));
    }
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3", children: [_jsx(FileText, { className: "w-8 h-8 text-blue-600" }), " Documents"] }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mt-2", children: "Supervision unifi\u00E9e des documents individuels, entreprise, banque et base de connaissances IA" })] }), _jsx("button", { onClick: loadAll, className: "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition", children: _jsx(RefreshCw, { className: "w-5 h-5 text-gray-500" }) })] }), successMsg && (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-600 dark:text-green-400 shrink-0" }), _jsx("p", { className: "text-green-700 dark:text-green-300 text-sm", children: successMsg }), _jsx("button", { onClick: () => setSuccessMsg(''), className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-green-500" }) })] })), error && (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-red-600 dark:text-red-400 shrink-0" }), _jsx("p", { className: "text-red-700 dark:text-red-300 text-sm", children: error }), _jsx("button", { onClick: () => setError(''), className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-red-500" }) })] })), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6", children: [
                    { label: 'Total Documents', value: stats?.user_documents.total_docs ?? userDocs.length, icon: FileText, color: 'text-blue-500' },
                    { label: 'Comptes couverts', value: stats?.user_documents.total_users ?? 0, icon: User, color: 'text-purple-500' },
                    { label: 'Docs analysables', value: stats?.user_documents.analyzable_docs ?? userDocs.filter(d => d.parse_expected).length, icon: Search, color: 'text-cyan-500' },
                    { label: 'Docs parsés', value: stats?.user_documents.parsed ?? userDocs.filter(d => d.status === 'parsed').length, icon: CheckCircle, color: 'text-green-500' },
                    { label: 'Docs informatifs', value: stats?.user_documents.informational_docs ?? userDocs.filter(d => d.parse_expected === false).length, icon: BookOpen, color: 'text-indigo-500' },
                    { label: 'Docs RAG indexés', value: stats?.rag_documents.indexed ?? ragDocs.filter(d => d.indexed).length, icon: Database, color: 'text-amber-500' },
                ].map((s, i) => {
                    const Icon = s.icon;
                    return (_jsx("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: s.label }), _jsx("p", { className: "text-3xl font-bold text-gray-900 dark:text-white mt-2", children: s.value })] }), _jsx(Icon, { className: `w-12 h-12 ${s.color}` })] }) }, i));
                }) }), _jsx("div", { className: "border-b border-gray-200 dark:border-gray-700", children: _jsx("div", { className: "flex gap-1", children: [
                        { id: 'users', label: `Documents App (${userDocs.length})`, icon: FileText },
                        { id: 'rag', label: `Base RAG — IA (${ragDocs.length})`, icon: Database },
                    ].map(t => {
                        const Icon = t.icon;
                        return (_jsxs("button", { onClick: () => { setTab(t.id); setSearchTerm(''); }, className: `flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition -mb-px ${tab === t.id
                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`, children: [_jsx(Icon, { className: "w-4 h-4" }), t.label] }, t.id));
                    }) }) }), tab === 'users' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Rechercher par fichier ou email...", value: searchTerm, onChange: e => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" })] }), _jsxs("select", { value: filterStatus, onChange: e => setFilterStatus(e.target.value), className: "px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white", children: [_jsx("option", { value: "all", children: "Tous les statuts" }), _jsx("option", { value: "uploaded", children: "En attente" }), _jsx("option", { value: "processing", children: "Parsing..." }), _jsx("option", { value: "parsed", children: "Pars\u00E9s" }), _jsx("option", { value: "failed", children: "\u00C9chec" }), _jsx("option", { value: "informational", children: "Informatifs" }), _jsx("option", { value: "pending", children: "Stock\u00E9s" }), _jsx("option", { value: "validated", children: "Valid\u00E9s" }), _jsx("option", { value: "rejected", children: "Rejet\u00E9s" })] }), _jsxs("select", { value: filterSource, onChange: e => setFilterSource(e.target.value), className: "px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white", children: [_jsx("option", { value: "all", children: "Toutes les sources" }), Object.entries(SOURCE_LABELS).map(([k, v]) => _jsx("option", { value: k, children: v }, k))] }), _jsxs("select", { value: filterType, onChange: e => setFilterType(e.target.value), className: "px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white", children: [_jsx("option", { value: "all", children: "Tous les types" }), Object.entries(USER_TYPE_LABELS).map(([k, v]) => _jsx("option", { value: k, children: v }, k))] })] }), _jsxs("div", { className: "flex flex-wrap gap-2 mt-4", children: [_jsxs("span", { className: "px-2.5 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300", children: ["Individuel: ", stats?.user_documents.by_source?.user ?? userDocs.filter(d => d.source_kind === 'user').length] }), _jsxs("span", { className: "px-2.5 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300", children: ["Entreprise: ", stats?.user_documents.by_source?.enterprise ?? userDocs.filter(d => d.source_kind === 'enterprise').length] }), _jsxs("span", { className: "px-2.5 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300", children: ["Banque: ", stats?.user_documents.by_source?.bank ?? userDocs.filter(d => d.source_kind === 'bank').length] })] })] }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden", children: filteredUserDocs.length === 0 ? (_jsxs("div", { className: "p-12 text-center", children: [_jsx(FileText, { className: "w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Aucun document trouv\u00E9" })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700", children: _jsx("tr", { children: ['Document', 'Compte', 'Source', 'Famille', 'Date', 'Taille', 'Statut', 'Authenticité', 'Actions'].map(h => (_jsx("th", { className: "px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300", children: h }, h))) }) }), _jsx("tbody", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: filteredUserDocs.map(doc => {
                                            const displayStatus = getDisplayStatus(doc);
                                            const cfg = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.uploaded;
                                            const Icon = cfg.icon;
                                            const userBadge = USER_TYPE_COLORS[doc.user?.user_type || ''] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
                                            const sourceBadge = SOURCE_COLORS[doc.source_kind || ''] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
                                            return (_jsxs("tr", { className: "hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors", children: [_jsx("td", { className: "px-4 py-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-xl", children: doc.format === 'pdf' ? '📄' : doc.format === 'excel' ? '📊' : doc.format === 'csv' ? '📋' : '📁' }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white text-sm truncate max-w-[180px]", title: doc.display_name || doc.filename, children: doc.display_name || doc.filename }), _jsx("p", { className: "text-xs text-gray-400 truncate max-w-[180px]", children: doc.filename }), doc.transactions_count > 0 ? (_jsxs("p", { className: "text-xs text-gray-400", children: [doc.transactions_count, " transaction(s)"] })) : doc.parse_expected === false ? (_jsx("p", { className: "text-xs text-indigo-500 dark:text-indigo-300", children: "Document informatif" })) : (_jsx("p", { className: "text-xs text-gray-400", children: "Aucune transaction extraite" }))] })] }) }), _jsx("td", { className: "px-4 py-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(User, { className: "w-4 h-4 text-gray-400 shrink-0" }), _jsxs("div", { children: [doc.user?.name && (_jsx("p", { className: "text-sm text-gray-900 dark:text-white truncate max-w-[120px]", children: doc.user.name })), _jsx("p", { className: "text-xs text-gray-400 truncate max-w-[120px]", children: doc.user?.email || `User #${doc.user_id}` })] })] }) }), _jsx("td", { className: "px-4 py-4", children: _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${sourceBadge}`, children: SOURCE_LABELS[doc.source_kind || ''] || doc.source_label || doc.source_kind }) }), _jsx("td", { className: "px-4 py-4", children: _jsxs("div", { className: "flex flex-col gap-1", children: [doc.user?.user_type && (_jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${userBadge} w-fit`, children: USER_TYPE_LABELS[doc.user.user_type] || doc.user.user_type })), _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: FAMILY_LABELS[doc.document_family || 'other'] || doc.document_family || 'Autre' })] }) }), _jsx("td", { className: "px-4 py-4", children: _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Calendar, { className: "w-3.5 h-3.5 text-gray-400" }), _jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap", children: new Date(doc.uploaded_at).toLocaleDateString('fr-FR') })] }) }), _jsx("td", { className: "px-4 py-4 text-sm text-gray-700 dark:text-gray-300", children: formatSize(doc.size_bytes, doc.size_mb) }), _jsx("td", { className: "px-4 py-4", children: _jsxs("div", { className: `flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${cfg.color} w-fit`, children: [_jsx(Icon, { className: `w-3.5 h-3.5 ${displayStatus === 'processing' ? 'animate-spin' : ''}` }), _jsx("span", { className: "text-xs font-medium", children: cfg.label })] }) }), _jsx("td", { className: "px-4 py-4", children: doc.parse_expected === false ? (_jsx("span", { className: "text-xs text-gray-400", children: "N/A" })) : (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full ${(doc.authenticity_score || 0) >= 0.8 ? 'bg-green-500'
                                                                            : (doc.authenticity_score || 0) >= 0.5 ? 'bg-amber-500' : 'bg-red-500'}`, style: { width: `${(doc.authenticity_score || 0) * 100}%` } }) }), _jsxs("span", { className: "text-xs text-gray-500", children: [Math.round((doc.authenticity_score || 0) * 100), "%"] })] })) }), _jsx("td", { className: "px-4 py-4", children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => setPreviewDocId(doc.id), className: "p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition", title: "Visualiser le document", children: _jsx(Eye, { className: "w-4 h-4 text-blue-600 dark:text-blue-400" }) }), doc.user?.id && (_jsx("button", { onClick: () => navigate(`/admin/users/${doc.user?.id}`), className: "p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition", title: "Voir le compte", children: _jsx(User, { className: "w-4 h-4 text-violet-600 dark:text-violet-400" }) })), doc.download_url && (_jsx("button", { onClick: () => handleDocumentDownload(doc), className: "p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition", title: "T\u00E9l\u00E9charger", children: _jsx(Download, { className: "w-4 h-4 text-green-600 dark:text-green-400" }) }))] }) })] }, doc.id));
                                        }) })] }) })) }), filteredUserDocs.length > 0 && (_jsxs("div", { className: "text-center text-sm text-gray-600 dark:text-gray-400", children: ["Affichage de ", filteredUserDocs.length, " document(s) sur ", userDocs.length, " au total"] }))] })), tab === 'rag' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700", children: [_jsxs("h2", { className: "text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2", children: [_jsx(BookOpen, { className: "w-5 h-5 text-amber-500" }), "Ajouter un document \u00E0 la base de connaissances IA"] }), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm mb-5", children: "Ces documents sont index\u00E9s dans le RAG et consult\u00E9s par Claude Sonnet 4 pour r\u00E9pondre aux questions sur la l\u00E9gislation, la r\u00E9gulation CEMAC et le droit OHADA." }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: "Type" }), _jsx("select", { value: ragDocType, onChange: e => setRagDocType(e.target.value), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white", children: RAG_TYPES.map(t => _jsx("option", { value: t.value, children: t.label }, t.value)) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: "Description" }), _jsx("input", { value: ragDesc, onChange: e => setRagDesc(e.target.value), placeholder: "Ex: Loi de finances Congo 2026", className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: "Langue" }), _jsxs("select", { value: ragLang, onChange: e => setRagLang(e.target.value), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white", children: [_jsx("option", { value: "fr", children: "\uD83C\uDDEB\uD83C\uDDF7 Fran\u00E7ais" }), _jsx("option", { value: "en", children: "\uD83C\uDDEC\uD83C\uDDE7 Anglais" }), _jsx("option", { value: "ar", children: "\uD83C\uDDF8\uD83C\uDDE6 Arabe" })] })] })] }), _jsxs("div", { onDragOver: e => { e.preventDefault(); setDragOver(true); }, onDragLeave: () => setDragOver(false), onDrop: e => { e.preventDefault(); setDragOver(false); handleRagUpload(e.dataTransfer.files); }, onClick: () => !uploading && fileRef.current?.click(), className: `border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver
                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-amber-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`, children: [_jsx("input", { ref: fileRef, type: "file", accept: ".pdf,.txt,.docx,.xlsx,.csv", className: "hidden", onChange: e => handleRagUpload(e.target.files) }), uploading ? (_jsxs("div", { className: "flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400", children: [_jsx(Loader2, { className: "w-5 h-5 animate-spin" }), " Upload et indexation RAG en cours..."] })) : (_jsxs("div", { children: [_jsx(Database, { className: "w-10 h-10 text-amber-500 mx-auto mb-3" }), _jsx("p", { className: "text-gray-700 dark:text-gray-300 font-medium", children: "Glissez ou cliquez pour ajouter un document RAG" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm mt-1", children: "PDF \u00B7 TXT \u00B7 DOCX \u00B7 Excel \u2014 Max 50 MB \u00B7 Indexation automatique" })] }))] })] }), _jsx("div", { className: "bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Rechercher dans la base RAG...", value: searchTerm, onChange: e => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" })] }), _jsxs("select", { value: filterRagType, onChange: e => setFilterRagType(e.target.value), className: "px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white", children: [_jsx("option", { value: "all", children: "Tous les types" }), RAG_TYPES.map(t => _jsx("option", { value: t.value, children: t.label }, t.value))] })] }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden", children: filteredRagDocs.length === 0 ? (_jsxs("div", { className: "p-12 text-center", children: [_jsx(Database, { className: "w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400 font-medium", children: "Base RAG vide" }), _jsx("p", { className: "text-gray-400 dark:text-gray-500 text-sm mt-1", children: "Ajoutez des documents l\u00E9gislatifs pour enrichir les r\u00E9ponses de l'IA TERAS" })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700", children: _jsx("tr", { children: ['Document', 'Type', 'Description', 'Langue', 'Taille', 'Statut', 'Date', 'Actions'].map(h => (_jsx("th", { className: "px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300", children: h }, h))) }) }), _jsx("tbody", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: filteredRagDocs.map(doc => (_jsxs("tr", { className: "hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors", children: [_jsx("td", { className: "px-4 py-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(BookOpen, { className: "w-5 h-5 text-amber-500 shrink-0" }), _jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white truncate max-w-[160px]", title: doc.original || doc.filename, children: doc.original || doc.filename })] }) }), _jsx("td", { className: "px-4 py-4", children: _jsx("span", { className: "px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full", children: RAG_TYPES.find(t => t.value === doc.doc_type)?.label || doc.doc_type }) }), _jsx("td", { className: "px-4 py-4", children: _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]", children: doc.description || '—' }) }), _jsx("td", { className: "px-4 py-4 text-sm text-gray-600 dark:text-gray-400", children: doc.language === 'fr' ? '🇫🇷 FR' : doc.language === 'en' ? '🇬🇧 EN' : doc.language }), _jsx("td", { className: "px-4 py-4 text-sm text-gray-700 dark:text-gray-300", children: formatSize(0, doc.size_mb) }), _jsx("td", { className: "px-4 py-4", children: _jsxs("div", { className: `flex items-center gap-1.5 px-2.5 py-1 rounded-lg w-fit ${doc.indexed
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`, children: [doc.indexed ? _jsx(CheckCircle, { className: "w-3.5 h-3.5" }) : _jsx(Clock, { className: "w-3.5 h-3.5" }), _jsx("span", { className: "text-xs font-medium", children: doc.indexed ? 'Indexé' : 'Non indexé' })] }) }), _jsx("td", { className: "px-4 py-4", children: _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Calendar, { className: "w-3.5 h-3.5 text-gray-400" }), _jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap", children: new Date(doc.uploaded_at).toLocaleDateString('fr-FR') })] }) }), _jsx("td", { className: "px-4 py-4", children: _jsx("button", { onClick: () => deleteRagDoc(doc.id), className: "p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition", title: "Supprimer du RAG", children: _jsx(Trash2, { className: "w-4 h-4 text-red-600 dark:text-red-400" }) }) })] }, doc.id))) })] }) })) }), filteredRagDocs.length > 0 && (_jsxs("div", { className: "text-center text-sm text-gray-600 dark:text-gray-400", children: [filteredRagDocs.length, " document(s) \u00B7 ", ragDocs.filter(d => d.indexed).length, " index\u00E9s dans le RAG"] }))] })), _jsx(DocumentPreviewModal, { isOpen: !!previewDoc, title: previewDoc ? `Admin — ${previewDoc.display_name || previewDoc.filename}` : '', fileName: previewDoc?.filename || '', sourceUrl: previewDoc?.download_url || '', mode: "auth-fetch", onClose: () => setPreviewDocId(null), onDownload: () => {
                    if (previewDoc)
                        handleDocumentDownload(previewDoc);
                } })] }));
}
