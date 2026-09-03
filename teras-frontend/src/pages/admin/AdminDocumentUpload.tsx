import React, { useState } from 'react';
import { authFetch } from '../../utils/authFetch';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  Search,
  Upload,
  User,
  X,
} from 'lucide-react';

interface QueuedFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const DOCUMENT_TYPES = [
  { value: 'national_id', label: "Pièce d'identité" },
  { value: 'residence_proof', label: 'Justificatif de domicile' },
  { value: 'bank_statement', label: 'Relevé bancaire' },
  { value: 'passport', label: 'Passeport' },
  { value: 'drivers_license', label: 'Permis de conduire' },
  { value: 'balance_sheet', label: 'Bilan comptable' },
  { value: 'business_registration', label: 'RCCM' },
  { value: 'other', label: 'Autre' },
];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function AdminDocumentUpload() {
  const [searchUser, setSearchUser] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [documentType, setDocumentType] = useState('bank_statement');
  const [adminNotes, setAdminNotes] = useState('');
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [globalError, setGlobalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await authFetch(`/api/scoring/admin/users/?search=${encodeURIComponent(query)}&page_size=5`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setSearchResults(Array.isArray(data) ? data : (data.users ?? data.results ?? []));
    } catch {
      setSearchResults([]);
    }
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return;
    const nextFiles = Array.from(incoming).map(file => ({
      file,
      status: 'pending' as const,
      progress: 0,
    }));
    setFiles(prev => [...prev, ...nextFiles]);
  };

  const handleUpload = async () => {
    if (!selectedUserId || files.length === 0) {
      setGlobalError('Sélectionne un utilisateur et au moins un fichier.');
      return;
    }

    setUploading(true);
    setGlobalError('');
    setSuccessMsg('');
    let uploadedCount = 0;

    for (let index = 0; index < files.length; index += 1) {
      const entry = files[index];
      if (entry.status === 'success') continue;

      setFiles(prev => prev.map((item, itemIndex) => (
        itemIndex === index ? { ...item, status: 'uploading', progress: 30, error: undefined } : item
      )));

      const formData = new FormData();
      formData.append('file', entry.file);
      formData.append('document_type', documentType);
      formData.append('admin_notes', adminNotes);
      formData.append('auto_approve', 'true');

      try {
        const res = await authFetch(`/api/scoring/admin/users/${selectedUserId}/upload-document/`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || JSON.stringify(data) || `Erreur ${res.status}`);

        uploadedCount += 1;
        setFiles(prev => prev.map((item, itemIndex) => (
          itemIndex === index ? { ...item, status: 'success', progress: 100, error: undefined } : item
        )));
      } catch (error: any) {
        setFiles(prev => prev.map((item, itemIndex) => (
          itemIndex === index ? { ...item, status: 'error', progress: 100, error: error?.message || 'Upload échoué' } : item
        )));
      }
    }

    setUploading(false);
    if (uploadedCount > 0) {
      setSuccessMsg(
        uploadedCount > 1
          ? `✅ ${uploadedCount} documents uploadés pour ${selectedUserName}.`
          : `✅ Document uploadé pour ${selectedUserName}.`
      );
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Upload className="w-8 h-8 text-cyan-600" />
          Upload Documents Utilisateurs
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Charge de vraies pièces au nom d’un utilisateur depuis l’interface admin.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{successMsg}</p>
          <button onClick={() => setSuccessMsg('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {globalError && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{globalError}</p>
          <button onClick={() => setGlobalError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Sélectionner un utilisateur
        </h3>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, ID..."
              value={searchUser}
              onChange={e => {
                setSearchUser(e.target.value);
                searchUsers(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {searchUser && searchResults.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
              {searchResults.map(user => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setSelectedUserName(user.first_name ? `${user.first_name} ${user.last_name}` : (user.username || user.email));
                    setSearchUser('');
                    setSearchResults([]);
                  }}
                  className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.first_name ? `${user.first_name} ${user.last_name}` : (user.username || user.email)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </button>
              ))}
            </div>
          )}

          {selectedUserId && (
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Utilisateur sélectionné</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {selectedUserName} (ID: {selectedUserId})
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedUserId(null);
                  setSelectedUserName('');
                }}
                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg"
              >
                <X className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Type de document</h3>
          <select
            value={documentType}
            onChange={e => setDocumentType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {DOCUMENT_TYPES.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notes admin</h3>
          <textarea
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            rows={4}
            placeholder="Ex: document fourni lors d’un contrôle manuel"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div
        className={`bg-white dark:bg-gray-800 p-8 rounded-xl border-2 border-dashed transition-colors ${
          isDragging ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDragging(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <div className="text-center">
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">Glissez-déposez vos fichiers ici</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">ou cliquez pour sélectionner</p>
          <label className="inline-flex items-center px-6 py-3 bg-cyan-600 text-white rounded-xl cursor-pointer hover:bg-cyan-700">
            <FileText className="w-5 h-5 mr-2" />
            Choisir des fichiers
            <input
              type="file"
              multiple
              onChange={e => addFiles(e.target.files)}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Formats acceptés: PDF, JPG, JPEG, PNG
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fichiers ({files.length})</h3>
          <div className="space-y-3">
            {files.map((entry, index) => (
              <div key={`${entry.file.name}-${index}`} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <FileText className="w-10 h-10 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{entry.file.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(entry.file.size)}</p>
                  {entry.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div className="bg-cyan-600 h-2 rounded-full transition-all duration-300" style={{ width: `${entry.progress}%` }} />
                      </div>
                    </div>
                  )}
                  {entry.error && <p className="text-xs text-red-500 mt-1">{entry.error}</p>}
                </div>
                <div className="flex-shrink-0">
                  {entry.status === 'pending' && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  )}
                  {entry.status === 'uploading' && <Loader2 className="w-6 h-6 text-cyan-600 animate-spin" />}
                  {entry.status === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
                  {entry.status === 'error' && <AlertCircle className="w-6 h-6 text-red-600" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-4">
        <button
          onClick={() => {
            setFiles([]);
            setAdminNotes('');
            setSuccessMsg('');
            setGlobalError('');
          }}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Réinitialiser
        </button>
        <button
          onClick={handleUpload}
          disabled={!selectedUserId || files.length === 0 || uploading}
          className="px-6 py-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          {uploading ? 'Upload...' : `Uploader (${files.length})`}
        </button>
      </div>
    </div>
  );
}
