import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import { useState, useCallback, useRef, useEffect } from 'react';
import { authFetch } from '../../utils/authFetch';
import DocumentPreviewModal from '../../components/shared/DocumentPreviewModal';
import { FileText, Upload, Download, Trash2, Eye, Search, Grid, List, RefreshCw, AlertCircle, X, Sparkles, TrendingUp, DollarSign, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, Zap, Shield, Loader2, Wallet, BarChart3, } from 'lucide-react';
// ─── Helpers ──────────────────────────────────────────────────────────────────
const FCFA = (n) => {
    if (!n || isNaN(n))
        return '0 FCFA';
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)} M FCFA`;
    return `${Math.round(n).toLocaleString('fr-FR')} FCFA`;
};
const FORMAT_ICONS = {
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
const getFileType = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf')
        return 'pdf';
    if (['xlsx', 'xls', 'csv'].includes(ext))
        return 'excel';
    if (['jpg', 'jpeg', 'png'].includes(ext))
        return 'image';
    if (['ofx', 'qif', 'sta', 'mt940'].includes(ext))
        return 'ofx';
    return 'other';
};
// ─── Sous-composants ──────────────────────────────────────────────────────────
const StatusBadge = ({ status, count }) => {
    const configs = {
        uploaded: { icon: Clock, color: 'text-sky-400', bg: 'bg-sky-400/10', label: 'Enregistré' },
        processing: { icon: RefreshCw, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Parsing...' },
        parsed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10', label: count ? `${count} txn` : 'Analysé' },
        failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Échec' },
    };
    const cfg = configs[status];
    const Icon = cfg.icon;
    return (_jsxs("div", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${cfg.bg}`, children: [_jsx(Icon, { className: `w-3.5 h-3.5 ${cfg.color} ${status === 'processing' ? 'animate-spin' : ''}` }), _jsx("span", { className: `text-xs font-medium ${cfg.color}`, children: cfg.label })] }));
};
const FileTypeIcon = ({ filename, size = 40 }) => {
    const type = getFileType(filename);
    const configs = {
        pdf: { gradient: 'from-red-500 to-red-600', icon: FileText },
        excel: { gradient: 'from-green-500 to-green-600', icon: FileText },
        image: { gradient: 'from-purple-500 to-purple-600', icon: FileText },
        ofx: { gradient: 'from-sky-500 to-sky-600', icon: FileText },
        other: { gradient: 'from-slate-500 to-slate-600', icon: FileText },
    };
    const cfg = configs[type];
    const Icon = cfg.icon;
    return (_jsx("div", { className: `rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shrink-0`, style: { width: size, height: size }, children: _jsx(Icon, { className: "text-white", style: { width: size * 0.5, height: size * 0.5 } }) }));
};
// ─── Composant Parse Results ───────────────────────────────────────────────────
const ParseResultsPanel = ({ result, docId, onAnalyze, onApply, analyzing, applying }) => {
    const [showTxns, setShowTxns] = useState(false);
    const signals = result.teras_signals || {};
    const stats = result.quality_stats || {};
    return (_jsxs("div", { className: "mt-4 space-y-3", children: [_jsx("div", { className: "grid grid-cols-2 gap-2", children: [
                    { label: 'Revenu/mois', value: FCFA(signals.income_signal?.monthly_avg_xaf || 0), icon: DollarSign, color: 'text-emerald-400' },
                    { label: 'CRM estimé', value: FCFA(signals.crm_estimated_xaf || 0), icon: Wallet, color: 'text-sky-400' },
                    { label: 'Cashflow net', value: FCFA(stats.net_cashflow_xaf || 0), icon: BarChart3, color: 'text-violet-400' },
                    { label: 'Authenticité', value: `${Math.round((result.authenticity_score || 0) * 100)}%`, icon: Shield, color: 'text-amber-400' },
                ].map((k, i) => (_jsxs("div", { className: "bg-slate-800/50 border border-white/5 rounded-xl p-3", children: [_jsx("p", { className: "text-slate-500 text-xs mb-1", children: k.label }), _jsx("p", { className: `${k.color} font-bold text-sm`, children: k.value })] }, i))) }), result.recommendations?.length > 0 && (_jsx("div", { className: "space-y-1.5", children: result.recommendations.map((r, i) => (_jsxs("div", { className: `flex gap-2 px-3 py-2 rounded-lg text-xs ${r.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                        : r.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                            : 'bg-slate-800/60 border border-white/5 text-slate-400'}`, children: [_jsx("span", { className: "shrink-0", children: r.type === 'success' ? '✅' : r.type === 'warning' ? '⚠️' : 'ℹ️' }), r.message] }, i))) })), result.transactions && result.transactions.length > 0 && (_jsxs("div", { children: [_jsxs("button", { onClick: () => setShowTxns(!showTxns), className: "flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors", children: [showTxns ? _jsx(ChevronUp, { className: "w-3.5 h-3.5" }) : _jsx(ChevronDown, { className: "w-3.5 h-3.5" }), showTxns ? 'Masquer' : 'Voir', " les ", result.transactions.length, " transactions"] }), showTxns && (_jsx("div", { className: "mt-2 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/50", children: result.transactions.slice(0, 50).map((t, i) => (_jsxs("div", { className: `flex items-center gap-2 px-3 py-2 text-xs border-b border-white/5 ${i % 2 ? 'bg-white/2' : ''}`, children: [_jsx("span", { className: "text-slate-500 whitespace-nowrap", children: t.date }), _jsx("span", { className: "text-slate-300 flex-1 truncate", children: t.description }), _jsxs("span", { className: `font-medium whitespace-nowrap ${t.type === 'credit' ? 'text-green-400' : 'text-red-400'}`, children: [t.type === 'credit' ? '+' : '-', t.amount.toLocaleString('fr-FR')] })] }, i))) }))] })), _jsxs("div", { className: "flex gap-2 pt-1", children: [_jsx("button", { onClick: () => onAnalyze(docId), disabled: analyzing, className: "flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all", children: analyzing ? _jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }), " Analyse..."] })
                            : _jsxs(_Fragment, { children: [_jsx(Sparkles, { className: "w-3.5 h-3.5" }), " Analyser avec Claude Sonnet 4"] }) }), _jsxs("button", { onClick: () => onApply(docId), disabled: applying, className: "flex items-center gap-1.5 px-3 py-2 bg-violet-600/80 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all", children: [applying ? _jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : _jsx(TrendingUp, { className: "w-3.5 h-3.5" }), applying ? '' : 'Score'] })] }), result.generated_score && (_jsxs("div", { className: "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200", children: ["Score TERAS g\u00E9n\u00E9r\u00E9 : ", _jsxs("span", { className: "font-semibold", children: [result.generated_score.score, "/1000"] }), " \u00B7 Niveau ", result.generated_score.level] }))] }));
};
// ─── Composant Analyse IA ─────────────────────────────────────────────────────
const AIAnalysisPanel = ({ analysis }) => {
    const [expanded, setExpanded] = useState(true);
    if (!analysis)
        return null;
    const renderLines = (text) => text.split('\n').map((line, i) => {
        if (line.startsWith('## '))
            return _jsx("h3", { className: "text-sm font-bold text-purple-300 mt-3 mb-1", children: line.slice(3) }, i);
        if (line.startsWith('### '))
            return _jsx("h4", { className: "text-xs font-bold text-sky-300 mt-2 mb-0.5", children: line.slice(4) }, i);
        if (line.match(/^[-•]\s/))
            return (_jsxs("div", { className: "flex gap-2 ml-2 mt-0.5", children: [_jsx(Zap, { className: "w-3 h-3 text-purple-400 shrink-0 mt-0.5" }), _jsx("span", { className: "text-xs text-slate-300", children: line.slice(2) })] }, i));
        if (line.trim() === '')
            return _jsx("div", { className: "h-1" }, i);
        return _jsx("p", { className: "text-xs text-slate-300 leading-relaxed", children: line }, i);
    });
    return (_jsxs("div", { className: "mt-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl overflow-hidden", children: [_jsxs("button", { onClick: () => setExpanded(!expanded), className: "w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Sparkles, { className: "w-4 h-4 text-purple-400 animate-pulse" }), _jsx("span", { className: "text-sm font-semibold text-purple-300", children: "Analyse IA Claude Sonnet 4" })] }), expanded ? _jsx(ChevronUp, { className: "w-4 h-4 text-slate-400" }) : _jsx(ChevronDown, { className: "w-4 h-4 text-slate-400" })] }), expanded && (_jsx("div", { className: "px-4 pb-4 space-y-1 max-h-72 overflow-y-auto", children: renderLines(analysis) }))] }));
};
// ─── Composant Document Card ──────────────────────────────────────────────────
const DocumentCard = ({ doc, onDelete, onDownload, onPreview, onView, onAnalyze, onApply, isOpen, parseResult, analysis, analyzing, applying, }) => {
    const [showMenu, setShowMenu] = useState(false);
    const canAnalyze = doc.status !== 'processing' && doc.status !== 'failed';
    const canApply = doc.status === 'parsed' || Boolean(parseResult?.analysis_summary || parseResult?.generated_score);
    return (_jsxs("div", { className: `bg-slate-900/30 border rounded-2xl p-5 transition-all ${isOpen ? 'border-sky-500/40' : 'border-white/10 hover:border-sky-500/30'}`, children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx(FileTypeIcon, { filename: doc.filename }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setShowMenu(!showMenu), className: "p-2 hover:bg-white/5 rounded-lg transition text-slate-400", children: "\u22EE" }), showMenu && (_jsxs("div", { className: "absolute right-0 top-10 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-20 min-w-[160px]", onClick: () => setShowMenu(false), children: [_jsxs("button", { onClick: () => onPreview(doc.id), className: "w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2", children: [_jsx(Eye, { className: "w-4 h-4" }), " Visualiser"] }), doc.status === 'parsed' && (_jsx(_Fragment, { children: _jsxs("button", { onClick: () => onView(doc.id), className: "w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2", children: [_jsx(Eye, { className: "w-4 h-4" }), " Voir r\u00E9sultats"] }) })), canAnalyze && (_jsx(_Fragment, { children: _jsxs("button", { onClick: () => onAnalyze(doc.id), className: "w-full px-3 py-2 text-left text-sm text-purple-400 hover:bg-purple-500/10 flex items-center gap-2", children: [_jsx(Sparkles, { className: "w-4 h-4" }), " Analyser IA"] }) })), canApply && (_jsx(_Fragment, { children: _jsxs("button", { onClick: () => onApply(doc.id), className: "w-full px-3 py-2 text-left text-sm text-violet-400 hover:bg-violet-500/10 flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-4 h-4" }), " Appliquer au score"] }) })), _jsxs("button", { onClick: () => onDownload(doc.id), className: "w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2", children: [_jsx(Download, { className: "w-4 h-4" }), " T\u00E9l\u00E9charger"] }), _jsxs("button", { onClick: () => onDelete(doc.id), className: "w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2", children: [_jsx(Trash2, { className: "w-4 h-4" }), " Supprimer"] })] }))] })] }), _jsx("h3", { className: "font-semibold text-white mb-2 truncate text-sm", title: doc.filename, children: doc.filename }), doc.doc_type && (_jsx("div", { className: "mb-2", children: _jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300 border border-white/10", children: USER_DOC_TYPES.find(option => option.value === doc.doc_type)?.label || doc.doc_type }) })), _jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("span", { className: "text-xs text-slate-500", children: [doc.size_mb, " MB"] }), _jsx(StatusBadge, { status: doc.status, count: doc.transactions_count || undefined })] }), _jsx("div", { className: "text-xs text-slate-600 mb-3", children: new Date(doc.uploaded_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }), isOpen && parseResult && (_jsx(ParseResultsPanel, { result: parseResult, docId: doc.id, onAnalyze: onAnalyze, onApply: onApply, analyzing: analyzing, applying: applying })), analysis && isOpen && _jsx(AIAnalysisPanel, { analysis: analysis }), doc.status === 'parsed' && !isOpen && (_jsxs("div", { className: "grid grid-cols-2 gap-2 mt-2", children: [_jsxs("button", { onClick: () => onPreview(doc.id), className: "px-3 py-2 bg-slate-800/70 hover:bg-slate-800 border border-white/10 text-slate-200 text-xs rounded-lg transition flex items-center justify-center gap-2", children: [_jsx(Eye, { className: "w-3.5 h-3.5" }), " Visualiser"] }), _jsxs("button", { onClick: () => onView(doc.id), className: "px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 text-xs rounded-lg transition flex items-center justify-center gap-2", children: [_jsx(Sparkles, { className: "w-3.5 h-3.5" }), " Voir les r\u00E9sultats"] })] })), doc.status !== 'parsed' && (_jsxs("div", { className: "grid grid-cols-2 gap-2 mt-2", children: [_jsxs("button", { onClick: () => onPreview(doc.id), className: "px-3 py-2 bg-slate-800/70 hover:bg-slate-800 border border-white/10 text-slate-200 text-xs rounded-lg transition flex items-center justify-center gap-2", children: [_jsx(Eye, { className: "w-3.5 h-3.5" }), " Visualiser"] }), _jsxs("button", { onClick: () => onAnalyze(doc.id), disabled: !canAnalyze || analyzing, className: "px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 disabled:opacity-50 text-purple-300 text-xs rounded-lg transition flex items-center justify-center gap-2", children: [analyzing ? _jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : _jsx(Sparkles, { className: "w-3.5 h-3.5" }), analyzing ? 'Analyse...' : 'Analyser IA'] })] })), doc.status === 'processing' && (_jsxs("div", { className: "flex items-center gap-2 mt-2 text-xs text-amber-400", children: [_jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }), " Parsing en cours..."] })), doc.status === 'uploaded' && (_jsxs("div", { className: "flex items-center gap-2 mt-2 text-xs text-sky-400", children: [_jsx(CheckCircle, { className: "w-3.5 h-3.5" }), doc.doc_type === 'proof_asset'
                        ? "Document enregistré. Lancez l'analyse pour extraire les actifs et garanties."
                        : 'Document enregistré. Vous pouvez lancer une analyse structurée.'] }))] }));
};
// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function UserDocuments() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState([]);
    const [docType, setDocType] = useState('other');
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [openDocId, setOpenDocId] = useState(null);
    const [previewDocId, setPreviewDocId] = useState(null);
    const [parseResults, setParseResults] = useState({});
    const [analyses, setAnalyses] = useState({});
    const [analyzingId, setAnalyzingId] = useState(null);
    const [applyingId, setApplyingId] = useState(null);
    const [loadingId, setLoadingId] = useState(null);
    const fileRef = useRef(null);
    // ── Chargement ──────────────────────────────────────────────────────────────
    const loadDocuments = useCallback(async () => {
        try {
            const res = await authFetch('/api/scoring/user/documents/list/');
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
    useEffect(() => { loadDocuments(); }, [loadDocuments]);
    // Polling processing
    useEffect(() => {
        const processing = documents.filter(d => d.status === 'processing');
        if (!processing.length)
            return;
        const interval = setInterval(() => loadDocuments(), 3000);
        return () => clearInterval(interval);
    }, [documents, loadDocuments]);
    // ── Upload ──────────────────────────────────────────────────────────────────
    const handleUpload = async (files) => {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const pid = `${file.name}-${Date.now()}`;
            if (file.size > 15 * 1024 * 1024) {
                setError(`${file.name} trop volumineux (max 15 MB).`);
                continue;
            }
            setUploadProgress(prev => [...prev, { id: pid, name: file.name, progress: 0, status: 'uploading' }]);
            const fd = new FormData();
            fd.append('file', file);
            fd.append('doc_type', docType);
            const ticker = setInterval(() => {
                setUploadProgress(prev => prev.map(p => p.id === pid ? { ...p, progress: Math.min(p.progress + 8, 85) } : p));
            }, 250);
            try {
                const res = await authFetch('/api/scoring/user/documents/upload/', { method: 'POST', body: fd });
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
                }
                else if (data.status === 'processing') {
                    setSuccessMsg(data.message || '📤 Document enregistré, analyse en cours...');
                }
                else if (data.status === 'uploaded') {
                    setSuccessMsg(data.message || '✅ Document enregistré. Analyse structurée non applicable à ce type de pièce.');
                }
                else {
                    setError(data.message || data.error || `Analyse impossible pour "${file.name}"`);
                }
                setTimeout(() => setSuccessMsg(''), 5000);
                await loadDocuments();
            }
            catch {
                clearInterval(ticker);
                setUploadProgress(prev => prev.map(p => p.id === pid ? { ...p, status: 'error' } : p));
                setError(`Erreur upload : ${file.name}`);
            }
            finally {
                setTimeout(() => setUploadProgress(prev => prev.filter(p => p.id !== pid)), 4000);
            }
        }
    };
    // ── View (charger détails) ──────────────────────────────────────────────────
    const handleView = async (id) => {
        if (openDocId === id) {
            setOpenDocId(null);
            return;
        }
        setOpenDocId(id);
        if (parseResults[id])
            return;
        setLoadingId(id);
        try {
            const res = await authFetch(`/api/scoring/user/documents/${id}/?include_transactions=1`);
            const data = await res.json();
            setParseResults(prev => ({ ...prev, [id]: data }));
            if (data.analysis_text)
                setAnalyses(prev => ({ ...prev, [id]: data.analysis_text }));
        }
        catch {
            setError('Erreur chargement détails.');
        }
        finally {
            setLoadingId(null);
        }
    };
    // ── Analyse IA ──────────────────────────────────────────────────────────────
    const handleAnalyze = async (id) => {
        setAnalyzingId(id);
        if (openDocId !== id)
            setOpenDocId(id);
        try {
            const res = await authFetch(`/api/scoring/user/documents/${id}/analyze/`, { method: 'POST' });
            const data = await res.json();
            if (data.analysis)
                setAnalyses(prev => ({ ...prev, [id]: data.analysis }));
            if (data.analysis_summary) {
                setParseResults(prev => ({
                    ...prev,
                    [id]: {
                        ...(prev[id] || {}),
                        analysis_summary: data.analysis_summary,
                        processed_at: data.analyzed_at,
                    },
                }));
            }
            else if (!data.analysis) {
                setError(data.error || 'Analyse IA indisponible.');
            }
            await loadDocuments();
        }
        catch {
            setError('Erreur analyse IA.');
        }
        finally {
            setAnalyzingId(null);
        }
    };
    // ── Appliquer au score ──────────────────────────────────────────────────────
    const handleApply = async (id) => {
        setApplyingId(id);
        try {
            const res = await authFetch(`/api/scoring/user/documents/${id}/apply/`, { method: 'POST' });
            const data = await res.json();
            if (data.score) {
                setParseResults(prev => ({
                    ...prev,
                    [id]: {
                        ...(prev[id] || {}),
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
        }
        catch {
            setError('Erreur application au score.');
        }
        finally {
            setApplyingId(null);
        }
    };
    // ── Télécharger ─────────────────────────────────────────────────────────────
    const handleDownload = async (id) => {
        const doc = documents.find(d => d.id === id);
        const res = await authFetch(`/api/scoring/user/documents/${id}/download/`);
        if (!res.ok) {
            setError('Erreur téléchargement.');
            return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc?.filename || `document-${id}`;
        a.click();
        URL.revokeObjectURL(url);
    };
    // ── Supprimer ───────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        if (!confirm('Supprimer ce document ? Les données extraites seront également supprimées.'))
            return;
        await authFetch(`/api/scoring/user/documents/${id}/delete/`, { method: 'DELETE' });
        if (openDocId === id)
            setOpenDocId(null);
        loadDocuments();
    };
    const handleDrop = useCallback((files) => { setIsDragging(false); handleUpload(files); }, []);
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const previewDoc = documents.find(d => d.id === previewDocId) || null;
    const filtered = documents.filter(d => d.filename.toLowerCase().includes(searchQuery.toLowerCase()));
    // ─────────────────────────────────────────────────────────────────────────────
    // RENDU
    // ─────────────────────────────────────────────────────────────────────────────
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-[#0b1220] flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(RefreshCw, { className: "w-12 h-12 text-sky-400 animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "Chargement des documents..." })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-[#0b1220] p-6", children: [_jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center", children: _jsx(FileText, { className: "w-7 h-7 text-white" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Mes Documents" }), _jsx("p", { className: "text-slate-400", children: "Upload, parsing automatique et analyse IA Claude Sonnet 4" })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("span", { className: "text-slate-400 text-sm", children: [documents.length, " document", documents.length !== 1 ? 's' : ''] }), _jsxs("div", { className: "flex bg-slate-900/50 border border-white/10 rounded-lg p-1", children: [_jsx("button", { onClick: () => setViewMode('grid'), className: `p-2 rounded transition ${viewMode === 'grid' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`, children: _jsx(Grid, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => setViewMode('list'), className: `p-2 rounded transition ${viewMode === 'list' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`, children: _jsx(List, { className: "w-4 h-4" }) })] })] })] }), successMsg && (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-emerald-400 shrink-0" }), _jsx("p", { className: "text-emerald-300 text-sm", children: successMsg }), _jsx("button", { onClick: () => setSuccessMsg(''), className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-emerald-500" }) })] })), error && (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-red-400 shrink-0" }), _jsx("p", { className: "text-red-300 text-sm", children: error }), _jsx("button", { onClick: () => setError(''), className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-red-500" }) })] })), uploadProgress.length > 0 && (_jsx("div", { className: "mb-5 space-y-2", children: uploadProgress.map(p => (_jsxs("div", { className: "bg-slate-900/50 border border-white/10 rounded-xl p-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-1.5 text-sm", children: [_jsx("span", { className: "text-white truncate flex-1 mr-3", children: p.name }), _jsx("span", { className: "text-slate-400 shrink-0", children: p.status === 'complete' ? '✓' : p.status === 'error' ? '✗' : `${p.progress}%` })] }), _jsx("div", { className: "h-1.5 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full transition-all duration-300 ${p.status === 'complete' ? 'bg-green-500'
                                            : p.status === 'error' ? 'bg-red-500'
                                                : 'bg-gradient-to-r from-sky-500 to-blue-600'}`, style: { width: `${p.progress}%` } }) })] }, p.id))) })), _jsxs("div", { className: "mb-4 max-w-sm", children: [_jsx("label", { className: "block text-xs font-medium text-slate-400 mb-1.5", children: "Type de document \u00E0 uploader" }), _jsx("select", { value: docType, onChange: e => setDocType(e.target.value), className: "w-full px-3 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500", children: USER_DOC_TYPES.map(option => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("div", { onDrop: e => { e.preventDefault(); handleDrop(e.dataTransfer.files); }, onDragOver: handleDragOver, onDragLeave: handleDragLeave, className: `relative border-2 border-dashed rounded-2xl p-10 text-center transition-all mb-6 ${isDragging
                            ? 'border-sky-500 bg-sky-500/10 scale-[1.01]'
                            : 'border-white/10 hover:border-white/20 bg-slate-900/30'}`, children: [_jsx("input", { ref: fileRef, type: "file", multiple: true, accept: ".pdf,.xlsx,.xls,.csv,.ofx,.qif,.sta,.mt940,.jpg,.jpeg,.png", onChange: e => e.target.files && handleUpload(e.target.files), className: "hidden" }), _jsx("div", { className: "w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30 flex items-center justify-center", children: _jsx(Upload, { className: "w-8 h-8 text-sky-400" }) }), _jsx("h3", { className: "text-lg font-semibold text-white mb-2", children: isDragging ? 'Déposez vos fichiers ici' : 'Glissez-déposez vos documents' }), _jsxs("p", { className: "text-slate-400 text-sm mb-4", children: ["ou", ' ', _jsx("button", { onClick: () => fileRef.current?.click(), className: "text-sky-400 hover:text-sky-300 underline font-semibold", children: "parcourez" })] }), _jsx("div", { className: "flex flex-wrap justify-center gap-2 mb-3", children: ['PDF', 'Excel', 'CSV', 'OFX', 'MT940', 'Images'].map(f => (_jsx("span", { className: "px-2.5 py-1 bg-slate-800/60 border border-white/10 rounded-full text-xs text-slate-400", children: f }, f))) }), _jsxs("div", { className: "flex items-center justify-center gap-2 text-sm text-slate-500", children: [_jsx(Sparkles, { className: "w-4 h-4 text-purple-400" }), _jsx("span", { children: "Parsing automatique \u00B7 Analyse IA Claude Sonnet 4 \u00B7 Max 15 MB" })] })] }), _jsxs("div", { className: "relative mb-6", children: [_jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { type: "text", placeholder: "Rechercher un document...", value: searchQuery, onChange: e => setSearchQuery(e.target.value), className: "w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition" })] }), filtered.length === 0 ? (_jsxs("div", { className: "text-center py-16 bg-slate-900/30 border border-white/10 rounded-2xl", children: [_jsx(FileText, { className: "w-14 h-14 text-slate-600 mx-auto mb-4" }), _jsx("h3", { className: "text-xl font-semibold text-white mb-2", children: "Aucun document" }), _jsx("p", { className: "text-slate-400 text-sm", children: searchQuery ? 'Aucun document ne correspond à votre recherche'
                                    : 'Ajoutez vos documents financiers, pièces d’identité et preuves d’actifs pour enrichir votre score TERAS' })] })) : (_jsx("div", { className: `grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`, children: filtered.map(doc => (_jsx(DocumentCard, { doc: doc, onDelete: handleDelete, onDownload: handleDownload, onPreview: setPreviewDocId, onView: handleView, onAnalyze: handleAnalyze, onApply: handleApply, isOpen: openDocId === doc.id, parseResult: parseResults[doc.id] || null, analysis: analyses[doc.id] || '', analyzing: analyzingId === doc.id, applying: applyingId === doc.id }, doc.id))) }))] }), _jsx(DocumentPreviewModal, { isOpen: !!previewDoc, title: previewDoc ? `Document utilisateur — ${previewDoc.filename}` : '', fileName: previewDoc?.filename || '', sourceUrl: previewDoc ? `/api/scoring/user/documents/${previewDoc.id}/download/` : '', mode: "auth-fetch", onClose: () => setPreviewDocId(null), onDownload: () => {
                    if (previewDoc)
                        handleDownload(previewDoc.id);
                } })] }));
}
