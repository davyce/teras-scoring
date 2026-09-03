import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { authFetch } from '../../utils/authFetch';
/**
 * AdminDocumentViewer.tsx - Viewer de documents PDF
 * Affichage PDF avec analyse IA et actions administrateur
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Download, CheckCircle, X, AlertCircle, Sparkles, Loader2, } from 'lucide-react';
function isPdf(url) {
    return url.toLowerCase().split('?')[0].endsWith('.pdf');
}
function isImage(url) {
    const clean = url.toLowerCase().split('?')[0];
    return clean.endsWith('.png') || clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.webp');
}
export default function AdminDocumentViewer() {
    const { docId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [document, setDocument] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [notice, setNotice] = useState(null);
    useEffect(() => {
        (async () => {
            try {
                const res = await authFetch(`/api/scoring/admin/documents/${docId}/`);
                if (!res.ok)
                    throw new Error(`Erreur ${res.status}`);
                const data = await res.json();
                setDocument(data.document ?? data);
            }
            catch (e) {
                console.error('Erreur doc:', e.message);
                setNotice({ type: 'error', text: e?.message || 'Impossible de charger le document.' });
            }
            finally {
                setLoading(false);
            }
        })();
    }, [docId]);
    const handleAnalyze = async () => {
        if (!document)
            return;
        setAnalyzing(true);
        setNotice(null);
        try {
            const res = await authFetch(`/api/scoring/admin/documents/${document.id}/analyze/`, { method: 'POST' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setNotice({
                    type: 'error',
                    text: data.error || data.detail || "Analyse admin indisponible pour ce document.",
                });
                return;
            }
            const summary = data.analysis_summary || data.analysis || data;
            setDocument(prev => prev ? {
                ...prev,
                analysis: {
                    document_type: data.doc_type || data.document_type || prev.type || 'Document',
                    confidence: Number(data.confidence ?? summary?.score_impact?.confidence ?? 0),
                    extracted_data: data.extracted_data || data.teras_signals || summary || {},
                    anomalies: data.errors || summary?.anomalies || [],
                },
            } : null);
            setNotice({ type: 'success', text: "Analyse documentaire chargée." });
        }
        catch (e) {
            setNotice({ type: 'error', text: e?.message || "Analyse documentaire impossible." });
        }
        finally {
            setAnalyzing(false);
        }
    };
    const handleApprove = async () => {
        if (!confirm('Approuver ce document ?') || !document)
            return;
        try {
            const res = await authFetch(`/api/scoring/admin/documents/${document.id}/approve/`, { method: 'POST' });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setDocument(prev => prev ? { ...prev, status: 'verified' } : null);
                setNotice({ type: 'success', text: 'Document approuvé.' });
            }
            else {
                setNotice({ type: 'error', text: data.error || data.detail || "Approbation impossible." });
            }
        }
        catch (e) {
            console.error(e);
            setNotice({ type: 'error', text: e?.message || "Approbation impossible." });
        }
    };
    const handleReject = async () => {
        if (!rejectReason.trim()) {
            setNotice({ type: 'error', text: 'Veuillez indiquer la raison du rejet.' });
            return;
        }
        if (!document)
            return;
        try {
            const res = await authFetch(`/api/scoring/admin/documents/${document.id}/reject/`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectReason }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setDocument(prev => prev ? { ...prev, status: 'rejected' } : null);
                setShowRejectModal(false);
                setRejectReason('');
                setNotice({ type: 'success', text: 'Document rejeté et motif enregistré.' });
            }
            else {
                setNotice({ type: 'error', text: data.error || data.detail || "Rejet impossible." });
            }
        }
        catch (e) {
            console.error(e);
            setNotice({ type: 'error', text: e?.message || "Rejet impossible." });
        }
    };
    const openFile = () => {
        if (document?.file_url)
            window.open(document.file_url, '_blank', 'noopener,noreferrer');
    };
    if (loading) {
        return (_jsx("div", { className: "p-12 text-center", children: _jsx("div", { className: "animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" }) }));
    }
    if (!document) {
        return (_jsxs("div", { className: "p-12 text-center", children: [_jsx(AlertCircle, { className: "w-16 h-16 text-red-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Document non trouv\u00E9" })] }));
    }
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsxs("button", { onClick: () => navigate('/admin/validation'), className: "flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4", children: [_jsx(ArrowLeft, { className: "w-5 h-5" }), "Retour \u00E0 la validation"] }), _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3", children: [_jsx(FileText, { className: "w-8 h-8 text-blue-600" }), "Viewer de Document"] }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mt-2", children: document.title })] }), _jsxs("div", { className: "flex items-center gap-3", children: [document.status === 'pending' && (_jsx("span", { className: "px-4 py-2 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-lg font-medium", children: "En attente" })), document.status === 'verified' && (_jsx("span", { className: "px-4 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-lg font-medium", children: "V\u00E9rifi\u00E9" })), document.status === 'rejected' && (_jsx("span", { className: "px-4 py-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg font-medium", children: "Rejet\u00E9" }))] })] })] }), notice && (_jsxs("div", { className: `flex items-start gap-3 rounded-xl border px-4 py-3 ${notice.type === 'success'
                    ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300'
                    : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'}`, children: [notice.type === 'success' ? (_jsx(CheckCircle, { className: "w-5 h-5 mt-0.5 flex-shrink-0" })) : (_jsx(AlertCircle, { className: "w-5 h-5 mt-0.5 flex-shrink-0" })), _jsx("p", { className: "text-sm font-medium", children: notice.text })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden", children: [_jsxs("div", { className: "p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between", children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: "Aper\u00E7u du document" }), _jsxs("button", { onClick: openFile, disabled: !document.file_url, className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx(Download, { className: "w-4 h-4" }), "T\u00E9l\u00E9charger"] })] }), _jsx("div", { className: "bg-gray-100 dark:bg-gray-900 p-8 min-h-[600px] flex items-center justify-center", children: document.file_url && isPdf(document.file_url) ? (_jsx("iframe", { title: document.title, src: document.file_url, className: "w-full h-[600px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white" })) : document.file_url && isImage(document.file_url) ? (_jsx("img", { src: document.file_url, alt: document.title, className: "max-h-[600px] w-full object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-white" })) : (_jsxs("div", { className: "text-center", children: [_jsx(FileText, { className: "w-24 h-24 text-gray-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Pr\u00E9visualisation indisponible pour ce format" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-500 mt-2", children: document.file_url || 'Aucun fichier lié' })] })) })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700", children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white mb-4", children: "Informations" }), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Type" }), _jsx("p", { className: "text-gray-900 dark:text-white font-medium", children: document.type })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Upload\u00E9 par" }), _jsx("p", { className: "text-gray-900 dark:text-white font-medium", children: document.uploaded_by })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Date" }), _jsx("p", { className: "text-gray-900 dark:text-white font-medium", children: new Date(document.uploaded_at).toLocaleDateString('fr-FR') })] })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [_jsx(Sparkles, { className: "w-5 h-5 text-purple-600" }), "Analyse IA"] }), !document.analysis && (_jsx("button", { onClick: handleAnalyze, disabled: analyzing, className: "px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50", children: analyzing ? 'Analyse...' : 'Analyser' }))] }), analyzing && (_jsxs("div", { className: "text-center py-8", children: [_jsx(Loader2, { className: "w-10 h-10 text-purple-600 animate-spin mx-auto mb-3" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Analyse en cours..." })] })), document.analysis && !analyzing && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-1", children: "Type d\u00E9tect\u00E9" }), _jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: document.analysis.document_type }), _jsxs("p", { className: "text-sm text-green-600 dark:text-green-400 mt-1", children: ["Confiance: ", (document.analysis.confidence * 100).toFixed(0), "%"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-2", children: "Donn\u00E9es extraites" }), _jsx("div", { className: "bg-gray-50 dark:bg-gray-700 p-3 rounded-lg space-y-2 text-sm", children: Object.entries(document.analysis.extracted_data).map(([key, value]) => (_jsxs("div", { className: "flex justify-between", children: [_jsxs("span", { className: "text-gray-600 dark:text-gray-400 capitalize", children: [key.replace(/_/g, ' '), ":"] }), _jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: typeof value === 'object' ? JSON.stringify(value) : String(value) })] }, key))) })] }), document.analysis.anomalies.length > 0 && (_jsxs("div", { children: [_jsxs("p", { className: "text-sm text-red-600 dark:text-red-400 mb-2 flex items-center gap-1", children: [_jsx(AlertCircle, { className: "w-4 h-4" }), "Anomalies d\u00E9tect\u00E9es"] }), _jsx("ul", { className: "space-y-1 text-sm", children: document.analysis.anomalies.map((anomaly, i) => (_jsxs("li", { className: "text-gray-700 dark:text-gray-300", children: ["\u2022 ", anomaly] }, i))) })] }))] })), !document.analysis && !analyzing && (_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 text-center py-4", children: "Aucune analyse disponible" }))] }), document.status === 'pending' && (_jsxs("div", { className: "space-y-3", children: [_jsxs("button", { onClick: handleApprove, className: "w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700", children: [_jsx(CheckCircle, { className: "w-5 h-5" }), "Approuver"] }), _jsxs("button", { onClick: () => setShowRejectModal(true), className: "w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700", children: [_jsx(X, { className: "w-5 h-5" }), "Rejeter"] })] }))] })] }), showRejectModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6", children: [_jsx("h3", { className: "text-xl font-bold text-gray-900 dark:text-white mb-4", children: "Raison du rejet" }), _jsx("textarea", { value: rejectReason, onChange: (e) => setRejectReason(e.target.value), placeholder: "Expliquez pourquoi ce document est rejet\u00E9...", rows: 4, className: "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none" }), _jsxs("div", { className: "flex gap-3 mt-4", children: [_jsx("button", { onClick: () => setShowRejectModal(false), className: "flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700", children: "Annuler" }), _jsx("button", { onClick: handleReject, className: "flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700", children: "Rejeter" })] })] }) }))] }));
}
