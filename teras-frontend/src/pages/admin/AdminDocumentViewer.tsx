import { authFetch } from '../../utils/authFetch';
/**
 * AdminDocumentViewer.tsx - Viewer de documents PDF
 * Affichage PDF avec analyse IA et actions administrateur
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Download,
  CheckCircle,
  X,
  AlertCircle,
  Eye,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface DocumentInfo {
  id: number;
  title: string;
  type: string;
  uploaded_by: string;
  uploaded_at: string;
  file_url: string;
  status: 'pending' | 'verified' | 'rejected';
  analysis?: {
    document_type: string;
    confidence: number;
    extracted_data: Record<string, any>;
    anomalies: string[];
  };
}

type Notice = { type: 'success' | 'error'; text: string };

function isPdf(url: string) {
  return url.toLowerCase().split('?')[0].endsWith('.pdf');
}

function isImage(url: string) {
  const clean = url.toLowerCase().split('?')[0];
  return clean.endsWith('.png') || clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.webp');
}

export default function AdminDocumentViewer() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch(`/api/scoring/admin/documents/${docId}/`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        setDocument(data.document ?? data);
      } catch (e: any) {
        console.error('Erreur doc:', e.message);
        setNotice({ type: 'error', text: e?.message || 'Impossible de charger le document.' });
      } finally {
        setLoading(false);
      }
    })();
  }, [docId]);

  const handleAnalyze = async () => {
    if (!document) return;
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
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || "Analyse documentaire impossible." });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Approuver ce document ?') || !document) return;
    try {
      const res = await authFetch(`/api/scoring/admin/documents/${document.id}/approve/`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDocument(prev => prev ? { ...prev, status: 'verified' } : null);
        setNotice({ type: 'success', text: 'Document approuvé.' });
      } else {
        setNotice({ type: 'error', text: data.error || data.detail || "Approbation impossible." });
      }
    } catch (e: any) {
      console.error(e);
      setNotice({ type: 'error', text: e?.message || "Approbation impossible." });
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setNotice({ type: 'error', text: 'Veuillez indiquer la raison du rejet.' });
      return;
    }
    if (!document) return;
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
      } else {
        setNotice({ type: 'error', text: data.error || data.detail || "Rejet impossible." });
      }
    } catch (e: any) {
      console.error(e);
      setNotice({ type: 'error', text: e?.message || "Rejet impossible." });
    }
  };

  const openFile = () => {
    if (document?.file_url) window.open(document.file_url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      
        <div className="p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      
    );
  }

  if (!document) {
    return (
      
        <div className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Document non trouvé</p>
        </div>
      
    );
  }

  return (
    
      <div className="p-6 space-y-6">
        
        {/* Header */}
        <div>
          <button
            onClick={() => navigate('/admin/validation')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à la validation
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Viewer de Document
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {document.title}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {document.status === 'pending' && (
                <span className="px-4 py-2 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-lg font-medium">
                  En attente
                </span>
              )}
              {document.status === 'verified' && (
                <span className="px-4 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-lg font-medium">
                  Vérifié
                </span>
              )}
              {document.status === 'rejected' && (
                <span className="px-4 py-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg font-medium">
                  Rejeté
                </span>
              )}
            </div>
          </div>
        </div>

        {notice && (
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
              notice.type === 'success'
                ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300'
                : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{notice.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PDF Viewer */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Aperçu du document</h3>
              <button
                onClick={openFile}
                disabled={!document.file_url}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </button>
            </div>
            <div className="bg-gray-100 dark:bg-gray-900 p-8 min-h-[600px] flex items-center justify-center">
              {document.file_url && isPdf(document.file_url) ? (
                <iframe
                  title={document.title}
                  src={document.file_url}
                  className="w-full h-[600px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white"
                />
              ) : document.file_url && isImage(document.file_url) ? (
                <img
                  src={document.file_url}
                  alt={document.title}
                  className="max-h-[600px] w-full object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-white"
                />
              ) : (
                <div className="text-center">
                  <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Prévisualisation indisponible pour ce format
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    {document.file_url || 'Aucun fichier lié'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Info & Actions */}
          <div className="space-y-6">
            
            {/* Informations */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Informations</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Type</p>
                  <p className="text-gray-900 dark:text-white font-medium">{document.type}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Uploadé par</p>
                  <p className="text-gray-900 dark:text-white font-medium">{document.uploaded_by}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Date</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {new Date(document.uploaded_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Analyse IA */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Analyse IA
                </h3>
                {!document.analysis && (
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {analyzing ? 'Analyse...' : 'Analyser'}
                  </button>
                )}
              </div>

              {analyzing && (
                <div className="text-center py-8">
                  <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Analyse en cours...
                  </p>
                </div>
              )}

              {document.analysis && !analyzing && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Type détecté</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {document.analysis.document_type}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Confiance: {(document.analysis.confidence * 100).toFixed(0)}%
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Données extraites</p>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg space-y-2 text-sm">
                      {Object.entries(document.analysis.extracted_data).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400 capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {document.analysis.anomalies.length > 0 && (
                    <div>
                      <p className="text-sm text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Anomalies détectées
                      </p>
                      <ul className="space-y-1 text-sm">
                        {document.analysis.anomalies.map((anomaly, i) => (
                          <li key={i} className="text-gray-700 dark:text-gray-300">• {anomaly}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {!document.analysis && !analyzing && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Aucune analyse disponible
                </p>
              )}
            </div>

            {/* Actions */}
            {document.status === 'pending' && (
              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approuver
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700"
                >
                  <X className="w-5 h-5" />
                  Rejeter
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Modal Rejet */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Raison du rejet
              </h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Expliquez pourquoi ce document est rejeté..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              ></textarea>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Rejeter
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    
  );
}
