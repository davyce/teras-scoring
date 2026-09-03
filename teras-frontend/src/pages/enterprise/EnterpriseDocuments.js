import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Brain, ChevronDown, ChevronUp, CheckCircle, Eye, Download, FileSpreadsheet, FileText, Loader2, RefreshCw, Search, TrendingUp, Upload, X, } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import DocumentPreviewModal from '../../components/shared/DocumentPreviewModal';
const CATEGORY_OPTIONS = [
    { value: 'tax_filing', label: 'Déclaration fiscale' },
    { value: 'balance_sheet', label: 'Bilan comptable' },
    { value: 'invoice', label: 'Facture' },
    { value: 'payroll', label: 'Fiche de paie' },
    { value: 'bank_statement', label: 'Relevé bancaire' },
    { value: 'contract', label: 'Contrat' },
    { value: 'other', label: 'Autre / actif / titre' },
];
const STATUS_CLASSES = {
    pending: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    processing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    validated: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};
const formatBytes = (value) => {
    if (!value)
        return '0 KB';
    if (value < 1024)
        return `${value} B`;
    if (value < 1024 * 1024)
        return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
};
const normalizeListPayload = (data) => {
    if (Array.isArray(data))
        return data;
    if (Array.isArray(data?.results))
        return data.results;
    if (Array.isArray(data?.documents))
        return data.documents;
    return [];
};
export default function EnterpriseDocuments() {
    const [documents, setDocuments] = useState([]);
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
    const [previewDocId, setPreviewDocId] = useState(null);
    const [analyzingId, setAnalyzingId] = useState(null);
    const [applyingId, setApplyingId] = useState(null);
    const [expandedAnalysisIds, setExpandedAnalysisIds] = useState([]);
    const fileRef = useRef(null);
    const loadDocuments = useCallback(async () => {
        try {
            const res = await authFetch('/api/scoring/enterprise/documents/');
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || `Erreur ${res.status}`);
            setDocuments(normalizeListPayload(data));
        }
        catch (err) {
            setError(err?.message || 'Erreur chargement documents entreprise.');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);
    const handleUpload = async (files) => {
        if (!files?.length)
            return;
        setUploading(true);
        setError('');
        let uploadedCount = 0;
        try {
            for (const file of Array.from(files)) {
                const form = new FormData();
                form.append('file', file);
                form.append('category', category);
                form.append('title', title.trim() || file.name.replace(/\.[^.]+$/, ''));
                if (period.trim())
                    form.append('period', period.trim());
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
            setSuccessMsg(uploadedCount > 1
                ? `✅ ${uploadedCount} documents entreprise enregistrés.`
                : '✅ Document entreprise enregistré.');
            setTitle('');
            await loadDocuments();
        }
        catch (err) {
            setError(err?.message || 'Erreur upload document entreprise.');
        }
        finally {
            setUploading(false);
            setTimeout(() => setSuccessMsg(''), 5000);
            if (fileRef.current)
                fileRef.current.value = '';
        }
    };
    const handleDownload = (doc) => {
        if (!doc.file_url) {
            setError('Téléchargement indisponible pour ce document.');
            return;
        }
        window.open(doc.file_url, '_blank', 'noopener,noreferrer');
    };
    const handleAnalyze = async (doc) => {
        setAnalyzingId(doc.id);
        setError('');
        try {
            const res = await authFetch(`/api/scoring/enterprise/documents/${doc.id}/analyze/`, {
                method: 'POST',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data.error || `Erreur ${res.status}`);
            setSuccessMsg(data.message || `✅ Analyse prête pour ${doc.title}.`);
            setExpandedAnalysisIds(prev => (prev.includes(doc.id) ? prev : [doc.id, ...prev]));
            await loadDocuments();
        }
        catch (err) {
            setError(err?.message || 'Erreur analyse document entreprise.');
        }
        finally {
            setAnalyzingId(null);
            setTimeout(() => setSuccessMsg(''), 5000);
        }
    };
    const handleApply = async (doc) => {
        setApplyingId(doc.id);
        setError('');
        try {
            const res = await authFetch(`/api/scoring/enterprise/documents/${doc.id}/apply/`, {
                method: 'POST',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data.error || `Erreur ${res.status}`);
            const scoreValue = data.score?.value ? ` Score: ${data.score.value}/1000.` : '';
            setSuccessMsg(`${data.message || '✅ Analyse appliquée au moteur TERAS.'}${scoreValue}`);
            setExpandedAnalysisIds(prev => (prev.includes(doc.id) ? prev : [doc.id, ...prev]));
            await loadDocuments();
        }
        catch (err) {
            setError(err?.message || 'Erreur application au moteur TERAS.');
        }
        finally {
            setApplyingId(null);
            setTimeout(() => setSuccessMsg(''), 6000);
        }
    };
    const filtered = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.period || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.category_display.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
        const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
        const matchesAnalysis = filterAnalysis === 'all' ||
            (filterAnalysis === 'not_analyzed' && !doc.analysis_summary) ||
            (filterAnalysis === 'analyzed' && !!doc.analysis_summary) ||
            (filterAnalysis === 'applied' && !!doc.analysis_summary?.applied_to_teras);
        return matchesSearch && matchesCategory && matchesStatus && matchesAnalysis;
    });
    const toggleAnalysis = (docId) => {
        setExpandedAnalysisIds(prev => prev.includes(docId)
            ? prev.filter(id => id !== docId)
            : [docId, ...prev]);
    };
    const validatedCount = documents.filter(doc => doc.status === 'validated').length;
    const processingCount = documents.filter(doc => doc.status === 'processing').length;
    const analyzedCount = documents.filter(doc => !!doc.analysis_summary).length;
    const appliedCount = documents.filter(doc => !!doc.analysis_summary?.applied_to_teras).length;
    const previewDoc = documents.find(doc => doc.id === previewDocId) || null;
    return (_jsxs("div", { className: "min-h-screen bg-[#0b1220] text-white p-6", children: [_jsxs("div", { className: "max-w-7xl mx-auto space-y-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2", children: "TERAS Entreprise" }), _jsx("h1", { className: "text-3xl font-black", children: "Documents Entreprise" }), _jsx("p", { className: "text-slate-400 mt-1 text-sm", children: "D\u00E9posez vos pi\u00E8ces m\u00E9tier r\u00E9elles. Cette interface enregistre et suit les documents entreprise sans forcer le pipeline bancaire." })] }), successMsg && (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 bg-emerald-900/30 border border-emerald-700/40 rounded-xl", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-emerald-400 shrink-0" }), _jsx("p", { className: "text-emerald-300 text-sm", children: successMsg }), _jsx("button", { onClick: () => setSuccessMsg(''), className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-emerald-500" }) })] })), error && (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 bg-rose-900/20 border border-rose-700/40 rounded-xl", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-rose-400 shrink-0" }), _jsx("p", { className: "text-rose-300 text-sm", children: error }), _jsx("button", { onClick: () => setError(''), className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-rose-500" }) })] })), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-3", children: [
                            { label: 'Total docs', value: documents.length, color: 'text-sky-400' },
                            { label: 'Validés', value: validatedCount, color: 'text-emerald-400' },
                            { label: 'Analysés IA', value: analyzedCount, color: 'text-violet-400' },
                            { label: 'Appliqués TERAS', value: appliedCount, color: 'text-cyan-400' },
                            { label: 'En traitement', value: processingCount, color: 'text-amber-400' },
                        ].map(stat => (_jsxs("div", { className: "bg-slate-900/60 border border-slate-800 rounded-xl p-4", children: [_jsx("p", { className: `text-2xl font-black ${stat.color}`, children: stat.value }), _jsx("p", { className: "text-slate-500 text-xs mt-0.5", children: stat.label })] }, stat.label))) }), _jsxs("div", { className: "bg-slate-900/60 border border-slate-800 rounded-2xl p-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-slate-400 mb-1.5", children: "Cat\u00E9gorie" }), _jsx("select", { value: category, onChange: e => setCategory(e.target.value), className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500", children: CATEGORY_OPTIONS.map(option => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-slate-400 mb-1.5", children: "Titre personnalis\u00E9" }), _jsx("input", { value: title, onChange: e => setTitle(e.target.value), placeholder: "Ex: Bilan T1 2026", className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-600" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-slate-400 mb-1.5", children: "P\u00E9riode" }), _jsx("input", { value: period, onChange: e => setPeriod(e.target.value), placeholder: "Ex: 2026-Q1", className: "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-600" })] })] }), _jsxs("div", { onDragOver: e => { e.preventDefault(); setIsDragging(true); }, onDragLeave: () => setIsDragging(false), onDrop: e => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files); }, onClick: () => !uploading && fileRef.current?.click(), className: `border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${isDragging ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/40'}`, children: [_jsx("input", { ref: fileRef, type: "file", multiple: true, accept: ".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg", className: "hidden", onChange: e => handleUpload(e.target.files) }), uploading ? (_jsxs("div", { className: "flex items-center justify-center gap-2 text-cyan-400", children: [_jsx(Loader2, { className: "w-5 h-5 animate-spin" }), " Upload en cours..."] })) : (_jsxs("div", { className: "space-y-2", children: [_jsx(Upload, { className: "w-8 h-8 text-cyan-400 mx-auto" }), _jsx("p", { className: "text-white text-sm font-medium", children: "Glissez-d\u00E9posez ou cliquez pour uploader" }), _jsx("p", { className: "text-slate-500 text-xs", children: "PDF \u00B7 Excel \u00B7 CSV \u00B7 DOC/DOCX \u00B7 Images" })] }))] })] }), _jsxs("div", { className: "bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 text-sm text-sky-200", children: ["Les documents entreprise sont stock\u00E9s sans co\u00FBt IA automatique. L\u2019analyse ne part que quand vous cliquez sur ", _jsx("span", { className: "font-semibold", children: "Analyser avec IA" }), ", puis ", _jsx("span", { className: "font-semibold", children: "Appliquer au moteur TERAS" }), " envoie les signaux utiles vers le score et le dashboard, y compris les ", _jsx("span", { className: "font-semibold", children: "biens d\u00E9clar\u00E9s" }), ", les ", _jsx("span", { className: "font-semibold", children: "titres" }), " et les ", _jsx("span", { className: "font-semibold", children: "factures" }), "."] }), _jsxs("div", { className: "flex flex-col md:flex-row gap-3", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { value: searchQuery, onChange: e => setSearchQuery(e.target.value), placeholder: "Rechercher un document...", className: "w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-600" })] }), _jsxs("select", { value: filterCategory, onChange: e => setFilterCategory(e.target.value), className: "px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500", children: [_jsx("option", { value: "all", children: "Toutes cat\u00E9gories" }), CATEGORY_OPTIONS.map(option => (_jsx("option", { value: option.value, children: option.label }, option.value)))] }), _jsxs("select", { value: filterStatus, onChange: e => setFilterStatus(e.target.value), className: "px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500", children: [_jsx("option", { value: "all", children: "Tous statuts" }), _jsx("option", { value: "pending", children: "En attente" }), _jsx("option", { value: "processing", children: "En traitement" }), _jsx("option", { value: "validated", children: "Valid\u00E9" }), _jsx("option", { value: "rejected", children: "Rejet\u00E9" })] }), _jsxs("select", { value: filterAnalysis, onChange: e => setFilterAnalysis(e.target.value), className: "px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500", children: [_jsx("option", { value: "all", children: "Toutes analyses" }), _jsx("option", { value: "not_analyzed", children: "\u00C0 analyser" }), _jsx("option", { value: "analyzed", children: "Analys\u00E9s" }), _jsx("option", { value: "applied", children: "Appliqu\u00E9s TERAS" })] }), analyzedCount > 0 && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setExpandedAnalysisIds([]), className: "px-3 py-2.5 bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition text-sm whitespace-nowrap", children: "R\u00E9duire" }), _jsx("button", { onClick: () => setExpandedAnalysisIds(filtered.filter(doc => doc.analysis_summary).map(doc => doc.id)), className: "px-3 py-2.5 bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition text-sm whitespace-nowrap", children: "D\u00E9ployer" })] })), _jsx("button", { onClick: loadDocuments, className: "p-2.5 bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition", children: _jsx(RefreshCw, { className: "w-4 h-4" }) })] }), loading ? (_jsxs("div", { className: "flex items-center justify-center py-12", children: [_jsx(Loader2, { className: "w-5 h-5 text-cyan-400 animate-spin mr-2" }), _jsx("span", { className: "text-slate-400", children: "Chargement..." })] })) : filtered.length === 0 ? (_jsxs("div", { className: "text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl", children: [_jsx(FileText, { className: "w-12 h-12 text-slate-700 mx-auto mb-3" }), _jsx("p", { className: "text-slate-400 font-medium", children: "Aucun document entreprise" }), _jsx("p", { className: "text-slate-600 text-sm mt-1", children: "Ajoute un bilan, une facture, un contrat ou un relev\u00E9 bancaire." })] })) : (_jsx("div", { className: "space-y-3", children: filtered.map(doc => {
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
                            return (_jsxs("div", { className: "bg-slate-900/60 border border-slate-800 rounded-2xl p-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0", children: doc.file?.endsWith('.xlsx') || doc.file?.endsWith('.xls') || doc.file?.endsWith('.csv')
                                                    ? _jsx(FileSpreadsheet, { className: "w-5 h-5 text-cyan-400" })
                                                    : _jsx(FileText, { className: "w-5 h-5 text-cyan-400" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("p", { className: "text-white text-sm font-semibold truncate", children: doc.title }), _jsx("span", { className: "px-2 py-0.5 rounded-lg text-[11px] bg-slate-800 text-slate-300 border border-white/10", children: doc.category_display }), roleLabel && (_jsx("span", { className: "px-2 py-0.5 rounded-lg text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20", children: roleLabel })), _jsx("span", { className: `px-2 py-0.5 rounded-lg text-[11px] border ${STATUS_CLASSES[doc.status] || STATUS_CLASSES.pending}`, children: doc.status_display })] }), _jsxs("div", { className: "flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap", children: [_jsx("span", { children: formatBytes(doc.file_size) }), doc.period && _jsxs("span", { children: ["P\u00E9riode: ", doc.period] }), _jsx("span", { children: new Date(doc.uploaded_at).toLocaleDateString('fr-FR') })] })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [_jsxs("button", { onClick: () => handleAnalyze(doc), disabled: analyzingId === doc.id, className: "flex items-center gap-2 px-3 py-2 bg-violet-500/10 hover:bg-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed border border-violet-500/20 rounded-xl text-violet-300 text-sm transition", children: [analyzingId === doc.id ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(Brain, { className: "w-4 h-4" }), "Analyser"] }), _jsxs("button", { onClick: () => handleApply(doc), disabled: !doc.analysis_summary || applyingId === doc.id, className: "flex items-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-500/20 rounded-xl text-emerald-300 text-sm transition", children: [applyingId === doc.id ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(TrendingUp, { className: "w-4 h-4" }), "Appliquer"] }), _jsxs("button", { onClick: () => setPreviewDocId(doc.id), disabled: !doc.file_url, className: "flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-xl text-slate-200 text-sm transition", children: [_jsx(Eye, { className: "w-4 h-4" }), " Visualiser"] }), _jsxs("button", { onClick: () => handleDownload(doc), className: "flex items-center gap-2 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl text-cyan-400 text-sm transition", children: [_jsx(Download, { className: "w-4 h-4" }), " T\u00E9l\u00E9charger"] })] })] }), doc.analysis_summary && (_jsxs("div", { className: "mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "px-2 py-1 rounded-lg text-[11px] bg-violet-500/10 text-violet-300 border border-violet-500/20", children: "Analyse pr\u00EAte" }), doc.analysis_summary.applied_to_teras && (_jsx("span", { className: "px-2 py-1 rounded-lg text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20", children: "Appliqu\u00E9 au moteur TERAS" })), doc.processed_at && (_jsxs("span", { className: "text-[11px] text-slate-500", children: ["Trait\u00E9 le ", new Date(doc.processed_at).toLocaleDateString('fr-FR')] }))] }), _jsxs("button", { onClick: () => toggleAnalysis(doc.id), className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/40 transition text-xs", children: [isAnalysisOpen ? _jsx(ChevronUp, { className: "w-3.5 h-3.5" }) : _jsx(ChevronDown, { className: "w-3.5 h-3.5" }), isAnalysisOpen ? 'Réduire' : 'Voir détails'] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: visibleMetricCards.map(card => (_jsxs("div", { className: "bg-slate-900/70 border border-white/5 rounded-xl p-3", children: [_jsx("p", { className: "text-slate-500 text-[11px] mb-1", children: card.label }), _jsx("p", { className: `${card.className} text-sm font-semibold`, children: card.value })] }, `${doc.id}-${card.label}`))) }), isAnalysisOpen && (_jsxs(_Fragment, { children: [((metrics.asset_items_count || 0) > 0 || (metrics.collateral_value_xaf || 0) > 0 || (signals.asset_proof_types || []).length > 0) && (_jsxs("div", { className: "rounded-xl bg-slate-900/70 border border-white/5 p-3 space-y-2", children: [_jsx("p", { className: "text-slate-500 text-[11px] uppercase tracking-wider", children: "Lecture actifs" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3 text-sm", children: [_jsxs("p", { className: "text-slate-200", children: ["Actifs recens\u00E9s : ", _jsx("span", { className: "font-semibold text-white", children: metrics.asset_items_count || 0 })] }), _jsxs("p", { className: "text-slate-200", children: ["Garantie mobilisable : ", _jsx("span", { className: "font-semibold text-white", children: `${Math.round(metrics.collateral_value_xaf || 0).toLocaleString('fr-FR')} FCFA` })] }), _jsxs("p", { className: "text-slate-200", children: ["Preuve forte : ", _jsx("span", { className: "font-semibold text-white", children: signals.collateral_eligible ? 'Oui' : 'À confirmer' })] })] }), (signals.asset_proof_types || []).length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2", children: (signals.asset_proof_types || []).map((proofType) => (_jsx("span", { className: "px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px]", children: proofType }, `${doc.id}-${proofType}`))) }))] })), metrics.invoice_amount_xaf ? (_jsxs("div", { className: "rounded-xl bg-slate-900/70 border border-white/5 p-3", children: [_jsx("p", { className: "text-slate-500 text-[11px] uppercase tracking-wider mb-2", children: "Lecture facturation" }), _jsxs("p", { className: "text-sm text-slate-200", children: ["Cette pi\u00E8ce documente au moins ", _jsx("span", { className: "font-semibold text-white", children: `${Math.round(metrics.invoice_amount_xaf || 0).toLocaleString('fr-FR')} FCFA` }), " de chiffre d\u2019affaires brut sur la facture analys\u00E9e."] })] })) : null, doc.analysis_summary.analysis_text && (_jsxs("div", { className: "rounded-xl bg-slate-900/70 border border-white/5 p-3", children: [_jsx("p", { className: "text-slate-500 text-[11px] uppercase tracking-wider mb-2", children: "Synth\u00E8se IA" }), _jsx("p", { className: "text-sm text-slate-200 leading-relaxed whitespace-pre-line", children: doc.analysis_summary.analysis_text })] })), (doc.analysis_summary.recommended_actions || []).length > 0 && (_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-slate-500 text-[11px] uppercase tracking-wider", children: "Actions recommand\u00E9es" }), (doc.analysis_summary.recommended_actions || []).slice(0, 3).map((action, index) => (_jsxs("div", { className: "text-sm text-slate-300 flex gap-2", children: [_jsx("span", { className: "text-cyan-400 shrink-0", children: "\u2022" }), _jsx("span", { children: action })] }, `${doc.id}-action-${index}`)))] }))] }))] }))] }, doc.id));
                        }) }))] }), _jsx(DocumentPreviewModal, { isOpen: !!previewDoc, title: previewDoc ? `Document entreprise — ${previewDoc.title}` : '', fileName: previewDoc?.file ? previewDoc.file.split('/').pop() || previewDoc.title : previewDoc?.title || '', sourceUrl: previewDoc?.file_url || '', mode: "direct-url", onClose: () => setPreviewDocId(null), onDownload: () => {
                    if (previewDoc)
                        handleDownload(previewDoc);
                } })] }));
}
