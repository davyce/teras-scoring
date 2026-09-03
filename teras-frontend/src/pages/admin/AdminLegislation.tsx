/**
 * AdminLegislation.tsx - Gestion Législation CEMAC avec IA
 * VERSION COMPLÈTE avec upload fichiers + analyse Claude Sonnet 4
 */

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  X,
  Upload,
  Sparkles,
  Loader2,
  AlertCircle,
  File,
  FileSpreadsheet,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

interface LegislationDocument {
  id: number;
  title: string;
  reference: string;
  type: 'law' | 'regulation' | 'directive' | 'circular';
  category: string;
  country: string;
  publication_date: string;
  effective_date: string;
  status: 'active' | 'archived' | 'draft';
  summary: string;
  tags: string[];
  file?: string;
  file_url?: string;
  file_size?: number;
  file_type?: string;
  ai_analysis?: any;
  ai_analyzed_at?: string;
  created_by_name?: string;
  created_at: string;
}

type Notice = { type: 'success' | 'error'; text: string };

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
  const [documents, setDocuments] = useState<LegislationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<LegislationDocument | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      } else {
        const error = await response.json().catch(() => ({}));
        setNotice({
          type: 'error',
          text: error.detail || error.error || 'Impossible de charger les textes législatifs.',
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setNotice({ type: 'error', text: 'Impossible de charger les textes législatifs.' });
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleCreateDocument = async (e: React.FormEvent) => {
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
      } else {
        const error = await response.json();
        setNotice({ type: 'error', text: error.detail || error.error || JSON.stringify(error) });
      }
    } catch (error) {
      console.error('Erreur création:', error);
      setNotice({ type: 'error', text: 'Erreur lors de la création du document.' });
    } finally {
      setUploading(false);
    }
  };

  const analyzeDocument = async (docId: number) => {
    setAnalyzing(true);
    
    try {
      const response = await authFetch(`/api/legislation/${docId}/analyze/`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const analyzedDoc = await response.json();
        
        // Mettre à jour le document dans la liste
        setDocuments(docs => 
          docs.map(doc => doc.id === docId ? analyzedDoc : doc)
        );
        
        setNotice({ type: 'success', text: 'Analyse IA terminée.' });
        return true;
      } else {
        console.error('Erreur analyse IA');
        const error = await response.json().catch(() => ({}));
        setNotice({ type: 'error', text: error.detail || error.error || 'Erreur analyse IA.' });
        return false;
      }
    } catch (error) {
      console.error('Erreur:', error);
      setNotice({ type: 'error', text: 'Erreur analyse IA.' });
      return false;
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
    
    try {
      const response = await authFetch(`/api/legislation/${id}/`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setDocuments(documents.filter(d => d.id !== id));
        setNotice({ type: 'success', text: 'Document supprimé.' });
      } else {
        const error = await response.json().catch(() => ({}));
        setNotice({ type: 'error', text: error.detail || error.error || 'Suppression impossible.' });
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      setNotice({ type: 'error', text: 'Suppression impossible.' });
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = selectedType === 'all' || doc.type === selectedType;
    return matchSearch && matchType;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileText className="w-5 h-5" />;
    if (fileType.includes('pdf')) return <File className="w-5 h-5 text-red-500" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) 
      return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-amber-600" />
            Législation CEMAC
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestion des textes législatifs avec analyse IA
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau Document
        </button>
      </div>

      {notice && (
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
            notice.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{notice.text}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="ml-auto text-current opacity-70 hover:opacity-100"
            aria-label="Fermer le message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{documents.length}</p>
            </div>
            <FileText className="w-12 h-12 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Actifs</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {documents.filter((d) => d.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Analysés IA</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {documents.filter((d) => d.ai_analysis).length}
              </p>
            </div>
            <Sparkles className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tous les types</option>
            {Object.entries(DOCUMENT_TYPES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucun document trouvé</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Document</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Pays</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">IA</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.file_type)}
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{doc.title}</p>
                        <p className="text-sm text-gray-500">{doc.reference}</p>
                        {doc.file && (
                          <p className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${DOCUMENT_TYPES[doc.type].color}`}>
                      {DOCUMENT_TYPES[doc.type].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {CEMAC_COUNTRIES.find(c => c.code === doc.country)?.name}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {new Date(doc.publication_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    {doc.ai_analysis ? (
                      <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs">Analysé</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => analyzeDocument(doc.id)}
                        disabled={analyzing}
                        className="text-xs text-gray-500 hover:text-purple-600 disabled:opacity-50"
                      >
                        Analyser
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedDoc(doc);
                          setShowViewModal(true);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                      {doc.file_url && (
                        <a
                          href={doc.file_url}
                          download
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                        >
                          <Download className="w-4 h-4 text-green-600" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Vue avec Analyse IA */}
      {showViewModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Détails</h3>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">{selectedDoc.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedDoc.reference}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                  <p className="font-medium">{DOCUMENT_TYPES[selectedDoc.type].label}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pays</p>
                  <p className="font-medium">{CEMAC_COUNTRIES.find(c => c.code === selectedDoc.country)?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Publication</p>
                  <p className="font-medium">{new Date(selectedDoc.publication_date).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Entrée en vigueur</p>
                  <p className="font-medium">{new Date(selectedDoc.effective_date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Résumé</p>
                <p className="text-gray-900 dark:text-white">{selectedDoc.summary}</p>
              </div>
              
              {selectedDoc.tags && selectedDoc.tags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDoc.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Analyse IA */}
              {selectedDoc.ai_analysis && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    <h5 className="text-lg font-bold text-gray-900 dark:text-white">Analyse IA</h5>
                  </div>
                  
                  <div className="space-y-4 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    {selectedDoc.ai_analysis.summary && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Résumé IA</p>
                        <p className="text-gray-900 dark:text-white">{selectedDoc.ai_analysis.summary}</p>
                      </div>
                    )}
                    
                    {selectedDoc.ai_analysis.key_points && selectedDoc.ai_analysis.key_points.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Points clés</p>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedDoc.ai_analysis.key_points.map((point: string, i: number) => (
                            <li key={i} className="text-gray-900 dark:text-white text-sm">{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedDoc.ai_analysis.affected_sectors && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secteurs concernés</p>
                        <p className="text-gray-900 dark:text-white">{selectedDoc.ai_analysis.affected_sectors.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajout avec Upload */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau Document</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateDocument} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Titre *
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Référence *
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type *
                  </label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="law">Loi</option>
                    <option value="regulation">Règlement</option>
                    <option value="directive">Directive</option>
                    <option value="circular">Circulaire</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Catégorie *
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="Ex: Fiscalité, Finance, Commerce..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pays *
                  </label>
                  <select 
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {CEMAC_COUNTRIES.map(country => (
                      <option key={country.code} value={country.code}>{country.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date publication *
                  </label>
                  <input 
                    type="date" 
                    required
                    value={formData.publication_date}
                    onChange={(e) => setFormData({...formData, publication_date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Entrée en vigueur *
                  </label>
                  <input 
                    type="date" 
                    required
                    value={formData.effective_date}
                    onChange={(e) => setFormData({...formData, effective_date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Résumé
                  </label>
                  <textarea 
                    value={formData.summary}
                    onChange={(e) => setFormData({...formData, summary: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none" 
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags (séparés par des virgules)
                  </label>
                  <input 
                    type="text" 
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    placeholder="fiscalité, budget, 2025..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fichier (PDF, Excel, Word, TXT - max 10MB) *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                    <input
                      type="file"
                      accept=".pdf,.xlsx,.xls,.docx,.doc,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedFile ? selectedFile.name : 'Cliquez pour sélectionner un fichier'}
                      </p>
                      {selectedFile && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      )}
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Le document sera automatiquement analysé par l'IA après l'upload
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Créer & Analyser
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
