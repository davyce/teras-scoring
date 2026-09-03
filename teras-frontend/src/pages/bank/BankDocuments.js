import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/pages/bank/BankDocuments.tsx
// Interface documents banque — Upload, analyse risque crédit IA
import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Trash2, Brain, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, RefreshCw, Shield, X, Eye, Search, CreditCard, } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import DocumentPreviewModal from '../../components/shared/DocumentPreviewModal';
// ─── Helpers ──────────────────────────────────────────────────────────────────
const FCFA = (n) => {
    if (!n || isNaN(n))
        return '0 FCFA';
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)} M FCFA`;
    return `${Math.round(n).toLocaleString('fr-FR')} FCFA`;
};
const DOC_TYPES = [
    { value: 'bank_document', label: 'Document interne', icon: '📋' },
    { value: 'client_statement', label: 'Relevé client', icon: '📄' },
    { value: 'loan_agreement', label: 'Contrat crédit', icon: '📝' },
    { value: 'credit_analysis', label: 'Analyse crédit', icon: '📊' },
    { value: 'kyc_document', label: 'Document KYC', icon: '🪪' },
    { value: 'other', label: 'Autre', icon: '📁' },
];
const ACCEPTED_UPLOAD_STATUSES = new Set(['parsed', 'processing', 'uploaded']);
const getUploadFeedback = (status, fileName, transactionsCount = 0, message = '') => {
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
const FORMAT_ICONS = {
    pdf: '📄', excel: '📊', csv: '📋', ofx: '🏦', mt940: '🏦',
};
const getRiskColor = (stability) => {
    if (stability >= 0.8)
        return 'text-emerald-400';
    if (stability >= 0.5)
        return 'text-amber-400';
    return 'text-rose-400';
};
const getRiskLabel = (stability) => {
    if (stability >= 0.8)
        return 'Faible risque';
    if (stability >= 0.5)
        return 'Risque modéré';
    return 'Risque élevé';
};
// ─── Composant principal ──────────────────────────────────────────────────────
export default function BankDocuments() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [docType, setDocType] = useState('client_statement');
    const [clientId, setClientId] = useState('');
    const [filterClient, setFilterClient] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [previewDocId, setPreviewDocId] = useState(null);
    const [parseResult, setParseResult] = useState(null);
    const [creditAnalysis, setCreditAnalysis] = useState(null);
    const [loadingResult, setLoadingResult] = useState(false);
    const [analyzingDoc, setAnalyzingDoc] = useState(null);
    const [showTxns, setShowTxns] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const fileRef = useRef(null);
    const fetchDocs = useCallback(async () => {
        try {
            const url = filterClient
                ? `/api/scoring/bank/documents/list/?client_id=${filterClient}`
                : '/api/scoring/bank/documents/list/';
            const res = await authFetch(url);
            const data = await res.json();
            setDocuments(data.documents || []);
        }
        catch {
            setError('Erreur chargement documents.');
        }
        finally {
            setLoading(false);
        }
    }, [filterClient]);
    useEffect(() => { fetchDocs(); }, [fetchDocs]);
    // Polling processing
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
        if (file.size > 20 * 1024 * 1024) {
            setError('Fichier trop volumineux (max 20 MB).');
            return;
        }
        setUploading(true);
        setError('');
        const fd = new FormData();
        fd.append('file', file);
        fd.append('doc_type', docType);
        if (clientId)
            fd.append('client_id', clientId);
        try {
            const res = await authFetch('/api/scoring/bank/documents/upload/', { method: 'POST', body: fd });
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
            setCreditAnalysis(null);
            return;
        }
        setSelectedDoc(docId);
        setLoadingResult(true);
        setShowTxns(false);
        setCreditAnalysis(null);
        try {
            const res = await authFetch(`/api/scoring/bank/documents/${docId}/?include_transactions=1`);
            const data = await res.json();
            setParseResult(data);
        }
        catch {
            setError('Erreur chargement détails.');
        }
        finally {
            setLoadingResult(false);
        }
    };
    const analyzeCredit = async (docId) => {
        setAnalyzingDoc(docId);
        setError('');
        setCreditAnalysis(null);
        if (selectedDoc !== docId) {
            setSelectedDoc(docId);
        }
        try {
            const res = await authFetch(`/api/scoring/bank/documents/${docId}/analyze-credit/`, { method: 'POST' });
            const data = await res.json();
            if (data.analysis)
                setCreditAnalysis(data);
            else
                setError(data.error || 'Analyse IA indisponible.');
        }
        catch {
            setError('Erreur analyse crédit IA.');
        }
        finally {
            setAnalyzingDoc(null);
        }
    };
    const handleDownload = async (docId) => {
        const doc = documents.find(d => d.id === docId);
        const res = await authFetch(`/api/scoring/bank/documents/${docId}/download/`);
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
        if (!confirm('Supprimer ce document ?'))
            return;
        await authFetch(`/api/scoring/bank/documents/${docId}/delete/`, { method: 'DELETE' });
        if (selectedDoc === docId) {
            setSelectedDoc(null);
            setParseResult(null);
        }
        fetchDocs();
    };
    const filtered = documents.filter(d => {
        const q = d.filename.toLowerCase().includes(searchQuery.toLowerCase());
        const t = filterType === 'all' || d.doc_type === filterType;
        return q && t;
    });
    const renderAnalysis = (text) => text.split('\n').map((line, i) => {
        if (line.startsWith('## '))
            return _jsx("h3", { className: "text-sm font-bold text-sky-300 mt-3 mb-1", children: line.slice(3) }, i);
        if (line.startsWith('**') && line.endsWith('**'))
            return _jsx("p", { className: "text-sm font-bold text-white mt-2", children: line.replace(/\*\*/g, '') }, i);
        if (line.match(/^[-•]\s/))
            return _jsxs("div", { className: "flex gap-2 ml-2 mt-0.5 text-sm text-slate-300", children: [_jsx("span", { className: "text-sky-400 shrink-0", children: "\u25B8" }), line.slice(2)] }, i);
        if (line.trim() === '')
            return _jsx("div", { className: "h-1.5" }, i);
        return _jsx("p", { className: "text-sm text-slate-300 leading-relaxed", children: line }, i);
    });
    const previewDoc = documents.find(d => d.id === previewDocId) || null;
    return (_jsxs("div", { className: "min-h-screen bg-[#0b1220] text-white p-6", children: [_jsxs("div", { className: "mb-8", children: [_jsx("p", { className: "text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2", children: "TERAS Banque" }), _jsx("h1", { className: "text-3xl font-black text-white", children: "Documents Clients" }), _jsx("p", { className: "text-slate-400 mt-1 text-sm", children: "Uploadez et analysez les documents financiers de vos clients \u2014 Analyse risque cr\u00E9dit par IA" })] }), successMsg && (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 bg-emerald-900/30 border border-emerald-700/50 rounded-xl mb-4", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-emerald-400 shrink-0" }), _jsx("p", { className: "text-emerald-300 text-sm", children: successMsg }), _jsx("button", { onClick: () => setSuccessMsg(''), className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-emerald-500" }) })] })), error && (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 bg-rose-900/20 border border-rose-700/40 rounded-xl mb-4", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-rose-400 shrink-0" }), _jsx("p", { className: "text-rose-300 text-sm", children: error }), _jsx("button", { onClick: () => setError(''), className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-rose-500" }) })] })), _jsxs("div", { className: "bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-6", children: [_jsxs("h2", { className: "text-base font-bold text-white mb-4 flex items-center gap-2", children: [_jsx(Upload, { className: "w-4 h-4 text-emerald-400" }), " Uploader un document client"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs mb-1.5 block", children: "Type de document" }), _jsx("select", { value: docType, onChange: e => setDocType(e.target.value), className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500", children: DOC_TYPES.map(t => _jsxs("option", { value: t.value, children: [t.icon, " ", t.label] }, t.value)) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs mb-1.5 block", children: "ID Client (optionnel)" }), _jsx("input", { value: clientId, onChange: e => setClientId(e.target.value), placeholder: "Ex: 1234", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-600" })] })] }), _jsxs("div", { onDragOver: e => { e.preventDefault(); setDragOver(true); }, onDragLeave: () => setDragOver(false), onDrop: e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }, onClick: () => !uploading && fileRef.current?.click(), className: `border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-emerald-400 bg-emerald-900/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'}`, children: [_jsx("input", { ref: fileRef, type: "file", accept: ".pdf,.xlsx,.xls,.csv,.ofx,.qif,.sta,.mt940,.jpg,.jpeg,.png,.doc,.docx", className: "hidden", onChange: e => handleUpload(e.target.files) }), uploading ? (_jsxs("div", { className: "flex items-center justify-center gap-2 text-emerald-400", children: [_jsx(Loader2, { className: "w-5 h-5 animate-spin" }), " Upload et parsing en cours..."] })) : (_jsxs("div", { className: "space-y-2", children: [_jsx(Upload, { className: "w-8 h-8 text-emerald-400 mx-auto" }), _jsx("p", { className: "text-white text-sm font-medium", children: "Glissez ou cliquez pour uploader" }), _jsx("p", { className: "text-slate-500 text-xs", children: "PDF \u00B7 Excel \u00B7 CSV \u00B7 OFX/QIF/STA/MT940 \u00B7 Images \u00B7 DOC/DOCX \u00B7 Max 20 MB" }), _jsxs("div", { className: "flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-1", children: [_jsx(Brain, { className: "w-3.5 h-3.5 text-purple-400" }), "Analyse risque cr\u00E9dit automatique par Claude Sonnet 4"] })] }))] })] }), _jsx("div", { className: "grid grid-cols-4 gap-3 mb-6", children: [
                    { label: 'Total docs', value: documents.length, color: 'text-sky-400' },
                    { label: 'Analysés', value: documents.filter(d => d.status === 'parsed').length, color: 'text-emerald-400' },
                    { label: 'En traitement', value: documents.filter(d => d.status === 'processing').length, color: 'text-amber-400' },
                    { label: 'Clients distincts', value: new Set(documents.map(d => d.client_id).filter(Boolean)).size, color: 'text-violet-400' },
                ].map((s, i) => (_jsxs("div", { className: "bg-slate-900/60 border border-slate-800 rounded-xl p-4", children: [_jsx("p", { className: `text-2xl font-black ${s.color}`, children: s.value }), _jsx("p", { className: "text-slate-500 text-xs mt-0.5", children: s.label })] }, i))) }), _jsxs("div", { className: "flex gap-3 mb-5 flex-wrap", children: [_jsxs("div", { className: "relative flex-1 min-w-[200px]", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { value: searchQuery, onChange: e => setSearchQuery(e.target.value), placeholder: "Rechercher un document...", className: "w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600" })] }), _jsx("input", { value: filterClient, onChange: e => setFilterClient(e.target.value), placeholder: "Filtrer par client ID...", className: "px-3 py-2.5 bg-slate-900/60 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600 w-48" }), _jsxs("select", { value: filterType, onChange: e => setFilterType(e.target.value), className: "px-3 py-2.5 bg-slate-900/60 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:border-sky-500", children: [_jsx("option", { value: "all", children: "Tous types" }), DOC_TYPES.map(t => _jsx("option", { value: t.value, children: t.label }, t.value))] }), _jsx("button", { onClick: fetchDocs, className: "p-2.5 bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition", children: _jsx(RefreshCw, { className: "w-4 h-4" }) })] }), loading ? (_jsxs("div", { className: "flex items-center justify-center py-12", children: [_jsx(Loader2, { className: "w-5 h-5 text-sky-400 animate-spin mr-2" }), _jsx("span", { className: "text-slate-400", children: "Chargement..." })] })) : filtered.length === 0 ? (_jsxs("div", { className: "text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl", children: [_jsx(CreditCard, { className: "w-12 h-12 text-slate-700 mx-auto mb-3" }), _jsx("p", { className: "text-slate-500 font-medium", children: "Aucun document" }), _jsx("p", { className: "text-slate-600 text-sm mt-1", children: "Uploadez des relev\u00E9s clients pour l'analyse de risque cr\u00E9dit" })] })) : (_jsx("div", { className: "space-y-3", children: filtered.map(doc => {
                    const isOpen = selectedDoc === doc.id;
                    return (_jsxs("div", { className: `border rounded-2xl overflow-hidden bg-slate-900/60 transition-all ${isOpen ? 'border-emerald-500/40' : 'border-slate-800 hover:border-slate-700'}`, children: [_jsxs("div", { className: "flex items-center gap-3 px-4 py-3.5", children: [_jsx("span", { className: "text-xl shrink-0", children: FORMAT_ICONS[doc.format] || '📁' }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("p", { className: "text-white text-sm font-medium truncate", children: doc.filename }), doc.client_id && (_jsxs("span", { className: "px-2 py-0.5 bg-sky-900/40 border border-sky-700/40 text-sky-400 text-xs rounded-lg", children: ["Client #", doc.client_id] }))] }), _jsxs("div", { className: "flex items-center gap-3 mt-0.5 flex-wrap", children: [_jsx("span", { className: `text-xs ${doc.status === 'parsed' ? 'text-emerald-400'
                                                            : doc.status === 'processing' ? 'text-amber-400'
                                                                : doc.status === 'failed' ? 'text-rose-400' : 'text-sky-400'}`, children: doc.status === 'processing' ? '⏳ Traitement...'
                                                            : doc.status === 'parsed' ? `✅ ${doc.transactions_count} lignes`
                                                                : doc.status === 'failed' ? '❌ Analyse échouée' : '📁 Enregistré' }), _jsxs("span", { className: "text-slate-600 text-xs", children: [doc.size_mb, " MB"] }), doc.months_covered > 0 && _jsxs("span", { className: "text-slate-600 text-xs", children: [doc.months_covered, " mois"] }), _jsx("span", { className: "text-slate-700 text-xs", children: new Date(doc.uploaded_at).toLocaleDateString('fr-FR') })] })] }), _jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [doc.status === 'parsed' && (_jsx(_Fragment, { children: _jsxs("button", { onClick: () => analyzeCredit(doc.id), disabled: !!analyzingDoc, title: "Analyser risque cr\u00E9dit", className: "flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition", children: [analyzingDoc === doc.id
                                                            ? _jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" })
                                                            : _jsx(Brain, { className: "w-3.5 h-3.5" }), analyzingDoc === doc.id ? '' : 'Risque crédit'] }) })), _jsx("button", { onClick: () => setPreviewDocId(doc.id), title: "Visualiser le document", className: "p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDownload(doc.id), className: "p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition", children: _jsx(Download, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDelete(doc.id), className: "p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition", children: _jsx(Trash2, { className: "w-4 h-4" }) }), doc.status === 'parsed' && (_jsx("button", { onClick: () => loadDetail(doc.id), className: "p-1.5 text-slate-500 hover:text-white transition", children: isOpen ? _jsx(ChevronUp, { className: "w-4 h-4" }) : _jsx(ChevronDown, { className: "w-4 h-4" }) }))] })] }), isOpen && (_jsxs("div", { className: "border-t border-slate-800 px-4 py-4 space-y-4", children: [loadingResult ? (_jsxs("div", { className: "flex items-center gap-2 text-slate-400 text-sm", children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), " Chargement..."] })) : parseResult && (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
                                                    { label: 'Revenu mensuel', value: FCFA(parseResult.teras_signals?.income_signal?.monthly_avg_xaf || 0), color: 'emerald' },
                                                    { label: 'CRM estimé', value: FCFA(parseResult.teras_signals?.crm_estimated_xaf || 0), color: 'sky' },
                                                    { label: 'Cashflow net', value: FCFA(parseResult.quality_stats?.net_cashflow_xaf || 0), color: 'violet' },
                                                    { label: 'Authenticité', value: `${Math.round((parseResult.authenticity_score || 0) * 100)}%`, color: 'amber' },
                                                ].map((k, i) => (_jsxs("div", { className: "bg-slate-800/60 rounded-xl p-3", children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: k.label }), _jsx("p", { className: `text-${k.color}-400 font-bold text-base`, children: k.value })] }, i))) }), parseResult.teras_signals?.income_signal && (_jsxs("div", { className: "flex items-center gap-3 px-3 py-2.5 bg-slate-800/40 rounded-xl", children: [_jsx(Shield, { className: "w-5 h-5 text-slate-400 shrink-0" }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-slate-400 text-xs", children: "Stabilit\u00E9 des revenus" }), _jsx("span", { className: `text-xs font-medium ${getRiskColor(parseResult.teras_signals.income_signal.income_stability || 0)}`, children: getRiskLabel(parseResult.teras_signals.income_signal.income_stability || 0) })] }), _jsx("div", { className: "mt-1.5 h-1.5 bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full ${(parseResult.teras_signals.income_signal.income_stability || 0) >= 0.8 ? 'bg-emerald-400'
                                                                        : (parseResult.teras_signals.income_signal.income_stability || 0) >= 0.5 ? 'bg-amber-400' : 'bg-rose-400'}`, style: { width: `${(parseResult.teras_signals.income_signal.income_stability || 0) * 100}%` } }) })] })] })), parseResult.transactions && parseResult.transactions.length > 0 && (_jsxs("div", { children: [_jsxs("button", { onClick: () => setShowTxns(!showTxns), className: "flex items-center gap-1.5 text-xs text-slate-400 hover:text-white", children: [showTxns ? _jsx(ChevronUp, { className: "w-4 h-4" }) : _jsx(ChevronDown, { className: "w-4 h-4" }), showTxns ? 'Masquer' : 'Voir', " les ", parseResult.transactions.length, " transactions"] }), showTxns && (_jsx("div", { className: "mt-2 max-h-52 overflow-y-auto rounded-xl border border-slate-800", children: _jsxs("table", { className: "w-full text-xs", children: [_jsx("thead", { className: "bg-slate-800/80 sticky top-0", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2 text-left text-slate-400", children: "Date" }), _jsx("th", { className: "px-3 py-2 text-left text-slate-400", children: "Description" }), _jsx("th", { className: "px-3 py-2 text-right text-slate-400", children: "Montant" })] }) }), _jsx("tbody", { children: parseResult.transactions.slice(0, 50).map((t, i) => (_jsxs("tr", { className: `border-t border-slate-800/60 ${i % 2 ? 'bg-slate-900/30' : ''}`, children: [_jsx("td", { className: "px-3 py-2 text-slate-400 whitespace-nowrap", children: t.date }), _jsx("td", { className: "px-3 py-2 text-slate-300 max-w-[200px] truncate", children: t.description }), _jsxs("td", { className: `px-3 py-2 text-right font-medium ${t.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`, children: [t.type === 'credit' ? '+' : '-', t.amount.toLocaleString('fr-FR')] })] }, i))) })] }) }))] }))] })), analyzingDoc === doc.id && !creditAnalysis && (_jsxs("div", { className: "flex items-center gap-2 text-emerald-400 text-sm", children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), "Claude Sonnet 4 analyse le risque cr\u00E9dit..."] })), creditAnalysis && selectedDoc === doc.id && (_jsxs("div", { className: "bg-slate-900/60 border border-emerald-700/30 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3 pb-3 border-b border-slate-800", children: [_jsx(Brain, { className: "w-5 h-5 text-emerald-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-white text-sm font-bold", children: "Analyse Risque Cr\u00E9dit \u2014 Claude Sonnet 4" }), _jsx("p", { className: "text-emerald-400/70 text-xs", children: "\u00C9valuation professionnelle bas\u00E9e sur les donn\u00E9es pars\u00E9es" })] }), _jsx("div", { className: `ml-auto px-2.5 py-1 rounded-lg text-xs font-bold ${(creditAnalysis.risk_signals?.income_stability || 0) >= 0.8 ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40'
                                                            : (creditAnalysis.risk_signals?.income_stability || 0) >= 0.5 ? 'bg-amber-900/40 text-amber-400 border border-amber-700/40'
                                                                : 'bg-rose-900/40 text-rose-400 border border-rose-700/40'}`, children: getRiskLabel(creditAnalysis.risk_signals?.income_stability || 0) })] }), _jsx("div", { className: "space-y-1 max-h-80 overflow-y-auto", children: renderAnalysis(creditAnalysis.analysis) })] }))] }))] }, doc.id));
                }) })), _jsx(DocumentPreviewModal, { isOpen: !!previewDoc, title: previewDoc ? `Document banque — ${previewDoc.filename}` : '', fileName: previewDoc?.filename || '', sourceUrl: previewDoc ? `/api/scoring/bank/documents/${previewDoc.id}/download/` : '', mode: "auth-fetch", onClose: () => setPreviewDocId(null), onDownload: () => {
                    if (previewDoc)
                        handleDownload(previewDoc.id);
                } })] }));
}
