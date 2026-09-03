import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  X,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

type PreviewMode = 'auth-fetch' | 'direct-url';
type PreviewKind = 'pdf' | 'image' | 'text' | 'office' | 'unknown';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  title?: string;
  fileName: string;
  sourceUrl?: string | null;
  mode?: PreviewMode;
  onClose: () => void;
  onDownload?: () => void;
}

const TEXT_EXTENSIONS = new Set(['txt', 'csv', 'json', 'md', 'log']);
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg']);
const OFFICE_EXTENSIONS = new Set(['xlsx', 'xls', 'docx', 'doc', 'ppt', 'pptx']);

function getExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

function getPreviewKind(fileName: string): PreviewKind {
  const ext = getExtension(fileName);
  if (ext === 'pdf') return 'pdf';
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (TEXT_EXTENSIONS.has(ext)) return 'text';
  if (OFFICE_EXTENSIONS.has(ext)) return 'office';
  return 'unknown';
}

function getFallbackIcon(kind: PreviewKind) {
  if (kind === 'image') return ImageIcon;
  if (kind === 'office') return FileSpreadsheet;
  return FileText;
}

export default function DocumentPreviewModal({
  isOpen,
  title,
  fileName,
  sourceUrl,
  mode = 'auth-fetch',
  onClose,
  onDownload,
}: DocumentPreviewModalProps) {
  const previewKind = useMemo(() => getPreviewKind(fileName), [fileName]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blobUrl, setBlobUrl] = useState('');
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;

    setError('');
    setTextContent('');
    setBlobUrl(previous => {
      if (previous) URL.revokeObjectURL(previous);
      return '';
    });

    if (!sourceUrl) {
      setError('Aucune source de document disponible pour la prévisualisation.');
      return undefined;
    }

    const useDirectUrl = mode === 'direct-url' && (previewKind === 'pdf' || previewKind === 'image');
    const shouldFetchContent =
      mode === 'auth-fetch' && (previewKind === 'pdf' || previewKind === 'image' || previewKind === 'text');

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

        if (!isActive) return;

        if (previewKind === 'text') {
          const content = await response.text();
          if (isActive) setTextContent(content);
          return;
        }

        if (previewKind === 'pdf' || previewKind === 'image') {
          const blob = await response.blob();
          if (!isActive) return;
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch (err) {
        if (!isActive) return;
        setError(
          err instanceof Error
            ? `Prévisualisation indisponible: ${err.message}`
            : 'Prévisualisation indisponible pour ce document.'
        );
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadPreview();

    return () => {
      isActive = false;
    };
  }, [fileName, isOpen, mode, previewKind, sourceUrl]);

  useEffect(() => () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  }, [blobUrl]);

  if (!isOpen) return null;

  const directPreviewUrl = mode === 'direct-url' ? sourceUrl || '' : '';
  const previewUrl = blobUrl || directPreviewUrl;
  const FallbackIcon = getFallbackIcon(previewKind);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center"
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-6xl h-[88vh] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-slate-400 text-xs uppercase tracking-[0.18em]">
              Previsualisation
            </p>
            <h2 className="text-white text-lg font-semibold truncate">
              {title || fileName}
            </h2>
            {title && (
              <p className="text-slate-500 text-xs mt-0.5 truncate">{fileName}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onDownload && (
              <button
                onClick={onDownload}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm transition"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              aria-label="Fermer la prévisualisation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-900">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
              <p className="text-sm">Chargement du document...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
              <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
              <p className="text-white font-medium mb-2">Prévisualisation indisponible</p>
              <p className="text-slate-400 text-sm max-w-xl">{error}</p>
            </div>
          ) : previewKind === 'pdf' && previewUrl ? (
            <iframe
              title={fileName}
              src={previewUrl}
              className="w-full h-full bg-slate-950"
            />
          ) : previewKind === 'image' && previewUrl ? (
            <div className="h-full overflow-auto flex items-start justify-center p-6">
              <img
                src={previewUrl}
                alt={fileName}
                className="max-w-full rounded-xl border border-slate-800 bg-slate-950 shadow-lg"
              />
            </div>
          ) : previewKind === 'text' ? (
            <div className="h-full overflow-auto p-6">
              <pre className="whitespace-pre-wrap break-words text-sm text-slate-200 font-mono leading-6">
                {textContent || 'Ce document texte est vide.'}
              </pre>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
              <div className="w-20 h-20 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                <FallbackIcon className="w-9 h-9 text-slate-300" />
              </div>
              <p className="text-white font-medium mb-2">Prévisualisation limitée dans le navigateur</p>
              <p className="text-slate-400 text-sm max-w-xl mb-5">
                Ce format n&apos;est pas rendu proprement dans l&apos;app pour le moment.
                Vous pouvez quand même télécharger le fichier pour l&apos;ouvrir localement.
              </p>
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/15 border border-sky-500/25 hover:bg-sky-500/20 text-sky-300 text-sm transition"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le document
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5" />
            <span>
              {previewKind === 'office'
                ? 'Fallback actif pour les formats Office'
                : previewKind === 'unknown'
                  ? 'Format non optimisé pour la prévisualisation'
                  : 'Prévisualisation intégrée active'}
            </span>
          </div>
          <span>{getExtension(fileName).toUpperCase() || 'FICHIER'}</span>
        </div>
      </div>
    </div>
  );
}
