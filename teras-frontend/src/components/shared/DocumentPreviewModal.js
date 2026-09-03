import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Download, Eye, FileSpreadsheet, FileText, Image as ImageIcon, Loader2, X, } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
const TEXT_EXTENSIONS = new Set(['txt', 'csv', 'json', 'md', 'log']);
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg']);
const OFFICE_EXTENSIONS = new Set(['xlsx', 'xls', 'docx', 'doc', 'ppt', 'pptx']);
function getExtension(fileName) {
    return fileName.split('.').pop()?.toLowerCase() || '';
}
function getPreviewKind(fileName) {
    const ext = getExtension(fileName);
    if (ext === 'pdf')
        return 'pdf';
    if (IMAGE_EXTENSIONS.has(ext))
        return 'image';
    if (TEXT_EXTENSIONS.has(ext))
        return 'text';
    if (OFFICE_EXTENSIONS.has(ext))
        return 'office';
    return 'unknown';
}
function getFallbackIcon(kind) {
    if (kind === 'image')
        return ImageIcon;
    if (kind === 'office')
        return FileSpreadsheet;
    return FileText;
}
export default function DocumentPreviewModal({ isOpen, title, fileName, sourceUrl, mode = 'auth-fetch', onClose, onDownload, }) {
    const previewKind = useMemo(() => getPreviewKind(fileName), [fileName]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [blobUrl, setBlobUrl] = useState('');
    const [textContent, setTextContent] = useState('');
    useEffect(() => {
        if (!isOpen)
            return undefined;
        setError('');
        setTextContent('');
        setBlobUrl(previous => {
            if (previous)
                URL.revokeObjectURL(previous);
            return '';
        });
        if (!sourceUrl) {
            setError('Aucune source de document disponible pour la prévisualisation.');
            return undefined;
        }
        const useDirectUrl = mode === 'direct-url' && (previewKind === 'pdf' || previewKind === 'image');
        const shouldFetchContent = mode === 'auth-fetch' && (previewKind === 'pdf' || previewKind === 'image' || previewKind === 'text');
        if (!shouldFetchContent) {
            return undefined;
        }
        let isActive = true;
        const loadPreview = async () => {
            setLoading(true);
            try {
                const response = mode === 'auth-fetch'
                    ? await authFetch(sourceUrl)
                    : await fetch(sourceUrl);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                if (!isActive)
                    return;
                if (previewKind === 'text') {
                    const content = await response.text();
                    if (isActive)
                        setTextContent(content);
                    return;
                }
                if (previewKind === 'pdf' || previewKind === 'image') {
                    const blob = await response.blob();
                    if (!isActive)
                        return;
                    const url = URL.createObjectURL(blob);
                    setBlobUrl(url);
                }
            }
            catch (err) {
                if (!isActive)
                    return;
                setError(err instanceof Error
                    ? `Prévisualisation indisponible: ${err.message}`
                    : 'Prévisualisation indisponible pour ce document.');
            }
            finally {
                if (isActive)
                    setLoading(false);
            }
        };
        loadPreview();
        return () => {
            isActive = false;
        };
    }, [fileName, isOpen, mode, previewKind, sourceUrl]);
    useEffect(() => () => {
        if (blobUrl)
            URL.revokeObjectURL(blobUrl);
    }, [blobUrl]);
    if (!isOpen)
        return null;
    const directPreviewUrl = mode === 'direct-url' ? sourceUrl || '' : '';
    const previewUrl = blobUrl || directPreviewUrl;
    const FallbackIcon = getFallbackIcon(previewKind);
    return (_jsx("div", { className: "fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center", onClick: event => {
            if (event.target === event.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: "w-full max-w-6xl h-[88vh] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col", children: [_jsxs("div", { className: "px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-slate-400 text-xs uppercase tracking-[0.18em]", children: "Previsualisation" }), _jsx("h2", { className: "text-white text-lg font-semibold truncate", children: title || fileName }), title && (_jsx("p", { className: "text-slate-500 text-xs mt-0.5 truncate", children: fileName }))] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [onDownload && (_jsxs("button", { onClick: onDownload, className: "inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm transition", children: [_jsx(Download, { className: "w-4 h-4" }), "T\u00E9l\u00E9charger"] })), _jsx("button", { onClick: onClose, className: "p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition", "aria-label": "Fermer la pr\u00E9visualisation", children: _jsx(X, { className: "w-5 h-5" }) })] })] }), _jsx("div", { className: "flex-1 bg-slate-900", children: loading ? (_jsxs("div", { className: "h-full flex flex-col items-center justify-center text-slate-300 gap-3", children: [_jsx(Loader2, { className: "w-8 h-8 animate-spin text-sky-400" }), _jsx("p", { className: "text-sm", children: "Chargement du document..." })] })) : error ? (_jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center px-8", children: [_jsx(AlertCircle, { className: "w-10 h-10 text-rose-400 mb-3" }), _jsx("p", { className: "text-white font-medium mb-2", children: "Pr\u00E9visualisation indisponible" }), _jsx("p", { className: "text-slate-400 text-sm max-w-xl", children: error })] })) : previewKind === 'pdf' && previewUrl ? (_jsx("iframe", { title: fileName, src: previewUrl, className: "w-full h-full bg-slate-950" })) : previewKind === 'image' && previewUrl ? (_jsx("div", { className: "h-full overflow-auto flex items-start justify-center p-6", children: _jsx("img", { src: previewUrl, alt: fileName, className: "max-w-full rounded-xl border border-slate-800 bg-slate-950 shadow-lg" }) })) : previewKind === 'text' ? (_jsx("div", { className: "h-full overflow-auto p-6", children: _jsx("pre", { className: "whitespace-pre-wrap break-words text-sm text-slate-200 font-mono leading-6", children: textContent || 'Ce document texte est vide.' }) })) : (_jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center px-8", children: [_jsx("div", { className: "w-20 h-20 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4", children: _jsx(FallbackIcon, { className: "w-9 h-9 text-slate-300" }) }), _jsx("p", { className: "text-white font-medium mb-2", children: "Pr\u00E9visualisation limit\u00E9e dans le navigateur" }), _jsx("p", { className: "text-slate-400 text-sm max-w-xl mb-5", children: "Ce format n'est pas rendu proprement dans l'app pour le moment. Vous pouvez quand m\u00EAme t\u00E9l\u00E9charger le fichier pour l'ouvrir localement." }), onDownload && (_jsxs("button", { onClick: onDownload, className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/15 border border-sky-500/25 hover:bg-sky-500/20 text-sky-300 text-sm transition", children: [_jsx(Download, { className: "w-4 h-4" }), "T\u00E9l\u00E9charger le document"] }))] })) }), _jsxs("div", { className: "px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Eye, { className: "w-3.5 h-3.5" }), _jsx("span", { children: previewKind === 'office'
                                        ? 'Fallback actif pour les formats Office'
                                        : previewKind === 'unknown'
                                            ? 'Format non optimisé pour la prévisualisation'
                                            : 'Prévisualisation intégrée active' })] }), _jsx("span", { children: getExtension(fileName).toUpperCase() || 'FICHIER' })] })] }) }));
}
