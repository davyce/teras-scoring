import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * AdminLegislation.tsx - Gestion Législation CEMAC avec IA
 * VERSION COMPLÈTE avec upload fichiers + analyse Claude Sonnet 4
 */
import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Download, Eye, Trash2, FileText, CheckCircle, X, Upload, Sparkles, Loader2, AlertCircle, File, FileSpreadsheet, } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
const DOCUMENT_TYPES = {
    law: { label: 'Loi', color: 'bg-blue-500' },
    regulation: { label: 'Règlement', color: 'bg-purple-500' },
    directive: { label: 'Directive', color: 'bg-green-500' },
    circular: { label: 'Circulaire', color: 'bg-orange-500' },
};
const CEMAC_COUNTRIES = [
    { code: 'CEMAC', name: 'CEMAC (Communautaire)' },
    { code: 'CM', name: 'Cameroun' },
    { code: 'CF', name: 'Centrafrique' },
    { code: 'CG', name: 'Congo' },
    { code: 'GA', name: 'Gabon' },
    { code: 'GQ', name: 'Guinée Équatoriale' },
    { code: 'TD', name: 'Tchad' },
];
export default function AdminLegislation() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [showViewModal, setShowViewModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [notice, setNotice] = useState(null);
    // Form state
    const [formData, setFormData] = useState({
        title: '',
        reference: '',
        type: 'law',
        category: '',
        country: 'CEMAC',
        publication_date: '',
        effective_date: '',
        summary: '',
        tags: '',
        status: 'draft',
    });
    const [selectedFile, setSelectedFile] = useState(null);
    useEffect(() => {
        loadDocuments();
    }, []);
    const loadDocuments = async () => {
        try {
            setLoading(true);
            const response = await authFetch('/api/legislation/');
            if (response.ok) {
                const data = await response.json();
                setDocuments(data);
            }
            else {
                const error = await response.json().catch(() => ({}));
                setNotice({
                    type: 'error',
                    text: error.detail || error.error || 'Impossible de charger les textes législatifs.',
                });
            }
            setLoading(false);
        }
        catch (error) {
            console.error('Erreur:', error);
            setNotice({ type: 'error', text: 'Impossible de charger les textes législatifs.' });
            setLoading(false);
        }
    };
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Vérifier le type de fichier
            const allowedTypes = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword',
                'text/plain',
            ];
            if (!allowedTypes.includes(file.type)) {
                setNotice({ type: 'error', text: 'Type de fichier non supporté. Utilisez PDF, Excel, Word ou TXT.' });
                return;
            }
            // Vérifier la taille (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setNotice({ type: 'error', text: 'Fichier trop volumineux (max 10MB).' });
                return;
            }
            setNotice(null);
            setSelectedFile(file);
        }
    };
    const handleCreateDocument = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setNotice({ type: 'error', text: 'Veuillez sélectionner un fichier.' });
            return;
        }
        setUploading(true);
        try {
            // Créer FormData pour l'upload
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('reference', formData.reference);
            formDataToSend.append('type', formData.type);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('country', formData.country);
            formDataToSend.append('publication_date', formData.publication_date);
            formDataToSend.append('effective_date', formData.effective_date);
            formDataToSend.append('summary', formData.summary);
            formDataToSend.append('status', formData.status);
            formDataToSend.append('tags', JSON.stringify(formData.tags.split(',').map(t => t.trim())));
            formDataToSend.append('file', selectedFile);
            const response = await authFetch('/api/legislation/', {
                method: 'POST',
                body: formDataToSend,
                // Ne pas définir Content-Type, laissez le browser le faire pour FormData
                headers: undefined,
            });
            if (response.ok) {
                const newDoc = await response.json();
                setDocuments([newDoc, ...documents]);
                // Lancer l'analyse IA automatiquement
                await analyzeDocument(newDoc.id);
                // Reset form
                setFormData({
                    title: '',
                    reference: '',
                    type: 'law',
                    category: '',
                    country: 'CEMAC',
                    publication_date: '',
                    effective_date: '',
                    summary: '',
                    tags: '',
                    status: 'draft',
                });
                setSelectedFile(null);
                setShowAddModal(false);
                setNotice({ type: 'success', text: 'Document créé et analyse IA lancée.' });
                loadDocuments(); // Recharger pour avoir l'analyse
            }
            else {
                const error = await response.json();
                setNotice({ type: 'error', text: error.detail || error.error || JSON.stringify(error) });
            }
        }
        catch (error) {
            console.error('Erreur création:', error);
            setNotice({ type: 'error', text: 'Erreur lors de la création du document.' });
        }
        finally {
            setUploading(false);
        }
    };
    const analyzeDocument = async (docId) => {
        setAnalyzing(true);
        try {
            const response = await authFetch(`/api/legislation/${docId}/analyze/`, {
                method: 'POST',
            });
            if (response.ok) {
                const analyzedDoc = await response.json();
                // Mettre à jour le document dans la liste
                setDocuments(docs => docs.map(doc => doc.id === docId ? analyzedDoc : doc));
                setNotice({ type: 'success', text: 'Analyse IA terminée.' });
                return true;
            }
            else {
                console.error('Erreur analyse IA');
                const error = await response.json().catch(() => ({}));
                setNotice({ type: 'error', text: error.detail || error.error || 'Erreur analyse IA.' });
                return false;
            }
        }
        catch (error) {
            console.error('Erreur:', error);
            setNotice({ type: 'error', text: 'Erreur analyse IA.' });
            return false;
        }
        finally {
            setAnalyzing(false);
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?'))
            return;
        try {
            const response = await authFetch(`/api/legislation/${id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setDocuments(documents.filter(d => d.id !== id));
                setNotice({ type: 'success', text: 'Document supprimé.' });
            }
            else {
                const error = await response.json().catch(() => ({}));
                setNotice({ type: 'error', text: error.detail || error.error || 'Suppression impossible.' });
            }
        }
        catch (error) {
            console.error('Erreur suppression:', error);
            setNotice({ type: 'error', text: 'Suppression impossible.' });
        }
    };
    const filteredDocs = documents.filter((doc) => {
        const matchSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.reference.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = selectedType === 'all' || doc.type === selectedType;
        return matchSearch && matchType;
    });
    const formatFileSize = (bytes) => {
        if (!bytes)
            return 'N/A';
        if (bytes < 1024)
            return bytes + ' B';
        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    const getFileIcon = (fileType) => {
        if (!fileType)
            return _jsx(FileText, { className: "w-5 h-5" });
        if (fileType.includes('pdf'))
            return _jsx(File, { className: "w-5 h-5 text-red-500" });
        if (fileType.includes('excel') || fileType.includes('spreadsheet'))
            return _jsx(FileSpreadsheet, { className: "w-5 h-5 text-green-500" });
        return _jsx(FileText, { className: "w-5 h-5" });
    };
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3", children: [_jsx(BookOpen, { className: "w-8 h-8 text-amber-600" }), "L\u00E9gislation CEMAC"] }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mt-2", children: "Gestion des textes l\u00E9gislatifs avec analyse IA" })] }), _jsxs("button", { onClick: () => setShowAddModal(true), className: "flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors", children: [_jsx(Plus, { className: "w-5 h-5" }), "Nouveau Document"] })] }), notice && (_jsxs("div", { className: `flex items-start gap-3 rounded-xl border px-4 py-3 ${notice.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'}`, children: [notice.type === 'success' ? (_jsx(CheckCircle, { className: "w-5 h-5 mt-0.5 flex-shrink-0" })) : (_jsx(AlertCircle, { className: "w-5 h-5 mt-0.5 flex-shrink-0" })), _jsx("p", { className: "text-sm font-medium", children: notice.text }), _jsx("button", { type: "button", onClick: () => setNotice(null), className: "ml-auto text-current opacity-70 hover:opacity-100", "aria-label": "Fermer le message", children: _jsx(X, { className: "w-4 h-4" }) })] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [_jsx("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Total" }), _jsx("p", { className: "text-3xl font-bold text-gray-900 dark:text-white mt-2", children: documents.length })] }), _jsx(FileText, { className: "w-12 h-12 text-blue-500" })] }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Actifs" }), _jsx("p", { className: "text-3xl font-bold text-green-600 mt-2", children: documents.filter((d) => d.status === 'active').length })] }), _jsx(CheckCircle, { className: "w-12 h-12 text-green-500" })] }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Analys\u00E9s IA" }), _jsx("p", { className: "text-3xl font-bold text-purple-600 mt-2", children: documents.filter((d) => d.ai_analysis).length })] }), _jsx(Sparkles, { className: "w-12 h-12 text-purple-500" })] }) })] }), _jsx("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Rechercher...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" })] }), _jsxs("select", { value: selectedType, onChange: (e) => setSelectedType(e.target.value), className: "px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white", children: [_jsx("option", { value: "all", children: "Tous les types" }), Object.entries(DOCUMENT_TYPES).map(([key, { label }]) => (_jsx("option", { value: key, children: label }, key)))] })] }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden", children: loading ? (_jsxs("div", { className: "p-12 text-center", children: [_jsx(Loader2, { className: "w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Chargement..." })] })) : filteredDocs.length === 0 ? (_jsxs("div", { className: "p-12 text-center", children: [_jsx(FileText, { className: "w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Aucun document trouv\u00E9" })] })) : (_jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 dark:bg-gray-900", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300", children: "Document" }), _jsx("th", { className: "px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300", children: "Type" }), _jsx("th", { className: "px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300", children: "Pays" }), _jsx("th", { className: "px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300", children: "Date" }), _jsx("th", { className: "px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300", children: "IA" }), _jsx("th", { className: "px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: filteredDocs.map((doc) => (_jsxs("tr", { className: "hover:bg-gray-50 dark:hover:bg-gray-700/50", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [getFileIcon(doc.file_type), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: doc.title }), _jsx("p", { className: "text-sm text-gray-500", children: doc.reference }), doc.file && (_jsx("p", { className: "text-xs text-gray-400", children: formatFileSize(doc.file_size) }))] })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `px-3 py-1 rounded-full text-xs font-semibold text-white ${DOCUMENT_TYPES[doc.type].color}`, children: DOCUMENT_TYPES[doc.type].label }) }), _jsx("td", { className: "px-6 py-4 text-gray-700 dark:text-gray-300", children: CEMAC_COUNTRIES.find(c => c.code === doc.country)?.name }), _jsx("td", { className: "px-6 py-4 text-gray-700 dark:text-gray-300", children: new Date(doc.publication_date).toLocaleDateString('fr-FR') }), _jsx("td", { className: "px-6 py-4", children: doc.ai_analysis ? (_jsxs("div", { className: "flex items-center gap-1 text-purple-600 dark:text-purple-400", children: [_jsx(Sparkles, { className: "w-4 h-4" }), _jsx("span", { className: "text-xs", children: "Analys\u00E9" })] })) : (_jsx("button", { onClick: () => analyzeDocument(doc.id), disabled: analyzing, className: "text-xs text-gray-500 hover:text-purple-600 disabled:opacity-50", children: "Analyser" })) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx("button", { onClick: () => {
                                                        setSelectedDoc(doc);
                                                        setShowViewModal(true);
                                                    }, className: "p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg", children: _jsx(Eye, { className: "w-4 h-4 text-blue-600" }) }), doc.file_url && (_jsx("a", { href: doc.file_url, download: true, className: "p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg", children: _jsx(Download, { className: "w-4 h-4 text-green-600" }) })), _jsx("button", { onClick: () => handleDelete(doc.id), className: "p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg", children: _jsx(Trash2, { className: "w-4 h-4 text-red-600" }) })] }) })] }, doc.id))) })] })) }), showViewModal && selectedDoc && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between sticky top-0 bg-white dark:bg-gray-800", children: [_jsx("h3", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "D\u00E9tails" }), _jsx("button", { onClick: () => setShowViewModal(false), className: "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-xl font-bold text-gray-900 dark:text-white", children: selectedDoc.title }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: selectedDoc.reference })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Type" }), _jsx("p", { className: "font-medium", children: DOCUMENT_TYPES[selectedDoc.type].label })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Pays" }), _jsx("p", { className: "font-medium", children: CEMAC_COUNTRIES.find(c => c.code === selectedDoc.country)?.name })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Publication" }), _jsx("p", { className: "font-medium", children: new Date(selectedDoc.publication_date).toLocaleDateString('fr-FR') })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Entr\u00E9e en vigueur" }), _jsx("p", { className: "font-medium", children: new Date(selectedDoc.effective_date).toLocaleDateString('fr-FR') })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-2", children: "R\u00E9sum\u00E9" }), _jsx("p", { className: "text-gray-900 dark:text-white", children: selectedDoc.summary })] }), selectedDoc.tags && selectedDoc.tags.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-2", children: "Tags" }), _jsx("div", { className: "flex flex-wrap gap-2", children: selectedDoc.tags.map((tag, i) => (_jsxs("span", { className: "px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm", children: ["#", tag] }, i))) })] })), selectedDoc.ai_analysis && (_jsxs("div", { className: "border-t border-gray-200 dark:border-gray-700 pt-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(Sparkles, { className: "w-6 h-6 text-purple-600" }), _jsx("h5", { className: "text-lg font-bold text-gray-900 dark:text-white", children: "Analyse IA" })] }), _jsxs("div", { className: "space-y-4 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg", children: [selectedDoc.ai_analysis.summary && (_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "R\u00E9sum\u00E9 IA" }), _jsx("p", { className: "text-gray-900 dark:text-white", children: selectedDoc.ai_analysis.summary })] })), selectedDoc.ai_analysis.key_points && selectedDoc.ai_analysis.key_points.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Points cl\u00E9s" }), _jsx("ul", { className: "list-disc list-inside space-y-1", children: selectedDoc.ai_analysis.key_points.map((point, i) => (_jsx("li", { className: "text-gray-900 dark:text-white text-sm", children: point }, i))) })] })), selectedDoc.ai_analysis.affected_sectors && (_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Secteurs concern\u00E9s" }), _jsx("p", { className: "text-gray-900 dark:text-white", children: selectedDoc.ai_analysis.affected_sectors.join(', ') })] }))] })] }))] })] }) })), showAddModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between sticky top-0 bg-white dark:bg-gray-800", children: [_jsx("h3", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Nouveau Document" }), _jsx("button", { onClick: () => setShowAddModal(false), className: "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("form", { onSubmit: handleCreateDocument, className: "p-6 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Titre *" }), _jsx("input", { type: "text", required: true, value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "R\u00E9f\u00E9rence *" }), _jsx("input", { type: "text", required: true, value: formData.reference, onChange: (e) => setFormData({ ...formData, reference: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Type *" }), _jsxs("select", { value: formData.type, onChange: (e) => setFormData({ ...formData, type: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white", children: [_jsx("option", { value: "law", children: "Loi" }), _jsx("option", { value: "regulation", children: "R\u00E8glement" }), _jsx("option", { value: "directive", children: "Directive" }), _jsx("option", { value: "circular", children: "Circulaire" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Cat\u00E9gorie *" }), _jsx("input", { type: "text", required: true, value: formData.category, onChange: (e) => setFormData({ ...formData, category: e.target.value }), placeholder: "Ex: Fiscalit\u00E9, Finance, Commerce...", className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Pays *" }), _jsx("select", { value: formData.country, onChange: (e) => setFormData({ ...formData, country: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white", children: CEMAC_COUNTRIES.map(country => (_jsx("option", { value: country.code, children: country.name }, country.code))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Date publication *" }), _jsx("input", { type: "date", required: true, value: formData.publication_date, onChange: (e) => setFormData({ ...formData, publication_date: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Entr\u00E9e en vigueur *" }), _jsx("input", { type: "date", required: true, value: formData.effective_date, onChange: (e) => setFormData({ ...formData, effective_date: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" })] }), _jsxs("div", { className: "col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "R\u00E9sum\u00E9" }), _jsx("textarea", { value: formData.summary, onChange: (e) => setFormData({ ...formData, summary: e.target.value }), rows: 3, className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none" })] }), _jsxs("div", { className: "col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Tags (s\u00E9par\u00E9s par des virgules)" }), _jsx("input", { type: "text", value: formData.tags, onChange: (e) => setFormData({ ...formData, tags: e.target.value }), placeholder: "fiscalit\u00E9, budget, 2025...", className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" })] }), _jsxs("div", { className: "col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Fichier (PDF, Excel, Word, TXT - max 10MB) *" }), _jsxs("div", { className: "border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6", children: [_jsx("input", { type: "file", accept: ".pdf,.xlsx,.xls,.docx,.doc,.txt", onChange: handleFileChange, className: "hidden", id: "file-upload" }), _jsxs("label", { htmlFor: "file-upload", className: "flex flex-col items-center cursor-pointer", children: [_jsx(Upload, { className: "w-12 h-12 text-gray-400 mb-2" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: selectedFile ? selectedFile.name : 'Cliquez pour sélectionner un fichier' }), selectedFile && (_jsx("p", { className: "text-xs text-gray-500 mt-1", children: formatFileSize(selectedFile.size) }))] })] }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-2", children: "Le document sera automatiquement analys\u00E9 par l'IA apr\u00E8s l'upload" })] })] }), _jsxs("div", { className: "flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700", children: [_jsx("button", { type: "button", onClick: () => setShowAddModal(false), className: "flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700", children: "Annuler" }), _jsx("button", { type: "submit", disabled: uploading || !selectedFile, className: "flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2", children: uploading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-5 h-5 animate-spin" }), "Upload en cours..."] })) : (_jsxs(_Fragment, { children: [_jsx(Upload, { className: "w-5 h-5" }), "Cr\u00E9er & Analyser"] })) })] })] })] }) }))] }));
}
